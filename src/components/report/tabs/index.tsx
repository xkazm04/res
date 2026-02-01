// =============================================================================
// Legacy Tab Exports (for backward compatibility)
// =============================================================================

export { OverviewTab } from './OverviewTab';
export { FindingsTab } from './FindingsTab';
export { SourcesTab } from './SourcesTab';
export { PerspectivesTab } from './PerspectivesTab';
export { AnalysisTab } from './AnalysisTab';
export { EntitiesTab } from './EntitiesTab';

// =============================================================================
// Lens System Exports
// =============================================================================

// Core lens infrastructure
export {
  // Definition helpers
  defineLens,
  // Registry functions
  registerLens,
  getLens,
  getAllLenses,
  getVisibleLenses,
  // Statistics computation
  computeSessionStats,
  // Provider & Context
  LensProvider,
  useLensContext,
  useActiveLens,
  // Renderer components
  LensRenderer,
  LensTabBar,
  // Utility hooks
  useLensDataChanges,
  // Filter utilities
  matchesConfidenceLensFilter,
  applyLensFilters,
  // Types
  type LensDef,
  type Lens,
  type LensFilters,
  type LensFilterType,
  type LensRenderProps,
  type SessionStats,
  type LensRegistryEntry,
} from './TabLens';

// Lens definitions
export {
  overviewLens,
  findingsLens,
  sourcesLens,
  entitiesLens,
  analysisLens,
  perspectivesLens,
  registerAllLenses,
} from './lenses';
