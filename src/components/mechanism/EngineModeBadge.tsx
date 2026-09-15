import React from 'react';
import { Target, Zap, ShieldAlert, GitBranch, RefreshCw, Compass, Crosshair, Scale } from 'lucide-react';
import { TestEngineMode, LearningMode } from '../../types';
import { Badge, BadgeVariant } from '../ui/Badge';

export interface EngineModeBadgeProps {
  mode: TestEngineMode | LearningMode | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

interface ModeConfig {
  label: string;
  variant: BadgeVariant;
  icon: React.ComponentType<{ className?: string }>;
}

const MODE_CONFIGS: Record<string, ModeConfig> = {
  // TestEngine modes
  weakness_hunt: {
    label: 'Weakness Hunt',
    variant: 'danger',
    icon: Crosshair,
  },
  transfer_test: {
    label: 'Cross-Domain Transfer',
    variant: 'violet',
    icon: GitBranch,
  },
  mechanism_test: {
    label: 'Mechanistic Derivation',
    variant: 'blue',
    icon: Target,
  },
  first_principles: {
    label: 'First Principles',
    variant: 'cyan',
    icon: Zap,
  },
  adversarial_test: {
    label: 'Adversarial Stress Test',
    variant: 'danger',
    icon: ShieldAlert,
  },
  adversarial_model: {
    label: 'Adversarial Diagnostic',
    variant: 'danger',
    icon: ShieldAlert,
  },
  reconstruction: {
    label: 'Reconstruction',
    variant: 'purple',
    icon: RefreshCw,
  },
  calibration_test: {
    label: 'Metacognitive Calibration',
    variant: 'warning',
    icon: Scale,
  },
  exploration_test: {
    label: 'Exploration Challenge',
    variant: 'brand',
    icon: Compass,
  },
  quick_diagnostic: {
    label: 'Quick Diagnostic',
    variant: 'neutral',
    icon: Target,
  },
  mixed_adaptive: {
    label: 'Mixed Adaptive',
    variant: 'brand',
    icon: Target,
  },

  // Learning modes
  doubt_chat: {
    label: 'Doubt Chat',
    variant: 'brand',
    icon: Target,
  },
  compressor: {
    label: 'Cognitive Compressor',
    variant: 'cyan',
    icon: Zap,
  },
  adversarial: {
    label: 'Adversarial Defense',
    variant: 'danger',
    icon: ShieldAlert,
  },
  reverse_engineering: {
    label: 'Reverse Engineering',
    variant: 'violet',
    icon: GitBranch,
  },
  simulation: {
    label: 'Physics Simulation',
    variant: 'purple',
    icon: Compass,
  },
  mcq_test: {
    label: 'Adaptive Test Engine',
    variant: 'blue',
    icon: Crosshair,
  },
};

export const EngineModeBadge: React.FC<EngineModeBadgeProps> = ({ mode, size = 'sm', className = '' }) => {
  const config = MODE_CONFIGS[mode] || {
    label: mode.replace(/_/g, ' ').toUpperCase(),
    variant: 'neutral' as BadgeVariant,
    icon: Target,
  };

  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} size={size} className={className}>
      <IconComponent className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
};
