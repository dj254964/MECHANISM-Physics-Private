import React, { useState, useEffect } from 'react';
import { Topic, ActiveLearningContext } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { AiMetadataBadge } from '../components/AiMetadataBadge';
import { EmptyContextState } from '../components/EmptyContextState';
import {
  InstrumentHeader,
  CognitivePipelineFlow,
  RecommendedNextAction,
} from '../components/mechanism';
import {
  ShieldAlert,
  Flame,
  HelpCircle,
  Eye,
  Link2,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Crosshair,
  Layers,
  MessageSquare,
} from 'lucide-react';

interface AdversarialPageProps {
  selectedTopic: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  topics?: Topic[];
  onSelectTopic?: (topicId: string) => void;
  onNavigate?: (tab: any) => void;
  onNewDiscussion?: () => void;
}

const ATTACK_VECTORS = [
  {
    id: 'DESTROY_MY_MODEL',
    label: 'Counter-Example Boundary Attack',
    codeName: 'DESTROY MY MODEL',
    icon: Flame,
    desc: 'Subject model to severe physical boundary conditions and mathematical counter-factuals that test limit points.',
    probeType: 'Boundary Limit Test',
  },
  {
    id: 'WHAT_AM_I_ASSUMING',
    label: 'Uncover Hidden Assumptions',
    codeName: 'WHAT AM I ASSUMING?',
    icon: HelpCircle,
    desc: 'Expose implicit constants, unstated thermodynamic conditions, and unverified physical axioms.',
    probeType: 'Axiom Audit',
  },
  {
    id: 'FIND_THE_DISCRIMINATOR',
    label: 'Isolate Critical Discriminator',
    codeName: 'FIND THE DISCRIMINATOR',
    icon: Eye,
    desc: 'Identify the decisive experimental measurement or detector observation that falsifies competing explanations.',
    probeType: 'Falsification Test',
  },
  {
    id: 'ATTACK_THE_CAUSAL_CHAIN',
    label: 'Audit Causal Directionality',
    codeName: 'ATTACK THE CAUSAL CHAIN',
    icon: Link2,
    desc: 'Scrutinize directionality, temporal order, non-sequiturs, and missing intermediate physical steps.',
    probeType: 'Directionality Audit',
  },
];

const SAMPLE_MODELS = [
  {
    title: 'Carnot Heat Engine & Frictionless Idealization',
    text: 'A heat engine can achieve 100% thermal efficiency if all mechanical friction in the piston and cylinders is eliminated, allowing all input heat Q_H to be directly converted into work W without waste heat rejection.',
  },
  {
    title: 'Lenz’s Law & Induced Field Directionality',
    text: 'When a north magnetic pole plunges into a copper ring, the induced circulating current generates an opposing south magnetic pole that pulls the magnet inward, accelerating it beyond free-fall gravity.',
  },
  {
    title: 'Damped Harmonic Oscillator Frequency',
    text: 'Increasing the viscous damping coefficient b always increases the oscillation frequency of a mechanical oscillator because stronger resistance forces the mass to complete cycles faster.',
  },
];

const ADVERSARIAL_PIPELINE_STEPS = [
  {
    id: 'model',
    title: 'Model',
    sublabel: 'Working physical formulation',
  },
  {
    id: 'attack',
    title: 'Attack',
    sublabel: 'Targeted analytical stress probe',
  },
  {
    id: 'outcome',
    title: 'Failure / Survival',
    sublabel: 'Boundary limits & counter-examples',
  },
  {
    id: 'discriminator',
    title: 'Discriminator',
    sublabel: 'Decisive falsification test',
  },
  {
    id: 'update',
    title: 'Model Update',
    sublabel: 'Calibrated invariant mechanism',
  },
];

