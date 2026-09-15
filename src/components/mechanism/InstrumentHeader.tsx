import React from 'react';
import { LucideIcon, Target, BookOpen } from 'lucide-react';
import { Topic, ActiveLearningContext } from '../../types';

export interface InstrumentHeaderProps {
  instrumentNumber: string; // e.g., "01", "02", "03"
  instrumentName: string; // e.g., "Mechanism Compressor"
  badgeLabel: string; // e.g., "COGNITIVE COMPRESSOR"
  badgeVariant?: 'blue' | 'violet' | 'cyan';
  icon: LucideIcon;
  description: string;
  selectedTopic?: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  customTopicTitle?: string;
  onUpdateTopicTitle?: (title: string) => void;
  cognitivePillars?: string[];
}

export const InstrumentHeader: React.FC<InstrumentHeaderProps> = ({
  instrumentNumber,
  instrumentName,
  badgeLabel,
  badgeVariant = 'blue',
  icon: Icon,
  description,
  selectedTopic,
  activeContext,
  customTopicTitle,
  onUpdateTopicTitle,
  cognitivePillars,
}) => {
  const badgeColorStyles = {
    cyan: 'bg-[#60cfff]/10 text-[#60cfff] border-[#60cfff]/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  }[badgeVariant];

  const dotColor = {
    cyan: 'bg-[#60cfff]',
    blue: 'bg-blue-400',
    violet: 'bg-violet-400',
  }[badgeVariant];

  const currentTitle = customTopicTitle || activeContext?.topicName || selectedTopic?.name || '';
  const hasActiveContext = Boolean(currentTitle);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#090d18]/90 backdrop-blur-md shadow-[0_8px_32px_-4px_rgba(0,0,0,0.7)] overflow-hidden noir-card-subtle">
      {/* Top subtle highlight gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="p-5 md:p-6 space-y-4">
        {/* Row 1: System Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Small blue/violet system badge identifying the instrument */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border ${badgeColorStyles}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
              <Icon className="w-3 h-3 shrink-0" />
              <span>INSTRUMENT {instrumentNumber} // {badgeLabel}</span>
            </div>

            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500">
              PHYSICS ENGINE v3.8
            </span>
          </div>

          {/* Cognitive Pillars or Invariant rules */}
          {cognitivePillars && cognitivePillars.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400">
              {cognitivePillars.map((pillar, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-600">•</span>}
                  <span className="px-1.5 py-0.5 rounded bg-[#0c1222] border border-white/[0.06] text-slate-300">
                    {pillar}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: Software Typography Heading */}
        <div className="space-y-1.5">
          <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2.5">
            <span>{instrumentName}</span>
          </h1>
          <p className="text-xs md:text-sm font-sans text-slate-300 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Row 3: Active Target Topic Context */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span className="text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-400" />
              <span>ACTIVE CONTEXT:</span>
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#060a16] border border-slate-800 text-slate-200 font-sans font-medium text-xs">
              <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
              {hasActiveContext ? (
                <>
                  <span className="truncate max-w-[260px] sm:max-w-md text-slate-100 font-semibold">{currentTitle}</span>
                  {activeContext?.source === 'doubt_chat' && (
                    <span className="text-[10px] font-mono text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 ml-1 shrink-0">
                      Doubt Chat
                    </span>
                  )}
                  {selectedTopic?.subject_name && !activeContext?.source && (
                    <span className="text-[10px] font-mono text-slate-400 px-1 py-0.2 rounded bg-slate-800/60 border border-slate-700/60 ml-1 shrink-0">
                      {selectedTopic.subject_name}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500 italic">No active learning context</span>
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${hasActiveContext ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            <span>{hasActiveContext ? 'Physical Model Validation Active' : 'Awaiting Learning Context'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
