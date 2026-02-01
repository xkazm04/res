/**
 * Flow Visualizations Module
 *
 * Interactive Sankey and causal chain editor with drag-and-drop
 * flow building and what-if analysis capabilities.
 */

// Main visualization components
export { SankeyDiagram } from './SankeyDiagram';
export { EditableCausalChain } from './EditableCausalChain';

// Editor components
export { ChainStepEditor } from './ChainStepEditor';
export { WhatIfControls } from './WhatIfControls';

// Visual feedback components
export { ImpactPropagation } from './ImpactPropagation';
export { ChainComparator } from './ChainComparator';

// Re-export hook
export { useCausalEditor } from '@/src/hooks/useCausalEditor';
export type {
  ViewMode,
  EditMode,
  EditorState,
  EditorActions,
  SankeyData,
  UseCausalEditorReturn,
} from '@/src/hooks/useCausalEditor';

// Re-export layout types and utilities
export type {
  CausalNode,
  CausalEdge,
  CausalChain,
  SankeyNode,
  SankeyLink,
  WhatIfScenario,
  PropagationResult,
  ChainDifference,
  LayoutConfig,
} from '@/src/lib/causalLayout';

export {
  calculateHierarchicalLayout,
  calculateSankeyLayout,
  calculateImpactPropagation,
  applyWhatIfScenario,
  compareChains,
  optimizeLayout,
  generateEdgePath,
  generateSankeyPath,
  exportChainAsJSON,
  importChainFromJSON,
} from '@/src/lib/causalLayout';
