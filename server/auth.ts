import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import { db, DEFAULT_USER_ID } from './db.ts';

export interface PrivateSession {
  token: string;
  username: string;
  displayName: string;
  createdAt: number;
  expiresAt: number;
  rememberMe: boolean;
}

export interface StoredAuthCredentials {
  initialized: boolean;
  username: string;
  displayName: string;
  salt: string;
  hash: string;
  recoveryClue?: string;
  updatedAt: number;
}

// In-memory active session store for private application
const SESSIONS = new Map<string, PrivateSession>();

const dataDir = path.resolve(process.cwd(), 'data');
const credentialsFile = path.join(dataDir, 'private_auth.json');

// Helper to hash password with salt using scrypt (Node crypto)
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Load credentials if initialized, otherwise returns null
export function getStoredCredentials(): StoredAuthCredentials | null {
  try {
    if (!fs.existsSync(credentialsFile)) {
      return null;
    }

    const raw = fs.readFileSync(credentialsFile, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.initialized === true && parsed.username && parsed.salt && parsed.hash) {
      return parsed as StoredAuthCredentials;
    }
  } catch (err) {
    console.error('Error reading stored credentials:', err);
  }

  return null;
}

// Check if private login has been initialized
export function isAuthInitialized(): boolean {
  return getStoredCredentials() !== null;
}

// Verify entered password against stored credentials
function verifyEnteredPassword(password: string, creds: StoredAuthCredentials): boolean {
  try {
    const candidateHash = hashPassword(password, creds.salt);
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    const storedBuf = Buffer.from(creds.hash, 'hex');

    if (candidateBuf.length !== storedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuf, storedBuf);
  } catch {
    return false;
  }
}

// GET /api/auth/status
// Check whether system is initialized and if a recovery clue is present
export function handleGetAuthStatus(req: Request, res: Response) {
  try {
    const creds = getStoredCredentials();
    const initialized = Boolean(creds && creds.initialized);
    const hasRecoveryClue = Boolean(creds?.recoveryClue && creds.recoveryClue.trim().length > 0);

    return res.json({
      success: true,
      initialized,
      hasRecoveryClue,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to inspect authentication status.',
    });
  }
}

// POST /api/auth/initialize
// First-run setup for the new owner
export function handleInitializeAuth(req: Request, res: Response) {
  try {
    if (isAuthInitialized()) {
      return res.status(400).json({
        success: false,
        error: 'Private login has already been initialized on this installation.',
      });
    }

    const { username, password, confirmPassword, displayName, recoveryClue, rememberMe } = req.body || {};

    const cleanUser = String(username || '').trim();
    if (!cleanUser || cleanUser.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters long.',
      });
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
      return res.status(400).json({
        success: false,
        error: 'Username may only contain alphanumeric characters, hyphens, underscores, or periods.',
      });
    }

    const cleanPassword = String(password || '');
    const cleanConfirm = String(confirmPassword || '');

    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    if (cleanPassword !== cleanConfirm) {
      return res.status(400).json({
        success: false,
        error: 'Password and confirmation do not match.',
      });
    }

    const cleanDisplayName = String(displayName || '').trim() || cleanUser;
    const cleanClue = String(recoveryClue || '').trim();

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(cleanPassword, salt);
    const now = Date.now();

    const newCreds: StoredAuthCredentials = {
      initialized: true,
      username: cleanUser,
      displayName: cleanDisplayName,
      salt,
      hash,
      recoveryClue: cleanClue,
      updatedAt: now,
    };

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(credentialsFile, JSON.stringify(newCreds, null, 2), 'utf-8');

    // Create active session token immediately for the new owner
    const token = crypto.randomBytes(32).toString('hex');
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = now + duration;

    const session: PrivateSession = {
      token,
      username: newCreds.username,
      displayName: newCreds.displayName,
      createdAt: now,
      expiresAt,
      rememberMe: Boolean(rememberMe),
    };

    SESSIONS.set(token, session);

    return res.json({
      success: true,
      sessionToken: token,
      user: {
        username: session.username,
        displayName: session.displayName,
      },
      rememberMe: session.rememberMe,
      expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize private login credentials.',
    });
  }
}

