import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import { db, DEFAULT_USER_ID, isPostgres } from './db.ts';

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

// In-memory active session cache
const SESSIONS = new Map<string, PrivateSession>();
let cachedCredentials: StoredAuthCredentials | null = null;

const dataDir = path.resolve(process.cwd(), 'data');
const credentialsFile = path.join(dataDir, 'private_auth.json');

// Helper to hash password with salt using scrypt (Node crypto)
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Load credentials from PostgreSQL / SQLite or migration fallback
export async function getStoredCredentials(): Promise<StoredAuthCredentials | null> {
  if (cachedCredentials && cachedCredentials.initialized) {
    return cachedCredentials;
  }

  try {
    const row = await db.get<{
      id: string;
      initialized: boolean | number;
      username: string;
      display_name: string;
      salt: string;
      hash: string;
      recovery_clue: string | null;
      updated_at: number | string;
    }>('SELECT * FROM private_auth WHERE id = ?', 'current_private_auth');

    if (row && (row.initialized === true || row.initialized === 1) && row.username && row.salt && row.hash) {
      cachedCredentials = {
        initialized: true,
        username: row.username,
        displayName: row.display_name || row.username,
        salt: row.salt,
        hash: row.hash,
        recoveryClue: row.recovery_clue || undefined,
        updatedAt: Number(row.updated_at) || Date.now(),
      };
      return cachedCredentials;
    }

    // Local filesystem migration fallback if not Postgres
    if (!isPostgres && fs.existsSync(credentialsFile)) {
      const raw = fs.readFileSync(credentialsFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.initialized === true && parsed.username && parsed.salt && parsed.hash) {
        cachedCredentials = parsed as StoredAuthCredentials;
        // Sync into db table
        await saveCredentials(cachedCredentials);
        return cachedCredentials;
      }
    }
  } catch (err) {
    console.error('Error reading stored credentials:', err);
  }

  return null;
}

// Persist credentials to PostgreSQL / SQLite
export async function saveCredentials(creds: StoredAuthCredentials): Promise<void> {
  cachedCredentials = creds;

  await db.run(
    `INSERT INTO private_auth (id, initialized, username, display_name, salt, hash, recovery_clue, updated_at)
     VALUES ('current_private_auth', ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       initialized = ?,
       username = ?,
       display_name = ?,
       salt = ?,
       hash = ?,
       recovery_clue = ?,
       updated_at = ?`,
    creds.initialized,
    creds.username,
    creds.displayName,
    creds.salt,
    creds.hash,
    creds.recoveryClue || null,
    creds.updatedAt,
    creds.initialized,
    creds.username,
    creds.displayName,
    creds.salt,
    creds.hash,
    creds.recoveryClue || null,
    creds.updatedAt
  );

  // Sync to local filesystem if not Postgres
  if (!isPostgres) {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(credentialsFile, JSON.stringify(creds, null, 2), 'utf-8');
    } catch {}
  }
}

// Session lookup with multi-tier in-memory cache and persistent database
export async function getSessionByToken(token: string): Promise<PrivateSession | null> {
  if (!token) return null;

  // 1. Check in-memory cache
  const cached = SESSIONS.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      SESSIONS.delete(token);
      await db.run('DELETE FROM private_sessions WHERE token = ?', token);
      return null;
    }
    return cached;
  }

  // 2. Query persistent PostgreSQL / SQLite store
  try {
    const row = await db.get<{
      token: string;
      username: string;
      display_name: string;
      created_at: number | string;
      expires_at: number | string;
      remember_me: boolean | number;
    }>('SELECT * FROM private_sessions WHERE token = ?', token);

    if (row) {
      const expiresAt = Number(row.expires_at);
      if (Date.now() > expiresAt) {
        await db.run('DELETE FROM private_sessions WHERE token = ?', token);
        return null;
      }

      const session: PrivateSession = {
        token: row.token,
        username: row.username,
        displayName: row.display_name,
        createdAt: Number(row.created_at),
        expiresAt,
        rememberMe: Boolean(row.remember_me),
      };

      SESSIONS.set(token, session);
      return session;
    }
  } catch (err) {
    console.error('Error fetching persistent session:', err);
  }

  return null;
}

