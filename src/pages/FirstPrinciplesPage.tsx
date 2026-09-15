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
  Binary,
  RefreshCw,
  ArrowRight,
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  Atom,
  MessageSquare,
} from 'lucide-react';

interface FirstPrinciplesPageProps {
  selectedTopic: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  topics?: Topic[];
  onSelectTopic?: (topicId: string) => void;
  onNavigate?: (tab: any) => void;
  onNewDiscussion?: () => void;
}

const FIRST_PRINCIPLES_PRESETS = [
  {
    title: 'Lagrangian Action & Geodesics',
    axiom: 'Principle of stationary action δS = 0, δ∫(T - V)dt = 0',
  },
  {
    title: 'Maxwell Wave Equation from Ampère & Faraday',
    axiom: 'Curl of curl identities: ∇×(∇×E) = -μ₀ε₀ ∂²E/∂t²',
  },
  {
    title: 'Carnot Engine Maximum Thermal Efficiency',
    axiom: 'Clausius inequality & entropy conservation in reversible cycles',
  },
  {
    title: 'Schrödinger Equation & Continuity Equation',
    axiom: 'Unitary time evolution & probability current conservation',
  },
  {
    title: 'Blackbody Radiation & Planck Distribution',
    axiom: 'Harmonic oscillator quantization E_n = nℏω resolving Rayleigh-Jeans divergence',
  },
];

const FIRST_PRINCIPLES_PIPELINE_STEPS = [
  {
    id: 'axiom',
    title: 'Axiom',
    sublabel: 'Fundamental physical postulates & invariant laws',
  },
  {
    id: 'derivation',
    title: 'Derivation',
    sublabel: 'Step-by-step deductive mathematical chain',
  },
  {
    id: 'mechanism',
    title: 'Mechanism',
    sublabel: 'Emergent dynamical equations & field behavior',
  },
  {
    id: 'prediction',
    title: 'Prediction',
    sublabel: 'Verifiable experimental consequences & boundary limits',
  },
];

