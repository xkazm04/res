/**
 * Strategic Map Renderer
 *
 * Canvas 2D rendering with:
 * - Viewport culling (only render visible nodes)
 * - Level of Detail (LOD) rendering
 * - No infinite animation loops (render on demand)
 * - Ambient background effects (particles, vignette)
 * - Connection lines between related nodes
 * - Smart label collision avoidance
 * - Heatmap visualization mode
 */

import type {
  StrategicMapNode,
  ViewState,
  Viewport,
  NodeHierarchy,
  LODLevel,
  StrategicMapConfig,
  DEFAULT_CONFIG,
} from './types';
import { SpatialIndex, calculateViewport, worldToScreen } from './spatialIndex';
import {
  getZoomLevel,
  filterVisibleNodes,
  updateNodeLODs,
  shouldShowLabel,
  shouldShowCount,
} from './zoomController';
import type { NodeTransitionState } from './animation';

// ============================================================================
// Render Mode
// ============================================================================

export type RenderMode = 'default' | 'heatmap-recency' | 'heatmap-density' | 'heatmap-status';

// ============================================================================
// Render Options
// ============================================================================

export interface RenderOptions {
  showGrid: boolean;
  showDebug: boolean;
  highlightedNodeId: string | null;
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  /** Nodes matched by search (will glow/pulse) */
  searchMatchIds?: Set<string>;
  /** Current render mode */
  renderMode?: RenderMode;
  /** Show ambient background effects */
  showAmbient?: boolean;
  /** Show connection lines between related nodes */
  showConnections?: boolean;
  /** Filter function to limit visible nodes (for drill-down) */
  nodeFilter?: (nodes: StrategicMapNode[]) => StrategicMapNode[];
  /** Node transition states from animation controller */
  nodeTransitions?: Map<string, NodeTransitionState>;
  /** Spring scale values for hover effects */
  hoverScales?: Map<string, number>;
  /** Timestamp for animated effects */
  timestamp?: number;
  /** Parent node ID (rendered grayed, clickable for back navigation) */
  parentNodeId?: string | null;
}

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  showGrid: true,
  showDebug: false,
  highlightedNodeId: null,
  hoveredNodeId: null,
  focusedNodeId: null,
  searchMatchIds: undefined,
  renderMode: 'default',
  showAmbient: true,
  showConnections: true,
};

// ============================================================================
// Particle System for Ambient Background
// ============================================================================

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  angle: number;
}

// ============================================================================
// Label Layout for Collision Avoidance
// ============================================================================

interface LabelRect {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number; // Higher = more important to show
  visible: boolean;
}

// ============================================================================
// Renderer Class
// ============================================================================