// POST /api/auth/login
export function handleLogin(req: Request, res: Response) {
  try {
    const creds = getStoredCredentials();
    if (!creds) {
      return res.status(400).json({
        success: false,
        error: 'Installation not initialized. Please complete first-run setup.',
      });
    }

    const { username, password, rememberMe } = req.body || {};

    if (!username || !password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    const trimmedUser = String(username).trim();
    const providedPass = String(password);

    // Exact username match (case-insensitive for convenience or exact case)
    const isUserValid = trimmedUser.toLowerCase() === creds.username.toLowerCase();
    const isPassValid = verifyEnteredPassword(providedPass, creds);

    if (!isUserValid || !isPassValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    // Create cryptographically secure random session token
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = now + duration;

    const session: PrivateSession = {
      token,
      username: creds.username,
      displayName: creds.displayName || creds.username,
      createdAt: now,
      expiresAt,
      rememberMe: Boolean(rememberMe),
    };

    SESSIONS.set(token, session);

    return res.json({
      success: true,
      sessionToken: token,
      user: {
        username: session.username,
        displayName: session.displayName,
      },
      rememberMe: session.rememberMe,
      expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
}

// GET /api/auth/session
export function handleGetSession(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'No active session token provided',
      });
    }

    const session = SESSIONS.get(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Session not found',
      });
    }

    // Check expiration
    if (Date.now() > session.expiresAt) {
      SESSIONS.delete(token);
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Session expired',
      });
    }

    return res.json({
      success: true,
      authenticated: true,
      user: {
        username: session.username,
        displayName: session.displayName,
      },
      rememberMe: session.rememberMe,
      expiresAt: session.expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Session verification failed.',
    });
  }
}

// GET /api/auth/recovery-clue
export function handleGetRecoveryClue(req: Request, res: Response) {
  try {
    const creds = getStoredCredentials();
    if (!creds || !creds.recoveryClue || !creds.recoveryClue.trim()) {
      return res.json({
        success: true,
        hasClue: false,
      });
    }

    return res.json({
      success: true,
      hasClue: true,
      clue: creds.recoveryClue.trim(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve recovery clue.',
    });
  }
}

// POST /api/auth/change-password
export function handleChangePassword(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: active session required.',
      });
    }

    const session = SESSIONS.get(token);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: session expired or invalid.',
      });
    }

    const creds = getStoredCredentials();
    if (!creds) {
      return res.status(400).json({
        success: false,
        error: 'Installation not initialized.',
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password, new password, and confirmation are required.',
      });
    }

    // Validate current password
    if (!verifyEnteredPassword(String(currentPassword), creds)) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect.',
      });
    }

    const newPassStr = String(newPassword);
    const confirmPassStr = String(confirmPassword);

    if (newPassStr !== confirmPassStr) {
      return res.status(400).json({
        success: false,
        error: 'New password and confirmation do not match.',
      });
    }

    if (newPassStr.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      });
    }

    // Create new salt and hash for new password
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassStr, newSalt);

    const updatedCreds: StoredAuthCredentials = {
      ...creds,
      salt: newSalt,
      hash: newHash,
      updatedAt: Date.now(),
    };

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(credentialsFile, JSON.stringify(updatedCreds, null, 2), 'utf-8');

    return res.json({
      success: true,
      message: 'Private password updated successfully. The new password is active.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update private password.',
    });
  }
}

// POST /api/auth/logout
export function handleLogout(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (token) {
      SESSIONS.delete(token);
    }
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Logout failed.',
    });
  }
}

