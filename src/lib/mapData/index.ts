/**
 * Map Data Layer - Barrel exports
 *
 * Virtual data infrastructure for viewport-aware, lazy-loading map rendering.
 */

export { VirtualDataManager, getVirtualDataManager } from './virtualDataManager';
export type {
  WorldRect,
  DrillState,
  FilterCriteria,
  TemplateSummary,
  GroupSummary,
  LoadingState,
} from './virtualDataManager';

export { NodePool, getNodePool } from './nodePool';

export { FilterEngine, getFilterEngine } from './filterEngine';
export type { FilterResult } from './filterEngine';

export { HierarchyWorkerManager, getHierarchyWorkerManager } from './hierarchyWorker';
export type {
  SerializedSession,
  SerializedTopic,
  SerializedNode,
  HierarchyBuildOptions,
  WorkerProgress,
} from './hierarchyWorker';

export { PersistentCache, getPersistentCache } from './persistentCache';
