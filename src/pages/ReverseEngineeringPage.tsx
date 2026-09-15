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
  GitPullRequest,
  RefreshCw,
  ArrowRight,
  Target,
  Sparkles,
  Search,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface ReverseEngineeringPageProps {
  selectedTopic: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  topics?: Topic[];
  onSelectTopic?: (topicId: string) => void;
  onNavigate?: (tab: any) => void;
  onNewDiscussion?: () => void;
}

const SAMPLE_OBSERVATIONS = [
  {
    title: 'Zero Hall Voltage in Semimetal at High B-Field',
    paradox: 'Equal electron and hole densities cancel transverse Hall field',
    observation:
      'In a semimetal sample subjected to a strong perpendicular magnetic field of 5 T at 4.2 K, the measured transverse Hall voltage vanishes to zero, even though longitudinal magnetoresistance exhibits pronounced Shubnikov–de Haas oscillations.',
  },
  {
    title: 'Anomalous Perihelion Advance of Mercury',
    paradox: '43 arcseconds/century unaccounted for by Newtonian planetary perturbations',
    observation:
      'After calculating all gravitational perturbations from Venus, Earth, Jupiter, and solar oblateness using Newtonian mechanics, Mercury’s orbital perihelion advances with an unexplained excess of 43 arcseconds per century.',
  },
  {
    title: 'Photoelectric Current Cutoff Above Threshold Wavelength',
    paradox: 'Wave theory predicts energy accumulation regardless of frequency',
    observation:
      'In an evacuated phototube with a cesium cathode, ultraviolet light produces immediate photocurrent. Illuminating the cathode with an intense 650 nm red laser generates zero emitted photoelectrons and zero measurable current.',
  },
];

const REVERSE_PIPELINE_STEPS = [
  {
    id: 'observation',
    title: 'Observed Outcome',
    sublabel: 'Anomalous experimental finding or physical paradox',
  },
  {
    id: 'candidates',
    title: 'Candidate Mechanisms',
    sublabel: 'Competitive physical hypotheses & theoretical models',
  },
  {
    id: 'discriminator',
    title: 'Discriminator',
    sublabel: 'Decisive experimental observable or symmetry test',
  },
  {
    id: 'cause',
    title: 'Cause',
    sublabel: 'Verified foundational physical mechanism',
  },
];

