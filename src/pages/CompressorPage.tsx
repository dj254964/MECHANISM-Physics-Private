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
  Minimize2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Target,
  FileText,
  Activity,
  Layers,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface CompressorPageProps {
  selectedTopic: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  topics?: Topic[];
  onSelectTopic?: (topicId: string) => void;
  onNavigate?: (tab: any) => void;
  onNewDiscussion?: () => void;
}

const SAMPLE_EXPLANATIONS = [
  {
    title: 'Electromagnetic Wave Propagation',
    topicId: 'top_maxwell_eq',
    flaw: 'Confounding Electrostatic with Dynamic Fields',
    text: 'Light travels through a vacuum because stationary charge distributions push electric fields forward through space, which then pull magnetic charges along behind them.',
  },
  {
    title: 'Photoelectric Energy Threshold',
    topicId: 'top_photoelectric',
    flaw: 'Wave Amplitude Misattribution',
    text: 'Increasing the intensity of incident light directly increases the kinetic energy of emitted photoelectrons because a brighter wave deposits greater classical work per unit area.',
  },
  {
    title: 'Carnot Heat Engine Efficiency',
    topicId: 'top_carnot_cycle',
    flaw: 'Premature Closure & Missing Equilibrium Chain',
    text: 'A heat engine can achieve 100% thermal efficiency if we eliminate all mechanical friction in the piston, allowing all input heat Q_H to be converted into work W.',
  },
];

const COMPRESSOR_PIPELINE_STEPS = [
  {
    id: 'info',
    title: 'Information',
    sublabel: 'Raw physical observables & working draft',
  },
  {
    id: 'compress',
    title: 'Compression',
    sublabel: 'Governing filter & counter-example attack',
  },
  {
    id: 'mech',
    title: 'Mechanism',
    sublabel: 'Pristine invariant dynamical sequence',
  },
];

