'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import React, { useMemo, useLayoutEffect, useEffect } from 'react';
import { themeStyles } from '@/src/components/report/core/ThemeContext';
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
} from '@/src/components/report/shared/semanticColors';
import type { ThemeName } from '@/src/components/report/shared/themeColors';

// =============================================================================
// Types
// =============================================================================

export type ReportTheme = 'radar' | 'swiss';
export type TabId = 'overview' | 'findings' | 'sources' | 'perspectives' | 'analysis' | 'entities';
export type FocusItemType = 'finding' | 'source' | 'entity' | 'perspective' | 'gap' | 'contradiction';

export interface FocusItem {
  type: FocusItemType;
  id: string;
  relatedIds?: {
    findings?: string[];
    sources?: string[];
    entities?: string[];
  };
}

export interface NavigationTarget {
  tab: TabId;
  entityId?: string;
  sourceId?: string;
}

export interface SemanticIntentValue {
  showUncertainty: boolean;
  emphasizeData: boolean;
  showTechnicalDetails: boolean;
  useAmbientEffects: boolean;
  animateUpdates: boolean;
  prioritizeReadability: boolean;
  showInlineSources: boolean;
  highlightContradictions: boolean;
  enableDeepDive: boolean;
  enableComparison: boolean;
  theme: ReportTheme;
  isRadar: boolean;
}

// Lens filter state
export interface LensFilters {
  search: string;
  type: string | null;
  confidence: [number, number];
  custom: Record<string, unknown>;
}

// =============================================================================
// Intent Profiles
// =============================================================================

const radarIntent: Omit<SemanticIntentValue, 'theme' | 'isRadar'> = {
  showUncertainty: true,
  emphasizeData: true,
  showTechnicalDetails: true,
  useAmbientEffects: true,
  animateUpdates: true,
  prioritizeReadability: false,
  showInlineSources: true,
  highlightContradictions: true,
  enableDeepDive: true,
  enableComparison: true,
};

const swissIntent: Omit<SemanticIntentValue, 'theme' | 'isRadar'> = {
  showUncertainty: false,
  emphasizeData: false,
  showTechnicalDetails: false,
  useAmbientEffects: false,
  animateUpdates: false,
  prioritizeReadability: true,
  showInlineSources: false,
  highlightContradictions: false,
  enableDeepDive: false,
  enableComparison: false,
};

// =============================================================================
// Store Interface
// =============================================================================

interface ReportState {
  // ============================================
  // Theme State
  // ============================================
  theme: ReportTheme;

  // ============================================
  // Focus State
  // ============================================
  focusedItem: FocusItem | null;
  focusHistory: FocusItem[];
  maxFocusHistory: number;

  // ============================================
  // Navigation State
  // ============================================
  activeTab: TabId;
  selectedEntityId: string | null;
  selectedSourceId: string | null;

  // ============================================
  // Lens State
  // ============================================
  activeLensId: string;
  lensFilters: LensFilters;

  // ============================================
  // Theme Actions
  // ============================================
  setTheme: (theme: ReportTheme) => void;

  // ============================================
  // Focus Actions
  // ============================================
  focus: (item: FocusItem) => void;
  focusFinding: (id: string, relatedSourceIds?: string[]) => void;
  focusSource: (id: string, relatedFindingIds?: string[]) => void;
  focusEntity: (id: string, relatedFindingIds?: string[], relatedSourceIds?: string[]) => void;
  clearFocus: () => void;
  goBack: () => void;
  isFocused: (type: FocusItemType, id: string) => boolean;
  isRelated: (type: FocusItemType, id: string) => boolean;

  // ============================================
  // Navigation Actions
  // ============================================
  navigateTo: (target: NavigationTarget) => void;
  setActiveTab: (tab: TabId) => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedSourceId: (id: string | null) => void;

  // ============================================
  // Lens Actions
  // ============================================
  setActiveLens: (lensId: string) => void;
  setLensFilter: <K extends keyof LensFilters>(key: K, value: LensFilters[K]) => void;
  resetLensFilters: () => void;

  // ============================================
  // Reset
  // ============================================
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialLensFilters: LensFilters = {
  search: '',
  type: null,
  confidence: [0, 100],
  custom: {},
};

const initialState = {
  theme: 'swiss' as ReportTheme,
  focusedItem: null,
  focusHistory: [],
  maxFocusHistory: 20,
  activeTab: 'overview' as TabId,
  selectedEntityId: null,
  selectedSourceId: null,
  activeLensId: 'overview',
  lensFilters: initialLensFilters,
};

// =============================================================================
// Store
// =============================================================================

export const useReportStore = create<ReportState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ============================================
    // Theme Actions
    // ============================================
    setTheme: (theme) => set({ theme }),

