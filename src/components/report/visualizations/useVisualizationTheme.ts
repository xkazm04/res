/**
 * useVisualizationTheme Hook
 *
 * Provides type-safe access to visualization theme colors and utilities.
 * Integrates with the ReportThemeProvider context.
 */

import { useMemo } from 'react';
import { useReportTheme } from '../core/ThemeContext';
import {
  visualizationThemes,
  getConfidenceColor,
  getCredibilityColor,
  getStatusColor,
  getTimelineTypeConfig,
  getCardClasses,
  getSurfaceClasses,
  getTooltipClasses,
  getHeaderClasses,
  getButtonClasses,
  getGlowStyle,
  type VisualizationColors,
  type EntityTypeColors,
} from './theme';

export interface UseVisualizationThemeReturn {
  /** Current theme name */
  theme: 'radar' | 'swiss';

  /** Whether current theme is radar (dark) */
  isRadar: boolean;

  /** All semantic color tokens */
  colors: VisualizationColors;

  /** Entity type color mapping */
  entityColors: EntityTypeColors;

  /** Get color for entity type */
  getEntityColor: (type: string) => string;

  /** Get confidence-based color (0-1 value) */
  getConfidenceColor: (value: number) => string;

  /** Get credibility-based color (0-1 score) */
  getCredibilityColor: (score: number) => string;

  /** Get status-based colors */
  getStatusColor: (status: 'resolved' | 'investigating' | 'unresolved') => {
    bg: string;
    text: string;
    border: string;
  };

  /** Get timeline event type config */
  getTimelineTypeConfig: () => Record<'finding' | 'event' | 'prediction', { color: string; icon: string }>;

  // Tailwind class utilities
  /** Card background classes */
  cardClasses: string;
  /** Surface background classes */
  surfaceClasses: string;
  /** Tooltip classes */
  tooltipClasses: string;
  /** Header text classes */
  headerClasses: string;
  /** Get button classes */
  getButtonClasses: (isActive: boolean) => string;

  /** Get glow style for radar theme */
  getGlowStyle: (color: string, intensity?: 'low' | 'medium' | 'high') => React.CSSProperties;
}

/**
 * Hook for accessing visualization theme colors and utilities.
 *
 * @example
 * ```tsx
 * function MyVisualization() {
 *   const { colors, isRadar, getConfidenceColor, cardClasses } = useVisualizationTheme();
 *
 *   return (
 *     <div className={cardClasses}>
 *       <circle fill={colors.primary} />
 *       <rect fill={getConfidenceColor(0.85)} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useVisualizationTheme(): UseVisualizationThemeReturn {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return useMemo(() => {
    const themeConfig = visualizationThemes[theme];
    const { colors, entityColors } = themeConfig;

    return {
      theme,
      isRadar,
      colors,
      entityColors,

      getEntityColor: (type: string) => {
        const normalizedType = type.toLowerCase();
        return entityColors[normalizedType as keyof EntityTypeColors] || entityColors.other;
      },

      getConfidenceColor: (value: number) => getConfidenceColor(value, colors),
      getCredibilityColor: (score: number) => getCredibilityColor(score, colors),
      getStatusColor: (status) => getStatusColor(status, colors),
      getTimelineTypeConfig: () => getTimelineTypeConfig(colors),

      cardClasses: getCardClasses(isRadar),
      surfaceClasses: getSurfaceClasses(isRadar),
      tooltipClasses: getTooltipClasses(isRadar),
      headerClasses: getHeaderClasses(isRadar),
      getButtonClasses: (isActive: boolean) => getButtonClasses(isRadar, isActive),

      getGlowStyle: (color: string, intensity?: 'low' | 'medium' | 'high') =>
        isRadar ? getGlowStyle(color, intensity) : {},
    };
  }, [theme, isRadar]);
}

// Re-export types for convenience
export type { VisualizationColors, EntityTypeColors } from './theme';
