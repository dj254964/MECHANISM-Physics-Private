/**
 * MECHANISM Central Design Tokens & Semantic System
 * Single source of truth for colors, typography, surfaces, radiuses, and effects.
 */

export const DESIGN_TOKENS = {
  // Brand Palette (Electric Cyan / Sky Blue -> Deep Blue -> Indigo -> Violet)
  brand: {
    cyan: '#38bdf8',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    gradient: 'from-[#38bdf8] via-[#3b82f6] to-[#8b5cf6]',
    gradientText: 'bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.18)] dark:shadow-[0_0_25px_rgba(56,189,248,0.22)]',
    glowRing: 'ring-1 ring-cyan-500/30 dark:ring-cyan-500/35',
  },

  // Surfaces & Backgrounds (Deep noir/obsidian system: #07080C / #0C0E16)
  surfaces: {
    appBg: 'bg-[#f8fafc] dark:bg-[#07080c]',
    appBgSecondary: 'bg-[#f1f5f9] dark:bg-[#0c0e16]',
    card: 'bg-white dark:bg-[#0c0e16]',
    cardElevated: 'bg-slate-50 dark:bg-[#101420]',
    cardSubtle: 'bg-slate-100/70 dark:bg-[#090b10]',
    glass: 'backdrop-blur-md bg-white/80 dark:bg-[#0c0e16]/90',
    input: 'bg-white dark:bg-[#07080c] border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-slate-100',
  },

  // Borders & Dividers
  borders: {
    default: 'border-slate-200 dark:border-white/[0.08]',
    subtle: 'border-slate-100 dark:border-white/[0.05]',
    highlight: 'border-cyan-400/50 dark:border-cyan-500/40',
    active: 'border-cyan-500 dark:border-cyan-400',
  },

  // Semantic Status Colors (Restrained, functional, technical)
  status: {
    success: {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      dot: 'bg-emerald-500',
    },
    warning: {
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/40',
      dot: 'bg-amber-500',
    },
    danger: {
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-800/40',
      dot: 'bg-rose-500',
    },
    brand: {
      text: 'text-sky-700 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      border: 'border-sky-200 dark:border-sky-800/40',
      dot: 'bg-sky-400',
    },
    violet: {
      text: 'text-violet-700 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-200 dark:border-violet-800/40',
      dot: 'bg-violet-500',
    },
    neutral: {
      text: 'text-slate-700 dark:text-slate-300',
      bg: 'bg-slate-100 dark:bg-[#101420]',
      border: 'border-slate-200 dark:border-white/[0.08]',
      dot: 'bg-slate-400',
    },
  },

  // Typography Class Combinations (Modern Technical Product)
  typography: {
    display: 'font-sans font-extrabold tracking-tight text-slate-900 dark:text-white',
    heading: 'font-sans font-bold tracking-tight text-slate-900 dark:text-slate-100',
    subheading: 'font-sans font-semibold tracking-tight text-slate-800 dark:text-slate-200',
    body: 'font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed',
    caption: 'font-sans text-xs text-slate-500 dark:text-slate-400',
    eyebrow: 'font-mono text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400',
    mono: 'font-mono text-xs text-slate-700 dark:text-slate-300',
  },

  // Radii (Precision radii: 6px - 12px)
  radii: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },

  // Focus & Transitions
  interactions: {
    focusRing: 'focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:focus:ring-cyan-400/40 focus:border-transparent',
    transition: 'transition-all duration-150 ease-in-out',
  },
} as const;