// Authenticated Delete Account endpoint: permanently clears all learner data,
// models, evidence, attempts, sessions, messages, and custom records,
// restores a clean baseline unassessed state, invalidates all sessions,
// and deletes private credentials to allow fresh setup.
export function handleDeleteAccount(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: an active authenticated session is required to delete the account.',
      });
    }

    const session = SESSIONS.get(token);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: session is invalid or expired.',
      });
    }

    const userId = session.username || DEFAULT_USER_ID;
    const now = new Date().toISOString();

    // 1. Transactional cleanup of all learner-owned data
    db.exec('BEGIN TRANSACTION;');

    try {
      // Clear active learning context
      db.prepare('DELETE FROM active_learning_context WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear adaptive evidence
      db.prepare('DELETE FROM adaptive_evidence WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear question attempts
      db.prepare('DELETE FROM question_attempts WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear simulation attempts
      db.prepare('DELETE FROM simulation_attempts WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear reconstructions
      db.prepare('DELETE FROM reconstructions WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear mechanism evaluations and mechanism errors
      db.prepare(`
        DELETE FROM mechanism_errors 
        WHERE evaluation_id IN (
          SELECT id FROM mechanism_evaluations 
          WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ? OR user_id = ?)
          OR session_id IN (SELECT id FROM learning_sessions WHERE user_id = ? OR user_id = ?)
        )
      `).run(userId, DEFAULT_USER_ID, userId, DEFAULT_USER_ID);

      db.prepare(`
        DELETE FROM mechanism_evaluations 
        WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ? OR user_id = ?)
        OR session_id IN (SELECT id FROM learning_sessions WHERE user_id = ? OR user_id = ?)
      `).run(userId, DEFAULT_USER_ID, userId, DEFAULT_USER_ID);

      // Clear learning sessions
      db.prepare('DELETE FROM learning_sessions WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear chat messages and conversations
      db.prepare(`
        DELETE FROM chat_messages 
        WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = ? OR user_id = ?)
      `).run(userId, DEFAULT_USER_ID);
      db.prepare('DELETE FROM chat_conversations WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear custom mechanisms created by user, retaining canonical mechanism
      db.prepare('DELETE FROM mechanisms WHERE (user_id = ? OR user_id = ?) AND id != ?').run(userId, DEFAULT_USER_ID, 'mech_damped_oscillator');

      // Clear errors table
      db.prepare('DELETE FROM errors WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear user custom topics if any
      db.prepare("DELETE FROM topics WHERE id LIKE 'top_custom_%'").run();

      // Clear user_model
      db.prepare('DELETE FROM user_model WHERE user_id = ? OR user_id = ?').run(userId, DEFAULT_USER_ID);

      // Clear users table entry
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      if (userId !== DEFAULT_USER_ID) {
        db.prepare('DELETE FROM users WHERE id = ?').run(DEFAULT_USER_ID);
      }

      // Recreate baseline user identity
      db.prepare(`
        INSERT INTO users (id, name, created_at, updated_at)
        VALUES (?, 'BSc Physics Scholar', ?, ?)
      `).run(DEFAULT_USER_ID, now, now);

      // Re-seed default errors
      const insertError = db.prepare(`
        INSERT INTO errors (id, user_id, category, description, severity, frequency, first_seen, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const defaultErrors = [
        { id: 'err_assoc_causation', category: 'Causal Reasoning', description: 'Association → Causation Confounding', severity: 'high' },
        { id: 'err_directionality_inversion', category: 'Mechanism Reasoning', description: 'Directionality Inversion in Dynamic Flux Chains', severity: 'high' },
        { id: 'err_premature_closure', category: 'Physical Hypothesis Closure', description: 'Premature Closure on Prototype Matching', severity: 'medium' },
        { id: 'err_overanalysis_trap', category: 'Cognitive Efficiency', description: 'Overanalysis & Reluctance to Commit', severity: 'medium' },
        { id: 'err_missing_variable', category: 'Variable Accounting', description: 'Missing Compensatory Feedback or State Variable', severity: 'high' },
      ];
      for (const e of defaultErrors) {
        insertError.run(e.id, DEFAULT_USER_ID, e.category, e.description, e.severity, 0, now, now);
      }

      // Re-seed baseline unassessed user_model
      const initialReasoningProfile = JSON.stringify({
        first_principles_index: null,
        causal_precision: null,
        directionality_integrity: null,
        discriminator_acuity: null,
        exception_awareness: null,
        anti_overanalysis_score: null,
      });
      const initialTopicMastery = JSON.stringify({});
      const initialErrorProfile = JSON.stringify([]);
      const initialCalibration = JSON.stringify({
        brier_score: null,
        overconfidence_bias: null,
        underconfidence_bias: null,
        calibration_curve: [],
      });
      const initialCognitiveResource = JSON.stringify({
        average_time_per_decision_sec: null,
        unnecessary_tests_requested_rate: null,
        overanalysis_flags_count: 0,
        decision_commit_efficiency: 'Pending Assessment',
      });

      db.prepare(`
        INSERT INTO user_model (
          id, user_id, reasoning_profile, topic_mastery, error_profile,
          confidence_calibration, cognitive_resource_allocation, recommended_difficulty, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'model_' + DEFAULT_USER_ID,
        DEFAULT_USER_ID,
        initialReasoningProfile,
        initialTopicMastery,
        initialErrorProfile,
        initialCalibration,
        initialCognitiveResource,
        'Mechanistic',
        now
      );

      // Ensure canonical mechanism exists
      const mechCheck = db.prepare('SELECT id FROM mechanisms WHERE id = ?').get('mech_damped_oscillator');
      if (!mechCheck) {
        db.prepare(`
          INSERT INTO mechanisms (id, user_id, topic_id, title, user_explanation, canonical_mechanism, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'mech_damped_oscillator',
          DEFAULT_USER_ID,
          'top_damped_oscillator',
          'Damped Harmonic Oscillator & Phase-Space Energy Dissipation',
          'A damped harmonic oscillator consists of a mass m on a spring with constant k moving through a viscous fluid with resistance b. The motion is governed by m x\'\'(t) + b x\'(t) + k x(t) = 0. In the underdamped case, the amplitude decays exponentially while oscillating with a reduced angular frequency.',
          `FACT BASE:
- Mechanical oscillator governed by Newton's second law: m x''(t) + b x'(t) + k x(t) = 0.
- Natural undamped angular frequency: ω_0 = √(k/m). Damping factor: γ = b / (2m).
- Total instantaneous mechanical energy: E(t) = 1/2 m v² + 1/2 k x².

CAUSAL CHAIN:
1. Applied initial displacement x_0 stores potential energy U = 1/2 k x_0².
2. Restoring spring force F_spring = -k x accelerates mass m toward equilibrium.
3. Velocity v generates opposing viscous drag force F_drag = -b v (proportional to velocity at low Reynolds number).
4. Time derivative of mechanical energy is dE/dt = v (m a + k x) = -b v² ≤ 0, enforcing continuous irreversible dissipation into thermal energy.
5. In underdamped regime (γ < ω_0), the characteristic roots are r = -γ ± i ω_d, where ω_d = √(ω_0² - γ²).
6. Resulting motion: x(t) = A e^(-γ t) cos(ω_d t + φ).

DISCRIMINATOR:
- Viscous drag (F ∝ v): Exponential envelope decay x_peak ∝ e^(-γ t) with constant period T = 2π/ω_d.
- Coulomb dry friction (F = constant): Linear amplitude decay (equal decrement ΔA per cycle) with invariant undamped period.

EXCEPTION:
- Non-linear drag regime: At high velocities (Re >> 1), quadratic aerodynamic drag F_drag ∝ v² dominates, breaking linear superposition and exponential envelope decay.`,
          now,
          now
        );
      }

      db.exec('COMMIT;');
    } catch (dbErr) {
      db.exec('ROLLBACK;');
      console.error('Error during database account reset:', dbErr);
      throw dbErr;
    }

    // 2. Permanently delete the stored private credentials file
    if (fs.existsSync(credentialsFile)) {
      try {
        fs.unlinkSync(credentialsFile);
      } catch (unlinkErr) {
        console.error('Failed to unlink credentials file, overwriting with uninitialized state:', unlinkErr);
        fs.writeFileSync(credentialsFile, JSON.stringify({ initialized: false }), 'utf-8');
      }
    }

    // 3. Invalidate all active authenticated sessions
    SESSIONS.clear();

    return res.json({
      success: true,
      message: 'Private account permanently deleted. All learner history, models, conversations, and evidence cleared. Baseline state recreated.',
    });
  } catch (err: any) {
    console.error('Error in handleDeleteAccount:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete account and reset baseline state.',
    });
  }
}

export function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
  const customHeader = req.headers['x-session-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

export function getAuthenticatedUserId(req?: Request): string {
  if (req) {
    const token = extractSessionToken(req);
    if (token) {
      const session = SESSIONS.get(token);
      if (session && Date.now() <= session.expiresAt) {
        return session.username || 'user_physics_scholar';
      }
    }
  }
  const creds = getStoredCredentials();
  if (creds && creds.username) {
    return creds.username;
  }
  return 'user_physics_scholar';
}