    // ============================================
    // Focus Actions
    // ============================================
    focus: (item) => {
      const { focusedItem, focusHistory, maxFocusHistory } = get();

      // Don't add to history if focusing same item
      if (focusedItem?.type === item.type && focusedItem?.id === item.id) {
        return;
      }

      const newHistory = focusedItem
        ? [...focusHistory, focusedItem].slice(-maxFocusHistory)
        : focusHistory;

      set({
        focusedItem: item,
        focusHistory: newHistory,
      });
    },

    focusFinding: (id, relatedSourceIds) => {
      get().focus({
        type: 'finding',
        id,
        relatedIds: relatedSourceIds ? { sources: relatedSourceIds } : undefined,
      });
    },

    focusSource: (id, relatedFindingIds) => {
      get().focus({
        type: 'source',
        id,
        relatedIds: relatedFindingIds ? { findings: relatedFindingIds } : undefined,
      });
    },

    focusEntity: (id, relatedFindingIds, relatedSourceIds) => {
      get().focus({
        type: 'entity',
        id,
        relatedIds: (relatedFindingIds || relatedSourceIds)
          ? { findings: relatedFindingIds, sources: relatedSourceIds }
          : undefined,
      });
    },

    clearFocus: () => set({ focusedItem: null }),

    goBack: () => {
      const { focusHistory } = get();
      if (focusHistory.length === 0) {
        set({ focusedItem: null });
        return;
      }

      const newHistory = [...focusHistory];
      const previous = newHistory.pop();

      set({
        focusedItem: previous || null,
        focusHistory: newHistory,
      });
    },

    isFocused: (type, id) => {
      const { focusedItem } = get();
      return focusedItem?.type === type && focusedItem?.id === id;
    },

    isRelated: (type, id) => {
      const { focusedItem } = get();
      if (!focusedItem?.relatedIds) return false;

      switch (type) {
        case 'finding':
          return focusedItem.relatedIds.findings?.includes(id) ?? false;
        case 'source':
          return focusedItem.relatedIds.sources?.includes(id) ?? false;
        case 'entity':
          return focusedItem.relatedIds.entities?.includes(id) ?? false;
        default:
          return false;
      }
    },

    // ============================================
    // Navigation Actions
    // ============================================
    navigateTo: (target) => {
      set({
        activeTab: target.tab,
        selectedEntityId: target.entityId ?? null,
        selectedSourceId: target.sourceId ?? null,
      });
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedEntityId: (id) => set({ selectedEntityId: id }),
    setSelectedSourceId: (id) => set({ selectedSourceId: id }),

    // ============================================
    // Lens Actions
    // ============================================
    setActiveLens: (lensId) => set({ activeLensId: lensId }),

    setLensFilter: (key, value) => {
      const { lensFilters } = get();
      set({
        lensFilters: { ...lensFilters, [key]: value },
      });
    },

    resetLensFilters: () => set({ lensFilters: initialLensFilters }),

    // ============================================
    // Reset
    // ============================================
    reset: () => set(initialState),
  }))
);

// =============================================================================
// Selector Hooks
// =============================================================================

/**
 * Hook to access theme state
 */
export function useReportTheme() {
  const theme = useReportStore((state) => state.theme);
  const reducedMotion = useReducedMotion();
  return { theme, reducedMotion };
}

/**
 * Hook to access theme styles (Tailwind classes)
 */
export function useThemeStyles() {
  const theme = useReportStore((state) => state.theme);
  return useMemo(() => themeStyles[theme], [theme]);
}

/**
 * Hook to access semantic intent values derived from theme
 */
export function useSemanticIntent(): SemanticIntentValue {
  const theme = useReportStore((state) => state.theme);
  const isRadar = theme === 'radar';

  return useMemo(() => {
    const baseIntent = isRadar ? radarIntent : swissIntent;
    return {
      ...baseIntent,
      theme,
      isRadar,
    };
  }, [theme, isRadar]);
}

/**
 * Hook for data display intent flags
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
 * Hook for visual effects intent flags
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
 * Hook for content priority intent flags
 */
export function useContentPriorityIntent() {
  const intent = useSemanticIntent();
  return useMemo(
    () => ({
      prioritizeReadability: intent.prioritizeReadability,
      showInlineSources: intent.showInlineSources,
      highlightContradictions: intent.highlightContradictions,
    }),
    [intent.prioritizeReadability, intent.showInlineSources, intent.highlightContradictions]
  );
}

/**
 * Hook for interaction intent flags
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

/**
 * Hook to access focus state
 */
export function useFocus() {
  const focusedItem = useReportStore((state) => state.focusedItem);
  const focusHistory = useReportStore((state) => state.focusHistory);
  const focus = useReportStore((state) => state.focus);
  const focusFinding = useReportStore((state) => state.focusFinding);
  const focusSource = useReportStore((state) => state.focusSource);
  const focusEntity = useReportStore((state) => state.focusEntity);
  const clearFocus = useReportStore((state) => state.clearFocus);
  const goBack = useReportStore((state) => state.goBack);
  const isFocused = useReportStore((state) => state.isFocused);
  const isRelated = useReportStore((state) => state.isRelated);

  return {
    focused: focusedItem,
    canGoBack: focusHistory.length > 0,
    historyLength: focusHistory.length,
    focus,
    focusFinding,
    focusSource,
    focusEntity,
    clearFocus,
    goBack,
    isFocused,
    isRelated,
  };
}

