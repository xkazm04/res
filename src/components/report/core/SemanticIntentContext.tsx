'use client';

/**
 * SemanticIntentContext - React context for semantic user intent
 *
 * This context transforms theme from a style choice into semantic intent.
 * Instead of "radar vs swiss" visual tokens, it exposes behavioral flags
 * that reflect what users want from each theme:
 *
 * - Radar (analytical/surveillance): Users want data density, uncertainty
 *   visualization, technical depth, and raw intelligence feed aesthetics
 *
 * - Swiss (editorial/presentation): Users want clarity, narrative flow,
 *   readability, and polished presentation
 *
 * Components use these semantic flags to decide WHAT to show, not just
 * HOW to style it.
 *
 * @example
 * ```tsx
 * function ConfidenceIndicator({ score }: { score: number }) {
 *   const { showUncertainty, emphasizeData } = useSemanticIntent();
 *
 *   // In radar mode, show exact percentage and uncertainty range
 *   // In swiss mode, show simplified "High/Medium/Low" label
 *   if (showUncertainty) {
 *     return (
 *       <div>
 *         <span>{(score * 100).toFixed(1)}%</span>
 *         <span className="text-xs">±{calculateUncertaintyRange(score)}%</span>
 *       </div>
 *     );
 *   }
 *
 *   return <Badge>{getConfidenceLabel(score)}</Badge>;
 * }
 * ```
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useReportTheme, type ReportTheme } from './ThemeContext';

// =============================================================================
// Semantic Intent Types
// =============================================================================

/**
 * Behavioral intent flags that components use to decide what to render.
 * These are derived from theme but express semantic meaning, not visual style.
 */
export interface SemanticIntentValue {
  // ============================================
  // Data Display Intent
  // ============================================

  /**
   * Whether to show uncertainty/confidence ranges.
   * - true: Show error bars, confidence intervals, uncertainty ranges
   * - false: Hide complexity, show simplified labels
   */
  showUncertainty: boolean;

  /**
   * Whether to emphasize data density over readability.
   * - true: Pack more information, accept visual density
   * - false: Use whitespace, prioritize scanability
   */
  emphasizeData: boolean;

  /**
   * Whether to show technical/raw data formats.
   * - true: Show timestamps, IDs, raw scores, debug info
   * - false: Show human-friendly formats, hide implementation details
   */
  showTechnicalDetails: boolean;

  // ============================================
  // Visual Effects Intent
  // ============================================

  /**
   * Whether to use ambient/glow effects.
   * - true: Add glows, gradients, atmospheric effects
   * - false: Use clean shadows, crisp edges
   */
  useAmbientEffects: boolean;

  /**
   * Whether to animate data updates.
   * - true: Animate value changes, pulse on updates
   * - false: Instant updates, minimal motion
   */
  animateUpdates: boolean;

  // ============================================
  // Content Priority Intent
  // ============================================

  /**
   * Whether to prioritize readability over completeness.
   * - true: Truncate long text, summarize, simplify
   * - false: Show full content, expand by default
   */
  prioritizeReadability: boolean;

  /**
   * Whether to show all sources/evidence inline.
   * - true: Inline citations, visible source links
   * - false: Collapse sources, show on demand
   */
  showInlineSources: boolean;

  /**
   * Whether to highlight contradictions prominently.
   * - true: Bold contradiction indicators, alert styling
   * - false: Subtle contradiction hints, less prominent
   */
  highlightContradictions: boolean;

  // ============================================
  // Interaction Intent
  // ============================================

  /**
   * Whether to enable deep-dive interactions.
   * - true: Click to expand, drill-down available
   * - false: Simpler interactions, less depth
   */
  enableDeepDive: boolean;

  /**
   * Whether to show comparison tools.
   * - true: Side-by-side compare, diff views
   * - false: Single-item focus, simpler layout
   */
  enableComparison: boolean;

  // ============================================
  // Theme Identity (for components that still need it)
  // ============================================

  /**
   * Raw theme value for edge cases that need visual distinction.
   * Prefer semantic flags over this when possible.
   */
  theme: ReportTheme;

  /**
   * Quick check for radar theme. Use semantic flags when possible.
   * @deprecated Prefer semantic intent flags like showUncertainty
   */
  isRadar: boolean;
}

// =============================================================================
// Intent Profiles
// =============================================================================

/**
 * Radar profile: Analytical/surveillance mindset
 * Users want: data density, uncertainty viz, technical depth
 */
const radarIntent: Omit<SemanticIntentValue, 'theme' | 'isRadar'> = {
  // Data: Show everything, embrace complexity
  showUncertainty: true,
  emphasizeData: true,
  showTechnicalDetails: true,

  // Effects: Ambient, glowing, alive
  useAmbientEffects: true,
  animateUpdates: true,

  // Content: Completeness over simplicity
  prioritizeReadability: false,
  showInlineSources: true,
  highlightContradictions: true,

  // Interaction: Deep analysis tools
  enableDeepDive: true,
  enableComparison: true,
};

/**
 * Swiss profile: Editorial/presentation mindset
 * Users want: clarity, narrative flow, polished presentation
 */
