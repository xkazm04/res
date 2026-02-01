/**
 * Network Visualization Components
 *
 * Advanced force-directed graph with hierarchical clustering,
 * path finding, and multiple layout algorithms.
 */

// Main component
export { AdvancedNetworkGraph } from './AdvancedNetworkGraph';
export type { AdvancedNetworkGraphProps } from './AdvancedNetworkGraph';

// Supporting components
export { GraphMinimap } from './GraphMinimap';
export { LayoutSwitcher } from './LayoutSwitcher';
export { GraphFilterPanel } from './GraphFilterPanel';
export { PathFinder } from './PathFinder';
export { GraphExporter } from './GraphExporter';

// Re-export types from graph algorithms
export type {
  GraphNode,
  GraphEdge,
  Cluster,
  PathResult,
  BundledEdge,
  LayoutConfig,
} from '@/src/lib/graphAlgorithms';

// Re-export hook
export { useForceGraph } from '@/src/hooks/useForceGraph';
export type {
  LayoutAlgorithm,
  GraphViewState,
  GraphSelection,
  GraphFilter,
  UseForceGraphOptions,
  UseForceGraphReturn,
} from '@/src/hooks/useForceGraph';
