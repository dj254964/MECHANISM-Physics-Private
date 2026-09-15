export interface User {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  icon?: string;
  topicCount?: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  chapter: string;
  description: string;
  subject_name?: string;
  is_custom?: boolean;
}

export type LearningMode =
  | 'doubt_chat'
  | 'compressor'
  | 'first_principles'
  | 'adversarial'
  | 'reverse_engineering'
  | 'simulation'
  | 'mcq_test'
  | 'reconstruction';

export interface LearningSession {
  id: string;
  user_id: string;
  topic_id?: string;
  mode: LearningMode;
  started_at: string;
  completed_at?: string;
}

export interface Mechanism {
  id: string;
  user_id: string;
  topic_id: string;
  title: string;
  user_explanation: string;
  canonical_mechanism: string;
  created_at: string;
  updated_at: string;
}

export interface MechanismEvaluation {
  id: string;
  mechanism_id?: string;
  session_id?: string;
  causal_accuracy: number;
  completeness: number;
  directionality: number;
  assumption_quality: number;
  discriminator_quality: number;
  exception_handling: number;
  compression_quality: number;
  alternative_mechanism_quality: number;
  confidence: number;
  overall_score: number;
  weakest_link?: string;
  what_is_correct?: string;
  attack_details?: string;
  distinguishing_observation?: string;
  repaired_model?: string;
  compressed_mechanism?: string;
  evaluator_feedback: string;
  created_at: string;
}

export type QuestionType =
  | 'TYPE_A_DIRECT_DIAGNOSTIC'
  | 'TYPE_B_DISGUISED_TRANSFER'
  | 'TYPE_C_MECHANISM_REVERSAL'
  | 'TYPE_D_COMPETING_MECHANISMS'
  | 'TYPE_E_MISSING_VARIABLE'
  | 'TYPE_F_FALSE_CONFIDENCE'
  | 'TYPE_G_OVERANALYSIS'
  | 'TYPE_H_PREMATURE_ACTION'
  | 'TYPE_I_ADVERSARIAL_MODEL'
  | 'TYPE_J_RECONSTRUCTION';

export type ReasoningErrorStatus =
  | 'Unassessed'
  | 'Emerging'
  | 'Developing'
  | 'Unstable'
  | 'Stable'
  | 'Strong'
  | 'Well-calibrated';

export interface HierarchicalReasoningError {
  id: string;
  name: string;
  domain: string;
  reasoning_family: string;
  specific_failure: string;
  trigger_conditions: string;
  countermeasure: string;
  model_confidence: number | null; // 0.00 to 1.00, or null if unassessed
  status: ReasoningErrorStatus;
  stage: number | null; // 1 to 7, or null if unassessed
  error_frequency: number;
  recent_frequency: number;
  historical_frequency: number;
  successful_repairs: number;
  transfer_status: 'Unassessed' | 'Pending' | 'Tested' | 'Survived' | 'Defeated';
  last_seen: string;
  current_hypothesis: string;
  next_diagnostic_test: string;
  linked_evidence_count?: number;
  feature_sources?: string[];
  evidence_strength?: number; // aggregated strength 0.0 - 1.0
}

export interface AdaptiveEvidence {
  id: string;
  user_id: string;
  feature: LearningMode | 'doubt_chat' | 'compressor' | 'first_principles' | 'adversarial' | 'reverse_engineering' | 'simulation' | 'mcq_test' | 'reconstruction';
  topic_id?: string | null;
  topic_name?: string | null;
  error_id?: string | null;
  error_name?: string | null;
  correct_answer?: boolean | null;
  correct_reasoning?: boolean | null;
  robust_mechanism?: boolean | null;
  transferable_mastery?: boolean | null;
  confidence?: number | null;
  time_taken_sec?: number | null;
  discriminator_identified?: boolean | null;
  reconstruction_score?: number | null;
  evidence_strength: number; // 0.0 to 1.0
  evidence_summary: string;
  created_at: string;
}

export interface NextBestTask {
  mode: LearningMode;
  test_mode?: TestEngineMode;
  topic_id?: string;
  topic_name: string;
  title: string;
  reason: string;
  target_error_id?: string;
  target_error_name?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';
  rationale_dimensions: {
    category: 'RECURRING_ERROR' | 'UNCERTAIN_HYPOTHESIS' | 'CROSS_CONTEXT_WEAKNESS' | 'TRANSFER_TEST' | 'RECONSTRUCTION' | 'CALIBRATION' | 'SPACED_RETEST' | 'EXPLORATION';
    evidence_count: number;
    urgency_score: number;
  };
}

