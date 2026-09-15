import React, { useState, useEffect, useRef } from 'react';
import { Question, Topic, UserModel, TestEngineMode, CognitiveEvaluation, ActiveLearningContext } from '../types';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Target,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  Flame,
  X,
  FileText,
  Check,
  Scale,
  Cpu,
  GitCommit,
  Radio,
  Sliders,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { NavTab } from '../components/Navigation';
import { RecommendedNextAction } from '../components/mechanism/RecommendedNextAction';
import { EmptyContextState } from '../components/EmptyContextState';

interface TestEnginePageProps {
  selectedTopic: Topic | undefined;
  topics?: Topic[];
  userModel?: UserModel | null;
  activeContext?: ActiveLearningContext | null;
  onRefreshUserModel?: () => void;
  onNavigate?: (tab: NavTab) => void;
  onSelectTopic?: (topicId: string) => void;
  onNewDiscussion?: () => void;
}

interface EngineModeConfig {
  id: TestEngineMode;
  label: string;
  code: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ENGINE_MODES: EngineModeConfig[] = [
  {
    id: 'mixed_adaptive',
    label: 'Mixed Adaptive',
    code: 'MODE 01',
    description: 'Autonomous balance of weakness hunting, transfer disguise, and calibration traps',
    icon: Sparkles,
  },
  {
    id: 'weakness_hunt',
    label: 'Weakness Hunt',
    code: 'MODE 02',
    description: 'Directly probes the highest-confidence active error with diagnostic precision',
    icon: Target,
  },
  {
    id: 'transfer_test',
    label: 'Disguised Transfer',
    code: 'MODE 03',
    description: 'Tests if underlying reasoning failure recurs in an isomorphic physics domain',
    icon: Compass,
  },
  {
    id: 'mechanism_test',
    label: 'Mechanism Reversal',
    code: 'MODE 04',
    description: 'Forces backwards deduction from perturbed end-state to primary cause/initial conditions',
    icon: Zap,
  },
  {
    id: 'first_principles',
    label: 'First Principles',
    code: 'MODE 05',
    description: 'Derives complex physical phenomena strictly from invariant physical axioms',
    icon: Brain,
  },
  {
    id: 'adversarial_model',
    label: 'Adversarial Model',
    code: 'MODE 06',
    description: 'Presents plausible-looking flawed models designed to stress-test your axioms',
    icon: Flame,
  },
  {
    id: 'calibration_test',
    label: 'Calibration Trap',
    code: 'MODE 07',
    description: 'Distinguishes high-confidence memorization from true mechanistic derivation',
    icon: ShieldCheck,
  },
  {
    id: 'exploration_test',
    label: 'Hypothesis Disambiguation',
    code: 'MODE 08',
    description: 'Probes between competing explanations of why you make certain errors',
    icon: Layers,
  },
];

const CONFIDENCE_LEVELS = [
  {
    value: 20,
    label: '20%',
    badge: 'Speculative Intuition',
    description: 'High uncertainty // Competing etiologies equally plausible',
  },
  {
    value: 40,
    label: '40%',
    badge: 'Weak Hypothesis',
    description: 'Partial mechanism identified // Primary gradient unconfirmed',
  },
  {
    value: 60,
    label: '60%',
    badge: 'Grounded Deduction',
    description: 'Key variable confirmed // Moderate counter-regulatory doubt',
  },
  {
    value: 80,
    label: '80%',
    badge: 'High Certainty',
    description: 'Primary causal sequence validated // Alternative differentials ruled out',
  },
  {
    value: 100,
    label: '100%',
    badge: 'Deterministic',
    description: 'Absolute conservation law // Physical pathway invariant',
  },
];

export const TestEnginePage: React.FC<TestEnginePageProps> = ({
  selectedTopic,
  topics = [],
  userModel,
  activeContext,
  onRefreshUserModel,
  onNavigate,
  onSelectTopic,
  onNewDiscussion,
}) => {
  const [currentMode, setCurrentMode] = useState<TestEngineMode>('mixed_adaptive');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(80);
  const [reasoning, setReasoning] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<CognitiveEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showRationale, setShowRationale] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Mechanistic');
  const [activeTopicId, setActiveTopicId] = useState<string | undefined>(selectedTopic?.id);

