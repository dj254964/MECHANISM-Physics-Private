import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export type BadgeVariant =
  | 'brand'
  | 'cyan'
  | 'blue'
  | 'violet'
  | 'purple'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'outline'
  | 'mono';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: LucideIcon;
}

const VARIANT_MAP: Record<BadgeVariant, { container: string; dot: string }> = {
  brand: {
    container: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
    dot: 'bg-sky-400',
  },
  cyan: {
    container: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
    dot: 'bg-sky-400',
  },
  blue: {
    container: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
    dot: 'bg-blue-500',
  },
  violet: {
    container: 'bg-violet-50/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30',
    dot: 'bg-violet-400',
  },
  purple: {
    container: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
    dot: 'bg-purple-400',
  },
  success: {
    container: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  warning: {
    container: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    dot: 'bg-amber-400',
  },
  danger: {
    container: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    dot: 'bg-rose-400',
  },
  neutral: {
    container: 'bg-slate-100 dark:bg-[#101420] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]',
    dot: 'bg-slate-400',
  },
  outline: {
    container: 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]',
    dot: 'bg-slate-400',
  },
  mono: {
    container: 'bg-slate-100 dark:bg-[#101420] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] font-mono tracking-wider uppercase',
    dot: 'bg-sky-400',
  },
};

const SIZE_MAP: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon: Icon,
  className = '',
  children,
  ...props
}) => {
  const { container, dot: dotColor } = VARIANT_MAP[variant] || VARIANT_MAP.neutral;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;

  return (
    <span
      className={`inline-flex items-center font-medium border ${DESIGN_TOKENS.radii.full} ${container} ${sizeClass} select-none ${className}`.trim()}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
};
