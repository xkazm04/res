/**
 * Strategic Map Renderer
 *
 * Canvas 2D rendering with:
 * - 3-tier particle system (~250 particles) with constellation lines
 * - Type-specific node rendering (template donut, topic frosted glass, session micro-card)
 * - Animated data-flow particles along bezier connections
 * - Skeleton shimmer / ghost nodes for loading states
 * - Viewport culling (only render visible nodes)
 * - Level of Detail (LOD) rendering
 * - No infinite animation loops (render on demand, driven by opts.timestamp)
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
import { getLabelCache } from './labelCache';

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
  /** Skip label collision avoidance (show all visible-node labels, used when drilled in) */
  skipLabelCollision?: boolean;
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
// Template Colors
// ============================================================================

const TEMPLATE_COLORS: Record<string, string> = {
  investigative: '#E03131',
  financial: '#228BE6',
  competitive: '#7950F2',
  tech_market: '#2F9E44',
  legal: '#1864AB',
  due_diligence: '#F59F00',
  contract: '#862E9C',
  understanding: '#0B7285',
  purchase_decision: '#E8590C',
  reputation: '#C2255C',
};

// ============================================================================
// 3-Tier Particle System
// ============================================================================

type ParticleTier = 'dust' | 'nebula' | 'sparkle';

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  angle: number;
  tier: ParticleTier;
  /** Template color for nebula particles */
  color: string;
  /** Parent template node world position (nebula tier) */
  anchorX: number;
  anchorY: number;
  /** Lifecycle phase for sparkle tier (0-1, wraps) */
  lifecycle: number;
  /** Lifecycle speed for sparkle tier */
  lifecycleSpeed: number;
}

// ============================================================================
// Data-Flow Particle (on connections)
// ============================================================================

interface FlowParticle {
  /** Normalized position along bezier 0..1 */
  t: number;
  /** Speed in t-units per second */
  speed: number;
  /** Color of the particle */
  color: string;
}

interface ConnectionFlow {
  parentId: string;
  childId: string;
  particles: FlowParticle[];
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

  // Double buffering
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  // 3-tier particle system
  private particles: Particle[] = [];
  private lastParticleUpdate: number = 0;

  // Connection flow particles
  private connectionFlows: ConnectionFlow[] = [];
  private lastFlowUpdate: number = 0;

  // Label layout cache
  private labelRects: LabelRect[] = [];
  private lastLabelLayoutScale: number = 0;

  // Click ripple effects
  private ripples: Array<{
    x: number; y: number; startTime: number; maxRadius: number; color: string;
  }> = [];

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

  // ==========================================================================
  // 3-Tier Particle Initialization
  // ==========================================================================

