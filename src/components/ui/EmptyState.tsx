import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: ButtonProps['variant'];
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`
        p-8 sm:p-12 text-center rounded-xl border border-dashed ${DESIGN_TOKENS.borders.default}
        bg-slate-50/50 dark:bg-[#0c0e16]/60 flex flex-col items-center justify-center space-y-3 ${className}
      `.trim()}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#101420] text-slate-400 border border-slate-200/50 dark:border-white/[0.06] flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>

      <div className="max-w-md space-y-1">
        <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          <Button
            size="sm"
            variant={action.variant || 'secondary'}
            icon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};