const swissIntent: Omit<SemanticIntentValue, 'theme' | 'isRadar'> = {
  // Data: Simplify, hide complexity
  showUncertainty: false,
  emphasizeData: false,
  showTechnicalDetails: false,

  // Effects: Clean, minimal, professional
  useAmbientEffects: false,
  animateUpdates: false,

  // Content: Readability over completeness
  prioritizeReadability: true,
  showInlineSources: false,
  highlightContradictions: false,

  // Interaction: Simpler, presentation-focused
  enableDeepDive: false,
  enableComparison: false,
};

// =============================================================================
// Context
// =============================================================================

const defaultValue: SemanticIntentValue = {
  ...swissIntent,
  theme: 'swiss',
  isRadar: false,
};

const SemanticIntentContext = createContext<SemanticIntentValue>(defaultValue);

// =============================================================================
// Provider
// =============================================================================

export interface SemanticIntentProviderProps {
  children: ReactNode;
  /**
   * Optional overrides for individual intent flags.
   * Useful for testing or forcing specific behaviors.
   */
  overrides?: Partial<Omit<SemanticIntentValue, 'theme' | 'isRadar'>>;
}

/**
 * SemanticIntentProvider - Provides semantic intent context to children.
 *
 * This automatically derives intent from the current theme, but allows
 * overrides for specific use cases (e.g., force showUncertainty in swiss mode).
 *
 * Must be used within a ReportThemeProvider.
 */
export function SemanticIntentProvider({
  children,
  overrides,
}: SemanticIntentProviderProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const value = useMemo<SemanticIntentValue>(() => {
    const baseIntent = isRadar ? radarIntent : swissIntent;

    return {
      ...baseIntent,
      ...overrides,
      theme,
      isRadar,
    };
  }, [theme, isRadar, overrides]);

  return (
    <SemanticIntentContext.Provider value={value}>
      {children}
    </SemanticIntentContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to access semantic intent values.
 *
 * Use this hook to make behavioral decisions about what to render,
 * not just how to style it.
 *
 * @example
 * ```tsx
 * function DataCard({ data }) {
 *   const { showUncertainty, prioritizeReadability } = useSemanticIntent();
 *
 *   return (
 *     <Card>
 *       {showUncertainty && <UncertaintyBars data={data} />}
 *       <Value>
 *         {prioritizeReadability
 *           ? formatSimple(data.value)
 *           : formatPrecise(data.value)}
 *       </Value>
 *     </Card>
 *   );
 * }
 * ```
 */
export function useSemanticIntent(): SemanticIntentValue {
  return useContext(SemanticIntentContext);
}

/**
 * Hook that returns only data display intent flags.
 * Use when you only need data-related behaviors.
 */
export function useDataDisplayIntent() {
  const intent = useSemanticIntent();
  return useMemo(
    () => ({
      showUncertainty: intent.showUncertainty,
      emphasizeData: intent.emphasizeData,
      showTechnicalDetails: intent.showTechnicalDetails,
    }),
    [intent.showUncertainty, intent.emphasizeData, intent.showTechnicalDetails]
  );
}

/**
 * Hook that returns only visual effects intent flags.
 * Use when you only need effect-related behaviors.
 */
export function useVisualEffectsIntent() {
  const intent = useSemanticIntent();
  return useMemo(
    () => ({
      useAmbientEffects: intent.useAmbientEffects,
      animateUpdates: intent.animateUpdates,
    }),
    [intent.useAmbientEffects, intent.animateUpdates]
  );
}

/**
 * Hook that returns only content priority intent flags.
 * Use when you only need content-related behaviors.
 */
export function useContentPriorityIntent() {
  const intent = useSemanticIntent();
  return useMemo(
    () => ({
      prioritizeReadability: intent.prioritizeReadability,
      showInlineSources: intent.showInlineSources,
      highlightContradictions: intent.highlightContradictions,
    }),
    [
      intent.prioritizeReadability,
      intent.showInlineSources,
      intent.highlightContradictions,
    ]
  );
}

/**
 * Hook that returns only interaction intent flags.
 * Use when you only need interaction-related behaviors.
 */
export function useInteractionIntent() {
  const intent = useSemanticIntent();
  return useMemo(
    () => ({
      enableDeepDive: intent.enableDeepDive,
      enableComparison: intent.enableComparison,
    }),
    [intent.enableDeepDive, intent.enableComparison]
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the semantic intent profile for a given theme.
 * Useful for server-side rendering or non-React contexts.
 */
export function getSemanticIntentForTheme(
  theme: ReportTheme
): SemanticIntentValue {
  const isRadar = theme === 'radar';
  return {
    ...(isRadar ? radarIntent : swissIntent),
    theme,
    isRadar,
  };
}

/**
 * Merge custom overrides with theme-based intent.
 */
export function mergeIntentOverrides(
  theme: ReportTheme,
  overrides?: Partial<Omit<SemanticIntentValue, 'theme' | 'isRadar'>>
): SemanticIntentValue {
  const base = getSemanticIntentForTheme(theme);
  return {
    ...base,
    ...overrides,
  };
}
