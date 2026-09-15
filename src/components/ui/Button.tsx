import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'brand-glow' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shadow-xs hover:shadow-md hover:shadow-sky-500/20 active:scale-[0.99] border border-sky-400/40',
  'brand-glow':
    'bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#8b5cf6] hover:brightness-110 text-white font-semibold shadow-xs shadow-cyan-500/25 active:scale-[0.99] border border-cyan-400/30',
  secondary:
    'bg-white dark:bg-[#0c0e16] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#101420] hover:border-slate-300 dark:hover:border-cyan-500/30 font-medium active:scale-[0.99]',
  outline:
    'bg-transparent border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#101420] hover:border-cyan-500/30 font-medium',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#101420] font-medium',
  danger:
    'bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs active:scale-[0.99]',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs active:scale-[0.99]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'text-xs px-2.5 py-1 gap-1.5 rounded-md',
  sm: 'text-xs sm:text-sm px-3 py-1.5 gap-2 rounded-lg',
  md: 'text-sm px-4 py-2 gap-2 rounded-lg',
  lg: 'text-base px-5 py-2.5 gap-2.5 rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      disabled = false,
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = `inline-flex items-center justify-center select-none ${DESIGN_TOKENS.interactions.transition} ${DESIGN_TOKENS.interactions.focusRing}`;
    const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.secondary;
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
    const widthClass = fullWidth ? 'w-full' : '';
    const stateClass = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${stateClass} ${className}`.trim()}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : Icon ? (
          <Icon className="w-4 h-4 shrink-0" />
        ) : null}

        {children && <span className="truncate">{children}</span>}

        {!loading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
