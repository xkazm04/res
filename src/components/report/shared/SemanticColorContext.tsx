'use client';

/**
 * SemanticColorContext - React context for semantic color system
 *
 * This context provides a consistent way for components to consume semantic
 * color intents without knowing the underlying color implementation.
 *
 * @example
 * ```tsx
 * function ConfidenceIndicator({ score }: { score: number }) {
 *   const { forConfidence } = useSemanticColors();
 *   const colors = forConfidence(score);
 *
 *   return (
 *     <div className={`${colors.bg} ${colors.text} ${colors.border} border rounded`}>
 *       {Math.round(score * 100)}%
 *     </div>
 *   );
 * }
 * ```
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useReportTheme } from '../core/ThemeContext';
import {
  type SemanticIntent,
  type SemanticColorSpec,
  getSemanticColor,
  getSemanticBadgeClasses,
  getSemanticCardClasses,
  getSemanticAlertClasses,
  scoreToConfidenceIntent,
  scoreToCredibilityIntent,
  priorityToIntent,
  statusToIntent,
  findingTypeToIntent,
  entityTypeToIntent,
  legacyColorToIntent,
  semanticColorPalettes,
} from './semanticColors';
import type { ThemeName } from './themeColors';

// =============================================================================
// Context Types
// =============================================================================

export interface SemanticColorContextValue {
  /** Current theme name */
  theme: ThemeName;

  /** Whether we're in radar (dark) theme */
  isRadar: boolean;

  /**
   * Get the full color spec for a semantic intent.
   */
  forIntent: (intent: SemanticIntent) => SemanticColorSpec;

  /**
   * Get colors for a confidence score (0-1 or 0-100).
   * High (≥80) = emerald, Medium (≥50) = amber, Low = red
   */
  forConfidence: (score: number) => SemanticColorSpec;

  /**
   * Get colors for a credibility score (0-1 or 0-100).
   * High (≥80) = emerald, Medium (≥50) = amber, Low = red
   */
  forCredibility: (score: number) => SemanticColorSpec;

  /**
   * Get colors for a priority level.
   * High/Urgent = red, Normal = amber, Low/Deferred = slate
   */
  forPriority: (priority: string) => SemanticColorSpec;

  /**
   * Get colors for a status.
   * Complete = emerald, Active = blue, Paused = slate, Failed = red
   */
  forStatus: (status: string) => SemanticColorSpec;

  /**
   * Get colors for a finding type.
   */
  forFindingType: (type: string) => SemanticColorSpec;

  /**
   * Get colors for an entity type.
   */
  forEntityType: (type: string) => SemanticColorSpec;

  /**
   * Get badge classes (bg + text) for an intent.
   */
  badgeClasses: (intent: SemanticIntent) => string;

  /**
   * Get card classes (bg + border + text) for an intent.
   */
  cardClasses: (intent: SemanticIntent) => string;

  /**
   * Get alert classes (gradient bg + border + text) for an intent.
   */
  alertClasses: (intent: SemanticIntent) => string;

  /**
   * Map a legacy color prop to semantic classes.
   * Useful for backwards compatibility with existing components.
   */
  fromLegacyColor: (color: string) => SemanticColorSpec;

  /**
   * Direct access to the color palette for advanced use.
   */
  palette: Record<SemanticIntent, SemanticColorSpec>;
}

// =============================================================================
// Context
// =============================================================================

const SemanticColorContext = createContext<SemanticColorContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export interface SemanticColorProviderProps {
  children: ReactNode;
}

/**
 * SemanticColorProvider - Provides semantic color context to children.
 *
 * This should wrap any components that use semantic colors.
 * It automatically inherits the theme from ReportThemeProvider.
 */
