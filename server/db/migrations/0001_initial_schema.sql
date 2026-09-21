-- ====================================================================
-- Mechanism Physics Private - PostgreSQL Migration 0001
-- Version-controlled relational schema for Neon PostgreSQL persistence
-- ====================================================================

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

-- ====================================================================
-- Private Single-Account Authentication & Serverless Session Store
-- ====================================================================
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

-- ====================================================================
-- Performance & Lookup Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_user ON adaptive_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_error ON adaptive_evidence(error_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_feature ON adaptive_evidence(feature);
CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_topic ON adaptive_evidence(topic_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_evidence_created ON adaptive_evidence(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_private_sessions_token ON private_sessions(token);
CREATE INDEX IF NOT EXISTS idx_private_sessions_expires ON private_sessions(expires_at);