export type TestEngineMode =
  | 'quick_diagnostic'
  | 'weakness_hunt'
  | 'transfer_test'
  | 'mechanism_test'
  | 'first_principles'
  | 'adversarial_test'
  | 'adversarial_model'
  | 'reconstruction'
  | 'calibration_test'
  | 'exploration_test'
  | 'mixed_adaptive';

export interface EvolvingHypothesis {
  id: string;
  target_weakness: string;
  hypothesis: string;
  competing_alternatives: string[];
  status: 'Active' | 'Refining' | 'Falsified' | 'Validated';
  updated_at: string;
}

export interface EvolutionLogEntry {
  timestamp: string;
  trigger_event: string;
  old_hypothesis: string;
  new_evidence: string;
  revised_hypothesis: string;
}

export interface CognitiveError {
  id: string;
  user_id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  first_seen: string;
  last_seen: string;
}

export interface Question {
  id: string;
  topic_id: string;
  topic_name?: string;
  subject_name?: string;
  mode: string;
  question_format?: 'mcq' | 'long_answer';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  reasoning_target: string;
  difficulty: 'Foundation' | 'Mechanistic' | 'Second-Order' | 'Physical Synthesis';
  scenario_vignette?: string;
  physical_scenario?: string;
  discriminator_note?: string;
  question_type?: QuestionType;
  root_error_target?: string;
  internal_rationale?: string;
  competing_paths?: string[];
  falsification_criteria?: string;
  surface_topic?: string;
  is_overanalysis_trap?: boolean;
  commit_threshold_reached?: boolean;
  scoring_rubric?: string;
  created_at: string;
}

export interface CognitiveEvaluation {
  correct: boolean;
  correct_answer: string;
  explanation: string;
  discriminator_note?: string;
  root_error_detected: string | null;
  root_error_classified?: string;
  target_error_occurred: boolean;
  reasoning_quality_score: number;
  reasoning_critique: string;
  calibration_verdict: 'Overconfident' | 'Underconfident' | 'Calibrated' | 'False Certainty' | string;
  calibration_analysis: string;
  brier_score_contribution?: number;
  time_efficiency_analysis: string;
  old_hypothesis: string;
  new_evidence: string;
  model_revision: string;
  model_evolution?: {
    stage: number;
    hypothesis_updated: string;
    recommended_next_test: string;
  };
  next_experiment: {
    mode: TestEngineMode;
    description: string;
    target: string;
  };
  hierarchical_errors?: HierarchicalReasoningError[];
  next_best_task?: NextBestTask | null;
  evidence?: AdaptiveEvidence;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  answer: string;
  correct: boolean;
  confidence: number; // 0 - 100
  reasoning: string;
  reasoning_error?: string;
  root_error_detected?: string;
  error_confidence?: number;
  reasoning_quality?: number;
  calibration_verdict?: string;
  model_update?: string;
  learning_outcome?: string;
  time_taken: number; // seconds
  created_at: string;
}

export interface SimulationState {
  hidden_state: string;
  underlying_mechanism?: string;
  hidden_physical_state?: string;
  gold_standard_discriminator: string;
  optimal_step_count: number;
}

export interface Simulation {
  id: string;
  topic_id: string;
  topic_name?: string;
  subject_name?: string;
  title: string;
  scenario: string;
  system_presentation?: {
    apparatus_spec: string;
    primary_anomaly: string;
    parameters: Record<string, string>;
    diagnostics: Record<string, string>;
  };
  apparatus_state?: {
    apparatus_spec: string;
    primary_anomaly: string;
    parameters: Record<string, string>;
    diagnostics: Record<string, string>;
  };
  available_investigations: Array<{
    id: string;
    name: string;
    cost_cognitive: string;
    result: string;
    is_discriminator: boolean;
    explanation: string;
  }>;
  available_decisions: Array<{
    id: string;
    intervention: string;
    rationale: string;
    is_optimal: boolean;
    outcome_feedback: string;
  }>;
  hidden_state: SimulationState;
  difficulty: 'Intermediate' | 'Advanced' | 'Mastery';
}

export interface SimulationAttempt {
  id: string;
  user_id: string;
  simulation_id: string;
  hypotheses: string[];
  evidence_used: string[];
  decisions: string[];
  confidence: number;
  outcome: string;
  model_update: string;
  unnecessary_investigations_count: number;
  overanalyzed: boolean;
  created_at: string;
}