  // Dynamic custom topic input & format selector
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [activeCustomTopic, setActiveCustomTopic] = useState<string>('');
  const [questionFormat, setQuestionFormat] = useState<'any' | 'mcq' | 'long_answer'>('any');
  const [longAnswerText, setLongAnswerText] = useState<string>('');

  // Cognitive Latency Observer (subtle, non-exam)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Active context is the single authoritative source of truth
  const hasContext = Boolean(activeContext?.topicName || activeCustomTopic);

  useEffect(() => {
    if (activeContext?.topicId) {
      setActiveTopicId(activeContext.topicId);
      setActiveCustomTopic('');
    } else if (activeContext?.topicName) {
      setActiveTopicId(undefined);
      setActiveCustomTopic(activeContext.topicName);
    } else {
      setActiveTopicId(undefined);
      setActiveCustomTopic('');
      setCurrentQuestion(null);
    }
  }, [activeContext]);

  useEffect(() => {
    if (hasContext) {
      fetchAdaptiveQuestion();
    }
  }, [currentMode, activeTopicId, selectedDifficulty, activeCustomTopic, questionFormat, activeContext?.topicName, hasContext]);

  useEffect(() => {
    if (!submitted && !loading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submitted, loading, currentQuestion?.id]);

  const fetchAdaptiveQuestion = async (
    customTopicOverride?: string,
    formatOverride?: 'any' | 'mcq' | 'long_answer'
  ) => {
    setLoading(true);
    setSubmitted(false);
    setEvaluation(null);
    setSelectedOption(null);
    setReasoning('');
    setLongAnswerText('');
    setShowRationale(false);

    try {
      const topicToUse = customTopicOverride !== undefined ? customTopicOverride : activeCustomTopic;
      const formatToUse = formatOverride !== undefined ? formatOverride : questionFormat;

      const params = new URLSearchParams();
      params.set('mode', currentMode);

      if (topicToUse) {
        params.set('custom_topic_name', topicToUse);
      } else if (activeContext?.topicName) {
        if (activeContext.topicId) {
          params.set('topic_id', activeContext.topicId);
        } else {
          params.set('custom_topic_name', activeContext.topicName);
        }
      } else if (activeTopicId) {
        params.set('topic_id', activeTopicId);
      }

      // Pass active context metadata if available
      if (activeContext?.detectedGaps && activeContext.detectedGaps.length > 0) {
        params.set('detected_gaps', JSON.stringify(activeContext.detectedGaps));
      }
      if (activeContext?.summary) {
        params.set('context_summary', activeContext.summary);
      }
      if (activeContext?.unresolvedQuestions && activeContext.unresolvedQuestions.length > 0) {
        params.set('unresolved_questions', JSON.stringify(activeContext.unresolvedQuestions));
      }

      if (formatToUse !== 'any') params.set('question_format', formatToUse);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);

      const res = await fetch(`/api/tests/adaptive-select?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentQuestion(json.data);
      } else {
        // Fallback to static questions
        const fallbackRes = await fetch(activeTopicId ? `/api/questions?topic_id=${activeTopicId}` : '/api/questions');
        const fallbackJson = await fallbackRes.json();
        if (fallbackJson.success && Array.isArray(fallbackJson.data) && fallbackJson.data.length > 0) {
          setCurrentQuestion(fallbackJson.data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching adaptive question:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTopicSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTopicInput.trim()) return;
    const trimmed = customTopicInput.trim();
    setActiveCustomTopic(trimmed);
    fetchAdaptiveQuestion(trimmed, questionFormat);
  };

  const handleClearCustomTopic = () => {
    setCustomTopicInput('');
    setActiveCustomTopic('');
    fetchAdaptiveQuestion('', questionFormat);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || submitting) return;

    const isLongAnswer = currentQuestion.question_format === 'long_answer';
    const finalAnswer = isLongAnswer
      ? (longAnswerText.trim() || reasoning.trim())
      : selectedOption;

    if (!finalAnswer) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/questions/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: finalAnswer,
          confidence,
          reasoning: reasoning.trim() || (isLongAnswer ? finalAnswer : ''),
          time_taken: Math.max(5, elapsedSeconds),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setEvaluation(json.data);
        setSubmitted(true);
        if (onRefreshUserModel) {
          onRefreshUserModel();
        }
      }
    } catch (e) {
      console.error('Error submitting attempt:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    fetchAdaptiveQuestion();
  };

  const handleTestInDisguise = () => {
    setCurrentMode('transfer_test');
  };

  // Format question type label
  const formatQuestionType = (type?: string) => {
    if (!type) return 'TYPE A: DIRECT DIAGNOSTIC';
    return type.replace('TYPE_', 'TYPE ').replace(/_/g, ' ');
  };

  const activeModeConfig = ENGINE_MODES.find((m) => m.id === currentMode) || ENGINE_MODES[0];
  const currentConfidenceLevel = CONFIDENCE_LEVELS.find((l) => l.value === confidence) || CONFIDENCE_LEVELS[3];

  if (!hasContext) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        <EmptyContextState
          toolName="Diagnostic Test Engine"
          toolDescription="The Adaptive Test Engine dynamically constructs discriminative diagnostic items targeting your active inquiry context and cognitive flaw profile. Please select a topic or establish a discussion context first."
          topics={topics}
          onSelectTopic={(topicId) => {
            setActiveTopicId(topicId);
            onSelectTopic?.(topicId);
          }}
          onNavigate={onNavigate}
          onNewDiscussion={onNewDiscussion}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* 1. Sophisticated Engine Console Header */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-5 md:p-6 shadow-xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs">
                ADAPTIVE REASONING ENGINE
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                // ACTIVE MODE: <strong className="text-cyan-400 font-semibold">{activeModeConfig.label.toUpperCase()}</strong>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-sans text-slate-100 tracking-tight">
              Diagnostic Problem-Solving Cockpit
            </h1>
          </div>

          {/* Real-time Diagnostic Telemetry */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#07080C] text-right">
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Error Clusters</div>
              <div className="text-xs font-mono font-bold text-cyan-400">
                {userModel?.hierarchical_errors?.length || 4} Tracked
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#07080C] text-right">
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Brier Calibration</div>
              <div className="text-xs font-mono font-bold text-emerald-400">
                {userModel?.confidence_calibration?.brier_score || '0.14'}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed max-w-3xl">
          This is an autonomous diagnostic engine, not an exam drill bank. Every question isolates a specific physical causal link, tests competing hypotheses about your cognitive blind spots, and detects false certainty before complex problem-solving errors propagate.
        </p>

        {/* 2. Unified Instrument Panel: Engine Modes */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold uppercase tracking-wider text-slate-300">Diagnostic Engine Modes</span>
            </div>
            <span className="text-[11px] text-slate-500">Select target diagnostic strategy</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ENGINE_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = currentMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setCurrentMode(mode.id)}
                  disabled={loading || submitting}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500/80 bg-gradient-to-br from-[#101c30] to-[#0C0E16] shadow-[0_0_15px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/40 text-slate-100'
                      : 'border-white/[0.08] bg-[#07080C] hover:border-white/[0.16] hover:bg-[#101420] text-slate-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono tracking-wider ${isSelected ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                        {mode.code}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <div className={`text-xs font-semibold font-sans truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {mode.label}
                    </div>
                  </div>
                  <span className={`text-[10px] font-sans line-clamp-2 mt-2 leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {mode.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Instrument Calibration Bar: Domain, Format, Depth, Latency */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-4 md:p-5 shadow-lg space-y-3">
        {/* Active Context Seed Banner */}
        {activeContext?.topicName && !activeCustomTopic && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#07080C] border border-cyan-500/20 text-xs text-slate-300 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Active Learning Context:</span>
              <span className="font-semibold text-white truncate">
                {activeContext.source === 'doubt_chat' ? 'Doubt Chat' : 'Active Focus'} — {activeContext.topicName}
              </span>
              {activeContext.detectedGaps && activeContext.detectedGaps.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60 shrink-0">
                  Targeting {activeContext.detectedGaps.length} detected gap{activeContext.detectedGaps.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTopicId(undefined);
                setActiveCustomTopic('');
                onSelectTopic?.('');
              }}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 underline shrink-0 cursor-pointer"
              title="Clear active context and return to neutral state"
            >
              Clear Active Focus
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Topic Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Domain:</span>
            <select
              value={activeCustomTopic ? '' : (activeContext?.topicId || activeTopicId || '')}
              onChange={(e) => {
                setActiveCustomTopic('');
                setCustomTopicInput('');
                onSelectTopic?.(e.target.value);
              }}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="">{activeContext?.topicName && !activeContext.topicId ? `Dynamic: ${activeContext.topicName}` : 'All Mechanism Domains (Adaptive)'}</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Format Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-1">Format:</span>
            {(['any', 'mcq', 'long_answer'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setQuestionFormat(fmt);
                  fetchAdaptiveQuestion(activeCustomTopic, fmt);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  questionFormat === fmt
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-[#07080C] text-slate-400 border border-white/[0.08] hover:border-white/[0.16] hover:text-slate-300'
                }`}
              >
                {fmt === 'any' ? 'Adaptive' : fmt === 'mcq' ? 'MCQ' : 'Derivation'}
              </button>
            ))}
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-1">Depth:</span>
            {['Foundation', 'Mechanistic', 'Second-Order', 'Theoretical Synthesis'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedDifficulty(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  selectedDifficulty === lvl
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'bg-[#07080C] text-slate-400 border border-white/[0.08] hover:border-white/[0.16] hover:text-slate-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Cognitive Latency Observer (Subtle, non-exam) */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#07080C] border border-white/[0.08] text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Cognitive Latency:</span>
            <span className="font-bold text-slate-200">
              {elapsedSeconds}s
            </span>
          </div>
        </div>

        {/* Dynamic Custom Topic Synthesis Input */}
        <form onSubmit={handleCustomTopicSubmit} className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              placeholder="Or synthesize test for any concept (e.g. Gyroscopic precession, Lenz induction, Carnot efficiency)..."
              className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {customTopicInput && (
              <button
                type="button"
                onClick={handleClearCustomTopic}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Clear topic"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!customTopicInput.trim() || loading || submitting}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-semibold font-mono uppercase tracking-wider shadow-xs disabled:opacity-40 transition-opacity flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calibrate Topic</span>
          </button>
        </form>

        {/* Active Custom Topic Banner */}
        {activeCustomTopic && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#07080C] border border-cyan-500/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-cyan-300 uppercase text-[10px]">
                ACTIVE CUSTOM TOPIC:
              </span>
              <span className="font-semibold text-slate-100">"{activeCustomTopic}"</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • Synthesizing questions calibrated to your recorded error clusters
              </span>
            </div>
            <button
              onClick={handleClearCustomTopic}
              className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
              title="Return to standard topics"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Main Question Area (The Dominant Element) */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400 bg-[#0C0E16] rounded-2xl border border-white/[0.08] p-8 shadow-xl">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
            <Activity className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto" />
          </div>
          <div className="text-center space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
              {activeCustomTopic
                ? `Synthesizing adaptive diagnostic test for "${activeCustomTopic}"...`
                : 'Selecting optimal diagnostic question for your current error model...'}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Isolating causal node to falsify competing cognitive explanations
            </span>
          </div>
        </div>
      ) : !currentQuestion ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-[#0C0E16] rounded-2xl border border-white/[0.08] shadow-xl space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
          <p>No questions currently match the chosen diagnostic filter.</p>
          <button
            onClick={() => {
              setActiveTopicId(undefined);
              setActiveCustomTopic('');
              setCustomTopicInput('');
              setCurrentMode('mixed_adaptive');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-blue-500 cursor-pointer"
          >
            Reset to Mixed Adaptive Pool
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-6 md:p-8 shadow-xl space-y-6">
          {/* Header Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {formatQuestionType(currentQuestion.question_type)}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[#07080C] border border-white/[0.08] text-slate-400">
                  {currentQuestion.question_format === 'long_answer' ? 'Derivation / Open' : 'Discrete Differential'}
                </span>
                {currentQuestion.root_error_target && (
                  <span className="text-[11px] font-mono text-amber-300/90">
                    • Target Flaw: {currentQuestion.root_error_target}
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-slate-400">
                {currentQuestion.subject_name || 'Classical Mechanics'} • {currentQuestion.topic_name || activeCustomTopic || 'Oscillations & Waves'}
              </div>
            </div>

            {/* Diagnostic Rationale Pill & Expander */}
            <button
              type="button"
              onClick={() => setShowRationale(!showRationale)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#07080C] hover:border-white/[0.16] hover:bg-[#101420] text-xs text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
              title="Understand what reasoning error this question is designed to detect"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Diagnostic Rationale</span>
              {showRationale ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          {/* Rationale Disclosure (Diagnostic Explanation without revealing answer) */}
          {showRationale && (
            <div className="p-4 rounded-xl bg-[#07080C] border border-cyan-500/30 text-xs space-y-1.5 animate-fadeIn">
              <div className="font-mono font-bold text-cyan-300 uppercase text-[10px]">
                Why the Engine Assigned This Question:
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">
                {currentQuestion.internal_rationale ||
                  `This question is calibrated to test whether you rely on intuitive heuristic shortcuts vs. explicitly tracing rigorous physical conservation laws and dynamical gradients.`}
              </p>
              {currentQuestion.falsification_criteria && (
                <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-cyan-500/20">
                  <strong className="text-cyan-200">Falsification Probe:</strong> {currentQuestion.falsification_criteria}
                </div>
              )}
            </div>
          )}

          {/* Physical Scenario / Perturbation */}
          {(currentQuestion.scenario_vignette || currentQuestion.physical_scenario) && (
            <div className="p-4 md:p-5 rounded-xl bg-[#07080C] border-l-2 border-cyan-500/70 border-y border-r border-white/[0.08] text-xs md:text-sm text-slate-200 leading-relaxed font-sans shadow-inner">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
                Physical Scenario // Perturbation:
              </span>
              {currentQuestion.scenario_vignette || currentQuestion.physical_scenario}
            </div>
          )}

          {/* Question Text (Dominant Element) */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
              Mechanistic Problem Statement:
            </span>
            <h2 className="text-lg md:text-xl font-semibold text-slate-100 font-sans leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Options or Long Answer Input Area */}
          {currentQuestion.question_format === 'long_answer' ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Your Mechanistic Derivation & Solution:</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {longAnswerText.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={longAnswerText}
                onChange={(e) => !submitted && setLongAnswerText(e.target.value)}
                disabled={submitted || submitting}
                placeholder="Trace the physical derivation step-by-step: Step 1 (Initial setup & conserved quantity) → Step 2 (Physical interaction/perturbation) → Step 3 (Dynamical equilibrium/asymptotic state)..."
                className="w-full text-xs md:text-sm p-4 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y leading-relaxed font-sans"
              />
            </div>
          ) : (
            /* MCQ Options List as Competing Mechanistic Hypotheses */
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                Competing Mechanistic Hypotheses:
              </span>
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = submitted && opt === (evaluation?.correct_answer || currentQuestion.correct_answer);
                  const isWrong = submitted && isSelected && !evaluation?.correct;

                  let cardStyle = 'border-white/[0.08] bg-[#07080C] hover:border-white/[0.16] hover:bg-[#101420] text-slate-200';
                  if (isSelected && !submitted) {
                    cardStyle = 'border-cyan-500/80 bg-[#101c30] text-slate-100 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40';
                  } else if (isCorrect) {
                    cardStyle = 'border-emerald-500/50 bg-[#071710] text-slate-100 ring-1 ring-emerald-500/40';
                  } else if (isWrong) {
                    cardStyle = 'border-rose-500/50 bg-[#17080c] text-slate-100 ring-1 ring-rose-500/40';
                  }

                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer text-xs md:text-sm transition-all ${cardStyle}`}
                    >
                      <input
                        type="radio"
                        name="diagnostic-option"
                        checked={isSelected}
                        onChange={() => !submitted && setSelectedOption(opt)}
                        disabled={submitted || submitting}
                        className="mt-0.5 accent-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 leading-relaxed">
                        <span className="font-mono font-bold mr-2 text-slate-400">[{String.fromCharCode(65 + idx)}]</span>
                        <span>{opt}</span>
                      </div>
                    </label>
                  );
                })
              ) : null}
            </div>
          )}

          {/* 5. Cognitive-Calibration Instrument: Answer + Confidence + Reasoning = Diagnostic Signal */}
          {!submitted && (
            <div className="pt-6 border-t border-white/[0.06] space-y-5">
              {/* Epistemic Calibration Banner */}
              <div className="p-3.5 rounded-xl bg-[#07080C] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-xs font-mono">
                    <span className="text-slate-300 font-semibold">CALIBRATION COCKPIT: </span>
                    <span className="text-slate-400 text-[11px]">
                      ANSWER + CONFIDENCE + REASONING = <strong className="text-cyan-400">DIAGNOSTIC SIGNAL</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Calibrated against Brier Score
                </span>
              </div>

              {/* Confidence Step */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Step 1 // Predictive Confidence Calibration:
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {confidence}% Certain • {currentConfidenceLevel.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Rate your certainty before seeing the outcome. The engine uses this to detect overconfidence traps and subconscious hesitation.
                </p>

                {/* Confidence Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {CONFIDENCE_LEVELS.map((lvl) => {
                    const isSelected = confidence === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setConfidence(lvl.value)}
                        disabled={submitting}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-500 bg-[#101c30] text-slate-100 shadow-sm ring-1 ring-cyan-500/40'
                            : 'border-white/[0.08] bg-[#07080C] text-slate-400 hover:border-white/[0.16] hover:bg-[#101420] hover:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span>{lvl.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                        </div>
                        <div className="text-[10px] font-mono truncate mt-0.5 text-slate-300">
                          {lvl.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mechanistic Reasoning Textarea */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Step 2 // Mechanistic Rationale:
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Required to audit cognitive error patterns
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  What causal link or physical balance determined your choice? What assumption ruled out competing options?
                </p>

                {/* Quick Helper Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
                  <span className="text-[10px] font-mono text-slate-400">Quick axioms:</span>
                  {[
                    'Primary variable changed first',
                    'Direction of potential gradient',
                    'Eliminated competing differential',
                    'Physical conservation axiom',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => {
                        setReasoning((prev) => (prev ? `${prev} [${phrase}]` : phrase));
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#07080C] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#101420] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Explain your deduction: Which physical law did you rely on? Which variable or conservation constraint did you evaluate first?"
                  disabled={submitting}
                  className="w-full text-xs p-3.5 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none leading-relaxed font-sans"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (currentQuestion.question_format === 'long_answer'
                    ? !longAnswerText.trim() && !reasoning.trim()
                    : !selectedOption)
                }
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-blue-950/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Cognitive Trajectory & Calibrating Flaw Model...</span>
                  </>
                ) : (
                  <>
                    <span>Commit Hypothesis & Submit Causal Signal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* 6. Evaluation Section (Visual Priority After Submission) */}
          {submitted && evaluation && (
            <div className="pt-6 border-t border-white/[0.06] space-y-6 animate-fadeIn">
              {/* Cognitive Outcome Header: "Was the underlying model correct?" */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  evaluation.correct
                    ? 'border-emerald-500/40 bg-[#071710] text-slate-200'
                    : 'border-rose-500/40 bg-[#17080c] text-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {evaluation.correct ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                           DIAGNOSTIC VERDICT //
                        </span>
                        <span
                          className={`text-xs font-mono font-bold uppercase tracking-wider ${
                            evaluation.correct ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {evaluation.correct ? 'CAUSAL MODEL SOUND' : 'REASONING DIVERGENCE DETECTED'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold font-sans text-slate-100">
                        {evaluation.correct
                          ? 'Underlying Physical Model Validated'
                          : 'Theoretical Reasoning Divergence'}
                      </h3>
                    </div>
                  </div>

                  {/* Calibration Assessment Badge */}
                  <div className="text-left sm:text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        evaluation.calibration_verdict.includes('Well-calibrated')
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                          : evaluation.calibration_verdict.includes('Overconfident') || evaluation.calibration_verdict.includes('False Certainty')
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                          : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                      }`}
                    >
                      {evaluation.calibration_verdict}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Stated Certainty: {confidence}% • Brier: {evaluation.brier_score_contribution?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Sub-label explaining "Was the model correct?" */}
                <div className="text-xs font-mono text-slate-400 border-t border-white/[0.06] pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>
                    Selected Answer:{' '}
                    <strong className="text-slate-200">
                      {selectedOption || longAnswerText || 'Submitted response'}
                    </strong>
                  </span>
                  <span>
                    Canonical Key:{' '}
                    <strong className="text-cyan-300">
                      {evaluation.correct_answer}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 5-Step Cognitive Pipeline Report */}
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#07080C] space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                  <GitCommit className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    5-Stage Cognitive Diagnostic Pipeline
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Step 1: What you answered */}
                  <div className="p-3 rounded-xl bg-[#0C0E16] border border-white/[0.08] space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      1. Stated Response & Internal Rationale:
                    </span>
                    <p className="text-slate-300 font-sans">
                      {reasoning ? `"${reasoning}"` : 'No explicit reasoning stated before commit.'}
                    </p>
                  </div>

                  {/* Step 2: What the mechanism required (blue/violet) */}
                  <div className="p-3 rounded-xl bg-[#0C0E16] border border-cyan-500/30 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                      2. Canonical Physical Mechanism Required:
                    </span>
                    <p className="text-slate-200 font-sans leading-relaxed">
                      {evaluation.explanation}
                    </p>
                    {evaluation.discriminator_note && (
                      <div className="mt-2 pt-2 border-t border-cyan-500/20 text-xs font-mono text-cyan-300">
                        <strong>Decisive Discriminator:</strong> {evaluation.discriminator_note}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Where reasoning diverged (amber/red for divergence) */}
                  <div
                    className={`p-3 rounded-xl border space-y-1 ${
                      evaluation.correct
                        ? 'bg-[#071710] border-emerald-500/30'
                        : 'bg-[#180e14] border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
                        evaluation.correct ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      3. Where Deductive Trajectory Diverged:
                    </span>
                    <p className="text-slate-300 font-sans leading-relaxed">
                      {evaluation.correct
                        ? 'Your stated causal reasoning aligned with the primary rate-limiting physical sequence.'
                        : (evaluation.reasoning_critique || 'Your deduction diverged by evaluating a secondary compensatory mechanism instead of the primary driving gradient.')}
                    </p>
                  </div>

                  {/* Step 4: Cognitive Error Detected */}
                  {evaluation.root_error_classified && (
                    <div className="p-3 rounded-xl bg-[#140e1a] border border-violet-500/30 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-bold block">
                        4. Cognitive Flaw Node Classified:
                      </span>
                      <p className="text-slate-200 font-mono text-[11px]">
                        {evaluation.root_error_classified}
                      </p>
                    </div>
                  )}

                  {/* Step 5: How the model should update */}
                  {evaluation.model_evolution && (
                    <div className="p-3.5 rounded-xl bg-[#0C0E16] border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>5. User Model Evolution Update</span>
                        </span>
                        <span className="text-slate-400">
                          Progression: Stage {evaluation.model_evolution.stage}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-[10px] uppercase text-slate-400 shrink-0 mt-0.5">Updated Axiom:</span>
                          <span className="font-sans">{evaluation.model_evolution.hypothesis_updated}</span>
                        </div>
                        <div className="flex items-start gap-2 text-cyan-300 font-medium">
                          <span className="font-mono text-[10px] uppercase text-cyan-400 shrink-0 mt-0.5">Next Probe:</span>
                          <span className="font-sans">{evaluation.model_evolution.recommended_next_test}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex-1 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-blue-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>Next Adaptive Diagnostic Probe</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleTestInDisguise}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/[0.08] bg-[#07080C] hover:border-white/[0.16] hover:bg-[#101420] text-slate-200 text-xs font-semibold font-mono tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Test in Disguise</span>
                </button>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('user_model')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/[0.08] bg-[#07080C] hover:border-white/[0.16] hover:bg-[#101420] text-slate-200 text-xs font-semibold font-mono tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Brain className="w-4 h-4 text-emerald-400" />
                    <span>Personal Model Telemetry</span>
                  </button>
                )}
              </div>

              {/* Recommended Next Action */}
              <RecommendedNextAction
                currentTool="mcq_test"
                topicTitle={currentQuestion.topic_name || selectedTopic?.name}
                onNavigate={onNavigate}
                overallScore={evaluation.correct ? 90 : 50}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
