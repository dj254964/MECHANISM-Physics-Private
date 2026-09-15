import React, { useState, useEffect } from 'react';
import { UserModel, HierarchicalReasoningError, EvolutionLogEntry, ReasoningErrorStatus } from '../types';
import {
  Brain,
  Target,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BarChart3,
  Layers,
  Sparkles,
  ArrowRight,
  Compass,
  Zap,
  Activity,
  ChevronRight,
  RefreshCw,
  GitBranch,
  Gauge,
  HelpCircle,
  Eye,
  Microscope,
  ShieldAlert,
  ArrowUpRight,
  Radio,
  Sliders,
  Check,
  AlertOctagon,
  FileText,
  Edit3,
  X,
  Lock,
  Scale,
  CheckCircle,
  HelpCircle as QuestionIcon,
} from 'lucide-react';
import { NavTab } from '../components/Navigation';

interface PersonalModelPageProps {
  userModel: UserModel | null;
  onNavigate?: (tab: NavTab) => void;
  onRefreshUserModel?: () => void;
}

/**
 * MECHANISM Cognitive State Configuration
 * Pure noir/obsidian palette with electric cyan, blue, violet, amber, and rose accents.
 */
export interface CognitiveStateConfig {
  label: string;
  badge: string;
  dot: string;
  bar: string;
  glowBorder: string;
  category: 'strong' | 'progression' | 'uncertainty' | 'unstable' | 'unassessed';
  semanticNote: string;
}

export function getCognitiveState(state: string | undefined): CognitiveStateConfig {
  switch (state) {
    case 'Strong':
    case 'Well-calibrated':
      return {
        label: state,
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
        bar: 'bg-emerald-500',
        glowBorder: 'border-emerald-800/40',
        category: 'strong',
        semanticNote: 'Validated physical invariance across multiple perturbations and transfer scenarios.',
      };
    case 'Stable':
      return {
        label: 'Stable',
        badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
        dot: 'bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]',
        bar: 'bg-cyan-500',
        glowBorder: 'border-cyan-800/40',
        category: 'progression',
        semanticNote: 'Consistent causal sequencing under routine diagnostic constraints.',
      };
    case 'Developing':
      return {
        label: 'Developing',
        badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
        dot: 'bg-indigo-400',
        bar: 'bg-indigo-500',
        glowBorder: 'border-indigo-800/40',
        category: 'progression',
        semanticNote: 'Active learning curve; undergoing iterative countermeasure refinement.',
      };
    case 'Emerging':
      return {
        label: 'Emerging',
        badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
        dot: 'bg-amber-400 animate-pulse',
        bar: 'bg-amber-500',
        glowBorder: 'border-amber-800/40',
        category: 'uncertainty',
        semanticNote: 'Preliminary heuristic pattern detected; awaiting falsification samples.',
      };
    case 'Pending':
      return {
        label: 'Pending',
        badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
        dot: 'bg-amber-400 animate-pulse',
        bar: 'bg-amber-500',
        glowBorder: 'border-amber-800/40',
        category: 'uncertainty',
        semanticNote: 'Awaiting cross-domain disguised transfer validation.',
      };
    case 'Unstable':
      return {
        label: 'Unstable',
        badge: 'bg-rose-950/80 text-rose-300 border-rose-800/70',
        dot: 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse',
        bar: 'bg-rose-500',
        glowBorder: 'border-rose-800/60',
        category: 'unstable',
        semanticNote: 'Directionality collapse or persistent confounding trap under perturbation.',
      };
    case 'Unassessed':
    default:
      return {
        label: state || 'Unassessed',
        badge: 'bg-[#101420] text-slate-400 border-slate-800',
        dot: 'bg-slate-600',
        bar: 'bg-slate-700',
        glowBorder: 'border-slate-800/60',
        category: 'unassessed',
        semanticNote: 'Zero diagnostic observations logged in this reasoning domain.',
      };
  }
}

