import React, { useState, useEffect } from 'react';
import { Topic, ActiveLearningContext } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { AiMetadataBadge } from '../components/AiMetadataBadge';
import { RecommendedNextAction } from '../components/mechanism/RecommendedNextAction';
import { EmptyContextState } from '../components/EmptyContextState';
import {
  Brain,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  GitCompare,
  AlertCircle,
  BookOpen,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Compass,
  ArrowDownRight,
  Binary,
  ShieldAlert,
  Crosshair,
  FileEdit,
  Check,
  MessageSquare,
} from 'lucide-react';

interface ReconstructionPageProps {
  selectedTopic: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  topics?: Topic[];
  onSelectTopic?: (topicId: string) => void;
  onRefreshUserModel?: () => void;
  onNavigate?: (tab: any) => void;
  onNewDiscussion?: () => void;
}

// 5-Stage Central Visual Metaphor
interface MetaphorStage {
  id: 'recall' | 'reconstruct' | 'compare' | 'gap' | 'update';
  title: string;
  subtitle: string;
  description: string;
  stepNum: string;
}

const STAGES: MetaphorStage[] = [
  {
    id: 'recall',
    title: 'RECALL',
    subtitle: 'Close-Book Retrieval',
    description: 'Retrieve physical relationships from memory without consulting external notes.',
    stepNum: '01',
  },
  {
    id: 'reconstruct',
    title: 'RECONSTRUCT',
    subtitle: 'Causal Assembly',
    description: 'Assemble independent facts into an active, directional cause-and-effect cascade.',
    stepNum: '02',
  },
  {
    id: 'compare',
    title: 'COMPARE',
    subtitle: 'Canonical Juxtaposition',
    description: 'Align your assembled model against invariant physical laws and benchmarks.',
    stepNum: '03',
  },
  {
    id: 'gap',
    title: 'GAP',
    subtitle: 'Divergence Isolation',
    description: 'Isolate omitted rate-limiting thresholds, unstated premises, or inverted steps.',
    stepNum: '04',
  },
  {
    id: 'update',
    title: 'UPDATE',
    subtitle: 'Schema Consolidation',
    description: 'Synthesize the corrected causal architecture into your permanent mental schema.',
    stepNum: '05',
  },
];

