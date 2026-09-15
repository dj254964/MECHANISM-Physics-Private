import React from 'react';
import { ArrowRight, ShieldAlert, Binary, Minimize2, Compass, Crosshair, MessageSquareCode, Brain } from 'lucide-react';

export interface NextActionItem {
  id: string;
  tab: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  priority?: boolean;
}

export interface RecommendedNextActionProps {
  currentTool: 'compressor' | 'first_principles' | 'reverse_engineering' | 'adversarial' | 'simulation' | 'test_engine' | 'mcq_test' | 'reconstruction';
  topicTitle?: string;
  onNavigate?: (tab: any) => void;
  overallScore?: number;
  modelVulnerable?: boolean;
}

export const RecommendedNextAction: React.FC<RecommendedNextActionProps> = ({
  currentTool,
  topicTitle,
  onNavigate,
  overallScore,
  modelVulnerable,
}) => {
  // Determine contextual next actions depending on tool and performance
  const getActions = (): NextActionItem[] => {
    if (currentTool === 'test_engine' || currentTool === 'mcq_test') {
      return [
        {
          id: 'user_model',
          tab: 'user_model',
          title: 'Personal Cognitive Flaw Model',
          description: 'Inspect updated error clusters, Brier calibration curves, and hierarchical misconception trees.',
          icon: Brain,
          tag: 'DIAGNOSTIC TELEMETRY',
          priority: true,
        },
        {
          id: 'compressor',
          tab: 'compressor',
          title: 'Mechanism Compressor',
          description: 'Compress the tested physical principle into an irreducible 6-step causal sequence.',
          icon: Minimize2,
          tag: 'INSTRUMENT 02 // COMPRESS',
        },
        {
          id: 'adversarial',
          tab: 'adversarial',
          title: 'Adversarial Stress Test',
          description: 'Subject your mental model to boundary attacks and counter-examples to falsify assumptions.',
          icon: ShieldAlert,
          tag: 'STAGE 3 // STRESS TEST',
        },
      ];
    }
    if (currentTool === 'reconstruction') {
      return [
        {
          id: 'adversarial',
          tab: 'adversarial',
          title: 'Adversarial Model Stress Test',
          description: 'Stress-test the reconstructed causal links against boundary perturbations and counterexamples.',
          icon: ShieldAlert,
          tag: 'STAGE 3 // STRESS TEST',
          priority: true,
        },
        {
          id: 'mcq_test',
          tab: 'mcq_test',
          title: 'Adaptive Diagnostic Engine',
          description: 'Subject your consolidated memory model to competitive physical diagnostic probes.',
          icon: Crosshair,
          tag: 'ASSESSMENT // TEST',
        },
        {
          id: 'compressor',
          tab: 'compressor',
          title: 'Mechanism Compressor',
          description: 'Refine and compress the verified dynamical mechanism into an invariant 6-step causal rule.',
          icon: Minimize2,
          tag: 'INSTRUMENT 02 // COMPRESS',
        },
      ];
    }
    if (currentTool === 'simulation') {
      return [
        {
          id: 'compressor',
          tab: 'compressor',
          title: 'Mechanism Compressor',
          description: 'Harden your mental model by compressing the resolved physical experiment into an invariant 6-step causal rule.',
          icon: Minimize2,
          tag: 'INSTRUMENT 02 // COMPRESS',
          priority: true,
        },
        {
          id: 'adversarial',
          tab: 'adversarial',
          title: 'Adversarial Stress Attack',
          description: 'Stress-test the identified dynamical variables against counter-factual states and boundary limits.',
          icon: ShieldAlert,
          tag: 'STAGE 3 // STRESS TEST',
        },
        {
          id: 'mcq_test',
          tab: 'mcq_test',
          title: 'Adaptive Discriminator MCQs',
          description: 'Validate physical discrimination under timed problem-solving scenarios.',
          icon: Crosshair,
          tag: 'ASSESSMENT // TEST',
        },
      ];
    }
    if (currentTool === 'adversarial') {
      return [
        {
          id: 'compressor',
          tab: 'compressor',
          title: 'Mechanism Compressor',
          description: modelVulnerable
            ? 'Reformulate and seal the exposed causal vulnerability into an invariant rate-limiting sequence.'
            : 'Distill this robust mechanism into its minimal six-step causal statement.',
          icon: Minimize2,
          tag: 'INSTRUMENT 02 // HARDEN MODEL',
          priority: true,
        },
        {
          id: 'first_principles',
          tab: 'first_principles',
          title: 'First-Principles Reduction',
          description: 'Determine whether the attacked assumption is mathematically derivable or empirical convention.',
          icon: Binary,
          tag: 'INSTRUMENT 01 // AXIOMATIC',
        },
        {
          id: 'simulation',
          tab: 'simulation',
          title: 'Physical Experiment Simulation',
          description: 'Observe dynamic non-linear responses when these boundary stressors are applied to the apparatus.',
          icon: Compass,
          tag: 'APPLIED // SIMULATION',
        },
      ];
    }
    if (currentTool === 'compressor') {
      const needsHardening = overallScore !== undefined && overallScore < 75;
      return [
        {
          id: 'adversarial',
          tab: 'adversarial',
          title: 'Adversarial Stress Test',
          description: needsHardening
            ? 'Expose identified causal gaps against challenging counter-factual scenarios.'
            : 'Subject the compressed invariant mechanism to extreme physical stressors.',
          icon: ShieldAlert,
          tag: 'STAGE 3 // ATTACK',
          priority: true,
        },
        {
          id: 'first_principles',
          tab: 'first_principles',
          title: 'First-Principles Reduction',
          description: 'Deconstruct this mechanism down to minimal thermodynamic, Lagrangian & quantum axioms.',
          icon: Binary,
          tag: 'INSTRUMENT 01 // AXIOMATIC',
        },
        {
          id: 'mcq_test',
          tab: 'mcq_test',
          title: 'Adaptive Discriminator MCQs',
          description: 'Assess predictive precision on high-yield physical problem discriminators.',
          icon: Crosshair,
          tag: 'ASSESSMENT // TEST',
        },
      ];
    }

    if (currentTool === 'first_principles') {
      return [
        {
          id: 'compressor',
          tab: 'compressor',
          title: 'Mechanism Compressor',
          description: 'Draft your explanation of the derived phenomenon and verify causal directionality.',
          icon: Minimize2,
          tag: 'INSTRUMENT 02 // COMPRESS',
          priority: true,
        },
        {
          id: 'simulation',
          tab: 'simulation',
          title: 'Physical Experiment Simulation',
          description: 'Witness these dynamical axioms govern real-time state trajectories in an active system.',
          icon: Compass,
          tag: 'APPLIED // SIMULATION',
        },
        {
          id: 'adversarial',
          tab: 'adversarial',
          title: 'Boundary Stress Attack',
          description: 'Challenge derived invariants with perturbation edge cases and symmetry-breaking states.',
          icon: ShieldAlert,
          tag: 'STAGE 3 // STRESS TEST',
        },
      ];
    }

    // reverse_engineering
    return [
      {
        id: 'simulation',
        tab: 'simulation',
        title: 'Physical Experiment Simulation',
        description: 'Test your deduced discriminator tests and observe real-time phase space trajectory changes.',
        icon: Compass,
        tag: 'APPLIED // SIMULATION',
        priority: true,
      },
      {
        id: 'compressor',
        tab: 'compressor',
        title: 'Compress Dynamical Chain',
        description: 'Formulate the verified mechanics into a compact 6-step invariant causal statement.',
        icon: Minimize2,
        tag: 'INSTRUMENT 02 // COMPRESS',
      },
      {
        id: 'doubt_chat',
        tab: 'doubt_chat',
        title: 'Doubt Engine Deep Probe',
        description: 'Examine unresolved theoretical paradoxes or ambiguous measurement values with the AI tutor.',
        icon: MessageSquareCode,
        tag: 'INQUIRY // DIALOGUE',
      },
    ];
  };

  const actions = getActions();

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0a0f1e] p-5 md:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Recommended Next Action // Cognitive Trajectory
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Reinforce Model Stability
        </span>
      </div>

      <p className="text-xs text-slate-400 font-sans leading-relaxed">
        True physical intuition requires exercising the mental model across multiple cognitive modalities. Proceed to the next instrument to lock in deep understanding:
      </p>

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              className={`p-4 rounded-lg border transition-all flex flex-col justify-between group ${
                act.priority
                  ? 'border-blue-500/40 bg-[#0e172e] hover:border-blue-400/70 hover:bg-[#121c38]'
                  : 'border-slate-800/80 bg-[#070b16] hover:border-slate-700 hover:bg-[#0c1224]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-mono tracking-wider text-blue-400 font-semibold uppercase">
                    {act.tag}
                  </span>
                  {act.priority && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      OPTIMAL NEXT STEP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs font-sans group-hover:text-white">
                  <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{act.title}</span>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {act.description}
                </p>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(act.tab)}
                  className="mt-3.5 w-full py-1.5 px-2.5 rounded-md bg-[#080d1c] border border-slate-800 hover:border-blue-500/50 hover:bg-blue-600/10 text-slate-300 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Launch Instrument</span>
                  <ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