// Persist a session
export async function saveSession(session: PrivateSession): Promise<void> {
  SESSIONS.set(session.token, session);
  try {
    await db.run(
      `INSERT INTO private_sessions (token, username, display_name, created_at, expires_at, remember_me)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (token) DO UPDATE SET
         username = ?,
         display_name = ?,
         created_at = ?,
         expires_at = ?,
         remember_me = ?`,
      session.token,
      session.username,
      session.displayName,
      session.createdAt,
      session.expiresAt,
      session.rememberMe,
      session.username,
      session.displayName,
      session.createdAt,
      session.expiresAt,
      session.rememberMe
    );
  } catch (err) {
    console.error('Error persisting session to database:', err);
  }
}

// Invalidate a session
export async function deleteSession(token: string): Promise<void> {
  SESSIONS.delete(token);
  try {
    await db.run('DELETE FROM private_sessions WHERE token = ?', token);
  } catch (err) {
    console.error('Error deleting session from database:', err);
  }
}

// Check if private login has been initialized
export async function isAuthInitialized(): Promise<boolean> {
  const creds = await getStoredCredentials();
  return creds !== null && creds.initialized === true;
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
export async function handleGetAuthStatus(req: Request, res: Response) {
  try {
    const creds = await getStoredCredentials();
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
export async function handleInitializeAuth(req: Request, res: Response) {
  try {
    if (await isAuthInitialized()) {
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

    await saveCredentials(newCreds);

    // Ensure learner user row exists for the newly initialized user
    const isoNow = new Date().toISOString();
    await db.run(
      'INSERT INTO users (id, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET name = ?',
      cleanUser,
      cleanDisplayName,
      isoNow,
      isoNow,
      cleanDisplayName
    );

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

    await saveSession(session);

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
    console.error('Error during handleInitializeAuth:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize private login credentials.',
    });
  }
}

// POST /api/auth/login
export async function handleLogin(req: Request, res: Response) {
  try {
    const creds = await getStoredCredentials();
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

    const isUserValid = trimmedUser.toLowerCase() === creds.username.toLowerCase();
    const isPassValid = verifyEnteredPassword(providedPass, creds);

    if (!isUserValid || !isPassValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

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

    await saveSession(session);

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
export async function handleGetSession(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'No active session token provided',
      });
    }

    const session = await getSessionByToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Session not found or expired',
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
export async function handleGetRecoveryClue(req: Request, res: Response) {
  try {
    const creds = await getStoredCredentials();
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
export async function handleChangePassword(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: active session required.',
      });
    }

    const session = await getSessionByToken(token);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: session expired or invalid.',
      });
    }

    const creds = await getStoredCredentials();
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

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassStr, newSalt);

    const updatedCreds: StoredAuthCredentials = {
      ...creds,
      salt: newSalt,
      hash: newHash,
      updatedAt: Date.now(),
    };

    await saveCredentials(updatedCreds);

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
export async function handleLogout(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (token) {
      await deleteSession(token);
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
export async function handleDeleteAccount(req: Request, res: Response) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: an active authenticated session is required to delete the account.',
      });
    }

    const session = await getSessionByToken(token);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: session is invalid or expired.',
      });
    }

    const userId = session.username || DEFAULT_USER_ID;
    const now = new Date().toISOString();

    // 1. Transactional cleanup of all learner-owned data
    await db.transaction(async () => {
      // Clear active learning context
      await db.run('DELETE FROM active_learning_context WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear adaptive evidence
      await db.run('DELETE FROM adaptive_evidence WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear question attempts
      await db.run('DELETE FROM question_attempts WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear simulation attempts
      await db.run('DELETE FROM simulation_attempts WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear reconstructions
      await db.run('DELETE FROM reconstructions WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear mechanism evaluations and errors
      await db.run(
        `DELETE FROM mechanism_errors 
         WHERE evaluation_id IN (
           SELECT id FROM mechanism_evaluations 
           WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ? OR user_id = ?)
           OR session_id IN (SELECT id FROM learning_sessions WHERE user_id = ? OR user_id = ?)
         )`,
        userId, DEFAULT_USER_ID, userId, DEFAULT_USER_ID
      );

      await db.run(
        `DELETE FROM mechanism_evaluations 
         WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ? OR user_id = ?)
         OR session_id IN (SELECT id FROM learning_sessions WHERE user_id = ? OR user_id = ?)`,
        userId, DEFAULT_USER_ID, userId, DEFAULT_USER_ID
      );

      // Clear learning sessions
      await db.run('DELETE FROM learning_sessions WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear chat messages and conversations
      await db.run(
        `DELETE FROM chat_messages 
         WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = ? OR user_id = ?)`,
        userId, DEFAULT_USER_ID
      );
      await db.run('DELETE FROM chat_conversations WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear custom mechanisms created by user, retaining canonical mechanism
      await db.run('DELETE FROM mechanisms WHERE (user_id = ? OR user_id = ?) AND id != ?', userId, DEFAULT_USER_ID, 'mech_damped_oscillator');

      // Clear errors table
      await db.run('DELETE FROM errors WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear user custom topics if any
      await db.run("DELETE FROM topics WHERE id LIKE 'top_custom_%'");

      // Clear user_model
      await db.run('DELETE FROM user_model WHERE user_id = ? OR user_id = ?', userId, DEFAULT_USER_ID);

      // Clear users table entry
      await db.run('DELETE FROM users WHERE id = ?', userId);
      if (userId !== DEFAULT_USER_ID) {
        await db.run('DELETE FROM users WHERE id = ?', DEFAULT_USER_ID);
      }

      // Recreate baseline user identity
      await db.run(
        `INSERT INTO users (id, name, created_at, updated_at)
         VALUES (?, 'BSc Physics Scholar', ?, ?) ON CONFLICT (id) DO NOTHING`,
        DEFAULT_USER_ID, now, now
      );

      // Re-seed default errors
      const defaultErrors = [
        { id: 'err_assoc_causation', category: 'Causal Reasoning', description: 'Association → Causation Confounding', severity: 'high' },
        { id: 'err_directionality_inversion', category: 'Mechanism Reasoning', description: 'Directionality Inversion in Dynamic Flux Chains', severity: 'high' },
        { id: 'err_premature_closure', category: 'Physical Hypothesis Closure', description: 'Premature Closure on Prototype Matching', severity: 'medium' },
        { id: 'err_overanalysis_trap', category: 'Cognitive Efficiency', description: 'Overanalysis & Reluctance to Commit', severity: 'medium' },
        { id: 'err_missing_variable', category: 'Variable Accounting', description: 'Missing Compensatory Feedback or State Variable', severity: 'high' },
      ];
      for (const e of defaultErrors) {
        await db.run(
          `INSERT INTO errors (id, user_id, category, description, severity, frequency, first_seen, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
          e.id, DEFAULT_USER_ID, e.category, e.description, e.severity, 0, now, now
        );
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

      await db.run(
        `INSERT INTO user_model (
          id, user_id, reasoning_profile, topic_mastery, error_profile,
          confidence_calibration, cognitive_resource_allocation, recommended_difficulty, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
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

      // Re-seed canonical mechanism if needed
      const mechCheck = await db.get('SELECT id FROM mechanisms WHERE id = ?', 'mech_damped_oscillator');
      if (!mechCheck) {
        await db.run(
          `INSERT INTO mechanisms (id, user_id, topic_id, title, user_explanation, canonical_mechanism, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
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

      // Delete from private_auth and private_sessions
      await db.run('DELETE FROM private_auth WHERE id = ?', 'current_private_auth');
      await db.run('DELETE FROM private_sessions');
    });

    // Clear caches
    cachedCredentials = null;
    SESSIONS.clear();

    if (!isPostgres && fs.existsSync(credentialsFile)) {
      try {
        fs.unlinkSync(credentialsFile);
      } catch {
        fs.writeFileSync(credentialsFile, JSON.stringify({ initialized: false }), 'utf-8');
      }
    }

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

export async function getAuthenticatedUserId(req?: Request): Promise<string> {
  if (req) {
    const token = extractSessionToken(req);
    if (token) {
      const session = await getSessionByToken(token);
      if (session && Date.now() <= session.expiresAt) {
        return session.username || 'user_physics_scholar';
      }
    }
  }
  const creds = await getStoredCredentials();
  if (creds && creds.username) {
    return creds.username;
  }
  return 'user_physics_scholar';
}
