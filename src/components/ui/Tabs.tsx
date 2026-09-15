import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'pills' | 'underline' | 'segmented';
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  className = '',
  size = 'md',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b ${DESIGN_TOKENS.borders.default} gap-4 sm:gap-6 overflow-x-auto no-scrollbar ${className}`.trim()}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 pb-2.5 pt-1 px-1 border-b-2 text-sm font-medium whitespace-nowrap
                ${DESIGN_TOKENS.interactions.transition}
                ${
                  isActive
                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `.trim()}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-[#151c2e] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented control style (default)
  const isSm = size === 'sm';

  return (
    <div
      className={`
        inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#07080c] border ${DESIGN_TOKENS.borders.default}
        max-w-full overflow-x-auto no-scrollbar gap-1 ${className}
      `.trim()}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`
              inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap
              ${isSm ? 'text-xs px-2.5 py-1' : 'text-xs sm:text-sm px-3 py-1.5'}
              ${DESIGN_TOKENS.interactions.transition}
              ${
                isActive
                  ? 'bg-white dark:bg-[#101420] text-slate-950 dark:text-cyan-300 shadow-xs font-semibold border border-slate-200/60 dark:border-cyan-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-[#0c0e16]'
              }
              ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `.trim()}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30' : 'bg-slate-200 dark:bg-[#101420] text-slate-700 dark:text-slate-400 border border-transparent dark:border-white/[0.06]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
