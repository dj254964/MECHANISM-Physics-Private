import React from 'react';
import { Scale } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export interface ConfidenceLevel {
  value: number; // 25, 50, 75, 100
  label: string;
  description: string;
  badge: string;
}

export const DEFAULT_CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  { value: 25, label: '25%', description: 'Low certainty / Educated intuition', badge: 'Speculative' },
  { value: 50, label: '50%', description: 'Moderate certainty / Competing causes plausible', badge: 'Plausible' },
  { value: 75, label: '75%', description: 'High certainty / Primary causal link validated', badge: 'Rigorous' },
  { value: 100, label: '100%', description: 'Absolute certainty / Pathognomonic mechanism', badge: 'Deterministic' },
];

export interface ConfidenceControlProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  levels?: ConfidenceLevel[];
  className?: string;
  showCalibrationHint?: boolean;
}

export const ConfidenceControl: React.FC<ConfidenceControlProps> = ({
  value,
  onChange,
  disabled = false,
  levels = DEFAULT_CONFIDENCE_LEVELS,
  className = '',
  showCalibrationHint = true,
}) => {
  const currentLevel = levels.find((l) => l.value === value) || levels[1];

  return (
    <div className={`space-y-2.5 ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Calibrated Confidence Estimate</span>
        </label>

        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
          {currentLevel.label} ({currentLevel.badge})
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {levels.map((lvl) => {
          const isSelected = lvl.value === value;

          return (
            <button
              key={lvl.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(lvl.value)}
              className={`
                py-2 px-1.5 sm:px-3 rounded-lg border text-center select-none
                ${DESIGN_TOKENS.interactions.transition}
                ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151c2e] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `.trim()}
            >
              <div className="text-xs sm:text-sm font-mono font-bold">{lvl.label}</div>
              <div className="text-[10px] hidden sm:block text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {lvl.badge}
              </div>
            </button>
          );
        })}
      </div>

      {showCalibrationHint && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
          {currentLevel.description}
        </p>
      )}
    </div>
  );
};
