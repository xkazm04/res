export * from './AnimatedNumber';
export * from './AnimatedValue';

// Re-export from Zustand store for backwards compatibility
// Legacy context providers are still available for gradual migration
export * from './ThemeContext';
export * from './NavigationContext';
export * from './FocusContext';
export * from './SemanticIntentContext';

// New unified store exports
export {
  useReportStore,
  useReportTheme,
  useThemeStyles,
  useSemanticIntent,
  useDataDisplayIntent,
  useVisualEffectsIntent,
  useContentPriorityIntent,
  useInteractionIntent,
  useFocus,
  useFocusState,
  useNavigation,
  useActiveTab,
  useLens,
  useSemanticColors,
  useConfidenceColors,
  useCredibilityColors,
  usePriorityColors,
  useStatusColors,
  ReportStateProvider,
  type ReportTheme,
  type TabId,
  type FocusItemType,
  type FocusItem,
  type NavigationTarget,
  type SemanticIntentValue,
  type LensFilters,
} from '@/src/stores/reportStore.js';
