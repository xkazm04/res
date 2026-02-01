/**
 * Strategic Map Types
 *
 * Type definitions for the Total War-style strategic map visualization
 * with semantic zoom, LOD, and performance optimizations.
 */

import type { ResearchSession } from '@/src/types/research';
import type { TopicWithSessions } from '@/src/stores/appStore';

// ============================================================================
// Zoom Levels
// ============================================================================

export type ZoomLevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface ZoomLevelConfig {
  level: ZoomLevel;
  minScale: number;
  maxScale: number;
  visibleNodeTypes: StrategicNodeType[];
  showLabels: boolean;
  showCounts: boolean;
  showConnections: boolean;
  /** Maximum nodes to render at this level for performance (optional) */
  nodeLimit?: number;
}

export const ZOOM_LEVELS: ZoomLevelConfig[] = [
  {
    level: 'L1',
    minScale: 0.05,
    maxScale: 0.25,
    visibleNodeTypes: ['cluster'],
    showLabels: true,
    showCounts: true,
    showConnections: false,
    nodeLimit: 50,
  },
  {
    level: 'L2',
    minScale: 0.25,
    maxScale: 0.6,
    visibleNodeTypes: ['template'],
    showLabels: true,
    showCounts: true,
    showConnections: false,
    nodeLimit: 100,
  },
  {
    level: 'L3',
    minScale: 0.6,
    maxScale: 1.2,
    visibleNodeTypes: ['template', 'thematic_group', 'topic'],
    showLabels: true,
    showCounts: true,
    showConnections: true,
    nodeLimit: 200,
  },
  {
    level: 'L4',
    minScale: 1.2,
    maxScale: 3.0,
    visibleNodeTypes: ['thematic_group', 'topic', 'session'],
    showLabels: true,
    showCounts: false,
    showConnections: true,
    nodeLimit: 500,
  },
];

// ============================================================================
// Node Types
// ============================================================================

export type StrategicNodeType = 'cluster' | 'template' | 'thematic_group' | 'topic' | 'session';
export type LODLevel = 'minimal' | 'standard' | 'detailed';

export interface StrategicMapNode {
  id: string;
  type: StrategicNodeType;
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
  aggregatedCount: number;
  children: string[];
  parent?: string;
  visible: boolean;
  lod: LODLevel;
  // Original data references
  templateType?: string;
  thematicGroup?: string;
  topic?: TopicWithSessions;
  session?: ResearchSession;
  sessions?: ResearchSession[];
  // Animation state
  targetX?: number;
  targetY?: number;
  targetRadius?: number;
  pulsePhase?: number;
}

// ============================================================================
// View State
// ============================================================================

export interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
  // Animation targets
  targetOffsetX?: number;
  targetOffsetY?: number;
  targetScale?: number;
}

export interface Viewport {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

// ============================================================================
// Interaction State
// ============================================================================

export interface InteractionState {
  isDragging: boolean;
  isPanning: boolean;
  panStartX: number;
  panStartY: number;
  lastMouseX: number;
  lastMouseY: number;
  // Momentum
  velocityX: number;
  velocityY: number;
  // Focus
  focusedNodeId: string | null;
  hoveredNodeId: string | null;
}

// ============================================================================
// Drill-down Focus State
// ============================================================================

export type DrillLevel = 'overview' | 'template' | 'topic';

export interface DrillDownState {
  /** Current drill level */
  level: DrillLevel;
  /** Focused template ID (when level is 'template' or 'topic') */
  focusedTemplateId: string | null;
  /** Focused topic ID (when level is 'topic') */
  focusedTopicId: string | null;
  /** Breadcrumb path for navigation */
  breadcrumbs: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  type: StrategicNodeType;
  color: string;
}

// ============================================================================
// Render State
// ============================================================================

export interface RenderState {
  needsRender: boolean;
  isAnimating: boolean;
  lastRenderTime: number;
  frameCount: number;
}

// ============================================================================
// Hierarchy
// ============================================================================

export interface NodeHierarchy {
  allNodes: StrategicMapNode[];
  nodeMap: Map<string, StrategicMapNode>;
  clusters: StrategicMapNode[];
  templates: StrategicMapNode[];
  thematicGroups: StrategicMapNode[];
  topics: StrategicMapNode[];
  sessions: StrategicMapNode[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

// ============================================================================
// Animation
// ============================================================================

export interface AnimationConfig {
  duration: number;
  easing: (t: number) => number;
}

export interface Animation {
  id: string;
  startTime: number;
  duration: number;
  startValue: number;
  endValue: number;
  property: string;
  target: string;
  easing: (t: number) => number;
  onComplete?: () => void;
}

// ============================================================================
// Configuration
// ============================================================================

export interface StrategicMapConfig {
  /** Respect prefers-reduced-motion */
  reducedMotion: boolean;
  /** Animation duration in ms */
  animationDuration: number;
  /** Minimum zoom scale */
  minScale: number;
  /** Maximum zoom scale */
  maxScale: number;
  /** Zoom speed factor */
  zoomSpeed: number;
  /** Pan inertia factor (0-1) */
  panInertia: number;
  /** Node padding for hit detection */
  hitPadding: number;
  /** Show debug info */
  debug: boolean;
}

export const DEFAULT_CONFIG: StrategicMapConfig = {
  reducedMotion: false,
  animationDuration: 300,
  minScale: 0.1,
  maxScale: 3.0,
  zoomSpeed: 1.15, // Slightly faster zoom
  panInertia: 0.85,
  hitPadding: 2.0, // Increased for better click detection at low zoom
  debug: false,
};

// ============================================================================
// Events
// ============================================================================

export interface StrategicMapEvents {
  onNodeClick?: (node: StrategicMapNode) => void;
  onNodeHover?: (node: StrategicMapNode | null) => void;
  onSessionSelect?: (session: ResearchSession) => void;
  onViewChange?: (view: ViewState, zoomLevel: ZoomLevel) => void;
}

// ============================================================================
// Spatial Index Types
// ============================================================================

export interface QuadtreeNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  data: StrategicMapNode;
}
