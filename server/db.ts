import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mechanism.db');
export const db = new DatabaseSync(dbPath);

// Initialize schema and tables
export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      name TEXT NOT NULL,
      chapter TEXT,
      description TEXT,
      FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT,
      mode TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS mechanisms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      user_explanation TEXT,
      canonical_mechanism TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mechanism_evaluations (
      id TEXT PRIMARY KEY,
      mechanism_id TEXT,
      session_id TEXT,
      causal_accuracy REAL NOT NULL,
      completeness REAL NOT NULL,
      directionality REAL NOT NULL,
      assumption_quality REAL NOT NULL,
      discriminator_quality REAL NOT NULL,
      exception_handling REAL NOT NULL,
      compression_quality REAL NOT NULL,
      alternative_mechanism_quality REAL NOT NULL,
      confidence REAL NOT NULL,
      overall_score REAL NOT NULL,
      evaluator_feedback TEXT NOT NULL,
      weakest_link TEXT,
      what_is_correct TEXT,
      attack_details TEXT,
      distinguishing_observation TEXT,
      repaired_model TEXT,
      compressed_mechanism TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(mechanism_id) REFERENCES mechanisms(id) ON DELETE CASCADE,
      FOREIGN KEY(session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS errors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      frequency INTEGER NOT NULL DEFAULT 1,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mechanism_errors (
      id TEXT PRIMARY KEY,
      evaluation_id TEXT NOT NULL,
      error_id TEXT NOT NULL,
      FOREIGN KEY(evaluation_id) REFERENCES mechanism_evaluations(id) ON DELETE CASCADE,
      FOREIGN KEY(error_id) REFERENCES errors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      reasoning_target TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      clinical_vignette TEXT,
      scenario_vignette TEXT,
      discriminator_note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS question_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      correct INTEGER NOT NULL,
      confidence INTEGER NOT NULL,
      reasoning TEXT,
      reasoning_error TEXT,
      time_taken INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      hidden_state TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      patient_presentation TEXT,
      system_presentation TEXT,
      available_investigations TEXT,
      available_decisions TEXT,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS simulation_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      simulation_id TEXT NOT NULL,
      hypotheses TEXT NOT NULL,
      evidence_used TEXT NOT NULL,
      decisions TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      model_update TEXT,
      unnecessary_investigations_count INTEGER DEFAULT 0,
      overanalyzed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reconstructions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      source_mechanism TEXT NOT NULL,
      user_reconstruction TEXT NOT NULL,
      evaluation TEXT NOT NULL,
      score REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_model (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      reasoning_profile TEXT NOT NULL,
      topic_mastery TEXT NOT NULL,
      error_profile TEXT NOT NULL,
      confidence_calibration TEXT NOT NULL,
      cognitive_resource_allocation TEXT NOT NULL,
      recommended_difficulty TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      classification TEXT,
      metadata TEXT,
      attachments TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS adaptive_evidence (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      feature TEXT NOT NULL,
      topic_id TEXT,
      error_id TEXT,
      correct_answer INTEGER,
      correct_reasoning INTEGER,
      robust_mechanism INTEGER,
      transferable_mastery INTEGER,
      confidence INTEGER,
      time_taken_sec REAL,
      discriminator_identified INTEGER,
      reconstruction_score REAL,
      evidence_strength REAL NOT NULL,
      evidence_summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE SET NULL,
      FOREIGN KEY(error_id) REFERENCES errors(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_user ON adaptive_evidence(user_id);
    CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_error ON adaptive_evidence(error_id);
    CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_feature ON adaptive_evidence(feature);
    CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_topic ON adaptive_evidence(topic_id);
    CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_created ON adaptive_evidence(created_at);
  `);

  // Ensure attachments column exists for existing databases
  try {
    db.exec('ALTER TABLE chat_messages ADD COLUMN attachments TEXT;');
  } catch (_e) {
    // Column already exists
  }

  // Ensure learning_context column exists for existing conversations
  try {
    db.exec('ALTER TABLE chat_conversations ADD COLUMN learning_context TEXT;');
  } catch (_e) {
    // Column already exists
  }

  // Authoritative active learning context state store
  db.exec(`
    CREATE TABLE IF NOT EXISTS active_learning_context (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      topic_id TEXT,
      topic_name TEXT NOT NULL,
      subject_id TEXT,
      conversation_id TEXT,
      conversation_title TEXT,
      summary TEXT,
      detected_gaps TEXT,
      key_concepts TEXT,
      unresolved_questions TEXT,
      has_attachments INTEGER DEFAULT 0,
      attachment_names TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  // Safe column migrations for existing SQLite database
  try { db.prepare("ALTER TABLE questions ADD COLUMN scenario_vignette TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE questions ADD COLUMN clinical_vignette TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE simulations ADD COLUMN system_presentation TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE simulations ADD COLUMN patient_presentation TEXT").run(); } catch {}

  seedInitialData();
}

export const DEFAULT_USER_ID = 'user_physics_scholar';

function seedInitialData() {
  // Ensure default user and non-destructively migrate any legacy user_mbbs_scholar records
  const legacyUserCheck = db.prepare('SELECT id FROM users WHERE id = ?').get('user_mbbs_scholar');
  if (legacyUserCheck) {
    try {
      db.prepare(`INSERT OR IGNORE INTO users (id, name, created_at, updated_at) VALUES (?, 'BSc Physics Scholar', ?, ?)`).run(DEFAULT_USER_ID, new Date().toISOString(), new Date().toISOString());
      db.prepare(`UPDATE OR IGNORE learning_sessions SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE mechanisms SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE errors SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE question_attempts SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE user_model SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE active_learning_context SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE chat_conversations SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE adaptive_evidence SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE simulation_attempts SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`UPDATE OR IGNORE reconstructions SET user_id = ? WHERE user_id = 'user_mbbs_scholar'`).run(DEFAULT_USER_ID);
      db.prepare(`DELETE FROM users WHERE id = 'user_mbbs_scholar'`).run();
    } catch (migErr) {
      console.warn('Non-destructive user migration notice:', migErr);
    }
  }

  const userCheck = db.prepare('SELECT id FROM users WHERE id = ?').get(DEFAULT_USER_ID);
  const now = new Date().toISOString();

  if (!userCheck) {
    db.prepare(`
      INSERT INTO users (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(DEFAULT_USER_ID, 'BSc Physics Scholar', now, now);
  } else {
    db.prepare(`UPDATE users SET name = 'BSc Physics Scholar' WHERE id = ?`).run(DEFAULT_USER_ID);
  }

  // Clean up legacy medical subjects/topics/conversations/evidence if present
  try {
    db.prepare("DELETE FROM questions WHERE id LIKE 'q_%' OR topic_id LIKE 'top_sa%' OR topic_id LIKE 'top_edema%' OR topic_id LIKE 'top_preload%' OR topic_id LIKE 'top_hypovent%' OR topic_id LIKE 'top_eca%' OR topic_id LIKE 'top_raas%'").run();
    db.prepare("DELETE FROM mechanisms WHERE topic_id LIKE 'top_sa%' OR topic_id LIKE 'top_edema%'").run();
    db.prepare("DELETE FROM simulations WHERE topic_id LIKE 'top_edema%' OR id LIKE 'sim_edema%'").run();
    db.prepare("DELETE FROM topics WHERE subject_id IN ('sub_physio', 'sub_patho', 'sub_pharma', 'sub_anat', 'sub_biochem', 'sub_med')").run();
    db.prepare("DELETE FROM subjects WHERE id IN ('sub_physio', 'sub_patho', 'sub_pharma', 'sub_anat', 'sub_biochem', 'sub_med')").run();

    // Clean any legacy medical chat conversations & messages
    db.prepare(`
      DELETE FROM chat_messages 
      WHERE conversation_id IN (
        SELECT id FROM chat_conversations 
        WHERE title LIKE '%SA node%' OR title LIKE '%hyperkalemia%' OR title LIKE '%edema%' OR title LIKE '%pittin%' OR topic_id LIKE 'top_sa%' OR topic_id LIKE 'top_edema%'
      )
    `).run();
    db.prepare(`
      DELETE FROM chat_conversations 
      WHERE title LIKE '%SA node%' OR title LIKE '%hyperkalemia%' OR title LIKE '%edema%' OR title LIKE '%pittin%' OR topic_id LIKE 'top_sa%' OR topic_id LIKE 'top_edema%'
    `).run();
    db.prepare(`DELETE FROM chat_messages WHERE conversation_id NOT IN (SELECT id FROM chat_conversations)`).run();

    // Clean any legacy medical adaptive evidence records
    db.prepare(`
      DELETE FROM adaptive_evidence 
      WHERE evidence_summary LIKE '%Edema%' OR evidence_summary LIKE '%Starling%' OR evidence_summary LIKE '%SA node%' OR evidence_summary LIKE '%hyperkalemia%'
    `).run();

    // Normalize user_model id
    db.prepare("UPDATE user_model SET id = 'model_' || user_id WHERE id = 'model_user_mbbs_scholar'").run();
  } catch (cleanErr) {
    console.warn('Database legacy cleanup notice:', cleanErr);
  }

  // Seed default reasoning errors if empty
  const countErrors = db.prepare('SELECT count(*) as count FROM errors').get() as { count: number };
  if (countErrors.count === 0) {
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
  }

  // Seed subjects if empty
  const countSubjects = db.prepare('SELECT count(*) as count FROM subjects').get() as { count: number };
  if (countSubjects.count === 0) {
    const insertSubject = db.prepare('INSERT INTO subjects (id, name, code, icon) VALUES (?, ?, ?, ?)');
    insertSubject.run('sub_physics', 'Classical Mechanics & Dynamics', 'MECH', 'Activity');
    insertSubject.run('sub_em', 'Electrodynamics & Field Theory', 'EM', 'Zap');
    insertSubject.run('sub_thermo', 'Thermal & Statistical Physics', 'THERMO', 'Flame');
    insertSubject.run('sub_quantum', 'Quantum Mechanics & Modern Physics', 'QUANT', 'Target');
  }

  // Seed topics if empty
  const countTopics = db.prepare('SELECT count(*) as count FROM topics').get() as { count: number };
  if (countTopics.count === 0) {
    const insertTopic = db.prepare('INSERT INTO topics (id, subject_id, name, chapter, description) VALUES (?, ?, ?, ?, ?)');

    insertTopic.run(
      'top_damped_oscillator',
      'sub_physics',
      'Damped & Driven Harmonic Oscillators',
      'Oscillations & Waves',
      'Differential equations of damped motion, underdamped vs critically damped response, quality factor Q, and resonance phase lag.'
    );

    insertTopic.run(
      'top_gyroscopic_precession',
      'sub_physics',
      'Angular Momentum & Gyroscopic Precession',
      'Rigid Body Dynamics',
      'Torque coupling to angular momentum vectors (dL/dt = τ), precession frequency Ω_p = τ/L, and nutation transients.'
    );

    insertTopic.run(
      'top_lenz_induction',
      'sub_em',
      'Lenz\'s Law & Electromagnetic Induction',
      'Electrodynamics',
      'Faraday law of induction (EMF = -dΦ/dt), eddy current magnetic braking force, and Lenz sign directionality.'
    );

    insertTopic.run(
      'top_carnot_entropy',
      'sub_thermo',
      'Carnot Cycles, Entropy & Second Law',
      'Thermodynamics',
      'Reversible heat engine efficiency η = 1 - T_C/T_H, Clausius inequality ∮ dQ/T ≤ 0, and non-decreasing entropy in isolated systems.'
    );

    insertTopic.run(
      'top_maxwell_boundary',
      'sub_em',
      'Maxwell Equations & Electromagnetic Wave Propagation',
      'Electrodynamics',
      'Displacement current, transverse wave equation derivation, Poynting vector S = (1/μ_0) E × B, and dielectric interface boundary conditions.'
    );

    insertTopic.run(
      'top_schrodinger_tunnel',
      'sub_quantum',
      'Quantum Tunneling & Potential Barriers',
      'Quantum Mechanics',
      'Time-independent Schrödinger equation, evanescent wave decay in classically forbidden zones, and transmission coefficient T ≈ e^(-2κa).'
    );
  }

  // Seed User Model if not exists or if reset needed
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

  const userModelCheck = db.prepare('SELECT id FROM user_model WHERE user_id = ?').get(DEFAULT_USER_ID);
  if (!userModelCheck) {
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
  } else {
    // If student has 0 recorded question attempts and 0 mechanism evaluations, ensure clean unassessed state
    const attemptsCount = (db.prepare('SELECT count(*) as count FROM question_attempts WHERE user_id = ?').get(DEFAULT_USER_ID) as any)?.count || 0;
    const evalCount = (db.prepare('SELECT count(*) as count FROM mechanism_evaluations').get() as any)?.count || 0;
    if (attemptsCount === 0 && evalCount === 0) {
      db.prepare(`
        UPDATE user_model SET
          reasoning_profile = ?,
          topic_mastery = ?,
          error_profile = ?,
          confidence_calibration = ?,
          cognitive_resource_allocation = ?,
          updated_at = ?
        WHERE user_id = ?
      `).run(
        initialReasoningProfile,
        initialTopicMastery,
        initialErrorProfile,
        initialCalibration,
        initialCognitiveResource,
        now,
        DEFAULT_USER_ID
      );
    }
  }

  // Seed sample physical simulation
  const countSims = db.prepare('SELECT count(*) as count FROM simulations').get() as { count: number };
  const oscillatorSystemPresentation = JSON.stringify({
    apparatus_spec: 'Resonant Oscillator Rig (0.50 kg / 200 N/m)',
    primary_anomaly: 'Resonance amplitude spike + 85° phase lag under sinusoidal drive',
    parameters: { 'Natural Freq (ω_0)': '20.0 rad/s', 'Drive Freq (ω_d)': '20.0 rad/s', 'Phase Lag (Δφ)': '85.2°', 'Peak Amplitude (A)': '14.8 cm' },
    diagnostics: { 'Spring Constant (k)': '200 N/m', 'Oscillator Mass (m)': '0.50 kg', 'Nominal Drag (b_est)': '0.20 N·s/m' }
  });

  if (countSims.count === 0) {
    const insertSim = db.prepare(`
      INSERT INTO simulations (
        id, topic_id, title, scenario, hidden_state, difficulty,
        system_presentation, patient_presentation, available_investigations, available_decisions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSim.run(
      'sim_damped_oscillator',
      'top_damped_oscillator',
      'Underdamped Resonant System: Drag vs Restoring Force Dilemma',
      'A precision harmonic apparatus featuring a mass m = 0.50 kg suspended on an adjustable helical spring (nominal k = 200 N/m) operates inside a variable-viscosity fluid chamber. During sinusoidal driving at frequency ω_d = 20 rad/s, sensors record an unexpected sharp surge in steady-state amplitude accompanied by an 85° phase lag. An assistant proposes adding external ballast mass to shift the resonance, while a laboratory engineer suspects damping parameter calibration error.',
      JSON.stringify({
        hidden_state: 'Near-Resonant Driven Oscillation with Viscous Damping Underestimation',
        underlying_mechanism: 'When the driving angular frequency ω_d approaches natural frequency ω_0 = √(k/m) = 20 rad/s, steady-state response amplitude is governed strictly by the damping ratio γ = b/(2m). If damping b is small, the resonance peak sharpens drastically (Q = ω_0/(2γ) >> 1) and phase lag reaches π/2 (90°). Calibrating the damping parameter restores target Q without altering the fundamental oscillator eigenfrequency.',
        gold_standard_discriminator: 'Free-decay logarithmic decrement test (measures damping coefficient b independently of driving frequency) vs Driving frequency sweep.',
        optimal_step_count: 3
      }),
      'Intermediate',
      oscillatorSystemPresentation,
      oscillatorSystemPresentation,
      JSON.stringify([
        {
          id: 'inv_log_decrement',
          name: 'Free-Decay Logarithmic Decrement Test (Zero Drive)',
          cost_cognitive: 'Low',
          result: 'Drive decoupled: oscillation exhibits exponential envelope decay x(t) = A e^(-γt) cos(ω_d t). Logarithmic decrement δ = ln(x_n / x_{n+1}) = 0.0314, yielding damping ratio γ = 0.10 s⁻¹ (true damping b = 0.10 N·s/m, half of nominal estimate).',
          is_discriminator: true,
          explanation: 'Directly calculates true damping coefficient b from exponential decay envelope, isolating parameter miscalibration.'
        },
        {
          id: 'inv_q_factor_sweep',
          name: 'Driving Frequency Frequency-Response Sweep (Phase & Amplitude)',
          cost_cognitive: 'Low',
          result: 'Resonance half-power bandwidth Δω = 0.20 rad/s, confirming high quality factor Q = ω_0 / Δω = 100.',
          is_discriminator: true,
          explanation: 'Confirms narrow high-Q resonant amplification caused by low damping.'
        },
        {
          id: 'inv_spring_stiffness',
          name: 'Static Load Strain-Gauge Deflection Measurement',
          cost_cognitive: 'Medium',
          result: 'Static deflection under 1.0 kg load is Δx = 4.90 cm, verifying spring stiffness k = 200.1 N/m (within 0.05% of specification).',
          is_discriminator: false,
          explanation: 'Spring stiffness is already within tight tolerance; confirms no mechanical degradation in spring.'
        },
        {
          id: 'inv_chamber_temp',
          name: 'Infrared Thermal Chamber Surface Scan',
          cost_cognitive: 'High',
          result: 'Chamber wall temperature steady at 22.4 °C with minimal thermal dissipation gradient.',
          is_discriminator: false,
          explanation: 'Temperature scan yields secondary thermal dissipation metrics but does not discriminate the governing dynamical parameter.'
        }
      ]),
      JSON.stringify([
        {
          id: 'dec_adjust_viscosity',
          intervention: 'Calibrate Fluid Chamber Viscosity to Achieve Critical Damping (γ = ω_0)',
          rationale: 'Modulates damping parameter b to eliminate resonant amplification without modifying the natural mechanical oscillator parameters.',
          is_optimal: true,
          outcome_feedback: 'Optimal physical control decision. Damping parameter calibrated to target ratio, suppressing resonant amplitude surge while maintaining predictable response.'
        },
        {
          id: 'dec_increase_mass',
          intervention: 'Attach 0.50 kg Auxiliary Ballast Mass to Shift Natural Frequency',
          rationale: 'Attempts to de-tune natural frequency away from driving frequency.',
          is_optimal: false,
          outcome_feedback: 'Suboptimal approach. Shifting mass alters eigenfrequency ω_0 = √(k/(m + Δm)) = 14.1 rad/s, creating mismatch with system drive specifications without resolving the underlying low-dissipation problem.'
        },
        {
          id: 'dec_ignore_damping',
          intervention: 'Increase Drive Motor Power to Force Fixed Displacement Amplitude',
          rationale: 'Assumes amplitude spike is caused by motor coupling instability.',
          is_optimal: false,
          outcome_feedback: 'Hazardous physical intervention. Forcing additional driving power through an underdamped high-Q resonance drastically increases mechanical shear stress and risks spring failure.'
        }
      ])
    );
  }

  // Ensure system_presentation is backfilled on existing simulations if empty
  try {
    db.prepare(`
      UPDATE simulations
      SET system_presentation = ?
      WHERE system_presentation IS NULL OR system_presentation = '' OR system_presentation = '{}'
    `).run(oscillatorSystemPresentation);
  } catch {}

  // Seed sample reasoning-first MCQs
  const countQuestions = db.prepare('SELECT count(*) as count FROM questions').get() as { count: number };
  if (countQuestions.count === 0) {
    const insertQ = db.prepare(`
      INSERT INTO questions (
        id, topic_id, mode, question_text, options, correct_answer,
        explanation, reasoning_target, difficulty, scenario_vignette, discriminator_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertQ.run(
      'q_damped_osc_1',
      'top_damped_oscillator',
      'first_principles',
      'In an underdamped harmonic oscillator (m x\'\'(t) + b x\'(t) + k x(t) = 0), what fundamental physical mechanism dictates the exponential decay envelope x_peak(t) ∝ e^(-γ t) where γ = b/(2m)?',
      JSON.stringify([
        'Viscous drag force F = -b v is proportional to velocity, leading to an instantaneous rate of mechanical energy dissipation dE/dt = -b v² ≤ 0',
        'The restoring spring force accumulates potential energy faster than kinetic energy can be transferred',
        'Conservation of angular momentum causes phase-space trajectory contraction along the position axis',
        'Coulomb dry friction generates a constant opposing force that removes equal energy increments per cycle'
      ]),
      'Viscous drag force F = -b v is proportional to velocity, leading to an instantaneous rate of mechanical energy dissipation dE/dt = -b v² ≤ 0',
      'The total mechanical energy E = 1/2 m v² + 1/2 k x². Taking the time derivative: dE/dt = m v (dv/dt) + k x (dx/dt) = v (m a + k x). Substituting the equation of motion m a + k x = -b v yields dE/dt = -b v² ≤ 0. Because dissipation rate scales with v², average energy decays exponentially with time constant τ = m/b, and displacement amplitude decays as e^(-(b/2m)t).',
      'First-principles energy dissipation derivation in viscous damping.',
      'Mechanistic',
      'A precision pendulum immersed in silicone oil is released from rest at angle θ_0 = 5°. Optical encoders track successive positive peak amplitudes: θ_1 = 4.2°, θ_2 = 3.53°, θ_3 = 2.96°.',
      'Discriminator: Exponential peak ratio (θ_{n+1}/θ_n = constant) indicates linear viscous drag (F ∝ v); linear decay indicates dry Coulomb friction.',
      now
    );

    insertQ.run(
      'q_lenz_induction_1',
      'top_lenz_induction',
      'second_order',
      'A cylindrical copper tube is held vertically, and an identical-sized cylindrical neodymium magnet is dropped down through it. Why does the magnet reach a constant terminal velocity v_term instead of accelerating continuously at g?',
      JSON.stringify([
        'Gravitational potential energy is permanently absorbed by the nuclear lattice of the copper atoms',
        'The falling magnet induces eddy currents in the tube wall whose secondary magnetic fields exert an upward Lorentz braking force that scales linearly with velocity until balancing mg',
        'The magnetic field of the falling magnet induces diamagnetic repulsion in copper that is independent of velocity',
        'Atmospheric air is compressed beneath the falling magnet inside the narrow conductive bore'
      ]),
      'The falling magnet induces eddy currents in the tube wall whose secondary magnetic fields exert an upward Lorentz braking force that scales linearly with velocity until balancing mg',
      'By Faraday law of induction (EMF = -dΦ/dt), the rate of change of magnetic flux through cross-sections of the tube is directly proportional to magnet velocity v. By Ohm law, induced eddy currents scale with v. By Lenz law and the Lorentz force equation F = I(L × B), these currents generate a magnetic dipole opposing the falling magnet motion, creating an upward magnetic drag force F_mag = -k v. Terminal velocity is reached when F_mag = mg, so v_term = mg/k.',
      'Second-order electromagnetic damping and dynamic equilibrium.',
      'Second-Order',
      'In an undergraduate lab experiment, dropping a non-magnetic aluminum cylinder through a 1-meter copper pipe takes 0.45 seconds. Dropping a strong NdFeB magnet of equal mass and dimensions through the same pipe takes 8.2 seconds at constant speed.',
      'Discriminator: Velocity-dependent Lorentz back-EMF braking enforces steady-state terminal velocity; electrostatic or static diamagnetic forces cannot produce velocity-dependent damping.',
      now
    );

    insertQ.run(
      'q_carnot_entropy_1',
      'top_carnot_entropy',
      'causal_discrimination',
      'Why is it physically impossible for any cyclic heat engine operating between two thermal reservoirs at temperatures T_H and T_C (with T_H > T_C) to achieve a thermal efficiency greater than η_Carnot = 1 - T_C / T_H?',
      JSON.stringify([
        'Mechanical friction in the piston rings and cylinder walls inevitably dissipates kinetic energy',
        'Any engine with efficiency η > η_Carnot operating in reverse would produce a net decrease in entropy of an isolated system (∮ dQ/T < 0), violating the Second Law of Thermodynamics',
        'Ideal gas molecules undergo quantum tunneling through the cylinder walls at elevated temperatures',
        'The First Law of Thermodynamics prohibits total work output from equaling thermal energy input'
      ]),
      'Any engine with efficiency η > η_Carnot operating in reverse would produce a net decrease in entropy of an isolated system (∮ dQ/T < 0), violating the Second Law of Thermodynamics',
      'For any reversible cyclic process, Clausius theorem states ∮ dQ_rev / T = 0, giving Q_H/T_H = Q_C/T_C. The efficiency is η = W/Q_H = (Q_H - Q_C)/Q_H = 1 - T_C/T_H. If a hypothetical engine had η > 1 - T_C/T_H, coupling it to drive a reversible Carnot refrigerator would transfer heat from cold to hot reservoir without external work, generating a net negative entropy change ΔS_universe < 0 in violation of the Second Law (Clausius statement).',
      'Thermodynamic limits, reversible cycles, and Clausius inequality.',
      'Foundation',
      'An inventor patents an experimental thermoelectric device operating between steam at 373 K and ambient water at 293 K, claiming an experimentally verified thermal efficiency of 32%.',
      'Discriminator: Carnot limit η_max = 1 - 293/373 = 21.4%. Any claimed efficiency exceeding 21.4% between these reservoirs violates the Second Law regardless of technological mechanism.',
      now
    );

    insertQ.run(
      'q_maxwell_boundary_1',
      'top_maxwell_boundary',
      'first_principles',
      'Why did James Clerk Maxwell introduce the displacement current term J_D = ε_0 ∂E/∂t into Ampère circuital law (∇ × B = μ_0 J)?',
      JSON.stringify([
        'To account for the classical ohmic heating of vacuum dielectric regions',
        'To ensure mathematical and physical consistency with charge conservation (∇ · J + ∂ρ/∂t = 0) under time-varying field conditions',
        'To satisfy the Galilean relativity transformation between moving reference frames',
        'To explain the mechanical momentum transfer from solar radiation pressure'
      ]),
      'To ensure mathematical and physical consistency with charge conservation (∇ · J + ∂ρ/∂t = 0) under time-varying field conditions',
      'Taking the divergence of the original Ampère law ∇ × B = μ_0 J yields ∇ · (∇ × B) = μ_0 (∇ · J). Because the divergence of any curl is identically zero, this required ∇ · J = 0, which is only valid in steady-state (magnetostatic) conditions. By the continuity equation ∇ · J = -∂ρ/∂t. Using Gauss law ∇ · E = ρ/ε_0, we have ∇ · J = -ε_0 ∂(∇ · E)/∂t = -∇ · (ε_0 ∂E/∂t). Adding J_D = ε_0 ∂E/∂t to the current density yields ∇ · (J + ε_0 ∂E/∂t) = 0, resolving the contradiction and predicting electromagnetic wave propagation.',
      'Mathematical and physical necessity of displacement current.',
      'Mechanistic',
      'During high-frequency charging of a parallel-plate capacitor, a conduction current I_C flows through the connecting wires, but no mobile charge carriers cross the vacuum gap between plates.',
      'Discriminator: Magnetic field B exists in the gap region without charge transport; it is generated by time-varying electric flux ∂E/∂t.',
      now
    );
  }

  // Seed sample pre-configured canonical mechanisms
  const countMech = db.prepare('SELECT count(*) as count FROM mechanisms').get() as { count: number };
  if (countMech.count === 0) {
    const insertMech = db.prepare(`
      INSERT INTO mechanisms (id, user_id, topic_id, title, user_explanation, canonical_mechanism, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMech.run(
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
}