export const FirstPrinciplesPage: React.FC<FirstPrinciplesPageProps> = ({
  selectedTopic,
  activeContext,
  topics = [],
  onSelectTopic,
  onNavigate,
  onNewDiscussion,
}) => {
  const hasContext = Boolean(activeContext?.topicName);

  const [conceptInput, setConceptInput] = useState(
    activeContext?.topicName || ''
  );
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeContext?.topicName) {
      setConceptInput(activeContext.topicName);
    } else {
      setConceptInput('');
      setAnalysis(null);
    }
  }, [activeContext?.topicName]);

  const handleDerive = async (queryText?: string) => {
    const q = (queryText || conceptInput).trim();
    if (!q || loading) return;

    setLoading(true);
    setAnalysis(null);
    setError(null);

    try {
      const res = await fetch('/api/first-principles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_or_concept: q }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data.analysis);
        setMetadata(json.metadata);
      } else {
        throw new Error(json.error || 'Failed to derive first principles');
      }
    } catch (e: any) {
      setError(e.message || 'Error occurred during axiomatic reduction');
    } finally {
      setLoading(false);
    }
  };

  // 0 = idle/input, 1 = deriving, 3 = final constructed model
  const currentStep = loading ? 1 : analysis ? 3 : 0;

  if (!hasContext) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <EmptyContextState
          toolName="First Principles Derivation"
          toolDescription="First-Principles Deconstruction reduces complex physical phenomena to their foundational mathematical and physical laws. Please establish an active learning context to begin reduction."
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
        instrumentNumber="01"
        instrumentName="First-Principles Derivation"
        badgeLabel="AXIOMATIC REDUCTION"
        badgeVariant="violet"
        icon={Binary}
        description="Ask the foundational cognitive question: What is the SMALLEST set of facts and physical axioms from which this entire phenomenon can be derived? Strip away rote summaries to reveal the irreducible physical invariants."
        selectedTopic={selectedTopic}
        activeContext={activeContext}
        customTopicTitle={conceptInput}
        onUpdateTopicTitle={setConceptInput}
        cognitivePillars={['Minimal Axiom Base', 'Deductive Derivation', 'Non-Derivable Constants']}
      />

      {/* Visual Pipeline: Axiom → Derivation → Mechanism → Prediction */}
      <CognitivePipelineFlow
        steps={FIRST_PRINCIPLES_PIPELINE_STEPS}
        currentStepIndex={currentStep}
        accentColor="violet"
        label="AXIOMATIC DEDUCTION SEQUENCE"
      />

      {/* Main Dual-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3 & 4: Input / Problem & Reasoning Workspace */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-3.5 h-3.5 text-violet-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Concept Input
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                AXIOM EXTRACTION
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                Physical Phenomenon to Deconstruct
              </label>
              <input
                type="text"
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                placeholder="e.g. Lagrangian Mechanics or Maxwell Equations"
                className="w-full text-xs font-sans py-2.5 px-3 rounded-lg border border-white/[0.08] bg-[#07080C] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/60 focus:border-violet-500/60 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleDerive()}
              disabled={!conceptInput.trim() || loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-violet-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Deriving Foundational Axioms...</span>
                </>
              ) : (
                <>
                  <Binary className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>Derive From First Principles</span>
                </>
              )}
            </button>
          </div>

          {/* High-Yield Physics Presets */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                High-Yield Physics Systems:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Curated Presets
              </span>
            </div>

            <div className="space-y-1.5">
              {FIRST_PRINCIPLES_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setConceptInput(p.title);
                    handleDerive(p.title);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-white/[0.06] bg-[#07080C] hover:border-violet-500/40 hover:bg-[#101420] text-xs transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-sans font-semibold text-slate-200 group-hover:text-white truncate">
                      {p.title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {p.axiom}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5 & 6: AI Analysis/Evaluation & Result (Model Being Constructed) */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E16] p-5 md:p-6 shadow-sm min-h-[520px] flex flex-col justify-between">
            {loading ? (
              <div className="my-auto py-16 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
                  <Binary className="w-5 h-5 text-violet-400 absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-sans text-slate-100">
                    Constructing Deductive Physical Chain
                  </h3>
                  <p className="text-xs font-mono text-slate-400 max-w-sm">
                    Reducing physical phenomenon to minimal variational, field, and thermodynamic invariants...
                  </p>
                </div>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Result Structural Hierarchy Header */}
                <div className="border-b border-white/[0.06] pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                        Axiomatic Decomposition // Derivation
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      REDUCTION COMPLETE
                    </span>
                  </div>

                  {/* Structural Model Hierarchy Indicator */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-violet-500/30 text-violet-300">
                      1. Minimal Axiom Base
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-violet-500/30 text-violet-300">
                      2. Deductive Step Derivation
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#101420] border border-violet-500/30 text-violet-300">
                      3. Non-Derivable Constants
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      4. Invariant Predictions
                    </span>
                  </div>
                </div>

                {/* Markdown Output */}
                <div className="text-xs md:text-sm text-slate-200 leading-relaxed space-y-3">
                  <MarkdownRenderer content={analysis} />
                </div>

                {/* AI Metadata Badge */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <AiMetadataBadge
                    provider="Gemini"
                    model={metadata?.model || 'gemini-3.8-flash'}
                    timestamp={metadata?.timestamp || new Date().toISOString()}
                    classification="First-Principles Derivation"
                  />
                  <span className="text-[10px] font-mono text-slate-500">
                    Axiomatic Reduction Verified
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-auto py-16 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-[#07080C] border border-white/[0.08] flex items-center justify-center text-slate-500">
                  <Binary className="w-6 h-6 stroke-1 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold font-sans text-slate-200">
                  Ready for Axiomatic Deconstruction
                </h3>
                <p className="text-xs max-w-md font-sans text-slate-400 leading-relaxed">
                  Enter any BSc Physics concept on the left to derive the minimal foundational equations, deductive sequence, and non-derivable constants.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7: Recommended Next Action */}
      <RecommendedNextAction
        currentTool="first_principles"
        topicTitle={conceptInput}
        onNavigate={onNavigate}
      />
    </div>
  );
};
