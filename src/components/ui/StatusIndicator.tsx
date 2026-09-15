import React from 'react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export type StatusType = 'active' | 'calibrating' | 'locked' | 'live' | 'idle' | 'warning' | 'error' | 'success';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, { dot: string; text: string; defaultLabel: string; pulseColor: string }> = {
  active: {
    dot: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-400',
    defaultLabel: 'Active',
    pulseColor: 'bg-sky-400',
  },
  live: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    defaultLabel: 'Live',
    pulseColor: 'bg-emerald-400',
  },
  calibrating: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    defaultLabel: 'Calibrating',
    pulseColor: 'bg-amber-400',
  },
  locked: {
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-400',
    defaultLabel: 'Locked',
    pulseColor: 'bg-slate-300',
  },
  idle: {
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
    defaultLabel: 'Idle',
    pulseColor: 'bg-slate-300',
  },
  warning: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    defaultLabel: 'Attention Needed',
    pulseColor: 'bg-amber-400',
  },
  error: {
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-400',
    defaultLabel: 'Causal Error',
    pulseColor: 'bg-rose-400',
  },
  success: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    defaultLabel: 'Verified',
    pulseColor: 'bg-emerald-400',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = true,
  size = 'sm',
  className = '',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const displayLabel = label || config.defaultLabel;
  const isSm = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`.trim()}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulseColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>

      {displayLabel && (
        <span className={`font-mono ${isSm ? 'text-[11px]' : 'text-xs'} font-medium ${config.text}`}>
          {displayLabel}
        </span>
      )}
    </span>
  );
};
