import React from 'react';
import { Sparkles, Clock, ShieldAlert } from 'lucide-react';

interface AiMetadataBadgeProps {
  provider?: string;
  model?: string;
  timestamp?: string;
  classification?: string;
}

export const AiMetadataBadge: React.FC<AiMetadataBadgeProps> = ({
  provider = 'MECHANISM',
  model = 'gemini-3.7-flash',
  timestamp,
  classification,
}) => {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs py-1 px-2.5 rounded-md bg-[#101420] border border-white/[0.08] text-slate-300 w-fit shadow-xs">
      <div className="flex items-center gap-1.5 font-medium text-sky-300">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span className="font-mono text-[11px]">{provider}</span>
      </div>

      <span className="text-slate-700">•</span>

      <span className="font-mono text-[10px] text-slate-400">
        {model}
      </span>

      {classification && (
        <>
          <span className="text-slate-700">•</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#151c2e] text-sky-300 border border-sky-800/40">
            {classification}
          </span>
        </>
      )}

      {formattedTime && (
        <>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{formattedTime}</span>
          </div>
        </>
      )}
    </div>
  );
};

export const AntiOveranalysisBanner: React.FC<{ message?: string }> = ({
  message = 'STOP — SUFFICIENT INVARIANTS IDENTIFIED. COMMIT.',
}) => {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-500/50 bg-[#161208] text-amber-200 shadow-sm">
      <div className="p-1 rounded bg-amber-500/20 text-amber-400 font-bold text-xs mt-0.5 border border-amber-500/40 shrink-0">
        <ShieldAlert className="w-4 h-4" />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-xs tracking-wider font-mono uppercase text-amber-300">
          {message}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          Sufficient experimental discriminator variables have been acquired to resolve the state parameters. Additional measurements incur cognitive drag without altering physical resolution.
        </p>
      </div>
    </div>
  );
};

