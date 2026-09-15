import React, { useState, useEffect } from 'react';
import { Simulation, Topic, ActiveLearningContext } from '../types';
import { AntiOveranalysisBanner } from '../components/AiMetadataBadge';
import { EmptyContextState } from '../components/EmptyContextState';
import {
  InstrumentHeader,
  CognitivePipelineFlow,
  RecommendedNextAction,
} from '../components/mechanism';
import {
  Activity,
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ArrowRight,
  RefreshCw,
  Zap,
  Target,
  FileText,
  Clock,
  Gauge,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface SimulationPageProps {
  selectedTopic: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  topics?: Topic[];
  onSelectTopic?: (topicId: string) => void;
  onNavigate?: (tab: any) => void;
  onNewDiscussion?: () => void;
}

const SIMULATION_PIPELINE_STEPS = [
  {
    id: 'physical_state',
    title: 'Physical State',
    sublabel: 'Dynamical baseline & state vector',
  },
  {
    id: 'observation',
    title: 'Observation',
    sublabel: 'Targeted discriminator measurements',
  },
  {
    id: 'mechanism',
    title: 'Mechanism',
    sublabel: 'Governing physical or conservation law',
  },
  {
    id: 'intervention',
    title: 'Intervention',
    sublabel: 'Boundary parameter perturbation',
  },
  {
    id: 'consequence',
    title: 'Consequence',
    sublabel: 'Phase space response & trajectory update',
  },
];

export const SimulationPage: React.FC<SimulationPageProps> = ({
  selectedTopic,
  activeContext,
  topics = [],
  onSelectTopic,
  onNavigate,
  onNewDiscussion,
}) => {
  const hasContext = Boolean(activeContext?.topicName);

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealedInvestigations, setRevealedInvestigations] = useState<string[]>([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [attemptSubmitted, setAttemptSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);

  useEffect(() => {
    if (hasContext) {
      loadSimulation();
    } else {
      setSimulation(null);
    }
  }, [activeContext?.topicName, hasContext]);

  const loadSimulation = async () => {
    if (!hasContext) return;
    setLoading(true);
    setRevealedInvestigations([]);
    setSelectedDecisionId(null);
    setAttemptSubmitted(false);
    setAttemptResult(null);

    try {
      // Find simulation for current topic or fallback to first available
      const listRes = await fetch('/api/simulations');
      const listJson = await listRes.json();
      let targetSimId = 'sim_damped_oscillator';
      if (listJson.success && Array.isArray(listJson.data) && listJson.data.length > 0) {
        const matching = listJson.data.find(
          (s: any) =>
            (activeContext?.topicId && s.topic_id === activeContext.topicId) ||
            (activeContext?.topicName && s.topic_name?.toLowerCase() === activeContext.topicName.toLowerCase()) ||
            (activeContext?.topicName && s.title?.toLowerCase().includes(activeContext.topicName.toLowerCase()))
        );
        targetSimId = matching ? matching.id : listJson.data[0].id;
      }
      const res = await fetch(`/api/simulations/${targetSimId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSimulation(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleInvestigation = (id: string) => {
    if (attemptSubmitted) return;
    if (revealedInvestigations.includes(id)) {
      setRevealedInvestigations(revealedInvestigations.filter((i) => i !== id));
    } else {
      setRevealedInvestigations([...revealedInvestigations, id]);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!simulation || !selectedDecisionId) return;

    try {
      const res = await fetch('/api/simulations/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_id: simulation.id,
          hypotheses: ['Underdamped resonance peak vs Critical viscous damping attenuation'],
          evidence_used: revealedInvestigations,
          decisions: [selectedDecisionId],
          confidence: 4,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAttemptResult(json.data);
        setAttemptSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!hasContext) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <EmptyContextState
          toolName="Mechanistic Physical Simulation"
          toolDescription="Physical simulations demand hypothesis generation, discriminator measurement selection, and parameter control under experimental uncertainty. Please select a topic or establish a discussion context first."
          topics={topics}
          onSelectTopic={onSelectTopic}
          onNavigate={onNavigate}
          onNewDiscussion={onNewDiscussion}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-72 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
          <Activity className="w-5 h-5 text-blue-400 absolute inset-0 m-auto" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Initializing Physical Simulation Engine
          </h3>
          <p className="text-[11px] font-mono text-slate-500">
            Loading dynamic system observables and measurement matrix...
          </p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs font-mono rounded-xl border border-white/[0.08] bg-[#0C0E16]">
        Simulation scenario not found.
      </div>
    );
  }

  const nonDiscriminatorCount = revealedInvestigations.filter((eId) => {
    const inv = simulation.available_investigations.find((i) => i.id === eId);
    return inv && !inv.is_discriminator;
  }).length;

  const hasDiscriminators = revealedInvestigations.filter((eId) => {
    const inv = simulation.available_investigations.find((i) => i.id === eId);
    return inv && inv.is_discriminator;
  }).length >= 2;

  const showLiveOveranalysis = hasDiscriminators && nonDiscriminatorCount >= 1;

  // Calculate active pipeline phase index:
  // 0: Physical State
  // 1: Observation (revealed investigations > 0)
  // 2: Mechanism / Decision consideration (decision selected)
  // 3: Intervention committed
  // 4: Consequence displayed
  const currentPipelineStep = attemptSubmitted
    ? 4
    : selectedDecisionId
    ? 3
    : revealedInvestigations.length > 0
    ? 1
    : 0;

  // Selected decision object for preview
  const selectedDecision = simulation.available_decisions.find((d) => d.id === selectedDecisionId);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1 & 2: Tool Identity & Selected Topic */}
      <InstrumentHeader
        instrumentNumber="05"
        instrumentName="Physical System & Apparatus Simulation"
        badgeLabel="PHYSICAL SYSTEM SIMULATOR"
        badgeVariant="blue"
        icon={Activity}
        description="Witness your mental model govern real-time physical dynamics. Discriminate competitive models without measurement overanalysis, target the governing dynamical node, and observe the emergent phase-space consequences."
        selectedTopic={selectedTopic}
        activeContext={activeContext}
        cognitivePillars={['Information Economy', 'Governing Dynamical Node', 'Trajectory Consequence']}
      />

      {/* Visual Pipeline: Physical State → Observation → Mechanism → Intervention → Consequence */}
      <CognitivePipelineFlow
        steps={SIMULATION_PIPELINE_STEPS}
        currentStepIndex={currentPipelineStep}
        accentColor="blue"
        label="PHYSICAL REASONING TRAJECTORY"
      />

      {/* Overanalysis Alert Banner */}
      {showLiveOveranalysis && !attemptSubmitted && (
        <div className="animate-fadeIn">
          <AntiOveranalysisBanner message="STOP — ENOUGH INFORMATION. COMMIT." />
        </div>
      )}

      {/* Main Dual-Column Simulation Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (lg: 7 cols): Physical State & Diagnostic Observations */}
        <div className="lg:col-span-7 space-y-5">
          {/* Physical System Presentation Box (Stable Neutral Surface) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Physical Apparatus & State // Baseline
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  {simulation.system_presentation?.apparatus_spec || (simulation as any).apparatus_state?.apparatus_spec || 'Experimental Apparatus'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-400">
                  DIFF: {simulation.difficulty}
                </span>
              </div>
            </div>

            {/* Primary Phenomenon Callout */}
            <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08] flex items-start gap-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold shrink-0 pt-0.5">
                Observed Phenomenon:
              </span>
              <span className="text-xs font-semibold text-slate-200 font-sans">
                {simulation.system_presentation?.primary_anomaly || (simulation as any).apparatus_state?.primary_anomaly || 'Dynamical Resonance Anomaly'}
              </span>
            </div>

            {/* Physical Scenario Narrative */}
            <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
              {simulation.scenario}
            </p>

            {/* Parameters and State Vector Baseline Grid */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                <span>Initial Boundary Conditions & Physical Parameters</span>
                <span>Calibrated Sensors</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(simulation.system_presentation?.parameters || (simulation as any).apparatus_state?.parameters || {}).map(([k, v]) => {
                  const keyUpper = k.toUpperCase();
                  const isAnomalous =
                    keyUpper.includes('Q_') ||
                    keyUpper.includes('DEVIATION') ||
                    keyUpper.includes('LOSS') ||
                    keyUpper.includes('DRAG') ||
                    keyUpper.includes('DAMPING');

                  return (
                    <div
                      key={k}
                      className="p-2.5 rounded-lg bg-[#07080C] border border-white/[0.08] text-center space-y-1"
                    >
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                        {k}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isAnomalous ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        {String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Targeted Investigations (Observation Modality) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Experimental Probes // Discriminator Measurements
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {revealedInvestigations.length} of {simulation.available_investigations.length} Revealed
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-400">
              Select key physical discriminators to reveal measurement and detector readings. Avoid measurement overanalysis when the governing physical mechanism is already clear.
            </p>

            {/* Grid of Investigations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {simulation.available_investigations.map((inv) => {
                const isRevealed = revealedInvestigations.includes(inv.id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => toggleInvestigation(inv.id)}
                    className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isRevealed
                        ? 'border-cyan-500/50 bg-[#101828] shadow-sm'
                        : 'border-white/[0.08] bg-[#07080C] hover:border-cyan-500/30 hover:bg-[#101420]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold font-sans text-slate-200">
                        {inv.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          inv.cost_cognitive === 'Low'
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                            : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        Cost: {inv.cost_cognitive}
                      </span>
                    </div>

                    {isRevealed ? (
                      <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] space-y-1.5 text-xs">
                        <div className="font-mono text-cyan-300 font-bold text-[11px]">
                          Result: {inv.result}
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                          {inv.explanation}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Click to reveal report</span>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (lg: 5 cols): Mechanistic Physical Intervention & Trajectory Result */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Mechanistic Physical Intervention
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                ACTION NODE
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-400">
              Select the intervention that acts directly upon the governing physical node responsible for this system's dynamical response:
            </p>

            {/* Decision Options List */}
            <div className="space-y-2.5">
              {simulation.available_decisions.map((dec) => {
                const isSelected = selectedDecisionId === dec.id;
                return (
                  <label
                    key={dec.id}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500/60 bg-[#101428] shadow-sm ring-1 ring-blue-500/20'
                        : 'border-white/[0.08] bg-[#07080C] hover:border-blue-500/30 hover:bg-[#101420]'
                    } ${attemptSubmitted ? 'cursor-default' : ''}`}
                  >
                    <input
                      type="radio"
                      name="simulation-decision"
                      checked={isSelected}
                      onChange={() => !attemptSubmitted && setSelectedDecisionId(dec.id)}
                      disabled={attemptSubmitted}
                      className="mt-1 accent-blue-500 focus:ring-0"
                    />
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-slate-200 font-sans leading-snug">
                        {dec.intervention}
                      </div>
                      <div className="text-slate-400 text-[11px] font-sans leading-relaxed">
                        Rationale: {dec.rationale}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Commit Decision Button */}
            {!attemptSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitAttempt}
                disabled={!selectedDecisionId}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-blue-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Commit Causal Intervention</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              /* Attempt Result: Physical Consequence Display */
              <div
                className={`p-4 rounded-xl border space-y-4 animate-fadeIn ${
                  attemptResult?.is_optimal
                    ? 'border-emerald-500/40 bg-[#071710] text-slate-200'
                    : 'border-rose-500/40 bg-[#18090E] text-slate-200'
                }`}
              >
                {/* Optimal vs Suboptimal Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    {attemptResult?.is_optimal ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span
                      className={`font-mono font-bold text-xs uppercase tracking-wider ${
                        attemptResult?.is_optimal ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {attemptResult?.is_optimal
                        ? 'Optimal Mechanistic Choice'
                        : 'Suboptimal Physical Intervention'}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                      attemptResult?.is_optimal
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                    }`}
                  >
                    {attemptResult?.is_optimal ? 'CAUSALLY SEALED' : 'MECHANISM MISMATCH'}
                  </span>
                </div>

                {/* Emergent Physical Consequence */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                    Emergent System Trajectory
                  </span>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {attemptResult?.outcome}
                  </p>
                </div>

                {/* Suboptimal Visual Mismatch Explainer */}
                {!attemptResult?.is_optimal && (
                  <div className="p-3 rounded-lg bg-[#07080C] border border-rose-900/40 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                      Mechanistic Node Divergence
                    </span>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      The selected intervention targeted a secondary or non-governing parameter without resolving the primary physical constraint. As a consequence, the dynamical response or conserved flux failed to stabilize.
                    </p>
                  </div>
                )}

                {/* Deep Physical Mechanism & Gold Standard Discriminator */}
                <div className="p-3.5 rounded-lg bg-[#07080C] border border-white/[0.08] text-xs space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                      Underlying Physical Mechanism:
                    </span>
                    <p className="text-slate-300 text-xs font-sans leading-relaxed">
                      {attemptResult?.hidden_physical_state || attemptResult?.hidden_mechanism}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold block">
                      Gold Standard Discriminator:
                    </span>
                    <p className="text-slate-300 text-xs font-sans leading-relaxed">
                      {attemptResult?.discriminator_explanation}
                    </p>
                  </div>
                </div>

                {/* Information Economy / Anti-Overanalysis Evaluation */}
                <div className="text-[11px] font-mono text-slate-400 border-t border-white/[0.06] pt-2.5 flex items-center justify-between">
                  <span>{attemptResult?.anti_overanalysis_message}</span>
                </div>

                {/* Reset Action */}
                <button
                  type="button"
                  onClick={loadSimulation}
                  className="w-full py-2 px-3 rounded-md bg-[#101420] border border-white/[0.08] hover:border-cyan-500/50 hover:bg-cyan-600/10 text-xs font-mono text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reset Simulation Scenario</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Next Action */}
      <RecommendedNextAction
        currentTool="simulation"
        topicTitle={simulation.title}
        onNavigate={onNavigate}
        overallScore={attemptResult?.is_optimal ? 90 : 60}
      />
    </div>
  );
};
