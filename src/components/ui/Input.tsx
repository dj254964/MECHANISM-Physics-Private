import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon: Icon, iconRight: IconRight, className = '', id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className={`block ${DESIGN_TOKENS.typography.caption} font-semibold text-slate-700 dark:text-slate-300`}>
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3 pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full text-sm rounded-lg border py-2 px-3
              ${Icon ? 'pl-9' : 'pl-3'}
              ${IconRight ? 'pr-9' : 'pr-3'}
              ${DESIGN_TOKENS.surfaces.input}
              ${error ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500' : 'border-slate-200 dark:border-white/[0.08]'}
              focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25
              ${DESIGN_TOKENS.interactions.transition}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${className}
            `.trim()}
            {...props}
          />

          {IconRight && (
            <div className="absolute right-3 pointer-events-none text-slate-400">
              <IconRight className="w-4 h-4" />
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className={`${DESIGN_TOKENS.typography.caption}`}>{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
