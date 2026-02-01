/**
 * Centralized theme color palettes for the Report Viewing System.
 *
 * This module consolidates all theme-aware color mappings that were previously
 * duplicated across badge, card, and other components. It provides:
 * - Type-safe color palette definitions for both themes (swiss/radar)
 * - Utility functions to get themed colors
 * - A useThemedColors hook for React components
 *
 * NOTE: For new code, prefer using the semantic color system via:
 * - semanticColors.ts - Pure type definitions and color mappings
 * - SemanticColorContext.tsx - React context and hooks
 *
 * The semantic system provides meaning-based colors (e.g., 'highConfidence')
 * rather than appearance-based colors (e.g., 'emerald').
 */

// ============================================================================
// Core Types
// ============================================================================

export type ThemeName = 'swiss' | 'radar';

/** Base color names used across the system */
export type BaseColor =
  | 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'green'
  | 'indigo' | 'rose' | 'cyan' | 'violet' | 'purple' | 'orange' | 'pink';

/** Themed class string (Tailwind classes) */
export type ThemedClasses = string;

// ============================================================================
// Badge Color Palettes
// ============================================================================

/** Finding type badge colors */
export const findingTypeColors = {
  swiss: {
    fact: 'bg-indigo-100 text-indigo-700',
    claim: 'bg-slate-100 text-slate-700',
    event: 'bg-emerald-100 text-emerald-700',
    actor: 'bg-rose-100 text-rose-700',
    relationship: 'bg-amber-100 text-amber-700',
    pattern: 'bg-cyan-100 text-cyan-700',
    gap: 'bg-violet-100 text-violet-700',
    evidence: 'bg-green-100 text-green-700',
  },
  radar: {
    fact: 'bg-indigo-500/20 text-indigo-400',
    claim: 'bg-slate-500/20 text-slate-400',
    event: 'bg-emerald-500/20 text-emerald-400',
    actor: 'bg-rose-500/20 text-rose-400',
    relationship: 'bg-amber-500/20 text-amber-400',
    pattern: 'bg-cyan-500/20 text-cyan-400',
    gap: 'bg-violet-500/20 text-violet-400',
    evidence: 'bg-green-500/20 text-green-400',
  },
  fallback: {
    swiss: 'bg-slate-100 text-slate-600',
    radar: 'bg-slate-500/20 text-slate-400',
  },
} as const;

export type FindingType = keyof typeof findingTypeColors.swiss;

/** Source type badge colors */
export const sourceTypeColors = {
  swiss: {
    news: 'bg-blue-100 text-blue-700',
    academic: 'bg-purple-100 text-purple-700',
    government: 'bg-green-100 text-green-700',
    corporate: 'bg-slate-100 text-slate-700',
    blog: 'bg-orange-100 text-orange-700',
    social: 'bg-pink-100 text-pink-700',
    wiki: 'bg-cyan-100 text-cyan-700',
  },
  radar: {
    news: 'bg-blue-500/20 text-blue-400',
    academic: 'bg-purple-500/20 text-purple-400',
    government: 'bg-green-500/20 text-green-400',
    corporate: 'bg-slate-500/20 text-slate-400',
    blog: 'bg-orange-500/20 text-orange-400',
    social: 'bg-pink-500/20 text-pink-400',
    wiki: 'bg-cyan-500/20 text-cyan-400',
  },
  fallback: {
    swiss: 'bg-slate-100 text-slate-600',
    radar: 'bg-slate-500/20 text-slate-400',
  },
} as const;

export type SourceType = keyof typeof sourceTypeColors.swiss;

/** Priority badge colors */
export const priorityColors = {
  swiss: {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  },
  radar: {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-slate-500/20 text-slate-400',
  },
  fallback: {
    swiss: 'bg-slate-100 text-slate-600',
    radar: 'bg-slate-500/20 text-slate-400',
  },
} as const;

export type PriorityLevel = keyof typeof priorityColors.swiss;

/** Status badge colors */
export const statusColors = {
  swiss: {
    completed: 'bg-emerald-100 text-emerald-700',
    active: 'bg-blue-100 text-blue-700',
    searching: 'bg-amber-100 text-amber-700',
    analyzing: 'bg-purple-100 text-purple-700',
    paused: 'bg-slate-100 text-slate-600',
    failed: 'bg-red-100 text-red-700',
  },
  radar: {
    completed: 'bg-emerald-500/20 text-emerald-400',
    active: 'bg-blue-500/20 text-blue-400',
    searching: 'bg-amber-500/20 text-amber-400',
    analyzing: 'bg-purple-500/20 text-purple-400',
    paused: 'bg-slate-500/20 text-slate-400',
    failed: 'bg-red-500/20 text-red-400',
  },
  fallback: {
    swiss: 'bg-slate-100 text-slate-600',
    radar: 'bg-slate-500/20 text-slate-400',
  },
} as const;

export type StatusType = keyof typeof statusColors.swiss;

