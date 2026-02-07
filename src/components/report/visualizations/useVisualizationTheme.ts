/**
 * useVisualizationTheme Hook
 *
 * Provides type-safe access to visualization theme colors and utilities.
 * Integrates with the ReportThemeProvider context.
 *
 * Now also exposes semantic intent flags for behavior-based decisions.
 * Use semantic flags (showUncertainty, emphasizeData, etc.) to decide
 * WHAT to show, and use colors/classes to decide HOW to style it.
 *
 * NOTE: For components that only need colors/classes and not semantic intent,
 * prefer using getVizColors(theme) directly - it's a pure function with no
 * React dependencies and can be tree-shaken.
 */

import { useMemo } from 'react';
import { useReportTheme } from '../core/ThemeContext';
import { useSemanticIntent, type SemanticIntentValue } from '@/src/stores/reportStore';
import { getVizColors, type VizColorsReturn, type VisualizationColors, type EntityTypeColors } from './theme';

export interface UseVisualizationThemeReturn extends VizColorsReturn {
  // ============================================
  // Semantic Intent Flags
  // ============================================
  // Use these to decide WHAT to render, not just HOW to style it

  /** Whether to show uncertainty/confidence ranges */
  showUncertainty: boolean;

  /** Whether to emphasize data density over readability */
  emphasizeData: boolean;

  /** Whether to show technical details (timestamps, IDs, raw scores) */
  showTechnicalDetails: boolean;

  /** Whether to use ambient/glow effects */
  useAmbientEffects: boolean;

  /** Whether to animate data updates */
  animateUpdates: boolean;

  /** Whether to prioritize readability over completeness */
  prioritizeReadability: boolean;

  /** Whether to show inline sources/citations */
  showInlineSources: boolean;

  /** Whether to highlight contradictions prominently */
  highlightContradictions: boolean;

  /** Whether deep-dive interactions are enabled */
  enableDeepDive: boolean;

  /** Whether comparison tools are enabled */
  enableComparison: boolean;

  /** Full semantic intent object for advanced use */
  intent: SemanticIntentValue;
}

/**
 * Hook for accessing visualization theme colors and utilities.
 *
 * For components that only need colors and don't use semantic intent flags,
 * prefer using getVizColors(theme) directly - it's a pure function.
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
  const intent = useSemanticIntent();

  return useMemo(() => {
    // Use the pure utility function for colors
    const vizColors = getVizColors(theme);

    return {
      ...vizColors,

      // Semantic intent flags - use these for behavioral decisions
      showUncertainty: intent.showUncertainty,
      emphasizeData: intent.emphasizeData,
      showTechnicalDetails: intent.showTechnicalDetails,
      useAmbientEffects: intent.useAmbientEffects,
      animateUpdates: intent.animateUpdates,
      prioritizeReadability: intent.prioritizeReadability,
      showInlineSources: intent.showInlineSources,
      highlightContradictions: intent.highlightContradictions,
      enableDeepDive: intent.enableDeepDive,
      enableComparison: intent.enableComparison,
      intent,
    };
  }, [theme, intent]);
}

// Re-export types for convenience
export type { VisualizationColors, EntityTypeColors } from './theme';