export const AdversarialPage: React.FC<AdversarialPageProps> = ({
  selectedTopic,
  activeContext,
  topics = [],
  onSelectTopic,
  onNavigate,
  onNewDiscussion,
}) => {
  const hasContext = Boolean(activeContext?.topicName);

  const [modelText, setModelText] = useState(
    activeContext?.summary
      ? `Model for ${activeContext.topicName}: ${activeContext.summary}`
      : activeContext?.topicName
      ? `Mental model concerning ${activeContext.topicName}`
      : ''
  );
  const [activeAttack, setActiveAttack] = useState<string>('DESTROY_MY_MODEL');
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeContext?.summary) {
      setModelText(`Model for ${activeContext.topicName}: ${activeContext.summary}`);
    } else if (activeContext?.topicName) {
      setModelText(`Mental model concerning ${activeContext.topicName}`);
    } else {
      setModelText('');
      setCritique(null);
    }
  }, [activeContext?.summary, activeContext?.topicName]);

  const handleAttack = async (attackType: string) => {
    if (!modelText.trim() || loading) return;

    setActiveAttack(attackType);
    setLoading(true);
    setCritique(null);
    setError(null);

    try {
      const res = await fetch('/api/adversarial/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_text: modelText,
          attack_type: attackType,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCritique(json.data.critique);
        setMetadata(json.metadata);
      } else {
        throw new Error(json.error || 'Failed to execute adversarial attack');
      }
    } catch (e: any) {
      setError(e.message || 'Error occurred during adversarial stress test');
    } finally {
      setLoading(false);
    }
  };

  // Detect whether the model failed or survived based on critique tone and key vulnerability signals
  const isVulnerable = critique
    ? /break|flaw|vulnerab|defect|missing|inversion|contradict|erroneous|invalid|counterexample|fail|incorrect/i.test(
        critique
      )
    : false;

  // Active step index in pipeline:
  // 0 = Model formulation, 1 = Attack running, 2/3 = Outcome & Discriminator evaluated
  const currentStep = loading ? 1 : critique ? 3 : 0;

  const selectedProbe = ATTACK_VECTORS.find((v) => v.id === activeAttack) || ATTACK_VECTORS[0];

  if (!hasContext) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <EmptyContextState
          toolName="Adversarial Attack & Stress-Testing"
          toolDescription="Adversarial stress-testing attacks a working model with physical boundary limits and counter-factual probes. Please select a topic or establish a discussion context first."
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
      {/* 1 & 2: Tool Identity & Selected Topic */}
      <InstrumentHeader
        instrumentNumber="04"
        instrumentName="Adversarial Stress Test"
        badgeLabel="ADVERSARIAL VERIFICATION"
        badgeVariant="violet"
        icon={ShieldAlert}
        description="Submit your working mental model to intentional analytical stress testing. Expose unstated assumptions, challenge causal directionality with severe counter-factual cases, and isolate the exact physical point where the model breaks or holds."
        selectedTopic={selectedTopic}
        activeContext={activeContext}
        cognitivePillars={['Boundary Stress Testing', 'Falsification Criteria', 'Assumption Inversion']}
      />

      {/* Visual Story: Model → Attack → Failure/Survival → Discriminator → Model Update */}
      <CognitivePipelineFlow
        steps={ADVERSARIAL_PIPELINE_STEPS}
        currentStepIndex={currentStep}
        accentColor="violet"
        label="ADVERSARIAL STRESS-TEST SEQUENCE"
      />

      {/* Main Dual-Column Instrument Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Model Workspace & Analytical Attack Probes */}
        <div className="lg:col-span-5 space-y-4">
          {/* Elevated Model Surface */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Target Model Under Test
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                BUFFER: WORKING HYPOTHESIS
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                  Working Mental Model Formulation
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {modelText.length} characters
                </span>
              </div>
              <textarea
                rows={6}
                value={modelText}
                onChange={(e) => setModelText(e.target.value)}
                placeholder="State your proposition, hypothesis, or physical mechanism to be stress-tested (e.g. 'Eddy current braking occurs because...')..."
                className="w-full text-xs md:text-sm font-sans p-3 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/60 focus:border-violet-500/60 leading-relaxed resize-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* 4 Analytical Attack Probes */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Engage Analytical Probe:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                4 Stress Modalities
              </span>
            </div>

            <div className="space-y-2">
              {ATTACK_VECTORS.map((v) => {
                const Icon = v.icon;
                const isSelected = activeAttack === v.id;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleAttack(v.id)}
                    disabled={loading || !modelText.trim()}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3 group cursor-pointer ${
                      isSelected
                        ? 'border-rose-500/50 bg-[#160e18] text-slate-100 shadow-md ring-1 ring-rose-500/20'
                        : 'border-white/[0.06] bg-[#07080C] hover:border-violet-500/40 hover:bg-[#101420] text-slate-300'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <div
                      className={`p-2 rounded-md shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-[#101420] text-slate-400 group-hover:text-violet-300 border border-white/[0.06]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs font-bold font-sans tracking-tight text-slate-200 group-hover:text-white flex items-center gap-1.5">
                          <span>{v.label}</span>
                        </div>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                            isSelected
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                              : 'bg-white/[0.06] text-slate-400'
                          }`}
                        >
                          {v.probeType}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-sans mt-1 leading-snug">
                        {v.desc}
                      </div>

                      {/* Probe Trigger Indicator */}
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500 uppercase">
                          PROBE: {v.codeName}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            isSelected
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-500 group-hover:text-violet-400'
                          }`}
                        >
                          <span>Execute Probe</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Models to Test */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-4 shadow-sm space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Load Hypothesis Draft:
            </span>
            <div className="space-y-1.5">
              {SAMPLE_MODELS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setModelText(s.text);
                    setCritique(null);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-white/[0.06] bg-[#07080C] hover:border-violet-500/40 hover:bg-[#101420] text-xs transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-300 group-hover:text-white">
                      {s.title}
                    </span>
                    <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      "{s.text}"
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Adversarial Stress Critique & Falsification Analysis */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 md:p-6 shadow-sm min-h-[520px] flex flex-col justify-between">
            {loading ? (
              <div className="my-auto py-16 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-white/[0.08] border-t-rose-500 animate-spin" />
                  <Crosshair className="w-5 h-5 text-rose-400 absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-sans text-slate-100">
                    Executing Adversarial Stress Probe
                  </h3>
                  <p className="text-xs font-mono text-slate-400 max-w-sm">
                    Synthesizing physical edge cases, boundary perturbations, and mathematical counter-proofs...
                  </p>
                </div>
              </div>
            ) : critique ? (
              <div className="space-y-5">
                {/* Result Status Banner: Model Failed vs Model Survived */}
                <div className="border-b border-white/[0.06] pb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isVulnerable ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                        Scientific Stress Test // Outcome
                      </h2>
                    </div>

                    {/* Restrained status badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                        isVulnerable
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                      }`}
                    >
                      {isVulnerable ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>VULNERABILITY DETECTED</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>MODEL WITHSTOOD PROBE</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Visual connection to the specific causal failure */}
                  {isVulnerable && (
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200/90 font-sans space-y-1">
                      <div className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider flex items-center gap-1">
                        <span>CRITICAL CAUSAL VULNERABILITY:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        The stress probe identified that the proposed mechanism breaks under physical boundary conditions or reverses causal directionality. Review the falsification analysis below to recalibrate the model.
                      </p>
                    </div>
                  )}

                  {!isVulnerable && (
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-200/90 font-sans space-y-1">
                      <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1">
                        <span>INVARIANT INTEGRITY VERIFIED:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        The working model withstood this boundary test. The underlying dynamical assumptions remain consistent with physical conservation laws.
                      </p>
                    </div>
                  )}

                  {/* Model Construction Hierarchy Indicator */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-1">
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-violet-500/30 text-violet-300">
                      1. Model Formulated
                    </span>
                    <span className="text-slate-600">→</span>
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isVulnerable
                          ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                          : 'bg-[#101420] border-violet-500/30 text-violet-300'
                      }`}
                    >
                      2. Stress Probe Applied
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-violet-500/30 text-violet-300">
                      3. Falsification Isolated
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      4. Recalibration
                    </span>
                  </div>
                </div>

                {/* Markdown Output */}
                <div className="text-xs md:text-sm text-slate-200 leading-relaxed space-y-3">
                  <MarkdownRenderer content={critique} />
                </div>

                {/* AI Metadata Badge */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <AiMetadataBadge
                    provider="Gemini"
                    model={metadata?.model || 'gemini-3.8-flash'}
                    timestamp={metadata?.timestamp || new Date().toISOString()}
                    classification={`Adversarial: ${selectedProbe.probeType}`}
                  />
                  <span className="text-[10px] font-mono text-slate-500">
                    Scientific Falsification Audit
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-auto py-16 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-[#07080C] border border-white/[0.08] flex items-center justify-center text-slate-500">
                  <ShieldAlert className="w-6 h-6 stroke-1 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold font-sans text-slate-200">
                  Model Awaiting Stress Test
                </h3>
                <p className="text-xs max-w-md font-sans text-slate-400 leading-relaxed">
                  Select one of the analytical probes on the left to subject your working mental model to physical edge cases, assumption scrutiny, and falsification tests.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Next Action */}
      <RecommendedNextAction
        currentTool="adversarial"
        topicTitle={modelText.slice(0, 40)}
        onNavigate={onNavigate}
        modelVulnerable={isVulnerable}
      />
    </div>
  );
};
