import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

export type CognitiveStatus = 'mastered' | 'developing' | 'unstable' | 'emerging' | 'critical';

export interface CognitiveMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: CognitiveStatus;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  progress?: number; // 0-100
  target?: number;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
}

const STATUS_BADGES: Record<CognitiveStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'brand' | 'neutral' }> = {
  mastered: { label: 'Mastered', variant: 'success' },
  developing: { label: 'Developing', variant: 'brand' },
  unstable: { label: 'Unstable', variant: 'warning' },
  emerging: { label: 'Emerging', variant: 'neutral' },
  critical: { label: 'Fragile Link', variant: 'danger' },
};

export const CognitiveMetricCard: React.FC<CognitiveMetricCardProps> = ({
  title,
  value,
  subtitle,
  status,
  trend,
  trendDirection = 'up',
  progress,
  target,
  icon: Icon,
  className = '',
  onClick,
}) => {
  const statusInfo = status ? STATUS_BADGES[status] : undefined;
  const isClickable = Boolean(onClick);

  return (
    <Card
      variant={isClickable ? 'interactive' : 'default'}
      padding="sm"
      className={`relative overflow-hidden flex flex-col justify-between ${className}`}
      onClick={onClick}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#151c2e] text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-transparent dark:border-slate-800">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
              {title}
            </span>
          </div>

          {statusInfo && (
            <Badge variant={statusInfo.variant} size="xs" dot>
              {statusInfo.label}
            </Badge>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-950 dark:text-white">
            {value}
          </span>

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${
                trendDirection === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendDirection === 'down'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500'
              }`}
            >
              {trendDirection === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : trendDirection === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {trend}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <ProgressBar
            value={progress}
            target={target}
            size="xs"
            variant={status === 'mastered' ? 'success' : status === 'unstable' ? 'warning' : 'brand'}
          />
        </div>
      )}
    </Card>
  );
};
