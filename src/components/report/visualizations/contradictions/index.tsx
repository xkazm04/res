/**
 * Contradiction Explorer Components
 *
 * Interactive tools for exploring and resolving contradictions in research.
 */

// Main component
export { ContradictionExplorer } from './ContradictionExplorer';
export type { ContradictionExplorerProps } from './ContradictionExplorer';

// Sub-components
export { ClaimComparison } from './ClaimComparison';
export { SourceQualityCompare } from './SourceQualityCompare';
export { ResolutionSuggester } from './ResolutionSuggester';
export { ConfidenceImpactSim } from './ConfidenceImpactSim';
export { ResolutionTracker } from './ResolutionTracker';

// Re-export hook
export { useContradictionExplorer } from '@/src/hooks/useContradictionExplorer';
export type {
  UseContradictionExplorerOptions,
  UseContradictionExplorerReturn,
  EnrichedContradiction,
  FilterStatus,
  SortOption,
} from '@/src/hooks/useContradictionExplorer';

// Re-export types from resolution library
export type {
  ResolutionStatus,
  SeverityLevel,
  ResolutionStrategyType,
  ContradictionWithContext,
  SeverityAnalysis,
  ResolutionStrategy,
  ConfidenceImpact,
  Resolution,
  ResolutionVote,
  ResolutionHistory,
  ResolutionEvent,
} from '@/src/lib/contradictionResolution';

// Re-export utility functions
export {
  calculateSeverity,
  generateResolutionStrategies,
  simulateConfidenceImpact,
  getSeverityColor,
  getStrategyIcon,
  formatConfidenceDelta,
} from '@/src/lib/contradictionResolution';