// User-Reported Perspective Interface
interface LearnerPerspective {
  stated_first_principles_comfort: 'High' | 'Moderate' | 'Developing' | 'Unsure';
  stated_directionality_confidence: 'High' | 'Moderate' | 'Developing' | 'Unsure';
  stated_boundary_awareness: 'High' | 'Moderate' | 'Developing' | 'Unsure';
  stated_known_intuitive_bias: string;
  last_updated: string;
}

const DEFAULT_PERSPECTIVE: LearnerPerspective = {
  stated_first_principles_comfort: 'Moderate',
  stated_directionality_confidence: 'Moderate',
  stated_boundary_awareness: 'Developing',
  stated_known_intuitive_bias: 'Tendency to assume linear scaling near saturation boundaries.',
  last_updated: new Date().toISOString(),
};

export const PersonalModelPage: React.FC<PersonalModelPageProps> = ({
  userModel,
  onNavigate,
  onRefreshUserModel,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'unstable' | 'repaired' | 'transfer'>('all');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditingPerspective, setIsEditingPerspective] = useState(false);

  // Local storage for learner's self-reported perspective
  const [perspective, setPerspective] = useState<LearnerPerspective>(DEFAULT_PERSPECTIVE);
  const [tempPerspective, setTempPerspective] = useState<LearnerPerspective>(DEFAULT_PERSPECTIVE);

  useEffect(() => {
    if (userModel?.user_id) {
      try {
        const stored = localStorage.getItem(`mechanism_perspective_${userModel.user_id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPerspective(parsed);
          setTempPerspective(parsed);
        }
      } catch (e) {
        // Fallback to default
      }
    }
  }, [userModel?.user_id]);

  const handleSavePerspective = () => {
    const updated = {
      ...tempPerspective,
      last_updated: new Date().toISOString(),
    };
    setPerspective(updated);
    if (userModel?.user_id) {
      localStorage.setItem(`mechanism_perspective_${userModel.user_id}`, JSON.stringify(updated));
    }
    setIsEditingPerspective(false);
  };

  const executeReset = async () => {
    try {
      setIsResetting(true);
      await fetch('/api/user-model/reset', { method: 'POST' });
      if (onRefreshUserModel) {
        onRefreshUserModel();
      }
      setShowResetConfirm(false);
    } catch (err) {
      console.error('Failed to reset user model', err);
    } finally {
      setIsResetting(false);
    }
  };

  if (!userModel) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm max-w-lg mx-auto space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
        <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Synthesizing Learner Cognitive State...
        </p>
      </div>
    );
  }

  const profile = userModel.reasoning_profile;
  const calibration = userModel.confidence_calibration;
  const cognitive = userModel.cognitive_resource_allocation;
  const hierarchicalErrors: HierarchicalReasoningError[] = userModel.hierarchical_errors || [];
  const evolutionLog: EvolutionLogEntry[] = userModel.evolution_log || [];
  const recommendedTest = userModel.recommended_test;

  // Categorize errors for analytical inspection
  const activeWeaknesses = hierarchicalErrors.filter(
    (e) => e.status === 'Emerging' || e.status === 'Developing' || e.status === 'Unstable'
  );
  const unstableWeaknesses = hierarchicalErrors.filter((e) => e.status === 'Unstable');
  const repairedWeaknesses = hierarchicalErrors.filter((e) => e.status === 'Strong' || e.status === 'Well-calibrated');
  const awaitingTransfer = hierarchicalErrors.filter((e) => e.transfer_status === 'Pending');

  const filteredErrors = hierarchicalErrors.filter((e) => {
    if (activeFilter === 'active') return e.status === 'Emerging' || e.status === 'Developing';
    if (activeFilter === 'unstable') return e.status === 'Unstable';
    if (activeFilter === 'repaired') return e.status === 'Strong' || e.status === 'Well-calibrated';
    if (activeFilter === 'transfer') return e.transfer_status === 'Pending';
    return true;
  });

  // Helper to determine status for a 0-100 metric
  const getMetricState = (val: number | null): CognitiveStateConfig => {
    if (val === null) return getCognitiveState('Unassessed');
    if (val >= 80) return getCognitiveState('Strong');
    if (val >= 65) return getCognitiveState('Stable');
    if (val >= 50) return getCognitiveState('Developing');
    if (val >= 35) return getCognitiveState('Emerging');
    return getCognitiveState('Unstable');
  };

  // Six-Axis Physics Reasoning Dimensions
  const reasoningAxes = [
    {
      id: 'directionality',
      title: 'Directionality Integrity',
      value: profile.directionality_integrity,
      description: 'Strict causal sequencing (A → B → C) without inverting physical cause and downstream response.',
      trapRisk: 'Confounding a secondary transient response with the fundamental driving mechanism.',
    },
    {
      id: 'causal_precision',
      title: 'Causal Precision',
      value: profile.causal_precision,
      description: 'Isolation of proximate dynamical potentials and force gradients rather than vague qualitative associations.',
      trapRisk: 'Accepting superficial correlational links without establishing dynamical necessity.',
    },
    {
      id: 'first_principles',
      title: 'First Principles Derivation',
      value: profile.first_principles_index,
      description: 'Ability to deduce emergent system dynamics strictly from foundational symmetries and conservation axioms.',
      trapRisk: 'Brittle reliance on memorized formulas rather than axiomatic physical derivation.',
    },
    {
      id: 'discriminator_acuity',
      title: 'Discriminator Acuity',
      value: profile.discriminator_acuity,
      description: 'Identification of the decisive boundary variable or measurement that differentiates rival physical models.',
      trapRisk: 'Premature closure: selecting a theoretical model before ruling out competing counter-hypotheses.',
    },
    {
      id: 'exception_awareness',
      title: 'Boundary & Limit Handling',
      value: profile.exception_awareness,
      description: 'Recognition of asymptotic regimes, non-linear saturation thresholds, and perturbation breakdowns.',
      trapRisk: 'Assuming linear responses inside non-linear physical feedback loops.',
    },
    {
      id: 'anti_overanalysis',
      title: 'Physical Decision Economy',
      value: profile.anti_overanalysis_score,
      description: 'Pacing economy and decisive model selection once measurement criteria satisfy information threshold.',
      trapRisk: 'Cognitive dithering: collecting redundant measurements when the discriminator is already satisfied.',
    },
  ];

  // Helper to calculate Claim Validation Status between User Prior and Observed Empirical Data
  const getClaimValidation = (
    claimed: 'High' | 'Moderate' | 'Developing' | 'Unsure',
    observedScore: number | null
  ): { status: string; badge: string; note: string } => {
    if (observedScore === null) {
      return {
        status: 'Unassessed by Evidence',
        badge: 'bg-[#101420] text-slate-400 border-slate-800',
        note: 'No diagnostic evidence has tested this self-reported prior yet.',
      };
    }

    const claimedTier = claimed === 'High' ? 80 : claimed === 'Moderate' ? 65 : claimed === 'Developing' ? 50 : 30;
    const diff = observedScore - claimedTier;

    if (Math.abs(diff) <= 15) {
      return {
        status: 'Empirically Aligned',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
        note: `Self-assessment aligns with observed performance (${observedScore}% fidelity).`,
      };
    } else if (diff < -15) {
      return {
        status: 'Divergence: Overestimated',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
        note: `Self-reported confidence exceeds observed diagnostic accuracy (${observedScore}% fidelity).`,
      };
    } else {
      return {
        status: 'Divergence: Underestimated',
        badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
        note: `Observed performance (${observedScore}% fidelity) surpasses stated subjective comfort.`,
      };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16 font-sans text-slate-200">
      {/* ========================================================= */}
      {/* 1. TOP OBSERVATORY HEADER & ENGINE TELEMETRY BAR          */}
      {/* ========================================================= */}
      <div className="p-6 md:p-7 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-2xl space-y-5 relative overflow-hidden">
        {/* Subtle background ambient gradients */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                LEARNER INTELLIGENCE OBSERVATORY
              </span>
              <span className="text-xs font-mono text-slate-400">
                • Continuous Mental Model Tracker
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Brain className="w-7 h-7 text-cyan-400 shrink-0" />
              <span>Personal Cognitive Architecture</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              This observatory displays MECHANISM’s live representation of your physical reasoning capabilities, tracks calibration alignment between subjective confidence and empirical truth, and schedules targeted falsification probes.
            </p>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setTempPerspective(perspective);
                setIsEditingPerspective(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#101420] hover:bg-[#151a2b] text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Your Perspective</span>
            </button>

            {recommendedTest && onNavigate && (
              <button
                onClick={() => onNavigate('mcq_test')}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-1.5 border border-cyan-400/40 hover:scale-[1.01]"
              >
                <Target className="w-4 h-4 text-slate-950" />
                <span>Execute Diagnostic Probe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Engine Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400" />
              Observatory State
            </span>
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {unstableWeaknesses.length > 0 ? 'Falsification Active' : 'Calibrating Model'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" />
              Tracked Model Vulnerabilities
            </span>
            <div className="font-bold text-slate-100 text-xs">
              <span className="text-rose-400">{unstableWeaknesses.length} unstable</span>
              <span className="text-slate-400"> / </span>
              <span className="text-amber-400">{activeWeaknesses.length} active</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-amber-400" />
              Transfer Probes
            </span>
            <div className="font-bold text-slate-100 text-xs">
              {awaitingTransfer.length} awaiting cross-domain test
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              Model Synchronization
            </span>
            <div className="font-bold text-slate-100 text-xs truncate">
              {userModel.updated_at ? new Date(userModel.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live continuous'}
            </div>
          </div>
        </div>

        {/* Priority Adaptive Recommendation Banner */}
        {recommendedTest && (
          <div className="p-4 rounded-lg bg-[#07080C] border border-cyan-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-mono font-bold text-cyan-300 uppercase text-[10px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Adaptive Priority Task: {recommendedTest.title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {recommendedTest.rationale}
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('mcq_test')}
                className="shrink-0 px-3.5 py-1.5 rounded-md bg-cyan-950/80 text-cyan-300 font-mono font-bold border border-cyan-700/60 hover:bg-cyan-900/80 text-xs transition-colors flex items-center gap-1.5 self-start md:self-center"
              >
                <span>Launch Challenge</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. EPISTEMIC LEDGER: OBSERVED VS STATED VS VALIDATION      */}
      {/* ========================================================= */}
      <div className="p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>EPISTEMIC ALIGNMENT LEDGER</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Observed Evidence vs. Stated Perspective
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Differentiates empirical data from self-reported priors
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          MECHANISM never treats subjective self-reports as verified ground truth. Self-perceptions are logged as prior hypotheses and continuously tested against empirical diagnostic trials.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Dimension 1: First Principles Comfort */}
          {(() => {
            const validation = getClaimValidation(
              perspective.stated_first_principles_comfort,
              profile.first_principles_index
            );
            return (
              <div className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">First Principles Derivation</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${validation.badge}`}>
                    {validation.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Microscope className="w-3 h-3 text-cyan-400" />
                      Observed by Engine:
                    </span>
                    <span className="font-bold text-white">
                      {profile.first_principles_index !== null ? `${profile.first_principles_index}% Fidelity` : 'Unassessed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-indigo-400" />
                      Stated by Learner:
                    </span>
                    <span className="text-indigo-300 font-semibold">{perspective.stated_first_principles_comfort} Comfort</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
                  {validation.note}
                </p>
              </div>
            );
          })()}

          {/* Dimension 2: Directionality Integrity */}
          {(() => {
            const validation = getClaimValidation(
              perspective.stated_directionality_confidence,
              profile.directionality_integrity
            );
            return (
              <div className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Directionality Integrity</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${validation.badge}`}>
                    {validation.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Microscope className="w-3 h-3 text-cyan-400" />
                      Observed by Engine:
                    </span>
                    <span className="font-bold text-white">
                      {profile.directionality_integrity !== null ? `${profile.directionality_integrity}% Fidelity` : 'Unassessed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-indigo-400" />
                      Stated by Learner:
                    </span>
                    <span className="text-indigo-300 font-semibold">{perspective.stated_directionality_confidence} Confidence</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
                  {validation.note}
                </p>
              </div>
            );
          })()}

          {/* Dimension 3: Boundary & Limit Awareness */}
          {(() => {
            const validation = getClaimValidation(
              perspective.stated_boundary_awareness,
              profile.exception_awareness
            );
            return (
              <div className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Boundary & Limit Handling</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${validation.badge}`}>
                    {validation.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Microscope className="w-3 h-3 text-cyan-400" />
                      Observed by Engine:
                    </span>
                    <span className="font-bold text-white">
                      {profile.exception_awareness !== null ? `${profile.exception_awareness}% Fidelity` : 'Unassessed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-indigo-400" />
                      Stated by Learner:
                    </span>
                    <span className="text-indigo-300 font-semibold">{perspective.stated_boundary_awareness} Awareness</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
                  {validation.note}
                </p>
              </div>
            );
          })()}
        </div>

        {/* User Stated Intuitive Bias Note */}
        <div className="p-3.5 rounded-lg bg-[#07080C] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-slate-400">Self-Stated Heuristic Vulnerability:</span>
            <span className="text-slate-300 italic font-sans font-normal">"{perspective.stated_known_intuitive_bias}"</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">
            Updated {new Date(perspective.last_updated).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. REASONING FACULTIES & PHYSICAL INVARIANCE PROFILE      */}
      {/* ========================================================= */}
      <div className="p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5" />
              <span>PHYSICAL REASONING FACULTIES</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Mechanistic Reasoning Profile & Invariance
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            6 core physics capabilities estimated from multi-step challenges
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reasoningAxes.map((axis) => {
            const state = getMetricState(axis.value);
            const valStr = axis.value !== null ? `${axis.value}%` : '--';

            return (
              <div
                key={axis.id}
                className={`p-4 rounded-lg bg-[#07080C] border ${state.glowBorder} flex flex-col justify-between space-y-3.5 transition-all hover:bg-[#0e1220]`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white leading-tight">
                      {axis.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${state.badge}`}>
                      {state.label}
                    </span>
                  </div>

                  {/* Quantitative Gauge Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Observed Fidelity:</span>
                      <span className="font-bold text-slate-100">{valStr}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${state.bar}`}
                        style={{ width: `${axis.value !== null ? axis.value : 0}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {axis.description}
                  </p>
                </div>

                {/* Analytical Risk Note */}
                <div className="pt-2.5 border-t border-slate-800/80 text-[10px] font-mono space-y-0.5">
                  <span className="text-slate-400 uppercase tracking-wider block">Vulnerability Trap:</span>
                  <span className="text-slate-300 italic font-sans font-normal">{axis.trapRisk}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. METACOGNITIVE CALIBRATION & EPISTEMIC UNCERTAINTY      */}
      {/* ========================================================= */}
      <div className="p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>METACOGNITIVE CALIBRATION</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Confidence, Bias & Epistemic Uncertainty
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Divergence between subjective certainty and physical truth
          </span>
        </div>

        {/* 3 Overview Diagnostic Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Brier Score */}
          <div className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400">
              <span>Brier Calibration Index</span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-cyan-300">
                {calibration.brier_score !== null ? calibration.brier_score : '--'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">(0.00 = perfect calibration)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Mathematical scoring rule measuring deviation between stated probability distribution and actual physical outcomes.
            </p>
          </div>

          {/* Overconfidence Bias */}
          <div className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400">
              <span>Overconfidence Bias</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${calibration.overconfidence_bias && calibration.overconfidence_bias > 15 ? 'text-rose-400' : 'text-amber-300'}`}>
                {calibration.overconfidence_bias !== null ? `+${calibration.overconfidence_bias}%` : '--'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">divergence</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Excess subjective certainty logged on high-plausibility distractor traps and intuitive heuristics.
            </p>
          </div>

          {/* Decision Latency & Resource Allocation */}
          <div className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400">
              <span>Decision Commitment</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-indigo-300">
                {cognitive.average_time_per_decision_sec !== null ? `${cognitive.average_time_per_decision_sec}s` : '--'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">avg / decision</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Efficiency status: <span className="font-semibold text-slate-200">{cognitive.decision_commit_efficiency || 'Baseline'}</span>. {cognitive.overanalysis_flags_count || 0} surplus measurement stalls flagged.
            </p>
          </div>
        </div>

        {/* Confidence Calibration Curve Breakdown */}
        <div className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase font-mono">
                Empirical Calibration Curve (Stated vs Actual)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Target: Predicted % == Actual %
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#101420] text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Subjective Confidence</th>
                  <th className="p-2.5">Observed Accuracy</th>
                  <th className="p-2.5">Variance / Drift</th>
                  <th className="p-2.5">Calibration Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {!calibration.calibration_curve || calibration.calibration_curve.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                      Zero confidence calibration data logged yet. Take tests with confidence ratings to generate your empirical calibration curve.
                    </td>
                  </tr>
                ) : (
                  calibration.calibration_curve.map((c, idx) => {
                    const diff = c.predicted_confidence - c.actual_accuracy;
                    const isCalibrated = Math.abs(diff) <= 10;
                    const isSevere = Math.abs(diff) > 25;
                    const state = isCalibrated
                      ? getCognitiveState('Well-calibrated')
                      : isSevere
                      ? getCognitiveState('Unstable')
                      : getCognitiveState('Emerging');

                    return (
                      <tr key={idx} className="hover:bg-[#121828]/60 transition-colors">
                        <td className="p-2.5 font-bold text-slate-200">
                          {c.predicted_confidence}%
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {c.actual_accuracy}%
                        </td>
                        <td className="p-2.5">
                          <span className={diff > 0 ? 'text-amber-400' : 'text-slate-400'}>
                            {diff > 0 ? `+${diff}% (Overconfident)` : `${diff}% (Aligned)`}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${state.badge}`}>
                            {isCalibrated ? 'Well-Calibrated' : isSevere ? 'Severe Gap' : 'Emerging Divergence'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. HIERARCHICAL REASONING ERROR REGISTRY                  */}
      {/* ========================================================= */}
      <div className="p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>MENTAL MODEL VULNERABILITIES</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Hierarchical Reasoning Error Registry</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active mental model bugs tracked through 7 discrete stages of diagnostic falsification and repair.
            </p>
          </div>

          {/* Structured State Filters */}
          <div className="flex items-center gap-1 text-xs font-mono flex-wrap">
            {[
              { id: 'all', label: `All (${hierarchicalErrors.length})` },
              { id: 'active', label: `Active (${activeWeaknesses.length})` },
              { id: 'unstable', label: `Unstable (${unstableWeaknesses.length})` },
              { id: 'transfer', label: `Pending Transfer (${awaitingTransfer.length})` },
              { id: 'repaired', label: `Repaired (${repairedWeaknesses.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeFilter === f.id
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'bg-[#07080C] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Cards Dossier */}
        <div className="space-y-3.5">
          {filteredErrors.length === 0 ? (
            <div className="p-8 rounded-lg bg-[#07080C] border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="font-semibold text-slate-200">No reasoning errors match this filter category.</p>
              <p className="text-[11px] text-slate-400">All registered mental models in this slice are currently verified stable.</p>
            </div>
          ) : (
            filteredErrors.map((err) => {
              const state = getCognitiveState(err.status);
              const transferState = getCognitiveState(err.transfer_status === 'Defeated' ? 'Strong' : err.transfer_status === 'Pending' ? 'Pending' : 'Stable');

              return (
                <div
                  key={err.id}
                  className={`p-4 md:p-5 rounded-lg bg-[#07080C] border ${state.glowBorder} space-y-3.5 transition-all hover:border-slate-700`}
                >
                  {/* Top Row: Name, Family, Status Badge, Stage */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{err.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {err.reasoning_family}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          • {err.domain}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        <span className="font-mono text-[10px] uppercase text-slate-400">Activates on: </span>
                        <span className="text-slate-300 italic font-sans font-normal">{err.trigger_conditions}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border flex items-center gap-1.5 ${state.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${state.dot}`} />
                        {state.label}
                      </span>
                      <div className="px-2.5 py-1 rounded-md bg-[#101420] border border-slate-800 text-[11px] font-mono text-slate-300">
                        {err.stage !== null ? `Stage ${err.stage}/7` : 'Stage --'}
                      </div>
                    </div>
                  </div>

                  {/* 7-Stage Diagnostic Progress Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3 h-3 text-cyan-400" />
                        7-Stage Diagnostic Falsification Pipeline
                      </span>
                      <span>
                        Model Confidence in Bug: {err.model_confidence !== null ? `${(err.model_confidence * 100).toFixed(0)}%` : '--'}
                      </span>
                    </div>

                    {/* Visual 7-step segment track */}
                    <div className="grid grid-cols-7 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((s) => {
                        const isReached = err.stage !== null && s <= err.stage;
                        const isCurrent = err.stage !== null && s === err.stage;
                        return (
                          <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${
                              isCurrent
                                ? state.bar
                                : isReached
                                ? 'bg-slate-700'
                                : 'bg-slate-850'
                            }`}
                            title={`Stage ${s}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Engine's Working Hypothesis */}
                  <div className="p-3 rounded-md bg-[#101420] border border-slate-800 text-xs space-y-1">
                    <div className="font-mono uppercase text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Adaptive Engine’s Working Hypothesis:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans">
                      {err.current_hypothesis}
                    </p>
                  </div>

                  {/* Next Diagnostic Probe & Transfer Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-slate-850">
                    <div className="space-y-0.5 max-w-lg">
                      <span className="font-mono text-[10px] uppercase text-slate-400 flex items-center gap-1">
                        <Target className="w-3 h-3 text-cyan-400" />
                        Next Precision Diagnostic Probe:
                      </span>
                      <div className="text-slate-200 font-medium text-xs font-sans">
                        {err.next_diagnostic_test}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono text-xs">
                        <span className="text-[10px] uppercase text-slate-400 block">Transfer Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${transferState.badge}`}>
                          {err.transfer_status}
                        </span>
                      </div>

                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('mcq_test')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow"
                        >
                          <span>Test Vulnerability</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. CONTINUOUS HYPOTHESIS EVOLUTION LOG                    */}
      {/* ========================================================= */}
      <div className="p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>EMPIRICAL AUDIT TRAIL</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Continuous Hypothesis Evolution Log
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Immutable log of how empirical evidence mutated the learner model
          </span>
        </div>

        {evolutionLog.length === 0 ? (
          <div className="p-8 rounded-lg bg-[#07080C] border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-2">
            <Activity className="w-6 h-6 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-200">No hypothesis evolution entries logged yet.</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              As you solve diagnostic questions, run adversarial stress tests, and complete close-book reconstructions, empirical evidence triggers hypothesis refinements here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {evolutionLog.map((log, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-[#07080C] border border-slate-800 space-y-2 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] border-b border-slate-800/80 pb-2">
                  <span className="font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    TRIGGER: {log.trigger_event}
                  </span>
                  <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="font-mono uppercase text-[10px] text-slate-400 block">Prior Hypothesis:</span>
                    <p className="text-slate-400 italic font-sans bg-[#101420] p-2.5 rounded border border-slate-850">
                      "{log.old_hypothesis}"
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono uppercase text-[10px] text-amber-400 font-semibold block">New Empirical Evidence:</span>
                    <p className="text-amber-200/90 font-medium font-sans bg-[#101420] p-2.5 rounded border border-amber-950/40">
                      "{log.new_evidence}"
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono uppercase text-[10px] text-emerald-400 font-semibold block">Revised Model Hypothesis:</span>
                    <p className="text-emerald-200/90 font-medium font-sans bg-[#101420] p-2.5 rounded border border-emerald-950/40">
                      "{log.revised_hypothesis}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 7. DESTRUCTIVE OPERATIONS / BASELINE MAINTENANCE ZONE     */}
      {/* ========================================================= */}
      <div className="p-6 rounded-xl border border-rose-950/80 bg-[#07080C] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono uppercase font-bold tracking-wider">
              <AlertOctagon className="w-4 h-4" />
              <span>Quarantined Maintenance • Destructive Action</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Reset Cognitive Profile to Unassessed Baseline
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Purges all recorded question attempts, confidence ratings, and empirical evidence from the local database. All reasoning faculties and calibration indices will revert to clean unassessed baselines (<code className="text-slate-300 font-mono">--</code>).
            </p>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting}
            className="shrink-0 px-4 py-2.5 rounded-lg border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Profile Baseline</span>
          </button>
        </div>

        {/* Confirmation Modal Safeguard */}
        {showResetConfirm && (
          <div className="p-4 rounded-lg bg-rose-950/50 border border-rose-800 text-xs space-y-3">
            <div className="flex items-start gap-2.5 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Are you sure you want to reset your personal cognitive model?</p>
                <p className="text-rose-300/80 mt-1">
                  This cannot be undone. All diagnostic history, evidence units, and 7-stage error progressions will be permanently cleared.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 justify-end pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-3 py-1.5 rounded-md bg-[#101420] border border-slate-700 text-slate-300 hover:bg-slate-800 font-mono text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeReset}
                disabled={isResetting}
                className="px-3.5 py-1.5 rounded-md bg-rose-700 hover:bg-rose-600 text-white font-mono font-bold text-xs flex items-center gap-1.5"
              >
                {isResetting && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Confirm & Reset Model</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 8. EDIT PERSPECTIVE MODAL / DRAWER                        */}
      {/* ========================================================= */}
      {isEditingPerspective && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0E16] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Edit Your Self-Reported Prior Perspective</h3>
              </div>
              <button
                onClick={() => setIsEditingPerspective(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                State your subjective priors regarding your physical reasoning comfort. The engine logs these as hypotheses to be tested against empirical diagnostic trials.
              </p>

              {/* First Principles Comfort */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Self-Assessed First Principles Derivation Comfort:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['High', 'Moderate', 'Developing', 'Unsure'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setTempPerspective({ ...tempPerspective, stated_first_principles_comfort: level })}
                      className={`py-1.5 rounded-md border text-center transition-all ${
                        tempPerspective.stated_first_principles_comfort === level
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                          : 'bg-[#07080C] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directionality Confidence */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Self-Assessed Directionality & Causal Integrity:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['High', 'Moderate', 'Developing', 'Unsure'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setTempPerspective({ ...tempPerspective, stated_directionality_confidence: level })}
                      className={`py-1.5 rounded-md border text-center transition-all ${
                        tempPerspective.stated_directionality_confidence === level
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                          : 'bg-[#07080C] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boundary Awareness */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Self-Assessed Boundary & Non-Linear Limit Handling:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['High', 'Moderate', 'Developing', 'Unsure'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setTempPerspective({ ...tempPerspective, stated_boundary_awareness: level })}
                      className={`py-1.5 rounded-md border text-center transition-all ${
                        tempPerspective.stated_boundary_awareness === level
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                          : 'bg-[#07080C] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intuitive Trap Description */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Known Intuitive Bias or Trap to Watch For:
                </label>
                <input
                  type="text"
                  value={tempPerspective.stated_known_intuitive_bias}
                  onChange={(e) => setTempPerspective({ ...tempPerspective, stated_known_intuitive_bias: e.target.value })}
                  placeholder="e.g. Tendency to rely on formulas without checking boundary conditions"
                  className="w-full px-3 py-2 rounded-lg bg-[#07080C] border border-slate-800 text-slate-200 text-xs font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingPerspective(false)}
                className="px-3.5 py-1.5 rounded-md bg-[#101420] text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePerspective}
                className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors shadow"
              >
                Save Perspective
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
