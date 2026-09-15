import React from 'react';
import { ArrowDown, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export type ReasoningStepStatus = 'validated' | 'flawed' | 'questioned' | 'neutral';

export interface ReasoningStepProps {
  stepNumber: number;
  title: string;
  rationale?: string;
  status?: ReasoningStepStatus;
  isLast?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  ReasoningStepStatus,
  { border: string; bg: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  validated: {
    border: 'border-emerald-300 dark:border-emerald-800',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    badge: 'bg-emerald-600 text-white',
    icon: Check,
  },
  flawed: {
    border: 'border-rose-300 dark:border-rose-800',
    bg: 'bg-rose-50/50 dark:bg-rose-950/20',
    badge: 'bg-rose-600 text-white',
    icon: AlertCircle,
  },
  questioned: {
    border: 'border-amber-300 dark:border-amber-800',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    badge: 'bg-amber-600 text-white',
    icon: HelpCircle,
  },
  neutral: {
    border: DESIGN_TOKENS.borders.default,
    bg: 'bg-white dark:bg-slate-900',
    badge: 'bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-950',
    icon: () => null,
  },
};

export const ReasoningStep: React.FC<ReasoningStepProps> = ({
  stepNumber,
  title,
  rationale,
  status = 'neutral',
  isLast = false,
  className = '',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.neutral;
  const StatusIcon = config.icon;

  return (
    <div className={`relative flex flex-col items-start ${className}`.trim()}>
      <div
        className={`
          w-full p-3.5 sm:p-4 rounded-xl border ${config.border} ${config.bg}
          flex items-start gap-3 shadow-xs ${DESIGN_TOKENS.interactions.transition}
        `.trim()}
      >
        <div
          className={`
            w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0
            ${config.badge}
          `.trim()}
        >
          {status !== 'neutral' ? <StatusIcon className="w-3.5 h-3.5" /> : stepNumber}
        </div>

        <div className="space-y-1 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {title}
          </p>
          {rationale && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              {rationale}
            </p>
          )}
        </div>
      </div>

      {!isLast && (
        <div className="w-full flex justify-center py-1.5 text-slate-400 dark:text-slate-600">
          <ArrowDown className="w-4 h-4 animate-pulse" />
        </div>
      )}
    </div>
  );
};