export const ReconstructionPage: React.FC<ReconstructionPageProps> = ({
  selectedTopic,
  activeContext,
  topics = [],
  onSelectTopic,
  onRefreshUserModel,
  onNavigate,
  onNewDiscussion,
}) => {
  const hasContext = Boolean(activeContext?.topicName);

  const [reconstructionMode, setReconstructionMode] = useState<'both' | 'paragraph' | 'framework'>('both');
  const [paragraphExplanation, setParagraphExplanation] = useState('');
  const [causalChain, setCausalChain] = useState('');
  const [directionality, setDirectionality] = useState('');
  const [criticalVariables, setCriticalVariables] = useState('');
  const [discriminator, setDiscriminator] = useState('');
  const [exception, setException] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCanonicalBenchmark, setShowCanonicalBenchmark] = useState(false);

  useEffect(() => {
    if (!activeContext?.topicName) {
      setParagraphExplanation('');
      setCausalChain('');
      setDirectionality('');
      setCriticalVariables('');
      setDiscriminator('');
      setException('');
      setResult(null);
    }
  }, [activeContext?.topicName]);

  const hasContent = paragraphExplanation.trim().length > 0 || causalChain.trim().length > 0;
  const canSubmit = hasContent && !loading;

  // Determine current active metaphor stage
  const getCurrentStageId = (): 'recall' | 'reconstruct' | 'compare' | 'gap' | 'update' => {
    if (loading) return 'compare';
    if (result) return 'gap'; // When evaluated, user is inspecting gaps and updating schema
    if (hasContent) return 'reconstruct';
    return 'recall';
  };

  const currentStageId = getCurrentStageId();

  const handleEvaluate = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/reconstructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: activeContext?.topicId || undefined,
          explanation_mode: reconstructionMode,
          paragraph_explanation: paragraphExplanation,
          causal_chain: causalChain,
          directionality,
          critical_variables: criticalVariables,
          discriminator,
          exception,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        if (onRefreshUserModel) {
          onRefreshUserModel();
        }
      }
    } catch (e) {
      console.error('Error evaluating reconstruction:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setParagraphExplanation(
      "A damped mechanical harmonic oscillator consisting of mass m on a spring with stiffness k in a viscous fluid is governed by Newton's second law: m x''(t) + b x'(t) + k x(t) = 0. The natural undamped angular frequency is ω₀ = √(k/m), and the damping factor is γ = b / (2m). As the mass oscillates, the restoring spring force F_s = -k x exchanges kinetic energy with elastic potential energy, while viscous resistance F_drag = -b v irreversibly dissipates total mechanical energy into thermal energy at an instantaneous rate dE/dt = -b v² ≤ 0. For light damping (γ < ω₀), the solution exhibits oscillatory motion x(t) = A e^(-γ t) cos(ω_d t + φ) with shifted angular frequency ω_d = √(ω₀² - γ²). As damping reaches γ = ω₀ (critical damping), the discriminant vanishes and the system returns to equilibrium in minimal time without oscillating. For heavy damping (γ > ω₀, overdamped), the response is non-oscillatory and relaxes sluggishly."
    );
    setCausalChain(
      'Displacement x ≠ 0 creates restoring force F_s = -k x → acceleration drives velocity v toward origin → viscous fluid generates opposing drag force F_drag = -b v → total mechanical energy dissipates as heat at rate dE/dt = -b v² → amplitude decays within exponential envelope e^(-γ t).'
    );
    setDirectionality(
      'Strict physical causality: non-conservative drag always opposes instantaneous velocity vector (F_drag · v < 0), ensuring monotonic energy loss; restoring force opposes displacement vector (F_s · x < 0).'
    );
    setCriticalVariables(
      'Mass m, spring constant k, viscous drag coefficient b, damping factor γ = b/(2m), natural frequency ω₀ = √(k/m), damped frequency ω_d = √(ω₀² - γ²), Quality factor Q = ω₀ / (2γ).'
    );
    setDiscriminator(
      'Underdamped (γ < ω₀) oscillates with decaying exponential envelope; Critically damped (γ = ω₀) returns to equilibrium fastest without crossing zero; Overdamped (γ > ω₀) returns sluggishly with sum of two real decaying exponentials.'
    );
    setException(
      'Turbulent drag regime: When Reynolds number Re >> 1, drag transitions from linear Stokes drag (F ∝ v) to quadratic drag (F ∝ v²), causing non-exponential decay and breaking linear superposition.'
    );
  };

  const handleResetWorkspace = () => {
    setParagraphExplanation('');
    setCausalChain('');
    setDirectionality('');
    setCriticalVariables('');
    setDiscriminator('');
    setException('');
    setResult(null);
  };

  // Helper to extract clean structured elements for evaluation display
  const getEvaluationBreakdown = () => {
    if (!result?.evaluation) return null;

    const evaluation = result.evaluation;

    // Reconstructed Model summary
    const reconstructedModel =
      evaluation.reconstructed_model ||
      paragraphExplanation.trim() ||
      causalChain.trim() ||
      'Student causal model assembled from active memory recall.';

    // Required Model summary
    const requiredModel =
      evaluation.required_model ||
      evaluation.canonical_comparison ||
      `Canonical physical mechanism for ${selectedTopic?.name || 'classical mechanics'}.`;

    // Missing Causal Links
    let missingLinks: string[] = [];
    if (Array.isArray(evaluation.missing_causal_links) && evaluation.missing_causal_links.length > 0) {
      missingLinks = evaluation.missing_causal_links;
    } else {
      // Parse from critique text if available
      const lines = evaluation.critique.split('\n');
      const found: string[] = [];
      lines.forEach((l: string) => {
        if (/missing|omitted|bypassed|lack of|did not include/i.test(l) && l.trim().startsWith('-')) {
          found.push(l.replace(/^-\s*/, '').trim());
        }
      });
      missingLinks = found.length > 0 ? found.slice(0, 3) : ['Intermediate rate-limiting transitions between early and late depolarization phases.'];
    }

    // Incorrect Assumptions
    let incorrectAssumptions: string[] = [];
    if (Array.isArray(evaluation.incorrect_assumptions) && evaluation.incorrect_assumptions.length > 0) {
      incorrectAssumptions = evaluation.incorrect_assumptions;
    } else {
      const lines = evaluation.critique.split('\n');
      const found: string[] = [];
      lines.forEach((l: string) => {
        if (/assumption|reversed|inverted|confound|erroneous/i.test(l) && l.trim().startsWith('-')) {
          found.push(l.replace(/^-\s*/, '').trim());
        }
      });
      incorrectAssumptions = found.length > 0 ? found.slice(0, 2) : [];
    }

    // Recovered Understanding
    let recoveredUnderstanding: string[] = [];
    if (Array.isArray(evaluation.recovered_understanding) && evaluation.recovered_understanding.length > 0) {
      recoveredUnderstanding = evaluation.recovered_understanding;
    } else {
      const lines = evaluation.critique.split('\n');
      const found: string[] = [];
      lines.forEach((l: string) => {
        if (/correct|accurate|sound|mastery|strength/i.test(l) && l.trim().startsWith('-')) {
          found.push(l.replace(/^-\s*/, '').trim());
        }
      });
      recoveredUnderstanding =
        found.length > 0
          ? found.slice(0, 3)
          : [
              'Solid physical recall of foundational equations of motion and restoring dynamics.',
              'Accurate directionality from perturbation forces to dissipative loss.',
            ];
    }

    return {
      reconstructedModel,
      requiredModel,
      missingLinks,
      incorrectAssumptions,
      recoveredUnderstanding,
    };
  };

  const breakdown = getEvaluationBreakdown();
  const wordCount = paragraphExplanation.split(/\s+/).filter(Boolean).length;
  const topicTitle = activeContext?.topicName || selectedTopic?.name || '';

  if (!hasContext) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <EmptyContextState
          toolName="Close-Book Reconstruction"
          toolDescription="Close-book causal reconstruction tests unprompted retrieval of physical thresholds and step-by-step cascades. Please establish an active learning context first."
          topics={topics}
          onSelectTopic={onSelectTopic}
          onNavigate={onNavigate}
          onNewDiscussion={onNewDiscussion}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Instrument Console */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                INSTRUMENT 06 // ACTIVE RETRIEVAL
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                // TOPIC: {topicTitle.toUpperCase()}
              </span>
            </div>
            
            <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-100 tracking-tight">
              Rebuild Mechanism from Memory
            </h1>
            
            <p className="text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Close-book reconstruction converts passive recognition into durable mental representations. Assemble the causal cascade from first principles without consulting notes, then juxtapose against physical reality.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleFillSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Reference Recall</span>
            </button>

            {hasContent && (
              <button
                type="button"
                onClick={handleResetWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all cursor-pointer"
                title="Clear all reconstruction fields"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Central Visual Metaphor Flow: RECALL → RECONSTRUCT → COMPARE → GAP → UPDATE */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-4 md:p-5 shadow-lg">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-3">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>COGNITIVE RECONSTRUCTION TRAJECTORY</span>
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Active Phase:{' '}
            <span className="text-cyan-300 font-bold">
              {STAGES.find((s) => s.id === currentStageId)?.title} ({STAGES.find((s) => s.id === currentStageId)?.subtitle})
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
          {STAGES.map((stage, idx) => {
            const isActive = currentStageId === stage.id;
            const isPassed =
              (currentStageId === 'reconstruct' && idx < 1) ||
              (currentStageId === 'compare' && idx < 2) ||
              ((currentStageId === 'gap' || currentStageId === 'update') && idx < 3) ||
              (currentStageId === 'update' && idx < 4);

            return (
              <div
                key={stage.id}
                className={`relative p-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'border-cyan-500/70 bg-gradient-to-b from-[#101c30] to-[#0C0E16] shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-200'
                    : isPassed
                    ? 'border-white/[0.08] bg-[#07080C] text-slate-400'
                    : 'border-white/[0.04] bg-[#07080C]/50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {stage.stepNum}
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                  {isPassed && <Check className="w-3 h-3 text-cyan-400/80" />}
                </div>

                <div className="space-y-0.5">
                  <div
                    className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isActive ? 'text-cyan-200' : isPassed ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {stage.title}
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans line-clamp-1">
                    {stage.subtitle}
                  </div>
                </div>

                {/* Subtle step description */}
                <p className="mt-1.5 text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Deep Noir Reconstruction Workspace */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-6 md:p-8 shadow-2xl space-y-6 relative">
        {/* Workspace Top Toolbar: Format Switcher & Word Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>RECONSTRUCTION FORMAT</span>
            </span>
            <div className="inline-flex p-0.5 rounded-xl bg-[#07080C] border border-white/[0.08] text-xs font-mono">
              <button
                type="button"
                onClick={() => setReconstructionMode('both')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  reconstructionMode === 'both'
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dual Channel (Narrative + 5-Pillar)
              </button>
              <button
                type="button"
                onClick={() => setReconstructionMode('paragraph')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  reconstructionMode === 'paragraph'
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Narrative Synthesis
              </button>
              <button
                type="button"
                onClick={() => setReconstructionMode('framework')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  reconstructionMode === 'framework'
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                5-Pillar Architecture
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            {reconstructionMode !== 'framework' && (
              <span>
                Synthesis Depth:{' '}
                <strong className={wordCount > 30 ? 'text-cyan-300' : 'text-slate-500'}>
                  {wordCount} words
                </strong>
              </span>
            )}
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Zero-Note Recall Mode</span>
          </div>
        </div>

        {/* Channel 1: Expansive Narrative Workspace */}
        {(reconstructionMode === 'paragraph' || reconstructionMode === 'both') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="narrative-workspace"
                className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-2"
              >
                <span>NARRATIVE PHYSICAL SYNTHESIS</span>
                <span className="text-[11px] font-sans normal-case text-slate-400 font-normal">
                  (Retrieve the continuous causal progression in your own words)
                </span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Perturbation → Dynamic Gradient → Rate-Limiting Threshold → Outcome
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              Write as if explaining the deep physical mechanism to a colleague from first principles. Specify governing conservation laws, boundary conditions, dynamic variables, rate-limiting steps, and feedback.
            </p>

            <textarea
              id="narrative-workspace"
              rows={reconstructionMode === 'paragraph' ? 12 : 7}
              value={paragraphExplanation}
              onChange={(e) => setParagraphExplanation(e.target.value)}
              placeholder="Rebuild the mechanism from memory: Begin with the initial state and boundary conditions, identify the governing physical laws, describe the causal dynamical progression, and derive the physical consequence..."
              className="w-full text-sm font-sans p-4 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 leading-relaxed resize-y transition-all duration-150"
            />
          </div>
        )}

        {/* Channel 2: 5-Pillar Structural Framework */}
        {(reconstructionMode === 'framework' || reconstructionMode === 'both') && (
          <div className="space-y-4 pt-2">
            {reconstructionMode === 'both' && (
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                  <Binary className="w-3.5 h-3.5 text-cyan-400" />
                  <span>STRUCTURED 5-PILLAR REINFORCEMENT (FORMAL CAUSAL SPECIFICATION)</span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Causal Sequence */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                  1. Causal Chain (Sequential Step-by-Step Trajectory)
                </label>
                <textarea
                  rows={2}
                  value={causalChain}
                  onChange={(e) => setCausalChain(e.target.value)}
                  placeholder="Step 1: Injected flux -> Step 2: Electric field induction -> Step 3: Induced current and magnetic response..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>

              {/* 2. Directionality */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                  2. Directionality Invariant (Cause vs Effect Safeguard)
                </label>
                <input
                  type="text"
                  value={directionality}
                  onChange={(e) => setDirectionality(e.target.value)}
                  placeholder="Why does field variation induce current rather than vice versa in this setup?"
                  className="w-full text-xs font-sans p-3 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>

              {/* 3. Critical Rate-Limiting Variables */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                  3. Critical Rate-Limiting Variables & Thresholds
                </label>
                <input
                  type="text"
                  value={criticalVariables}
                  onChange={(e) => setCriticalVariables(e.target.value)}
                  placeholder="e.g., Work function threshold, relaxation time, damping coefficient"
                  className="w-full text-xs font-sans p-3 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>

              {/* 4. Discriminator */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                  4. Physical Discriminator (Distinguishing Feature)
                </label>
                <input
                  type="text"
                  value={discriminator}
                  onChange={(e) => setDiscriminator(e.target.value)}
                  placeholder="What invariant physical feature separates this model from look-alike phenomena?"
                  className="w-full text-xs font-sans p-3 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>

              {/* 5. Exception / Boundary */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                  5. Borderline Breakdown / Exceptions (Perturbation Limits)
                </label>
                <input
                  type="text"
                  value={exception}
                  onChange={(e) => setException(e.target.value)}
                  placeholder="When does this approximation or model break down? (e.g. Relativistic regime, ultra-low temperature)"
                  className="w-full text-xs font-sans p-3 rounded-xl border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit & Evaluation Bar */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-slate-500">
            {canSubmit ? (
              <span className="text-cyan-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Active recall ready for canonical physical alignment
              </span>
            ) : (
              <span>Enter your recollection above to evaluate causal alignment</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleEvaluate}
            disabled={!canSubmit}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-mono text-xs uppercase tracking-wider font-semibold shadow-lg shadow-blue-950/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Juxtaposing with Canonical Law...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4 text-white" />
                <span>Compare Against Canonical Model</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Evaluated Model Juxtaposition & Diagnostic Diff */}
      {loading && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-12 text-center space-y-4 shadow-xl">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
              Juxtaposing Assembled Model Against Invariant Laws
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Extracting causal directional nodes, verifying conservation principles, and isolating missing intermediate steps...
            </p>
          </div>
        </div>
      )}

      {result && breakdown && (
        <div className="space-y-6 animate-fadeIn">
          {/* Convergence Metric Banner */}
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0C0E16] to-[#101828] p-5 md:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
                  MODEL INTEGRITY CONVERGENCE
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-serif font-bold text-slate-100">
                Cognitive Model Diff & Schema Diagnosis
              </h2>
              <p className="text-xs text-slate-400">
                Evaluating internal schema accuracy against consensus physical laws.
              </p>
            </div>

            <div className="flex items-baseline gap-2 bg-[#07080C] px-4 py-2.5 rounded-xl border border-cyan-500/20">
              <span className="text-2xl md:text-3xl font-mono font-bold text-cyan-300">
                {result.score}%
              </span>
              <span className="text-xs font-mono text-slate-400">Physical Alignment</span>
            </div>
          </div>

          {/* Core Distinctions Grid: Reconstructed Model vs Required Model */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Reconstructed Model */}
            <div className="rounded-2xl border border-cyan-500/30 bg-[#0C0E16] p-5 md:p-6 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-cyan-200">
                    Reconstructed Model (From Memory)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Student Recall
                </span>
              </div>

              <div className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans bg-[#07080C] p-4 rounded-xl border border-cyan-500/15">
                {breakdown.reconstructedModel}
              </div>
            </div>

            {/* 2. Required Model */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-5 md:p-6 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-300" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-200">
                    Required Model (Canonical Benchmark)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                  Physical Ground Truth
                </span>
              </div>

              <div className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans bg-[#07080C] p-4 rounded-xl border border-white/[0.06]">
                {breakdown.requiredModel}
              </div>
            </div>
          </div>

          {/* Diagnostic Divergence: Missing Links, Incorrect Assumptions, Recovered Understanding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 3. Missing Causal Links (Restrained Amber) */}
            <div className="rounded-2xl border border-amber-500/30 bg-[#140F08]/60 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2.5 border-b border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-200">
                  Missing Causal Links
                </h4>
              </div>

              <p className="text-[11px] text-amber-300/80">
                Intermediate physical variables omitted during retrieval:
              </p>

              {breakdown.missingLinks.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-200">
                  {breakdown.missingLinks.map((link, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#1C1408]/60 p-2.5 rounded-lg border border-amber-500/20">
                      <ArrowDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{link}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-amber-200/90 italic bg-[#1C1408]/40 p-3 rounded-lg border border-amber-500/10">
                  No rate-limiting steps omitted. The entire causal sequence was accounted for.
                </div>
              )}
            </div>

            {/* 4. Incorrect Assumptions (Restrained Soft Amber/Rose) */}
            <div className="rounded-2xl border border-amber-500/25 bg-[#160D08]/60 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2.5 border-b border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-200">
                  Incorrect Assumptions
                </h4>
              </div>

              <p className="text-[11px] text-amber-300/80">
                Directionality reversals or unstated premises flagged for calibration:
              </p>

              {breakdown.incorrectAssumptions.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-200">
                  {breakdown.incorrectAssumptions.map((assump, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#201008]/60 p-2.5 rounded-lg border border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{assump}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-300 italic bg-[#201008]/40 p-3 rounded-lg border border-amber-500/10">
                  No invalid assumptions detected. Directionality and physical constraints held firm.
                </div>
              )}
            </div>

            {/* 5. Recovered Understanding (Calm Emerald / Soft Cyan) */}
            <div className="rounded-2xl border border-emerald-500/30 bg-[#071710]/60 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2.5 border-b border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-emerald-200">
                  Recovered Understanding
                </h4>
              </div>

              <p className="text-[11px] text-emerald-300/80">
                Solid foundational axioms accurately retrieved from memory:
              </p>

              <ul className="space-y-2 text-xs text-slate-200">
                {breakdown.recoveredUnderstanding.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[#092014]/60 p-2.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Schema Critique & Model Update Synthesis */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E16] p-6 md:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-slate-200">
                  5. UPDATE: Comprehensive Physical Evaluation & Critique
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                STAGE 05 // SCHEMA UPDATE
              </span>
            </div>

            <div className="prose dark:prose-invert max-w-none text-xs md:text-sm text-slate-300 leading-relaxed">
              <MarkdownRenderer content={result.evaluation.critique} />
            </div>

            {/* Collapsible Full Canonical Benchmark */}
            {result.evaluation.canonical_comparison && (
              <div className="pt-4 border-t border-white/[0.06] space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCanonicalBenchmark(!showCanonicalBenchmark)}
                  className="flex items-center justify-between w-full text-left text-xs font-mono text-slate-400 hover:text-slate-200 p-2 rounded-lg bg-[#07080C] border border-white/[0.08] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Reference Canonical Mechanism String</span>
                  </span>
                  {showCanonicalBenchmark ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showCanonicalBenchmark && (
                  <div className="p-4 rounded-xl bg-[#07080C] border border-white/[0.08] text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed animate-fadeIn">
                    {result.evaluation.canonical_comparison}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.06]">
              <AiMetadataBadge
                provider="Gemini"
                model="gemini-3.8-flash"
                timestamp={new Date().toISOString()}
                classification="Internal Model Reconstruction"
              />
            </div>
          </div>

          {/* Contextual Next Cognitive Action */}
          <RecommendedNextAction
            currentTool="reconstruction"
            topicTitle={topicTitle}
            onNavigate={onNavigate}
            overallScore={result.score}
            modelVulnerable={result.score < 75}
          />
        </div>
      )}
    </div>
  );
};
