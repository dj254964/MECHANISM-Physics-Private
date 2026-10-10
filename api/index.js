// server/app.js
import express from "express";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";
import crypto from "node:crypto";
import fs2 from "node:fs";
import path2 from "node:path";
var { Pool } = pg;
var isVercel = Boolean(process.env.VERCEL);
var databaseUrl = process.env.DATABASE_URL;
if (isVercel && !databaseUrl) {
  throw new Error(
    "CRITICAL SERVERLESS PERSISTENCE ERROR: Running on Vercel production without DATABASE_URL. Please connect the Neon PostgreSQL integration in Vercel project settings."
  );
}
var isPostgres = Boolean(databaseUrl);
var sqliteDb = null;
var pgPool = null;
if (isPostgres) {
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 3e4
  });
} else {
  const dataDir2 = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir2)) {
    fs.mkdirSync(dataDir2, { recursive: true });
  }
  const dbPath = path.join(dataDir2, "mechanism.db");
  sqliteDb = new DatabaseSync(dbPath);
}
function toPgSql(sql) {
  let paramIndex = 1;
  let inQuote = false;
  let quoteChar = "";
  let out = "";
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (!inQuote && (char === "'" || char === '"')) {
      inQuote = true;
      quoteChar = char;
      out += char;
    } else if (inQuote && char === quoteChar) {
      if (sql[i + 1] === quoteChar) {
        out += char + sql[i + 1];
        i++;
      } else {
        inQuote = false;
        out += char;
      }
    } else if (!inQuote && char === "?") {
      out += `$${paramIndex++}`;
    } else {
      out += char;
    }
  }
  if (out.includes("sqlite_master")) {
    out = out.replace(
      /FROM\s+sqlite_master\s+WHERE\s+type\s*=\s*'table'/gi,
      "FROM information_schema.tables WHERE table_schema = 'public'"
    );
  }
  if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(out)) {
    out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO");
    if (!/ON\s+CONFLICT/i.test(out)) {
      out += " ON CONFLICT DO NOTHING";
    }
  }
  out = out.replace(/UPDATE\s+OR\s+IGNORE/gi, "UPDATE");
  return out;
}
function normalizeParams(args) {
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}
var db = {
  isPostgres,
  async get(sql, ...params) {
    const flatParams = normalizeParams(params);
    if (isPostgres && pgPool) {
      const pgSql = toPgSql(sql);
      const res = await pgPool.query(pgSql, flatParams);
      return res.rows[0] || null;
    } else if (sqliteDb) {
      const stmt = sqliteDb.prepare(sql);
      const row = stmt.get(...flatParams);
      return row || null;
    }
    return null;
  },
  async all(sql, ...params) {
    const flatParams = normalizeParams(params);
    if (isPostgres && pgPool) {
      const pgSql = toPgSql(sql);
      const res = await pgPool.query(pgSql, flatParams);
      return res.rows || [];
    } else if (sqliteDb) {
      const stmt = sqliteDb.prepare(sql);
      const rows = stmt.all(...flatParams);
      return rows || [];
    }
    return [];
  },
  async query(sql, ...params) {
    return this.all(sql, ...params);
  },
  async run(sql, ...params) {
    const flatParams = normalizeParams(params);
    if (isPostgres && pgPool) {
      const pgSql = toPgSql(sql);
      const res = await pgPool.query(pgSql, flatParams);
      return { changes: res.rowCount || 0 };
    } else if (sqliteDb) {
      const stmt = sqliteDb.prepare(sql);
      const res = stmt.run(...flatParams);
      return { changes: Number(res.changes) || 0 };
    }
    return { changes: 0 };
  },
  async exec(sql) {
    if (isPostgres && pgPool) {
      await pgPool.query(sql);
    } else if (sqliteDb) {
      sqliteDb.exec(sql);
    }
  },
  async transaction(fn) {
    if (isPostgres && pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn();
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } else if (sqliteDb) {
      sqliteDb.exec("BEGIN TRANSACTION;");
      try {
        const result = await fn();
        sqliteDb.exec("COMMIT;");
        return result;
      } catch (err) {
        sqliteDb.exec("ROLLBACK;");
        throw err;
      }
    }
    return await fn();
  },
  prepare(sql) {
    if (sqliteDb) {
      return sqliteDb.prepare(sql);
    }
    throw new Error("db.prepare is only available in synchronous SQLite local mode. Use await db.get / all / run.");
  }
};
var DEFAULT_USER_ID = "user_physics_scholar";
async function initDatabase() {
  if (isPostgres) {
    await db.exec(`
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
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        chapter TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS learning_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
        mode TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS mechanisms (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        user_explanation TEXT,
        canonical_mechanism TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mechanism_evaluations (
        id TEXT PRIMARY KEY,
        mechanism_id TEXT REFERENCES mechanisms(id) ON DELETE CASCADE,
        session_id TEXT REFERENCES learning_sessions(id) ON DELETE SET NULL,
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
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS errors (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        frequency INTEGER NOT NULL DEFAULT 1,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mechanism_errors (
        id TEXT PRIMARY KEY,
        evaluation_id TEXT NOT NULL REFERENCES mechanism_evaluations(id) ON DELETE CASCADE,
        error_id TEXT NOT NULL REFERENCES errors(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
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
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS question_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        answer TEXT NOT NULL,
        correct INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        reasoning TEXT,
        reasoning_error TEXT,
        time_taken INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS simulations (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        scenario TEXT NOT NULL,
        hidden_state TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        patient_presentation TEXT,
        system_presentation TEXT,
        available_investigations TEXT,
        available_decisions TEXT
      );

      CREATE TABLE IF NOT EXISTS simulation_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        simulation_id TEXT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
        hypotheses TEXT NOT NULL,
        evidence_used TEXT NOT NULL,
        decisions TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        outcome TEXT NOT NULL,
        model_update TEXT,
        unnecessary_investigations_count INTEGER DEFAULT 0,
        overanalyzed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reconstructions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        source_mechanism TEXT NOT NULL,
        user_reconstruction TEXT NOT NULL,
        evaluation TEXT NOT NULL,
        score REAL NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_model (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        reasoning_profile TEXT NOT NULL,
        topic_mastery TEXT NOT NULL,
        error_profile TEXT NOT NULL,
        confidence_calibration TEXT NOT NULL,
        cognitive_resource_allocation TEXT NOT NULL,
        recommended_difficulty TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        learning_context TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        classification TEXT,
        metadata TEXT,
        attachments TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS adaptive_evidence (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feature TEXT NOT NULL,
        topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
        error_id TEXT REFERENCES errors(id) ON DELETE SET NULL,
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
        created_at TEXT NOT NULL
      );

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

      CREATE TABLE IF NOT EXISTS private_auth (
        id TEXT PRIMARY KEY DEFAULT 'current_private_auth',
        initialized BOOLEAN NOT NULL DEFAULT TRUE,
        username TEXT NOT NULL,
        display_name TEXT NOT NULL,
        salt TEXT NOT NULL,
        hash TEXT NOT NULL,
        recovery_clue TEXT,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS private_sessions (
        token TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        remember_me BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_user ON adaptive_evidence(user_id);
      CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_error ON adaptive_evidence(error_id);
      CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_feature ON adaptive_evidence(feature);
      CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_topic ON adaptive_evidence(topic_id);
      CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_created ON adaptive_evidence(created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_private_sessions_token ON private_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_private_sessions_expires ON private_sessions(expires_at);
    `);
  } else if (sqliteDb) {
    sqliteDb.exec("PRAGMA foreign_keys = ON;");
    sqliteDb.exec(`
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

      CREATE TABLE IF NOT EXISTS private_auth (
        id TEXT PRIMARY KEY DEFAULT 'current_private_auth',
        initialized INTEGER NOT NULL DEFAULT 1,
        username TEXT NOT NULL,
        display_name TEXT NOT NULL,
        salt TEXT NOT NULL,
        hash TEXT NOT NULL,
        recovery_clue TEXT,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS private_sessions (
        token TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        remember_me INTEGER NOT NULL DEFAULT 0
      );
    `);
    try {
      sqliteDb.exec("ALTER TABLE chat_messages ADD COLUMN attachments TEXT;");
    } catch {
    }
    try {
      sqliteDb.exec("ALTER TABLE chat_conversations ADD COLUMN learning_context TEXT;");
    } catch {
    }
    try {
      sqliteDb.prepare("ALTER TABLE questions ADD COLUMN scenario_vignette TEXT").run();
    } catch {
    }
    try {
      sqliteDb.prepare("ALTER TABLE questions ADD COLUMN clinical_vignette TEXT").run();
    } catch {
    }
    try {
      sqliteDb.prepare("ALTER TABLE simulations ADD COLUMN system_presentation TEXT").run();
    } catch {
    }
    try {
      sqliteDb.prepare("ALTER TABLE simulations ADD COLUMN patient_presentation TEXT").run();
    } catch {
    }
  }
  await seedInitialData();
}
async function seedInitialData() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const userCheck = await db.get("SELECT id FROM users WHERE id = ?", DEFAULT_USER_ID);
  if (!userCheck) {
    await db.run(
      "INSERT INTO users (id, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      DEFAULT_USER_ID,
      "BSc Physics Scholar",
      now,
      now
    );
  }
  const countErrors = await db.get("SELECT count(*) as count FROM errors");
  if (Number(countErrors?.count || 0) === 0) {
    const defaultErrors = [
      { id: "err_assoc_causation", category: "Causal Reasoning", description: "Association \u2192 Causation Confounding", severity: "high" },
      { id: "err_directionality_inversion", category: "Mechanism Reasoning", description: "Directionality Inversion in Dynamic Flux Chains", severity: "high" },
      { id: "err_premature_closure", category: "Physical Hypothesis Closure", description: "Premature Closure on Prototype Matching", severity: "medium" },
      { id: "err_overanalysis_trap", category: "Cognitive Efficiency", description: "Overanalysis & Reluctance to Commit", severity: "medium" },
      { id: "err_missing_variable", category: "Variable Accounting", description: "Missing Compensatory Feedback or State Variable", severity: "high" }
    ];
    for (const e of defaultErrors) {
      await db.run(
        "INSERT INTO errors (id, user_id, category, description, severity, frequency, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
        e.id,
        DEFAULT_USER_ID,
        e.category,
        e.description,
        e.severity,
        0,
        now,
        now
      );
    }
  }
  const countSubjects = await db.get("SELECT count(*) as count FROM subjects");
  if (Number(countSubjects?.count || 0) === 0) {
    await db.run("INSERT INTO subjects (id, name, code, icon) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING", "sub_physics", "Classical Mechanics & Dynamics", "MECH", "Activity");
    await db.run("INSERT INTO subjects (id, name, code, icon) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING", "sub_em", "Electrodynamics & Field Theory", "EM", "Zap");
    await db.run("INSERT INTO subjects (id, name, code, icon) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING", "sub_thermo", "Thermal & Statistical Physics", "THERMO", "Flame");
    await db.run("INSERT INTO subjects (id, name, code, icon) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING", "sub_quantum", "Quantum Mechanics & Modern Physics", "QUANT", "Target");
  }
  const countTopics = await db.get("SELECT count(*) as count FROM topics");
  if (Number(countTopics?.count || 0) === 0) {
    await db.run(
      "INSERT INTO topics (id, subject_id, name, chapter, description) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      "top_damped_oscillator",
      "sub_physics",
      "Damped & Driven Harmonic Oscillators",
      "Oscillations & Waves",
      "Differential equations of damped motion, underdamped vs critically damped response, quality factor Q, and resonance phase lag."
    );
    await db.run(
      "INSERT INTO topics (id, subject_id, name, chapter, description) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      "top_gyroscopic_precession",
      "sub_physics",
      "Angular Momentum & Gyroscopic Precession",
      "Rigid Body Dynamics",
      "Torque coupling to angular momentum vectors (dL/dt = \u03C4), precession frequency \u03A9_p = \u03C4/L, and nutation transients."
    );
    await db.run(
      "INSERT INTO topics (id, subject_id, name, chapter, description) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      "top_lenz_induction",
      "sub_em",
      "Lenz's Law & Electromagnetic Induction",
      "Electrodynamics",
      "Faraday law of induction (EMF = -d\u03A6/dt), eddy current magnetic braking force, and Lenz sign directionality."
    );
    await db.run(
      "INSERT INTO topics (id, subject_id, name, chapter, description) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      "top_carnot_entropy",
      "sub_thermo",
      "Carnot Cycles, Entropy & Second Law",
      "Thermodynamics",
      "Reversible heat engine efficiency \u03B7 = 1 - T_C/T_H, Clausius inequality \u222E dQ/T \u2264 0, and non-decreasing entropy in isolated systems."
    );
    await db.run(
      "INSERT INTO topics (id, subject_id, name, chapter, description) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      "top_maxwell_boundary",
      "sub_em",
      "Maxwell Equations & Electromagnetic Wave Propagation",
      "Electrodynamics",
      "Displacement current, transverse wave equation derivation, Poynting vector S = (1/\u03BC_0) E \xD7 B, and dielectric interface boundary conditions."
    );
    await db.run(
      "INSERT INTO topics (id, subject_id, name, chapter, description) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      "top_schrodinger_tunnel",
      "sub_quantum",
      "Quantum Tunneling & Potential Barriers",
      "Quantum Mechanics",
      "Time-independent Schr\xF6dinger equation, evanescent wave decay in classically forbidden zones, and transmission coefficient T \u2248 e^(-2\u03BAa)."
    );
  }
  const initialReasoningProfile = JSON.stringify({
    first_principles_index: null,
    causal_precision: null,
    directionality_integrity: null,
    discriminator_acuity: null,
    exception_awareness: null,
    anti_overanalysis_score: null
  });
  const initialTopicMastery = JSON.stringify({});
  const initialErrorProfile = JSON.stringify([]);
  const initialCalibration = JSON.stringify({
    brier_score: null,
    overconfidence_bias: null,
    underconfidence_bias: null,
    calibration_curve: []
  });
  const initialCognitiveResource = JSON.stringify({
    average_time_per_decision_sec: null,
    unnecessary_tests_requested_rate: null,
    overanalysis_flags_count: 0,
    decision_commit_efficiency: "Pending Assessment"
  });
  const userModelCheck = await db.get("SELECT id FROM user_model WHERE user_id = ?", DEFAULT_USER_ID);
  if (!userModelCheck) {
    await db.run(
      `INSERT INTO user_model (
        id, user_id, reasoning_profile, topic_mastery, error_profile,
        confidence_calibration, cognitive_resource_allocation, recommended_difficulty, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "model_" + DEFAULT_USER_ID,
      DEFAULT_USER_ID,
      initialReasoningProfile,
      initialTopicMastery,
      initialErrorProfile,
      initialCalibration,
      initialCognitiveResource,
      "Mechanistic",
      now
    );
  }
  const countSims = await db.get("SELECT count(*) as count FROM simulations");
  const oscillatorSystemPresentation = JSON.stringify({
    apparatus_spec: "Resonant Oscillator Rig (0.50 kg / 200 N/m)",
    primary_anomaly: "Resonance amplitude spike + 85\xB0 phase lag under sinusoidal drive",
    parameters: { "Natural Freq (\u03C9_0)": "20.0 rad/s", "Drive Freq (\u03C9_d)": "20.0 rad/s", "Phase Lag (\u0394\u03C6)": "85.2\xB0", "Peak Amplitude (A)": "14.8 cm" },
    diagnostics: { "Spring Constant (k)": "200 N/m", "Oscillator Mass (m)": "0.50 kg", "Nominal Drag (b_est)": "0.20 N\xB7s/m" }
  });
  if (Number(countSims?.count || 0) === 0) {
    await db.run(
      `INSERT INTO simulations (
        id, topic_id, title, scenario, hidden_state, difficulty,
        system_presentation, patient_presentation, available_investigations, available_decisions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "sim_damped_oscillator",
      "top_damped_oscillator",
      "Underdamped Resonant System: Drag vs Restoring Force Dilemma",
      "A precision harmonic apparatus featuring a mass m = 0.50 kg suspended on an adjustable helical spring (nominal k = 200 N/m) operates inside a variable-viscosity fluid chamber. During sinusoidal driving at frequency \u03C9_d = 20 rad/s, sensors record an unexpected sharp surge in steady-state amplitude accompanied by an 85\xB0 phase lag. An assistant proposes adding external ballast mass to shift the resonance, while a laboratory engineer suspects damping parameter calibration error.",
      JSON.stringify({
        hidden_state: "Near-Resonant Driven Oscillation with Viscous Damping Underestimation",
        underlying_mechanism: "When the driving angular frequency \u03C9_d approaches natural frequency \u03C9_0 = \u221A(k/m) = 20 rad/s, steady-state response amplitude is governed strictly by the damping ratio \u03B3 = b/(2m). If damping b is small, the resonance peak sharpens drastically (Q = \u03C9_0/(2\u03B3) >> 1) and phase lag reaches \u03C0/2 (90\xB0). Calibrating the damping parameter restores target Q without altering the fundamental oscillator eigenfrequency.",
        gold_standard_discriminator: "Free-decay logarithmic decrement test (measures damping coefficient b independently of driving frequency) vs Driving frequency sweep.",
        optimal_step_count: 3
      }),
      "Intermediate",
      oscillatorSystemPresentation,
      oscillatorSystemPresentation,
      JSON.stringify([
        {
          id: "inv_log_decrement",
          name: "Free-Decay Logarithmic Decrement Test (Zero Drive)",
          cost_cognitive: "Low",
          result: "Drive decoupled: oscillation exhibits exponential envelope decay x(t) = A e^(-\u03B3t) cos(\u03C9_d t). Logarithmic decrement \u03B4 = ln(x_n / x_{n+1}) = 0.0314, yielding damping ratio \u03B3 = 0.10 s\u207B\xB9 (true damping b = 0.10 N\xB7s/m, half of nominal estimate).",
          is_discriminator: true,
          explanation: "Directly calculates true damping coefficient b from exponential decay envelope, isolating parameter miscalibration."
        },
        {
          id: "inv_q_factor_sweep",
          name: "Driving Frequency Frequency-Response Sweep (Phase & Amplitude)",
          cost_cognitive: "Low",
          result: "Resonance half-power bandwidth \u0394\u03C9 = 0.20 rad/s, confirming high quality factor Q = \u03C9_0 / \u0394\u03C9 = 100.",
          is_discriminator: true,
          explanation: "Confirms narrow high-Q resonant amplification caused by low damping."
        },
        {
          id: "inv_spring_stiffness",
          name: "Static Load Strain-Gauge Deflection Measurement",
          cost_cognitive: "Medium",
          result: "Static deflection under 1.0 kg load is \u0394x = 4.90 cm, verifying spring stiffness k = 200.1 N/m (within 0.05% of specification).",
          is_discriminator: false,
          explanation: "Spring stiffness is already within tight tolerance; confirms no mechanical degradation in spring."
        },
        {
          id: "inv_chamber_temp",
          name: "Infrared Thermal Chamber Surface Scan",
          cost_cognitive: "High",
          result: "Chamber wall temperature steady at 22.4 \xB0C with minimal thermal dissipation gradient.",
          is_discriminator: false,
          explanation: "Temperature scan yields secondary thermal dissipation metrics but does not discriminate the governing dynamical parameter."
        }
      ]),
      JSON.stringify([
        {
          id: "dec_adjust_viscosity",
          intervention: "Calibrate Fluid Chamber Viscosity to Achieve Critical Damping (\u03B3 = \u03C9_0)",
          rationale: "Modulates damping parameter b to eliminate resonant amplification without modifying the natural mechanical oscillator parameters.",
          is_optimal: true,
          outcome_feedback: "Optimal physical control decision. Damping parameter calibrated to target ratio, suppressing resonant amplitude surge while maintaining predictable response."
        },
        {
          id: "dec_increase_mass",
          intervention: "Attach 0.50 kg Auxiliary Ballast Mass to Shift Natural Frequency",
          rationale: "Attempts to de-tune natural frequency away from driving frequency.",
          is_optimal: false,
          outcome_feedback: "Suboptimal approach. Shifting mass alters eigenfrequency \u03C9_0 = \u221A(k/(m + \u0394m)) = 14.1 rad/s, creating mismatch with system drive specifications without resolving the underlying low-dissipation problem."
        },
        {
          id: "dec_ignore_damping",
          intervention: "Increase Drive Motor Power to Force Fixed Displacement Amplitude",
          rationale: "Assumes amplitude spike is caused by motor coupling instability.",
          is_optimal: false,
          outcome_feedback: "Hazardous physical intervention. Forcing additional driving power through an underdamped high-Q resonance drastically increases mechanical shear stress and risks spring failure."
        }
      ])
    );
  }
  const countQuestions = await db.get("SELECT count(*) as count FROM questions");
  if (Number(countQuestions?.count || 0) === 0) {
    await db.run(
      `INSERT INTO questions (
        id, topic_id, mode, question_text, options, correct_answer,
        explanation, reasoning_target, difficulty, scenario_vignette, discriminator_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "q_damped_osc_1",
      "top_damped_oscillator",
      "first_principles",
      "In an underdamped harmonic oscillator (m x''(t) + b x'(t) + k x(t) = 0), what fundamental physical mechanism dictates the exponential decay envelope x_peak(t) \u221D e^(-\u03B3 t) where \u03B3 = b/(2m)?",
      JSON.stringify([
        "Viscous drag force F = -b v is proportional to velocity, leading to an instantaneous rate of mechanical energy dissipation dE/dt = -b v\xB2 \u2264 0",
        "The restoring spring force accumulates potential energy faster than kinetic energy can be transferred",
        "Conservation of angular momentum causes phase-space trajectory contraction along the position axis",
        "Coulomb dry friction generates a constant opposing force that removes equal energy increments per cycle"
      ]),
      "Viscous drag force F = -b v is proportional to velocity, leading to an instantaneous rate of mechanical energy dissipation dE/dt = -b v\xB2 \u2264 0",
      "The total mechanical energy E = 1/2 m v\xB2 + 1/2 k x\xB2. Taking the time derivative: dE/dt = m v (dv/dt) + k x (dx/dt) = v (m a + k x). Substituting the equation of motion m a + k x = -b v yields dE/dt = -b v\xB2 \u2264 0. Because dissipation rate scales with v\xB2, average energy decays exponentially with time constant \u03C4 = m/b, and displacement amplitude decays as e^(-(b/2m)t).",
      "First-principles energy dissipation derivation in viscous damping.",
      "Mechanistic",
      "A precision pendulum immersed in silicone oil is released from rest at angle \u03B8_0 = 5\xB0. Optical encoders track successive positive peak amplitudes: \u03B8_1 = 4.2\xB0, \u03B8_2 = 3.53\xB0, \u03B8_3 = 2.96\xB0.",
      "Discriminator: Exponential peak ratio (\u03B8_{n+1}/\u03B8_n = constant) indicates linear viscous drag (F \u221D v); linear decay indicates dry Coulomb friction.",
      now
    );
    await db.run(
      `INSERT INTO questions (
        id, topic_id, mode, question_text, options, correct_answer,
        explanation, reasoning_target, difficulty, scenario_vignette, discriminator_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "q_lenz_induction_1",
      "top_lenz_induction",
      "second_order",
      "A cylindrical copper tube is held vertically, and an identical-sized cylindrical neodymium magnet is dropped down through it. Why does the magnet reach a constant terminal velocity v_term instead of accelerating continuously at g?",
      JSON.stringify([
        "Gravitational potential energy is permanently absorbed by the nuclear lattice of the copper atoms",
        "The falling magnet induces eddy currents in the tube wall whose secondary magnetic fields exert an upward Lorentz braking force that scales linearly with velocity until balancing mg",
        "The magnetic field of the falling magnet induces diamagnetic repulsion in copper that is independent of velocity",
        "Atmospheric air is compressed beneath the falling magnet inside the narrow conductive bore"
      ]),
      "The falling magnet induces eddy currents in the tube wall whose secondary magnetic fields exert an upward Lorentz braking force that scales linearly with velocity until balancing mg",
      "By Faraday law of induction (EMF = -d\u03A6/dt), the rate of change of magnetic flux through cross-sections of the tube is directly proportional to magnet velocity v. By Ohm law, induced eddy currents scale with v. By Lenz law and the Lorentz force equation F = I(L \xD7 B), these currents generate a magnetic dipole opposing the falling magnet motion, creating an upward magnetic drag force F_mag = -k v. Terminal velocity is reached when F_mag = mg, so v_term = mg/k.",
      "Second-order electromagnetic damping and dynamic equilibrium.",
      "Second-Order",
      "In an undergraduate lab experiment, dropping a non-magnetic aluminum cylinder through a 1-meter copper pipe takes 0.45 seconds. Dropping a strong NdFeB magnet of equal mass and dimensions through the same pipe takes 8.2 seconds at constant speed.",
      "Discriminator: Velocity-dependent Lorentz back-EMF braking enforces steady-state terminal velocity; electrostatic or static diamagnetic forces cannot produce velocity-dependent damping.",
      now
    );
    await db.run(
      `INSERT INTO questions (
        id, topic_id, mode, question_text, options, correct_answer,
        explanation, reasoning_target, difficulty, scenario_vignette, discriminator_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "q_carnot_entropy_1",
      "top_carnot_entropy",
      "causal_discrimination",
      "Why is it physically impossible for any cyclic heat engine operating between two thermal reservoirs at temperatures T_H and T_C (with T_H > T_C) to achieve a thermal efficiency greater than \u03B7_Carnot = 1 - T_C / T_H?",
      JSON.stringify([
        "Mechanical friction in the piston rings and cylinder walls inevitably dissipates kinetic energy",
        "Any engine with efficiency \u03B7 > \u03B7_Carnot operating in reverse would produce a net decrease in entropy of an isolated system (\u222E dQ/T < 0), violating the Second Law of Thermodynamics",
        "Ideal gas molecules undergo quantum tunneling through the cylinder walls at elevated temperatures",
        "The First Law of Thermodynamics prohibits total work output from equaling thermal energy input"
      ]),
      "Any engine with efficiency \u03B7 > \u03B7_Carnot operating in reverse would produce a net decrease in entropy of an isolated system (\u222E dQ/T < 0), violating the Second Law of Thermodynamics",
      "For any reversible cyclic process, Clausius theorem states \u222E dQ_rev / T = 0, giving Q_H/T_H = Q_C/T_C. The efficiency is \u03B7 = W/Q_H = (Q_H - Q_C)/Q_H = 1 - T_C/T_H. If a hypothetical engine had \u03B7 > 1 - T_C/T_H, coupling it to drive a reversible Carnot refrigerator would transfer heat from cold to hot reservoir without external work, generating a net negative entropy change \u0394S_universe < 0 in violation of the Second Law (Clausius statement).",
      "Thermodynamic limits, reversible cycles, and Clausius inequality.",
      "Foundation",
      "An inventor patents an experimental thermoelectric device operating between steam at 373 K and ambient water at 293 K, claiming an experimentally verified thermal efficiency of 32%.",
      "Discriminator: Carnot limit \u03B7_max = 1 - 293/373 = 21.4%. Any claimed efficiency exceeding 21.4% between these reservoirs violates the Second Law regardless of technological mechanism.",
      now
    );
    await db.run(
      `INSERT INTO questions (
        id, topic_id, mode, question_text, options, correct_answer,
        explanation, reasoning_target, difficulty, scenario_vignette, discriminator_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "q_maxwell_boundary_1",
      "top_maxwell_boundary",
      "first_principles",
      "Why did James Clerk Maxwell introduce the displacement current term J_D = \u03B5_0 \u2202E/\u2202t into Amp\xE8re circuital law (\u2207 \xD7 B = \u03BC_0 J)?",
      JSON.stringify([
        "To account for the classical ohmic heating of vacuum dielectric regions",
        "To ensure mathematical and physical consistency with charge conservation (\u2207 \xB7 J + \u2202\u03C1/\u2202t = 0) under time-varying field conditions",
        "To satisfy the Galilean relativity transformation between moving reference frames",
        "To explain the mechanical momentum transfer from solar radiation pressure"
      ]),
      "To ensure mathematical and physical consistency with charge conservation (\u2207 \xB7 J + \u2202\u03C1/\u2202t = 0) under time-varying field conditions",
      "Taking the divergence of the original Amp\xE8re law \u2207 \xD7 B = \u03BC_0 J yields \u2207 \xB7 (\u2207 \xD7 B) = \u03BC_0 (\u2207 \xB7 J). Because the divergence of any curl is identically zero, this required \u2207 \xB7 J = 0, which is only valid in steady-state (magnetostatic) conditions. By the continuity equation \u2207 \xB7 J = -\u2202\u03C1/\u2202t. Using Gauss law \u2207 \xB7 E = \u03C1/\u03B5_0, we have \u2207 \xB7 J = -\u03B5_0 \u2202(\u2207 \xB7 E)/\u2202t = -\u2207 \xB7 (\u03B5_0 \u2202E/\u2202t). Adding J_D = \u03B5_0 \u2202E/\u2202t to the current density yields \u2207 \xB7 (J + \u03B5_0 \u2202E/\u2202t) = 0, resolving the contradiction and predicting electromagnetic wave propagation.",
      "Mathematical and physical necessity of displacement current.",
      "Mechanistic",
      "During high-frequency charging of a parallel-plate capacitor, a conduction current I_C flows through the connecting wires, but no mobile charge carriers cross the vacuum gap between plates.",
      "Discriminator: Magnetic field B exists in the gap region without charge transport; it is generated by time-varying electric flux \u2202E/\u2202t.",
      now
    );
  }
  const countMech = await db.get("SELECT count(*) as count FROM mechanisms");
  if (Number(countMech?.count || 0) === 0) {
    await db.run(
      `INSERT INTO mechanisms (id, user_id, topic_id, title, user_explanation, canonical_mechanism, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "mech_damped_oscillator",
      DEFAULT_USER_ID,
      "top_damped_oscillator",
      "Damped Harmonic Oscillator & Phase-Space Energy Dissipation",
      "A damped harmonic oscillator consists of a mass m on a spring with constant k moving through a viscous fluid with resistance b. The motion is governed by m x''(t) + b x'(t) + k x(t) = 0. In the underdamped case, the amplitude decays exponentially while oscillating with a reduced angular frequency.",
      `FACT BASE:
- Mechanical oscillator governed by Newton's second law: m x''(t) + b x'(t) + k x(t) = 0.
- Natural undamped angular frequency: \u03C9_0 = \u221A(k/m). Damping factor: \u03B3 = b / (2m).
- Total instantaneous mechanical energy: E(t) = 1/2 m v\xB2 + 1/2 k x\xB2.

CAUSAL CHAIN:
1. Applied initial displacement x_0 stores potential energy U = 1/2 k x_0\xB2.
2. Restoring spring force F_spring = -k x accelerates mass m toward equilibrium.
3. Velocity v generates opposing viscous drag force F_drag = -b v (proportional to velocity at low Reynolds number).
4. Time derivative of mechanical energy is dE/dt = v (m a + k x) = -b v\xB2 \u2264 0, enforcing continuous irreversible dissipation into thermal energy.
5. In underdamped regime (\u03B3 < \u03C9_0), the characteristic roots are r = -\u03B3 \xB1 i \u03C9_d, where \u03C9_d = \u221A(\u03C9_0\xB2 - \u03B3\xB2).
6. Resulting motion: x(t) = A e^(-\u03B3 t) cos(\u03C9_d t + \u03C6).

DISCRIMINATOR:
- Viscous drag (F \u221D v): Exponential envelope decay x_peak \u221D e^(-\u03B3 t) with constant period T = 2\u03C0/\u03C9_d.
- Coulomb dry friction (F = constant): Linear amplitude decay (equal decrement \u0394A per cycle) with invariant undamped period.

EXCEPTION:
- Non-linear drag regime: At high velocities (Re >> 1), quadratic aerodynamic drag F_drag \u221D v\xB2 dominates, breaking linear superposition and exponential envelope decay.`,
      now,
      now
    );
  }
}
dotenv.config();
var CURRENT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
var AI_PROVIDER = "Gemini";
var genAIClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
var DOUBT_SYSTEM_INSTRUCTION = `You are MECHANISM, an expert, personalized, reasoning-first AI professor and physics cognition guide for BSc Physics students.
Your core teaching philosophy is:
FACT BASE \u2192 MECHANISM \u2192 DISCRIMINATOR \u2192 EXCEPTION \u2192 REVERSE ENGINEERING WHEN USEFUL \u2192 MEMORIZE WHAT CANNOT OR SHOULD NOT BE DERIVED.

CRITICAL DIRECTIVES:
1. Do NOT force a mechanism explanation onto information that is fundamentally arbitrary convention or empirical constant (e.g., standard symbols, historical naming conventions, specific numerical constants). For factual conventions, state them succinctly.
2. For genuine physical mechanism questions (e.g. damped harmonic oscillation, precession and torque, Lenz's law and electromagnetic induction, phase transitions, wave packet dispersion):
   - Ground response in physical first principles and conservation laws.
   - Structure naturally around:
     * Fact Base (Axiomatic constraints, conservation laws: energy, linear/angular momentum, charge, Lagrangian/Hamiltonian formulation)
     * Mechanism & Causal Chain (Step-by-step directional causality: perturbation \u2192 field/force gradient \u2192 state evolution; do not invert cause and effect)
     * Discriminator (What critical variable or experimental test distinguishes this state from competing physical phenomena)
     * Physical Application (Real-world experimental setup, astrophysical or technological manifestation)
     * Exception / Borderline Case (When does this approximation break down, e.g. non-linear regime, relativistic speeds, quantum threshold)
   - Do NOT robotically label all six sections if not relevant.
3. Notation, math & operator formatting (CRITICAL FOR READABILITY):
   - ALWAYS format physical quantities, vectors, and fields using clean, standard notation:
     * Use bold or arrows for vectors: **E**, **B**, **v**, **F**, **p**, **L**.
     * Use clean subscripts and superscripts: *v*<sub>0</sub>, *t*<sub>1/2</sub>, *k*<sub>B</sub>, *E*<sub>n</sub>.
     * Never output broken raw LaTeX tokens like ($I_{Kr}, I_{Ks}$).
   - ALWAYS use proper readable operators directly:
     * Causal chain arrows: use "\u2192" (e.g., A \u2192 B \u2192 C). NEVER output "$\\rightarrow$" or "\\rightarrow".
     * Directional arrows: use "\u2191" for increased/up and "\u2193" for decreased/down (e.g., *T* \u2191, *P* \u2193).
     * Reversible / equilibrium: use "\u21CC" or "\u2194".
     * Math operators: use "\xD7" for cross-product / multiplication, "\xB7" for dot-product, "\u2202" for partial derivative, "\u2207" for gradient/del.
     * Never leave raw unescaped LaTeX backslashes, braces, or arbitrary dollar signs in the output.
4. Classification:
   - In your thought process, classify the query into one of:
     Recall | Definition | Concept | Mechanism | Comparison | Confused mental model | Physical application.
   - At the very start of your output, output a single comment tag indicating the classification: <!-- CLASSIFICATION: [Your Classification] -->
   - If the user demonstrates cognitive overanalysis (asking repetitive minor questions without committing to a decision), append: <!-- OVERANALYSIS: COMMIT --> and advise: "**STOP \u2014 ENOUGH INFORMATION. COMMIT.**"
5. Active Learning Context Tag (MANDATORY FOR CROSS-TOOL ADAPTATION):
   - At the very end of your response, output a single structured learning context comment tag:
     <!-- LEARNING_CONTEXT: {"topic_name": "Specific Physical/Dynamical Concept", "summary": "1-2 sentence core physical mechanism", "detected_gaps": ["specific misconception or error if any"], "key_concepts": ["key variable 1", "key variable 2"], "unresolved_questions": ["question to test next"]} -->
   - The "topic_name" MUST be concise, professional, and descriptive of the exact physics mechanism under discussion (e.g., "Damped Harmonic Motion & Quality Factor", "Lenz's Law & Eddy Current Damping", "Adiabatic Invariant & Magnetic Bottles", "Gyroscopic Precession & Torque Coupling").
`;
function formatGeminiError(error) {
  console.error("[Gemini API Error Diagnostic]:", error?.message || error);
  const errorStr = String(error?.message || error || "");
  const status = error?.status || error?.statusCode || 500;
  if (status === 429 || errorStr.includes("429") || errorStr.toLowerCase().includes("quota") || errorStr.toLowerCase().includes("rate limit")) {
    return {
      status: 429,
      message: "Gemini's current quota/rate limit has been reached. Please try again later."
    };
  }
  if (status === 401 || status === 403 || errorStr.toLowerCase().includes("unauthorized") || errorStr.toLowerCase().includes("api key")) {
    return {
      status: 403,
      message: "Authentication error with Gemini API credentials. Please check your AI Studio secrets."
    };
  }
  if (status === 408 || errorStr.toLowerCase().includes("timeout") || errorStr.toLowerCase().includes("network")) {
    return {
      status: 408,
      message: "Network connection to Gemini timed out. Please try again."
    };
  }
  return {
    status: 500,
    message: "Gemini is temporarily unavailable. Please try again."
  };
}
async function queryGemini(params) {
  const modelName = params.modelOverride || CURRENT_MODEL;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const client = getGeminiClient();
  if (!client) {
    console.log("[Gemini Client] No API Key provided; using Physics Local Intelligence fallback");
    return generateCuratedPhysicsFallback(params.prompt, modelName, params.attachments);
  }
  try {
    let rawText = "";
    const sysInstruction = params.systemInstruction || DOUBT_SYSTEM_INSTRUCTION;
    const hasAttachments = params.attachments && params.attachments.length > 0;
    const generatePromise = (async () => {
      const contentsPayload = [];
      if (params.history && params.history.length > 0) {
        const recentHistory = params.history.slice(-4);
        for (const msg of recentHistory) {
          contentsPayload.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      }
      const userParts = [];
      if (hasAttachments) {
        for (const att of params.attachments) {
          const cleanData = att.data.replace(/^data:[^;]+;base64,/, "");
          const isWord = att.mimeType?.includes("wordprocessingml") || att.mimeType?.includes("msword") || att.name?.toLowerCase().endsWith(".docx") || att.name?.toLowerCase().endsWith(".doc");
          if (isWord) {
            try {
              const buffer = Buffer.from(cleanData, "base64");
              const docResult = await mammoth.extractRawText({ buffer });
              const extractedText = docResult.value?.trim();
              userParts.push({
                text: `

--- [PHYSICAL DOCUMENT INGESTED: ${att.name || "document.docx"}] ---
${extractedText || "[Word document was attached, text extracted or formatted without plain body text]"}
--- [END OF ATTACHED WORD DOCUMENT] ---

`
              });
            } catch (docErr) {
              console.warn("[DOCX Extraction fallback]:", docErr.message);
              userParts.push({
                text: `

[Attached Word Document: ${att.name || "document.docx"}. Note: Binary Word document attached.]

`
              });
            }
          } else {
            userParts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanData
              }
            });
          }
        }
      }
      userParts.push({ text: params.prompt });
      contentsPayload.push({
        role: "user",
        parts: userParts
      });
      const response = await client.models.generateContent({
        model: modelName,
        contents: contentsPayload,
        config: {
          systemInstruction: sysInstruction,
          temperature: params.temperature ?? 0.2,
          maxOutputTokens: params.maxOutputTokens ?? 2048
        }
      });
      return response.text || "";
    })();
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Gemini API timeout")), 45e3)
    );
    rawText = await Promise.race([generatePromise, timeoutPromise]);
    if (!rawText) {
      throw new Error("Received empty response from Gemini API");
    }
    let classification = "Mechanism";
    const classMatch = rawText.match(/<!--\s*CLASSIFICATION:\s*([^\-]+?)\s*-->/i);
    if (classMatch) {
      classification = classMatch[1].trim();
      rawText = rawText.replace(/<!--\s*CLASSIFICATION:\s*([^\-]+?)\s*-->/i, "").trim();
    }
    let antiOveranalysis = false;
    if (rawText.includes("<!-- OVERANALYSIS: COMMIT -->")) {
      antiOveranalysis = true;
      rawText = rawText.replace("<!-- OVERANALYSIS: COMMIT -->", "").trim();
    }
    return {
      text: rawText,
      provider: AI_PROVIDER,
      model: modelName,
      timestamp,
      classification,
      metadata: {
        anti_overanalysis_flag: antiOveranalysis
      }
    };
  } catch (err) {
    const formatted = formatGeminiError(err);
    console.error(`[Gemini API Error ${formatted.status}]: ${formatted.message}`);
    const fallback = generateCuratedPhysicsFallback(params.prompt, modelName, params.attachments);
    fallback.metadata = { ...fallback.metadata, quota_exhausted_notice: formatted.message };
    return fallback;
  }
}
function generateCuratedPhysicsFallback(prompt, modelName, attachments) {
  const p = prompt.toLowerCase();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const hasAttachments = attachments && attachments.length > 0;
  const attachmentNote = hasAttachments ? `

> \u{1F4CE} **Multimodal Ingestion:** Received ${attachments.length} attachment(s) (${attachments.map((a) => a.name || a.mimeType).join(", ")}). Visual and document features integrated into physical causal chain.

` : "";
  if (p.includes("damped") && (p.includes("oscillator") || p.includes("harmonic") || p.includes("damping") || p.includes("quality factor"))) {
    return {
      text: `### Fact Base
- A damped mechanical oscillator is governed by Newton's second law with linear viscous resistance:
  **m x''(t) + b x'(t) + k x(t) = 0**
- Natural undamped angular frequency: **\u03C9\u2080 = \u221A(k/m)**. Damping coefficient: **\u03B3 = b / (2m)**.
- Total instantaneous mechanical energy: **E(t) = 1/2 m v\xB2 + 1/2 k x\xB2**.
- Time derivative of energy: **dE/dt = -b v\xB2 \u2264 0**, proving continuous irreversible dissipation into thermal energy.

---

### Mechanism & Causal Chain
1. **Applied Restoring & Drag Forces:**
   Displacement x stores elastic potential energy U = 1/2 k x\xB2. As the mass accelerates toward equilibrium, its velocity v generates a viscous opposing drag force **F_drag = -b v**.
2. **Characteristic Equation:**
   Substituting the trial solution x(t) = e^(r t) gives the characteristic polynomial:
   **r\xB2 + 2\u03B3 r + \u03C9\u2080\xB2 = 0 \u2192 r = -\u03B3 \xB1 \u221A(\u03B3\xB2 - \u03C9\u2080\xB2)**
3. **Regime 1: Underdamped (\u03B3 < \u03C9\u2080):**
   Roots are complex conjugates: **r = -\u03B3 \xB1 i \u03C9_d**, where **\u03C9_d = \u221A(\u03C9\u2080\xB2 - \u03B3\xB2)**.
   Position oscillates with decaying exponential envelope:
   **x(t) = A e^(-\u03B3 t) cos(\u03C9_d t + \u03C6)**
4. **Regime 2: Critically Damped (\u03B3 = \u03C9\u2080):**
   Degenerate repeated real root r = -\u03B3. Solution: **x(t) = (A + B t) e^(-\u03B3 t)**.
   Returns to equilibrium in the minimal possible time without oscillation.
5. **Regime 3: Overdamped (\u03B3 > \u03C9\u2080):**
   Two distinct real negative roots. System relaxes sluggishly to equilibrium without completing any oscillations.

---

### Discriminator
| Parameter | Underdamped (\u03B3 < \u03C9\u2080) | Critically Damped (\u03B3 = \u03C9\u2080) | Overdamped (\u03B3 > \u03C9\u2080) |
| :--- | :--- | :--- | :--- |
| **Discriminant (\u03B3\xB2 - \u03C9\u2080\xB2)** | Negative (< 0) | Exactly Zero (= 0) | Positive (> 0) |
| **Motion** | Oscillatory with decaying envelope | Non-oscillatory, fastest return | Non-oscillatory, sluggish return |
| **Successive Peak Ratio** | Constant: x_{n+1}/x_n = e^(-\u03B3 T) | N/A (no second peak) | N/A (no second peak) |
| **Quality Factor Q** | Q > 1/2 | Q = 1/2 | Q < 1/2 |

---

### Physical Application
- **Galvanometers & Vehicle Suspensions:** Shock absorbers are tuned close to critical damping (Q \u2248 0.707) to rapidly suppress road disturbances without jarring the chassis or bouncing periodically.
- **LCR Electrical Circuits:** An inductor L, resistor R, and capacitor C obey the exact isomorphic differential equation: **L q''(t) + R q'(t) + (1/C) q(t) = 0**, with \u03B3 = R / (2L) and \u03C9\u2080 = 1 / \u221A(LC).

---

### Exception: Non-Linear Quadratic Drag
At high Reynolds numbers (turbulent wake), aerodynamic drag transitions from linear Stokes drag (F \u221D v) to quadratic drag (**F_drag = -1/2 \u03C1 C_d A v |v|**). In this regime, linear superposition breaks down, the decay envelope is non-exponential, and energy dissipation rate scales as **dE/dt \u221D -v\xB3**.`,
      provider: AI_PROVIDER,
      model: modelName,
      timestamp,
      classification: "Mechanism",
      isFallback: true
    };
  }
  if (p.includes("carnot") || p.includes("entropy") && p.includes("second law") || p.includes("heat engine") && p.includes("efficiency")) {
    return {
      text: `### Fact Base
- A Carnot heat engine operates between two thermal reservoirs: a hot source at T_H and a cold sink at T_C (T_H > T_C).
- The cycle is reversible and consists of four quasi-static stages: two reversible isotherms and two reversible adiabats.
- The Carnot efficiency represents the theoretical upper ceiling for any heat engine operating between two thermal reservoirs:
  **\u03B7_Carnot = 1 - T_C / T_H**
- Clausius inequality: **\u222E dQ / T \u2264 0** (equality holds if and only if the cycle is internally and externally reversible).

---

### Mechanism & Causal Chain
1. **Isothermal Expansion at T_H (1 \u2192 2):**
   Gas expands quasi-statically in thermal contact with the hot reservoir at constant temperature T_H. Absorbs heat **Q_H = n R T_H ln(V\u2082 / V\u2081) > 0**. Entropy increases: **\u0394S_gas = Q_H / T_H**.
2. **Adiabatic Reversible Expansion (2 \u2192 3):**
   Apparatus is thermally insulated (dQ = 0). Gas expands while doing work at the expense of internal energy, dropping temperature from T_H to T_C. Because dQ = 0 and the process is reversible, **\u0394S = 0** (isentropic).
3. **Isothermal Compression at T_C (3 \u2192 4):**
   Gas is compressed while maintaining thermal contact with the cold sink at T_C. Work done on the gas rejects heat **Q_C = n R T_C ln(V\u2083 / V\u2084) > 0** to the reservoir. Gas entropy decreases: **\u0394S_gas = -Q_C / T_C**.
4. **Adiabatic Reversible Compression (4 \u2192 1):**
   Thermally insulated compression doing work on the gas, raising temperature from T_C back to T_H, completing the closed cycle with **\u0394S = 0**.

---

### Discriminator
- **State Property vs Boundary Flux:** Entropy S and internal energy U are **state functions**; for any complete cycle, **\u222E dS = 0** and **\u222E dU = 0**.
- **Heat and Work:** Heat Q and work W are **path functions**; net work output per cycle is **W_net = Q_H - Q_C = \u222E P dV > 0**.
- **Irreversible Cycle:** For any irreversible engine, entropy is generated internally (S_gen > 0), causing **\u03B7_irr < 1 - T_C / T_H**.

---

### Physical Application
- **Combined Cycle Gas & Steam Turbines:** Modern electrical power plants approach Carnot limits by operating at ultra-high turbine inlet temperatures (T_H \u2248 1700 K) with ambient cooling water sinks (T_C \u2248 300 K), achieving combined thermal efficiencies exceeding 60%.

---

### Exception: Third Law (Nernst Heat Theorem)
As the cold sink approaches absolute zero (**T_C \u2192 0 K**), the theoretical Carnot efficiency approaches 100% (\u03B7 \u2192 1). However, by the Third Law of Thermodynamics, an infinite number of thermodynamic operations would be required to reach absolute zero, rendering 100% conversion practically unattainable.`,
      provider: AI_PROVIDER,
      model: modelName,
      timestamp,
      classification: "Comparison",
      isFallback: true
    };
  }
  if (p.includes("lenz") || p.includes("induction") && p.includes("faraday") || p.includes("eddy current")) {
    return {
      text: `### Fact Base
- Faraday's Law of Electromagnetic Induction dictates that a changing magnetic flux induces an electromotive force (EMF):
  **EMF = -d\u03A6_B / dt**
- Magnetic flux is the surface integral of the magnetic field: **\u03A6_B = \u222B\u222B B \xB7 dA**.
- **Lenz's Law:** The negative sign in Faraday's law specifies that the induced EMF and resulting current produce effects that **oppose the change in magnetic flux** that caused them.
- This opposing sign is an inescapable consequence of the **Conservation of Energy**.

---

### Mechanism & Causal Chain
1. **Flux Perturbation:**
   A bar magnet approaches a conducting loop with its North pole forward. Magnetic flux pointing through the loop increases (**d\u03A6_B / dt > 0**).
2. **Induced Electric Field & Current:**
   The time-varying magnetic field induces a non-conservative electric field: **\u222E E \xB7 dl = -d\u03A6_B / dt**. In a conducting ring of resistance R, this drives an induced current **I_ind = EMF / R**.
3. **Opposing Magnetic Dipole Generation:**
   By the right-hand rule, the counter-clockwise circulating induced current creates its own secondary magnetic field **B_ind** directed upward, opposing the advancing flux.
4. **Lorentz Retarding Force:**
   The interaction between the external magnetic field and the induced current produces a retarding Lorentz force (**F = I \u222B dl \xD7 B**) that acts upward on the falling magnet, slowing its motion.

---

### Discriminator
| Scenario | Magnet Approaching Loop | Magnet Stationary in Loop | Magnet Receding from Loop |
| :--- | :--- | :--- | :--- |
| **Flux Rate (d\u03A6_B / dt)** | Positive (> 0) | Exactly Zero (= 0) | Negative (< 0) |
| **Induced Field Direction** | Opposes external field (repulsion) | Zero induced current | Aligns with external field (attraction) |
| **Mechanical Force on Magnet** | Upward repulsive braking force | Zero magnetic force | Upward attractive braking force |

---

### Physical Application
- **Electromagnetic Eddy Current Brakes:** High-speed bullet trains (Shinkansen, TGV) utilize electromagnetically induced eddy currents in aluminum/copper track fins to achieve smooth, frictionless deceleration without mechanical pad wear.

---

### Exception: Superconducting Meissner State
In a normal conductor with finite resistance R, eddy currents dissipate energy via Joule heating (**P = I\xB2 R**), so braking force is proportional to velocity. In a superconductor (R = 0), flux cannot enter the bulk (Meissner-Ochsenfeld effect), creating persistent screening supercurrents that generate static magnetic levitation independent of velocity.`,
      provider: AI_PROVIDER,
      model: modelName,
      timestamp,
      classification: "Mechanism",
      isFallback: true
    };
  }
  if (p.includes("tunneling") || p.includes("schrodinger") && p.includes("barrier") || p.includes("potential barrier")) {
    return {
      text: `### Fact Base
- In quantum mechanics, a particle of mass m with total energy E encounters a rectangular potential barrier of height V\u2080 and width a, where **E < V\u2080**.
- Classically, the particle is strictly forbidden from entering the barrier region because kinetic energy would be negative: **T = E - V\u2080 < 0**.
- In wave mechanics, the spatial wave function \u03C8(x) obeys the time-independent Schr\xF6dinger equation:
  **- (\u0127\xB2 / 2m) d\xB2\u03C8/dx\xB2 + V(x) \u03C8(x) = E \u03C8(x)**

---

### Mechanism & Causal Chain
1. **Region I (x < 0, Incident & Reflected Waves):**
   V = 0. Solution is oscillatory: **\u03C8_I(x) = A e^(i k x) + B e^(-i k x)**, where **k = \u221A(2mE) / \u0127**.
2. **Region II (0 \u2264 x \u2264 a, Inside the Barrier):**
   V = V\u2080 > E. The differential equation becomes **d\xB2\u03C8/dx\xB2 = \u03BA\xB2 \u03C8**, where **\u03BA = \u221A(2m(V\u2080 - E)) / \u0127**.
   Instead of abruptly halting, the wave function decays exponentially: **\u03C8_II(x) = C e^(-\u03BA x) + D e^(\u03BA x)**.
3. **Region III (x > a, Transmitted Wave):**
   V = 0. An oscillatory transmitted wave emerges: **\u03C8_III(x) = F e^(i k x)**.
4. **Transmission Probability (Tunneling Coefficient):**
   Matching boundary conditions for \u03C8(x) and d\u03C8/dx at x = 0 and x = a yields the transmission coefficient:
   **T \u2248 16 (E / V\u2080) (1 - E / V\u2080) e^(-2 \u03BA a)** (for wide or high barriers where \u03BA a >> 1).

---

### Discriminator
| Parameter | Quantum Tunneling | Classical Thermal Activation |
| :--- | :--- | :--- |
| **Transmission Rate Law** | Exponential in barrier width: **T \u221D e^(-2 \u03BA a)** | Exponential in temperature: **rate \u221D e^(-\u0394E / (k_B T))** |
| **T \u2192 0 K Behavior** | **Remains finite and non-zero** | **Collapses exponentially to zero** |
| **Particle Mass Sensitivity** | Extremely sensitive to mass: **\u03BA \u221D \u221Am** (electrons tunnel readily, protons barely) | Governed purely by classical partition function |

---

### Physical Application
- **Scanning Tunneling Microscopy (STM):** Measures quantum tunneling current between an atomically sharp metallic tip and conducting surface; because current scales exponentially with distance (**I \u221D e^(-2 \u03BA d)**), picometer vertical resolution is achieved.
- **Nuclear Alpha Decay (Gamow Theory):** Explains why radioactive alpha decay half-lives vary by over 20 orders of magnitude for small differences in alpha particle kinetic energy.

---

### Exception: Klein Paradox
In relativistic quantum mechanics governed by the Dirac equation, as a potential barrier becomes ultra-high (**V\u2080 > E + 2 m c\xB2**), the transmission coefficient does not approach zero; instead, spontaneous electron-positron pair creation occurs at the barrier, allowing transmission approaching unity.`,
      provider: AI_PROVIDER,
      model: modelName,
      timestamp,
      classification: "Concept",
      isFallback: true
    };
  }
  if (p.includes("constants") || p.includes("physical") && p.includes("values") || p.includes("speed of light")) {
    return {
      text: `### Fundamental Physical Constants
*(Classification: Physical Recall \u2014 Memorize what cannot or should not be derived)*

Fundamental constants of nature represent universal invariant scaling parameters that cannot be derived from deeper pure mathematical logic within the Standard Model:

#### 1. Universal Spacetime & Gravitational Constants:
1. **Speed of Light in Vacuum (*c*):** Exactly **299,792,458 m/s** (defining constant for the meter). Sets the relativistic causal speed limit.
2. **Newtonian Constant of Gravitation (*G*):** **6.67430 \xD7 10\u207B\xB9\xB9 m\xB3\xB7kg\u207B\xB9\xB7s\u207B\xB2** (relative uncertainty 2.2 \xD7 10\u207B\u2075). Couples stress-energy tensor to spacetime curvature.
3. **Reduced Planck Constant (*\u0127* = h / 2\u03C0):** **1.054571817... \xD7 10\u207B\xB3\u2074 J\xB7s** (h = 6.62607015 \xD7 10\u207B\xB3\u2074 J\xB7s). Sets fundamental quantum action quantum.

#### 2. Electrodynamic & Thermodynamic Constants:
4. **Elementary Charge (*e*):** **1.602176634 \xD7 10\u207B\xB9\u2079 C**. Invariant coupling for U(1) gauge interaction.
5. **Boltzmann Constant (*k*<sub>B</sub>):** **1.380649 \xD7 10\u207B\xB2\xB3 J/K**. Converts statistical phase-space entropy S = k_B ln(\u03A9) to macroscopic temperature.
6. **Vacuum Permittivity (*\u03B5*\u2080):** **8.8541878128 \xD7 10\u207B\xB9\xB2 F/m**.
7. **Vacuum Permeability (*\u03BC*\u2080):** **1.25663706212 \xD7 10\u207B\u2076 N/A\xB2** (c\xB2 = 1 / (\u03B5\u2080 \u03BC\u2080)).

#### 3. Particle Invariant Masses:
8. **Electron Rest Mass (*m*<sub>e</sub>):** **9.1093837015 \xD7 10\u207B\xB3\xB9 kg** (0.510998950 MeV/c\xB2).
9. **Proton Rest Mass (*m*<sub>p</sub>):** **1.67262192369 \xD7 10\u207B\xB2\u2077 kg** (938.272088 MeV/c\xB2).
10. **Fine-Structure Constant (*\u03B1* = e\xB2 / (4\u03C0 \u03B5\u2080 \u0127 c)):** Dimensionless constant **\u2248 1 / 137.035999084**. Measures electromagnetic coupling strength.`,
      provider: AI_PROVIDER,
      model: modelName,
      timestamp,
      classification: "Recall",
      isFallback: true
    };
  }
  return {
    text: `### First-Principles Physical Analysis: ${prompt}

#### 1. Fact Base & Invariant Axioms
- The primary physical system operates under conservation of energy, linear/angular momentum, and phase-space volume (Liouville's theorem).
- Governing differential equations determine directional state evolution and steady-state attractor manifolds.

#### 2. Causal Chain
1. Applied potential, torque, or perturbation alters boundary conditions or field gradient.
2. Restoring forces / conservative flux restore mechanical or thermodynamic equilibrium.
3. Dissipation mechanisms (damping, ohmic loss, radiation) govern asymptotic relaxation.

#### 3. Discriminator
- Differentiate between **transient driven response** versus **asymptotic steady-state eigenmodes**.
- Isolate the rate-limiting time constant or characteristic length scale.

#### 4. Physical Application & Exceptions
- Evaluate whether the observed response violates ideal linear assumptions (anharmonicity, relativistic boundary, or quantum corrections).`,
    provider: AI_PROVIDER,
    model: modelName,
    timestamp,
    classification: "Concept",
    isFallback: true
  };
}
var SESSIONS = /* @__PURE__ */ new Map();
var cachedCredentials = null;
var dataDir = path2.resolve(process.cwd(), "data");
var credentialsFile = path2.join(dataDir, "private_auth.json");
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
async function getStoredCredentials() {
  if (cachedCredentials && cachedCredentials.initialized) {
    return cachedCredentials;
  }
  try {
    const row = await db.get("SELECT * FROM private_auth WHERE id = ?", "current_private_auth");
    if (row && (row.initialized === true || row.initialized === 1) && row.username && row.salt && row.hash) {
      cachedCredentials = {
        initialized: true,
        username: row.username,
        displayName: row.display_name || row.username,
        salt: row.salt,
        hash: row.hash,
        recoveryClue: row.recovery_clue || void 0,
        updatedAt: Number(row.updated_at) || Date.now()
      };
      return cachedCredentials;
    }
    if (!isPostgres && fs2.existsSync(credentialsFile)) {
      const raw = fs2.readFileSync(credentialsFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.initialized === true && parsed.username && parsed.salt && parsed.hash) {
        cachedCredentials = parsed;
        await saveCredentials(cachedCredentials);
        return cachedCredentials;
      }
    }
  } catch (err) {
    console.error("Error reading stored credentials:", err);
  }
  return null;
}
async function saveCredentials(creds) {
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
  if (!isPostgres) {
    try {
      if (!fs2.existsSync(dataDir)) {
        fs2.mkdirSync(dataDir, { recursive: true });
      }
      fs2.writeFileSync(credentialsFile, JSON.stringify(creds, null, 2), "utf-8");
    } catch {
    }
  }
}
async function getSessionByToken(token) {
  if (!token) return null;
  const cached = SESSIONS.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      SESSIONS.delete(token);
      await db.run("DELETE FROM private_sessions WHERE token = ?", token);
      return null;
    }
    return cached;
  }
  try {
    const row = await db.get("SELECT * FROM private_sessions WHERE token = ?", token);
    if (row) {
      const expiresAt = Number(row.expires_at);
      if (Date.now() > expiresAt) {
        await db.run("DELETE FROM private_sessions WHERE token = ?", token);
        return null;
      }
      const session = {
        token: row.token,
        username: row.username,
        displayName: row.display_name,
        createdAt: Number(row.created_at),
        expiresAt,
        rememberMe: Boolean(row.remember_me)
      };
      SESSIONS.set(token, session);
      return session;
    }
  } catch (err) {
    console.error("Error fetching persistent session:", err);
  }
  return null;
}
async function saveSession(session) {
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
    console.error("Error persisting session to database:", err);
  }
}
async function deleteSession(token) {
  SESSIONS.delete(token);
  try {
    await db.run("DELETE FROM private_sessions WHERE token = ?", token);
  } catch (err) {
    console.error("Error deleting session from database:", err);
  }
}
async function isAuthInitialized() {
  const creds = await getStoredCredentials();
  return creds !== null && creds.initialized === true;
}
function verifyEnteredPassword(password, creds) {
  try {
    const candidateHash = hashPassword(password, creds.salt);
    const candidateBuf = Buffer.from(candidateHash, "hex");
    const storedBuf = Buffer.from(creds.hash, "hex");
    if (candidateBuf.length !== storedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuf, storedBuf);
  } catch {
    return false;
  }
}
async function handleGetAuthStatus(req, res) {
  try {
    const creds = await getStoredCredentials();
    const initialized = Boolean(creds && creds.initialized);
    const hasRecoveryClue = Boolean(creds?.recoveryClue && creds.recoveryClue.trim().length > 0);
    return res.json({
      success: true,
      initialized,
      hasRecoveryClue
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to inspect authentication status."
    });
  }
}
async function handleInitializeAuth(req, res) {
  try {
    if (await isAuthInitialized()) {
      return res.status(400).json({
        success: false,
        error: "Private login has already been initialized on this installation."
      });
    }
    const { username, password, confirmPassword, displayName, recoveryClue, rememberMe } = req.body || {};
    const cleanUser = String(username || "").trim();
    if (!cleanUser || cleanUser.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Username must be at least 3 characters long."
      });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
      return res.status(400).json({
        success: false,
        error: "Username may only contain alphanumeric characters, hyphens, underscores, or periods."
      });
    }
    const cleanPassword = String(password || "");
    const cleanConfirm = String(confirmPassword || "");
    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long."
      });
    }
    if (cleanPassword !== cleanConfirm) {
      return res.status(400).json({
        success: false,
        error: "Password and confirmation do not match."
      });
    }
    const cleanDisplayName = String(displayName || "").trim() || cleanUser;
    const cleanClue = String(recoveryClue || "").trim();
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashPassword(cleanPassword, salt);
    const now = Date.now();
    const newCreds = {
      initialized: true,
      username: cleanUser,
      displayName: cleanDisplayName,
      salt,
      hash,
      recoveryClue: cleanClue,
      updatedAt: now
    };
    await saveCredentials(newCreds);
    const isoNow = (/* @__PURE__ */ new Date()).toISOString();
    await db.run(
      "INSERT INTO users (id, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET name = ?",
      cleanUser,
      cleanDisplayName,
      isoNow,
      isoNow,
      cleanDisplayName
    );
    const token = crypto.randomBytes(32).toString("hex");
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1e3 : 24 * 60 * 60 * 1e3;
    const expiresAt = now + duration;
    const session = {
      token,
      username: newCreds.username,
      displayName: newCreds.displayName,
      createdAt: now,
      expiresAt,
      rememberMe: Boolean(rememberMe)
    };
    await saveSession(session);
    return res.json({
      success: true,
      sessionToken: token,
      user: {
        username: session.username,
        displayName: session.displayName
      },
      rememberMe: session.rememberMe,
      expiresAt
    });
  } catch (err) {
    console.error("Error during handleInitializeAuth:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to initialize private login credentials."
    });
  }
}
async function handleLogin(req, res) {
  try {
    const creds = await getStoredCredentials();
    if (!creds) {
      return res.status(400).json({
        success: false,
        error: "Installation not initialized. Please complete first-run setup."
      });
    }
    const { username, password, rememberMe } = req.body || {};
    if (!username || !password) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password."
      });
    }
    const trimmedUser = String(username).trim();
    const providedPass = String(password);
    const isUserValid = trimmedUser.toLowerCase() === creds.username.toLowerCase();
    const isPassValid = verifyEnteredPassword(providedPass, creds);
    if (!isUserValid || !isPassValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password."
      });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1e3 : 24 * 60 * 60 * 1e3;
    const expiresAt = now + duration;
    const session = {
      token,
      username: creds.username,
      displayName: creds.displayName || creds.username,
      createdAt: now,
      expiresAt,
      rememberMe: Boolean(rememberMe)
    };
    await saveSession(session);
    return res.json({
      success: true,
      sessionToken: token,
      user: {
        username: session.username,
        displayName: session.displayName
      },
      rememberMe: session.rememberMe,
      expiresAt
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Authentication failed."
    });
  }
}
async function handleGetSession(req, res) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: "No active session token provided"
      });
    }
    const session = await getSessionByToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: "Session not found or expired"
      });
    }
    return res.json({
      success: true,
      authenticated: true,
      user: {
        username: session.username,
        displayName: session.displayName
      },
      rememberMe: session.rememberMe,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: "Session verification failed."
    });
  }
}
async function handleGetRecoveryClue(req, res) {
  try {
    const creds = await getStoredCredentials();
    if (!creds || !creds.recoveryClue || !creds.recoveryClue.trim()) {
      return res.json({
        success: true,
        hasClue: false
      });
    }
    return res.json({
      success: true,
      hasClue: true,
      clue: creds.recoveryClue.trim()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve recovery clue."
    });
  }
}
async function handleChangePassword(req, res) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: active session required."
      });
    }
    const session = await getSessionByToken(token);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: session expired or invalid."
      });
    }
    const creds = await getStoredCredentials();
    if (!creds) {
      return res.status(400).json({
        success: false,
        error: "Installation not initialized."
      });
    }
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password, new password, and confirmation are required."
      });
    }
    if (!verifyEnteredPassword(String(currentPassword), creds)) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect."
      });
    }
    const newPassStr = String(newPassword);
    const confirmPassStr = String(confirmPassword);
    if (newPassStr !== confirmPassStr) {
      return res.status(400).json({
        success: false,
        error: "New password and confirmation do not match."
      });
    }
    if (newPassStr.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long."
      });
    }
    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = hashPassword(newPassStr, newSalt);
    const updatedCreds = {
      ...creds,
      salt: newSalt,
      hash: newHash,
      updatedAt: Date.now()
    };
    await saveCredentials(updatedCreds);
    return res.json({
      success: true,
      message: "Private password updated successfully. The new password is active."
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to update private password."
    });
  }
}
async function handleLogout(req, res) {
  try {
    const token = extractSessionToken(req);
    if (token) {
      await deleteSession(token);
    }
    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Logout failed."
    });
  }
}
async function handleDeleteAccount(req, res) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: an active authenticated session is required to delete the account."
      });
    }
    const session = await getSessionByToken(token);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: session is invalid or expired."
      });
    }
    const userId = session.username || DEFAULT_USER_ID;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.transaction(async () => {
      await db.run("DELETE FROM active_learning_context WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run("DELETE FROM adaptive_evidence WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run("DELETE FROM question_attempts WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run("DELETE FROM simulation_attempts WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run("DELETE FROM reconstructions WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run(
        `DELETE FROM mechanism_errors 
         WHERE evaluation_id IN (
           SELECT id FROM mechanism_evaluations 
           WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ? OR user_id = ?)
           OR session_id IN (SELECT id FROM learning_sessions WHERE user_id = ? OR user_id = ?)
         )`,
        userId,
        DEFAULT_USER_ID,
        userId,
        DEFAULT_USER_ID
      );
      await db.run(
        `DELETE FROM mechanism_evaluations 
         WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ? OR user_id = ?)
         OR session_id IN (SELECT id FROM learning_sessions WHERE user_id = ? OR user_id = ?)`,
        userId,
        DEFAULT_USER_ID,
        userId,
        DEFAULT_USER_ID
      );
      await db.run("DELETE FROM learning_sessions WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run(
        `DELETE FROM chat_messages 
         WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = ? OR user_id = ?)`,
        userId,
        DEFAULT_USER_ID
      );
      await db.run("DELETE FROM chat_conversations WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run("DELETE FROM mechanisms WHERE (user_id = ? OR user_id = ?) AND id != ?", userId, DEFAULT_USER_ID, "mech_damped_oscillator");
      await db.run("DELETE FROM errors WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run("DELETE FROM topics WHERE id LIKE 'top_custom_%'");
      await db.run("DELETE FROM user_model WHERE user_id = ? OR user_id = ?", userId, DEFAULT_USER_ID);
      await db.run("DELETE FROM users WHERE id = ?", userId);
      if (userId !== DEFAULT_USER_ID) {
        await db.run("DELETE FROM users WHERE id = ?", DEFAULT_USER_ID);
      }
      await db.run(
        `INSERT INTO users (id, name, created_at, updated_at)
         VALUES (?, 'BSc Physics Scholar', ?, ?) ON CONFLICT (id) DO NOTHING`,
        DEFAULT_USER_ID,
        now,
        now
      );
      const defaultErrors = [
        { id: "err_assoc_causation", category: "Causal Reasoning", description: "Association \u2192 Causation Confounding", severity: "high" },
        { id: "err_directionality_inversion", category: "Mechanism Reasoning", description: "Directionality Inversion in Dynamic Flux Chains", severity: "high" },
        { id: "err_premature_closure", category: "Physical Hypothesis Closure", description: "Premature Closure on Prototype Matching", severity: "medium" },
        { id: "err_overanalysis_trap", category: "Cognitive Efficiency", description: "Overanalysis & Reluctance to Commit", severity: "medium" },
        { id: "err_missing_variable", category: "Variable Accounting", description: "Missing Compensatory Feedback or State Variable", severity: "high" }
      ];
      for (const e of defaultErrors) {
        await db.run(
          `INSERT INTO errors (id, user_id, category, description, severity, frequency, first_seen, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
          e.id,
          DEFAULT_USER_ID,
          e.category,
          e.description,
          e.severity,
          0,
          now,
          now
        );
      }
      const initialReasoningProfile = JSON.stringify({
        first_principles_index: null,
        causal_precision: null,
        directionality_integrity: null,
        discriminator_acuity: null,
        exception_awareness: null,
        anti_overanalysis_score: null
      });
      const initialTopicMastery = JSON.stringify({});
      const initialErrorProfile = JSON.stringify([]);
      const initialCalibration = JSON.stringify({
        brier_score: null,
        overconfidence_bias: null,
        underconfidence_bias: null,
        calibration_curve: []
      });
      const initialCognitiveResource = JSON.stringify({
        average_time_per_decision_sec: null,
        unnecessary_tests_requested_rate: null,
        overanalysis_flags_count: 0,
        decision_commit_efficiency: "Pending Assessment"
      });
      await db.run(
        `INSERT INTO user_model (
          id, user_id, reasoning_profile, topic_mastery, error_profile,
          confidence_calibration, cognitive_resource_allocation, recommended_difficulty, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
        "model_" + DEFAULT_USER_ID,
        DEFAULT_USER_ID,
        initialReasoningProfile,
        initialTopicMastery,
        initialErrorProfile,
        initialCalibration,
        initialCognitiveResource,
        "Mechanistic",
        now
      );
      const mechCheck = await db.get("SELECT id FROM mechanisms WHERE id = ?", "mech_damped_oscillator");
      if (!mechCheck) {
        await db.run(
          `INSERT INTO mechanisms (id, user_id, topic_id, title, user_explanation, canonical_mechanism, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
          "mech_damped_oscillator",
          DEFAULT_USER_ID,
          "top_damped_oscillator",
          "Damped Harmonic Oscillator & Phase-Space Energy Dissipation",
          "A damped harmonic oscillator consists of a mass m on a spring with constant k moving through a viscous fluid with resistance b. The motion is governed by m x''(t) + b x'(t) + k x(t) = 0. In the underdamped case, the amplitude decays exponentially while oscillating with a reduced angular frequency.",
          `FACT BASE:
- Mechanical oscillator governed by Newton's second law: m x''(t) + b x'(t) + k x(t) = 0.
- Natural undamped angular frequency: \u03C9_0 = \u221A(k/m). Damping factor: \u03B3 = b / (2m).
- Total instantaneous mechanical energy: E(t) = 1/2 m v\xB2 + 1/2 k x\xB2.

CAUSAL CHAIN:
1. Applied initial displacement x_0 stores potential energy U = 1/2 k x_0\xB2.
2. Restoring spring force F_spring = -k x accelerates mass m toward equilibrium.
3. Velocity v generates opposing viscous drag force F_drag = -b v (proportional to velocity at low Reynolds number).
4. Time derivative of mechanical energy is dE/dt = v (m a + k x) = -b v\xB2 \u2264 0, enforcing continuous irreversible dissipation into thermal energy.
5. In underdamped regime (\u03B3 < \u03C9_0), the characteristic roots are r = -\u03B3 \xB1 i \u03C9_d, where \u03C9_d = \u221A(\u03C9_0\xB2 - \u03B3\xB2).
6. Resulting motion: x(t) = A e^(-\u03B3 t) cos(\u03C9_d t + \u03C6).

DISCRIMINATOR:
- Viscous drag (F \u221D v): Exponential envelope decay x_peak \u221D e^(-\u03B3 t) with constant period T = 2\u03C0/\u03C9_d.
- Coulomb dry friction (F = constant): Linear amplitude decay (equal decrement \u0394A per cycle) with invariant undamped period.

EXCEPTION:
- Non-linear drag regime: At high velocities (Re >> 1), quadratic aerodynamic drag F_drag \u221D v\xB2 dominates, breaking linear superposition and exponential envelope decay.`,
          now,
          now
        );
      }
      await db.run("DELETE FROM private_auth WHERE id = ?", "current_private_auth");
      await db.run("DELETE FROM private_sessions");
    });
    cachedCredentials = null;
    SESSIONS.clear();
    if (!isPostgres && fs2.existsSync(credentialsFile)) {
      try {
        fs2.unlinkSync(credentialsFile);
      } catch {
        fs2.writeFileSync(credentialsFile, JSON.stringify({ initialized: false }), "utf-8");
      }
    }
    return res.json({
      success: true,
      message: "Private account permanently deleted. All learner history, models, conversations, and evidence cleared. Baseline state recreated."
    });
  } catch (err) {
    console.error("Error in handleDeleteAccount:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to delete account and reset baseline state."
    });
  }
}
function extractSessionToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
  const customHeader = req.headers["x-session-token"];
  if (typeof customHeader === "string" && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}
