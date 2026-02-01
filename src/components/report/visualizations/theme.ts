/**
 * Visualization Theme Configuration
 *
 * Centralized semantic color tokens for all visualization components.
 * Eliminates repetitive `isRadar ? 'x' : 'y'` patterns.
 */

import type { ReportTheme } from '../core/ThemeContext';

// ============================================
// Semantic Color Tokens
// ============================================

export interface VisualizationColors {
  // Primary visualization colors
  primary: string;
  primaryFill: string;
  primaryMuted: string;

  // Secondary accent (used for variety)
  secondary: string;
  secondaryFill: string;

  // Semantic status colors
  success: string;
  successFill: string;
  warning: string;
  warningFill: string;
  danger: string;
  dangerFill: string;

  // Confidence level colors (for heatmaps, gauges)
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  confidenceVeryLow: string;
  confidenceCritical: string;

  // Grid and structural elements
  gridLine: string;
  axisLine: string;
  connectionLine: string;
  contradictionLine: string;

  // Backgrounds
  cardBg: string;
  surfaceBg: string;
  tooltipBg: string;
  overlayBg: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnDark: string;
  textOnLight: string;

  // Borders
  border: string;
  borderSubtle: string;
  borderActive: string;

  // Special effects (radar glow, etc.)
  glowColor: string;
  glowStrong: string;
}

// ============================================
// Entity Type Colors
// ============================================

export interface EntityTypeColors {
  finding: string;
  source: string;
  entity: string;
  perspective: string;
  person: string;
  organization: string;
  location: string;
  event: string;
  other: string;
}

// ============================================
// Theme Definitions
// ============================================

const radarColors: VisualizationColors = {
  // Primary - cyan glow aesthetic
  primary: '#22d3ee',
  primaryFill: 'rgba(34, 211, 238, 0.15)',
  primaryMuted: 'rgba(34, 211, 238, 0.5)',

  // Secondary - violet accent
  secondary: '#a78bfa',
  secondaryFill: 'rgba(167, 139, 250, 0.15)',

  // Semantic status
  success: '#34d399',
  successFill: 'rgba(52, 211, 153, 0.2)',
  warning: '#fbbf24',
  warningFill: 'rgba(251, 191, 36, 0.2)',
  danger: '#f87171',
  dangerFill: 'rgba(248, 113, 113, 0.2)',

  // Confidence levels (for heatmaps)
  confidenceHigh: 'rgba(34, 211, 238, 0.8)',
  confidenceMedium: 'rgba(52, 211, 153, 0.7)',
  confidenceLow: 'rgba(251, 191, 36, 0.6)',
  confidenceVeryLow: 'rgba(251, 146, 60, 0.5)',
  confidenceCritical: 'rgba(248, 113, 113, 0.4)',

  // Grid and structural
  gridLine: 'rgba(34, 211, 238, 0.1)',
  axisLine: 'rgba(34, 211, 238, 0.15)',
  connectionLine: 'rgba(34, 211, 238, 0.5)',
  contradictionLine: '#f87171',

  // Backgrounds
  cardBg: 'rgba(15, 23, 42, 0.6)', // slate-900/60
  surfaceBg: 'rgba(2, 6, 23, 0.5)', // slate-950/50
  tooltipBg: 'rgb(30, 41, 59)', // slate-800
  overlayBg: 'rgba(15, 23, 42, 0.5)',

  // Text
  textPrimary: 'rgb(241, 245, 249)', // slate-100
  textSecondary: 'rgb(148, 163, 184)', // slate-400
  textMuted: 'rgb(100, 116, 139)', // slate-500
  textOnDark: '#fff',
  textOnLight: 'rgb(30, 41, 59)',

  // Borders
  border: 'rgba(34, 211, 238, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderActive: 'rgba(34, 211, 238, 0.3)',

  // Glow effects
  glowColor: 'rgba(34, 211, 238, 0.3)',
  glowStrong: 'rgba(34, 211, 238, 0.5)',
};

const swissColors: VisualizationColors = {
  // Primary - blue/indigo for clarity
  primary: '#3b82f6',
  primaryFill: 'rgba(59, 130, 246, 0.15)',
  primaryMuted: 'rgba(59, 130, 246, 0.5)',

  // Secondary - violet accent
  secondary: '#7c3aed',
  secondaryFill: 'rgba(124, 58, 237, 0.15)',

  // Semantic status
  success: '#059669',
  successFill: 'rgba(5, 150, 105, 0.1)',
  warning: '#d97706',
  warningFill: 'rgba(217, 119, 6, 0.1)',
  danger: '#dc2626',
  dangerFill: 'rgba(220, 38, 38, 0.1)',

  // Confidence levels
  confidenceHigh: 'rgb(16, 185, 129)',
  confidenceMedium: 'rgb(34, 197, 94)',
  confidenceLow: 'rgb(234, 179, 8)',
  confidenceVeryLow: 'rgb(249, 115, 22)',
  confidenceCritical: 'rgb(239, 68, 68)',

  // Grid and structural
  gridLine: 'rgba(0, 0, 0, 0.08)',
  axisLine: 'rgba(0, 0, 0, 0.1)',
  connectionLine: 'rgba(99, 102, 241, 0.5)',
  contradictionLine: '#f87171',

  // Backgrounds
  cardBg: 'rgb(255, 255, 255)',
  surfaceBg: 'rgb(250, 250, 249)', // stone-50
  tooltipBg: 'rgb(255, 255, 255)',
  overlayBg: 'rgba(250, 250, 249, 0.9)',

  // Text
  textPrimary: 'rgb(28, 25, 23)', // stone-900
  textSecondary: 'rgb(120, 113, 108)', // stone-500
  textMuted: 'rgb(168, 162, 158)', // stone-400
  textOnDark: '#fff',
  textOnLight: 'rgb(28, 25, 23)',

  // Borders
  border: 'rgb(231, 229, 228)', // stone-200
  borderSubtle: 'rgb(245, 245, 244)', // stone-100
  borderActive: 'rgb(28, 25, 23)',

  // No glow in swiss (clean shadows instead)
  glowColor: 'transparent',
  glowStrong: 'transparent',
};

