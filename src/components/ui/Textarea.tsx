import React from 'react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, disabled, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className={`block ${DESIGN_TOKENS.typography.caption} font-semibold text-slate-700 dark:text-slate-300`}>
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={`
            w-full text-sm rounded-lg border py-2 px-3
            ${DESIGN_TOKENS.surfaces.input}
            ${error ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500' : 'border-slate-200 dark:border-white/[0.08]'}
            focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25
            ${DESIGN_TOKENS.interactions.transition}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `.trim()}
          {...props}
        />

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className={`${DESIGN_TOKENS.typography.caption}`}>{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