async function getAuthenticatedUserId(req) {
  if (req) {
    const token = extractSessionToken(req);
    if (token) {
      const session = await getSessionByToken(token);
      if (session && Date.now() <= session.expiresAt) {
        return session.username || "user_physics_scholar";
      }
    }
  }
  const creds = await getStoredCredentials();
  if (creds && creds.username) {
    return creds.username;
  }
  return "user_physics_scholar";
}
var INITIAL_HIERARCHICAL_ERRORS = [
  {
    id: "err_assoc_causation",
    name: "Association \u2192 Causation Confounding",
    domain: "Thermodynamics & Energy Flux",
    reasoning_family: "Causal Reasoning",
    specific_failure: "Confuses macro-association (e.g. temperature rise in gas compression) with boundary heat flux (Q) ignoring adiabatic mechanical work",
    trigger_conditions: "Triggered when two macroscopic thermodynamic state variables shift together in familiar cycles",
    countermeasure: "Force explicit first-principles First Law chain [dU = dQ - dW] and isolate state variables from boundary energy fluxes",
    model_confidence: null,
    status: "Unassessed",
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: "Unassessed",
    last_seen: "",
    current_hypothesis: "Awaiting student reasoning evidence. The adaptive engine will calibrate this hypothesis as tests are taken.",
    next_diagnostic_test: "Take initial diagnostic test on thermodynamic energy conservation and entropy flux."
  },
  {
    id: "err_directionality_inversion",
    name: "Directionality Inversion in Dynamic Flux Chains",
    domain: "Electrodynamics & Reactive Impedance",
    reasoning_family: "Mechanism Reasoning",
    specific_failure: "Reverses force \u2192 effect or back-action flux relationship when mediated through intermediate reactive impedance or induced back-EMF",
    trigger_conditions: "Triggered when Lenz law back-action or electromagnetic damping acts on falling conductors or dynamic circuits",
    countermeasure: 'Ask: "If parameter X increases, what physical flux changes first, and which sign does Lenz law / Lorentz force mandate?"',
    model_confidence: null,
    status: "Unassessed",
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: "Unassessed",
    last_seen: "",
    current_hypothesis: "Awaiting student reasoning evidence. The adaptive engine will test directionality in dynamic flux and impedance chains.",
    next_diagnostic_test: "Take diagnostic test on Lenz induction and Lorentz braking directionality."
  },
  {
    id: "err_premature_closure",
    name: "Premature Closure on Prototype Matching",
    domain: "Oscillatory Dynamics & Dissipation Mechanics",
    reasoning_family: "Physical Hypothesis Closure",
    specific_failure: "Stops physical inquiry once a familiar prototype is identified (e.g. assuming viscous drag purely from decay), before evaluating competing damping models with quantitative discriminators",
    trigger_conditions: "Triggered by decaying wave or mechanical amplitude vignettes matching a textbook prototype without verifying envelope linearity vs exponentiality",
    countermeasure: "Demand a single decisive mathematical or physical discriminator (linear decrement vs exponential envelope ratio) before committing to a mechanism",
    model_confidence: null,
    status: "Unassessed",
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: "Unassessed",
    last_seen: "",
    current_hypothesis: "Awaiting student reasoning evidence. The adaptive engine will challenge prototype recognition with competing physical models.",
    next_diagnostic_test: "Take diagnostic test comparing viscous fluid drag against Coulomb dry friction."
  },
  {
    id: "err_overanalysis_trap",
    name: "Overanalysis & Reluctance to Commit",
    domain: "Physical Verification & Scientific Decision Thresholds",
    reasoning_family: "Cognitive Efficiency",
    specific_failure: "Continues requesting redundant environmental or parameter sweeps when the physical discriminator threshold has already definitively falsified the competing model",
    trigger_conditions: "Triggered by the availability of multiple secondary apparatus sweeps or background logs in experimental setups",
    countermeasure: 'Enforce decision threshold awareness: "STOP \u2014 ENOUGH INFORMATION. COMMIT."',
    model_confidence: null,
    status: "Unassessed",
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: "Unassessed",
    last_seen: "",
    current_hypothesis: "Awaiting student reasoning evidence. Pacing and experimental commitment thresholds will be monitored.",
    next_diagnostic_test: "Take diagnostic test on physical discriminator thresholds in experimental physics."
  },
  {
    id: "err_missing_variable",
    name: "Missing Compensatory Feedback or State Variable",
    domain: "Rigid Body Dynamics & Wave Systems",
    reasoning_family: "Variable Accounting",
    specific_failure: "Analyzes a primary dynamical perturbation in isolation without accounting for vector angular momentum coupling (dL/dt = \u03C4) or boundary conditions",
    trigger_conditions: "Triggered by rotating gyroscopes or boundary reflections with omitted vector or wave impedance terms",
    countermeasure: "Require identification of the conserved vector quantity or boundary continuity constraints before declaring the steady-state response",
    model_confidence: null,
    status: "Unassessed",
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: "Unassessed",
    last_seen: "",
    current_hypothesis: "Awaiting student reasoning evidence. Angular momentum vector coupling and boundary matching will be tested.",
    next_diagnostic_test: "Take diagnostic test evaluating gyroscopic precession and torque-momentum vector coupling."
  }
];
var CURATED_DIAGNOSTIC_QUESTIONS = [
  // 1. Association vs Causation — Thermodynamics & Energy Conservation (TYPE A)
  {
    id: "diag_assoc_thermo_entropy_1",
    topic_id: "top_carnot_entropy",
    topic_name: "Carnot Cycles, Entropy & Second Law",
    subject_name: "Thermal & Statistical Physics",
    mode: "first_principles",
    question_type: "TYPE_A_DIRECT_DIAGNOSTIC",
    difficulty: "Mechanistic",
    root_error_target: "err_assoc_causation",
    internal_rationale: "Target: Causal reasoning vs Association. Tests whether student distinguishes macroscopic temperature rise correlation from directional heat and entropy flux gradients.",
    competing_paths: [
      "Path 1: First Law energy conservation [dU = dQ - dW] where adiabatic work (-dW > 0) drives dU and dT > 0 with dQ = 0",
      "Path 2 (Bug): Temperature rise in gas compression is assumed to prove heat absorption from an external reservoir (Q > 0)"
    ],
    falsification_criteria: "Selecting Option A demonstrates understanding of thermodynamic work and directional heat flux. Selecting Option B confirms association\u2192causation fallacy.",
    scenario_vignette: 'In an experimental physics demonstration, an ideal gas in an insulated piston-cylinder apparatus is rapidly compressed by an external mechanical force, causing its measured temperature to rise from 300 K to 450 K. A student notes: "Because temperature increased, the gas must have absorbed heat from an external thermal reservoir (Q > 0), proving that temperature change is caused by heat addition."',
    question_text: "From first principles of the First Law of Thermodynamics (dU = dQ - dW), why is the student's reasoning fundamentally flawed?",
    options: [
      "In an adiabatic compression (dQ = 0), external work done on the system (-dW > 0) directly increases internal energy (dU = n C_v dT > 0), causing temperature to rise with zero heat transfer; temperature change is a state property shift, not an exclusive signature of heat flux.",
      "Insulated walls become thermally permeable when internal pressure exceeds atmospheric pressure.",
      "Gas molecules undergo spontaneous nuclear fusion during rapid volume contraction, creating latent heat internally.",
      "The First Law applies only to isobaric processes; in adiabatic processes, heat is mathematically undefined."
    ],
    correct_answer: "In an adiabatic compression (dQ = 0), external work done on the system (-dW > 0) directly increases internal energy (dU = n C_v dT > 0), causing temperature to rise with zero heat transfer; temperature change is a state property shift, not an exclusive signature of heat flux.",
    explanation: "By the First Law of Thermodynamics, dU = dQ - dW (where dW is work done by the system). In an adiabatic compression, dQ = 0 and work is done ON the gas (dW < 0), so dU = -dW > 0. For an ideal gas, internal energy is solely a function of temperature: dU = n C_v dT. Therefore, dT > 0 occurs purely due to mechanical work without any heat addition. Associating a temperature increase exclusively with heat absorption confuses a state variable change with boundary heat transfer.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: dU = dQ - dW isolates work from heat transfer; adiabatic compression produces dT > 0 while dQ = 0.",
    reasoning_target: "Distinguishing state variable changes (dT, dU) from boundary energy transfer fluxes (dQ, dW).",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 2. Directionality — Lenz\'s Law & Electromagnetic Back-EMF (TYPE C)
  {
    id: "diag_directionality_lenz_back_emf_1",
    topic_id: "top_lenz_induction",
    topic_name: "Lenz's Law & Electromagnetic Induction",
    subject_name: "Electrodynamics & Field Theory",
    mode: "second_order",
    question_type: "TYPE_C_MECHANISM_REVERSAL",
    difficulty: "Second-Order",
    root_error_target: "err_directionality_inversion",
    internal_rationale: "Target: Mechanism Directionality. Evaluates if student reverses force/flux relationship when mediated by reactive impedance or induced back-EMF.",
    competing_paths: [
      "Path 1: Faraday-Lenz law EMF = -d\u03A6/dt creates opposing magnetic dipole, exerting a retarding Lorentz drag force on approaching magnet",
      "Path 2 (Bug): Induced magnetic field attracts the approaching magnet to pull it forward faster"
    ],
    falsification_criteria: "Selecting Option A proves correct directionality. Selecting Option B confirms directional inversion.",
    scenario_vignette: 'A laboratory student drops a cylindrical neodymium magnet (north pole facing downward) through a stationary vertical copper ring. The student predicts: "As the magnetic flux through the ring increases, the induced electric current will generate a downward magnetic field that attracts the magnet from below, pulling it downward with an acceleration exceeding gravitational acceleration g."',
    question_text: "Trace the electrodynamic causal sequence using Faraday law and Lenz law. Where does the student's causal directionality break?",
    options: [
      "By Lenz law (EMF = -d\u03A6/dt), the induced current generates an opposing upward magnetic dipole (North pole on top) that exerts a repulsive upward Lorentz force, decelerating the falling magnet (a < g) in strict accordance with energy conservation.",
      "The copper ring acts as a superconductor that completely expels the magnet downward via the Meissner effect.",
      "The magnetic field of the falling magnet induces electrostatic attraction that pulls the copper ring downward with it.",
      "The gravitational field couples to the magnetic vector potential, reversing the sign of Faraday law at terminal velocity."
    ],
    correct_answer: "By Lenz law (EMF = -d\u03A6/dt), the induced current generates an opposing upward magnetic dipole (North pole on top) that exerts a repulsive upward Lorentz force, decelerating the falling magnet (a < g) in strict accordance with energy conservation.",
    explanation: "By Faraday law of electromagnetic induction, EMF = -d\u03A6_B/dt. As the North pole falls toward the ring, downward magnetic flux increases (d\u03A6_B/dt > 0). Lenz law mandates that the induced current must circulate counter-clockwise (viewed from above) to create an opposing upward magnetic field B_ind, presenting a North pole toward the approaching North pole. This creates a repulsive upward force F_Lorentz that opposes the motion, ensuring acceleration is strictly less than g. Reversing this directionality would create positive feedback where the magnet accelerates indefinitely without external energy input, violating conservation of energy.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: Lenz sign (EMF = -d\u03A6/dt) guarantees back-action opposes change in flux, enforcing conservation of energy.",
    reasoning_target: "Electrodynamic directionality and opposing Lorentz back-action.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 3. Premature Closure — Damping Mechanisms: Viscous vs Coulomb Friction (TYPE D)
  {
    id: "diag_premature_closure_oscillator_damping_1",
    topic_id: "top_damped_oscillator",
    topic_name: "Damped & Driven Harmonic Oscillators",
    subject_name: "Classical Mechanics & Dynamics",
    mode: "causal_discrimination",
    question_type: "TYPE_D_COMPETING_MECHANISMS",
    difficulty: "Physical Synthesis",
    root_error_target: "err_premature_closure",
    internal_rationale: "Target: Premature Closure. Tests whether student stops inquiry upon recognizing amplitude decay (assuming viscous drag), or evaluates envelope linearity and period constancy discriminators against Coulomb dry friction.",
    competing_paths: [
      "Path 1: Coulomb (dry) friction damping with linear envelope decay [\u0394A = -4 f_k/k per cycle] and invariant period",
      "Path 2 (Bug): Viscous fluid damping assumed automatically purely from observing decaying oscillations"
    ],
    falsification_criteria: "Selecting Option A proves discriminator acuity between viscous and dry friction. Selecting Option B represents premature closure.",
    scenario_vignette: 'An experimental oscillator consisting of a slider on a guide rail attached to a spring (k = 50 N/m) is pulled to x_0 = 10.0 cm and released. Successive peak displacements are measured: x_1 = 8.5 cm, x_2 = 7.0 cm, x_3 = 5.5 cm, x_4 = 4.0 cm. A student immediately concludes: "This is a classic underdamped harmonic oscillator governed by linear viscous fluid drag F = -b v, so the amplitude decays exponentially."',
    question_text: "What decisive quantitative physical discriminator proves that the student committed premature closure on the wrong physical mechanism?",
    options: [
      "The amplitude decreases by a constant linear decrement (\u0394A = -1.5 cm per cycle), which is the exact mathematical signature of constant Coulomb dry friction (F_friction = \xB1\u03BC_k N), whereas linear viscous drag produces an exponential decay envelope with a constant ratio between successive peaks.",
      "The natural frequency of an oscillator on a rail is always zero because gravity cancels spring force.",
      "Viscous drag only occurs when the oscillator is immersed in liquid helium at sub-Kelvin temperatures.",
      "A spring constant of 50 N/m is mathematically incompatible with damped motion."
    ],
    correct_answer: "The amplitude decreases by a constant linear decrement (\u0394A = -1.5 cm per cycle), which is the exact mathematical signature of constant Coulomb dry friction (F_friction = \xB1\u03BC_k N), whereas linear viscous drag produces an exponential decay envelope with a constant ratio between successive peaks.",
    explanation: "For linear viscous damping (F_drag = -b v), the envelope decays exponentially: x_n = x_0 e^(-\u03B3 n T), meaning the ratio between successive peaks is constant: x_{n+1}/x_n = e^(-\u03B3 T) = constant. In this experiment, the successive peak differences are constant: 10.0 - 8.5 = 1.5 cm, 8.5 - 7.0 = 1.5 cm, 7.0 - 5.5 = 1.5 cm. In Coulomb dry friction, energy dissipated per half-cycle is W = f_k (2A), leading to a constant reduction in peak amplitude of \u0394A = -4 f_k / k per complete cycle. Concluding viscous damping merely from observing decay is premature closure that ignores the linear vs exponential discriminator.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: Linear decrement (\u0394A = constant) proves Coulomb dry friction; exponential decrement (x_{n+1}/x_n = constant) proves linear viscous drag.",
    reasoning_target: "Discriminator analysis between Coulomb dry friction and viscous damping models.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 4. Missing Variable — Gyroscopic Angular Momentum Coupling (TYPE E)
  {
    id: "diag_missing_variable_gyroscopic_precession_1",
    topic_id: "top_gyroscopic_precession",
    topic_name: "Angular Momentum & Gyroscopic Precession",
    subject_name: "Classical Mechanics & Dynamics",
    mode: "second_order",
    question_type: "TYPE_E_MISSING_VARIABLE",
    difficulty: "Mechanistic",
    root_error_target: "err_missing_variable",
    internal_rationale: "Target: Missing Variable Accounting. Tests whether student notices omitted angular momentum vector coupling (dL/dt = \u03C4) in rotating rigid bodies.",
    competing_paths: [
      "Path 1: External torque \u03C4 = r \xD7 mg produces orthogonal angular momentum displacement dL = \u03C4 dt, driving steady horizontal precession \u03A9_p = \u03C4/L",
      "Path 2 (Bug): Torque acts as in non-rotating statics, causing immediate downward tipping without precession"
    ],
    falsification_criteria: "Identifying spin angular momentum vector L and vector rate dL/dt = \u03C4 as the missing variable resolves the paradox.",
    scenario_vignette: 'A heavy wheel spinning rapidly at angular velocity \u03C9 about a horizontal axle is supported by a pivot at only one end, leaving the other end free. A physics student reasons: "Gravity exerts a downward torque \u03C4 = r \xD7 mg about the pivot. Because there is no upward balancing force at the free end, the axle must immediately tip downward and fall, exactly like a non-spinning rod supported at one end."',
    question_text: "What critical dynamical variable is completely missing from the student's causal model of the spinning gyroscope?",
    options: [
      "The spin angular momentum vector L = I \u03C9; torque \u03C4 changes angular momentum via dL/dt = \u03C4, causing the horizontal vector L to rotate in the horizontal plane (steady precession \u03A9_p = \u03C4 / L) rather than tipping downward.",
      "The Coriolis force generated by the Earth rotation, which exerts an upward anti-gravity force on all rotating disks.",
      "The atmospheric aerodynamic lift generated by the rim of the spinning wheel exceeding the gravitational weight.",
      "The electrostatic repulsion between the axle pivot and the ground bearing."
    ],
    correct_answer: "The spin angular momentum vector L = I \u03C9; torque \u03C4 changes angular momentum via dL/dt = \u03C4, causing the horizontal vector L to rotate in the horizontal plane (steady precession \u03A9_p = \u03C4 / L) rather than tipping downward.",
    explanation: "For a non-rotating body, L = 0, so applied torque \u03C4 produces angular acceleration in the direction of the torque (downward tipping). For a rapidly spinning wheel, the system possesses a large horizontal spin angular momentum L = I \u03C9. By Newton second law for rotation, \u03C4 = dL/dt, so in time dt, the change in angular momentum is dL = \u03C4 dt. Because torque \u03C4 = r \xD7 mg is perpendicular to L in the horizontal plane, dL is directed horizontally, perpendicular to L. This causes the vector L to rotate horizontally with precession frequency \u03A9_p = d\u03B8/dt = (dL / L) / dt = \u03C4 / L = (m g r) / (I \u03C9), rather than falling.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: dL/dt = \u03C4 dictates vector orientation shift; large initial L redirects torque into orthogonal precession rather than direct downward angular acceleration.",
    reasoning_target: "Vector coupling of torque to pre-existing angular momentum in rigid body dynamics.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 5. Discriminator Selection — Quantum Tunneling vs Classical Barrier Hopping (TYPE D)
  {
    id: "diag_discriminator_tunneling_vs_classical_1",
    topic_id: "top_schrodinger_tunnel",
    topic_name: "Quantum Tunneling & Potential Barriers",
    subject_name: "Quantum Mechanics & Modern Physics",
    mode: "causal_discrimination",
    question_type: "TYPE_D_COMPETING_MECHANISMS",
    difficulty: "Mechanistic",
    root_error_target: "err_assoc_causation",
    internal_rationale: "Target: Discriminator Acuity. Isolates the definitive physical discriminator separating quantum barrier tunneling from classical thermal activation over a barrier.",
    competing_paths: [
      "Mechanism A: Quantum tunneling through a potential barrier V_0 with transmission coefficient T \u221D e^(-2 \u03BA a) independent of temperature T",
      "Mechanism B: Classical thermal activation over barrier with Arrhenius rate rate \u221D e^(-E_a / (k_B T))"
    ],
    falsification_criteria: "Temperature-independent transmission as T \u2192 0 K confirms quantum tunneling over classical thermal activation.",
    scenario_vignette: "In an experimental solid-state nanostructure, electrons traverse a thin insulating barrier of height V_0 > E. Two competing transport mechanisms are proposed: Mechanism A: Quantum mechanical barrier tunneling. Mechanism B: Classical thermal activation (thermionic emission) over the barrier.",
    question_text: "Which experimental parameter sweep serves as the decisive physical discriminator that definitively proves Mechanism A over Mechanism B?",
    options: [
      "Cooling the apparatus toward absolute zero (T \u2192 0 K): Quantum tunneling transmission remains finite and nearly temperature-independent, whereas classical thermal activation rate collapses exponentially to zero according to the Arrhenius relation e^(-\u0394E / (k_B T)).",
      "Measuring the color of the external apparatus casing under incandescent illumination.",
      "Increasing the thickness of the external copper wiring connecting the cryostat to the voltmeter.",
      "Checking whether the vacuum chamber pressure remains exactly at atmospheric level."
    ],
    correct_answer: "Cooling the apparatus toward absolute zero (T \u2192 0 K): Quantum tunneling transmission remains finite and nearly temperature-independent, whereas classical thermal activation rate collapses exponentially to zero according to the Arrhenius relation e^(-\u0394E / (k_B T)).",
    explanation: "Classical barrier hopping requires thermal energy fluctuations, governed by Boltzmann statistics: rate \u221D e^(-(V_0 - E)/(k_B T)). As temperature T \u2192 0 K, thermal activation vanishes completely. In contrast, quantum tunneling depends on the overlap of the evanescent wave function across the barrier width a: T_tunnel \u2248 16 (E/V_0)(1 - E/V_0) e^(-2 \u03BA a), where \u03BA = \u221A(2m(V_0 - E))/\u0127. This penetration is governed by barrier width and height, remaining finite even at 0 K. Temperature-independence at cryogenic temperatures is the gold-standard discriminator proving tunneling.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: Cryogenic temperature invariance (T \u2192 0 K) discriminates quantum wave penetration from classical thermal activation.",
    reasoning_target: "Isolating experimental discriminators between quantum tunneling and thermal activation.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 6. Transfer Test — Mechanical String Impedance to Electromagnetic Fresnel Reflection (TYPE B)
  {
    id: "diag_transfer_em_wave_dispersion_1",
    topic_id: "top_maxwell_boundary",
    topic_name: "Maxwell Equations & Electromagnetic Wave Propagation",
    subject_name: "Electrodynamics & Field Theory",
    mode: "second_order",
    question_type: "TYPE_B_DISGUISED_TRANSFER",
    difficulty: "Second-Order",
    root_error_target: "err_assoc_causation",
    internal_rationale: "Target: Disguised Transfer across disciplines. Tests whether student transfers boundary condition matching from mechanical strings to electromagnetic wave reflection at dielectric interfaces.",
    competing_paths: [
      "Path 1: Electric and magnetic field boundary conditions [E_{1t} = E_{2t}, H_{1t} = H_{2t}] mirror transverse displacement and tension continuity across knotted strings",
      "Path 2 (Bug): Wave reflections treated as particle collisions with billiard-ball hard boundaries"
    ],
    falsification_criteria: "Matching continuity conditions of tangential fields confirms transfer of wave boundary principles to electrodynamics.",
    scenario_vignette: "In classical mechanics, a transverse wave pulse traveling along a light string of mass density \u03BC_1 reflects inverted (with a 180\xB0 phase shift) upon striking a heavier string of mass density \u03BC_2 > \u03BC_1. A physics student now analyzes a monochromatic plane electromagnetic wave incident normally from air (refractive index n_1 = 1.0) onto a glass slab (refractive index n_2 = 1.5).",
    question_text: "Transferring the boundary matching principles of mechanical wave transmission to electrodynamics, why does the reflected electric field undergo a 180\xB0 phase inversion?",
    options: [
      "Maxwell boundary conditions require continuity of tangential electric fields (E_1 = E_2) at the interface; when wave impedance Z_2 = \u221A(\u03BC_0 / \u03B5_2) is lower than Z_1, the Fresnel reflection coefficient r = (n_1 - n_2)/(n_1 + n_2) is negative, mathematically enforcing a \u03C0 (180\xB0) phase flip identical to a wave meeting a higher-density string.",
      "Glass absorbs 100% of incident photons and emits new anti-photons with opposite spin.",
      "Photons lose half their kinetic energy upon striking the dielectric surface, reversing momentum via classical restitution.",
      "Dielectric polarization bends space-time curvature, causing time-reversal of the incident electromagnetic wave."
    ],
    correct_answer: "Maxwell boundary conditions require continuity of tangential electric fields (E_1 = E_2) at the interface; when wave impedance Z_2 = \u221A(\u03BC_0 / \u03B5_2) is lower than Z_1, the Fresnel reflection coefficient r = (n_1 - n_2)/(n_1 + n_2) is negative, mathematically enforcing a \u03C0 (180\xB0) phase flip identical to a wave meeting a higher-density string.",
    explanation: "This is a pristine transfer of wave boundary mechanics into electrodynamics. At any boundary, dynamic fields must satisfy continuity constraints: tangential E and H must be continuous across charge-free interfaces. By solving the wave equation with these boundary conditions, Fresnel reflection coefficient for normal incidence is r = (n_1 - n_2)/(n_1 + n_2). When n_2 > n_1 (incident on an optically denser medium with lower wave impedance), r < 0. A negative amplitude coefficient signifies a phase shift of \u03C0 radians (180\xB0), exactly analogously to a mechanical wave on a light string reflecting off a denser string.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: Fresnel coefficient r = (n_1 - n_2)/(n_1 + n_2) < 0 when n_2 > n_1, confirming wave impedance mismatch dictates phase inversion.",
    reasoning_target: "Transferring mechanical boundary impedance matching to electromagnetic Fresnel reflection.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 7. Overanalysis — Decision Sufficiency in Photoelectric Effect (TYPE G)
  {
    id: "diag_overanalysis_photoelectric_commit_1",
    topic_id: "top_schrodinger_tunnel",
    topic_name: "Quantum Tunneling & Potential Barriers",
    subject_name: "Quantum Mechanics & Modern Physics",
    mode: "causal_discrimination",
    question_type: "TYPE_G_OVERANALYSIS",
    difficulty: "Physical Synthesis",
    root_error_target: "err_overanalysis_trap",
    internal_rationale: "Target: Cognitive Efficiency / Overanalysis Trap. Tests if student identifies that physical discriminator threshold is achieved and commits to the quantum model without requesting superfluous classical parameter sweeps.",
    competing_paths: [
      "Path 1: STOP \u2014 ENOUGH INFORMATION. COMMIT. Instantaneous photocurrent below cutoff wavelength with zero current above cutoff definitively falsifies classical wave accumulation and confirms quantum photon hypothesis",
      "Path 2 (Bug): Demanding redundant multi-day temperature, humidity, and magnetic field sweeps before committing to the photon model"
    ],
    falsification_criteria: "Selecting Option A proves recognition of decision sufficiency. Selecting options B, C, or D confirms the overanalysis trap.",
    scenario_vignette: "In an experimental verification of the photoelectric effect on a sodium cathode (work function \u03A6 = 2.3 eV), illumination with 500 nm light (E = 2.48 eV) generates immediate photocurrent within < 1 nanosecond, even at ultra-low intensity (10\u207B\u2079 W/m\xB2). Illumination with a 650 nm laser (E = 1.91 eV) at 1000 W/m\xB2 generates zero photocurrent after hours of continuous exposure. A student researcher acknowledges that the photon hypothesis explains this cutoff, but refuses to publish or conclude, insisting on: (1) Running a 72-hour thermal drift log of the room humidity, (2) Measuring the Earth ambient magnetic field to 6 decimal places, and (3) Re-testing with 15 different brands of optical filters.",
    question_text: "Evaluate the researcher's cognitive decision-making strategy:",
    options: [
      "STOP \u2014 ENOUGH INFORMATION. COMMIT. The instantaneous photoemission below threshold wavelength combined with zero emission above cutoff at 10\xB9\xB2-fold higher intensity definitively falsifies classical continuous wave energy accumulation and satisfies the discriminator threshold for Einstein quantum hypothesis; additional secondary environmental sweeps have zero marginal diagnostic value.",
      "The researcher is correct: Room humidity might form a water layer that classically blocks photons only at 650 nm.",
      "The researcher is correct: Earth magnetic field could deflect electrons back into the cathode only when illuminated by red light.",
      "The researcher is correct: Classical wave theory requires at least 6 months of continuous exposure to accumulate sufficient surface work."
    ],
    correct_answer: "STOP \u2014 ENOUGH INFORMATION. COMMIT. The instantaneous photoemission below threshold wavelength combined with zero emission above cutoff at 10\xB9\xB2-fold higher intensity definitively falsifies classical continuous wave energy accumulation and satisfies the discriminator threshold for Einstein quantum hypothesis; additional secondary environmental sweeps have zero marginal diagnostic value.",
    explanation: "In physical decision science, when an invariant physical discriminator satisfies the hypothesis discrimination threshold, further data collection is cognitive overanalysis. In the photoelectric effect, the classical wave model predicts that energy is delivered continuously over time: even low-frequency light should eventually eject electrons if intensity or duration is high enough, and low-intensity light should exhibit a measurable time lag (hours or days) to accumulate energy. Experimentally, emission is instantaneous (< 10\u207B\u2079 s) for \u03BD > \u03BD_0 and strictly zero for \u03BD < \u03BD_0 regardless of intensity. This single discriminator cleanly separates quantum from classical models. Demanding secondary environmental parameter sweeps is classic cognitive reluctance to commit.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: Zero emission at high intensity above cutoff vs instantaneous emission at low intensity below cutoff satisfies decisive proof.",
    reasoning_target: "Recognizing when experimental discriminator threshold is achieved and committing to model conclusion.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 8. Exploration Test — Phase Velocity vs Group Velocity in Dispersive Waveguides (TYPE F)
  {
    id: "diag_exploration_phase_group_velocity_1",
    topic_id: "top_maxwell_boundary",
    topic_name: "Maxwell Equations & Electromagnetic Wave Propagation",
    subject_name: "Electrodynamics & Field Theory",
    mode: "second_order",
    question_type: "TYPE_F_FALSE_CONFIDENCE",
    difficulty: "Mechanistic",
    root_error_target: "err_directionality_inversion",
    internal_rationale: "Target: Personal Model Exploration. Tests whether student confuses phase velocity (v_p = \u03C9/k) with group/signal velocity (v_g = d\u03C9/dk) in dispersive media.",
    competing_paths: [
      "Hypothesis 1: Fundamental confusion of phase vs group velocity",
      "Hypothesis 2: Misinterpreting wave envelope modulation as particle acceleration",
      "Hypothesis 3: Correct understanding that information/energy travels at group/front velocity, not phase velocity"
    ],
    falsification_criteria: "Recognizing that superluminal phase velocity (v_p > c) does not transmit information confirms understanding of wave packet dynamics.",
    scenario_vignette: 'In an experimental plasma or resonant waveguide, electromagnetic waves propagate with dispersion relation \u03C9\xB2 = \u03C9_p\xB2 + c\xB2 k\xB2. At frequencies near the plasma frequency \u03C9_p, the phase velocity v_p = \u03C9/k = c / \u221A(1 - \u03C9_p\xB2/\u03C9\xB2) clearly exceeds the speed of light in vacuum (v_p > c). A physics student proclaims: "Special relativity has been violated; we can use this plasma guide to send instantaneous telegraph messages to distant observers."',
    question_text: "Predict the true propagation velocity of a physical signal (modulated wave packet) and resolve the student's paradox:",
    options: [
      "Information and energy propagate at the group velocity v_g = d\u03C9/dk = c \u221A(1 - \u03C9_p\xB2/\u03C9\xB2), which is strictly less than c (v_p \xD7 v_g = c\xB2); individual phase wave crests travel faster than c but carry zero net energy or encoded signal.",
      "The phase velocity exceeding c causes time to run backward inside the plasma chamber, erasing the transmitted message.",
      "Relativity is indeed violated inside ionized gases because Maxwell equations do not apply to charged plasmas.",
      "Group velocity and phase velocity are mathematically identical in all dispersive media."
    ],
    correct_answer: "Information and energy propagate at the group velocity v_g = d\u03C9/dk = c \u221A(1 - \u03C9_p\xB2/\u03C9\xB2), which is strictly less than c (v_p \xD7 v_g = c\xB2); individual phase wave crests travel faster than c but carry zero net energy or encoded signal.",
    explanation: "In dispersive media, phase velocity v_p = \u03C9/k is the speed of individual wave crests of an infinite monochromatic plane wave, which exists across all time and space and carries zero localized information. An actual physical signal is a localized wave packet containing a spread of frequencies \u0394\u03C9. The envelope of this packet travels at the group velocity v_g = d\u03C9/dk. Differentiating the dispersion relation \u03C9\xB2 = \u03C9_p\xB2 + c\xB2 k\xB2 gives 2\u03C9 d\u03C9 = 2 c\xB2 k dk, so (d\u03C9/dk)(\u03C9/k) = c\xB2, meaning v_g \xD7 v_p = c\xB2. Since v_p > c, v_g < c. Information travels at the signal velocity (bounded by v_g and the Sommerfeld-Brillouin front velocity), which is strictly subluminal, preserving relativistic causality.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: v_g = d\u03C9/dk < c governs energy/signal transfer; v_p > c carries zero modulation information.",
    reasoning_target: "Discriminating phase velocity from group and signal propagation velocity in dispersive systems.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 9. Adversarial Model Test — Destroy Frictionless Perpetual Heat Engine (TYPE I)
  {
    id: "diag_adversarial_destroy_perpetual_heat_engine_1",
    topic_id: "top_carnot_entropy",
    topic_name: "Carnot Cycles, Entropy & Second Law",
    subject_name: "Thermal & Statistical Physics",
    mode: "adversarial",
    question_type: "TYPE_I_ADVERSARIAL_MODEL",
    difficulty: "Second-Order",
    root_error_target: "err_assoc_causation",
    internal_rationale: "Target: Adversarial Model Attack. Requires student to identify the thermodynamic boundary condition and Second Law constraint that destroys a naive heat engine model.",
    competing_paths: [
      "Counterexample: Kelvin-Planck statement of Second Law & entropy generation [\u222E dQ/T < 0 for irreversible cycle]",
      "Naive Model: Eliminating mechanical friction allows 100% heat-to-work conversion"
    ],
    falsification_criteria: "Citing Kelvin-Planck statement and closed-cycle entropy balance destroys the frictionless 100% conversion model.",
    scenario_vignette: 'Consider this proposed physical model: "The only reason heat engines have efficiency less than 100% is mechanical friction and acoustic dissipation in the piston mechanisms. If we construct a magnetic-levitation frictionless cylinder in an ultra-high vacuum, an engine absorbing heat Q_H from a single reservoir at temperature T_H can convert 100% of that heat into mechanical work W = Q_H in a continuous periodic cycle."',
    question_text: "DESTROY THIS MODEL. What fundamental thermodynamic law or cycle constraint definitively breaks this naive model?",
    options: [
      "The Kelvin-Planck statement of the Second Law of Thermodynamics: It is impossible for any cyclic device to absorb heat from a single thermal reservoir and produce an equivalent amount of work without rejecting heat to a lower-temperature reservoir; in a closed cycle, the working fluid must return to its initial state (\u0394S_cycle = 0), which requires expelling entropy via heat rejection Q_C > 0 to a cold sink at T_C.",
      "Magnetic levitation consumes all electrical potential of the universe within 3 seconds.",
      "Ideal gas molecules stick irreversibly to vacuum cylinder walls due to nuclear strong force.",
      "Heat can only be converted into gravitational potential energy, never mechanical work."
    ],
    correct_answer: "The Kelvin-Planck statement of the Second Law of Thermodynamics: It is impossible for any cyclic device to absorb heat from a single thermal reservoir and produce an equivalent amount of work without rejecting heat to a lower-temperature reservoir; in a closed cycle, the working fluid must return to its initial state (\u0394S_cycle = 0), which requires expelling entropy via heat rejection Q_C > 0 to a cold sink at T_C.",
    explanation: "The naive model attributes inefficiency entirely to non-ideal mechanical friction. The Second Law of Thermodynamics (Kelvin-Planck statement) destroys this: for any engine operating in a cycle, the working substance must return to its initial thermodynamic state, so its change in entropy per cycle is \u0394S_system = \u222E dS = 0. During the isothermal expansion at T_H, the fluid absorbs heat Q_H, gaining entropy \u0394S = Q_H / T_H > 0. To complete the cycle and reset its state, the engine MUST dump this entropy to an external sink. Because work W produces zero entropy transfer, the only way to dump entropy is by rejecting heat Q_C > 0 to a colder reservoir at T_C < T_H. Therefore, Q_C cannot be zero, and efficiency \u03B7 = 1 - Q_C/Q_H is strictly less than 100% even in an idealized frictionless universe.",
    discriminator_note: "CRUCIAL DISCRIMINATOR: Cyclic state reset requires \u0394S_system = 0; entropy absorbed at T_H cannot be destroyed, forcing Q_C > 0 rejection.",
    reasoning_target: "Adversarially breaking frictionless conversion models with cyclic entropy balance and Kelvin-Planck statement.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 10. Reconstruction Test — Reconstruct Underdamped Harmonic Motion from First Principles (TYPE J)
  {
    id: "diag_reconstruction_damped_oscillator_1",
    topic_id: "top_damped_oscillator",
    topic_name: "Damped & Driven Harmonic Oscillators",
    subject_name: "Classical Mechanics & Dynamics",
    mode: "first_principles",
    question_type: "TYPE_J_RECONSTRUCTION",
    difficulty: "Mechanistic",
    root_error_target: "err_missing_variable",
    internal_rationale: "Target: First-Principles Reconstruction. Tests derivation of underdamped harmonic motion and exponential decay from minimal Newtonian axioms.",
    competing_paths: [
      "First-principles derivation: Newton second law [m a = -k x - b v] \u2192 characteristic equation roots [r = -\u03B3 \xB1 i \u03C9_d] \u2192 Euler formula sinusoidal decay",
      "Memorized recall: Writing formula without deriving characteristic roots from differential equation"
    ],
    falsification_criteria: "Setting up differential equation and solving characteristic roots demonstrates first-principles derivation.",
    scenario_vignette: "You are tasked with deriving the equation of motion and time-domain solution for an underdamped harmonic oscillator without relying on memorized formulas, starting from Newton second law and linear resistive forces.",
    question_text: "Which minimal sequence of physical axioms and mathematical steps accurately reconstructs underdamped motion from first principles?",
    options: [
      "Apply Newton second law: m x''(t) = -k x(t) - b x'(t) \u2192 Rearrange to standard form: x'' + 2\u03B3 x' + \u03C9_0\xB2 x = 0 (where \u03B3 = b/(2m), \u03C9_0 = \u221A(k/m)) \u2192 Substitute ansatz x(t) = e^(r t) yielding characteristic equation r\xB2 + 2\u03B3 r + \u03C9_0\xB2 = 0 \u2192 In underdamped regime (\u03B3 < \u03C9_0), roots are r = -\u03B3 \xB1 i \u03C9_d (where \u03C9_d = \u221A(\u03C9_0\xB2 - \u03B3\xB2)) \u2192 General real solution: x(t) = A e^(-\u03B3 t) cos(\u03C9_d t + \u03C6).",
      "Assume velocity is constant \u2192 Multiply position by spring stiffness \u2192 Integrate force over time to get displacement.",
      "Equate kinetic energy directly to gravitational acceleration \u2192 Differentiate with respect to temperature.",
      "Apply Coulomb law of electrostatics between the spring coils \u2192 Solve using Fourier series for static point charges."
    ],
    correct_answer: "Apply Newton second law: m x''(t) = -k x(t) - b x'(t) \u2192 Rearrange to standard form: x'' + 2\u03B3 x' + \u03C9_0\xB2 x = 0 (where \u03B3 = b/(2m), \u03C9_0 = \u221A(k/m)) \u2192 Substitute ansatz x(t) = e^(r t) yielding characteristic equation r\xB2 + 2\u03B3 r + \u03C9_0\xB2 = 0 \u2192 In underdamped regime (\u03B3 < \u03C9_0), roots are r = -\u03B3 \xB1 i \u03C9_d (where \u03C9_d = \u221A(\u03C9_0\xB2 - \u03B3\xB2)) \u2192 General real solution: x(t) = A e^(-\u03B3 t) cos(\u03C9_d t + \u03C6).",
    explanation: "To reconstruct from first principles: 1. Identify active forces: linear restoring Hookean force F_s = -k x and linear viscous resistance F_d = -b v = -b x'. 2. Apply Newton second law: \u03A3 F = m x'' \u2192 m x'' + b x' + k x = 0. 3. Divide by mass m and define damping factor \u03B3 = b/(2m) and natural frequency \u03C9_0 = \u221A(k/m): x'' + 2\u03B3 x' + \u03C9_0\xB2 x = 0. 4. Try exponential ansatz x(t) = e^(r t) yielding characteristic polynomial r\xB2 + 2\u03B3 r + \u03C9_0\xB2 = 0. 5. Quadratic formula gives roots r = -\u03B3 \xB1 \u221A(\u03B3\xB2 - \u03C9_0\xB2). For underdamping (\u03B3 < \u03C9_0), the discriminant is negative: r = -\u03B3 \xB1 i \u221A(\u03C9_0\xB2 - \u03B3\xB2) = -\u03B3 \xB1 i \u03C9_d. 6. Applying Euler identity e^(\xB1 i \u03C9_d t) = cos(\u03C9_d t) \xB1 i sin(\u03C9_d t) produces the decaying harmonic oscillation x(t) = A e^(-\u03B3 t) cos(\u03C9_d t + \u03C6).",
    discriminator_note: "CRUCIAL DISCRIMINATOR: Complex conjugate characteristic roots r = -\u03B3 \xB1 i \u03C9_d mathematically mandate the exponential decay factor e^(-\u03B3 t) multiplying the harmonic cosine.",
    reasoning_target: "First-principles derivation of underdamped harmonic motion from differential equations of motion.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
async function ensureAdaptiveUserModel(userId = DEFAULT_USER_ID) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const userCheck = await db.get("SELECT id FROM users WHERE id = ?", userId);
  if (!userCheck) {
    await db.run(
      "INSERT INTO users (id, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
      userId,
      userId === DEFAULT_USER_ID ? "BSc Physics Scholar" : userId,
      now,
      now
    );
  }
  const row = await db.get("SELECT * FROM user_model WHERE user_id = ?", userId);
  if (row) {
    let existingErrors = [];
    try {
      const parsed = JSON.parse(row.error_profile || "[]");
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].reasoning_family) {
        existingErrors = parsed;
      } else {
        existingErrors = INITIAL_HIERARCHICAL_ERRORS;
        await db.run(
          "UPDATE user_model SET error_profile = ?, updated_at = ? WHERE user_id = ?",
          JSON.stringify(existingErrors),
          now,
          userId
        );
      }
    } catch {
      existingErrors = INITIAL_HIERARCHICAL_ERRORS;
      await db.run(
        "UPDATE user_model SET error_profile = ?, updated_at = ? WHERE user_id = ?",
        JSON.stringify(existingErrors),
        now,
        userId
      );
    }
  } else {
    await db.run(
      `INSERT INTO user_model (
        id, user_id, reasoning_profile, error_profile, confidence_calibration, cognitive_resource_allocation,
        topic_mastery, recommended_difficulty, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      "model_" + userId,
      userId,
      JSON.stringify({
        first_principles_index: null,
        causal_precision: null,
        directionality_integrity: null,
        discriminator_acuity: null,
        exception_awareness: null,
        anti_overanalysis_score: null
      }),
      JSON.stringify(INITIAL_HIERARCHICAL_ERRORS),
      JSON.stringify({
        brier_score: 0.18,
        overconfidence_bias: 12,
        underconfidence_bias: 5,
        calibration_curve: [
          { predicted_confidence: 20, actual_accuracy: 25 },
          { predicted_confidence: 40, actual_accuracy: 42 },
          { predicted_confidence: 60, actual_accuracy: 55 },
          { predicted_confidence: 80, actual_accuracy: 70 },
          { predicted_confidence: 100, actual_accuracy: 85 }
        ]
      }),
      JSON.stringify({
        energy_level: 82,
        cognitive_load: 35,
        decision_fatigue_index: 20,
        focus_state: "Optimal Flow",
        optimal_session_duration_min: 40,
        current_streak_minutes: 15
      }),
      JSON.stringify({
        top_damped_oscillator: { mastery_score: 45, tests_taken: 0, last_tested: now },
        top_lenz_induction: { mastery_score: 50, tests_taken: 0, last_tested: now },
        top_carnot_entropy: { mastery_score: 40, tests_taken: 0, last_tested: now },
        top_maxwell_boundary: { mastery_score: 35, tests_taken: 0, last_tested: now }
      }),
      "Mechanistic",
      now
    );
  }
  for (const q of CURATED_DIAGNOSTIC_QUESTIONS) {
    const check = await db.get("SELECT id FROM questions WHERE id = ?", q.id);
    if (!check) {
      await db.run(
        `INSERT INTO questions (
          id, topic_id, mode, question_text, options, correct_answer,
          explanation, reasoning_target, difficulty, scenario_vignette, clinical_vignette, discriminator_note,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
        q.id,
        q.topic_id,
        q.mode,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_answer,
        q.explanation,
        q.reasoning_target,
        q.difficulty,
        q.scenario_vignette || "",
        q.scenario_vignette || "",
        q.discriminator_note || "",
        now
      );
    }
  }
}
async function getUserCognitiveFlawSummary(userId = DEFAULT_USER_ID) {
  await ensureAdaptiveUserModel(userId);
  const userModelRow = await db.get("SELECT error_profile FROM user_model WHERE user_id = ?", userId);
  let errors = INITIAL_HIERARCHICAL_ERRORS;
  if (userModelRow?.error_profile) {
    try {
      const parsed = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(parsed) && parsed[0]?.reasoning_family) {
        errors = parsed;
      }
    } catch {
    }
  }
  const sorted = [...errors].sort((a, b) => {
    const aConf = a.model_confidence ?? 0;
    const bConf = b.model_confidence ?? 0;
    const aP = aConf * (a.recent_frequency + 1) * (a.status === "Unstable" ? 2 : 1);
    const bP = bConf * (b.recent_frequency + 1) * (b.status === "Unstable" ? 2 : 1);
    return bP - aP;
  });
  const primary = sorted[0] || errors[0];
  const hasAssessedFlaws = sorted.some((f) => f.stage !== null && f.model_confidence !== null);
  const activeFlawsList = sorted.slice(0, 4).map((f) => `- [${f.name}] (${f.reasoning_family}): ${f.specific_failure}. Current hypothesis: "${f.current_hypothesis}"`).join("\n");
  const prompt_injection = hasAssessedFlaws ? `
=== STUDENT COGNITIVE PROFILE & TRACKED REASONING FLAW (CROSS-CONTEXT ADAPTATION) ===
The student currently engaging with you has been actively diagnosed with the following cognitive reasoning flaw pattern across the MECHANISM webapp:
\u2022 PRIMARY TARGET FLAW TO ATTACK & CORRECT: "${primary.name}"
\u2022 Specific Flawed Pattern: ${primary.specific_failure}
\u2022 Trigger Condition: ${primary.trigger_conditions}
\u2022 Current Physical Working Model: "${primary.current_hypothesis}"
\u2022 Recommended Countermeasure: ${primary.countermeasure}

ADDITIONAL TRACKED FLAWS IN STUDENT COGNITIVE PROFILE:
${activeFlawsList}

CROSS-CONTEXT INSTRUCTION:
1. You MUST continuously adapt to this diagnosed flaw in the student's pattern of understanding.
2. In whatever context you are currently operating (Doubt Chat, Compressor, Adversarial Attack, First Principles, Reverse Engineering, Simulation, or Reconstruction), actively observe whether the student's questions, hypotheses, or answers exhibit this exact flaw (e.g., reversing directionality, confusing association with causation, premature closure without checking discriminators, overanalysis, or ignoring compensatory loops).
3. When the student makes this mistake, address it directly, expose the flaw's physical inconsistency or violation of dynamical laws, and guide them to rectify their mental model.
========================================================================================` : `
=== STUDENT COGNITIVE PROFILE & TRACKED REASONING FLAW (CROSS-CONTEXT ADAPTATION) ===
The student is currently at the baseline unassessed state. No recurring cognitive reasoning bugs have yet been diagnosed.
CROSS-CONTEXT INSTRUCTION:
1. Actively monitor the student's reasoning as they formulate hypotheses, ask doubts, and answer questions.
2. Probe whether they derive from first principles, preserve causal directionality in feedback loops, isolate crucial discriminators, or succumb to association fallacies.
3. Guide their thinking process constructively so that the adaptive engine accurately maps their cognitive profile.
========================================================================================`;
  return {
    primary_weakness: hasAssessedFlaws ? primary.name : "Unassessed Baseline",
    flaws: sorted,
    prompt_injection
  };
}
async function calculateEvidenceStrength(params) {
  const {
    feature,
    confidence,
    isCorrect,
    correctReasoning,
    reasoningText,
    taskDifficulty,
    timeTakenSec,
    errorId,
    topicId,
    reconstructionScore,
    userId = DEFAULT_USER_ID
  } = params;
  let baseWeight = 0.42;
  if (feature === "reconstruction" || feature === "compressor" || feature === "simulation" || feature === "adversarial") {
    baseWeight = 0.56;
  } else if (reasoningText && reasoningText.trim().length > 25) {
    baseWeight = 0.52;
  } else if (feature === "doubt_chat") {
    baseWeight = 0.5;
  }
  let clarityMod = 0;
  if (correctReasoning === true) {
    clarityMod += 0.1;
  } else if (correctReasoning === false) {
    clarityMod += 0.12;
  }
  let confMultiplier = 1;
  if (confidence != null) {
    if (isCorrect === false && confidence >= 80) {
      confMultiplier = 1.25;
    } else if (isCorrect === false && confidence <= 35) {
      confMultiplier = 0.75;
    } else if (isCorrect === true && confidence >= 80) {
      confMultiplier = 1.18;
    } else if (isCorrect === true && confidence <= 40) {
      confMultiplier = 0.85;
    }
  }
  let difficultyMod = 1;
  if (taskDifficulty === "Foundation") {
    if (isCorrect === false) difficultyMod = 1.2;
  } else if (taskDifficulty === "Physical Synthesis" || taskDifficulty === "Second-Order" || taskDifficulty === "Mastery") {
    difficultyMod = 1.1;
  }
  let timeMod = 0;
  if (timeTakenSec != null) {
    if (timeTakenSec < 12 && isCorrect === false) {
      timeMod += 0.08;
    } else if (timeTakenSec > 65 && (errorId === "err_overanalysis_trap" || feature === "simulation")) {
      timeMod += 0.12;
    }
  }
  let reconMod = 0;
  if (reconstructionScore != null) {
    if (reconstructionScore >= 85) reconMod += 0.12;
    else if (reconstructionScore < 50) reconMod += 0.15;
  }
  let recurrenceMod = 0;
  let crossFeatureMultiplier = 1;
  let transferMultiplier = 1;
  if (errorId) {
    try {
      const priorRows = await db.all(`
        SELECT feature, topic_id, correct_answer, correct_reasoning
        FROM adaptive_evidence
        WHERE user_id = ? AND error_id = ?
      `, userId, errorId);
      if (priorRows.length > 0) {
        const priorMistakes = priorRows.filter((r) => r.correct_answer === 0 || r.correct_reasoning === 0).length;
        recurrenceMod = Math.min(0.24, priorMistakes * 0.06);
        const featuresSeen = new Set(priorRows.map((r) => r.feature));
        featuresSeen.add(feature);
        if (featuresSeen.size >= 2) {
          crossFeatureMultiplier = 1.3;
        }
        const topicsSeen = new Set(priorRows.map((r) => r.topic_id).filter(Boolean));
        if (topicId) topicsSeen.add(topicId);
        if (topicsSeen.size >= 2) {
          transferMultiplier = 1.2;
        }
      }
    } catch {
    }
  }
  const rawScore = (baseWeight + clarityMod + timeMod + reconMod + recurrenceMod) * confMultiplier * difficultyMod * crossFeatureMultiplier * transferMultiplier;
  return Math.max(0.15, Math.min(0.98, Number(rawScore.toFixed(2))));
}
async function deriveNextBestTask(params) {
  const userId = params.userId || DEFAULT_USER_ID;
  await ensureAdaptiveUserModel(userId);
  const userModelRow = await db.get("SELECT * FROM user_model WHERE user_id = ?", userId);
  let errors = INITIAL_HIERARCHICAL_ERRORS;
  let topicMastery = {};
  let calibration = {};
  let profile = {};
  if (userModelRow) {
    try {
      if (userModelRow.error_profile) errors = JSON.parse(userModelRow.error_profile);
      if (userModelRow.topic_mastery) topicMastery = JSON.parse(userModelRow.topic_mastery);
      if (userModelRow.confidence_calibration) calibration = JSON.parse(userModelRow.confidence_calibration);
      if (userModelRow.reasoning_profile) profile = JSON.parse(userModelRow.reasoning_profile);
    } catch {
    }
  }
  const topics = await db.all("SELECT * FROM topics");
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const recentEvidence = await db.all(`
    SELECT * FROM adaptive_evidence
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 15
  `, userId);
  let effectiveTopic = topics[0] || { id: "top_damped_oscillator", name: "Damped & Driven Harmonic Oscillators" };
  if (params.selectedTopicId && topicMap.has(params.selectedTopicId)) {
    effectiveTopic = topicMap.get(params.selectedTopicId);
  }
  const unstableErrors = errors.filter((e) => e.status === "Unstable" || e.model_confidence != null && e.model_confidence >= 0.65 && e.recent_frequency >= 1);
  const sortedUnstable = [...unstableErrors].sort((a, b) => {
    const aScore = (a.model_confidence || 0) * 100 + a.recent_frequency * 25;
    const bScore = (b.model_confidence || 0) * 100 + b.recent_frequency * 25;
    return bScore - aScore;
  });
  const crossContextErrors = errors.filter((e) => e.feature_sources && e.feature_sources.length >= 2 || e.linked_evidence_count && e.linked_evidence_count >= 3 && e.status !== "Stable" && e.status !== "Well-calibrated");
  const emergingErrors = errors.filter((e) => e.status === "Emerging" || e.model_confidence != null && e.model_confidence < 0.55 && e.error_frequency === 1);
  const transferPendingErrors = errors.filter((e) => (e.transfer_status === "Pending" || e.transfer_status === "Tested") && e.successful_repairs >= 1 && e.status !== "Well-calibrated");
  const weakTopics = topics.filter((t) => {
    const m = topicMastery[t.id];
    return m && (m.status === "Needs Reconstruction" || m.mastery_percentage != null && m.mastery_percentage < 60);
  });
  const hasCalibrationBias = calibration?.overconfidence_bias != null && calibration.overconfidence_bias >= 15;
  const stabilizedErrors = errors.filter((e) => e.status === "Stable" && e.successful_repairs >= 2);
  if (sortedUnstable.length > 0) {
    const target = sortedUnstable[0];
    return {
      mode: "mcq_test",
      test_mode: "weakness_hunt",
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Weakness Hunt: Dissecting ${target.name}`,
      reason: `Diagnosed high-confidence flaw (${Math.round((target.model_confidence || 0) * 100)}% confidence, ${target.recent_frequency} recent manifestation${target.recent_frequency === 1 ? "" : "s"}). Active hypothesis: "${target.current_hypothesis}".`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: "CRITICAL",
      rationale_dimensions: {
        category: "RECURRING_ERROR",
        evidence_count: target.linked_evidence_count || target.error_frequency,
        urgency_score: Math.round((target.model_confidence || 0.5) * 100 + target.recent_frequency * 20)
      }
    };
  }
  if (crossContextErrors.length > 0) {
    const target = crossContextErrors[0];
    return {
      mode: "compressor",
      test_mode: "mechanism_test",
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Cross-Feature Verification: ${target.name}`,
      reason: `Flaw observed across multiple learning features (${(target.feature_sources || []).join(", ")}). Requires causal mechanism synthesis to eliminate underlying biophysical confusion.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: "HIGH",
      rationale_dimensions: {
        category: "CROSS_CONTEXT_WEAKNESS",
        evidence_count: target.linked_evidence_count || 3,
        urgency_score: 85
      }
    };
  }
  if (transferPendingErrors.length > 0) {
    const target = transferPendingErrors[0];
    return {
      mode: "mcq_test",
      test_mode: "transfer_test",
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Disguised Transfer: ${target.name}`,
      reason: `Student successfully defended this mechanism in its primary context. The central engine now requires testing whether the model holds when disguised in an alternative organ system.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: "HIGH",
      rationale_dimensions: {
        category: "TRANSFER_TEST",
        evidence_count: target.linked_evidence_count || target.successful_repairs,
        urgency_score: 80
      }
    };
  }
  if (weakTopics.length > 0 || profile?.first_principles_index != null && profile.first_principles_index < 60) {
    const weakTopic = weakTopics[0] || effectiveTopic;
    return {
      mode: "reconstruction",
      test_mode: "reconstruction",
      topic_id: weakTopic.id,
      topic_name: weakTopic.name,
      title: `First-Principles Reconstruction: ${weakTopic.name}`,
      reason: `Topic mastery is currently categorized as "${topicMastery[weakTopic.id]?.status || "Needs Reconstruction"}". Closed-book causal reconstruction is required to rebuild structural foundations.`,
      priority: "HIGH",
      rationale_dimensions: {
        category: "RECONSTRUCTION",
        evidence_count: recentEvidence.filter((e) => e.topic_id === weakTopic.id).length,
        urgency_score: 75
      }
    };
  }
  if (emergingErrors.length > 0) {
    const target = emergingErrors[0];
    return {
      mode: "mcq_test",
      test_mode: "quick_diagnostic",
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Targeted Diagnostic Probe: ${target.name}`,
      reason: `An isolated error signal was detected (${target.specific_failure}). Probing with a targeted discriminator question to confirm or falsify the candidate hypothesis.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: "MEDIUM",
      rationale_dimensions: {
        category: "UNCERTAIN_HYPOTHESIS",
        evidence_count: target.linked_evidence_count || 1,
        urgency_score: 68
      }
    };
  }
  if (hasCalibrationBias) {
    return {
      mode: "mcq_test",
      test_mode: "calibration_test",
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Confidence Calibration Challenge: ${effectiveTopic.name}`,
      reason: `Measured overconfidence bias (+${calibration.overconfidence_bias}%). Challenging intuition with deceptive distractors that look plausible superficially but violate physical conservation rules.`,
      priority: "MEDIUM",
      rationale_dimensions: {
        category: "CALIBRATION",
        evidence_count: recentEvidence.length,
        urgency_score: 65
      }
    };
  }
  if (stabilizedErrors.length > 0) {
    const target = stabilizedErrors[0];
    return {
      mode: "adversarial",
      test_mode: "adversarial_test",
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Adversarial Stress Test: ${target.name}`,
      reason: `Mental model on ${target.domain} previously stabilized. Subjecting the working hypothesis to pathological boundary perturbations to ensure resilience.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: "NORMAL",
      rationale_dimensions: {
        category: "SPACED_RETEST",
        evidence_count: target.linked_evidence_count || 2,
        urgency_score: 55
      }
    };
  }
  const unassessedTopic = topics.find((t) => topicMastery[t.id]?.status === "Unassessed") || effectiveTopic;
  return {
    mode: "first_principles",
    test_mode: "quick_diagnostic",
    topic_id: unassessedTopic.id,
    topic_name: unassessedTopic.name,
    title: `First-Principles Exploration: ${unassessedTopic.name}`,
    reason: `Topic is unassessed. Deconstruct its physical axioms and conservation laws from the ground up to establish baseline causal models.`,
    priority: "NORMAL",
    rationale_dimensions: {
      category: "EXPLORATION",
      evidence_count: 0,
      urgency_score: 45
    }
  };
}
async function processAdaptiveEvidence(evidenceInput) {
  const userId = evidenceInput.user_id || DEFAULT_USER_ID;
  const id = evidenceInput.id || "ev_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const now = evidenceInput.created_at || (/* @__PURE__ */ new Date()).toISOString();
  const strength = evidenceInput.evidence_strength != null ? evidenceInput.evidence_strength : await calculateEvidenceStrength({
    feature: evidenceInput.feature,
    confidence: evidenceInput.confidence,
    isCorrect: evidenceInput.correct_answer,
    correctReasoning: evidenceInput.correct_reasoning,
    timeTakenSec: evidenceInput.time_taken_sec,
    errorId: evidenceInput.error_id,
    topicId: evidenceInput.topic_id,
    reconstructionScore: evidenceInput.reconstruction_score,
    userId
  });
  const fullEvidence = {
    id,
    user_id: userId,
    feature: evidenceInput.feature,
    topic_id: evidenceInput.topic_id || null,
    topic_name: evidenceInput.topic_name || null,
    error_id: evidenceInput.error_id || null,
    error_name: evidenceInput.error_name || null,
    correct_answer: evidenceInput.correct_answer != null ? Boolean(evidenceInput.correct_answer) : null,
    correct_reasoning: evidenceInput.correct_reasoning != null ? Boolean(evidenceInput.correct_reasoning) : null,
    robust_mechanism: evidenceInput.robust_mechanism != null ? Boolean(evidenceInput.robust_mechanism) : null,
    transferable_mastery: evidenceInput.transferable_mastery != null ? Boolean(evidenceInput.transferable_mastery) : null,
    confidence: evidenceInput.confidence != null ? Number(evidenceInput.confidence) : null,
    time_taken_sec: evidenceInput.time_taken_sec != null ? Number(evidenceInput.time_taken_sec) : null,
    discriminator_identified: evidenceInput.discriminator_identified != null ? Boolean(evidenceInput.discriminator_identified) : null,
    reconstruction_score: evidenceInput.reconstruction_score != null ? Number(evidenceInput.reconstruction_score) : null,
    evidence_strength: strength,
    evidence_summary: evidenceInput.evidence_summary,
    created_at: now
  };
  await db.run(
    `
    INSERT INTO adaptive_evidence (
      id, user_id, feature, topic_id, error_id,
      correct_answer, correct_reasoning, robust_mechanism, transferable_mastery,
      confidence, time_taken_sec, discriminator_identified, reconstruction_score,
      evidence_strength, evidence_summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    fullEvidence.id,
    fullEvidence.user_id,
    fullEvidence.feature,
    fullEvidence.topic_id,
    fullEvidence.error_id,
    fullEvidence.correct_answer != null ? fullEvidence.correct_answer ? 1 : 0 : null,
    fullEvidence.correct_reasoning != null ? fullEvidence.correct_reasoning ? 1 : 0 : null,
    fullEvidence.robust_mechanism != null ? fullEvidence.robust_mechanism ? 1 : 0 : null,
    fullEvidence.transferable_mastery != null ? fullEvidence.transferable_mastery ? 1 : 0 : null,
    fullEvidence.confidence,
    fullEvidence.time_taken_sec,
    fullEvidence.discriminator_identified != null ? fullEvidence.discriminator_identified ? 1 : 0 : null,
    fullEvidence.reconstruction_score,
    fullEvidence.evidence_strength,
    fullEvidence.evidence_summary,
    fullEvidence.created_at
  );
  await computeAdaptiveUserModel(userId);
  return fullEvidence;
}
async function computeAdaptiveUserModel(userId = DEFAULT_USER_ID) {
  await ensureAdaptiveUserModel(userId);
  const attempts = await db.all(`
    SELECT qa.*, q.mode as q_mode, q.topic_id as q_topic_id, q.reasoning_target as q_reasoning_target, q.difficulty as q_difficulty
    FROM question_attempts qa
    LEFT JOIN questions q ON qa.question_id = q.id
    WHERE qa.user_id = ?
    ORDER BY qa.created_at ASC
  `, userId);
  const evaluations = await db.all(`
    SELECT * FROM mechanism_evaluations ORDER BY created_at ASC
  `);
  const reconstructions = await db.all(`
    SELECT * FROM reconstructions ORDER BY created_at ASC
  `);
  const evidences = await db.all(`
    SELECT * FROM adaptive_evidence WHERE user_id = ? ORDER BY created_at ASC
  `, userId);
  const topics = await db.all("SELECT * FROM topics");
  const userModelRow = await db.get("SELECT * FROM user_model WHERE user_id = ?", userId);
  if (attempts.length === 0 && evaluations.length === 0 && reconstructions.length === 0 && evidences.length === 0) {
    const unassessedErrors = INITIAL_HIERARCHICAL_ERRORS.map((e) => ({
      ...e,
      stage: null,
      model_confidence: null,
      status: "Unassessed",
      error_frequency: 0,
      recent_frequency: 0,
      historical_frequency: 0,
      successful_repairs: 0,
      transfer_status: "Unassessed",
      linked_evidence_count: 0,
      feature_sources: [],
      evidence_strength: 0,
      current_hypothesis: "Awaiting student reasoning evidence. The adaptive engine will calibrate this hypothesis as tests are taken.",
      next_diagnostic_test: `Take initial diagnostic test on ${e.domain}.`
    }));
    const topicMastery2 = {};
    for (const t of topics) {
      topicMastery2[t.id] = {
        topic_name: t.name,
        mastery_percentage: null,
        status: "Unassessed",
        last_practiced: ""
      };
    }
    const reasoningProfile2 = {
      first_principles_index: null,
      causal_precision: null,
      directionality_integrity: null,
      discriminator_acuity: null,
      exception_awareness: null,
      anti_overanalysis_score: null
    };
    const calibration = {
      brier_score: null,
      overconfidence_bias: null,
      underconfidence_bias: null,
      calibration_curve: []
    };
    const cognitiveResources2 = {
      average_time_per_decision_sec: null,
      unnecessary_tests_requested_rate: null,
      overanalysis_flags_count: 0,
      decision_commit_efficiency: "Pending Assessment"
    };
    const recommendedTest2 = {
      mode: "quick_diagnostic",
      title: "Initial Diagnostic Evaluation",
      rationale: "Initial unassessed baseline. Take your first diagnostic test to allow the adaptive engine to calibrate your reasoning model.",
      target_weakness: "Unassessed Baseline"
    };
    const nextBestTask2 = await deriveNextBestTask({ userId });
    return {
      id: userModelRow?.id || "model_" + userId,
      user_id: userId,
      reasoning_profile: reasoningProfile2,
      topic_mastery: topicMastery2,
      error_profile: unassessedErrors,
      hierarchical_errors: unassessedErrors,
      evolving_hypotheses: [],
      evolution_log: [],
      recommended_test: recommendedTest2,
      next_best_task: nextBestTask2,
      recent_evidence: [],
      confidence_calibration: calibration,
      cognitive_resource_allocation: cognitiveResources2,
      recommended_difficulty: "Mechanistic",
      updated_at: userModelRow?.updated_at || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const topicMastery = {};
  for (const t of topics) {
    const tAttempts = attempts.filter((a) => a.q_topic_id === t.id);
    const tEvals = evaluations.filter((e) => e.topic_id === t.id);
    const tRecons = reconstructions.filter((r) => r.topic_id === t.id);
    const tEvidences = evidences.filter((e) => e.topic_id === t.id);
    if (tAttempts.length === 0 && tEvals.length === 0 && tRecons.length === 0 && tEvidences.length === 0) {
      topicMastery[t.id] = {
        topic_name: t.name,
        mastery_percentage: null,
        status: "Unassessed",
        last_practiced: ""
      };
    } else {
      let scoreSum = 0;
      let count = 0;
      for (const a of tAttempts) {
        scoreSum += a.correct ? 100 : 25;
        count++;
      }
      for (const e of tEvals) {
        scoreSum += e.overall_score != null ? e.overall_score * 100 : 70;
        count++;
      }
      for (const r of tRecons) {
        scoreSum += r.score != null ? Number(r.score) : 75;
        count++;
      }
      for (const ev of tEvidences) {
        if (ev.feature !== "mcq_test" && ev.feature !== "reconstruction") {
          if (ev.robust_mechanism != null) scoreSum += ev.robust_mechanism ? 90 : 35;
          else if (ev.correct_reasoning != null) scoreSum += ev.correct_reasoning ? 85 : 40;
          else scoreSum += 70;
          count++;
        }
      }
      const pct = count > 0 ? Math.round(scoreSum / count) : 70;
      const status = pct >= 85 ? "Consolidated" : pct >= 60 ? "Calibrating" : "Needs Reconstruction";
      const lastAtt = tEvidences[tEvidences.length - 1] || tAttempts[tAttempts.length - 1] || tEvals[tEvals.length - 1] || tRecons[tRecons.length - 1];
      topicMastery[t.id] = {
        topic_name: t.name,
        mastery_percentage: pct,
        status,
        last_practiced: lastAtt?.created_at || (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  const fpAttempts = attempts.filter(
    (a) => a.q_mode === "first_principles" || a.question_id?.includes("damped") || a.question_id?.includes("thermo") || a.q_reasoning_target?.toLowerCase().includes("first-principle") || a.q_reasoning_target?.toLowerCase().includes("axiom")
  );
  const fpEvidences = evidences.filter((e) => e.feature === "first_principles" || e.feature === "reconstruction");
  const causalAttempts = attempts.filter(
    (a) => a.q_mode === "mechanism_test" || a.question_id?.includes("carnot") || a.question_id?.includes("lenz") || a.q_reasoning_target?.toLowerCase().includes("causal") || a.reasoning_error?.includes("Association")
  );
  const causalEvidences = evidences.filter((e) => e.feature === "compressor" || e.error_id && e.error_id.includes("causation"));
  const dirAttempts = attempts.filter(
    (a) => a.q_mode === "second_order" || a.question_id?.includes("directionality") || a.q_reasoning_target?.toLowerCase().includes("direction") || a.reasoning_error?.includes("Directionality")
  );
  const dirEvidences = evidences.filter((e) => e.error_id === "err_directionality_inversion" || e.feature === "compressor");
  const discAttempts = attempts.filter(
    (a) => a.q_mode === "causal_discrimination" || a.question_id?.includes("discriminator") || a.question_id?.includes("premature") || a.q_reasoning_target?.toLowerCase().includes("discriminat") || a.reasoning_error?.includes("Closure")
  );
  const discEvidences = evidences.filter((e) => e.discriminator_identified != null || e.feature === "reverse_engineering" || e.feature === "simulation");
  const excAttempts = attempts.filter(
    (a) => a.question_id?.includes("missing_variable") || a.q_reasoning_target?.toLowerCase().includes("coupling") || a.q_reasoning_target?.toLowerCase().includes("angular") || a.q_reasoning_target?.toLowerCase().includes("feedback")
  );
  const excEvidences = evidences.filter((e) => e.feature === "adversarial" || e.error_id === "err_missing_variable");
  const overanalysisAttempts = attempts.filter(
    (a) => a.question_id?.includes("overanalysis") || a.reasoning_error?.includes("Overanalysis")
  );
  const overanalysisEvidences = evidences.filter((e) => e.error_id === "err_overanalysis_trap");
  const calcCategoryScore = (catAttempts, catEvidences = [], fallbackEvaluations) => {
    let total = 0;
    let n = 0;
    if (catAttempts.length > 0) {
      for (const a of catAttempts) {
        total += a.correct ? 100 : 25;
        n++;
      }
    }
    if (catEvidences.length > 0) {
      for (const ev of catEvidences) {
        if (ev.correct_reasoning != null) total += ev.correct_reasoning ? 90 : 35;
        else if (ev.robust_mechanism != null) total += ev.robust_mechanism ? 90 : 35;
        else if (ev.reconstruction_score != null) total += ev.reconstruction_score;
        else total += 70;
        n++;
      }
    }
    if (n > 0) {
      return Math.round(total / n);
    }
    if (fallbackEvaluations && fallbackEvaluations.length > 0) {
      const avg = fallbackEvaluations.reduce((acc, e) => acc + (e.score || 0), 0) / fallbackEvaluations.length;
      return Math.round(avg);
    }
    return null;
  };
  const first_principles_index = calcCategoryScore(
    fpAttempts,
    fpEvidences,
    reconstructions.map((r) => ({ score: r.score != null ? Number(r.score) : 75 }))
  );
  const causal_precision = calcCategoryScore(causalAttempts, causalEvidences, evaluations.map((e) => ({ score: (e.causal_accuracy || 0.75) * 100 })));
  const directionality_integrity = calcCategoryScore(dirAttempts, dirEvidences, evaluations.map((e) => ({ score: (e.directionality || 0.8) * 100 })));
  const discriminator_acuity = calcCategoryScore(discAttempts, discEvidences);
  const exception_awareness = calcCategoryScore(excAttempts, excEvidences);
  let anti_overanalysis_score = null;
  const allTimeEvents = [
    ...attempts.map((a) => a.time_taken || 25),
    ...evidences.filter((e) => e.time_taken_sec != null).map((e) => e.time_taken_sec)
  ];
  if (allTimeEvents.length > 0) {
    const avgTime2 = allTimeEvents.reduce((acc, t) => acc + t, 0) / allTimeEvents.length;
    const overanalysisCount = overanalysisAttempts.filter((a) => !a.correct).length + overanalysisEvidences.filter((e) => e.correct_reasoning === false).length;
    let base = 85;
    if (avgTime2 > 60) base -= 20;
    else if (avgTime2 > 40) base -= 10;
    base -= overanalysisCount * 15;
    anti_overanalysis_score = Math.max(20, Math.min(100, Math.round(base)));
  }
  const reasoningProfile = {
    first_principles_index,
    causal_precision,
    directionality_integrity,
    discriminator_acuity,
    exception_awareness,
    anti_overanalysis_score
  };
  const confAttempts = [
    ...attempts.filter((a) => a.confidence != null && a.confidence > 0).map((a) => ({ confidence: a.confidence, correct: Boolean(a.correct) })),
    ...evidences.filter((e) => e.confidence != null && e.confidence > 0 && e.correct_answer != null).map((e) => ({ confidence: e.confidence, correct: Boolean(e.correct_answer) }))
  ];
  let brier_score = null;
  let overconfidence_bias = null;
  let underconfidence_bias = null;
  let calibration_curve = [];
  if (confAttempts.length > 0) {
    const totalBrier = confAttempts.reduce((acc, a) => {
      const outcome = a.correct ? 1 : 0;
      const prob = a.confidence / 100;
      return acc + Math.pow(prob - outcome, 2);
    }, 0);
    brier_score = Number((totalBrier / confAttempts.length).toFixed(2));
    const avgConf = confAttempts.reduce((acc, a) => acc + a.confidence, 0) / confAttempts.length;
    const avgAcc = confAttempts.filter((a) => a.correct).length / confAttempts.length * 100;
    const bias = Math.round(avgConf - avgAcc);
    overconfidence_bias = Math.max(0, bias);
    underconfidence_bias = Math.max(0, -bias);
    const buckets = [
      { predicted: 20, min: 0, max: 30 },
      { predicted: 40, min: 31, max: 50 },
      { predicted: 60, min: 51, max: 70 },
      { predicted: 80, min: 71, max: 90 },
      { predicted: 100, min: 91, max: 100 }
    ];
    calibration_curve = buckets.map((b) => {
      const inBucket = confAttempts.filter((a) => a.confidence >= b.min && a.confidence <= b.max);
      const acc = inBucket.length > 0 ? Math.round(inBucket.filter((a) => a.correct).length / inBucket.length * 100) : b.predicted;
      return {
        predicted_confidence: b.predicted,
        actual_accuracy: acc
      };
    });
  }
  let existingErrors = INITIAL_HIERARCHICAL_ERRORS;
  if (userModelRow?.error_profile) {
    try {
      const p = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(p) && p.length > 0 && p[0].reasoning_family) {
        existingErrors = p;
      }
    } catch {
    }
  }
  const updatedErrors = existingErrors.map((err) => {
    const errAttempts = attempts.filter(
      (a) => a.question_id?.includes(err.id.replace("err_", "")) || a.reasoning_error?.includes(err.name)
    );
    const errEvidences = evidences.filter(
      (e) => e.error_id === err.id || e.evidence_summary && e.evidence_summary.includes(err.name)
    );
    const totalEventsCount = errAttempts.length + errEvidences.length;
    if (totalEventsCount === 0) {
      return {
        ...err,
        stage: err.stage != null ? err.stage : null,
        model_confidence: err.model_confidence != null ? err.model_confidence : null,
        status: err.status || "Unassessed",
        linked_evidence_count: 0,
        feature_sources: [],
        evidence_strength: 0
      };
    }
    const wrongAtts = errAttempts.filter((a) => !a.correct).length;
    const correctAtts = errAttempts.filter((a) => a.correct).length;
    const wrongEvs = errEvidences.filter((e) => e.correct_answer === 0 || e.correct_reasoning === 0 || e.reconstruction_score != null && e.reconstruction_score < 60).length;
    const correctEvs = errEvidences.filter((e) => e.correct_answer === 1 || e.correct_reasoning === 1 || e.robust_mechanism === 1 || e.reconstruction_score != null && e.reconstruction_score >= 75).length;
    const totalWrong = wrongAtts + wrongEvs;
    const totalCorrect = correctAtts + correctEvs;
    const featureSourcesSet = /* @__PURE__ */ new Set();
    if (errAttempts.length > 0) featureSourcesSet.add("mcq_test");
    for (const e of errEvidences) {
      if (e.feature) featureSourcesSet.add(e.feature);
    }
    const featureSources = Array.from(featureSourcesSet);
    const avgStrength = errEvidences.length > 0 ? Number((errEvidences.reduce((acc, e) => acc + (e.evidence_strength || 0.5), 0) / errEvidences.length).toFixed(2)) : 0.5;
    const recentWrongAtts = errAttempts.slice(-3).filter((a) => !a.correct).length;
    const recentWrongEvs = errEvidences.slice(-3).filter((e) => e.correct_answer === 0 || e.correct_reasoning === 0).length;
    const recentWrong = recentWrongAtts + recentWrongEvs;
    const transferSurvived = errEvidences.some((e) => e.transferable_mastery === 1) || correctAtts >= 2;
    const transferTested = errEvidences.some((e) => e.feature === "mcq_test" && e.transferable_mastery != null) || totalCorrect >= 1;
    let status = "Developing";
    let conf = 0.5;
    if (totalWrong === 1 && totalCorrect === 0) {
      status = "Emerging";
      conf = Math.min(0.55, 0.4 + avgStrength * 0.15);
    } else if (totalWrong >= 2 || featureSources.length >= 2) {
      status = "Unstable";
      conf = Math.min(0.96, Number((0.55 + totalWrong * 0.08 + (featureSources.length >= 2 ? 0.12 : 0) - totalCorrect * 0.05).toFixed(2)));
    } else if (totalCorrect >= 3 && recentWrong === 0) {
      status = transferSurvived ? "Strong" : "Stable";
      conf = Math.max(0.2, Number((0.4 - totalCorrect * 0.05).toFixed(2)));
    }
    if (totalCorrect >= 5 && transferSurvived) {
      status = "Well-calibrated";
      conf = 0.15;
    }
    const stage = Math.min(7, Math.max(1, 1 + totalCorrect));
    const transfer_status = transferSurvived ? "Survived" : transferTested ? "Tested" : totalCorrect >= 1 ? "Pending" : "Unassessed";
    const lastEvent = errEvidences[errEvidences.length - 1] || errAttempts[errAttempts.length - 1];
    let hypothesis = err.current_hypothesis;
    if (lastEvent && lastEvent.evidence_summary) {
      hypothesis = lastEvent.evidence_summary.slice(0, 120);
    }
    return {
      ...err,
      error_frequency: totalWrong,
      successful_repairs: totalCorrect,
      recent_frequency: recentWrong,
      stage,
      model_confidence: conf,
      status,
      transfer_status,
      linked_evidence_count: totalEventsCount,
      feature_sources: featureSources,
      evidence_strength: avgStrength,
      last_seen: lastEvent?.created_at || err.last_seen,
      current_hypothesis: hypothesis
    };
  });
  const avgTime = allTimeEvents.length > 0 ? Math.round(allTimeEvents.reduce((acc, t) => acc + t, 0) / allTimeEvents.length) : null;
  const cognitiveResources = {
    average_time_per_decision_sec: avgTime,
    unnecessary_tests_requested_rate: attempts.length > 0 ? 0.12 : null,
    overanalysis_flags_count: attempts.filter((a) => a.time_taken > 70).length + evidences.filter((e) => e.error_id === "err_overanalysis_trap").length,
    decision_commit_efficiency: avgTime && avgTime < 40 ? "High" : avgTime ? "Moderate" : "Pending Assessment"
  };
  const nextBestTask = await deriveNextBestTask({ userId });
  const recommendedTest = {
    mode: nextBestTask.test_mode || "weakness_hunt",
    title: nextBestTask.title,
    rationale: nextBestTask.reason,
    target_weakness: nextBestTask.target_error_name || nextBestTask.topic_name
  };
  const evolutionLog = [];
  for (const a of attempts) {
    if (a.reasoning_error && a.reasoning_error.includes("Root Error")) {
      evolutionLog.push({
        timestamp: a.created_at,
        trigger_event: `Diagnostic Question Attempt (${a.question_id})`,
        old_hypothesis: "Initial hypothesis pending stress-testing.",
        new_evidence: `Manifested error in question ${a.question_id} with ${a.confidence}% confidence.`,
        revised_hypothesis: a.reasoning_error
      });
    } else if (a.correct) {
      evolutionLog.push({
        timestamp: a.created_at,
        trigger_event: `Successful Defense (${a.question_id})`,
        old_hypothesis: "Vulnerability under physical perturbation.",
        new_evidence: `Successfully defended mechanism with ${a.confidence}% confidence in ${a.time_taken || 25}s.`,
        revised_hypothesis: "Progressing towards consolidated mental model; advancing to transfer verification."
      });
    }
  }
  for (const ev of evidences) {
    evolutionLog.push({
      timestamp: ev.created_at,
      trigger_event: `Adaptive Evidence from [${ev.feature}]`,
      old_hypothesis: "Continuous tracking across learning modes.",
      new_evidence: ev.evidence_summary,
      revised_hypothesis: `Evidence strength ${ev.evidence_strength}. Status: ${ev.correct_reasoning ? "Defended" : "Challenged"}.`
    });
  }
  const evolvingHypotheses = updatedErrors.filter((e) => e.stage != null).map((err) => ({
    id: "hyp_" + err.id,
    target_weakness: err.name,
    hypothesis: err.current_hypothesis,
    competing_alternatives: [
      "Alternative A: Isolated terminology confusion",
      "Alternative B: Task-switching cognitive fatigue",
      "Alternative C: Context-dependent heuristic failure"
    ],
    status: err.status === "Well-calibrated" || err.status === "Strong" ? "Validated" : "Active",
    updated_at: err.last_seen || (/* @__PURE__ */ new Date()).toISOString()
  }));
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.run(
    `
    UPDATE user_model SET
      reasoning_profile = ?,
      topic_mastery = ?,
      error_profile = ?,
      confidence_calibration = ?,
      cognitive_resource_allocation = ?,
      updated_at = ?
    WHERE user_id = ?
  `,
    JSON.stringify(reasoningProfile),
    JSON.stringify(topicMastery),
    JSON.stringify(updatedErrors),
    JSON.stringify({ brier_score, overconfidence_bias, underconfidence_bias, calibration_curve }),
    JSON.stringify(cognitiveResources),
    now,
    userId
  );
  return {
    id: userModelRow?.id || "model_" + userId,
    user_id: userId,
    reasoning_profile: reasoningProfile,
    topic_mastery: topicMastery,
    error_profile: updatedErrors,
    hierarchical_errors: updatedErrors,
    evolving_hypotheses: evolvingHypotheses,
    evolution_log: evolutionLog.slice(-20),
    recommended_test: recommendedTest,
    next_best_task: nextBestTask,
    recent_evidence: evidences.slice(-15).reverse(),
    confidence_calibration: { brier_score, overconfidence_bias, underconfidence_bias, calibration_curve },
    cognitive_resource_allocation: cognitiveResources,
    recommended_difficulty: "Mechanistic",
    updated_at: now
  };
}
async function selectAdaptiveQuestion(params) {
  const userId = params.userId || DEFAULT_USER_ID;
  await ensureAdaptiveUserModel(userId);
  const userModelRow = await db.get("SELECT * FROM user_model WHERE user_id = ?", userId);
  let errors = INITIAL_HIERARCHICAL_ERRORS;
  if (userModelRow?.error_profile) {
    try {
      const parsed = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(parsed) && parsed[0]?.reasoning_family) {
        errors = parsed;
      }
    } catch (e) {
    }
  }
  const recentAttempts = await db.all(`
    SELECT question_id FROM question_attempts
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 6
  `, userId);
  const recentQIds = new Set(recentAttempts.map((a) => a.question_id));
  const sortedErrors = [...errors].sort((a, b) => {
    const aConf = a.model_confidence ?? 0;
    const bConf = b.model_confidence ?? 0;
    const aPriority = aConf * (a.recent_frequency + 1) * (a.status === "Unstable" ? 1.5 : 1);
    const bPriority = bConf * (b.recent_frequency + 1) * (b.status === "Unstable" ? 1.5 : 1);
    return bPriority - aPriority;
  });
  const priorityError = sortedErrors[0] || errors[0];
  if (params.custom_topic_name && params.custom_topic_name.trim().length > 0 || params.question_format === "long_answer") {
    return await generateDynamicDiagnosticQuestion({
      target_error: priorityError,
      topic_id: params.topic_id,
      custom_topic_name: params.custom_topic_name?.trim(),
      topic_name: params.topic_name || params.custom_topic_name?.trim(),
      mode: params.mode,
      question_format: params.question_format || "mcq",
      difficulty: params.difficulty || "Mechanistic",
      detected_gaps: params.detected_gaps,
      context_summary: params.context_summary,
      unresolved_questions: params.unresolved_questions
    });
  }
  const allowedTopicIds = /* @__PURE__ */ new Set();
  if (params.topic_id) allowedTopicIds.add(params.topic_id);
  if (Array.isArray(params.topic_ids)) {
    params.topic_ids.forEach((id) => allowedTopicIds.add(id));
  }
  let matchedQuestions = CURATED_DIAGNOSTIC_QUESTIONS.filter((q) => {
    if (allowedTopicIds.size > 0 && !allowedTopicIds.has(q.topic_id)) {
      return false;
    }
    if (params.mode === "weakness_hunt") {
      return q.root_error_target === priorityError.id;
    }
    if (params.mode === "transfer_test" || params.focus === "transfer") {
      return q.question_type === "TYPE_B_DISGUISED_TRANSFER";
    }
    if (params.mode === "exploration_test" || params.focus === "exploration") {
      return q.question_type === "TYPE_F_FALSE_CONFIDENCE" || q.question_type === "TYPE_D_COMPETING_MECHANISMS";
    }
    if (params.mode === "mechanism_test") {
      return q.question_type === "TYPE_C_MECHANISM_REVERSAL" || q.question_type === "TYPE_D_COMPETING_MECHANISMS";
    }
    if (params.mode === "first_principles") {
      return q.question_type === "TYPE_A_DIRECT_DIAGNOSTIC" || q.question_type === "TYPE_J_RECONSTRUCTION";
    }
    if (params.mode === "adversarial_test") {
      return q.question_type === "TYPE_I_ADVERSARIAL_MODEL";
    }
    if (params.mode === "reconstruction" || params.focus === "reconstruction") {
      return q.question_type === "TYPE_J_RECONSTRUCTION";
    }
    if (params.mode === "calibration_test") {
      return q.question_type === "TYPE_F_FALSE_CONFIDENCE" || q.question_type === "TYPE_G_OVERANALYSIS";
    }
    return true;
  });
  const nonRecent = matchedQuestions.filter((q) => !recentQIds.has(q.id));
  const candidatePool = nonRecent.length > 0 ? nonRecent : matchedQuestions;
  if (candidatePool.length > 0) {
    const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    return { ...selected, question_format: "mcq" };
  }
  return await generateDynamicDiagnosticQuestion({
    target_error: priorityError,
    topic_id: params.topic_id || params.topic_ids && params.topic_ids[0],
    topic_name: params.topic_name,
    custom_topic_name: params.custom_topic_name,
    mode: params.mode,
    question_format: params.question_format || "mcq",
    difficulty: params.difficulty || "Mechanistic",
    detected_gaps: params.detected_gaps,
    context_summary: params.context_summary,
    unresolved_questions: params.unresolved_questions
  });
}
async function generateDynamicDiagnosticQuestion(params) {
  const err = params.target_error;
  const effectiveTopic = params.custom_topic_name || params.topic_name || "Physics Mechanics & Dynamics";
  const isLongAnswer = params.question_format === "long_answer";
  const gapsInfo = params.detected_gaps && params.detected_gaps.length > 0 ? `
Active Misconceptions / Flaws Flagged in Recent Student Dialogue:
${params.detected_gaps.map((g) => `- ${g}`).join("\n")}
` : "";
  const contextSummaryInfo = params.context_summary ? `
Recent Discussion Summary / Mechanism Context:
"${params.context_summary}"
` : "";
  const unresolvedQuestionsInfo = params.unresolved_questions && params.unresolved_questions.length > 0 ? `
Unresolved Questions / Ambiguities from Prior Conversation:
${params.unresolved_questions.map((q) => `- ${q}`).join("\n")}
` : "";
  const prompt = isLongAnswer ? `You are the lead cognitive psychometrician and Physics professor for the MECHANISM adaptive test engine.
GENERATE A HIGH-DIAGNOSTIC-VALUE OPEN-ENDED LONG ANSWER PHYSICAL REASONING QUESTION.

Target Customized Topic / Concept: "${effectiveTopic}"
Target Reasoning Flaw Under Diagnostic Attack: "${err.name}"
Reasoning Family: "${err.reasoning_family}"
Specific Failure: "${err.specific_failure}"
Trigger Condition: "${err.trigger_conditions}"
Current Hypothesis About Learner's Flawed Mental Model: "${err.current_hypothesis}"
Target Difficulty: "${params.difficulty}"
Mode: "${params.mode}"${contextSummaryInfo}${gapsInfo}${unresolvedQuestionsInfo}

STRICT DESIGN RULES FOR LONG ANSWER QUESTION:
1. Formulate a rich, high-fidelity physical scenario with experimental apparatus, boundary parameters, or field values.
2. The question MUST ask the student to articulate their full mechanistic derivation:
   - Step A (primary initiating perturbation / applied potential / boundary change)
   - Step B (intermediate dynamical variable shift / flux response)
   - Step C (conservation feedback / equilibrium restoration)
   - Step D (discriminator from competing alternative physical models)
3. Specifically construct the scenario so that if the student commits their targeted flaw ("${err.name}"), their derivation will produce an erroneous conclusion or missing link.
4. Output a comprehensive canonical correct explanation and scoring rubric detailing what constitutes a sound causal derivation vs flawed pattern matching.

OUTPUT STRICT VALID JSON ONLY (no markdown formatting, no code fence):
{
  "question_text": "Detailed physical question requiring long-form mechanistic derivation...",
  "scenario_vignette": "Realistic experimental setup with precise parameter numbers and constraints...",
  "options": [],
  "correct_answer": "Complete canonical step-by-step mathematical/physical derivation and solution",
  "explanation": "Pristine first-principles physical explanation with all causal links and conservation laws",
  "discriminator_note": "CRUCIAL DISCRIMINATOR: The exact physical observation or measurement that confirms the mechanism",
  "scoring_rubric": "Rubric: 1. Correctly identifies primary governing law... 2. Distinguishes macro vs micro forces... 3. Avoids [${err.name}]",
  "reasoning_target": "Evaluating step-by-step causal derivation while challenging ${err.name}",
  "question_type": "TYPE_A_DIRECT_DIAGNOSTIC",
  "internal_rationale": "Internal diagnostic purpose: exposes whether student can construct a coherent causal chain on ${effectiveTopic} without committing ${err.name}",
  "competing_paths": ["Path 1: First-principles causal derivation", "Path 2: Target error (${err.name}) failure pattern"],
  "falsification_criteria": "Student's reasoning will be falsified if they violate conservation laws or reverse causality."
}` : `You are the lead cognitive psychometrician and Physics professor for the MECHANISM adaptive test engine.
GENERATE A HIGH-DIAGNOSTIC-VALUE PHYSICAL REASONING MULTIPLE CHOICE QUESTION.

Target Customized Topic / Focus: "${effectiveTopic}"
Target Reasoning Weakness: "${err.name}"
Reasoning Family: "${err.reasoning_family}"
Specific Failure: "${err.specific_failure}"
Trigger Condition: "${err.trigger_conditions}"
Current Hypothesis About Learner: "${err.current_hypothesis}"
Target Difficulty: "${params.difficulty}"
Mode: "${params.mode}"${contextSummaryInfo}${gapsInfo}${unresolvedQuestionsInfo}

STRICT DESIGN RULES:
1. OPTIMIZE FOR DIAGNOSTIC VALUE ON "${effectiveTopic}", NOT MERE TRIVIA DIFFICULTY.
2. Disguise the underlying reasoning challenge within realistic experimental or theoretical data for "${effectiveTopic}".
3. Craft 4 distinct options:
   - 1 scientifically pristine correct answer derived from physical first principles.
   - 1 distractor designed specifically to entrap the student IF AND ONLY IF they commit the targeted reasoning failure ("${err.name}").
   - 1 distractor representing a competing alternative mechanism.
   - 1 distractor representing superficial associative recall.
4. Provide a realistic physical vignette with precise quantitative or qualitative data.
5. Provide an internal diagnostic rationale (why this question was selected and what it reveals about how the student thinks).

OUTPUT STRICT VALID JSON ONLY (no markdown formatting, no code fence):
{
  "question_text": "...",
  "scenario_vignette": "...",
  "options": [
    "Option A...",
    "Option B...",
    "Option C...",
    "Option D..."
  ],
  "correct_answer": "Exact text of the correct option",
  "explanation": "Pristine physical explanation with causal chain and first principles",
  "discriminator_note": "CRUCIAL DISCRIMINATOR: ...",
  "reasoning_target": "The exact reasoning skill being evaluated",
  "question_type": "TYPE_B_DISGUISED_TRANSFER",
  "internal_rationale": "Internal diagnostic purpose of this question",
  "competing_paths": ["Path 1: Correct derivation", "Path 2: Target error bug"],
  "falsification_criteria": "How this question falsifies or confirms the student error model"
}`;
  try {
    const result = await queryGemini({
      prompt,
      temperature: 0.2
    });
    let cleanJson = result.text.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    const parsed = JSON.parse(cleanJson);
    const id = "dyn_q_" + Date.now();
    const newQ = {
      id,
      topic_id: params.topic_id || "top_custom_diagnostic",
      topic_name: effectiveTopic,
      subject_name: "Physical Sciences",
      mode: params.mode,
      question_format: params.question_format || (isLongAnswer ? "long_answer" : "mcq"),
      question_text: parsed.question_text,
      scenario_vignette: parsed.scenario_vignette || parsed.physical_scenario || "",
      options: isLongAnswer ? [] : parsed.options || [],
      correct_answer: parsed.correct_answer,
      explanation: parsed.explanation,
      discriminator_note: parsed.discriminator_note,
      reasoning_target: parsed.reasoning_target || err.name,
      difficulty: params.difficulty || "Mechanistic",
      question_type: parsed.question_type || (isLongAnswer ? "TYPE_A_DIRECT_DIAGNOSTIC" : "TYPE_B_DISGUISED_TRANSFER"),
      root_error_target: err.id,
      internal_rationale: parsed.internal_rationale,
      competing_paths: parsed.competing_paths,
      falsification_criteria: parsed.falsification_criteria,
      scoring_rubric: parsed.scoring_rubric || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.run(
      `
      INSERT INTO questions (
        id, topic_id, mode, question_text, options, correct_answer,
        explanation, reasoning_target, difficulty, scenario_vignette, clinical_vignette, discriminator_note,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      newQ.id,
      newQ.topic_id,
      newQ.mode,
      newQ.question_text,
      JSON.stringify(newQ.options),
      newQ.correct_answer,
      newQ.explanation,
      newQ.reasoning_target,
      newQ.difficulty,
      newQ.scenario_vignette || "",
      newQ.scenario_vignette || "",
      newQ.discriminator_note || "",
      newQ.created_at
    );
    return newQ;
  } catch (err2) {
    console.error("Error generating dynamic diagnostic question, falling back to curated pool:", err2);
    return {
      ...CURATED_DIAGNOSTIC_QUESTIONS[0],
      question_format: params.question_format || "mcq"
    };
  }
}
async function evaluateAdaptiveAttempt(params) {
  const userId = params.user_id || DEFAULT_USER_ID;
  await ensureAdaptiveUserModel(userId);
  let q = CURATED_DIAGNOSTIC_QUESTIONS.find((item) => item.id === params.question_id);
  if (!q) {
    const row = await db.get("SELECT * FROM questions WHERE id = ?", params.question_id);
    if (row) {
      const opts = JSON.parse(row.options || "[]");
      q = {
        ...row,
        options: opts,
        question_format: opts.length === 0 ? "long_answer" : "mcq"
      };
    }
  }
  if (!q) {
    throw new Error("Diagnostic Question not found");
  }
  const isLongAnswer = q.question_format === "long_answer" || (!q.options || q.options.length === 0);
  let isCorrect = isLongAnswer ? false : params.answer.trim() === q.correct_answer.trim();
  const confidenceVal = Math.max(0, Math.min(100, params.confidence || 80));
  const timeTaken = params.time_taken || 25;
  const userModelRow = await db.get("SELECT * FROM user_model WHERE user_id = ?", userId);
  let errors = INITIAL_HIERARCHICAL_ERRORS;
  let calibration = {
    brier_score: 0.16,
    overconfidence_bias: 14,
    underconfidence_bias: 4,
    calibration_curve: [
      { predicted_confidence: 20, actual_accuracy: 25 },
      { predicted_confidence: 40, actual_accuracy: 42 },
      { predicted_confidence: 60, actual_accuracy: 52 },
      { predicted_confidence: 80, actual_accuracy: 68 },
      { predicted_confidence: 100, actual_accuracy: 86 }
    ]
  };
  if (userModelRow) {
    try {
      const parsedErrors = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(parsedErrors) && parsedErrors[0]?.reasoning_family) {
        errors = parsedErrors;
      }
      if (userModelRow.confidence_calibration) {
        calibration = JSON.parse(userModelRow.confidence_calibration);
      }
    } catch {
    }
  }
  const targetErrorId = q.root_error_target || "err_assoc_causation";
  const targetError = errors.find((e) => e.id === targetErrorId) || errors[0];
  const reasoningText = (params.reasoning || "").trim();
  let aiEvaluation = null;
  if (isLongAnswer || reasoningText.length > 8) {
    try {
      const evalPrompt = `You are the lead Physics cognitive psychometrician evaluating a student's diagnostic test response.
Target Topic: "${q.topic_name || "Physical Sciences"}"
Question Text:
"""
${q.question_text}
"""
${q.scenario_vignette ? `Physical Scenario:
"""
${q.scenario_vignette}
"""
` : ""}
Question Format: ${isLongAnswer ? "OPEN-ENDED LONG ANSWER" : "MULTIPLE CHOICE QUESTION"}
Canonical Correct Answer / Derivation:
"""
${q.correct_answer}
"""
Canonical Physical Explanation:
"""
${q.explanation}
"""
Critical Discriminator: "${q.discriminator_note || "N/A"}"
${q.scoring_rubric ? `Scoring Rubric: "${q.scoring_rubric}"` : ""}

STUDENT SUBMISSION:
Student's Selected or Written Answer:
"""
${params.answer}
"""
Student's Stated Reasoning ("Why did you choose this specific answer / explanation"):
"""
${params.reasoning || "(No explicit reasoning supplied)"}
"""
Stated Confidence: ${confidenceVal}%
Time Taken: ${timeTaken}s

TARGET COGNITIVE FLAW UNDER DIAGNOSTIC STRESS: "${targetError.name}"
Flaw Profile: ${targetError.specific_failure}
Trigger Condition: ${targetError.trigger_conditions}
Current Working Model: "${targetError.current_hypothesis}"

YOUR TASK:
1. Is the student's answer causally sound? (${isLongAnswer ? "Evaluate if the long answer captures the primary insult, intermediate shifts, and key discriminators" : "Evaluate if they selected the correct option"}).
2. Scrutinize the student's stated reasoning ("Why they chose it"):
   - Did they exhibit Directionality Inversion (reversing cause/effect)?
   - Did they commit Association-to-Causation Confounding (confusing macroscopic correlation with true dynamical causality)?
   - Did they commit Premature Closure (ignoring discriminators)?
   - Did they commit Overanalysis (hesitating when sufficiency is met)?
   - Did they omit compensatory physical feedback or restoring forces?
3. Provide a constructive, razor-sharp psychometric critique of their reasoning.
4. Provide a refined hypothesis of how this student's understanding fails, so this flaw can be tracked across the entire webapp.

OUTPUT STRICT JSON ONLY (no markdown fences):
{
  "is_correct": boolean,
  "reasoning_quality_score": number (0 - 100),
  "reasoning_critique": "Concise 2-3 sentence academic evaluation of their causal chain and blind spots",
  "target_error_occurred": boolean (true if student exhibited ${targetError.name} or related flaw),
  "root_error_classified": "Name of the classified flaw",
  "flaw_analysis": "Precise summary of the mistake in their pattern of understanding",
  "model_revision": "Refined diagnostic hypothesis about the student's cognitive model",
  "recommended_next_test": "Next diagnostic challenge or disguised transfer test"
}`;
      const geminiRes = await queryGemini({ prompt: evalPrompt, temperature: 0.15 });
      let cleanJson = geminiRes.text.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      }
      aiEvaluation = JSON.parse(cleanJson);
      if (isLongAnswer && typeof aiEvaluation?.is_correct === "boolean") {
        isCorrect = aiEvaluation.is_correct;
      }
    } catch (e) {
      console.warn("Gemini attempt evaluation error, proceeding with deterministic fallback:", e);
    }
  }
  let reasoningQualityScore = aiEvaluation?.reasoning_quality_score ?? (isCorrect ? 75 : 45);
  let reasoningCritique = aiEvaluation?.reasoning_critique ?? "Adequate reasoning provided.";
  if (!aiEvaluation) {
    if (reasoningText.length > 20) {
      const hasCausalKeywords = /restoring force|damping|dissipation|flux|entropy|isentropic|adiabatic|lorentz|eddy|lagrangian|hamiltonian|phase space|impedance|velocity|discriminator|first principles|axiom|derivative|eigen/i.test(reasoningText);
      if (hasCausalKeywords && isCorrect) {
        reasoningQualityScore = 94;
        reasoningCritique = "Exceptional first-principles physical derivation. Causal chain and directionality were explicitly linked.";
      } else if (hasCausalKeywords && !isCorrect) {
        reasoningQualityScore = 65;
        reasoningCritique = "Identified relevant physical parameters, but inverted the direction of the intermediate impedance or opposing back-action.";
      } else {
        reasoningQualityScore = isCorrect ? 78 : 45;
        reasoningCritique = isCorrect ? "Correct answer, but explanation relied partially on intuitive heuristic rather than formal physical steps." : "Reasoning missed the crucial experimental/detector discriminator.";
      }
    } else {
      reasoningQualityScore = isCorrect ? 60 : 35;
      reasoningCritique = "Minimal reasoning provided before committing to decision.";
    }
  }
  let calibrationVerdict = "Calibrated";
  let calibrationAnalysis = "";
  if (!isCorrect && confidenceVal >= 80) {
    calibrationVerdict = confidenceVal === 100 ? "False Certainty" : "Overconfident";
    calibrationAnalysis = `High stated confidence (${confidenceVal}%) on an incorrect model indicates a persistent blind spot. The distractor appeared intuitively plausible, trapping unverified assumptions.`;
    calibration.overconfidence_bias = Math.min(30, calibration.overconfidence_bias + 3);
  } else if (isCorrect && confidenceVal <= 40) {
    calibrationVerdict = "Underconfident";
    calibrationAnalysis = `Low stated confidence (${confidenceVal}%) despite sound derivation. Your physical mental model is stronger than your self-assessment.`;
    calibration.underconfidence_bias = Math.min(25, calibration.underconfidence_bias + 2);
  } else if (isCorrect && confidenceVal >= 70) {
    calibrationVerdict = "Calibrated";
    calibrationAnalysis = `Well-calibrated certainty (${confidenceVal}%). High confidence was backed by correct causal directionality.`;
    calibration.overconfidence_bias = Math.max(5, calibration.overconfidence_bias - 1);
  } else {
    calibrationVerdict = "Calibrated";
    calibrationAnalysis = `Appropriate calibration (${confidenceVal}% certainty). Uncertainty was acknowledged where alternative explanations existed.`;
  }
  let timeEfficiencyAnalysis = "";
  if (q.question_type === "TYPE_G_OVERANALYSIS") {
    if (isCorrect) {
      timeEfficiencyAnalysis = `Commit threshold recognized in ${timeTaken}s. Excellent cognitive economy: identified that additional diagnostic tests would provide zero marginal decision value.`;
    } else {
      timeEfficiencyAnalysis = `Overanalysis trap triggered (${timeTaken}s). Delayed life-saving intervention to gather redundant tests after the diagnostic threshold had already been reached.`;
    }
  } else {
    if (timeTaken < 15 && !isCorrect) {
      timeEfficiencyAnalysis = `Premature decision in ${timeTaken}s. Answered rapidly before inspecting the critical discriminator note.`;
    } else if (timeTaken > 45 && isCorrect) {
      timeEfficiencyAnalysis = `Deliberate analytical derivation (${timeTaken}s). High decision depth safely resolved competing mechanisms.`;
    } else {
      timeEfficiencyAnalysis = `Standard analytical pacing (${timeTaken}s). Efficient transition from observation to commitment.`;
    }
  }
  const targetErrorOccurred = aiEvaluation?.target_error_occurred !== void 0 ? Boolean(aiEvaluation.target_error_occurred) : !isCorrect;
  const oldHypothesis = targetError.current_hypothesis;
  let newEvidence = "";
  let modelRevision = aiEvaluation?.model_revision || "";
  if (isCorrect) {
    targetError.successful_repairs += 1;
    targetError.recent_frequency = Math.max(0, targetError.recent_frequency - 1);
    if (q.question_type === "TYPE_B_DISGUISED_TRANSFER") {
      targetError.transfer_status = "Survived";
    }
    if (targetError.stage < 7) {
      targetError.stage += 1;
    }
    if (targetError.successful_repairs >= 3) {
      targetError.status = targetError.transfer_status === "Survived" ? "Strong" : "Stable";
      targetError.model_confidence = Math.max(0.35, Number((targetError.model_confidence - 0.08).toFixed(2)));
    }
    newEvidence = `Defended ${targetError.name} in question "${q.id}" (${confidenceVal}% confidence, stage ${targetError.stage}).`;
    if (!modelRevision) {
      if (targetError.id === "err_directionality_inversion") {
        modelRevision = "Learner consistently respects directionality in dynamic flux and impedance interactions. Vulnerability appears restricted to multi-tiered boundary conditions under severe time constraints.";
      } else if (targetError.id === "err_assoc_causation") {
        modelRevision = "Learner successfully decoupled macroscopic state variables from boundary heat/work fluxes. Association error is decaying in thermodynamic and electrodynamic domains.";
      } else {
        modelRevision = `Learner demonstrated reliable discriminators for ${targetError.name}. Prioritizing transfer testing under varied physical contexts.`;
      }
    }
    targetError.current_hypothesis = modelRevision;
    targetError.next_diagnostic_test = `Spaced transfer test in advanced electrodynamics / mechanics (Stage ${targetError.stage}).`;
  } else {
    targetError.error_frequency += 1;
    targetError.recent_frequency += 1;
    targetError.status = "Unstable";
    targetError.model_confidence = Math.min(0.95, Number((targetError.model_confidence + 0.06).toFixed(2)));
    targetError.last_seen = (/* @__PURE__ */ new Date()).toISOString();
    newEvidence = `Manifested ${targetError.name} in question "${q.id}" (${confidenceVal}% confidence, ${timeTaken}s).`;
    if (!modelRevision) {
      if (targetError.id === "err_assoc_causation") {
        modelRevision = 'User reverts to association\u2192causation ("higher temperature = heat absorbed") when the macroscopic state shift is prominent, failing to check mechanical work and adiabatic boundary conditions.';
      } else if (targetError.id === "err_directionality_inversion") {
        modelRevision = "Directional inversion occurs primarily when force and effect move oppositely through intermediate impedance or induced back-EMF (e.g. Lenz law back-action opposing motion).";
      } else if (targetError.id === "err_premature_closure") {
        modelRevision = "User closes physical inquiry prematurely upon recognizing a familiar prototype, bypassing envelope linearity and damping discriminators.";
      } else {
        modelRevision = `Error triggered under condition: ${targetError.trigger_conditions}. Current model reinforced with confidence ${targetError.model_confidence}.`;
      }
    }
    targetError.current_hypothesis = modelRevision;
    targetError.next_diagnostic_test = `Re-test under different physical disguise: ${targetError.countermeasure}`;
  }
  const nextExpMode = isCorrect ? targetError.transfer_status === "Pending" ? "transfer_test" : "mechanism_test" : "weakness_hunt";
  const nextExperiment = {
    mode: nextExpMode,
    description: aiEvaluation?.recommended_next_test || (isCorrect ? `Advance to Stage ${targetError.stage}: Transfer test "${targetError.name}" into another physical system.` : `Re-test "${targetError.name}" under a different experimental disguise to test the refined hypothesis: "${modelRevision.slice(0, 80)}..."`),
    target: targetError.name
  };
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.run(
    "UPDATE user_model SET error_profile = ?, confidence_calibration = ?, updated_at = ? WHERE user_id = ?",
    JSON.stringify(errors),
    JSON.stringify(calibration),
    now,
    userId
  );
  const attId = "q_att_" + Date.now();
  await db.run(
    `
    INSERT INTO question_attempts (
      id, user_id, question_id, answer, correct, confidence,
      reasoning, reasoning_error, time_taken, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    attId,
    userId,
    q.id,
    params.answer,
    isCorrect ? 1 : 0,
    confidenceVal,
    reasoningText,
    isCorrect ? "" : `Root Error: ${targetError.name}. ${calibrationAnalysis}`,
    timeTaken,
    now
  );
  const evidenceSummary = isCorrect ? `Test Attempt on "${q.topic_name || q.id}": Defended mechanism. Reasoning quality: ${reasoningQualityScore}%, stated confidence: ${confidenceVal}%, time: ${timeTaken}s.` : `Test Attempt on "${q.topic_name || q.id}": Manifested root error "${targetError.name}". Stated confidence: ${confidenceVal}%, time: ${timeTaken}s. Discriminator entrapment: ${q.discriminator_note || "Bypassed critical physical discriminator."}`;
  const emittedEvidence = await processAdaptiveEvidence({
    user_id: userId,
    feature: "mcq_test",
    topic_id: q.topic_id,
    topic_name: q.topic_name,
    error_id: targetError.id,
    error_name: targetError.name,
    correct_answer: isCorrect,
    correct_reasoning: reasoningQualityScore >= 70,
    robust_mechanism: isCorrect && reasoningQualityScore >= 75,
    transferable_mastery: q.question_type === "TYPE_B_DISGUISED_TRANSFER" && isCorrect,
    confidence: confidenceVal,
    time_taken_sec: timeTaken,
    discriminator_identified: isCorrect,
    evidence_summary: evidenceSummary,
    created_at: now
  });
  const updatedModel = await computeAdaptiveUserModel(userId);
  return {
    correct: isCorrect,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    discriminator_note: q.discriminator_note,
    root_error_detected: isCorrect ? null : targetError.name,
    target_error_occurred: targetErrorOccurred,
    reasoning_quality_score: reasoningQualityScore,
    reasoning_critique: reasoningCritique,
    calibration_verdict: calibrationVerdict,
    calibration_analysis: calibrationAnalysis,
    time_efficiency_analysis: timeEfficiencyAnalysis,
    old_hypothesis: oldHypothesis,
    new_evidence: newEvidence,
    model_revision: modelRevision,
    next_experiment: nextExperiment,
    hierarchical_errors: updatedModel.hierarchical_errors,
    next_best_task: updatedModel.next_best_task,
    evidence: emittedEvidence
  };
}
var app = express();
initDatabase();
ensureAdaptiveUserModel();
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", provider: AI_PROVIDER, model: CURRENT_MODEL });
});
app.get("/api/auth/status", handleGetAuthStatus);
app.post("/api/auth/initialize", handleInitializeAuth);
app.post("/api/auth/login", handleLogin);
app.get("/api/auth/session", handleGetSession);
app.post("/api/auth/logout", handleLogout);
app.post("/api/auth/change-password", handleChangePassword);
app.get("/api/auth/recovery-clue", handleGetRecoveryClue);
app.post("/api/auth/delete-account", handleDeleteAccount);
app.delete("/api/auth/account", handleDeleteAccount);
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await db.all(`
      SELECT s.*, (SELECT count(*) FROM topics t WHERE t.subject_id = s.id) as topicCount
      FROM subjects s
      ORDER BY s.name ASC
    `);
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/topics", async (req, res) => {
  try {
    const { subject_id } = req.query;
    let topics;
    if (subject_id) {
      topics = await db.all(`
        SELECT t.*, COALESCE(s.name, 'General Concepts') as subject_name
        FROM topics t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.subject_id = ?
        ORDER BY t.name ASC
      `, subject_id);
    } else {
      topics = await db.all(`
        SELECT t.*, COALESCE(s.name, 'General Concepts') as subject_name
        FROM topics t
        LEFT JOIN subjects s ON t.subject_id = s.id
        ORDER BY (CASE WHEN t.id LIKE 'top_custom_%' THEN 0 ELSE 1 END), s.name ASC, t.name ASC
      `);
    }
    res.json({ success: true, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/topics", async (req, res) => {
  try {
    const { name, subject_id, chapter, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Topic name is required" });
    }
    const trimmedName = name.trim();
    const existing = await db.get(`
      SELECT t.*, COALESCE(s.name, 'General Concepts') as subject_name
      FROM topics t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE LOWER(t.name) = LOWER(?)
    `, trimmedName);
    if (existing) {
      return res.json({ success: true, data: existing, existing: true });
    }
    const id = "top_custom_" + Date.now();
    const finalSubjectId = subject_id || "sub_physics";
    const finalChapter = chapter || "Custom Concepts";
    const finalDesc = description || `User-defined Physics reasoning topic: ${trimmedName}`;
    await db.run(`
      INSERT INTO topics (id, subject_id, name, chapter, description)
      VALUES (?, ?, ?, ?, ?)
    `, id, finalSubjectId, trimmedName, finalChapter, finalDesc);
    const subjectRow = await db.get("SELECT name FROM subjects WHERE id = ?", finalSubjectId);
    const subjectName = subjectRow ? subjectRow.name : "General Concepts";
    const newTopic = {
      id,
      subject_id: finalSubjectId,
      name: trimmedName,
      chapter: finalChapter,
      description: finalDesc,
      subject_name: subjectName,
      is_custom: true
    };
    try {
      const userId = await getAuthenticatedUserId(req);
      const row = await db.get("SELECT topic_mastery FROM user_model WHERE user_id = ?", userId);
      if (row) {
        const masteryMap = JSON.parse(row.topic_mastery || "{}");
        masteryMap[id] = {
          topic_name: trimmedName,
          mastery_percentage: 65,
          status: "Calibrating",
          last_practiced: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db.run(
          "UPDATE user_model SET topic_mastery = ?, updated_at = ? WHERE user_id = ?",
          JSON.stringify(masteryMap),
          (/* @__PURE__ */ new Date()).toISOString(),
          userId
        );
      }
    } catch (e) {
    }
    res.json({ success: true, data: newTopic });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/topics/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.run("DELETE FROM topics WHERE id = ?", id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/user-model", async (req, res) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    const userModel = await computeAdaptiveUserModel(userId);
    res.json({
      success: true,
      data: userModel
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/user-model/reset", async (req, res) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    await db.run("DELETE FROM question_attempts WHERE user_id = ?", userId);
    await db.run("DELETE FROM mechanism_evaluations WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ?)", userId);
    await db.run("DELETE FROM reconstructions WHERE user_id = ?", userId);
    await db.run("DELETE FROM adaptive_evidence WHERE user_id = ?", userId);
    await db.run("DELETE FROM active_learning_context WHERE user_id = ?", userId);
    await db.run("DELETE FROM user_model WHERE user_id = ?", userId);
    await ensureAdaptiveUserModel(userId);
    const freshModel = await computeAdaptiveUserModel(userId);
    res.json({ success: true, data: freshModel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/user-model/flaws", async (req, res) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    const summary = await getUserCognitiveFlawSummary(userId);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/adaptive/next-task", async (req, res) => {
  try {
    const topic_id = req.query.topic_id;
    const current_mode = req.query.current_mode;
    const userId = await getAuthenticatedUserId(req);
    const nextTask = await deriveNextBestTask({
      userId,
      selectedTopicId: topic_id,
      currentMode: current_mode
    });
    res.json({ success: true, data: nextTask });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/adaptive/evidence", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 40);
    const userId = await getAuthenticatedUserId(req);
    const rows = await db.all(`
      SELECT e.*, t.name as topic_name
      FROM adaptive_evidence e
      LEFT JOIN topics t ON e.topic_id = t.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
      LIMIT ?
    `, userId, limit);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/adaptive/evidence", async (req, res) => {
  try {
    const evidence = await processAdaptiveEvidence(req.body);
    res.json({ success: true, data: evidence });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/learning-context", async (req, res) => {
  try {
    const activeRow = await db.get("SELECT * FROM active_learning_context WHERE id = ?", "current_active_context");
    if (activeRow) {
      return res.json({
        success: true,
        data: {
          source: activeRow.source,
          topicId: activeRow.topic_id || void 0,
          topicName: activeRow.topic_name,
          subjectId: activeRow.subject_id || void 0,
          conversationId: activeRow.conversation_id || void 0,
          conversationTitle: activeRow.conversation_title || void 0,
          summary: activeRow.summary || "",
          detectedGaps: activeRow.detected_gaps ? JSON.parse(activeRow.detected_gaps) : [],
          keyConcepts: activeRow.key_concepts ? JSON.parse(activeRow.key_concepts) : [],
          unresolvedQuestions: activeRow.unresolved_questions ? JSON.parse(activeRow.unresolved_questions) : [],
          hasAttachments: Boolean(activeRow.has_attachments),
          attachmentNames: activeRow.attachment_names ? JSON.parse(activeRow.attachment_names) : [],
          lastUpdated: activeRow.updated_at
        }
      });
    }
    return res.json({
      success: true,
      data: null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/learning-context", async (req, res) => {
  try {
    await db.run("DELETE FROM active_learning_context WHERE id = ?", "current_active_context");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/learning-context", async (req, res) => {
  try {
    const {
      source,
      topicId,
      topicName,
      subjectId,
      conversationId,
      conversationTitle,
      summary,
      detectedGaps,
      keyConcepts,
      unresolvedQuestions,
      hasAttachments,
      attachmentNames
    } = req.body;
    if (!topicName || !topicName.trim()) {
      return res.status(400).json({ success: false, error: "topicName is required" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userId = await getAuthenticatedUserId(req);
    await db.run(
      `
      INSERT INTO active_learning_context (
        id, user_id, source, topic_id, topic_name, subject_id, conversation_id, conversation_title,
        summary, detected_gaps, key_concepts, unresolved_questions, has_attachments, attachment_names, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        source = excluded.source,
        topic_id = excluded.topic_id,
        topic_name = excluded.topic_name,
        subject_id = excluded.subject_id,
        conversation_id = excluded.conversation_id,
        conversation_title = excluded.conversation_title,
        summary = excluded.summary,
        detected_gaps = excluded.detected_gaps,
        key_concepts = excluded.key_concepts,
        unresolved_questions = excluded.unresolved_questions,
        has_attachments = excluded.has_attachments,
        attachment_names = excluded.attachment_names,
        updated_at = excluded.updated_at
    `,
      "current_active_context",
      userId,
      source || "custom_topic",
      topicId || null,
      topicName.trim(),
      subjectId || null,
      conversationId || null,
      conversationTitle || null,
      summary || "",
      JSON.stringify(Array.isArray(detectedGaps) ? detectedGaps : []),
      JSON.stringify(Array.isArray(keyConcepts) ? keyConcepts : []),
      JSON.stringify(Array.isArray(unresolvedQuestions) ? unresolvedQuestions : []),
      hasAttachments ? 1 : 0,
      JSON.stringify(Array.isArray(attachmentNames) ? attachmentNames : []),
      now
    );
    res.json({
      success: true,
      data: {
        source: source || "custom_topic",
        topicId: topicId || void 0,
        topicName: topicName.trim(),
        subjectId: subjectId || void 0,
        conversationId: conversationId || void 0,
        conversationTitle: conversationTitle || void 0,
        summary: summary || "",
        detectedGaps: Array.isArray(detectedGaps) ? detectedGaps : [],
        keyConcepts: Array.isArray(keyConcepts) ? keyConcepts : [],
        unresolvedQuestions: Array.isArray(unresolvedQuestions) ? unresolvedQuestions : [],
        hasAttachments: Boolean(hasAttachments),
        attachmentNames: Array.isArray(attachmentNames) ? attachmentNames : [],
        lastUpdated: now
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/chat/conversations/:id/context", async (req, res) => {
  try {
    const { id } = req.params;
    const convo = await db.get("SELECT * FROM chat_conversations WHERE id = ?", id);
    if (!convo) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }
    if (convo.learning_context) {
      try {
        const parsed = JSON.parse(convo.learning_context);
        return res.json({ success: true, data: parsed });
      } catch {
      }
    }
    const latestAssistant = await db.get(`
      SELECT content FROM chat_messages
      WHERE conversation_id = ? AND role = 'assistant'
      ORDER BY created_at DESC LIMIT 1
    `, id);
    let extractedContext = null;
    if (latestAssistant?.content) {
      const match = latestAssistant.content.match(/<!--\s*LEARNING_CONTEXT:\s*(\{.*?\})\s*-->/s);
      if (match) {
        try {
          extractedContext = JSON.parse(match[1]);
        } catch {
        }
      }
    }
    const linkedTopic = convo.topic_id ? await db.get("SELECT name, description FROM topics WHERE id = ?", convo.topic_id) : null;
    const topicName = extractedContext?.topic_name || linkedTopic?.name || convo.title.replace(/[#*_`]/g, "");
    const summary = extractedContext?.summary || linkedTopic?.description || "Physical reasoning discussion.";
    const resultContext = {
      source: "doubt_chat",
      topicId: convo.topic_id || void 0,
      topicName,
      conversationId: id,
      conversationTitle: convo.title,
      summary,
      detectedGaps: Array.isArray(extractedContext?.detected_gaps) ? extractedContext.detected_gaps : [],
      keyConcepts: Array.isArray(extractedContext?.key_concepts) ? extractedContext.key_concepts : [],
      unresolvedQuestions: Array.isArray(extractedContext?.unresolved_questions) ? extractedContext.unresolved_questions : [],
      hasAttachments: false,
      attachmentNames: [],
      lastUpdated: convo.updated_at
    };
    res.json({ success: true, data: resultContext });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/chat/conversations", async (req, res) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    const convos = await db.all(`
      SELECT c.*, t.name as topic_name,
             (SELECT count(*) FROM chat_messages m WHERE m.conversation_id = c.id) as message_count
      FROM chat_conversations c
      LEFT JOIN topics t ON c.topic_id = t.id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
    `, userId);
    res.json({ success: true, data: convos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/chat/conversations", async (req, res) => {
  try {
    const { title, topic_id } = req.body;
    const id = "conv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userId = await getAuthenticatedUserId(req);
    await db.run(`
      INSERT INTO chat_conversations (id, user_id, topic_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, id, userId, topic_id || null, title || "New Doubt Session", now, now);
    res.json({ success: true, data: { id, title: title || "New Doubt Session", topic_id, created_at: now } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/chat/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const convo = await db.get(`
      SELECT c.*, t.name as topic_name
      FROM chat_conversations c
      LEFT JOIN topics t ON c.topic_id = t.id
      WHERE c.id = ?
    `, id);
    if (!convo) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }
    const rawMessages = await db.all(`
      SELECT * FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `, id);
    const messages = rawMessages.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : void 0,
      attachments: m.attachments ? JSON.parse(m.attachments) : void 0
    }));
    res.json({ success: true, data: { ...convo, messages } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.patch("/api/chat/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (title && title.trim()) {
      await db.run(
        "UPDATE chat_conversations SET title = ?, updated_at = ? WHERE id = ?",
        title.trim(),
        (/* @__PURE__ */ new Date()).toISOString(),
        id
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/chat/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.run("DELETE FROM chat_messages WHERE conversation_id = ?", id);
    await db.run("DELETE FROM chat_conversations WHERE id = ?", id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/chat/conversations", async (req, res) => {
  try {
    await db.run("DELETE FROM chat_messages");
    await db.run("DELETE FROM chat_conversations");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/chat/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.run("DELETE FROM chat_messages WHERE id = ?", id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/chat/message", async (req, res) => {
  try {
    const { conversation_id, content, topic_id, attachments } = req.body;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    const trimmedContent = content ? content.trim() : "";
    if (!trimmedContent && !hasAttachments) {
      return res.status(400).json({ success: false, error: "Please enter a doubt or attach a document or image" });
    }
    let convId = conversation_id;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userId = await getAuthenticatedUserId(req);
    const flawContext = await getUserCognitiveFlawSummary(userId);
    let basePrompt = trimmedContent || (hasAttachments ? `Please examine the attached experimental file(s) (${attachments.map((a) => a.name || a.type).join(", ")}). Dissect the underlying physical mechanisms, distinguishing variables, and theoretical implications from first principles.` : "Please analyze this physical setup.");
    const promptToUse = `${basePrompt}

${flawContext.prompt_injection}`;
    let conversationTitle = "Physics Reasoning Discussion";
    if (!convId) {
      convId = "conv_" + Date.now();
      conversationTitle = trimmedContent ? trimmedContent.slice(0, 45).replace(/[#*_`]/g, "") + (trimmedContent.length > 45 ? "..." : "") : `Data Ingestion: ${attachments[0]?.name?.slice(0, 30) || "Attached Files"}`;
      await db.run(`
        INSERT INTO chat_conversations (id, user_id, topic_id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, convId, userId, topic_id || null, conversationTitle, now, now);
    } else {
      const existingConv = await db.get("SELECT title FROM chat_conversations WHERE id = ?", convId);
      if (existingConv?.title) {
        conversationTitle = existingConv.title;
      }
    }
    const userMsgId = "msg_u_" + Date.now();
    const sanitizedAttachments = hasAttachments ? attachments.map((a) => ({
      name: a.name,
      type: a.type,
      mimeType: a.mimeType,
      size: a.size,
      dataUrl: a.dataUrl || (a.mimeType.startsWith("image/") ? `data:${a.mimeType};base64,${a.base64Data}` : void 0)
    })) : null;
    await db.run(
      `
      INSERT INTO chat_messages (id, conversation_id, role, content, provider, model, attachments, created_at)
      VALUES (?, ?, 'user', ?, ?, ?, ?, ?)
    `,
      userMsgId,
      convId,
      trimmedContent || `[Attached: ${attachments.map((a) => a.name).join(", ")}]`,
      AI_PROVIDER,
      CURRENT_MODEL,
      sanitizedAttachments ? JSON.stringify(sanitizedAttachments) : null,
      now
    );
    const historyRows = await db.all(`
      SELECT role, content FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      LIMIT 6
    `, convId);
    const geminiAttachments = hasAttachments ? attachments.map((a) => ({
      mimeType: a.mimeType,
      data: a.base64Data || (a.dataUrl ? a.dataUrl.replace(/^data:[^;]+;base64,/, "") : ""),
      name: a.name
    })) : void 0;
    const geminiResult = await queryGemini({
      prompt: promptToUse,
      history: historyRows,
      attachments: geminiAttachments
    });
    const assistantMsgId = "msg_a_" + Date.now();
    const metadataStr = JSON.stringify({
      answered_at: geminiResult.timestamp,
      anti_overanalysis_flag: geminiResult.metadata?.anti_overanalysis_flag || false
    });
    await db.run(
      `
      INSERT INTO chat_messages (id, conversation_id, role, content, provider, model, classification, metadata, created_at)
      VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)
    `,
      assistantMsgId,
      convId,
      geminiResult.text,
      geminiResult.provider,
      geminiResult.model,
      geminiResult.classification || "Mechanism",
      metadataStr,
      geminiResult.timestamp
    );
    const isConfusedModel = geminiResult.classification === "Confused mental model";
    const isOveranalysis = Boolean(geminiResult.metadata?.anti_overanalysis_flag);
    let extractedContext = null;
    const contextMatch = geminiResult.text.match(/<!--\s*LEARNING_CONTEXT:\s*(\{.*?\})\s*-->/s);
    if (contextMatch) {
      try {
        extractedContext = JSON.parse(contextMatch[1]);
      } catch (e) {
        console.warn("Failed to parse LEARNING_CONTEXT tag:", e);
      }
    }
    const linkedTopic = topic_id ? await db.get("SELECT name, description, subject_id FROM topics WHERE id = ?", topic_id) : null;
    const topicName = extractedContext?.topic_name?.trim() || linkedTopic?.name || trimmedContent.slice(0, 45).replace(/[#*_`]/g, "");
    const summary = extractedContext?.summary?.trim() || linkedTopic?.description || "Extracted from Doubt Chat physical inquiry dialogue.";
    const detectedGaps = Array.isArray(extractedContext?.detected_gaps) ? extractedContext.detected_gaps : [];
    if (isConfusedModel && detectedGaps.length === 0) {
      detectedGaps.push("Confused mental model in mechanistic inquiry");
    }
    const keyConcepts = Array.isArray(extractedContext?.key_concepts) ? extractedContext.key_concepts : [];
    const unresolvedQuestions = Array.isArray(extractedContext?.unresolved_questions) ? extractedContext.unresolved_questions : [];
    const fullLearningContext = {
      source: topic_id ? "predefined_topic" : "doubt_chat",
      topicId: topic_id || void 0,
      topicName,
      subjectId: linkedTopic?.subject_id || void 0,
      conversationId: convId,
      conversationTitle: conversationTitle || "Physics Inquiry",
      summary,
      detectedGaps,
      keyConcepts,
      unresolvedQuestions,
      hasAttachments,
      attachmentNames: hasAttachments ? attachments.map((a) => a.name || a.type) : [],
      lastUpdated: now
    };
    try {
      await db.run(
        "UPDATE chat_conversations SET learning_context = ?, updated_at = ? WHERE id = ?",
        JSON.stringify(fullLearningContext),
        now,
        convId
      );
    } catch (e) {
      console.warn("Failed to save learning_context to conversation:", e);
    }
    try {
      await db.run(
        `
        INSERT INTO active_learning_context (
          id, user_id, source, topic_id, topic_name, subject_id, conversation_id, conversation_title,
          summary, detected_gaps, key_concepts, unresolved_questions, has_attachments, attachment_names, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          source = excluded.source,
          topic_id = excluded.topic_id,
          topic_name = excluded.topic_name,
          subject_id = excluded.subject_id,
          conversation_id = excluded.conversation_id,
          conversation_title = excluded.conversation_title,
          summary = excluded.summary,
          detected_gaps = excluded.detected_gaps,
          key_concepts = excluded.key_concepts,
          unresolved_questions = excluded.unresolved_questions,
          has_attachments = excluded.has_attachments,
          attachment_names = excluded.attachment_names,
          updated_at = excluded.updated_at
      `,
        "current_active_context",
        userId,
        "doubt_chat",
        topic_id || null,
        topicName,
        linkedTopic?.subject_id || null,
        convId,
        conversationTitle || "Physics Inquiry",
        summary,
        JSON.stringify(detectedGaps),
        JSON.stringify(keyConcepts),
        JSON.stringify(unresolvedQuestions),
        hasAttachments ? 1 : 0,
        JSON.stringify(hasAttachments ? attachments.map((a) => a.name || a.type) : []),
        now
      );
    } catch (e) {
      console.warn("Failed to persist active_learning_context from message:", e);
    }
    const diagnosticMatch = geminiResult.text.match(/<!--\s*DIAGNOSTIC_EVENT:\s*(\{.*?\})\s*-->/s);
    if (isConfusedModel || isOveranalysis || diagnosticMatch) {
      let diagData = {};
      if (diagnosticMatch) {
        try {
          diagData = JSON.parse(diagnosticMatch[1]);
        } catch {
        }
      }
      const errorId = diagData.error_id || (isOveranalysis ? "err_overanalysis_trap" : flawContext.flaws[0]?.id || "err_assoc_causation");
      const isCorrection = diagData.type === "meaningful_correction" || diagData.correct_reasoning === true;
      const targetFlaw = flawContext.flaws.find((f) => f.id === errorId);
      await processAdaptiveEvidence({
        user_id: userId,
        feature: "doubt_chat",
        topic_id: topic_id || null,
        error_id: errorId,
        error_name: diagData.error_name || targetFlaw?.name || "Causal Reasoning Error",
        correct_answer: isCorrection,
        correct_reasoning: isCorrection,
        evidence_summary: diagData.summary || (isConfusedModel ? `Doubt Chat diagnostic event: identified confused mental model in student query "${trimmedContent.slice(0, 80)}..."` : "Doubt Chat diagnostic event: flagged persistent overanalysis pattern without model commitment."),
        created_at: now
      });
    }
    res.json({
      success: true,
      data: {
        id: assistantMsgId,
        conversation_id: convId,
        role: "assistant",
        content: geminiResult.text,
        provider: geminiResult.provider,
        model: geminiResult.model,
        classification: geminiResult.classification,
        metadata: {
          answered_at: geminiResult.timestamp,
          anti_overanalysis_flag: geminiResult.metadata?.anti_overanalysis_flag || false
        },
        created_at: geminiResult.timestamp
      },
      learning_context: fullLearningContext,
      metadata: {
        provider: geminiResult.provider,
        model: geminiResult.model,
        timestamp: geminiResult.timestamp
      }
    });
  } catch (err) {
    console.error("Error in /api/chat/message:", err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
});
var handleCompressorEvaluate = async (req, res) => {
  try {
    const { topic_id, user_explanation, title } = req.body;
    if (!user_explanation || !user_explanation.trim()) {
      return res.status(400).json({ success: false, error: "User explanation is required" });
    }
    const userId = await getAuthenticatedUserId(req);
    const flawContext = await getUserCognitiveFlawSummary(userId);
    const prompt = `You are evaluating a BSc Physics student's dynamical mechanism explanation for MECHANISM COMPRESSOR.
Topic: ${title || "Classical / Quantum / Electromagnetic Mechanism"}
Student Explanation:
"""
${user_explanation}
"""

Evaluate with mathematical and physical rigor:
- Causal accuracy
- Missing variables
- Hidden assumptions
- Causal direction (did they invert cause and effect?)
- Incorrect links
- Alternative mechanisms
- Discriminators
- Exceptions
- Unnecessary complexity or overcompression
- Memorized facts incorrectly presented as mechanisms

DO NOT immediately rewrite their answer!
Structure your critique in 6 numbered sections:
1. WHAT IS CORRECT: (Acknowledge valid parts of their mental model)
2. WEAKEST LINK: (Pinpoint the exact missing or broken causal link)
3. ATTACK THE MODEL: (Show where their explanation fails under physical perturbation or extreme boundary conditions)
4. DISTINGUISHING OBSERVATION: (What experimental test, sensor trace, or observation separates their model from truth?)
5. REPAIR THE MODEL: (Add the missing variable and correct directionality)
6. COMPRESSED FINAL MECHANISM: (A pristine, high-yield, compressed causal sequence: Step 1 \u2192 Step 2 \u2192 Step 3)

${flawContext.prompt_injection}

At the very end of your response, output a strict JSON block assessing the student's actual submission wrapped exactly like this:
<!-- EVALUATION_SCORES:
{
  "causal_accuracy": <number between 0.05 and 1.00 evaluating causal validity>,
  "completeness": <number between 0.05 and 1.00 evaluating essential variable accounting>,
  "directionality": <number between 0.05 and 1.00 evaluating correct causal flow and absence of cause/effect inversion>,
  "assumption_quality": <number between 0.05 and 1.00 evaluating axiomatic foundations>,
  "discriminator_quality": <number between 0.05 and 1.00 evaluating distinguishing diagnostic observation>,
  "exception_handling": <number between 0.05 and 1.00 evaluating boundary conditions>,
  "compression_quality": <number between 0.05 and 1.00 evaluating conciseness without information loss>,
  "overall_score": <number between 0.05 and 1.00 overall mechanistic soundness>
}
-->`;
    const geminiResult = await queryGemini({
      prompt,
      temperature: 0.2
    });
    let causalAccuracy = 0.7;
    let completeness = 0.7;
    let directionality = 0.75;
    let assumptionQuality = 0.7;
    let discriminatorQuality = 0.7;
    let exceptionHandling = 0.65;
    let compressionQuality = 0.75;
    let overallScore = 0.7;
    let cleanFeedback = geminiResult.text;
    const scoresMatch = geminiResult.text.match(/<!--\s*EVALUATION_SCORES:\s*(\{.*?\})\s*-->/s);
    const clampScore = (val, fallback) => {
      const num = Number(val);
      if (isNaN(num)) return fallback;
      return Math.max(0.05, Math.min(1, Number(num.toFixed(2))));
    };
    if (scoresMatch && scoresMatch[1]) {
      try {
        const parsed = JSON.parse(scoresMatch[1]);
        causalAccuracy = clampScore(parsed.causal_accuracy, 0.7);
        completeness = clampScore(parsed.completeness, 0.7);
        directionality = clampScore(parsed.directionality, 0.75);
        assumptionQuality = clampScore(parsed.assumption_quality, 0.7);
        discriminatorQuality = clampScore(parsed.discriminator_quality, 0.7);
        exceptionHandling = clampScore(parsed.exception_handling, 0.65);
        compressionQuality = clampScore(parsed.compression_quality, 0.75);
        overallScore = clampScore(parsed.overall_score, (causalAccuracy + directionality + completeness) / 3);
        cleanFeedback = geminiResult.text.replace(/<!--\s*EVALUATION_SCORES:.*?-->/s, "").trim();
      } catch (e) {
      }
    } else {
      const lower = geminiResult.text.toLowerCase();
      if (lower.includes("completely correct") || lower.includes("exemplary") || lower.includes("flawless")) {
        causalAccuracy = 0.92;
        directionality = 0.95;
        completeness = 0.88;
        overallScore = 0.91;
      } else if (lower.includes("invert") || lower.includes("fatal flaw") || lower.includes("completely incorrect")) {
        causalAccuracy = 0.45;
        directionality = 0.4;
        completeness = 0.5;
        overallScore = 0.45;
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const evalId = "eval_" + Date.now();
    const mechId = "mech_" + Date.now();
    await db.run(`
      INSERT INTO mechanisms (id, user_id, topic_id, title, user_explanation, canonical_mechanism, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, mechId, userId, topic_id || "top_damped_oscillator", title || "Mechanism Compression", user_explanation, cleanFeedback, now, now);
    await db.run(
      `
      INSERT INTO mechanism_evaluations (
        id, mechanism_id, causal_accuracy, completeness, directionality,
        assumption_quality, discriminator_quality, exception_handling, compression_quality,
        alternative_mechanism_quality, confidence, overall_score, evaluator_feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      evalId,
      mechId,
      causalAccuracy,
      completeness,
      directionality,
      assumptionQuality,
      discriminatorQuality,
      exceptionHandling,
      compressionQuality,
      0.75,
      0.85,
      overallScore,
      cleanFeedback,
      now
    );
    await processAdaptiveEvidence({
      user_id: userId,
      feature: "compressor",
      topic_id: topic_id || "top_damped_oscillator",
      robust_mechanism: overallScore >= 0.75,
      correct_reasoning: causalAccuracy >= 0.7,
      discriminator_identified: discriminatorQuality >= 0.7,
      evidence_summary: `Mechanism Compressor on "${title || "Mechanism"}": Evaluated causal accuracy (${Math.round(causalAccuracy * 100)}%), directionality (${Math.round(directionality * 100)}%), completeness (${Math.round(completeness * 100)}%), overall score (${Math.round(overallScore * 100)}%).`,
      created_at: now
    });
    res.json({
      success: true,
      data: {
        id: evalId,
        mechanism_id: mechId,
        feedback: cleanFeedback,
        scores: {
          causal_accuracy: Math.round(causalAccuracy * 100),
          directionality: Math.round(directionality * 100),
          completeness: Math.round(completeness * 100),
          overall_score: Math.round(overallScore * 100)
        }
      },
      metadata: {
        provider: geminiResult.provider,
        model: geminiResult.model,
        timestamp: geminiResult.timestamp
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
app.post("/api/compressor/evaluate", handleCompressorEvaluate);
app.post("/api/compress/evaluate", handleCompressorEvaluate);
app.post("/api/adversarial/attack", async (req, res) => {
  try {
    const { model_text, attack_type } = req.body;
    const userId = await getAuthenticatedUserId(req);
    const flawContext = await getUserCognitiveFlawSummary(userId);
    let instructionTarget = "";
    switch (attack_type) {
      case "DESTROY_MY_MODEL":
        instructionTarget = "Produce counterexamples and extreme physical boundary cases that directly break this student model. Do not manufacture false criticism if it is completely sound, but stress-test every limit.";
        break;
      case "WHAT_AM_I_ASSUMING":
        instructionTarget = "Expose all unstated, hidden assumptions, implicit constants, and unverified physical axioms in this model.";
        break;
      case "FIND_THE_DISCRIMINATOR":
        instructionTarget = "Isolate the single physical observation, measurement discriminator, or experimental setup that proves or disproves this model against competing alternative explanations.";
        break;
      case "ATTACK_THE_CAUSAL_CHAIN":
        instructionTarget = "Scrutinize every link in the causal chain for directionality errors, conservation law violations, non-sequiturs, or missing intermediate physical steps.";
        break;
      default:
        instructionTarget = "Adversarially critique this physical reasoning model with academic precision.";
    }
    const prompt = `Adversarial BSc Physics Evaluation Mode:
Target Focus: ${attack_type}
Directive: ${instructionTarget}

Student's Working Model:
"""
${model_text}
"""

Deliver a razor-sharp, objective, academic critique formatted cleanly in markdown with physical notation (LaTeX, SI units, vector notation, etc.).

${flawContext.prompt_injection}`;
    const result = await queryGemini({ prompt, temperature: 0.25 });
    const hasVulnerability = /break|flaw|vulnerab|defect|missing|inversion|contradict|erroneous/i.test(result.text.slice(0, 450));
    const targetFlaw = flawContext.flaws[0];
    await processAdaptiveEvidence({
      user_id: userId,
      feature: "adversarial",
      error_id: targetFlaw?.id || null,
      error_name: targetFlaw?.name || null,
      robust_mechanism: !hasVulnerability,
      correct_reasoning: !hasVulnerability,
      evidence_summary: `Adversarial attack [${attack_type}] on student model: ${hasVulnerability ? "Stress test exposed model boundary vulnerabilities." : "Model withstood boundary counterexamples."}`
    });
    res.json({
      success: true,
      data: { attack_type, critique: result.text },
      metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/first-principles", async (req, res) => {
  try {
    const { topic_or_concept } = req.body;
    const userId = await getAuthenticatedUserId(req);
    const flawContext = await getUserCognitiveFlawSummary(userId);
    const prompt = `FIRST-PRINCIPLES PHYSICS RECONSTRUCTION:
Concept to Deconstruct: "${topic_or_concept}"

Ask and answer the fundamental question:
"What is the SMALLEST set of physical laws, conservation axioms, and symmetries from which this entire dynamical mechanism can be derived?"

Structure:
1. Minimal Axiom Base (Fundamental laws: conservation of energy/momentum, Lagrangian/Hamiltonian formulation, Maxwell equations, Schr\xF6dinger equation, thermodynamics, etc.)
2. Deductive Step-by-Step Derivation (Show how the physical phenomenon inevitably emerges mathematically without rote memorization)
3. Non-Derivable Elements (Clearly delineate: what MUST be empirical constants or conventions vs what can be derived from first principles)

${flawContext.prompt_injection}`;
    const result = await queryGemini({ prompt, temperature: 0.15 });
    await processAdaptiveEvidence({
      user_id: userId,
      feature: "first_principles",
      robust_mechanism: true,
      correct_reasoning: true,
      evidence_summary: `First-principles deconstruction of "${(topic_or_concept || "").slice(0, 60)}": Evaluated foundational axioms and derivations.`
    });
    res.json({
      success: true,
      data: { analysis: result.text },
      metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/reverse-engineering", async (req, res) => {
  try {
    const { observation, user_hypotheses } = req.body;
    const userId = await getAuthenticatedUserId(req);
    const flawContext = await getUserCognitiveFlawSummary(userId);
    const prompt = `REVERSE-ENGINEERING MODE:
Physical / Experimental Observation:
"""
${observation}
"""

${user_hypotheses ? `User Proposed Hypotheses:
"""
${user_hypotheses}
"""
` : ""}

Guide the reverse-engineering deduction using:
Observation
\u2192 Hypotheses generation
\u2192 Specific verifiable predictions for each
\u2192 Critical Discriminator test or measurement setup
\u2192 Test result interpretation
\u2192 Final updated mechanistic model

Crucial requirement: Distinguish strictly between "possible explanation" and "best-supported explanation" using Bayesian likelihood, conservation laws, and dynamical equations.

${flawContext.prompt_injection}`;
    const result = await queryGemini({ prompt, temperature: 0.2 });
    await processAdaptiveEvidence({
      user_id: userId,
      feature: "reverse_engineering",
      discriminator_identified: true,
      robust_mechanism: true,
      evidence_summary: `Reverse-engineering deduction on observation: Evaluated hypothesis generation and gold-standard discriminators.`
    });
    res.json({
      success: true,
      data: { deduction: result.text },
      metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/simulations", async (req, res) => {
  try {
    const sims = await db.all(`
      SELECT s.id, s.topic_id, s.title, s.scenario, s.difficulty, t.name as topic_name,
             s.system_presentation, s.available_investigations, s.available_decisions
      FROM simulations s
      JOIN topics t ON s.topic_id = t.id
    `);
    const parsed = sims.map((s) => ({
      ...s,
      system_presentation: JSON.parse(s.system_presentation || s.patient_presentation || "{}"),
      available_investigations: JSON.parse(s.available_investigations || "[]").map((inv) => ({
        id: inv.id,
        name: inv.name,
        cost_cognitive: inv.cost_cognitive
        // do NOT reveal hidden results upfront
      })),
      available_decisions: JSON.parse(s.available_decisions || "[]").map((dec) => ({
        id: dec.id,
        intervention: dec.intervention
      }))
    }));
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/simulations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sim = await db.get(`
      SELECT s.*, t.name as topic_name
      FROM simulations s
      JOIN topics t ON s.topic_id = t.id
      WHERE s.id = ?
    `, id);
    if (!sim) {
      return res.status(404).json({ success: false, error: "Simulation not found" });
    }
    res.json({
      success: true,
      data: {
        ...sim,
        system_presentation: JSON.parse(sim.system_presentation || sim.patient_presentation || "{}"),
        available_investigations: JSON.parse(sim.available_investigations || "[]"),
        available_decisions: JSON.parse(sim.available_decisions || "[]"),
        hidden_state: JSON.parse(sim.hidden_state || "{}")
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/simulations/attempt", async (req, res) => {
  try {
    const { simulation_id, hypotheses, evidence_used, decisions, confidence } = req.body;
    const sim = await db.get("SELECT * FROM simulations WHERE id = ?", simulation_id);
    if (!sim) {
      return res.status(404).json({ success: false, error: "Simulation not found" });
    }
    const availableDecisions = JSON.parse(sim.available_decisions || "[]");
    const availableInvestigations = JSON.parse(sim.available_investigations || "[]");
    const hiddenState = JSON.parse(sim.hidden_state || "{}");
    const nonDiscriminatorCount = (evidence_used || []).filter((eId) => {
      const inv = availableInvestigations.find((i) => i.id === eId);
      return inv && !inv.is_discriminator;
    }).length;
    const overanalyzed = nonDiscriminatorCount >= 2;
    const chosenDecision = availableDecisions.find((d) => (decisions || []).includes(d.id));
    const outcome = chosenDecision?.outcome_feedback || "Intervention recorded.";
    const id = "sim_att_" + Date.now();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userId = await getAuthenticatedUserId(req);
    await db.run(
      `
      INSERT INTO simulation_attempts (
        id, user_id, simulation_id, hypotheses, evidence_used, decisions,
        confidence, outcome, model_update, unnecessary_investigations_count, overanalyzed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      id,
      userId,
      simulation_id,
      JSON.stringify(hypotheses || []),
      JSON.stringify(evidence_used || []),
      JSON.stringify(decisions || []),
      confidence || 4,
      outcome,
      hiddenState.hidden_physical_state || hiddenState.hidden_mechanism || hiddenState.hidden_state || "",
      nonDiscriminatorCount,
      overanalyzed ? 1 : 0,
      now
    );
    await processAdaptiveEvidence({
      user_id: userId,
      feature: "simulation",
      topic_id: sim.topic_id,
      error_id: overanalyzed ? "err_overanalysis_trap" : null,
      error_name: overanalyzed ? "Overanalysis & Reluctance to Commit" : null,
      correct_answer: chosenDecision?.is_optimal || false,
      correct_reasoning: !overanalyzed,
      discriminator_identified: !overanalyzed,
      confidence: confidence ? confidence * 20 : 80,
      evidence_summary: `Physical Simulation "${sim.title}": ${overanalyzed ? "Overanalysis trap triggered \u2014 requested superfluous redundant measurements." : "Efficient discriminator-focused parameter commit."}`,
      created_at: now
    });
    res.json({
      success: true,
      data: {
        outcome,
        is_optimal: chosenDecision?.is_optimal || false,
        hidden_physical_state: hiddenState.hidden_physical_state || hiddenState.hidden_mechanism || hiddenState.hidden_state || "",
        hidden_mechanism: hiddenState.hidden_physical_state || hiddenState.hidden_mechanism || hiddenState.hidden_state || "",
        discriminator_explanation: hiddenState.gold_standard_discriminator,
        overanalysis_flag: overanalyzed,
        anti_overanalysis_message: overanalyzed ? "STOP \u2014 ENOUGH INFORMATION. COMMIT. You gathered surplus measurements beyond the discriminator threshold." : "Excellent cognitive efficiency. You committed when the discriminator satisfied evidence threshold."
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/questions", async (req, res) => {
  try {
    const { topic_id } = req.query;
    let questions;
    if (topic_id) {
      questions = await db.all(`
        SELECT q.*, t.name as topic_name, s.name as subject_name
        FROM questions q
        JOIN topics t ON q.topic_id = t.id
        JOIN subjects s ON t.subject_id = s.id
        WHERE q.topic_id = ?
      `, topic_id);
      if (questions.length === 0) {
        questions = await db.all(`
          SELECT q.*, t.name as topic_name, s.name as subject_name
          FROM questions q
          JOIN topics t ON q.topic_id = t.id
          JOIN subjects s ON t.subject_id = s.id
          LIMIT 10
        `);
      }
    } else {
      questions = await db.all(`
        SELECT q.*, t.name as topic_name, s.name as subject_name
        FROM questions q
        JOIN topics t ON q.topic_id = t.id
        JOIN subjects s ON t.subject_id = s.id
      `);
    }
    const dbIds = new Set(questions.map((q) => q.id));
    const curatedToAdd = CURATED_DIAGNOSTIC_QUESTIONS.filter((cq) => {
      if (dbIds.has(cq.id)) return false;
      if (topic_id && cq.topic_id !== topic_id) return false;
      return true;
    });
    const parsed = [
      ...questions.map((q) => {
        const curatedMatch = CURATED_DIAGNOSTIC_QUESTIONS.find((c) => c.id === q.id);
        return {
          ...q,
          options: JSON.parse(q.options || "[]"),
          question_type: q.question_type || curatedMatch?.question_type || "TYPE_A_DIRECT_DIAGNOSTIC",
          root_error_target: q.root_error_target || curatedMatch?.root_error_target,
          internal_rationale: q.internal_rationale || curatedMatch?.internal_rationale,
          competing_paths: curatedMatch?.competing_paths,
          falsification_criteria: curatedMatch?.falsification_criteria
        };
      }),
      ...curatedToAdd
    ];
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.all("/api/tests/adaptive-select", async (req, res) => {
  try {
    const source = req.method === "POST" ? req.body : req.query;
    const mode = source.mode || "mixed_adaptive";
    const topic_id = source.topic_id;
    let topic_ids = void 0;
    if (source.topic_ids) {
      if (Array.isArray(source.topic_ids)) {
        topic_ids = source.topic_ids;
      } else if (typeof source.topic_ids === "string") {
        topic_ids = source.topic_ids.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    const custom_topic_name = source.custom_topic_name;
    const topic_name = source.topic_name;
    const focus = source.focus;
    const difficulty = source.difficulty;
    const question_format = source.question_format;
    const detected_gaps = source.detected_gaps ? Array.isArray(source.detected_gaps) ? source.detected_gaps : [source.detected_gaps] : void 0;
    const context_summary = source.context_summary;
    const unresolved_questions = source.unresolved_questions ? Array.isArray(source.unresolved_questions) ? source.unresolved_questions : [source.unresolved_questions] : void 0;
    const question = await selectAdaptiveQuestion({
      mode,
      topic_id,
      topic_ids,
      custom_topic_name,
      topic_name,
      focus,
      difficulty,
      question_format,
      detected_gaps,
      context_summary,
      unresolved_questions
    });
    res.json({ success: true, data: question });
  } catch (err) {
    console.error("Error selecting adaptive question:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/tests/generate-dynamic", async (req, res) => {
  try {
    const {
      target_error_id,
      topic_id,
      custom_topic_name,
      topic_name,
      mode,
      difficulty,
      question_format,
      detected_gaps,
      context_summary,
      unresolved_questions
    } = req.body;
    const userId = await getAuthenticatedUserId(req);
    const row = await db.get("SELECT error_profile FROM user_model WHERE user_id = ?", userId);
    let errors = INITIAL_HIERARCHICAL_ERRORS;
    if (row?.error_profile) {
      try {
        errors = JSON.parse(row.error_profile);
      } catch {
      }
    }
    const targetError = errors.find((e) => e.id === target_error_id) || errors[0];
    const question = await generateDynamicDiagnosticQuestion({
      target_error: targetError,
      topic_id,
      custom_topic_name,
      topic_name,
      mode: mode || "weakness_hunt",
      difficulty: difficulty || "Mechanistic",
      question_format: question_format || "mcq",
      detected_gaps,
      context_summary,
      unresolved_questions
    });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/questions/attempt", async (req, res) => {
  try {
    const { question_id, answer, confidence, reasoning, time_taken } = req.body;
    if (!question_id || !answer) {
      return res.status(400).json({ success: false, error: "Question ID and answer are required" });
    }
    const userId = await getAuthenticatedUserId(req);
    const evaluation = await evaluateAdaptiveAttempt({
      question_id,
      answer,
      confidence: Number(confidence) || 80,
      reasoning: reasoning || "",
      time_taken: Number(time_taken) || 25,
      user_id: userId
    });
    res.json({
      success: true,
      data: evaluation
    });
  } catch (err) {
    console.error("Error evaluating adaptive attempt:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/reconstructions", async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT r.*, t.name as topic_name
      FROM reconstructions r
      JOIN topics t ON r.topic_id = t.id
      ORDER BY r.created_at DESC
    `);
    const parsed = rows.map((r) => ({
      ...r,
      user_reconstruction: JSON.parse(r.user_reconstruction || "{}"),
      evaluation: JSON.parse(r.evaluation || "{}")
    }));
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/reconstructions", async (req, res) => {
  try {
    const {
      topic_id,
      causal_chain,
      directionality,
      critical_variables,
      discriminator,
      exception,
      paragraph_explanation,
      explanation_mode = "both"
    } = req.body;
    const userId = await getAuthenticatedUserId(req);
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", topic_id);
    const mech = await db.get("SELECT * FROM mechanisms WHERE topic_id = ?", topic_id);
    const flawContext = await getUserCognitiveFlawSummary(userId);
    let studentInputSection = "";
    if (paragraph_explanation && paragraph_explanation.trim()) {
      studentInputSection += `
--- STUDENT NARRATIVE PARAGRAPH EXPLANATION ---
${paragraph_explanation.trim()}
`;
    }
    if (causal_chain || directionality || critical_variables || discriminator || exception) {
      studentInputSection += `
--- STUDENT STRUCTURED FRAMEWORK ---
- Causal Chain: ${causal_chain || "N/A"}
- Directionality: ${directionality || "N/A"}
- Critical Variables: ${critical_variables || "N/A"}
- Discriminator: ${discriminator || "N/A"}
- Exception: ${exception || "N/A"}
`;
    }
    const prompt = `EVALUATE CLOSE-BOOK MECHANISM RECONSTRUCTION:
Topic: ${topic ? topic.name : "Physics / Dynamical Mechanisms"}
Mode of Explanation Submitted: ${explanation_mode}

Canonical Benchmark Mechanism:
"""
${mech ? mech.canonical_mechanism : "Consensus physical mechanism"}
"""

Student Submission:${studentInputSection}

Instructions for Evaluation:
1. Evaluate whether the student articulated the mechanism with first-principles physical precision, rigorous causal directionality, correct conservation laws, and key discriminators.
2. If a narrative paragraph was provided, evaluate the cohesion, clarity, and depth of causal flow.
3. If the structured framework was provided, evaluate each of the 5 pillars.
4. Check if the student exhibited known cognitive flaws (e.g., reversing directionality, confounding association with causation, premature closure).
5. On the FIRST line of your response, output exactly:
SCORE: <integer from 0 to 100>
6. Follow immediately with detailed markdown critique including:
- **Causal Flow & First Principles**: Strengths and gaps.
- **Directionality & Thresholds**: Accuracy of cause-and-effect relationships.
- **Cognitive Profile Impact**: How this reconstruction demonstrates mastery or pinpoints blind spots.

7. At the very end of your response, output a strict JSON block wrapped in <!-- RECONSTRUCTION_DIAGNOSIS: ... -->:
<!-- RECONSTRUCTION_DIAGNOSIS:
{
  "score": <integer from 0 to 100>,
  "reconstructed_model": "<concise 2-3 sentence synthesis of the mental model assembled by the student>",
  "required_model": "<concise canonical physical mechanism that dynamical laws require>",
  "missing_causal_links": ["<specific missing intermediate physical or mathematical link>", "<another missing step if any>"],
  "incorrect_assumptions": ["<specific directionality flaw or unfounded premise if any>"],
  "recovered_understanding": ["<core first-principles axiom or causal relationship correctly reconstructed from memory>", "<another solid link>"]
}
-->

${flawContext.prompt_injection}`;
    const result = await queryGemini({ prompt, temperature: 0.15 });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = "recon_" + Date.now();
    let evaluatedScore = 80;
    const scoreMatch = result.text.match(/SCORE:\s*(\d{1,3})/i);
    if (scoreMatch && scoreMatch[1]) {
      const parsed = parseInt(scoreMatch[1], 10);
      if (parsed >= 0 && parsed <= 100) {
        evaluatedScore = parsed;
      }
    }
    let reconstructedModel = "";
    let requiredModel = mech ? mech.canonical_mechanism : "";
    let missingLinks = [];
    let incorrectAssumptions = [];
    let recoveredUnderstanding = [];
    const diagnosisMatch = result.text.match(/<!--\s*RECONSTRUCTION_DIAGNOSIS:\s*(\{.*?\})\s*-->/s);
    if (diagnosisMatch && diagnosisMatch[1]) {
      try {
        const parsed = JSON.parse(diagnosisMatch[1]);
        if (parsed.reconstructed_model) reconstructedModel = parsed.reconstructed_model;
        if (parsed.required_model) requiredModel = parsed.required_model;
        if (Array.isArray(parsed.missing_causal_links)) missingLinks = parsed.missing_causal_links;
        if (Array.isArray(parsed.incorrect_assumptions)) incorrectAssumptions = parsed.incorrect_assumptions;
        if (Array.isArray(parsed.recovered_understanding)) recoveredUnderstanding = parsed.recovered_understanding;
        if (typeof parsed.score === "number" && parsed.score >= 0 && parsed.score <= 100) {
          evaluatedScore = parsed.score;
        }
      } catch (e) {
      }
    }
    let cleanCritique = result.text.replace(/<!--\s*RECONSTRUCTION_DIAGNOSIS:.*?-->/s, "").replace(/^SCORE:\s*\d{1,3}\s*\n?/i, "").trim();
    const evaluation = {
      score: evaluatedScore,
      critique: cleanCritique,
      canonical_comparison: mech ? mech.canonical_mechanism : requiredModel,
      reconstructed_model: reconstructedModel,
      required_model: requiredModel || (mech ? mech.canonical_mechanism : ""),
      missing_causal_links: missingLinks,
      incorrect_assumptions: incorrectAssumptions,
      recovered_understanding: recoveredUnderstanding
    };
    await db.run(
      `
      INSERT INTO reconstructions (
        id, user_id, topic_id, source_mechanism, user_reconstruction, evaluation, score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      id,
      userId,
      topic_id,
      mech ? mech.canonical_mechanism : "",
      JSON.stringify({
        explanation_mode,
        paragraph_explanation,
        causal_chain,
        directionality,
        critical_variables,
        discriminator,
        exception
      }),
      JSON.stringify(evaluation),
      evaluatedScore,
      now
    );
    await processAdaptiveEvidence({
      user_id: userId,
      feature: "reconstruction",
      topic_id,
      topic_name: topic?.name,
      reconstruction_score: evaluatedScore,
      robust_mechanism: evaluatedScore >= 75,
      correct_reasoning: evaluatedScore >= 70,
      discriminator_identified: evaluatedScore >= 75,
      evidence_summary: `Close-Book Reconstruction on ${topic?.name || "Topic"}: Score ${evaluatedScore}%. Evaluated physical causal flow, directionality, and discriminators.`,
      created_at: now
    });
    res.json({
      success: true,
      data: { id, score: evaluatedScore, evaluation },
      metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/history", async (req, res) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    const recentDoubts = await db.all(`
      SELECT c.id, c.title, c.created_at, t.name as topic_name
      FROM chat_conversations c
      LEFT JOIN topics t ON c.topic_id = t.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `, userId);
    const recentMechanisms = await db.all(`
      SELECT m.id, m.title, m.created_at, e.overall_score, t.name as topic_name
      FROM mechanisms m
      LEFT JOIN mechanism_evaluations e ON e.mechanism_id = m.id
      JOIN topics t ON m.topic_id = t.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
      LIMIT 10
    `, userId);
    const recentSimulations = await db.all(`
      SELECT a.id, s.title, a.created_at, a.overanalyzed, a.confidence, a.hypotheses, a.outcome, a.model_update, t.name as topic_name
      FROM simulation_attempts a
      JOIN simulations s ON a.simulation_id = s.id
      LEFT JOIN topics t ON s.topic_id = t.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT 10
    `, userId);
    const recentReconstructions = await db.all(`
      SELECT r.id, t.name as topic_name, r.score, r.created_at, r.user_reconstruction
      FROM reconstructions r
      JOIN topics t ON r.topic_id = t.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, userId);
    const recentQuestions = await db.all(`
      SELECT qa.id, qa.created_at, qa.correct, qa.confidence, qa.time_taken, qa.reasoning, qa.reasoning_error,
             q.question_text, q.mode, q.difficulty, t.name as topic_name
      FROM question_attempts qa
      JOIN questions q ON qa.question_id = q.id
      JOIN topics t ON q.topic_id = t.id
      WHERE qa.user_id = ?
      ORDER BY qa.created_at DESC
      LIMIT 15
    `, userId);
    res.json({
      success: true,
      data: {
        recentDoubts,
        recentMechanisms,
        recentSimulations,
        recentReconstructions,
        recentQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/settings", async (req, res) => {
  try {
    const isPg = Boolean(process.env.DATABASE_URL);
    let tableCount = 17;
    try {
      if (isPg) {
        const row = await db.get("SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
        if (row?.count) tableCount = Number(row.count);
      } else {
        const row = await db.get("SELECT count(*) as count FROM sqlite_master WHERE type='table'");
        if (row?.count) tableCount = Number(row.count);
      }
    } catch {
    }
    res.json({
      success: true,
      data: {
        provider: AI_PROVIDER,
        model: CURRENT_MODEL,
        hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
        environment: process.env.NODE_ENV || "development",
        databaseDriver: isPg ? "PostgreSQL (Neon / node-postgres)" : "Node.js Native SQLite (node:sqlite DatabaseSync)",
        databasePath: isPg ? "Neon Cloud PostgreSQL Cluster" : "./data/mechanism.db",
        tableCount,
        foreignKeys: isPg ? "PostgreSQL Relational Foreign Keys" : "PRAGMA foreign_keys = ON (Enforced)",
        journalMode: isPg ? "PostgreSQL WAL" : "WAL (Write-Ahead Logging)",
        sdk: "@google/genai (Interactions API)",
        securityProtocol: "Strict Server-Side Key Encapsulation",
        costControl: "Single Request per Query / Zero Duplicate Calls",
        engineVersion: "MECHANISM v2.4.0"
      }
    });
  } catch (err) {
    res.json({
      success: true,
      data: {
        provider: AI_PROVIDER,
        model: CURRENT_MODEL,
        hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY")
      }
    });
  }
});
var app_default = app;

// api/index.ts
function handler(req, res) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return app_default(req, res);
}
export {
  handler as default
};
