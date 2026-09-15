import React from 'react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export type CardVariant = 'default' | 'elevated' | 'subtle' | 'interactive' | 'accent-cyan' | 'accent-violet' | 'accent-blue';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default: `${DESIGN_TOKENS.surfaces.card} ${DESIGN_TOKENS.borders.default} border shadow-xs`,
  elevated: `${DESIGN_TOKENS.surfaces.cardElevated} ${DESIGN_TOKENS.borders.default} border shadow-sm`,
  subtle: `${DESIGN_TOKENS.surfaces.cardSubtle} ${DESIGN_TOKENS.borders.subtle} border`,
  interactive: `${DESIGN_TOKENS.surfaces.card} ${DESIGN_TOKENS.borders.default} border shadow-xs hover:border-cyan-500/40 hover:bg-[#101420] hover:shadow-sm cursor-pointer ${DESIGN_TOKENS.interactions.transition}`,
  'accent-cyan': `${DESIGN_TOKENS.surfaces.card} border border-sky-500/30 shadow-xs shadow-sky-500/5`,
  'accent-violet': `${DESIGN_TOKENS.surfaces.card} border border-violet-500/30 shadow-xs shadow-violet-500/5`,
  'accent-blue': `${DESIGN_TOKENS.surfaces.card} border border-blue-500/30 shadow-xs shadow-blue-500/5`,
};

const PADDING_STYLES = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${DESIGN_TOKENS.radii.lg} ${VARIANT_STYLES[variant]} ${PADDING_STYLES[padding]} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`flex flex-col space-y-1.5 mb-4 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => (
  <h3 className={`${DESIGN_TOKENS.typography.heading} text-base sm:text-lg flex items-center gap-2 ${className}`.trim()} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', children, ...props }) => (
  <p className={`${DESIGN_TOKENS.typography.caption} leading-normal ${className}`.trim()} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`space-y-4 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`mt-4 pt-4 border-t ${DESIGN_TOKENS.borders.default} flex items-center justify-between gap-3 ${className}`.trim()} {...props}>
    {children}
  </div>
);
