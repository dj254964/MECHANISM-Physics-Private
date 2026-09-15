import React from 'react';
import { ChevronDown } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, disabled, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className={`block ${DESIGN_TOKENS.typography.caption} font-semibold text-slate-700 dark:text-slate-300`}>
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              w-full text-sm rounded-lg border py-2 pl-3 pr-9 appearance-none
              ${DESIGN_TOKENS.surfaces.input}
              ${error ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500' : 'border-slate-200 dark:border-white/[0.08]'}
              focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25
              ${DESIGN_TOKENS.interactions.transition}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${className}
            `.trim()}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