  /**
   * Initialize 3-tier particle system (~250 particles)
   */
  private initParticles(): void {
    this.particles = [];

    // Tier 1: Background dust (150 particles)
    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: Math.random() * 4000 - 2000,
        y: Math.random() * 4000 - 2000,
        size: Math.random() * 0.5 + 0.5, // 0.5 - 1px
        alpha: Math.random() * 0.10 + 0.05, // 0.05 - 0.15
        speed: Math.random() * 0.08 + 0.02, // very slow drift
        angle: Math.random() * Math.PI * 2,
        tier: 'dust',
        color: Math.random() > 0.5 ? '#FFFFFF' : '#94A3B8', // white / cool gray
        anchorX: 0,
        anchorY: 0,
        lifecycle: 0,
        lifecycleSpeed: 0,
      });
    }

    // Tier 2: Nebula layer (70 particles) -- anchored near template nodes
    // Positions will be re-seeded when setData is called; initial random spread
    const templateColorValues = Object.values(TEMPLATE_COLORS);
    for (let i = 0; i < 70; i++) {
      const col = templateColorValues[i % templateColorValues.length];
      this.particles.push({
        x: Math.random() * 3000 - 1500,
        y: Math.random() * 3000 - 1500,
        size: Math.random() * 2 + 2, // 2-4px
        alpha: Math.random() * 0.15 + 0.10, // 0.10 - 0.25
        speed: Math.random() * 0.12 + 0.04,
        angle: Math.random() * Math.PI * 2,
        tier: 'nebula',
        color: col,
        anchorX: Math.random() * 2000 - 1000,
        anchorY: Math.random() * 2000 - 1000,
        lifecycle: 0,
        lifecycleSpeed: 0,
      });
    }

    // Tier 3: Sparkle (30 particles) -- fast twinkle near active sessions
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * 3000 - 1500,
        y: Math.random() * 3000 - 1500,
        size: Math.random() * 0.5 + 0.3, // 0.3-0.8px
        alpha: 0,
        speed: Math.random() * 0.15 + 0.05,
        angle: Math.random() * Math.PI * 2,
        tier: 'sparkle',
        color: '#FFFFFF',
        anchorX: 0,
        anchorY: 0,
        lifecycle: Math.random(), // start at random phase
        lifecycleSpeed: Math.random() * 1.5 + 1.0, // fast cycle
      });
    }
  }

  /**
   * Re-seed nebula/sparkle particle anchors from actual node positions
   */
  private seedParticleAnchors(): void {
    if (!this.hierarchy) return;

    const templates = this.hierarchy.templates;
    const sessions = this.hierarchy.sessions;

    // Nebula particles: anchor near template nodes
    const nebulaParticles = this.particles.filter(p => p.tier === 'nebula');
    for (let i = 0; i < nebulaParticles.length; i++) {
      if (templates.length > 0) {
        const tpl = templates[i % templates.length];
        nebulaParticles[i].anchorX = tpl.x;
        nebulaParticles[i].anchorY = tpl.y;
        nebulaParticles[i].color = tpl.color;
        // Place near anchor
        nebulaParticles[i].x = tpl.x + (Math.random() - 0.5) * tpl.radius * 6;
        nebulaParticles[i].y = tpl.y + (Math.random() - 0.5) * tpl.radius * 6;
      }
    }

    // Sparkle particles: anchor near recent/active sessions
    const recentSessions = sessions
      .filter(s => s.session)
      .sort((a, b) => {
        const aTime = a.session ? new Date(a.session.created_at).getTime() : 0;
        const bTime = b.session ? new Date(b.session.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 30);

    const sparkleParticles = this.particles.filter(p => p.tier === 'sparkle');
    for (let i = 0; i < sparkleParticles.length; i++) {
      if (recentSessions.length > 0) {
        const sess = recentSessions[i % recentSessions.length];
        sparkleParticles[i].anchorX = sess.x;
        sparkleParticles[i].anchorY = sess.y;
        sparkleParticles[i].x = sess.x + (Math.random() - 0.5) * sess.radius * 4;
        sparkleParticles[i].y = sess.y + (Math.random() - 0.5) * sess.radius * 4;
      }
    }
  }

  /**
   * Build connection flow particles from hierarchy
   */
  private buildConnectionFlows(): void {
    this.connectionFlows = [];
    if (!this.hierarchy) return;

    const nodeMap = this.hierarchy.nodeMap;
    for (const node of this.hierarchy.allNodes) {
      if (!node.parent) continue;
      const parent = nodeMap.get(node.parent);
      if (!parent) continue;

      // 1-3 particles based on session count
      const sessionCount = node.aggregatedCount || 1;
      const particleCount = Math.min(3, Math.max(1, Math.ceil(sessionCount / 3)));
      const particles: FlowParticle[] = [];

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          t: Math.random(), // random starting position along path
          speed: (Math.random() * 0.03 + 0.02), // 40-80px/s normalised
          color: parent.color,
        });
      }

      this.connectionFlows.push({
        parentId: parent.id,
        childId: node.id,
        particles,
      });
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Set the node hierarchy data
   */
  setData(hierarchy: NodeHierarchy): void {
    this.hierarchy = hierarchy;
    this.spatialIndex.build(hierarchy.allNodes);
    this.seedParticleAnchors();
    this.buildConnectionFlows();
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

    // Update offscreen canvas for double buffering
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
    }
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    if (this.offscreenCtx) {
      this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    // Update label cache DPR
    getLabelCache(this.dpr);
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
    const timestamp = opts.timestamp || performance.now();

    // Double buffering: render to offscreen canvas, then copy to onscreen
    const useOffscreen = !!this.offscreenCtx;
    const ctx = useOffscreen ? this.offscreenCtx! : this.ctx;
    // Temporarily swap ctx reference for all private methods
    const originalCtx = this.ctx;
    if (useOffscreen) this.ctx = ctx;

    // Clear canvas with background
    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, width, height);

    if (!this.hierarchy) {
      this.renderEmptyState();
      if (useOffscreen) {
        originalCtx.drawImage(this.offscreenCanvas!, 0, 0);
        this.ctx = originalCtx;
      }
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
      const filtered = opts.nodeFilter(this.hierarchy.allNodes);
      const parentId = opts.parentNodeId;
      nodesToRender = filtered.filter(node =>
        node.id === parentId || zoomConfig.visibleNodeTypes.includes(node.type)
      );
    } else {
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
    // 1. Ambient background (3-tier particles + constellation lines)
    if (opts.showAmbient !== false) {
      this.renderAmbientBackground(view, timestamp);
    }

    // 2. Grid
    if (opts.showGrid) {
      this.renderGrid(view);
    }

    // 2.5. Thematic group areas (subtle background regions)
    this.renderThematicGroupAreas(nodesToRender, view);

    // 3. Connection lines (bezier curves with flow particles)
    if (opts.showConnections !== false) {
      this.renderConnections(nodesToRender, view, opts, timestamp);
    }

    // 4. Nodes (type-specific rendering)
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

    // 8. Click ripples
    this.renderRipples(timestamp);

    if (opts.showDebug) {
      this.renderDebugInfo(view, nodesToRender.length, this.hierarchy.allNodes.length);
    }

    // Double buffering: copy offscreen to onscreen
    if (useOffscreen) {
      this.ctx = originalCtx;
      originalCtx.drawImage(this.offscreenCanvas!, 0, 0);
    }
  }

  // ==========================================================================
  // Ambient Background (3-Tier Particles + Constellation Lines)
  // ==========================================================================

  private renderAmbientBackground(view: ViewState, timestamp: number): void {
    const { ctx, width, height } = this;
    const deltaTime = Math.min((timestamp - this.lastParticleUpdate) / 1000, 0.1);
    this.lastParticleUpdate = timestamp;

    ctx.save();

    // Collect on-screen positions for constellation lines (nebula tier only)
    const nebulaScreenPositions: { sx: number; sy: number; color: string }[] = [];

    for (const particle of this.particles) {
      // --- Update position ---
      if (particle.tier === 'dust') {
        // Slow random drift
        particle.x += Math.cos(particle.angle) * particle.speed * deltaTime * 60;
        particle.y += Math.sin(particle.angle) * particle.speed * deltaTime * 60;
        // Wrap around
        if (particle.x < -2000) particle.x = 2000;
        if (particle.x > 2000) particle.x = -2000;
        if (particle.y < -2000) particle.y = 2000;
        if (particle.y > 2000) particle.y = -2000;
      } else if (particle.tier === 'nebula') {
        // Drift near anchor (template node)
        particle.x += Math.cos(particle.angle) * particle.speed * deltaTime * 60;
        particle.y += Math.sin(particle.angle) * particle.speed * deltaTime * 60;
        // Pull back toward anchor
        const dx = particle.anchorX - particle.x;
        const dy = particle.anchorY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 200) {
          particle.x += dx * 0.01;
          particle.y += dy * 0.01;
        }
        // Slowly rotate drift angle
        particle.angle += (Math.random() - 0.5) * 0.02;
      } else if (particle.tier === 'sparkle') {
        // Fast lifecycle
        particle.lifecycle += particle.lifecycleSpeed * deltaTime;
        if (particle.lifecycle > 1) {
          particle.lifecycle -= 1;
          // Respawn near anchor
          particle.x = particle.anchorX + (Math.random() - 0.5) * 80;
          particle.y = particle.anchorY + (Math.random() - 0.5) * 80;
        }
        // Alpha follows bell curve of lifecycle
        const lc = particle.lifecycle;
        particle.alpha = Math.sin(lc * Math.PI) * 0.9;
      }

      // --- Convert to screen coordinates with parallax ---
      const parallaxFactor = particle.tier === 'dust' ? 0.2 : particle.tier === 'nebula' ? 0.6 : 0.8;
      const screenX = width / 2 + (particle.x + view.offsetX * parallaxFactor) * view.scale * (particle.tier === 'dust' ? 0.4 : 0.8);
      const screenY = height / 2 + (particle.y + view.offsetY * parallaxFactor) * view.scale * (particle.tier === 'dust' ? 0.4 : 0.8);

      // Only render if on screen
      if (screenX < -20 || screenX > width + 20 || screenY < -20 || screenY > height + 20) continue;

      // --- Draw ---
      if (particle.tier === 'dust') {
        const twinkle = 0.5 + 0.5 * Math.sin(timestamp * 0.001 + particle.x * 0.05);
        const alpha = particle.alpha * twinkle;
        ctx.fillStyle = hexWithAlpha(particle.color, alpha);
        ctx.beginPath();
        ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.tier === 'nebula') {
        const twinkle = 0.6 + 0.4 * Math.sin(timestamp * 0.0015 + particle.y * 0.03);
        const alpha = particle.alpha * twinkle;
        ctx.fillStyle = hexWithAlpha(particle.color, alpha);
        ctx.beginPath();
        ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
        ctx.fill();
        nebulaScreenPositions.push({ sx: screenX, sy: screenY, color: particle.color });
      } else {
        // sparkle
        if (particle.alpha > 0.01) {
          ctx.fillStyle = hexWithAlpha('#FFFFFF', particle.alpha);
          ctx.beginPath();
          ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- Constellation lines (connect nearby nebula particles of same color) ---
    if (nebulaScreenPositions.length > 1) {
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nebulaScreenPositions.length; i++) {
        const a = nebulaScreenPositions[i];
        for (let j = i + 1; j < nebulaScreenPositions.length; j++) {
          const b = nebulaScreenPositions[j];
          if (a.color !== b.color) continue;
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const lineAlpha = 0.03 + 0.03 * (1 - dist / 80);
            ctx.strokeStyle = hexWithAlpha(a.color, lineAlpha);
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }

  private renderVignette(): void {
    const { ctx, width, height } = this;

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

  private renderThematicGroupAreas(
    nodes: StrategicMapNode[],
    view: ViewState
  ): void {
    const { ctx, width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    const groupedNodes = new Map<string, StrategicMapNode[]>();

    for (const node of nodes) {
      if ((node.type === 'thematic_group' || node.type === 'session') && node.thematicGroup) {
        const groupName = node.thematicGroup;
        if (!groupedNodes.has(groupName)) {
          groupedNodes.set(groupName, []);
        }
        groupedNodes.get(groupName)!.push(node);
      }
    }

    if (groupedNodes.size < 2) return;

    ctx.save();

    for (const [_groupName, groupNodes] of groupedNodes) {
      if (groupNodes.length < 2) continue;

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

      const areaCenterX = sumX / groupNodes.length;
      const areaCenterY = sumY / groupNodes.length;
      const areaWidth = maxX - minX;
      const areaHeight = maxY - minY;
      const areaRadius = Math.max(areaWidth, areaHeight) / 2 + 30;

      const groupColor = groupNodes[0].color;

      const gradient = ctx.createRadialGradient(
        areaCenterX, areaCenterY, 0,
        areaCenterX, areaCenterY, areaRadius
      );
      gradient.addColorStop(0, groupColor + '08');
      gradient.addColorStop(0.6, groupColor + '05');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(areaCenterX, areaCenterY, areaRadius, areaRadius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

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
  // Connection Rendering (with data-flow particles)
  // ==========================================================================

  private renderConnections(
    nodes: StrategicMapNode[],
    view: ViewState,
    opts: RenderOptions,
    timestamp: number
  ): void {
    const { ctx, width, height } = this;
    const zoomConfig = getZoomLevel(view.scale);

    if (!zoomConfig.showConnections) {
      return;
    }

    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const hoveredId = opts.hoveredNodeId;

    // Update flow particle positions
    const flowDelta = Math.min((timestamp - this.lastFlowUpdate) / 1000, 0.1);
    this.lastFlowUpdate = timestamp;

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

      const isHighlighted = hoveredId === node.id || hoveredId === parent.id;

      // Bezier control point
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const curveOffset = Math.min(30, dist * 0.15);
      const perpX = dist > 0 ? -dy / dist * curveOffset : 0;
      const perpY = dist > 0 ? dx / dist * curveOffset : 0;
      const cpX = midX + perpX;
      const cpY = midY + perpY;

      // Connection thickness: 1 + log2(sessionCount), max 4
      const sessionCount = node.aggregatedCount || 1;
      const baseWidth = Math.min(4, 1 + Math.log2(sessionCount));

      // Glow pulse on hover (breathing 0.3-0.7)
      if (isHighlighted) {
        const breathe = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(timestamp * 0.004));
        ctx.strokeStyle = hexWithAlpha(parent.color, breathe);
        ctx.lineWidth = baseWidth + 6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpX, cpY, x2, y2);
        ctx.stroke();
      }

      // Draw main connection line
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      if (isHighlighted) {
        gradient.addColorStop(0, parent.color + '80');
        gradient.addColorStop(1, node.color + '60');
        ctx.lineWidth = baseWidth + 1;
      } else {
        gradient.addColorStop(0, parent.color + '25');
        gradient.addColorStop(1, node.color + '15');
        ctx.lineWidth = baseWidth;
      }

      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cpX, cpY, x2, y2);
      ctx.stroke();

      // --- Animated data-flow particles along the bezier ---
      const flow = this.connectionFlows.find(f => f.parentId === parent.id && f.childId === node.id);
      if (flow) {
        for (const fp of flow.particles) {
          fp.t += fp.speed * flowDelta;
          if (fp.t > 1) fp.t -= 1;

          // Evaluate quadratic bezier at t
          const pt = evalQuadBezier(x1, y1, cpX, cpY, x2, y2, fp.t);
          ctx.fillStyle = hexWithAlpha(fp.color, isHighlighted ? 0.8 : 0.4);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // ==========================================================================
  // Node Rendering (Type-Specific)
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

    // Sort nodes by type for proper layering
    const sortedNodes = [...nodes].sort((a, b) => {
      const order: Record<string, number> = {
        cluster: 0,
        template: 1,
        thematic_group: 2,
        topic: 2,
        session: 3,
      };
      return (order[a.type] ?? 2) - (order[b.type] ?? 2);
    });

    for (const node of sortedNodes) {
      const transition = opts.nodeTransitions?.get(node.id);
      const hoverScale = opts.hoverScales?.get(node.id) ?? 1;
      const opacity = transition?.opacity ?? 1;
      const transitionScale = transition?.scale ?? 1;
      const finalScale = hoverScale * transitionScale;

      if (opacity < 0.01) continue;

      const screenX = centerX + node.x * view.scale;
      const screenY = centerY + node.y * view.scale;
      const screenRadius = node.radius * view.scale * finalScale;

      const isHovered = opts.hoveredNodeId === node.id;
      const isFocused = opts.focusedNodeId === node.id;
      const isHighlighted = opts.highlightedNodeId === node.id;
      const isParentForBack = opts.parentNodeId === node.id;

      const nodeColor = isParentForBack
        ? '#52525B'
        : this.getNodeColor(node, opts.renderMode, timestamp);

      ctx.save();
      ctx.globalAlpha = opacity;

      // Type-specific rendering
      if (node.type === 'template') {
        this.renderTemplateNode(ctx, node, screenX, screenY, screenRadius, isHovered, isFocused, view.scale, nodeColor, timestamp);
      } else if (node.type === 'thematic_group' || node.type === 'topic') {
        this.renderTopicNode(ctx, node, screenX, screenY, screenRadius, isHovered, isFocused, view.scale, nodeColor, timestamp);
      } else if (node.type === 'session') {
        this.renderSessionNode(ctx, node, screenX, screenY, screenRadius, isHovered, isFocused, view.scale, nodeColor, timestamp);
      } else {
        // cluster or unknown: use LOD-based rendering
        switch (node.lod) {
          case 'minimal':
            this.renderNodeMinimal(ctx, node, screenX, screenY, screenRadius, isHovered, nodeColor);
            break;
          case 'standard':
            this.renderNodeStandard(ctx, node, screenX, screenY, screenRadius, isHovered, isFocused, nodeColor);
            break;
          case 'detailed':
            this.renderNodeDetailedLegacy(ctx, node, screenX, screenY, screenRadius, isHovered, isFocused, view.scale, nodeColor, timestamp);
            break;
        }
      }

      // Magnetic hover glow effect
      if (isHovered && hoverScale > 1) {
        this.renderHoverGlow(ctx, screenX, screenY, screenRadius, nodeColor, timestamp);
      }

      // Skeleton shimmer for loading nodes
      if (node.children && node.children.length > 0 && this.hierarchy) {
        const hasLoadedChildren = node.children.some(cid => this.hierarchy!.nodeMap.has(cid));
        if (!hasLoadedChildren && node.type !== 'session') {
          this.renderSkeletonShimmer(ctx, screenX, screenY, screenRadius, timestamp);
          this.renderGhostNodes(ctx, node, screenX, screenY, screenRadius, view.scale, timestamp);
        }
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // Template Node: Inner donut chart + rotating arc + glyph
  // ==========================================================================

  private renderTemplateNode(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    isHovered: boolean,
    isFocused: boolean,
    scale: number,
    color: string,
    timestamp: number
  ): void {
    // Outer glow
    const glowRadius = radius * 2;
    const glowGradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
    glowGradient.addColorStop(0, color + (isHovered ? '40' : '25'));
    glowGradient.addColorStop(0.5, color + '10');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Main fill (dark center)
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    innerGradient.addColorStop(0, '#1A1A2E');
    innerGradient.addColorStop(0.6, '#0F0F1A');
    innerGradient.addColorStop(1, color + '44');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border ring
    ctx.strokeStyle = color + 'CC';
    ctx.lineWidth = isFocused ? 3 : 2;
    ctx.stroke();

    // --- Inner donut chart showing topic distribution ---
    if (node.sessions && node.sessions.length > 0 && radius > 12) {
      const donutInner = radius * 0.45;
      const donutOuter = radius * 0.72;
      // Group sessions by a simple bucketing (by topic-like grouping, or fallback to even slices)
      const totalSessions = node.sessions.length;
      const sliceCount = Math.min(totalSessions, 8);
      const sliceAngle = (Math.PI * 2) / Math.max(sliceCount, 1);

      for (let i = 0; i < sliceCount; i++) {
        const startAngle = i * sliceAngle - Math.PI / 2;
        const endAngle = startAngle + sliceAngle - 0.04; // small gap
        const sliceAlpha = isHovered ? 0.7 : 0.45;

        // Vary hue slightly for each slice
        const hueShift = (i * 30) % 360;
        ctx.fillStyle = hexWithAlpha(shiftHue(color, hueShift), sliceAlpha);
        ctx.beginPath();
        ctx.arc(x, y, donutOuter, startAngle, endAngle);
        ctx.arc(x, y, donutInner, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();
      }
    }

    // --- Animated rotating border arc ---
    const arcSpeed = 0.0008;
    const arcAngle = (timestamp * arcSpeed) % (Math.PI * 2);
    const arcLength = Math.PI * 0.4;
    ctx.strokeStyle = hexWithAlpha(color, isHovered ? 0.9 : 0.65);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, arcAngle, arcAngle + arcLength);
    ctx.stroke();

    // --- Template glyph (first letter of template type) ---
    if (radius > 10) {
      const glyph = getTemplateGlyph(node.templateType || '');
      const glyphSize = Math.max(9, Math.min(20, radius * 0.6));
      ctx.fillStyle = hexWithAlpha('#FFFFFF', isHovered ? 0.95 : 0.75);
      ctx.font = `bold ${glyphSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, x, y);
    }

    // Inner highlight for depth
    const highlightGradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    highlightGradient.addColorStop(0.5, 'transparent');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================================================
  // Topic / Thematic Group Node: Frosted glass + progress arc + dot count
  // ==========================================================================

  private renderTopicNode(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    isHovered: boolean,
    isFocused: boolean,
    scale: number,
    color: string,
    timestamp: number
  ): void {
    // Frosted glass fill: radial gradient white center -> colored edge
    const frostGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    frostGradient.addColorStop(0, `rgba(255, 255, 255, ${isHovered ? 0.20 : 0.15})`);
    frostGradient.addColorStop(0.5, hexWithAlpha(color, isHovered ? 0.18 : 0.10));
    frostGradient.addColorStop(1, hexWithAlpha(color, isHovered ? 0.35 : 0.22));

    ctx.fillStyle = frostGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = hexWithAlpha(color, isFocused ? 1 : isHovered ? 0.8 : 0.5);
    ctx.lineWidth = isFocused ? 2.5 : 1.5;
    ctx.stroke();

    // --- Progress arc (completion %) ---
    const sessions = node.sessions || [];
    const totalSessions = sessions.length || node.aggregatedCount || 0;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const completionRatio = totalSessions > 0 ? completedSessions / totalSessions : 0;

    if (radius > 8 && totalSessions > 0) {
      const arcRadius = radius + 2;
      // Gray base arc
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, arcRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);
      ctx.stroke();

      // Green progress arc
      if (completionRatio > 0) {
        ctx.strokeStyle = hexWithAlpha('#22C55E', isHovered ? 0.9 : 0.65);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, arcRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * completionRatio);
        ctx.stroke();
      }
    }

    // --- Inner dot count indicator (1-5 dots for session count scale) ---
    if (radius > 10 && totalSessions > 0) {
      const dotCount = Math.min(5, Math.max(1, Math.ceil(totalSessions / 2)));
      const dotRadius = Math.max(1.2, radius * 0.06);
      const dotSpacing = dotRadius * 3.5;
      const dotsWidth = (dotCount - 1) * dotSpacing;
      const dotStartX = x - dotsWidth / 2;
      const dotY = y + radius * 0.15;

      for (let i = 0; i < dotCount; i++) {
        ctx.fillStyle = hexWithAlpha('#FFFFFF', isHovered ? 0.7 : 0.45);
        ctx.beginPath();
        ctx.arc(dotStartX + i * dotSpacing, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ==========================================================================
  // Session Node: Micro-card (rounded rect, title, status dot)
  // ==========================================================================

  private renderSessionNode(
    ctx: CanvasRenderingContext2D,
    node: StrategicMapNode,
    x: number,
    y: number,
    radius: number,
    isHovered: boolean,
    isFocused: boolean,
    scale: number,
    color: string,
    timestamp: number
  ): void {
    // Micro-card dimensions
    const cardW = radius * 2.4;
    const cardH = radius * 1.6;
    const cardX = x - cardW / 2;
    const cardY = y - cardH / 2;
    const cornerR = Math.min(4, cardH * 0.2);

    // Background fill: semi-transparent template color
    ctx.fillStyle = hexWithAlpha(color, isHovered ? 0.30 : 0.18);
    roundedRect(ctx, cardX, cardY, cardW, cardH, cornerR);
    ctx.fill();

    // Border
    ctx.strokeStyle = hexWithAlpha(color, isFocused ? 0.9 : isHovered ? 0.7 : 0.35);
    ctx.lineWidth = isFocused ? 2 : 1;
    roundedRect(ctx, cardX, cardY, cardW, cardH, cornerR);
    ctx.stroke();

    // Status dot
    const session = node.session;
    const status = session?.status || 'unknown';
    const statusColors: Record<string, string> = {
      completed: '#22C55E',
      active: '#FACC15',
      searching: '#FACC15',
      analyzing: '#FACC15',
      failed: '#EF4444',
    };
    const statusColor = statusColors[status] || '#6B7280';

    const dotSize = Math.max(2, radius * 0.15);
    const dotX = cardX + cornerR + dotSize + 2;
    const dotY = cardY + cardH / 2;

    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
    ctx.fill();

    // Title text (truncated 8-12 chars, font 7-9px)
    if (cardW > 15) {
      const fontSize = Math.max(7, Math.min(9, radius * 0.35));
      const maxChars = Math.max(8, Math.min(12, Math.floor(cardW / (fontSize * 0.5))));
      let title = node.label;
      if (title.length > maxChars) {
        title = title.substring(0, maxChars - 1) + '\u2026';
      }

      ctx.fillStyle = hexWithAlpha('#E8E8E8', isHovered ? 0.95 : 0.7);
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, dotX + dotSize + 3, dotY);
    }
  }

  // ==========================================================================
  // Legacy LOD Rendering (for cluster nodes and fallback)
  // ==========================================================================

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

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, c + (isHovered ? 'EE' : 'AA'));
    gradient.addColorStop(0.7, c + (isHovered ? 'AA' : '66'));
    gradient.addColorStop(1, c + (isHovered ? '66' : '33'));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = c + (isFocused ? 'FF' : isHovered ? 'DD' : '88');
    ctx.lineWidth = isFocused ? 3 : 2;
    ctx.stroke();
  }

  private renderNodeDetailedLegacy(
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
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    highlightGradient.addColorStop(0.5, 'transparent');

    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================================================
  // Canvas Loading States (2G)
  // ==========================================================================

  /**
   * Skeleton shimmer: animated gradient sweep over a loading node
   */
  private renderSkeletonShimmer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    timestamp: number
  ): void {
    const shimmerCycle = (timestamp * 0.0005) % 1;
    const sweepX = x - radius * 2 + shimmerCycle * radius * 4;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    const shimmerGrad = ctx.createLinearGradient(sweepX - radius, y, sweepX + radius, y);
    shimmerGrad.addColorStop(0, 'rgba(255,255,255,0)');
    shimmerGrad.addColorStop(0.5, 'rgba(255,255,255,0.07)');
    shimmerGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmerGrad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

    ctx.restore();
  }

  /**
   * Ghost nodes: dimmed placeholder circles showing expected child count
   */
  private renderGhostNodes(
    ctx: CanvasRenderingContext2D,
    parentNode: StrategicMapNode,
    parentX: number,
    parentY: number,
    parentRadius: number,
    scale: number,
    timestamp: number
  ): void {
    const childCount = Math.min(parentNode.children.length, 6);
    if (childCount === 0) return;

    const ghostRadius = parentRadius * 0.3;
    const orbitRadius = parentRadius * 1.8;

    ctx.save();
    const breathe = 0.10 + 0.05 * Math.sin(timestamp * 0.002);
    ctx.globalAlpha = breathe;

    for (let i = 0; i < childCount; i++) {
      const angle = (i / childCount) * Math.PI * 2 - Math.PI / 2;
      const gx = parentX + Math.cos(angle) * orbitRadius;
      const gy = parentY + Math.sin(angle) * orbitRadius;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.beginPath();
      ctx.arc(gx, gy, ghostRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================================================
  // Hover Glow
  // ==========================================================================

  private renderHoverGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    timestamp: number
  ): void {
    const pulsePhase = Math.sin(timestamp * 0.004) * 0.3 + 0.7;
    const glowRadius = radius * 2.5;

    const gradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, glowRadius);
    gradient.addColorStop(0, hexWithAlpha(color, 0.31 * pulsePhase));
    gradient.addColorStop(0.5, hexWithAlpha(color, 0.12 * pulsePhase));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================================================
  // Heatmap Color
  // ==========================================================================

  private getNodeColor(node: StrategicMapNode, mode?: RenderMode, timestamp?: number): string {
    if (!mode || mode === 'default') {
      return node.color;
    }

    const session = node.session || (node.sessions && node.sessions[0]);
    if (!session) return node.color;

    switch (mode) {
      case 'heatmap-recency': {
        const createdAt = new Date(session.created_at).getTime();
        const now = Date.now();
        const age = (now - createdAt) / (1000 * 60 * 60 * 24);
        const recencyFactor = Math.max(0, 1 - age / 30);
        const r = Math.round(107 + (34 - 107) * recencyFactor);
        const g = Math.round(107 + (197 - 107) * recencyFactor);
        const b = Math.round(107 + (94 - 107) * recencyFactor);
        return `rgb(${r}, ${g}, ${b})`;
      }

      case 'heatmap-density': {
        const count = session.claim_count || node.aggregatedCount;
        const intensity = Math.min(1, count / 50);
        const r = Math.round(34 + (236 - 34) * intensity);
        const g = Math.round(211 - 100 * intensity);
        const b = Math.round(238 - 70 * intensity);
        return `rgb(${r}, ${g}, ${b})`;
      }

      case 'heatmap-status': {
        const status = session.status;
        switch (status) {
          case 'completed': return '#22C55E';
          case 'active':
          case 'searching':
          case 'analyzing': {
            const pulse = timestamp ? 0.7 + 0.3 * Math.sin(timestamp * 0.003) : 1;
            return `rgba(250, 204, 21, ${pulse})`;
          }
          case 'failed': return '#EF4444';
          default: return '#6B7280';
        }
      }

      default:
        return node.color;
    }
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

    const labelY = y - radius - 12 * scale;

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

    const countY = y + radius + 10 * scale;
    ctx.fillText(`${node.aggregatedCount}`, x, countY);
  }

  // ==========================================================================
  // Label Collision Avoidance
  // ==========================================================================

  private renderLabelsWithCollision(
    nodes: StrategicMapNode[],
    view: ViewState,
    opts: RenderOptions
  ): void {
    const { ctx, width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;

    const baseSize = view.scale < 0.2 ? 28 : view.scale < 0.35 ? 22 : 14;
    const fontSize = Math.max(14, Math.min(32, baseSize * Math.max(1, view.scale * 1.5)));
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;

    const labelRects: LabelRect[] = [];

    for (const node of nodes) {
      if (!shouldShowLabel(node, view.scale, node.lod)) continue;

      const screenX = centerX + node.x * view.scale;
      const screenY = centerY + node.y * view.scale;
      const screenRadius = node.radius * view.scale;

      let label = node.label;
      if (label.length > 25) {
        label = label.substring(0, 22) + '...';
      }

      const labelWidth = getLabelCache(this.dpr).measureWidth(label, fontSize) + 8;
      const labelHeight = fontSize + 4;
      const labelX = screenX - labelWidth / 2;
      const labelOffset = node.type === 'cluster' ? 25 : 15;
      const labelY = screenY - screenRadius - labelOffset * Math.max(1, view.scale) - labelHeight / 2;

      const typePriority: Record<string, number> = { cluster: 100, template: 80, topic: 60, session: 40 };
      const priority = (typePriority[node.type] || 50) + Math.log10(node.aggregatedCount + 1) * 10;

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

    labelRects.sort((a, b) => b.priority - a.priority);

    // When drilled into a template/topic we have very few nodes — skip collision
    // avoidance entirely so every label is visible.
    const visibleRects: LabelRect[] = [];

    if (opts.skipLabelCollision) {
      // All labels are shown — mark them all visible
      for (const rect of labelRects) {
        rect.visible = true;
        visibleRects.push(rect);
      }
    } else {
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
    }

    const maxDist = Math.sqrt(width * width + height * height) / 2;

    for (const rect of visibleRects) {
      const node = nodes.find(n => n.id === rect.nodeId);
      if (!node) continue;

      const dx = rect.x + rect.width / 2 - width / 2;
      const dy = rect.y + rect.height / 2 - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const distFactor = 1 - Math.pow(dist / maxDist, 2) * 0.5;

      const isHovered = opts.hoveredNodeId === node.id;
      const isFocused = opts.focusedNodeId === node.id;

      let label = node.label;
      if (label.length > 25) {
        label = label.substring(0, 22) + '...';
      }

      const alpha = isHovered || isFocused ? 1 : Math.max(0.4, distFactor);
      const color = isHovered ? '#FFFFFF' : isFocused ? '#22D3EE' : '#E8E8E8';
      const weight = isHovered ? 'bold' : 'normal';
      getLabelCache(this.dpr).drawCentered(
        ctx, label, rect.x + rect.width / 2, rect.y + rect.height / 2,
        fontSize, weight, color, alpha,
      );
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

  private rectsOverlap(a: LabelRect, b: LabelRect): boolean {
    return !(a.x + a.width < b.x ||
             b.x + b.width < a.x ||
             a.y + a.height < b.y ||
             b.y + b.height < a.y);
  }

  // ==========================================================================
  // Search Highlights
  // ==========================================================================

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

      const ringRadius = screenRadius * (1.5 + pulse * 0.3);
      const ringWidth = 3 + pulse * 2;

      ctx.save();
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = ringWidth;
      ctx.beginPath();
      ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

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
  // Click Ripples
  // ==========================================================================

  private renderRipples(timestamp: number): void {
    if (this.ripples.length === 0) return;
    const { ctx } = this;
    const RIPPLE_DURATION = 600; // ms

    ctx.save();
    const alive: typeof this.ripples = [];
    for (const ripple of this.ripples) {
      const elapsed = timestamp - ripple.startTime;
      if (elapsed > RIPPLE_DURATION) continue;

      const progress = elapsed / RIPPLE_DURATION;
      const radius = ripple.maxRadius * progress;
      const alpha = 0.5 * (1 - progress);

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color;
      ctx.lineWidth = 2 * (1 - progress);
      ctx.globalAlpha = alpha;
      ctx.stroke();

      alive.push(ripple);
    }
    ctx.restore();
    this.ripples = alive;
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
   * Uses direct screen-space hit testing for accuracy.
   * @param nodeFilter - Optional filter matching the render filter (e.g. FocusController.filterNodes)
   *                     so hit detection only considers nodes that are actually visible.
   */
  findNodeAt(
    screenX: number,
    screenY: number,
    view: ViewState,
    nodeFilter?: (nodes: StrategicMapNode[]) => StrategicMapNode[]
  ): StrategicMapNode | null {
    if (!this.hierarchy) return null;

    const { width, height } = this;
    const centerX = width / 2 + view.offsetX;
    const centerY = height / 2 + view.offsetY;
    const zoomConfig = getZoomLevel(view.scale);

    let closestNode: StrategicMapNode | null = null;
    let closestDist = Infinity;

    // Tight hit detection: match visual bounds exactly.
    // Only a small minimum ensures tiny nodes (at extreme zoom-out) remain clickable.
    const minClickRadius = 8;

    // Use the same node filter as the renderer so we only hit-test visible nodes.
    // This is critical when drilled into a template/topic — other nodes should not
    // intercept clicks even if their screen-space position happens to overlap.
    const candidates = nodeFilter
      ? nodeFilter(this.hierarchy.allNodes)
      : this.hierarchy.allNodes;

    for (const node of candidates) {
      if (!zoomConfig.visibleNodeTypes.includes(node.type)) {
        continue;
      }

      const nodeScreenX = centerX + node.x * view.scale;
      const nodeScreenY = centerY + node.y * view.scale;
      const nodeScreenRadius = node.radius * view.scale;

      const dx = screenX - nodeScreenX;
      const dy = screenY - nodeScreenY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // For session nodes (micro-cards), use rectangular hit test
      if (node.type === 'session') {
        const cardW = nodeScreenRadius * 2.4;
        const cardH = nodeScreenRadius * 1.6;
        const cardX = nodeScreenX - cardW / 2;
        const cardY = nodeScreenY - cardH / 2;
        if (
          screenX >= cardX &&
          screenX <= cardX + cardW &&
          screenY >= cardY &&
          screenY <= cardY + cardH
        ) {
          if (dist < closestDist) {
            closestDist = dist;
            closestNode = node;
          }
        }
        continue;
      }

      const hitRadius = Math.max(nodeScreenRadius, minClickRadius);

      if (dist <= hitRadius && dist < closestDist) {
        closestDist = dist;
        closestNode = node;
      }
    }

    return closestNode;
  }

  /**
   * Trigger a click ripple at screen coordinates
   */
  triggerRipple(screenX: number, screenY: number, color: string = '#22D3EE'): void {
    this.ripples.push({
      x: screenX,
      y: screenY,
      startTime: performance.now(),
      maxRadius: 60,
      color,
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.spatialIndex.clear();
    this.hierarchy = null;
    this.particles = [];
    this.connectionFlows = [];
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
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

/**
 * Convert a hex color + numeric alpha (0-1) to an rgba string
 */
function hexWithAlpha(hex: string, alpha: number): string {
  // Handle rgb/rgba pass-through
  if (hex.startsWith('rgb')) return hex;

  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  // Parse hex
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length >= 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r},${g},${b},${clampedAlpha})`;
}

/**
 * Shift hue of a hex color by degrees
 */
function shiftHue(hex: string, degrees: number): string {
  if (hex.startsWith('rgb')) return hex;

  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255;
    g = parseInt(hex[2] + hex[2], 16) / 255;
    b = parseInt(hex[3] + hex[3], 16) / 255;
  } else if (hex.length >= 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }

  // RGB to HSL
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  // Shift hue
  h = (h + degrees / 360) % 1;
  if (h < 0) h += 1;

  // HSL to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r2: number, g2: number, b2: number;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1/3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}

/**
 * Evaluate a quadratic bezier curve at parameter t
 */
function evalQuadBezier(
  x0: number, y0: number,
  cpx: number, cpy: number,
  x1: number, y1: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cpx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cpy + t * t * y1,
  };
}

/**
 * Draw a rounded rectangle path
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const clampedR = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + clampedR, y);
  ctx.lineTo(x + w - clampedR, y);
  ctx.arcTo(x + w, y, x + w, y + clampedR, clampedR);
  ctx.lineTo(x + w, y + h - clampedR);
  ctx.arcTo(x + w, y + h, x + w - clampedR, y + h, clampedR);
  ctx.lineTo(x + clampedR, y + h);
  ctx.arcTo(x, y + h, x, y + h - clampedR, clampedR);
  ctx.lineTo(x, y + clampedR);
  ctx.arcTo(x, y, x + clampedR, y, clampedR);
  ctx.closePath();
}

/**
 * Get glyph for template type (first letter, with icon-like mappings)
 */
function getTemplateGlyph(templateType: string): string {
  const glyphMap: Record<string, string> = {
    investigative: '\u{1F50D}',  // will render as text fallback
    financial: '$',
    competitive: '\u2694',       // crossed swords
    tech_market: '\u{2699}',     // gear
    legal: '\u2696',             // scales
    due_diligence: '\u2713',     // checkmark
    contract: '\u{1F4C4}',      // document
    understanding: '\u{1F4A1}',  // lightbulb
    purchase_decision: '\u{1F6D2}', // shopping cart
    reputation: '\u2605',        // star
  };

  // Unicode emoji/symbols might not render well on Canvas; fallback to first letter
  const glyph = glyphMap[templateType];
  if (glyph) {
    // Use simple ASCII glyphs; for others, fallback to first letter
    if (glyph.length === 1 && glyph.charCodeAt(0) < 0x3000) {
      return glyph;
    }
  }

  // Fallback: capitalised first letter
  if (templateType.length > 0) {
    return templateType.charAt(0).toUpperCase();
  }
  return '?';
}