export function SemanticColorProvider({ children }: SemanticColorProviderProps) {
  const { theme: reportTheme } = useReportTheme();
  const theme: ThemeName = reportTheme === 'radar' ? 'radar' : 'swiss';
  const isRadar = reportTheme === 'radar';

  const value = useMemo<SemanticColorContextValue>(() => ({
    theme,
    isRadar,

    forIntent: (intent: SemanticIntent) => getSemanticColor(intent, theme),

    forConfidence: (score: number) => {
      const intent = scoreToConfidenceIntent(score);
      return getSemanticColor(intent, theme);
    },

    forCredibility: (score: number) => {
      const intent = scoreToCredibilityIntent(score);
      return getSemanticColor(intent, theme);
    },

    forPriority: (priority: string) => {
      const intent = priorityToIntent(priority);
      return getSemanticColor(intent, theme);
    },

    forStatus: (status: string) => {
      const intent = statusToIntent(status);
      return getSemanticColor(intent, theme);
    },

    forFindingType: (type: string) => {
      const intent = findingTypeToIntent(type);
      return getSemanticColor(intent, theme);
    },

    forEntityType: (type: string) => {
      const intent = entityTypeToIntent(type);
      return getSemanticColor(intent, theme);
    },

    badgeClasses: (intent: SemanticIntent) => getSemanticBadgeClasses(intent, theme),

    cardClasses: (intent: SemanticIntent) => getSemanticCardClasses(intent, theme),

    alertClasses: (intent: SemanticIntent) => getSemanticAlertClasses(intent, theme),

    fromLegacyColor: (color: string) => {
      const intent = legacyColorToIntent(color);
      return getSemanticColor(intent, theme);
    },

    palette: semanticColorPalettes[theme],
  }), [theme, isRadar]);

  return (
    <SemanticColorContext.Provider value={value}>
      {children}
    </SemanticColorContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to access semantic colors.
 * Returns null if not within a SemanticColorProvider.
 *
 * For most cases, use useSemanticColors() instead which falls back to swiss theme.
 */
export function useSemanticColorContext(): SemanticColorContextValue | null {
  return useContext(SemanticColorContext);
}

/**
 * Hook to access semantic colors with fallback.
 *
 * This hook can be used outside of SemanticColorProvider - it will
 * fall back to using the theme from useReportTheme directly.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { forConfidence, forPriority } = useSemanticColors();
 *
 *   return (
 *     <div className={forConfidence(0.85).bg}>
 *       High confidence!
 *     </div>
 *   );
 * }
 * ```
 */
export function useSemanticColors(): SemanticColorContextValue {
  const contextValue = useContext(SemanticColorContext);

  // Try to get theme from ReportThemeProvider for fallback
  const { theme: reportTheme } = useReportTheme();
  const theme: ThemeName = reportTheme === 'radar' ? 'radar' : 'swiss';
  const isRadar = reportTheme === 'radar';

  // Memoize fallback value
  const fallbackValue = useMemo<SemanticColorContextValue>(() => ({
    theme,
    isRadar,
    forIntent: (intent: SemanticIntent) => getSemanticColor(intent, theme),
    forConfidence: (score: number) => getSemanticColor(scoreToConfidenceIntent(score), theme),
    forCredibility: (score: number) => getSemanticColor(scoreToCredibilityIntent(score), theme),
    forPriority: (priority: string) => getSemanticColor(priorityToIntent(priority), theme),
    forStatus: (status: string) => getSemanticColor(statusToIntent(status), theme),
    forFindingType: (type: string) => getSemanticColor(findingTypeToIntent(type), theme),
    forEntityType: (type: string) => getSemanticColor(entityTypeToIntent(type), theme),
    badgeClasses: (intent: SemanticIntent) => getSemanticBadgeClasses(intent, theme),
    cardClasses: (intent: SemanticIntent) => getSemanticCardClasses(intent, theme),
    alertClasses: (intent: SemanticIntent) => getSemanticAlertClasses(intent, theme),
    fromLegacyColor: (color: string) => getSemanticColor(legacyColorToIntent(color), theme),
    palette: semanticColorPalettes[theme],
  }), [theme, isRadar]);

  return contextValue || fallbackValue;
}

// =============================================================================
// Convenience Hooks for Specific Use Cases
// =============================================================================

/**
 * Hook specifically for confidence-based coloring.
 *
 * @example
 * ```tsx
 * function ConfidenceBar({ score }) {
 *   const colors = useConfidenceColors(score);
 *   return <div className={`${colors.bg} h-2 rounded`} style={{ width: `${score * 100}%` }} />;
 * }
 * ```
 */
export function useConfidenceColors(score: number): SemanticColorSpec {
  const { forConfidence } = useSemanticColors();
  return useMemo(() => forConfidence(score), [forConfidence, score]);
}

/**
 * Hook specifically for credibility-based coloring.
 */
export function useCredibilityColors(score: number): SemanticColorSpec {
  const { forCredibility } = useSemanticColors();
  return useMemo(() => forCredibility(score), [forCredibility, score]);
}

/**
 * Hook specifically for priority-based coloring.
 */
export function usePriorityColors(priority: string): SemanticColorSpec {
  const { forPriority } = useSemanticColors();
  return useMemo(() => forPriority(priority), [forPriority, priority]);
}

/**
 * Hook specifically for status-based coloring.
 */
export function useStatusColors(status: string): SemanticColorSpec {
  const { forStatus } = useSemanticColors();
  return useMemo(() => forStatus(status), [forStatus, status]);
}