export const CompressorPage: React.FC<CompressorPageProps> = ({
  selectedTopic,
  activeContext,
  topics = [],
  onSelectTopic,
  onNavigate,
  onNewDiscussion,
}) => {
  const hasContext = Boolean(activeContext?.topicName);

  const [topicTitle, setTopicTitle] = useState(
    activeContext?.topicName || ''
  );
  const [userExplanation, setUserExplanation] = useState(
    activeContext?.summary
      ? `Regarding ${activeContext.topicName}: ${activeContext.summary}`
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    feedback: string;
    scores: { causal_accuracy: number; directionality: number; completeness: number; overall_score: number };
    metadata?: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeContext?.topicName) {
      setTopicTitle(activeContext.topicName);
      if (activeContext.summary) {
        setUserExplanation(`Regarding ${activeContext.topicName}: ${activeContext.summary}`);
      }
    } else {
      setTopicTitle('');
      setUserExplanation('');
      setResult(null);
    }
  }, [activeContext?.topicName, activeContext?.summary]);

  const handleEvaluate = async (textToEval?: string) => {
    const text = (textToEval || userExplanation).trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/compressor/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: activeContext?.topicId || undefined,
          title: topicTitle || activeContext?.topicName || 'Physical Mechanism',
          user_explanation: text,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Evaluation failed');
      }

      setResult({
        ...json.data,
        metadata: json.metadata,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to compress mechanism');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_EXPLANATIONS[0]) => {
    setTopicTitle(sample.title);
    setUserExplanation(sample.text);
    setResult(null);
  };

  // Determine active pipeline step: 0 for input/draft, 1 for evaluating, 2 for final result
  const currentStep = loading ? 1 : result ? 2 : 0;

  if (!hasContext) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <EmptyContextState
          toolName="Mechanism Compressor"
          toolDescription="The Mechanism Compressor strips non-causal prose down to rate-limiting physical links. Without an active learning context, there is no target mechanism to compress."
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
        instrumentNumber="02"
        instrumentName="Mechanism Compressor"
        badgeLabel="COGNITIVE COMPRESSOR"
        badgeVariant="cyan"
        icon={Minimize2}
        description="State your current understanding of a physical or dynamical mechanism. The compressor rejects rote recitations, isolates your governing assumptions, subjects your reasoning to counter-examples, and synthesizes the compressed invariant causal model."
        selectedTopic={selectedTopic}
        activeContext={activeContext}
        customTopicTitle={topicTitle}
        onUpdateTopicTitle={setTopicTitle}
        cognitivePillars={['Directional Causality', 'Rate-Limiting Filter', 'Invariant Compression']}
      />

      {/* Visual Pipeline: Information → Compression → Mechanism */}
      <CognitivePipelineFlow
        steps={COMPRESSOR_PIPELINE_STEPS}
        currentStepIndex={currentStep}
        accentColor="cyan"
        label="REASONING TRANSFORMATION PIPELINE"
      />

      {/* Main Dual-Column Instrument Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3 & 4: Input / Problem & Reasoning Workspace */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#60cfff]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Reasoning Workspace // Input
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                ACTIVE MODEL BUFFER
              </span>
            </div>

            {/* Target Concept Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                Phenomenon / Mechanism Target
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Damped Oscillations & Quality Factor Q"
                  className="w-full text-xs font-sans py-2.5 px-3 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/60 transition-colors"
                />
              </div>
            </div>

            {/* User Working Explanation (The draft model) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                  Working Explanation (Uncompressed Model)
                </label>
                <div className="flex items-center gap-3">
                  {activeContext?.source === 'doubt_chat' && activeContext.summary && (
                    <button
                      type="button"
                      onClick={() => setUserExplanation(activeContext.summary || '')}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      title="Insert summary from active Doubt Chat session"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Use Chat Context</span>
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-slate-500">
                    {userExplanation.length} characters
                  </span>
                </div>
              </div>
              <textarea
                rows={8}
                value={userExplanation}
                onChange={(e) => setUserExplanation(e.target.value)}
                placeholder="Explain the causal sequence as you understand it. Detail what triggers each transition, the rate-limiting steps, and the immediate physical outcomes..."
                className="w-full text-xs md:text-sm font-sans p-3 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/60 leading-relaxed resize-none transition-colors"
              />
            </div>

            {/* Error Message if API fails */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleEvaluate()}
              disabled={!userExplanation.trim() || loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-cyan-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Attacking Mental Model...</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>Compress & Deconstruct Model</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Drafts with Known Flaws */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Load Common Flawed Drafts:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Diagnostic Presets
              </span>
            </div>

            <div className="space-y-2">
              {SAMPLE_EXPLANATIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="w-full text-left p-3 rounded-lg border border-white/[0.06] bg-[#07080C] hover:border-cyan-500/40 hover:bg-[#101420] text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-semibold text-slate-200 group-hover:text-white">
                      {s.title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {s.flaw}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2 mt-1 leading-snug">
                    "{s.text}"
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
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-[#60cfff] animate-spin" />
                  <Minimize2 className="w-5 h-5 text-[#60cfff] absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-sans text-slate-100">
                    Isolating Causal Links & Invariant Kernels
                  </h3>
                  <p className="text-xs font-mono text-slate-400 max-w-sm">
                    Filtering out descriptive narrative fluff and verifying directional validity against physical constraints...
                  </p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Result Structural Hierarchy Header */}
                <div className="border-b border-white/[0.06] pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#60cfff] animate-pulse" />
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                        Constructed Mechanistic Model // Evaluation
                      </h2>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                      <span>VERIFIED CAUSAL ENGINE</span>
                    </div>
                  </div>

                  {/* Model Construction Hierarchy Indicator */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-cyan-500/30 text-cyan-300">
                      1. Observation Dissected
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-cyan-500/30 text-cyan-300">
                      2. Weak Link Exposed
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-cyan-500/30 text-cyan-300">
                      3. Causal Chain Sealed
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      4. Invariant Model
                    </span>
                  </div>

                  {/* Metric Cards - Deep noir obsidian surfaces with subtle borders */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08] text-center space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Causal Accuracy
                      </span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          result.scores.causal_accuracy >= 70
                            ? 'text-cyan-300'
                            : 'text-amber-400'
                        }`}
                      >
                        {result.scores.causal_accuracy}%
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08] text-center space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Directionality
                      </span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          result.scores.directionality >= 70
                            ? 'text-violet-300'
                            : 'text-amber-400'
                        }`}
                      >
                        {result.scores.directionality}%
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08] text-center space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Completeness
                      </span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          result.scores.completeness >= 70
                            ? 'text-blue-300'
                            : 'text-amber-400'
                        }`}
                      >
                        {result.scores.completeness}%
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08] text-center space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Overall Score
                      </span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          result.scores.overall_score >= 75
                            ? 'text-emerald-400'
                            : result.scores.overall_score >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {result.scores.overall_score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structured 6-Step Critique Output */}
                <div className="text-xs md:text-sm text-slate-200 leading-relaxed space-y-3">
                  <MarkdownRenderer content={result.feedback} />
                </div>

                {/* AI Metadata Badge */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <AiMetadataBadge
                    provider="Gemini"
                    model={result.metadata?.model || 'gemini-3.8-flash'}
                    timestamp={result.metadata?.timestamp || new Date().toISOString()}
                    classification="Mechanism Compression"
                  />
                  <span className="text-[10px] font-mono text-slate-500">
                    6-Step Causal Validation Passed
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-auto py-16 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-[#07080C] border border-white/[0.08] flex items-center justify-center text-slate-500">
                  <Minimize2 className="w-6 h-6 stroke-1 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold font-sans text-slate-200">
                  Awaiting Working Explanation
                </h3>
                <p className="text-xs max-w-md font-sans text-slate-400 leading-relaxed">
                  Enter your draft mechanism on the left or select a high-yield practice draft to launch the 6-step causal critique and extract the pristine compressed model.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7: Recommended Next Action */}
      <RecommendedNextAction
        currentTool="compressor"
        topicTitle={topicTitle}
        onNavigate={onNavigate}
        overallScore={result?.scores.overall_score}
      />
    </div>
  );
};
