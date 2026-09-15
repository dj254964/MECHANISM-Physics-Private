import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';
import { Badge } from './Badge';

export interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  eyebrowVariant?: 'brand' | 'violet' | 'cyan' | 'neutral' | 'mono';
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  eyebrowVariant = 'mono',
  icon: Icon,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`
        p-5 sm:p-6 rounded-xl border ${DESIGN_TOKENS.borders.default} ${DESIGN_TOKENS.surfaces.card}
        flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${className}
      `.trim()}
    >
      <div className="space-y-1.5 max-w-3xl">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={eyebrowVariant} size="xs">
              {eyebrow}
            </Badge>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-sans tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          {Icon && <Icon className="w-6 h-6 text-sky-500 dark:text-sky-400 shrink-0" />}
          <span>{title}</span>
        </h1>

        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