// ============================================================================
// Card Color Palettes
// ============================================================================

/** Quick stat card colors (bg, border, text combined) */
export const cardColors = {
  swiss: {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  },
  radar: {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    slate: 'bg-slate-800 border-slate-700 text-slate-300',
  },
} as const;

export type CardColor = keyof typeof cardColors.swiss;

/** Alert banner colors (gradient bg, border, text) */
export const alertColors = {
  swiss: {
    warning: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-orange-700',
    error: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 text-red-700',
    info: 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 text-violet-700',
    success: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 text-emerald-700',
  },
  radar: {
    warning: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-400',
    error: 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30 text-red-400',
    info: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30 text-violet-400',
    success: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30 text-emerald-400',
  },
} as const;

export type AlertVariant = keyof typeof alertColors.swiss;

/** Progress bar solid colors */
export const progressColors: Record<CardColor, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-slate-500',
};

/** Progress bar background by theme */
export const progressBgColors = {
  swiss: 'bg-white/50',
  radar: 'bg-white/10',
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get themed badge classes for finding types.
 */
export function getFindingTypeClasses(type: string, theme: ThemeName): string {
  const palette = theme === 'radar' ? findingTypeColors.radar : findingTypeColors.swiss;
  const fallback = findingTypeColors.fallback[theme];
  return (palette as Record<string, string>)[type] || fallback;
}

/**
 * Get themed badge classes for source types.
 */
export function getSourceTypeClasses(type: string, theme: ThemeName): string {
  const palette = theme === 'radar' ? sourceTypeColors.radar : sourceTypeColors.swiss;
  const fallback = sourceTypeColors.fallback[theme];
  return (palette as Record<string, string>)[type] || fallback;
}

/**
 * Get themed badge classes for priority levels.
 */
export function getPriorityClasses(priority: string, theme: ThemeName): string {
  const palette = theme === 'radar' ? priorityColors.radar : priorityColors.swiss;
  const fallback = priorityColors.fallback[theme];
  return (palette as Record<string, string>)[priority] || fallback;
}

/**
 * Get themed badge classes for status types.
 */
export function getStatusClasses(status: string, theme: ThemeName): string {
  const palette = theme === 'radar' ? statusColors.radar : statusColors.swiss;
  const fallback = statusColors.fallback[theme];
  return (palette as Record<string, string>)[status] || fallback;
}

/**
 * Get themed card classes.
 */
export function getCardClasses(color: CardColor, theme: ThemeName): string {
  const palette = theme === 'radar' ? cardColors.radar : cardColors.swiss;
  return palette[color];
}

/**
 * Get themed alert banner classes.
 */
export function getAlertClasses(variant: AlertVariant, theme: ThemeName): string {
  const palette = theme === 'radar' ? alertColors.radar : alertColors.swiss;
  return palette[variant];
}

/**
 * Get progress bar background class for theme.
 */
export function getProgressBgClass(theme: ThemeName): string {
  return progressBgColors[theme];
}

// ============================================================================
// React Hook
// ============================================================================

import { useReportTheme } from '../core/ThemeContext';

/**
 * Hook to access themed color utilities.
 *
 * @example
 * const { getFindingType, getCard, isRadar } = useThemedColors();
 * const badgeClass = getFindingType('fact');
 * const cardClass = getCard('blue');
 */
export function useThemedColors() {
  const { theme } = useReportTheme();
  const themeName: ThemeName = theme === 'radar' ? 'radar' : 'swiss';
  const isRadar = theme === 'radar';

  return {
    /** Current theme name */
    theme: themeName,
    /** Whether current theme is radar (dark) */
    isRadar,

    /** Get finding type badge classes */
    getFindingType: (type: string) => getFindingTypeClasses(type, themeName),
    /** Get source type badge classes */
    getSourceType: (type: string) => getSourceTypeClasses(type, themeName),
    /** Get priority badge classes */
    getPriority: (priority: string) => getPriorityClasses(priority, themeName),
    /** Get status badge classes */
    getStatus: (status: string) => getStatusClasses(status, themeName),
    /** Get card classes */
    getCard: (color: CardColor) => getCardClasses(color, themeName),
    /** Get alert banner classes */
    getAlert: (variant: AlertVariant) => getAlertClasses(variant, themeName),
    /** Get progress bar background class */
    getProgressBg: () => getProgressBgClass(themeName),
    /** Get progress bar color class */
    getProgressColor: (color: CardColor) => progressColors[color],

    // Direct palette access for advanced use cases
    palettes: {
      findingType: isRadar ? findingTypeColors.radar : findingTypeColors.swiss,
      sourceType: isRadar ? sourceTypeColors.radar : sourceTypeColors.swiss,
      priority: isRadar ? priorityColors.radar : priorityColors.swiss,
      status: isRadar ? statusColors.radar : statusColors.swiss,
      card: isRadar ? cardColors.radar : cardColors.swiss,
      alert: isRadar ? alertColors.radar : alertColors.swiss,
    },
  };
}