/**
 * Hook for checking focus state of an item
 */
export function useFocusState(type: FocusItemType, id: string): 'focused' | 'related' | null {
  const isFocused = useReportStore((state) => state.isFocused);
  const isRelated = useReportStore((state) => state.isRelated);

  if (isFocused(type, id)) return 'focused';
  if (isRelated(type, id)) return 'related';
  return null;
}

/**
 * Hook to access navigation state
 */
export function useNavigation() {
  const navigateTo = useReportStore((state) => state.navigateTo);
  const selectedEntityId = useReportStore((state) => state.selectedEntityId);
  const selectedSourceId = useReportStore((state) => state.selectedSourceId);

  return { navigateTo, selectedEntityId, selectedSourceId };
}

/**
 * Hook to access active tab
 */
export function useActiveTab() {
  const activeTab = useReportStore((state) => state.activeTab);
  const setActiveTab = useReportStore((state) => state.setActiveTab);
  return { activeTab, setActiveTab };
}

/**
 * Hook to access lens state
 */
export function useLens() {
  const activeLensId = useReportStore((state) => state.activeLensId);
  const lensFilters = useReportStore((state) => state.lensFilters);
  const setActiveLens = useReportStore((state) => state.setActiveLens);
  const setLensFilter = useReportStore((state) => state.setLensFilter);
  const resetLensFilters = useReportStore((state) => state.resetLensFilters);

  return {
    activeLensId,
    filters: lensFilters,
    setActiveLens,
    setFilter: setLensFilter,
    resetFilters: resetLensFilters,
  };
}

/**
 * Hook to access semantic colors
 */
export function useSemanticColors() {
  const theme = useReportStore((state) => state.theme);
  const themeName: ThemeName = theme === 'radar' ? 'radar' : 'swiss';
  const isRadar = theme === 'radar';

  return useMemo(() => ({
    theme: themeName,
    isRadar,

    forIntent: (intent: SemanticIntent) => getSemanticColor(intent, themeName),

    forConfidence: (score: number) => getSemanticColor(scoreToConfidenceIntent(score), themeName),

    forCredibility: (score: number) => getSemanticColor(scoreToCredibilityIntent(score), themeName),

    forPriority: (priority: string) => getSemanticColor(priorityToIntent(priority), themeName),

    forStatus: (status: string) => getSemanticColor(statusToIntent(status), themeName),

    forFindingType: (type: string) => getSemanticColor(findingTypeToIntent(type), themeName),

    forEntityType: (type: string) => getSemanticColor(entityTypeToIntent(type), themeName),

    badgeClasses: (intent: SemanticIntent) => getSemanticBadgeClasses(intent, themeName),

    cardClasses: (intent: SemanticIntent) => getSemanticCardClasses(intent, themeName),

    alertClasses: (intent: SemanticIntent) => getSemanticAlertClasses(intent, themeName),

    fromLegacyColor: (color: string) => getSemanticColor(legacyColorToIntent(color), themeName),

    palette: semanticColorPalettes[themeName],
  }), [themeName, isRadar]);
}

/**
 * Hook for confidence-based coloring
 */
export function useConfidenceColors(score: number): SemanticColorSpec {
  const { forConfidence } = useSemanticColors();
  return useMemo(() => forConfidence(score), [forConfidence, score]);
}

/**
 * Hook for credibility-based coloring
 */
export function useCredibilityColors(score: number): SemanticColorSpec {
  const { forCredibility } = useSemanticColors();
  return useMemo(() => forCredibility(score), [forCredibility, score]);
}

/**
 * Hook for priority-based coloring
 */
export function usePriorityColors(priority: string): SemanticColorSpec {
  const { forPriority } = useSemanticColors();
  return useMemo(() => forPriority(priority), [forPriority, priority]);
}

/**
 * Hook for status-based coloring
 */
export function useStatusColors(status: string): SemanticColorSpec {
  const { forStatus } = useSemanticColors();
  return useMemo(() => forStatus(status), [forStatus, status]);
}

// =============================================================================
// Provider Component (for backwards compatibility)
// =============================================================================

/**
 * ReportStateProvider - Initialize report store with theme
 *
 * This component initializes the Zustand store with the provided theme.
 * Use this at the root of your report components for backwards compatibility
 * with existing context-based code.
 */
export function ReportStateProvider({
  theme,
  children,
}: {
  theme: ReportTheme;
  children: React.ReactNode;
}) {
  const setTheme = useReportStore((state) => state.setTheme);

  // Use layout effect to sync theme before paint (falls back to useEffect on server)
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    const currentTheme = useReportStore.getState().theme;
    if (currentTheme !== theme) {
      setTheme(theme);
    }
  }, [theme, setTheme]);

  return <>{children}</>;
}
