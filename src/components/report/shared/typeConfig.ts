/**
 * Centralized type-to-style configuration for entities and perspectives.
 * Provides consistent gradients and icons across all report views.
 */

// Entity types configuration
export type EntityType = 'person' | 'organization' | 'location' | 'event' | 'other';

export interface EntityTypeConfig {
  icon: string;
  gradient: string;
}

export const entityTypeConfig: Record<EntityType, EntityTypeConfig> = {
  person: { icon: '👤', gradient: 'from-rose-500 to-pink-600' },
  organization: { icon: '🏢', gradient: 'from-blue-500 to-indigo-600' },
  location: { icon: '📍', gradient: 'from-emerald-500 to-teal-600' },
  event: { icon: '📅', gradient: 'from-amber-500 to-orange-600' },
  other: { icon: '🔹', gradient: 'from-slate-500 to-gray-600' },
};

// Perspective types configuration
export type PerspectiveType = 'financial' | 'investigative' | 'strategic' | 'competitive' | 'technical' | 'legal';

export const perspectiveTypeConfig: Record<PerspectiveType, { gradient: string }> = {
  financial: { gradient: 'from-emerald-500 to-teal-600' },
  investigative: { gradient: 'from-rose-500 to-pink-600' },
  strategic: { gradient: 'from-blue-500 to-indigo-600' },
  competitive: { gradient: 'from-amber-500 to-orange-600' },
  technical: { gradient: 'from-violet-500 to-purple-600' },
  legal: { gradient: 'from-slate-500 to-gray-600' },
};

// Default fallback gradient
export const defaultGradient = 'from-slate-500 to-gray-600';

// Helper to get entity config with fallback
export function getEntityConfig(type: string): EntityTypeConfig {
  const normalized = type.toLowerCase() as EntityType;
  return entityTypeConfig[normalized] || entityTypeConfig.other;
}

// Helper to get perspective gradient with fallback
export function getPerspectiveGradient(type: string): string {
  const normalized = type.toLowerCase() as PerspectiveType;
  return perspectiveTypeConfig[normalized]?.gradient || defaultGradient;
}

// ============================================
// Confidence/Credibility Color Utilities
// ============================================

/** Thresholds for confidence/credibility color coding */
export const CONFIDENCE_THRESHOLDS = {
  high: 80,
  medium: 50,
} as const;

/** Confidence level based on score */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Get confidence level from a score (0-100 or 0-1) */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  // Normalize to percentage if passed as decimal
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (pct >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/** Badge color classes by confidence level (light theme) */
export const confidenceBadgeColors: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

/** Badge color classes by confidence level (dark/radar theme) */
export const confidenceBadgeColorsDark: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-slate-500/20 text-slate-400',
};

/** Credibility badge color classes (uses red for low instead of slate) - light theme */
export const credibilityBadgeColors: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
};

/** Credibility badge color classes (dark/radar theme) */
export const credibilityBadgeColorsDark: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-red-500/20 text-red-400',
};

/** Simple color names for progress bars and charts */
export type ConfidenceColorName = 'emerald' | 'amber' | 'red';

/** Get color name for progress bars and charts */
export function getConfidenceColorName(score: number): ConfidenceColorName {
  const level = getConfidenceLevel(score);
  return level === 'high' ? 'emerald' : level === 'medium' ? 'amber' : 'red';
}

/** Background color classes for bars */
export const confidenceBarColors: Record<ConfidenceColorName, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

/** Gradient color classes for progress bars */
export const confidenceGradientColors: Record<ConfidenceColorName, string> = {
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-600',
  red: 'bg-gradient-to-r from-red-500 to-red-600',
};

/** Filter option type for confidence filtering */
export type ConfidenceFilterOption = 'all' | 'high' | 'medium' | 'low';

/**
 * Check if a score matches the selected confidence filter.
 * Uses CONFIDENCE_THRESHOLDS for consistent filtering across all tabs.
 * @param score - Score as 0-1 decimal or 0-100 percentage
 * @param filter - Filter option ('all', 'high', 'medium', 'low')
 * @returns true if score matches filter
 */
export function matchesConfidenceFilter(score: number, filter: ConfidenceFilterOption): boolean {
  if (filter === 'all') return true;
  const level = getConfidenceLevel(score);
  return level === filter;
}
