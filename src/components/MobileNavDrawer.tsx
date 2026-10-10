import React, { useEffect } from 'react';
import { NavTab, navItems } from './Navigation';
import { MechanismLogo } from './branding/MechanismLogo';
import { X, LogOut, SlidersHorizontal, Sparkles } from 'lucide-react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userDisplayName?: string;
  onLogout?: () => void;
  onNavigateToSettings?: () => void;
  activeModeLabel: string;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  userDisplayName,
  onLogout,
  onNavigateToSettings,
  activeModeLabel,
}) => {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div className="relative w-80 max-w-[85vw] h-full bg-[#07080c]/98 backdrop-blur-2xl border-r border-white/[0.1] shadow-2xl flex flex-col z-10 animate-slideRight overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#0c0e16]/80">
          <div className="flex items-center gap-3">
            <MechanismLogo size={28} glow />
            <div className="flex flex-col justify-center leading-none">
              <span className="text-sm font-extrabold tracking-wider font-sans text-slate-100 uppercase">
                MECHANISM
              </span>
              <span className="text-[9px] font-mono tracking-widest text-sky-400 font-semibold uppercase mt-0.5">
                PHYSICS REASONING ENGINE
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#101420] text-slate-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Close navigation menu"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* User Session & Mode Info */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-[#0c0e16]/40 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span className="text-slate-300 font-medium truncate max-w-[140px]">
              {userDisplayName || 'Scholar'}
            </span>
          </div>
          <div className="px-2 py-0.5 rounded bg-sky-950/40 border border-sky-500/30 text-sky-300 text-[10px] truncate max-w-[120px]">
            {activeModeLabel}
          </div>
        </div>

        {/* Navigation Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 px-3 py-1">
            Navigation Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer min-h-[48px] ${
                  isActive
                    ? 'bg-[#101420] text-slate-100 font-semibold border border-cyan-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_12px_-2px_rgba(0,0,0,0.7)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c0e16] border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.03] text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left truncate font-sans">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0c0e16] space-y-2">
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={() => {
                onNavigateToSettings();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors border border-white/[0.06] cursor-pointer min-h-[44px]"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Settings & Architecture</span>
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors border border-rose-500/20 cursor-pointer min-h-[44px]"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