const radarEntityColors: EntityTypeColors = {
  finding: '#22d3ee',
  source: '#a78bfa',
  entity: '#fb7185',
  perspective: '#34d399',
  person: '#f472b6',
  organization: '#60a5fa',
  location: '#34d399',
  event: '#fbbf24',
  other: '#a78bfa',
};

const swissEntityColors: EntityTypeColors = {
  finding: '#0ea5e9',
  source: '#7c3aed',
  entity: '#e11d48',
  perspective: '#059669',
  person: '#be185d',
  organization: '#2563eb',
  location: '#059669',
  event: '#d97706',
  other: '#7c3aed',
};

// ============================================
// Theme Configuration Map
// ============================================

export const visualizationThemes: Record<ReportTheme, {
  colors: VisualizationColors;
  entityColors: EntityTypeColors;
}> = {
  radar: { colors: radarColors, entityColors: radarEntityColors },
  swiss: { colors: swissColors, entityColors: swissEntityColors },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get confidence color based on value (0-1)
 */
export function getConfidenceColor(
  value: number,
  colors: VisualizationColors
): string {
  if (value >= 0.8) return colors.confidenceHigh;
  if (value >= 0.6) return colors.confidenceMedium;
  if (value >= 0.4) return colors.confidenceLow;
  if (value >= 0.2) return colors.confidenceVeryLow;
  return colors.confidenceCritical;
}

/**
 * Get credibility color based on score (0-1)
 */
export function getCredibilityColor(
  score: number,
  colors: VisualizationColors
): string {
  if (score >= 0.8) return colors.success;
  if (score >= 0.5) return colors.warning;
  return colors.danger;
}

/**
 * Get status color based on status type
 */
export function getStatusColor(
  status: 'resolved' | 'investigating' | 'unresolved',
  colors: VisualizationColors
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'resolved':
      return { bg: colors.successFill, text: colors.success, border: colors.success };
    case 'investigating':
      return { bg: colors.warningFill, text: colors.warning, border: colors.warning };
    case 'unresolved':
    default:
      return { bg: colors.dangerFill, text: colors.danger, border: colors.danger };
  }
}

/**
 * Timeline event type configuration
 */
export function getTimelineTypeConfig(
  colors: VisualizationColors
): Record<'finding' | 'event' | 'prediction', { color: string; icon: string }> {
  return {
    finding: { color: colors.primary, icon: '◆' },
    event: { color: colors.secondary, icon: '●' },
    prediction: { color: colors.warning, icon: '◇' },
  };
}

// ============================================
// CSS Class Helpers
// ============================================

/**
 * Get Tailwind classes for card backgrounds
 */
export function getCardClasses(isRadar: boolean): string {
  return isRadar
    ? 'bg-slate-900/60 border border-cyan-500/10'
    : 'bg-white border border-stone-200';
}

/**
 * Get Tailwind classes for surface backgrounds
 */
export function getSurfaceClasses(isRadar: boolean): string {
  return isRadar ? 'bg-slate-950/50' : 'bg-stone-50';
}

/**
 * Get Tailwind classes for tooltips
 */
export function getTooltipClasses(isRadar: boolean): string {
  return isRadar
    ? 'bg-slate-800 text-white'
    : 'bg-white text-stone-800 shadow-lg';
}

/**
 * Get Tailwind classes for section headers
 */
export function getHeaderClasses(isRadar: boolean): string {
  return isRadar ? 'text-cyan-400' : 'text-stone-700';
}

/**
 * Get Tailwind classes for buttons
 */
export function getButtonClasses(isRadar: boolean, isActive: boolean): string {
  if (isActive) {
    return isRadar
      ? 'bg-cyan-500/20 text-cyan-300'
      : 'bg-stone-800 text-white';
  }
  return isRadar
    ? 'bg-slate-800/50 text-slate-400 hover:text-white'
    : 'bg-stone-100 text-stone-600 hover:bg-stone-200';
}

/**
 * Get glow shadow style for radar theme
 */
export function getGlowStyle(
  color: string,
  intensity: 'low' | 'medium' | 'high' = 'medium'
): React.CSSProperties {
  const radius = intensity === 'low' ? 8 : intensity === 'medium' ? 15 : 25;
  return {
    filter: `drop-shadow(0 0 ${radius}px ${color})`,
  };
}