export interface Reconstruction {
  id: string;
  user_id: string;
  topic_id: string;
  topic_name?: string;
  source_mechanism: string;
  user_reconstruction: {
    causal_chain: string;
    directionality: string;
    critical_variables: string;
    discriminator: string;
    exception: string;
  };
  evaluation: {
    causal_chain_score: number;
    directionality_score: number;
    variables_score: number;
    discriminator_score: number;
    exception_score: number;
    critique: string;
    canonical_comparison: string;
  };
  score: number;
  created_at: string;
}

export interface UserModel {
  id: string;
  user_id: string;
  reasoning_profile: {
    first_principles_index: number | null; // 0 - 100 or null if unassessed
    causal_precision: number | null;
    directionality_integrity: number | null;
    discriminator_acuity: number | null;
    exception_awareness: number | null;
    anti_overanalysis_score: number | null; // ability to commit when data is sufficient
  };
  topic_mastery: Record<string, {
    topic_name: string;
    mastery_percentage: number | null;
    status: 'Unassessed' | 'Needs Reconstruction' | 'Weak Mechanism' | 'Calibrating' | 'Consolidated';
    last_practiced: string;
  }>;
  error_profile: Array<{
    category: string;
    count: number;
    trend: 'improving' | 'stable' | 'recurring';
    example: string;
  }>;
  confidence_calibration: {
    brier_score: number | null; // lower is better (0.0 to 1.0)
    overconfidence_bias: number | null; // percentage
    underconfidence_bias: number | null; // percentage
    calibration_curve: Array<{
      predicted_confidence: number; // 20, 40, 60, 80, 100
      actual_accuracy: number;
    }>;
  };
  cognitive_resource_allocation: {
    average_time_per_decision_sec: number | null;
    unnecessary_tests_requested_rate: number | null;
    overanalysis_flags_count: number;
    decision_commit_efficiency: string;
  };
  recommended_difficulty: 'Foundation' | 'Mechanistic' | 'Second-Order' | 'Physical Synthesis';
  hierarchical_errors?: HierarchicalReasoningError[];
  evolving_hypotheses?: Array<{
    id: string;
    target_weakness: string;
    hypothesis: string;
    competing_alternatives: string[];
    status: 'Active' | 'Refining' | 'Falsified' | 'Validated';
    updated_at: string;
  }>;
  evolution_log?: Array<{
    timestamp: string;
    trigger_event: string;
    old_hypothesis: string;
    new_evidence: string;
    revised_hypothesis: string;
  }>;
  recommended_test?: {
    mode: TestEngineMode;
    title: string;
    rationale: string;
    target_weakness: string;
  };
  next_best_task?: NextBestTask;
  recent_evidence?: AdaptiveEvidence[];
  recent_performance: {
    accuracy_last_10: number;
    mechanisms_analyzed: number;
    reconstructions_completed: number;
    simulations_resolved: number;
  };
  updated_at: string;
}

export interface ActiveLearningContext {
  source: 'doubt_chat' | 'predefined_topic' | 'custom_topic';
  topicId?: string;
  topicName: string;
  subjectId?: string;
  conversationId?: string;
  conversationTitle?: string;
  summary?: string;
  detectedGaps?: string[];
  keyConcepts?: string[];
  unresolvedQuestions?: string[];
  hasAttachments?: boolean;
  attachmentNames?: string[];
  lastUpdated: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  topic_id?: string;
  topic_name?: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  learning_context?: ActiveLearningContext;
}

export type DoubtClassification =
  | 'Recall'
  | 'Definition'
  | 'Concept'
  | 'Mechanism'
  | 'Comparison'
  | 'Confused mental model'
  | 'Physical application';

export interface ChatAttachment {
  name: string;
  type: 'image' | 'pdf' | 'doc' | 'docx' | string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  base64Data?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider: 'Gemini';
  model: string;
  classification?: DoubtClassification;
  attachments?: ChatAttachment[];
  metadata?: {
    fact_base?: string;
    mechanism?: string;
    causal_chain?: string[];
    discriminator?: string;
    physical_relevance?: string;
    exception?: string;
    anti_overanalysis_flag?: boolean;
    answered_at: string;
  };
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    provider: string;
    model: string;
    timestamp: string;
  };
}
