import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Brain, Target, Compass } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface EvaluationPanelProps {
  correct: boolean;
  score?: number; // 0-100
  title?: string;
  explanation: string;
  discriminatorNote?: string;
  rootError?: string | null;
  calibrationVerdict?: string;
  calibrationAnalysis?: string;
  nextExperiment?: {
    mode?: string;
    description: string;
    target?: string;
    onExecute?: () => void;
  };
  className?: string;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  correct,
  score,
  title,
  explanation,
  discriminatorNote,
  rootError,
  calibrationVerdict,
  calibrationAnalysis,
  nextExperiment,
  className = '',
}) => {
  return (
    <Card
      variant={correct ? 'accent-cyan' : 'accent-violet'}
      padding="md"
      className={`space-y-4 ${className}`}
    >
      {/* Result Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {correct ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
          )}

          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
              {title || (correct ? 'Causal Logic Validated' : 'Mechanistic Flaw Isolated')}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {correct ? 'Deductive pathway verified' : 'Physical mechanism breakdown identified'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {score !== undefined && (
            <Badge variant={correct ? 'success' : 'danger'} size="md" dot>
              Score: {score}%
            </Badge>
          )}

          {calibrationVerdict && (
            <Badge
              variant={
                calibrationVerdict === 'Calibrated'
                  ? 'success'
                  : calibrationVerdict === 'Overconfident'
                  ? 'warning'
                  : 'neutral'
              }
              size="md"
            >
              {calibrationVerdict}
            </Badge>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Physical Explanation & Dynamical Rationale
        </h5>
        <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-[#151c2e] p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          {explanation}
        </div>
      </div>

      {/* Discriminator Note / Distractor Analysis */}
      {discriminatorNote && (
        <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
            <Target className="w-3.5 h-3.5" />
            <span>Discriminator & Distractor Trap Analysis</span>
          </div>
          <p className="leading-relaxed">{discriminatorNote}</p>
        </div>
      )}

      {/* Root Error Diagnosis */}
      {rootError && (
        <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Root Cognitive Error Detected</span>
          </div>
          <p className="leading-relaxed">{rootError}</p>
        </div>
      )}

      {/* Calibration Analysis */}
      {calibrationAnalysis && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#151c2e] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Brain className="w-3.5 h-3.5" />
            <span>Metacognitive Calibration Reflection</span>
          </div>
          <p className="leading-relaxed">{calibrationAnalysis}</p>
        </div>
      )}

      {/* Next Experiment / Targeted Prescription */}
      {nextExperiment && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-lg">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-blue-500" />
              Recommended Adaptive Follow-up
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {nextExperiment.description}
            </p>
          </div>

          {nextExperiment.onExecute && (
            <Button
              variant="brand-glow"
              size="sm"
              iconRight={ArrowRight}
              onClick={nextExperiment.onExecute}
            >
              Launch Next Test
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
