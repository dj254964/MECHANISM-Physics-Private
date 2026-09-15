import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  inline?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Processing physical reasoning...',
  subMessage,
  inline = false,
  className = '',
}) => {
  if (inline) {
    return (
      <div className={`inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ${className}`.trim()}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        p-8 sm:p-12 text-center rounded-xl border ${DESIGN_TOKENS.borders.default}
        bg-white/60 dark:bg-[#0c0e16]/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 ${className}
      `.trim()}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-white/[0.08] border-t-sky-400 dark:border-t-sky-400 animate-spin" />
        <div className="absolute w-2 h-2 rounded-full bg-violet-400 dark:bg-violet-400 animate-pulse" />
      </div>

      <div className="max-w-xs space-y-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {message}
        </p>
        {subMessage && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
};
