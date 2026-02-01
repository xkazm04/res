/**
 * Animated Video Primitives
 *
 * Reusable building blocks for template-specific video scenes.
 * These components handle their own animation timing based on frame/fps props.
 */

// Network visualization for actor relationships and shell companies
export { NetworkDiagram } from './NetworkDiagram';
export type { NetworkNode, NetworkEdge } from './NetworkDiagram';

// Flow visualization for money trails and causal chains
export { FlowVisualization } from './FlowVisualization';
export type { FlowNode, FlowConnection } from './FlowVisualization';

// Side-by-side bar comparison for hype vs reality, price comparisons
export { ComparisonBars } from './ComparisonBars';
export type { ComparisonItem } from './ComparisonBars';

// Gauge/dial for risk meters and trust scores
export { GaugeMeter } from './GaugeMeter';
export type { GaugeFactor } from './GaugeMeter';

// Stacked alerts for red flags and warnings
export { AlertStack } from './AlertStack';
export type { AlertItem } from './AlertStack';

// Two-panel comparison layout for bull/bear, narrative comparison
export { SplitScreen, SplitContentItem } from './SplitScreen';

// Verdict display badges
export { VerdictBadge, VerdictIndicator } from './VerdictBadge';
export type { VerdictType } from './VerdictBadge';
