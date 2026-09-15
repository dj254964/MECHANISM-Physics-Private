import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

const MAX_WIDTH_CLASSES: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full', string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = '7xl',
  className = '',
  children,
  ...props
}) => {
  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth] || MAX_WIDTH_CLASSES['7xl'];

  return (
    <div
      className={`w-full ${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};