export const ReverseEngineeringPage: React.FC<ReverseEngineeringPageProps> = ({
  selectedTopic,
  activeContext,
  topics = [],
  onSelectTopic,
  onNavigate,
  onNewDiscussion,
}) => {
  const hasContext = Boolean(activeContext?.topicName);

  const [observation, setObservation] = useState(
    activeContext?.summary
      ? `Physical observation for ${activeContext.topicName}: ${activeContext.summary}`
      : activeContext?.topicName
      ? `Physical observation concerning ${activeContext.topicName}`
      : ''
  );
  const [userHypotheses, setUserHypotheses] = useState('');
  const [loading, setLoading] = useState(false);
  const [deduction, setDeduction] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeContext?.summary) {
      setObservation(`Physical observation for ${activeContext.topicName}: ${activeContext.summary}`);
    } else if (activeContext?.topicName) {
      setObservation(`Physical observation concerning ${activeContext.topicName}`);
    } else {
      setObservation('');
      setDeduction(null);
    }
  }, [activeContext?.summary, activeContext?.topicName]);

  const handleReverseEngineer = async (obsText?: string) => {
    const text = (obsText || observation).trim();
    if (!text || loading) return;

    setLoading(true);
    setDeduction(null);
    setError(null);

    try {
      const res = await fetch('/api/reverse-engineering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observation: text,
          user_hypotheses: userHypotheses.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setDeduction(json.data.deduction);
        setMetadata(json.metadata);
      } else {
        throw new Error(json.error || 'Failed to deduce reverse engineering model');
      }
    } catch (e: any) {
      setError(e.message || 'Error occurred during inductive deduction');
    } finally {
      setLoading(false);
    }
  };

  // 0 = idle/input, 1 = deducing, 3 = final cause isolated
  const currentStep = loading ? 1 : deduction ? 3 : 0;

  if (!hasContext) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <EmptyContextState
          toolName="Reverse Engineering & Backward Deduction"
          toolDescription="Backward deduction forces reverse causal reasoning from an observed physical anomaly back to primary mathematical and physical causes. Please select a topic or establish a discussion context first."
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
        instrumentNumber="03"
        instrumentName="Reverse-Engineering Engine"
        badgeLabel="INDUCTIVE PHYSICAL REASONING"
        badgeVariant="blue"
        icon={GitPullRequest}
        description="Start from anomalous experimental, observational, or dynamical paradoxes. Formulate competitive hypotheses, isolate crucial predictive discriminators, and update your mental model by distinguishing mere mathematical artifacts from the true physical mechanism."
        selectedTopic={selectedTopic}
        activeContext={activeContext}
        cognitivePillars={['Differential Generation', 'Critical Discriminator', 'Bayesian Updating']}
      />

      {/* Visual Pipeline: Observed outcome → Candidate mechanisms → Discriminator → Cause */}
      <CognitivePipelineFlow
        steps={REVERSE_PIPELINE_STEPS}
        currentStepIndex={currentStep}
        accentColor="blue"
        label="INDUCTIVE REASONING TRAJECTORY"
      />

      {/* Main Dual-Column Instrument Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3 & 4: Input / Problem & Reasoning Workspace */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Anomaly Input // Workspace
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                OBSERVATION BUFFER
              </span>
            </div>

            {/* Physical Observation Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                  Physical / Experimental Observation (The Paradox)
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {observation.length} characters
                </span>
              </div>
              <textarea
                rows={6}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Enter an anomalous experimental scenario, paradox, or unexplained observation (e.g. zero resistance in superconductivity, dark matter rotation curves)..."
                className="w-full text-xs md:text-sm font-sans p-3 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/60 leading-relaxed resize-none transition-colors"
              />
            </div>

            {/* Proposed Hypotheses (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                Your Initial Candidate Hypotheses (Optional Pre-Test Model)
              </label>
              <textarea
                rows={3}
                value={userHypotheses}
                onChange={(e) => setUserHypotheses(e.target.value)}
                placeholder="What potential mechanisms could explain this? (e.g. Linear viscous Stokes drag vs quadratic turbulent resistance vs dry Coulomb friction...)"
                className="w-full text-xs font-sans p-2.5 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/60 resize-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleReverseEngineer()}
              disabled={!observation.trim() || loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-blue-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Deducing Causal Models & Discriminators...</span>
                </>
              ) : (
                <>
                  <GitPullRequest className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>Reverse-Engineer Mechanism</span>
                </>
              )}
            </button>
          </div>

          {/* High-Yield Physical Anomalies Presets */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                High-Yield Physical Anomalies:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Paradox Presets
              </span>
            </div>

            <div className="space-y-2">
              {SAMPLE_OBSERVATIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setObservation(s.observation);
                    handleReverseEngineer(s.observation);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-white/[0.06] bg-[#07080C] hover:border-blue-500/40 hover:bg-[#101420] text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-semibold text-slate-200 group-hover:text-white">
                      {s.title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      PARADOX
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2 mt-1 leading-snug">
                    "{s.observation}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5 & 6: AI Analysis/Evaluation & Result (Model Being Constructed) */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 md:p-6 shadow-sm min-h-[520px] flex flex-col justify-between">
            {loading ? (
              <div className="my-auto py-16 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin" />
                  <GitPullRequest className="w-5 h-5 text-blue-400 absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-sans text-slate-100">
                    Constructing Physical Hypotheses & Tests
                  </h3>
                  <p className="text-xs font-mono text-slate-400 max-w-sm">
                    Evaluating theoretical consistency, generating specific verifiable predictions, and identifying gold-standard discriminator tests...
                  </p>
                </div>
              </div>
            ) : deduction ? (
              <div className="space-y-6">
                {/* Result Structural Hierarchy Header */}
                <div className="border-b border-white/[0.06] pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                        Inductive Deduction // Causal Attribution
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      DISCRIMINATOR ISOLATED
                    </span>
                  </div>

                  {/* Structural Model Hierarchy Indicator */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-blue-500/30 text-blue-300">
                      1. Observation Analyzed
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-blue-500/30 text-blue-300">
                      2. Hypotheses Tested
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-blue-500/30 text-blue-300">
                      3. Discriminator Decided
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      4. Mechanism Verified
                    </span>
                  </div>
                </div>

                {/* Markdown Output */}
                <div className="text-xs md:text-sm text-slate-200 leading-relaxed space-y-3">
                  <MarkdownRenderer content={deduction} />
                </div>

                {/* AI Metadata Badge */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <AiMetadataBadge
                    provider="Gemini"
                    model={metadata?.model || 'gemini-3.8-flash'}
                    timestamp={metadata?.timestamp || new Date().toISOString()}
                    classification="Reverse Engineering"
                  />
                  <span className="text-[10px] font-mono text-slate-500">
                    Discriminator Logic Verified
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-auto py-16 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-[#07080C] border border-white/[0.08] flex items-center justify-center text-slate-500">
                  <GitPullRequest className="w-6 h-6 stroke-1 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold font-sans text-slate-200">
                  Awaiting Physical Observation
                </h3>
                <p className="text-xs max-w-md font-sans text-slate-400 leading-relaxed">
                  Enter an anomalous finding or select one of the high-yield physical paradox presets on the left to deconstruct the competitive hypotheses and isolate the definitive discriminator.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7: Recommended Next Action */}
      <RecommendedNextAction
        currentTool="reverse_engineering"
        topicTitle={observation.slice(0, 40)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
