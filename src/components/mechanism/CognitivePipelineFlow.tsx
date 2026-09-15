import React from 'react';
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

export interface PipelineStep {
  id: string;
  title: string;
  sublabel?: string;
  code?: string;
}

export interface CognitivePipelineFlowProps {
  steps: PipelineStep[];
  currentStepIndex?: number; // 0-indexed; -1 or undefined if showing overall model
  accentColor?: 'blue' | 'violet' | 'cyan';
  label?: string;
}

export const CognitivePipelineFlow: React.FC<CognitivePipelineFlowProps> = ({
  steps,
  currentStepIndex = -1,
  accentColor = 'blue',
  label = 'COGNITIVE ARCHITECTURE FLOW',
}) => {
  const accentStyles = {
    cyan: {
      activeBorder: 'border-[#60cfff]/60 bg-[#60cfff]/10 text-[#60cfff]',
      activeDot: 'bg-[#60cfff]',
      activeGlow: 'shadow-[0_0_12px_rgba(96,207,255,0.25)]',
      line: 'bg-[#60cfff]/40',
    },
    blue: {
      activeBorder: 'border-blue-500/60 bg-blue-500/10 text-blue-300',
      activeDot: 'bg-blue-400',
      activeGlow: 'shadow-[0_0_12px_rgba(59,130,246,0.25)]',
      line: 'bg-blue-500/40',
    },
    violet: {
      activeBorder: 'border-violet-500/60 bg-violet-500/10 text-violet-300',
      activeDot: 'bg-violet-400',
      activeGlow: 'shadow-[0_0_12px_rgba(124,92,255,0.25)]',
      line: 'bg-violet-500/40',
    },
  }[accentColor];

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#090d18]/90 backdrop-blur-md p-4 shadow-sm space-y-2.5 noir-card-subtle">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
        <span>{label}</span>
        <span className="text-slate-400 font-sans normal-case text-[11px]">
          {steps.length} Sequential Transformation Phases
        </span>
      </div>

      {/* Visual Pipeline with connecting lines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 relative">
        {steps.map((step, idx) => {
          const isActive = currentStepIndex === idx;
          const isCompleted = currentStepIndex > idx;
          const isUpcoming = currentStepIndex !== -1 && currentStepIndex < idx;

          return (
            <div key={step.id} className="relative flex items-center">
              {/* Card surface */}
              <div
                className={`w-full p-3 rounded-lg border transition-all duration-150 text-left hover:-translate-y-0.5 ${
                  isActive
                    ? `${accentStyles.activeBorder} ${accentStyles.activeGlow}`
                    : isCompleted
                    ? 'border-cyan-900/40 bg-[#0c1324] text-slate-200 shadow-sm'
                    : 'border-white/[0.06] bg-[#070a14] text-slate-300 hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    PHASE {idx + 1}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : isActive ? (
                    <span className={`w-2 h-2 rounded-full ${accentStyles.activeDot} animate-ping shrink-0`} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
                  )}
                </div>

                <div className="font-sans font-semibold text-xs tracking-tight text-slate-100 flex items-center gap-1.5">
                  <span>{step.title}</span>
                </div>

                {step.sublabel && (
                  <p className="text-[10px] font-mono text-slate-400 mt-1 line-clamp-1 leading-snug">
                    {step.sublabel}
                  </p>
                )}
              </div>

              {/* Connecting arrow for larger screens */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center -mr-3 z-10 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2] text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
