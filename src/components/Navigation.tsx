import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Minimize2,
  Binary,
  ShieldAlert,
  GitPullRequest,
  Activity,
  CheckSquare,
  FileEdit,
  Brain,
  History,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'doubt_chat'
  | 'compressor'
  | 'first_principles'
  | 'adversarial'
  | 'reverse_engineering'
  | 'simulation'
  | 'mcq_test'
  | 'reconstruction'
  | 'user_model'
  | 'history'
  | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const navItems = [
  { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, group: 'core' },
  { id: 'doubt_chat' as NavTab, label: 'Doubt Chat', icon: MessageSquare, group: 'core' },
  { id: 'compressor' as NavTab, label: 'Compressor', icon: Minimize2, group: 'engine' },
  { id: 'first_principles' as NavTab, label: 'First Principles', icon: Binary, group: 'engine' },
  { id: 'adversarial' as NavTab, label: 'Adversarial Attack', icon: ShieldAlert, group: 'engine' },
  { id: 'reverse_engineering' as NavTab, label: 'Reverse Engineering', icon: GitPullRequest, group: 'engine' },
  { id: 'simulation' as NavTab, label: 'Simulations', icon: Activity, group: 'engine' },
  { id: 'mcq_test' as NavTab, label: 'Tests / MCQs', icon: CheckSquare, group: 'eval' },
  { id: 'reconstruction' as NavTab, label: 'Reconstruction', icon: FileEdit, group: 'eval' },
  { id: 'user_model' as NavTab, label: 'Personal Model', icon: Brain, group: 'system' },
  { id: 'history' as NavTab, label: 'History', icon: History, group: 'system' },
  { id: 'settings' as NavTab, label: 'Settings', icon: Settings, group: 'system' },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bg-[#07080c]/95 backdrop-blur-md border-b border-white/[0.08] overflow-x-auto no-scrollbar py-1 select-none sticky top-[57px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-max py-0.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const prevItem = index > 0 ? navItems[index - 1] : null;
            const showSeparator = prevItem && prevItem.group !== item.group;

            return (
              <React.Fragment key={item.id}>
                {showSeparator && (
                  <div className="h-3.5 w-[1px] bg-white/[0.08] mx-1 shrink-0" aria-hidden="true" />
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap relative cursor-pointer ${
                    isActive
                      ? 'bg-[#101420] text-slate-100 font-semibold border border-cyan-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_2px_8px_-2px_rgba(0,0,0,0.6)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c0e16] hover:border-white/[0.12] hover:-translate-y-0.5 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-sky-300/80'
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
