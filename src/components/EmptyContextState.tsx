import React, { useState } from 'react';
import { Topic } from '../types';
import { NavTab } from './Navigation';
import {
  Compass,
  MessageSquare,
  Sparkles,
  Plus,
  BookOpen,
  ArrowRight,
  Layers,
  Check,
} from 'lucide-react';

interface EmptyContextStateProps {
  toolName: string;
  toolDescription?: string;
  topics?: Topic[];
  onSelectTopic?: (topicId: string) => void;
  onNavigate?: (tab: NavTab) => void;
  onNewDiscussion?: () => void;
}

export const EmptyContextState: React.FC<EmptyContextStateProps> = ({
  toolName,
  toolDescription = 'This physics reasoning instrument requires an active learning context to formulate targeted causal probes, boundary stress-tests, and first-principles physical deductions.',
  topics = [],
  onSelectTopic,
  onNavigate,
  onNewDiscussion,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const curatedTopics = topics.filter((t) => !t.id.startsWith('top_custom_') && !t.is_custom);

  const handleStartNewDiscussion = () => {
    if (onNewDiscussion) {
      onNewDiscussion();
    }
    if (onNavigate) {
      onNavigate('doubt_chat');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 space-y-6 animate-fadeIn">
      {/* Primary Empty State Hero Container */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-[#070b19] p-6 sm:p-8 shadow-2xl">
        {/* Subtle top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/60 via-indigo-500/40 to-slate-700/40" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0c142c] border border-blue-900/60 flex items-center justify-center text-blue-400 shadow-inner shrink-0">
              <Compass className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/50">
                  {toolName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  INSTRUMENT INACTIVE
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
                No Learning Context Established Yet
              </h2>
            </div>
          </div>

          {/* Telemetry Status Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono shrink-0">
            <div className="px-2.5 py-1 rounded bg-[#0b1020] border border-slate-800 text-slate-400">
              <span className="text-slate-500 mr-1.5 font-sans">Scope:</span>
              <span className="text-slate-300 font-semibold">No topic selected</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#0b1020] border border-slate-800 text-slate-400">
              <span className="text-slate-500 mr-1.5 font-sans">Active Context:</span>
              <span className="text-slate-400 font-semibold italic">None</span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl mt-5">
          {toolDescription} MECHANISM does not assign default topics on startup. Establish context through inquiry in Doubt Engine or explicitly activate a curricular concept below.
        </p>

        {/* 3 Core Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Action 1: Continue in Doubt Chat */}
          <button
            type="button"
            onClick={() => onNavigate?.('doubt_chat')}
            className="group p-4 rounded-xl border border-blue-900/50 bg-[#0a1124] hover:bg-[#0e1935] hover:border-blue-700/60 text-left transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mt-3 group-hover:text-white">
                Continue in Doubt Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Discuss physics concepts, derivations, and problem sets. MECHANISM extracts context dynamically from your dialogue.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-blue-400 font-medium">
              → Open Chat
            </div>
          </button>

          {/* Action 2: Start a New Discussion */}
          <button
            type="button"
            onClick={handleStartNewDiscussion}
            className="group p-4 rounded-xl border border-indigo-900/40 bg-[#090d20] hover:bg-[#0e1430] hover:border-indigo-700/50 text-left transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mt-3 group-hover:text-white">
                Start a New Discussion
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Begin a clean session with zero residual context. As your mechanistic inquiry develops, the new context is securely registered.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-indigo-400 font-medium">
              → Reset to Blank Session
            </div>
          </button>
        </div>

        {/* Action 3: Explicit Predefined Topic Selector */}
        {curatedTopics.length > 0 && onSelectTopic && (
          <div className="mt-7 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Or Explicitly Select a Predefined Topic
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-sans">
                Activates context immediately across all engine tools
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {curatedTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onSelectTopic(topic.id)}
                  className="p-3 rounded-lg border border-slate-800 bg-[#0a0f1d] hover:bg-[#11172c] hover:border-blue-800/70 text-left transition-colors flex flex-col justify-between group"
                >
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 group-hover:text-blue-400 transition-colors">
                      {topic.chapter || 'Curricular Focus'}
                    </div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white mt-0.5 line-clamp-1">
                      {topic.name}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                    <span>Activate Context</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
