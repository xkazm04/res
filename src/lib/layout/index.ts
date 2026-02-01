/**
 * Graph Layout Engine
 *
 * A unified layout system for network-style visualizations.
 *
 * @example
 * // Force-directed layout with hook
 * import { useForceLayout, useContainerDimensions } from '@/src/lib/layout';
 *
 * function NetworkViz({ nodes, edges }) {
 *   const [ref, dims] = useContainerDimensions();
 *   const positions = useForceLayout(nodes, edges, dims);
 *
 *   return (
 *     <div ref={ref}>
 *       {nodes.map(n => {
 *         const pos = positions.get(n.id);
 *         return <circle key={n.id} cx={pos?.x} cy={pos?.y} r={10} />;
 *       })}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Concentric layout for credibility visualization
 * import { useConcentricLayoutNodes } from '@/src/lib/layout';
 *
 * function SourceNetwork({ sources }) {
 *   const [ref, dims] = useContainerDimensions();
 *   const nodes = useConcentricLayoutNodes(
 *     sources.map(s => ({ ...s, value: s.credibility })),
 *     dims,
 *     { invertRadius: true }
 *   );
 *
 *   return (
 *     <div ref={ref}>
 *       {nodes.map(n => <circle key={n.id} cx={n.x} cy={n.y} />)}
 *     </div>
 *   );
 * }
 */

// Types
export type {
  LayoutNode,
  ForceNode,
  GroupedNode,
  LayoutEdge,
  StyledEdge,
  ForceLayoutConfig,
  CircularLayoutConfig,
  ConcentricLayoutConfig,
  ClusterLayoutConfig,
  LayoutResult,
  LayoutDimensions,
  Point,
  PositionMap,
  PositionUpdate,
  NodeWithData,
} from './types';

// Force-directed layout
export {
  forceDirectedLayout,
  getPositionMap,
  incrementalLayout,
  initializeForceNodes,
} from './force-directed';

// Circular layouts
export {
  circularLayout,
  concentricLayout,
  clusterLayout,
  positionOnRing,
  evenAngles,
  angleFromCenter,
  distance,
} from './circular';

// React hooks
export {
  useContainerDimensions,
  useForceLayout,
  useForceLayoutNodes,
  useCircularLayout,
  useConcentricLayout,
  useConcentricLayoutNodes,
  useClusterLayout,
  useCenter,
  useFindNodeAtPosition,
} from './hooks';
