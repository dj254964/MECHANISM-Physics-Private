import React from 'react';

export type ProgressVariant = 'brand' | 'blue' | 'cyan' | 'violet' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'xs' | 'sm' | 'md';

export interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: ProgressVariant;
  size?: ProgressSize;
  label?: string;
  showValue?: boolean;
  target?: number; // Optional reference marker (e.g., 75%)
  className?: string;
}

const FILL_VARIANTS: Record<ProgressVariant, string> = {
  brand: 'bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#8b5cf6]',
  blue: 'bg-blue-500 dark:bg-blue-400',
  cyan: 'bg-sky-400 dark:bg-sky-400',
  violet: 'bg-violet-500 dark:bg-violet-400',
  success: 'bg-emerald-500 dark:bg-emerald-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-rose-500 dark:bg-rose-400',
};

const HEIGHT_VARIANTS: Record<ProgressSize, string> = {
  xs: 'h-1.5',
  sm: 'h-2',
  md: 'h-3',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'brand',
  size = 'sm',
  label,
  showValue = false,
  target,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const fillClass = FILL_VARIANTS[variant] || FILL_VARIANTS.brand;
  const heightClass = HEIGHT_VARIANTS[size] || HEIGHT_VARIANTS.sm;

  return (
    <div className={`w-full space-y-1.5 ${className}`.trim()}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValue && <span className="font-mono text-slate-500 dark:text-slate-400">{Math.round(clampedValue)}%</span>}
        </div>
      )}

      <div className={`relative w-full rounded-full bg-slate-100 dark:bg-[#101420] border border-transparent dark:border-white/[0.06] overflow-hidden ${heightClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillClass}`}
          style={{ width: `${clampedValue}%` }}
        />

        {target !== undefined && target > 0 && target < 100 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-300 z-10"
            style={{ left: `${target}%` }}
            title={`Target: ${target}%`}
          />
        )}
      </div>
    </div>
  );
};