export class StrategicMapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spatialIndex: SpatialIndex;
  private hierarchy: NodeHierarchy | null = null;
  private config: StrategicMapConfig;
  private dpr: number = 1;
  private width: number = 0;
  private height: number = 0;

  // Particle system for ambient background
  private particles: Particle[] = [];
  private lastParticleUpdate: number = 0;

  // Label layout cache
  private labelRects: LabelRect[] = [];
  private lastLabelLayoutScale: number = 0;

  constructor(canvas: HTMLCanvasElement, config: Partial<StrategicMapConfig> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    this.spatialIndex = new SpatialIndex();
    this.config = { ...getDefaultConfig(), ...config };
    this.updateCanvasSize();
    this.initParticles();
  }

  /**
   * Initialize particle system
   */
  private initParticles(): void {
    const count = 80;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 0.2 + 0.05,
        angle: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Set the node hierarchy data
   */
  setData(hierarchy: NodeHierarchy): void {
    this.hierarchy = hierarchy;
    this.spatialIndex.build(hierarchy.allNodes);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<StrategicMapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update canvas size (call on resize)
   */
  updateCanvasSize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Get dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Render the map
   */
  render(view: ViewState, options: Partial<RenderOptions> = {}): void {
    const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };
    const { width, height } = this;
    const ctx = this.ctx;
    const timestamp = opts.timestamp || performance.now();

    // Clear canvas with background
    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, width, height);

    if (!this.hierarchy) {
      this.renderEmptyState();
      return;
    }

    // Calculate viewport in world coordinates
    const viewport = calculateViewport(
      width,
      height,
      view.offsetX,
      view.offsetY,
      view.scale
    );

    // Get visible nodes
    let nodesToRender: StrategicMapNode[];
    const zoomConfig = getZoomLevel(view.scale);

    if (opts.nodeFilter) {
      // Apply custom filter first (for drill-down)
      const filtered = opts.nodeFilter(this.hierarchy.allNodes);

      // Then apply zoom level filtering, but ALWAYS include the parent node for back navigation
      const parentId = opts.parentNodeId;
      nodesToRender = filtered.filter(node =>
        node.id === parentId || zoomConfig.visibleNodeTypes.includes(node.type)
      );
    } else {
      // Normal mode: use spatial index for viewport culling + zoom level filtering
      const visibleInViewport = this.spatialIndex.findNodesInViewport(viewport);
      nodesToRender = visibleInViewport.filter(node =>
        zoomConfig.visibleNodeTypes.includes(node.type)
      );
    }

    // Update LOD for visible nodes
    updateNodeLODs(
      nodesToRender,
      view.scale,
      viewport.centerX,
      viewport.centerY,
      viewport.width,
      viewport.height
    );

    // Render layers in order
    // 1. Ambient background (particles)
    if (opts.showAmbient !== false) {
      this.renderAmbientBackground(view, timestamp);
    }

    // 2. Grid
    if (opts.showGrid) {
      this.renderGrid(view);
    }

    // 2.5. Thematic group areas (subtle background regions)
    this.renderThematicGroupAreas(nodesToRender, view);

    // 3. Connection lines (bezier curves)
    if (opts.showConnections !== false) {
      this.renderConnections(nodesToRender, view, opts);
    }

    // 4. Nodes
    this.renderNodes(nodesToRender, view, opts, timestamp);

    // 5. Labels with collision avoidance
    this.renderLabelsWithCollision(nodesToRender, view, opts);

    // 6. Vignette overlay
    if (opts.showAmbient !== false) {
      this.renderVignette();
    }

    // 7. Search highlights
    if (opts.searchMatchIds && opts.searchMatchIds.size > 0) {
      this.renderSearchHighlights(nodesToRender, view, opts.searchMatchIds, timestamp);
    }

    if (opts.showDebug) {
      this.renderDebugInfo(view, nodesToRender.length, this.hierarchy.allNodes.length);
    }
  }

  // ==========================================================================
  // Ambient Background Rendering
  // ==========================================================================

  private renderAmbientBackground(view: ViewState, timestamp: number): void {
    const { ctx, width, height } = this;
    const deltaTime = (timestamp - this.lastParticleUpdate) / 1000;
    this.lastParticleUpdate = timestamp;

    // Update and render particles
    ctx.save();

    for (const particle of this.particles) {
      // Update position with parallax effect
      particle.x += Math.cos(particle.angle) * particle.speed * deltaTime * 60;
      particle.y += Math.sin(particle.angle) * particle.speed * deltaTime * 60;

      // Wrap around
      if (particle.x < -1000) particle.x = 1000;
      if (particle.x > 1000) particle.x = -1000;
      if (particle.y < -1000) particle.y = 1000;
      if (particle.y > 1000) particle.y = -1000;

      // Convert to screen coordinates with parallax
      const parallaxFactor = 0.3;
      const screenX = width / 2 + (particle.x + view.offsetX * parallaxFactor) * view.scale * 0.5;
      const screenY = height / 2 + (particle.y + view.offsetY * parallaxFactor) * view.scale * 0.5;

      // Only render if on screen
      if (screenX >= -10 && screenX <= width + 10 && screenY >= -10 && screenY <= height + 10) {
        // Twinkle effect
        const twinkle = 0.5 + 0.5 * Math.sin(timestamp * 0.002 + particle.x * 0.1);
        const alpha = particle.alpha * twinkle;

        ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderVignette(): void {
    const { ctx, width, height } = this;

    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.7, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // ==========================================================================
  // Grid Rendering
  // ==========================================================================

  private renderGrid(view: ViewState): void {
    const { ctx, width, height } = this;
    const { offsetX, offsetY, scale } = view;

    // Subtle grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
    ctx.lineWidth = 1;

    const gridSize = 100 * scale;
    const startX = (offsetX % gridSize) - gridSize;
    const startY = (offsetY % gridSize) - gridSize;

    ctx.beginPath();
    for (let x = startX; x < width + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Radar circles (only at higher zoom levels)
    if (scale > 0.3) {
      const centerX = width / 2 + offsetX;
      const centerY = height / 2 + offsetY;

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)';
      for (let r = 150; r < 1200; r += 200) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // ==========================================================================
  // Thematic Group Area Rendering
  // ==========================================================================

  /**
   * Render subtle background areas for thematic groups
   * Creates translucent blob-like regions behind nodes of the same group
   */
  private renderThematicGroupAreas(
    nodes: StrategicMapNode[],
    view: ViewState
  ): void {
    const { ctx, width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    // Group nodes by thematic group
    const groupedNodes = new Map<string, StrategicMapNode[]>();

    for (const node of nodes) {
      // Include thematic_group nodes and their child sessions
      if (node.type === 'thematic_group' && node.thematicGroup) {
        const groupName = node.thematicGroup;
        if (!groupedNodes.has(groupName)) {
          groupedNodes.set(groupName, []);
        }
        groupedNodes.get(groupName)!.push(node);
      } else if (node.type === 'session' && node.thematicGroup) {
        const groupName = node.thematicGroup;
        if (!groupedNodes.has(groupName)) {
          groupedNodes.set(groupName, []);
        }
        groupedNodes.get(groupName)!.push(node);
      }
    }

    // Only render areas if there are multiple groups with multiple nodes
    if (groupedNodes.size < 2) return;

    ctx.save();

    for (const [groupName, groupNodes] of groupedNodes) {
      if (groupNodes.length < 2) continue;

      // Calculate bounding box for the group
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let sumX = 0, sumY = 0;

      for (const node of groupNodes) {
        const screenX = centerX + node.x * view.scale;
        const screenY = centerY + node.y * view.scale;
        const screenRadius = node.radius * view.scale;

        minX = Math.min(minX, screenX - screenRadius);
        maxX = Math.max(maxX, screenX + screenRadius);
        minY = Math.min(minY, screenY - screenRadius);
        maxY = Math.max(maxY, screenY + screenRadius);
        sumX += screenX;
        sumY += screenY;
      }

      // Calculate center and radius of the group area
      const areaCenterX = sumX / groupNodes.length;
      const areaCenterY = sumY / groupNodes.length;
      const areaWidth = maxX - minX;
      const areaHeight = maxY - minY;
      const areaRadius = Math.max(areaWidth, areaHeight) / 2 + 30; // Add padding

      // Get the group's color from the first node
      const groupColor = groupNodes[0].color;

      // Draw subtle radial gradient background
      const gradient = ctx.createRadialGradient(
        areaCenterX, areaCenterY, 0,
        areaCenterX, areaCenterY, areaRadius
      );
      gradient.addColorStop(0, groupColor + '08'); // Very subtle at center
      gradient.addColorStop(0.6, groupColor + '05');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(areaCenterX, areaCenterY, areaRadius, areaRadius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw subtle dashed border
      ctx.strokeStyle = groupColor + '15';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.ellipse(areaCenterX, areaCenterY, areaRadius - 5, (areaRadius - 5) * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // ==========================================================================
  // Connection Rendering
  // ==========================================================================

  private renderConnections(
    nodes: StrategicMapNode[],
    view: ViewState,
    opts: RenderOptions
  ): void {
    const { ctx, width, height } = this;
    const zoomConfig = getZoomLevel(view.scale);

    if (!zoomConfig.showConnections) {
      return;
    }

    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    // Get parent-child connections
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const hoveredId = opts.hoveredNodeId;

    ctx.lineCap = 'round';

    for (const node of nodes) {
      if (!node.parent) continue;

      const parent = nodeMap.get(node.parent);
      if (!parent) continue;

      // Screen positions
      const x1 = centerX + parent.x * view.scale;
      const y1 = centerY + parent.y * view.scale;
      const x2 = centerX + node.x * view.scale;
      const y2 = centerY + node.y * view.scale;

      // Highlight connections to/from hovered node
      const isHighlighted = hoveredId === node.id || hoveredId === parent.id;

      // Calculate control points for bezier curve
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      // Curve control points - perpendicular offset
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const curveOffset = Math.min(30, dist * 0.15);

      // Perpendicular direction
      const perpX = -dy / dist * curveOffset;
      const perpY = dx / dist * curveOffset;

      const cpX = midX + perpX;
      const cpY = midY + perpY;

      // Draw connection with gradient
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      if (isHighlighted) {
        gradient.addColorStop(0, parent.color + '80');
        gradient.addColorStop(1, node.color + '60');
        ctx.lineWidth = 2;
      } else {
        gradient.addColorStop(0, parent.color + '25');
        gradient.addColorStop(1, node.color + '15');
        ctx.lineWidth = 1;
      }

      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cpX, cpY, x2, y2);
      ctx.stroke();

      // Draw glow for highlighted connections
      if (isHighlighted) {
        ctx.strokeStyle = parent.color + '20';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpX, cpY, x2, y2);
        ctx.stroke();
      }
    }
  }

  // ==========================================================================
  // Node Rendering
  // ==========================================================================

  private renderNodes(
    nodes: StrategicMapNode[],
    view: ViewState,
    opts: RenderOptions,
    timestamp: number
  ): void {
    const { ctx, width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    // Sort nodes by type for proper layering (clusters first, then templates, topics, sessions)
    const sortedNodes = [...nodes].sort((a, b) => {
      const order: Record<string, number> = {
        cluster: 0,
        template: 1,
        topic: 2,
        session: 3,
      };
      return order[a.type] - order[b.type];
    });

    for (const node of sortedNodes) {
      // Get transition state if available
      const transition = opts.nodeTransitions?.get(node.id);
      const hoverScale = opts.hoverScales?.get(node.id) ?? 1;

      // Apply transition opacity and scale
      const opacity = transition?.opacity ?? 1;
      const transitionScale = transition?.scale ?? 1;
      const finalScale = hoverScale * transitionScale;

      // Skip fully transparent nodes
      if (opacity < 0.01) continue;

      const screenX = centerX + node.x * view.scale;
      const screenY = centerY + node.y * view.scale;
      const screenRadius = node.radius * view.scale * finalScale;

      // Determine rendering style based on state
      const isHovered = opts.hoveredNodeId === node.id;
      const isFocused = opts.focusedNodeId === node.id;
      const isHighlighted = opts.highlightedNodeId === node.id;
      const isSearchMatch = opts.searchMatchIds?.has(node.id) ?? false;
      const isParentForBack = opts.parentNodeId === node.id;

      // Get color based on render mode, or use grayed color for parent back-navigation node
      const nodeColor = isParentForBack
        ? '#52525B' // Grayed color for parent node (clickable for back)
        : this.getNodeColor(node, opts.renderMode, timestamp);

      // Render based on LOD with opacity
      ctx.save();
      ctx.globalAlpha = opacity;

      switch (node.lod) {
        case 'minimal':
          this.renderNodeMinimal(ctx, node, screenX, screenY, screenRadius, isHovered, nodeColor);
          break;
        case 'standard':
          this.renderNodeStandard(ctx, node, screenX, screenY, screenRadius, isHovered, isFocused, nodeColor);
          break;
        case 'detailed':
          this.renderNodeDetailed(ctx, node, screenX, screenY, screenRadius, isHovered, isFocused, view.scale, nodeColor, timestamp);
          break;
      }

      // Magnetic hover glow effect
      if (isHovered && hoverScale > 1) {
        this.renderHoverGlow(ctx, screenX, screenY, screenRadius, nodeColor, timestamp);
      }

      ctx.restore();
    }
  }

  /**
   * Get node color based on render mode
   */
  private getNodeColor(node: StrategicMapNode, mode?: RenderMode, timestamp?: number): string {
    if (!mode || mode === 'default') {
      return node.color;
    }

    const session = node.session || (node.sessions && node.sessions[0]);
    if (!session) return node.color;

    switch (mode) {
      case 'heatmap-recency': {
        // Color by recency (green = recent, gray = old)
        const createdAt = new Date(session.created_at).getTime();
        const now = Date.now();
        const age = (now - createdAt) / (1000 * 60 * 60 * 24); // days
        const recencyFactor = Math.max(0, 1 - age / 30); // Fade over 30 days

        // Interpolate from gray to green
        const r = Math.round(107 + (34 - 107) * recencyFactor);
        const g = Math.round(107 + (197 - 107) * recencyFactor);
        const b = Math.round(107 + (94 - 107) * recencyFactor);
        return `rgb(${r}, ${g}, ${b})`;
      }

      case 'heatmap-density': {
        // Color by finding count (intensity)
        const count = session.claim_count || node.aggregatedCount;
        const intensity = Math.min(1, count / 50);

        // Interpolate from cyan to magenta
        const r = Math.round(34 + (236 - 34) * intensity);
        const g = Math.round(211 - 100 * intensity);
        const b = Math.round(238 - 70 * intensity);
        return `rgb(${r}, ${g}, ${b})`;
      }

      case 'heatmap-status': {
        // Color by status
        const status = session.status;
        switch (status) {
          case 'completed': return '#22C55E'; // Green
          case 'active':
          case 'searching':
          case 'analyzing':
            // Pulsing effect for in-progress
            const pulse = timestamp ? 0.7 + 0.3 * Math.sin(timestamp * 0.003) : 1;
            return `rgba(250, 204, 21, ${pulse})`; // Yellow
          case 'failed': return '#EF4444'; // Red
          default: return '#6B7280'; // Gray
        }
      }

      default:
        return node.color;
    }
  }

  /**
   * Render magnetic hover glow effect
   */
  private renderHoverGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    timestamp: number
  ): void {
    // Pulsing glow
    const pulsePhase = Math.sin(timestamp * 0.004) * 0.3 + 0.7;
    const glowRadius = radius * 2.5;

    const gradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, glowRadius);
    gradient.addColorStop(0, color + Math.round(80 * pulsePhase).toString(16).padStart(2, '0'));
    gradient.addColorStop(0.5, color + Math.round(30 * pulsePhase).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================================================
  // LOD Rendering Methods
  // ==========================================================================

  /**
   * Minimal LOD - simple filled circle
   */
  private renderNodeMinimal(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    isHovered: boolean,
    color?: string
  ): void {
    const c = color || node.color;
    ctx.fillStyle = c + (isHovered ? 'CC' : '88');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Standard LOD - gradient fill with border
   */
  private renderNodeStandard(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    isHovered: boolean,
    isFocused: boolean,
    color?: string
  ): void {
    const c = color || node.color;

    // Inner gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, c + (isHovered ? 'EE' : 'AA'));
    gradient.addColorStop(0.7, c + (isHovered ? 'AA' : '66'));
    gradient.addColorStop(1, c + (isHovered ? '66' : '33'));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = c + (isFocused ? 'FF' : isHovered ? 'DD' : '88');
    ctx.lineWidth = isFocused ? 3 : 2;
    ctx.stroke();
  }

  /**
   * Detailed LOD - full glow, gradient, border
   */
  private renderNodeDetailed(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    isHovered: boolean,
    isFocused: boolean,
    scale: number,
    color?: string,
    timestamp?: number
  ): void {
    const c = color || node.color;

    // Outer glow
    const glowRadius = radius * 2;
    const glowGradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
    glowGradient.addColorStop(0, c + (isHovered ? '40' : '25'));
    glowGradient.addColorStop(0.5, c + '10');
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner gradient
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    innerGradient.addColorStop(0, c + (isHovered ? 'FF' : 'CC'));
    innerGradient.addColorStop(0.6, c + (isHovered ? 'CC' : '88'));
    innerGradient.addColorStop(1, c + (isHovered ? '88' : '44'));

    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = c + 'FF';
    ctx.lineWidth = isFocused ? 3 : 2;
    ctx.stroke();

    // Inner highlight for depth
    const highlightGradient = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    highlightGradient.addColorStop(0.5, 'transparent');

    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================================================
  // Label and Count Rendering
  // ==========================================================================

  private renderLabel(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    scale: number
  ): void {
    const fontSize = Math.max(10, Math.min(16, 12 * scale));
    ctx.fillStyle = '#E8E8E8';
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Position label above node
    const labelY = y - radius - 12 * scale;

    // Truncate long labels
    let label = node.label;
    if (label.length > 25) {
      label = label.substring(0, 22) + '...';
    }

    ctx.fillText(label, x, labelY);
  }

  private renderCount(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    scale: number
  ): void {
    const fontSize = Math.max(9, Math.min(12, 10 * scale));
    ctx.fillStyle = '#A1A1AA';
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Position count below node
    const countY = y + radius + 10 * scale;
    ctx.fillText(`${node.aggregatedCount}`, x, countY);
  }

  // ==========================================================================
  // Label Collision Avoidance
  // ==========================================================================

  /**
   * Render labels with collision avoidance
   * Uses force-directed positioning and priority-based visibility
   */
  private renderLabelsWithCollision(
    nodes: StrategicMapNode[],
    view: ViewState,
    opts: RenderOptions
  ): void {
    const { ctx, width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    // Build label rects - use much larger font for clusters at low zoom (L1 overview)
    const baseSize = view.scale < 0.2 ? 28 : view.scale < 0.35 ? 22 : 14;
    const fontSize = Math.max(14, Math.min(32, baseSize * Math.max(1, view.scale * 1.5)));
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;

    const labelRects: LabelRect[] = [];

    for (const node of nodes) {
      if (!shouldShowLabel(node, view.scale, node.lod)) continue;

      const screenX = centerX + node.x * view.scale;
      const screenY = centerY + node.y * view.scale;
      const screenRadius = node.radius * view.scale;

      // Truncate long labels
      let label = node.label;
      if (label.length > 25) {
        label = label.substring(0, 22) + '...';
      }

      const metrics = ctx.measureText(label);
      const labelWidth = metrics.width + 8;
      const labelHeight = fontSize + 4;
      const labelX = screenX - labelWidth / 2;
      // Position labels further above nodes for clusters (more spacing at L1)
      const labelOffset = node.type === 'cluster' ? 25 : 15;
      const labelY = screenY - screenRadius - labelOffset * Math.max(1, view.scale) - labelHeight / 2;

      // Priority based on node type and aggregated count
      const typePriority: Record<string, number> = { cluster: 100, template: 80, topic: 60, session: 40 };
      const priority = (typePriority[node.type] || 50) + Math.log10(node.aggregatedCount + 1) * 10;

      // Check if hovered or focused (always show)
      const alwaysShow = opts.hoveredNodeId === node.id || opts.focusedNodeId === node.id;

      labelRects.push({
        nodeId: node.id,
        x: labelX,
        y: labelY,
        width: labelWidth,
        height: labelHeight,
        priority: alwaysShow ? 1000 : priority,
        visible: true,
      });
    }

    // Sort by priority (highest first)
    labelRects.sort((a, b) => b.priority - a.priority);

    // Collision detection - hide lower priority labels that overlap
    const visibleRects: LabelRect[] = [];

    for (const rect of labelRects) {
      let hasCollision = false;

      for (const visible of visibleRects) {
        if (this.rectsOverlap(rect, visible)) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        visibleRects.push(rect);
        rect.visible = true;
      } else {
        rect.visible = false;
      }
    }

    // Calculate distance from viewport center for fade effect
    const maxDist = Math.sqrt(width * width + height * height) / 2;

    // Render visible labels
    for (const rect of visibleRects) {
      const node = nodes.find(n => n.id === rect.nodeId);
      if (!node) continue;

      // Distance-based alpha (focus+context)
      const dx = rect.x + rect.width / 2 - width / 2;
      const dy = rect.y + rect.height / 2 - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const distFactor = 1 - Math.pow(dist / maxDist, 2) * 0.5;

      const isHovered = opts.hoveredNodeId === node.id;
      const isFocused = opts.focusedNodeId === node.id;

      // Label text
      let label = node.label;
      if (label.length > 25) {
        label = label.substring(0, 22) + '...';
      }

      // Render with distance-based fade
      ctx.save();
      ctx.globalAlpha = isHovered || isFocused ? 1 : Math.max(0.4, distFactor);
      ctx.fillStyle = isHovered ? '#FFFFFF' : isFocused ? '#22D3EE' : '#E8E8E8';
      ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
    }

    // Render counts
    for (const node of nodes) {
      if (!shouldShowCount(node, view.scale, node.lod) || node.aggregatedCount <= 1) continue;

      const screenX = centerX + node.x * view.scale;
      const screenY = centerY + node.y * view.scale;
      const screenRadius = node.radius * view.scale;

      this.renderCount(ctx, node, screenX, screenY, screenRadius, view.scale);
    }
  }

  /**
   * Check if two rectangles overlap
   */
  private rectsOverlap(a: LabelRect, b: LabelRect): boolean {
    return !(a.x + a.width < b.x ||
             b.x + b.width < a.x ||
             a.y + a.height < b.y ||
             b.y + b.height < a.y);
  }

  // ==========================================================================
  // Search Highlights
  // ==========================================================================

  /**
   * Render pulsing highlights for search matches
   */
  private renderSearchHighlights(
    nodes: StrategicMapNode[],
    view: ViewState,
    matchIds: Set<string>,
    timestamp: number
  ): void {
    const { ctx, width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    const pulse = 0.5 + 0.5 * Math.sin(timestamp * 0.005);

    for (const node of nodes) {
      if (!matchIds.has(node.id)) continue;

      const screenX = centerX + node.x * view.scale;
      const screenY = centerY + node.y * view.scale;
      const screenRadius = node.radius * view.scale;

      // Pulsing ring
      const ringRadius = screenRadius * (1.5 + pulse * 0.3);
      const ringWidth = 3 + pulse * 2;

      ctx.save();
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = ringWidth;
      ctx.beginPath();
      ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        screenX, screenY, screenRadius,
        screenX, screenY, screenRadius * 2.5
      );
      glowGradient.addColorStop(0, `rgba(34, 211, 238, ${0.3 * pulse})`);
      glowGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ==========================================================================
  // Debug and Empty State
  // ==========================================================================

  private renderDebugInfo(
    view: ViewState,
    renderedCount: number,
    totalCount: number
  ): void {
    const { ctx, width, height } = this;
    const zoomLevel = getZoomLevel(view.scale);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);

    ctx.fillStyle = '#22D3EE';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText(`Scale: ${view.scale.toFixed(2)}`, 20, 20);
    ctx.fillText(`Zoom Level: ${zoomLevel.level}`, 20, 35);
    ctx.fillText(`Rendered: ${renderedCount}/${totalCount}`, 20, 50);
    ctx.fillText(`Offset: (${view.offsetX.toFixed(0)}, ${view.offsetY.toFixed(0)})`, 20, 65);
  }

  private renderEmptyState(): void {
    const { ctx, width, height } = this;

    ctx.fillStyle = '#71717A';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data to display', width / 2, height / 2);
  }

  // ==========================================================================
  // Hit Testing
  // ==========================================================================

  /**
   * Find node at screen coordinates
   * Uses direct screen-space hit testing for accuracy
   */
  findNodeAt(screenX: number, screenY: number, view: ViewState): StrategicMapNode | null {
    if (!this.hierarchy) return null;

    const { width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;
    const zoomConfig = getZoomLevel(view.scale);

    // Direct screen-space hit testing - check against actual rendered positions
    // This ensures hit detection matches exactly what's rendered
    let closestNode: StrategicMapNode | null = null;
    let closestDist = Infinity;

    // Minimum clickable radius in screen pixels (ensures small nodes are clickable)
    const minClickRadius = 25;
    // Hit padding multiplier (clickable area is larger than visual)
    const hitMultiplier = 1.5;

    for (const node of this.hierarchy.allNodes) {
      // Only check nodes visible at current zoom level
      if (!zoomConfig.visibleNodeTypes.includes(node.type)) {
        continue;
      }

      // Calculate node's screen position (same formula as rendering)
      const nodeScreenX = centerX + node.x * view.scale;
      const nodeScreenY = centerY + node.y * view.scale;
      const nodeScreenRadius = node.radius * view.scale;

      // Calculate distance from click to node center (in screen pixels)
      const dx = screenX - nodeScreenX;
      const dy = screenY - nodeScreenY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Hit radius: max of (visual radius * multiplier) and minimum clickable size
      const hitRadius = Math.max(nodeScreenRadius * hitMultiplier, minClickRadius);

      // Check if click is within hit radius
      if (dist <= hitRadius && dist < closestDist) {
        closestDist = dist;
        closestNode = node;
      }
    }

    return closestNode;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.spatialIndex.clear();
    this.hierarchy = null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultConfig(): StrategicMapConfig {
  return {
    reducedMotion: false,
    animationDuration: 300,
    minScale: 0.1,
    maxScale: 3.0,
    zoomSpeed: 1.1,
    panInertia: 0.85,
    hitPadding: 1.5,
    debug: false,
  };
}
