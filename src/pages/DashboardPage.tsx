import React from 'react';
import { UserModel, Topic, ActiveLearningContext } from '../types';
import {
  Brain,
  Target,
  Flame,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Compass,
  Zap,
  Cpu,
  Eye,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  BookOpen,
  HelpCircle,
  Atom,
  ChevronRight,
} from 'lucide-react';
import { NavTab } from '../components/Navigation';
import { MechanismLogo } from '../components/branding/MechanismLogo';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

interface DashboardPageProps {
  userModel: UserModel | null;
  topics: Topic[];
  activeContext?: ActiveLearningContext | null;
  onNavigate: (tab: NavTab) => void;
  onSelectTopic: (topicId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  userModel,
  topics,
  activeContext,
  onNavigate,
  onSelectTopic,
}) => {
  const profile = userModel?.reasoning_profile || {
    first_principles_index: null,
    causal_precision: null,
    directionality_integrity: null,
    discriminator_acuity: null,
    exception_awareness: null,
    anti_overanalysis_score: null,
  };

  const mastery = userModel?.topic_mastery || {};
  const hierarchicalErrors = userModel?.hierarchical_errors || [];
  const recommendedTest = userModel?.recommended_test;
  const nextBestTask = userModel?.next_best_task;

  const activeErrors = hierarchicalErrors.filter(
    (e) => e.status === 'Emerging' || e.status === 'Developing' || e.status === 'Unstable'
  );
  const pendingTransferErrors = hierarchicalErrors.filter((e) => e.transfer_status === 'Pending');

  // Human-readable qualitative calibration for reasoning capability vectors
  const getVectorCalibration = (score: number | null) => {
    if (score == null) {
      return {
        label: 'Pending Probe',
        variant: 'neutral' as const,
        barVariant: 'brand' as const,
        colorClass: 'text-slate-400',
      };
    }
    if (score >= 80) {
      return {
        label: 'Robust',
        variant: 'success' as const,
        barVariant: 'success' as const,
        colorClass: 'text-emerald-400',
      };
    }
    if (score >= 65) {
      return {
        label: 'Calibrated',
        variant: 'cyan' as const,
        barVariant: 'cyan' as const,
        colorClass: 'text-sky-400',
      };
    }
    if (score >= 45) {
      return {
        label: 'Developing',
        variant: 'violet' as const,
        barVariant: 'violet' as const,
        colorClass: 'text-violet-400',
      };
    }
    return {
      label: 'Needs Calibration',
      variant: 'warning' as const,
      barVariant: 'warning' as const,
      colorClass: 'text-amber-400',
    };
  };

  // Helper for topic mastery progression
  const getProgressionBadge = (status: string) => {
    switch (status) {
      case 'Strong':
      case 'Consolidated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            Consolidated
          </span>
        );
      case 'Stable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-950/40 text-blue-300 border border-blue-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Stable
          </span>
        );
      case 'Developing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-950/40 text-violet-300 border border-violet-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Developing
          </span>
        );
      case 'Emerging':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-950/40 text-sky-300 border border-sky-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Emerging
          </span>
        );
      case 'Unstable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/40 text-amber-300 border border-amber-800/50">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            Unstable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-[#101420] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            Unassessed
          </span>
        );
    }
  };

  const reasoningVectors = [
    {
      id: 'first_principles',
      title: 'First-Principles Derivation',
      value: profile.first_principles_index,
      description: 'Derives from physical laws vs formula memorization',
      calibration: getVectorCalibration(profile.first_principles_index),
      icon: Atom,
    },
    {
      id: 'causal_precision',
      title: 'Causal Chain Continuity',
      value: profile.causal_precision,
      description: 'Unbroken mechanical links across intermediate states',
      calibration: getVectorCalibration(profile.causal_precision),
      icon: Activity,
    },
    {
      id: 'directionality',
      title: 'Directional Integrity',
      value: profile.directionality_integrity,
      description: 'Cause precedes effect; prevents circular deduction',
      calibration: getVectorCalibration(profile.directionality_integrity),
      icon: TrendingUp,
    },
    {
      id: 'discriminators',
      title: 'Crucial Variable Isolation',
      value: profile.discriminator_acuity,
      description: 'Pinpoints true governing invariants among distractors',
      calibration: getVectorCalibration(profile.discriminator_acuity),
      icon: Target,
    },
    {
      id: 'exceptions',
      title: 'Boundary Sensitivity',
      value: profile.exception_awareness,
      description: 'Tests asymptotic limits and symmetry breaks',
      calibration: getVectorCalibration(profile.exception_awareness),
      icon: Compass,
    },
    {
      id: 'synthesis',
      title: 'Decisive Synthesis',
      value: profile.anti_overanalysis_score,
      description: 'Direct analytical action without second-guessing',
      calibration: getVectorCalibration(profile.anti_overanalysis_score),
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* 1. Top Command Header: MECHANISM Physics Reasoning Workspace */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0e16] p-5 sm:p-6 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.7)]">
        {/* Subtle Ambient Depth Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-500/5 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <MechanismLogo size={24} glow />
              <span className="text-[10px] font-mono tracking-widest uppercase text-sky-400 font-bold bg-[#101420] px-2.5 py-1 rounded border border-white/[0.08]">
                PHYSICS REASONING WORKSPACE
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
                Diagnostic Engine Active
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans text-slate-100">
              Mechanistic Reasoning Workspace
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Real-time telemetry of causal reasoning structures, directional precision, overconfidence calibration, and cross-domain physical transfer stability.
            </p>
          </div>

          {/* Quick Engine Dispatch Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('mcq_test')}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-sky-500/20 transition-all duration-150 hover:-translate-y-0.5 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>Adaptive Probes</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('doubt_chat')}
              className="px-3 py-2 rounded-lg border border-white/[0.08] bg-[#101420] hover:bg-[#151c2e] hover:border-sky-500/30 text-slate-200 text-xs font-medium transition-all duration-150 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Doubt Dialogue</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('adversarial')}
              className="px-3 py-2 rounded-lg border border-white/[0.08] bg-[#101420] hover:bg-rose-950/20 text-rose-300 hover:text-rose-200 hover:border-rose-900/50 text-xs font-medium transition-all duration-150 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Adversarial Stress Test</span>
            </button>
          </div>
        </div>

        {/* Cognitive Engine Lifecycle Flow: OBSERVE → MODEL → TEST → ERROR → UPDATE */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span className="uppercase text-slate-500 tracking-wider">Engine Lifecycle:</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[#101420] text-sky-300 border border-sky-900/50 font-semibold">
              OBSERVE
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-[#101420] text-blue-300 border border-blue-900/50 font-semibold">
              MODEL
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-[#101420] text-indigo-300 border border-indigo-900/50 font-semibold">
              TEST
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-[#160f22] text-violet-300 border border-violet-900/50 font-semibold">
              FALSIFY
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-[#0b1716] text-emerald-300 border border-emerald-900/50 font-semibold">
              RECONSTRUCT
            </span>
          </div>
        </div>
      </div>

      {/* 2. Active Learning Context Card (HIGH PROMINENCE) */}
      {activeContext?.topicName ? (
        <div className="relative overflow-hidden rounded-xl border border-sky-500/40 bg-[#0c0e16] p-5 shadow-[0_8px_28px_-4px_rgba(0,0,0,0.6)]">
          {/* Ambient high-contrast indicator glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-sky-950/60 text-sky-300 border border-sky-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)] animate-pulse" />
                  Active Reasoning Context
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101420] text-slate-300 border border-white/[0.08]">
                  {activeContext.source === 'doubt_chat'
                    ? 'Sourced from Doubt Dialogue'
                    : activeContext.source === 'custom_topic'
                    ? 'Custom Concept Focus'
                    : 'Targeted Curricular Scope'}
                </span>
                {activeContext.detectedGaps && activeContext.detectedGaps.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900/60">
                    {activeContext.detectedGaps.length} Conceptual Friction Points
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {activeContext.topicName}
                </h2>
              </div>

              {activeContext.summary && (
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl bg-[#090b10] p-2.5 rounded-md border border-white/[0.06]">
                  {activeContext.summary}
                </p>
              )}

              {/* Detected Conceptual Gaps Tags */}
              {activeContext.detectedGaps && activeContext.detectedGaps.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">
                    Gaps Under Investigation:
                  </span>
                  {activeContext.detectedGaps.map((gap, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                      <span>{gap}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Context-Grounded Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
              <button
                type="button"
                onClick={() => onNavigate('doubt_chat')}
                className="px-3 py-2 rounded-lg bg-[#101420] hover:bg-[#151c2e] text-sky-300 border border-sky-500/30 text-xs font-mono font-medium transition-all duration-150 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Resume Dialogue</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('mcq_test')}
                className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-sm transition-all duration-150 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span>Probe Active Concept</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Awaiting Active Context - Prompt to select or initiate */
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0e16] p-4 sm:p-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#101420] border border-white/[0.08] flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    Awaiting Active Reasoning Focus
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101420] text-slate-400 border border-white/[0.06]">
                    Curricular Grounding
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Select a physics topic to ground your diagnostic vectors, or launch a question in Doubt Dialogue to calibrate your real-time reasoning model.
                </p>
              </div>
            </div>

            {/* Quick foundational topic picks */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {topics.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTopic(t.id);
                    onNavigate('mcq_test');
                  }}
                  className="px-2.5 py-1 text-[11px] font-sans font-medium rounded bg-[#101420] text-slate-300 hover:text-sky-300 hover:bg-[#151c2e] border border-white/[0.08] hover:border-sky-500/30 transition-all duration-150 cursor-pointer"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Primary Focal Area: Engine Directive / Recommended Next Action */}
      {(nextBestTask || recommendedTest) && (
        <div className="relative overflow-hidden rounded-xl border border-sky-500/35 bg-[#0c0e16] p-4 sm:p-5 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6)]">
          {/* Brand gradient ribbon on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-sky-950/60 border border-sky-700/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Target className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Engine Priority Recommendation
                  </span>
                  {nextBestTask?.priority && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        nextBestTask.priority === 'CRITICAL'
                          ? 'bg-rose-950/50 text-rose-300 border-rose-800/60 font-bold'
                          : nextBestTask.priority === 'HIGH'
                          ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                          : 'bg-[#101420] text-slate-300 border-white/[0.08]'
                      }`}
                    >
                      Priority: {nextBestTask.priority}
                    </span>
                  )}
                  {nextBestTask?.topic_name && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101420] text-slate-300 border border-white/[0.08]">
                      Target: {nextBestTask.topic_name}
                    </span>
                  )}
                </div>

                <h2 className="text-sm sm:text-base font-bold text-slate-100">
                  {nextBestTask ? nextBestTask.title : recommendedTest?.title}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {nextBestTask ? nextBestTask.reason : recommendedTest?.rationale}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center md:self-center">
              {nextBestTask ? (
                <button
                  type="button"
                  onClick={() => {
                    if (nextBestTask.topic_id) {
                      onSelectTopic(nextBestTask.topic_id);
                    }
                    onNavigate(nextBestTask.mode as NavTab);
                  }}
                  className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md transition-all duration-150 hover:-translate-y-0.5 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span>Execute Directive</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              ) : recommendedTest ? (
                <button
                  type="button"
                  onClick={() => onNavigate('mcq_test')}
                  className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md transition-all duration-150 hover:-translate-y-0.5 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span>Launch Diagnostic Probe</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 4. Physical Reasoning Capability Vectors (User's Adaptive State) */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0e16] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold font-sans tracking-wide text-slate-100 uppercase">
                Physical Reasoning Capability Vectors
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Evaluates first-principles deduction, causal step precision, directional causality, and boundary sensitivity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('user_model')}
            className="text-xs font-mono text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Full Reasoning Model</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-4">
          {reasoningVectors.map((vec) => {
            const Icon = vec.icon;
            return (
              <div
                key={vec.id}
                className="p-3 rounded-lg bg-[#101420] border border-white/[0.08] hover:border-sky-500/30 transition-all duration-150 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
                      {vec.title}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-xl font-black font-mono ${vec.calibration.colorClass}`}>
                      {vec.value != null ? `${vec.value}%` : '--'}
                    </span>
                    <Badge variant={vec.calibration.variant} size="xs">
                      {vec.calibration.label}
                    </Badge>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-snug">
                    {vec.description}
                  </p>
                </div>

                <div className="pt-1">
                  <ProgressBar
                    value={vec.value || 0}
                    variant={vec.calibration.barVariant}
                    size="xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Split Command Grid: Topic Progression & Active Misconceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topic Mechanistic Mastery Matrix (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#0c0e16] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold font-sans text-slate-100 uppercase tracking-wide">
                Topic Mechanistic Progression
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('user_model')}
              className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topics.slice(0, 5).map((topic) => {
              const data = mastery[topic.id] || {
                mastery_percentage: null,
                status: 'Unassessed',
                last_practiced: 'Not practiced',
              };

              const percentage = data.mastery_percentage ?? 0;

              return (
                <div
                  key={topic.id}
                  className="p-3.5 rounded-lg bg-[#101420] border border-white/[0.07] hover:border-white/[0.12] transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-100 truncate">
                        {topic.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#090b10] text-slate-400 border border-white/[0.06] shrink-0">
                        {topic.chapter}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getProgressionBadge(data.status)}
                      <span className="text-[11px] font-mono text-slate-400">
                        {data.mastery_percentage != null
                          ? `${data.mastery_percentage}% Consolidated`
                          : 'Pending Assessment'}
                      </span>
                    </div>

                    {data.mastery_percentage != null && (
                      <div className="max-w-xs pt-0.5">
                        <ProgressBar
                          value={percentage}
                          size="xs"
                          variant={
                            percentage >= 75
                              ? 'success'
                              : percentage >= 50
                              ? 'blue'
                              : percentage >= 30
                              ? 'violet'
                              : 'warning'
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTopic(topic.id);
                        onNavigate('mcq_test');
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded bg-sky-950/50 text-sky-300 border border-sky-800/50 hover:bg-sky-900/60 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                    >
                      Probe Concept
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTopic(topic.id);
                        onNavigate('doubt_chat');
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-white/[0.08] bg-[#0c0e16] hover:bg-[#151c2e] hover:border-white/[0.14] text-slate-300 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                    >
                      Doubt Dialogue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Misconceptions & Cross-Domain Transfer (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#0c0e16] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold font-sans text-slate-100 uppercase tracking-wide">
                Physical Misconceptions
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {activeErrors.length} Under Remediation
            </span>
          </div>

          <div className="space-y-3">
            {activeErrors.length === 0 ? (
              <div className="p-5 rounded-lg border border-dashed border-white/[0.08] bg-[#090b10] text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-200 font-medium">
                  Zero active cognitive inversions flagged.
                </p>
                <p className="text-[11px] text-slate-400">
                  Adaptive probes actively monitor your causal explanations for subtle directionality errors.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('mcq_test')}
                  className="px-3 py-1.5 rounded bg-sky-950/50 border border-sky-800/50 text-sky-300 text-xs font-semibold hover:bg-sky-900/60 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                >
                  Run Diagnostic Probe
                </button>
              </div>
            ) : (
              activeErrors.slice(0, 3).map((err) => (
                <div
                  key={err.id}
                  className="p-3.5 rounded-lg bg-[#101420] border border-white/[0.07] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {err.name}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#090b10] text-sky-300 border border-sky-900/40">
                      {err.stage != null ? `Remediation Stage ${err.stage}/7` : 'Remediation Stage --'}
                    </span>
                  </div>

                  <p className="text-slate-400 leading-relaxed text-[11px] italic bg-[#090b10] p-2 rounded border border-white/[0.05]">
                    "{err.current_hypothesis}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                    <span className="truncate max-w-[180px]">
                      Trigger: {err.trigger_conditions.split(',')[0]}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('mcq_test')}
                      className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span>Targeted Probe</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cross-Domain Disguised Transfer Queue */}
          {pendingTransferErrors.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="p-3.5 rounded-lg border border-indigo-900/50 bg-[#101420] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span>Deep Transfer Queue ({pendingTransferErrors.length})</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Physical principle for <span className="text-slate-200 font-medium">{pendingTransferErrors[0].name}</span> resolved in primary domain. Preparing disguised cross-domain scenario to verify true invariant transfer.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('mcq_test')}
                  className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all duration-150 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>Launch Transfer Probe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

