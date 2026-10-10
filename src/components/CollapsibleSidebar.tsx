import React, { useState } from 'react';
import { NavTab, navItems } from './Navigation';
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface CollapsibleSidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  activeTab,
  setActiveTab,
  isExpanded,
  onToggleExpand,
}) => {
  const [hoveredItemId, setHoveredItemId] = useState<NavTab | null>(null);

  // Group items by category for clean visual structure when expanded
  const groups = [
    { key: 'core', label: 'Core Exploration' },
    { key: 'engine', label: 'Reasoning Engines' },
    { key: 'eval', label: 'Evaluation & Testing' },
    { key: 'system', label: 'System & Intel' },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 bg-[#07080c]/90 backdrop-blur-xl border-r border-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none sticky top-[61px] h-[calc(100vh-61px)] z-30 ${
        isExpanded ? 'w-64' : 'w-[76px]'
      }`}
    >
      {/* Top Toggle Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-[#0c0e16]/60">
        {isExpanded ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-semibold truncate">
              Navigation Rail
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
          </div>
        )}
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1.5 rounded-lg bg-[#101420] text-slate-400 hover:text-white border border-white/[0.08] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-center shrink-0"
          title={isExpanded ? 'Collapse navigation sidebar' : 'Expand navigation sidebar'}
          aria-label={isExpanded ? 'Collapse navigation sidebar' : 'Expand navigation sidebar'}
        >
          {isExpanded ? (
            <PanelLeftClose className="w-4 h-4 text-slate-300" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>

      {/* Navigation Items List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
        {groups.map((group) => {
          const groupItems = navItems.filter((item) => item.group === group.key);
          if (groupItems.length === 0) return null;

          return (
            <div key={group.key} className="space-y-1">
              {isExpanded && (
                <div className="px-2 pb-1 pt-1 text-[10px] font-mono uppercase tracking-wider text-slate-300 font-semibold truncate">
                  {group.label}
                </div>
              )}
              {!isExpanded && (
                <div className="my-1 border-t border-white/[0.06] mx-2" aria-hidden="true" />
              )}

              {groupItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <div key={item.id} className="relative group/item">
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#101420] text-slate-100 font-semibold border border-cyan-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_12px_-2px_rgba(0,0,0,0.7)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c0e16]/80 hover:border-white/[0.1] border border-transparent'
                      } ${!isExpanded ? 'justify-center px-0' : ''}`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                            : 'bg-white/[0.03] text-slate-400 group-hover/item:text-sky-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>

                      {isExpanded && (
                        <span className="flex-1 text-left truncate font-sans text-xs">
                          {item.label}
                        </span>
                      )}

                      {isActive && isExpanded && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] shrink-0" />
                      )}
                    </button>

                    {/* Tooltip when collapsed */}
                    {!isExpanded && hoveredItemId === item.id && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0c0e16] border border-white/[0.12] text-xs font-medium text-slate-100 whitespace-nowrap shadow-2xl z-50 pointer-events-none animate-fadeIn flex items-center gap-2">
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer Status / Info */}
      {isExpanded && (
        <div className="p-3 border-t border-white/[0.06] bg-[#0c0e16]/40 text-[10px] font-mono text-slate-300 flex items-center justify-between">
          <span className="truncate">MECHANISM Phy v3.8</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
        </div>
      )}
    </aside>
  );
};
