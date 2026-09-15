import React, { useState, useRef, useEffect } from 'react';
import { Subject, Topic, ActiveLearningContext } from '../types';
import { Sparkles, Plus, Check, X, Edit3, MessageSquare, LogOut, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { MechanismLogo } from './branding/MechanismLogo';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  subjects: Subject[];
  topics: Topic[];
  selectedTopicId?: string;
  activeContext?: ActiveLearningContext | null;
  onSelectTopic: (id: string) => void;
  onAddCustomTopic: (name: string, subjectId?: string) => Promise<Topic | null>;
  activeModeLabel: string;
  userDisplayName?: string;
  onLogout?: () => void;
  onNavigateToSettings?: () => void;
}

const CUSTOM_TOPIC_SUGGESTIONS = [
  'Lagrangian vs Hamiltonian Mechanics',
  'Maxwell Displacement Current',
  'Quantum Tunneling & Bound States',
  'Carnot Cycle & Microscopic Entropy',
  'Fraunhofer vs Fresnel Diffraction',
  'Superconductivity & Meissner Effect',
];

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  subjects,
  topics,
  selectedTopicId,
  activeContext,
  onSelectTopic,
  onAddCustomTopic,
  activeModeLabel,
  userDisplayName,
  onLogout,
  onNavigateToSettings,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const currentTopic = topics.find((t) => t.id === selectedTopicId);
  const isCurrentCustom = currentTopic?.id.startsWith('top_custom_') || currentTopic?.is_custom;

  // Custom topics vs Curated topics
  const customTopics = topics.filter((t) => t.id.startsWith('top_custom_') || t.is_custom);
  const curatedTopics = topics.filter((t) => !t.id.startsWith('top_custom_') && !t.is_custom);

  useEffect(() => {
    if (isCustomMode) {
      inputRef.current?.focus();
    }
  }, [isCustomMode]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  const handleDropdownChange = (val: string) => {
    if (val === '__CUSTOM_NEW__') {
      setIsCustomMode(true);
      setCustomInputText('');
      setShowSuggestions(true);
    } else if (val === '__CLEAR__' || val === '') {
      onSelectTopic('');
      setIsCustomMode(false);
      setShowSuggestions(false);
    } else {
      onSelectTopic(val);
      setIsCustomMode(false);
      setShowSuggestions(false);
    }
  };

  const handleApplyCustomTopic = async (textToUse?: string) => {
    const raw = (textToUse !== undefined ? textToUse : customInputText).trim();
    if (!raw) {
      setIsCustomMode(false);
      setShowSuggestions(false);
      return;
    }

    const created = await onAddCustomTopic(raw);
    if (created) {
      onSelectTopic(created.id);
    }
    setCustomInputText('');
    setIsCustomMode(false);
    setShowSuggestions(false);
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCustomTopic();
    } else if (e.key === 'Escape') {
      setIsCustomMode(false);
      setShowSuggestions(false);
    }
  };

  const displayName = userDisplayName || 'David';

  return (
    <header className="sticky top-0 z-40 bg-[#07080c]/95 backdrop-blur-md border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* ========================================================= */}
          {/* 1. BRANDING & TITLE                                       */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 group cursor-default">
              <div className="shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <MechanismLogo size={28} glow />
              </div>
              <div className="flex flex-col justify-center leading-none">
                <span className="text-base sm:text-lg font-extrabold tracking-wider font-sans text-slate-100 uppercase select-none">
                  MECHANISM
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-sky-400 font-semibold uppercase mt-0.5 select-none">
                  PHYSICS REASONING ENGINE
                </span>
              </div>
            </div>

            {/* Compact Mode Badge for Mobile Only */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0c0e16] border border-white/[0.08] text-sky-300 text-[10px] font-mono font-medium shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)] animate-pulse" />
                <span className="truncate max-w-[130px]">{activeModeLabel}</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. REFLOWED CONTROLS FLOW                                 */}
          {/* Mode → Scope → + Custom → Active Context → Model → Profile*/}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap lg:flex-nowrap justify-between lg:justify-end flex-1">
            {/* 2.1 Mode Indicator (Desktop / Tablet) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0c0e16] border border-white/[0.07] text-slate-300 text-[11px] font-mono font-medium shadow-xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)] animate-pulse shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">MODE:</span>
              <span className="text-slate-200 font-semibold">{activeModeLabel}</span>
            </div>

            {/* 2.2 Scope Selector (Curated & Custom Topics) */}
            {isCustomMode ? (
              <div className="relative flex-1 min-w-[200px] md:w-64 lg:w-72 animate-fadeIn">
                <div className="flex items-center gap-1.5 bg-[#0c0e16] rounded-md border border-cyan-500/60 p-1 shadow-xs ring-1 ring-cyan-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1.5" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={customInputText}
                    onChange={(e) => setCustomInputText(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="Enter custom Physics topic..."
                    className="w-full text-xs bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none py-0.5 px-1 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCustomTopic()}
                    className="p-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium shrink-0 transition-all duration-150 hover:scale-105 cursor-pointer"
                    title="Apply Custom Topic (Enter)"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setShowSuggestions(false);
                    }}
                    className="p-1 rounded hover:bg-[#101420] text-slate-400 hover:text-slate-200 shrink-0 transition-colors cursor-pointer"
                    title="Cancel (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Suggestions Popover */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0c0e16] rounded-lg border border-white/[0.08] shadow-2xl p-2.5 z-50 animate-fadeIn backdrop-blur-md">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Quick Concept Ideas</span>
                      <span className="text-slate-500">Click to select</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CUSTOM_TOPIC_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleApplyCustomTopic(sug)}
                          className="text-[11px] px-2 py-1 rounded bg-[#101420] hover:bg-cyan-950/40 hover:text-cyan-300 text-slate-300 text-left transition-all duration-150 border border-white/[0.06] hover:border-cyan-500/30 cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-1 min-w-[180px] md:w-64 lg:w-72">
                <div className="relative flex-1">
                  <label htmlFor="topic-selector" className="sr-only">Active Physics Topic Scope</label>
                  <select
                    id="topic-selector"
                    value={selectedTopicId || ''}
                    onChange={(e) => handleDropdownChange(e.target.value)}
                    className="w-full text-xs font-sans py-1.5 pl-2.5 pr-7 rounded-md border border-white/[0.08] bg-[#0c0e16] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 hover:border-white/[0.14] truncate transition-all duration-150 shadow-xs cursor-pointer"
                  >
                    {!selectedTopicId && activeContext?.topicName ? (
                      <>
                        <option value="" className="text-sky-300 font-sans font-medium bg-[#0c0e16]">
                          ⚡ Active Context: {activeContext.topicName}
                        </option>
                        <option value="__CLEAR__" className="text-slate-400 font-mono bg-[#0c0e16]">
                          ✕ Clear Active Context (No Topic)
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="" className="text-slate-400 font-mono bg-[#0c0e16]">
                          Scope: No topic selected
                        </option>
                        {selectedTopicId && (
                          <option value="__CLEAR__" className="text-slate-400 font-mono bg-[#0c0e16]">
                            ✕ Clear Active Context (No Topic)
                          </option>
                        )}
                      </>
                    )}

                    <option value="__CUSTOM_NEW__" className="font-semibold text-sky-400 bg-[#0c0e16]">
                      ✨ + Custom Topic (Type your own)...
                    </option>

                    {customTopics.length > 0 && (
                      <optgroup label="⭐ Your Custom Topics" className="bg-[#0c0e16] text-slate-300">
                        {customTopics.map((t) => (
                          <option key={t.id} value={t.id} className="bg-[#0c0e16] text-slate-200">
                            📌 {t.name}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="📚 Standard Curricular Topics" className="bg-[#0c0e16] text-slate-300">
                      {curatedTopics.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#0c0e16] text-slate-200">
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 2.3 + Custom Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(true);
                    setCustomInputText(isCurrentCustom ? currentTopic?.name || '' : '');
                    setShowSuggestions(true);
                  }}
                  className={`p-1.5 rounded-md border text-xs font-medium flex items-center gap-1 transition-all duration-150 shrink-0 cursor-pointer ${
                    isCurrentCustom
                      ? 'bg-cyan-950/30 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/40 hover:-translate-y-0.5'
                      : 'border-white/[0.08] bg-[#0c0e16] text-slate-300 hover:text-white hover:bg-[#101420] hover:border-white/[0.14] hover:-translate-y-0.5'
                  }`}
                  title={isCurrentCustom ? 'Edit custom topic name' : 'Type your own custom Physics topic'}
                >
                  {isCurrentCustom ? (
                    <>
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline text-[11px] font-mono">Edit</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline text-[11px] font-mono">Custom</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 2.4 Active Learning Context Badge */}
            {activeContext?.topicName ? (
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans bg-[#101420] text-cyan-200 border border-cyan-500/25 shrink-0 max-w-[200px] shadow-xs"
                title={`Active Context: ${activeContext.topicName}\nSource: ${activeContext.source}\n${activeContext.summary || ''}`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate font-medium text-slate-200">
                  Active Context: <span className="text-cyan-300 font-semibold">{activeContext.topicName}</span>
                </span>
              </div>
            ) : (
              <div
                className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono bg-[#0c0e16] text-slate-400 border border-white/[0.06] shrink-0"
                title="No active learning context established"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                <span className="text-slate-500 font-sans">Active Context:</span>
                <span className="text-slate-400 font-semibold">None</span>
              </div>
            )}

            {/* 2.5 Gemini Model Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#0c0e16] text-slate-300 border border-white/[0.06] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
              <span className="text-slate-300 font-medium">Gemini 3 Flash</span>
            </div>

            {/* 2.6 David Profile Control with Compact Dropdown (Settings + Sign Out) */}
            <div className="relative shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  profileMenuOpen
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 ring-1 ring-cyan-500/30'
                    : 'bg-[#0c0e16] border-white/[0.08] text-slate-300 hover:text-white hover:bg-[#101420] hover:border-white/[0.14]'
                }`}
                title={`Account: ${displayName}`}
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]" />
                <span className="font-sans font-medium text-slate-200">{displayName}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                    profileMenuOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {/* Compact Noir Profile Dropdown */}
              <div
                className={`absolute right-0 top-full mt-1.5 w-48 bg-[#0c0e16] rounded-lg border border-white/[0.1] shadow-2xl p-1 z-50 origin-top-right transition-all duration-150 ease-out backdrop-blur-md ${
                  profileMenuOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                {/* User Identity Header */}
                <div className="px-2.5 py-1.5 border-b border-white/[0.06] mb-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    AUTHENTICATED SCHOLAR
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{displayName}</span>
                  </div>
                </div>

                {/* Settings Navigation Action */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (onNavigateToSettings) {
                      onNavigateToSettings();
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors flex items-center gap-2 text-left cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Settings</span>
                </button>

                {/* Sign Out Action */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors flex items-center gap-2 text-left cursor-pointer mt-0.5 border-t border-white/[0.04]"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
