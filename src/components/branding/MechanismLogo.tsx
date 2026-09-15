import React from 'react';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
export type LogoVariant = 'mark' | 'full';

export interface MechanismLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  glow?: boolean;
  alt?: string;
}

const SIZE_PRESETS: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', { mark: { width: number; height: number }; full: { width: number; height: number } }> = {
  xs: {
    mark: { width: 20, height: 20 },
    full: { width: 80, height: 20 },
  },
  sm: {
    mark: { width: 24, height: 24 },
    full: { width: 96, height: 24 },
  },
  md: {
    mark: { width: 32, height: 32 },
    full: { width: 128, height: 32 },
  },
  lg: {
    mark: { width: 44, height: 44 },
    full: { width: 176, height: 44 },
  },
  xl: {
    mark: { width: 64, height: 64 },
    full: { width: 256, height: 64 },
  },
  '2xl': {
    mark: { width: 96, height: 96 },
    full: { width: 384, height: 96 },
  },
};

export const MechanismLogo: React.FC<MechanismLogoProps> = ({
  size = 'md',
  variant = 'mark',
  className = '',
  glow = false,
  alt = variant === 'mark' ? 'MECHANISM Mark' : 'MECHANISM Logo',
}) => {
  let width: number;
  let height: number;

  if (typeof size === 'number') {
    height = size;
    width = variant === 'full' ? size * 4 : size;
  } else {
    const preset = SIZE_PRESETS[size] || SIZE_PRESETS.md;
    const dimensions = variant === 'full' ? preset.full : preset.mark;
    width = dimensions.width;
    height = dimensions.height;
  }

  const src = variant === 'full' ? '/branding/mechanism-logo.svg' : '/branding/mechanism-mark.svg';

  const glowStyles = glow
    ? 'drop-shadow-[0_0_12px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_0_20px_rgba(139,92,246,0.38)]'
    : '';

  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt}
      loading="eager"
      decoding="async"
      className={`inline-block select-none shrink-0 transition-transform duration-200 ${glowStyles} ${className}`.trim()}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};
