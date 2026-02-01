/**
 * Interaction Manager
 *
 * Handles all user interactions:
 * - Mouse: click, drag (pan), wheel (zoom)
 * - Keyboard: WASD/Arrows (pan), +/- (zoom), Home (reset), Escape (unfocus)
 * - Touch: pinch zoom, drag pan (future)
 */

import type {
  ViewState,
  StrategicMapNode,
  StrategicMapConfig,
  InteractionState,
} from './types';
import { zoomTowardPoint } from './zoomController';
import { AnimationController, easeOutCubic } from './animation';

// ============================================================================
// Types
// ============================================================================

export interface InteractionCallbacks {
  onViewChange: (view: ViewState) => void;
  onNodeClick: (node: StrategicMapNode | null) => void;
  onNodeHover: (node: StrategicMapNode | null) => void;
  onRenderNeeded: () => void;
  findNodeAt: (x: number, y: number, view: ViewState) => StrategicMapNode | null;
  /** Called when Escape is pressed - return true to prevent default unfocus behavior */
  onEscape?: () => boolean;
}

export interface KeyboardShortcuts {
  panUp: string[];
  panDown: string[];
  panLeft: string[];
  panRight: string[];
  zoomIn: string[];
  zoomOut: string[];
  reset: string[];
  unfocus: string[];
}

const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  panUp: ['w', 'W', 'ArrowUp'],
  panDown: ['s', 'S', 'ArrowDown'],
  panLeft: ['a', 'A', 'ArrowLeft'],
  panRight: ['d', 'D', 'ArrowRight'],
  zoomIn: ['+', '='],
  zoomOut: ['-', '_'],
  reset: ['Home', '0'],
  unfocus: ['Escape'],
};

// ============================================================================
// Interaction Manager
// ============================================================================

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private config: StrategicMapConfig;
  private callbacks: InteractionCallbacks;
  private animator: AnimationController;
  private shortcuts: KeyboardShortcuts;

  private state: InteractionState = {
    isDragging: false,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    velocityX: 0,
    velocityY: 0,
    focusedNodeId: null,
    hoveredNodeId: null,
  };

  private view: ViewState = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  };

  private animationFrameId: number | null = null;
  private momentumFrameId: number | null = null;

  // Key state for continuous pan
  private keysPressed: Set<string> = new Set();
  private keyPanFrameId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    config: StrategicMapConfig,
    callbacks: InteractionCallbacks,
    animator: AnimationController,
    shortcuts: Partial<KeyboardShortcuts> = {}
  ) {
    this.canvas = canvas;
    this.config = config;
    this.callbacks = callbacks;
    this.animator = animator;
    this.shortcuts = { ...DEFAULT_SHORTCUTS, ...shortcuts };

    this.bindEvents();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get current view state
   */
  getView(): ViewState {
    return { ...this.view };
  }

  /**
   * Set view state (for external control)
   */
  setView(view: ViewState, animate: boolean = false): void {
    if (animate && !this.config.reducedMotion) {
      this.animator.animateToView(
        this.view,
        view,
        this.config.animationDuration,
        easeOutCubic,
        () => {
          this.view = view;
          this.callbacks.onViewChange(this.view);
        }
      );
      this.startAnimationLoop();
    } else {
      this.view = view;
      this.callbacks.onViewChange(this.view);
      this.callbacks.onRenderNeeded();
    }
  }

  /**
   * Get focused node ID
   */
  getFocusedNodeId(): string | null {
    return this.state.focusedNodeId;
  }

  /**
   * Get hovered node ID
   */
  getHoveredNodeId(): string | null {
    return this.state.hoveredNodeId;
  }

  /**
   * Focus on a node (zoom and center)
   */
  focusOnNode(node: StrategicMapNode): void {
    this.state.focusedNodeId = node.id;

    // Calculate target view
    const targetScale = Math.min(2.0, Math.max(0.8, 1.5 / (node.radius / 40)));
    const targetView: ViewState = {
      offsetX: -node.x * targetScale,
      offsetY: -node.y * targetScale,
      scale: targetScale,
    };

    this.setView(targetView, true);
  }

  /**
   * Clear focus
   */
  clearFocus(): void {
    this.state.focusedNodeId = null;
    this.callbacks.onNodeClick(null);
    this.callbacks.onRenderNeeded();
  }

  /**
   * Reset view to initial state
   */
  resetView(): void {
    const targetView: ViewState = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    };
    this.state.focusedNodeId = null;
    this.setView(targetView, true);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<StrategicMapConfig>): void {
    this.config = { ...this.config, ...config };
    this.animator.setReducedMotion(this.config.reducedMotion);
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.unbindEvents();
    this.stopAnimationLoop();
    this.stopMomentum();
    this.stopKeyPan();
  }

  // ==========================================================================
  // Event Binding
  // ==========================================================================

  private bindEvents(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('click', this.handleClick);

    // Keyboard events (need focus on canvas container)
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Context menu (prevent on canvas)
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private unbindEvents(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('click', this.handleClick);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  // ==========================================================================
  // Mouse Handlers
  // ==========================================================================

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return; // Only left click

    this.state.isDragging = true;
    this.state.isPanning = true;
    this.state.panStartX = e.clientX;
    this.state.panStartY = e.clientY;
    this.state.lastMouseX = e.clientX;
    this.state.lastMouseY = e.clientY;
    this.state.velocityX = 0;
    this.state.velocityY = 0;

    this.stopMomentum();
    this.canvas.style.cursor = 'grabbing';
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.state.isDragging) {
      // Pan
      const dx = e.clientX - this.state.lastMouseX;
      const dy = e.clientY - this.state.lastMouseY;

      // Track velocity for momentum
      this.state.velocityX = dx;
      this.state.velocityY = dy;

      this.view.offsetX += dx;
      this.view.offsetY += dy;

      this.state.lastMouseX = e.clientX;
      this.state.lastMouseY = e.clientY;

      this.callbacks.onViewChange(this.view);
      this.callbacks.onRenderNeeded();
    } else {
      // Hover detection
      const node = this.callbacks.findNodeAt(x, y, this.view);
      const hoveredId = node?.id || null;

      if (hoveredId !== this.state.hoveredNodeId) {
        this.state.hoveredNodeId = hoveredId;
        this.callbacks.onNodeHover(node);
        this.callbacks.onRenderNeeded();
        this.canvas.style.cursor = node ? 'pointer' : 'grab';
      }
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (this.state.isDragging) {
      this.state.isDragging = false;
      this.state.isPanning = false;
      this.canvas.style.cursor = this.state.hoveredNodeId ? 'pointer' : 'grab';

      // Start momentum if there was velocity
      const speed = Math.sqrt(
        this.state.velocityX ** 2 + this.state.velocityY ** 2
      );

      if (speed > 2 && this.config.panInertia > 0) {
        this.startMomentum();
      }
    }
  };

  private handleMouseLeave = (e: MouseEvent): void => {
    if (this.state.isDragging) {
      this.handleMouseUp(e);
    }

    if (this.state.hoveredNodeId) {
      this.state.hoveredNodeId = null;
      this.callbacks.onNodeHover(null);
      this.callbacks.onRenderNeeded();
    }

    this.canvas.style.cursor = 'default';
  };

  private handleClick = (e: MouseEvent): void => {
    // Ignore if we dragged significantly
    const dragDist = Math.sqrt(
      (e.clientX - this.state.panStartX) ** 2 +
      (e.clientY - this.state.panStartY) ** 2
    );

    if (dragDist > 5) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = this.callbacks.findNodeAt(x, y, this.view);

    if (node) {
      // Handle node click based on type
      if (node.type === 'session' && node.session) {
        // Session click - notify parent to open report
        this.callbacks.onNodeClick(node);
      } else {
        // Other nodes - focus/unfocus
        if (this.state.focusedNodeId === node.id) {
          this.clearFocus();
        } else {
          this.focusOnNode(node);
          this.callbacks.onNodeClick(node);
        }
      }
    } else {
      // Click on empty space - clear focus
      if (this.state.focusedNodeId) {
        this.clearFocus();
      }
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom toward mouse position
    const zoomFactor = e.deltaY > 0 ? 1 / this.config.zoomSpeed : this.config.zoomSpeed;

    const newView = zoomTowardPoint(
      this.view,
      mouseX,
      mouseY,
      rect.width,
      rect.height,
      zoomFactor,
      this.config.minScale,
      this.config.maxScale
    );

    this.view = newView;
    this.callbacks.onViewChange(this.view);
    this.callbacks.onRenderNeeded();
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  // ==========================================================================
  // Keyboard Handlers
  // ==========================================================================

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Don't capture if user is typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const key = e.key;

    // Check for zoom shortcuts
    if (this.shortcuts.zoomIn.includes(key)) {
      e.preventDefault();
      this.zoomByStep(this.config.zoomSpeed);
      return;
    }

    if (this.shortcuts.zoomOut.includes(key)) {
      e.preventDefault();
      this.zoomByStep(1 / this.config.zoomSpeed);
      return;
    }

    // Check for reset
    if (this.shortcuts.reset.includes(key)) {
      e.preventDefault();
      this.resetView();
      return;
    }

    // Check for unfocus/escape
    if (this.shortcuts.unfocus.includes(key)) {
      e.preventDefault();
      // Let parent handle escape first (for drill-back)
      if (this.callbacks.onEscape?.()) {
        return;
      }
      // Default behavior - clear focus
      if (this.state.focusedNodeId) {
        this.clearFocus();
      }
      return;
    }

    // Check for pan keys (continuous while held)
    const isPanKey =
      this.shortcuts.panUp.includes(key) ||
      this.shortcuts.panDown.includes(key) ||
      this.shortcuts.panLeft.includes(key) ||
      this.shortcuts.panRight.includes(key);

    if (isPanKey) {
      e.preventDefault();
      this.keysPressed.add(key);
      this.startKeyPan();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysPressed.delete(e.key);

    if (this.keysPressed.size === 0) {
      this.stopKeyPan();
    }
  };

  // ==========================================================================
  // Zoom Helpers
  // ==========================================================================

  private zoomByStep(factor: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newView = zoomTowardPoint(
      this.view,
      centerX,
      centerY,
      rect.width,
      rect.height,
      factor,
      this.config.minScale,
      this.config.maxScale
    );

    if (!this.config.reducedMotion) {
      this.animator.animateToView(
        this.view,
        newView,
        150,
        easeOutCubic,
        () => {
          this.view = newView;
          this.callbacks.onViewChange(this.view);
        }
      );
      this.startAnimationLoop();
    } else {
      this.view = newView;
      this.callbacks.onViewChange(this.view);
      this.callbacks.onRenderNeeded();
    }
  }

  // ==========================================================================
  // Continuous Key Pan
  // ==========================================================================

  private startKeyPan(): void {
    if (this.keyPanFrameId !== null) return;

    const panSpeed = 25; // Increased for faster keyboard navigation

    const tick = () => {
      let dx = 0;
      let dy = 0;

      for (const key of this.keysPressed) {
        if (this.shortcuts.panUp.includes(key)) dy += panSpeed;
        if (this.shortcuts.panDown.includes(key)) dy -= panSpeed;
        if (this.shortcuts.panLeft.includes(key)) dx += panSpeed;
        if (this.shortcuts.panRight.includes(key)) dx -= panSpeed;
      }

      if (dx !== 0 || dy !== 0) {
        this.view.offsetX += dx;
        this.view.offsetY += dy;
        this.callbacks.onViewChange(this.view);
        this.callbacks.onRenderNeeded();
      }

      this.keyPanFrameId = requestAnimationFrame(tick);
    };

    this.keyPanFrameId = requestAnimationFrame(tick);
  }

  private stopKeyPan(): void {
    if (this.keyPanFrameId !== null) {
      cancelAnimationFrame(this.keyPanFrameId);
      this.keyPanFrameId = null;
    }
  }

  // ==========================================================================
  // Momentum
  // ==========================================================================

  private startMomentum(): void {
    if (this.momentumFrameId !== null) return;

    const tick = () => {
      this.state.velocityX *= this.config.panInertia;
      this.state.velocityY *= this.config.panInertia;

      const speed = Math.sqrt(
        this.state.velocityX ** 2 + this.state.velocityY ** 2
      );

      if (speed < 0.5) {
        this.stopMomentum();
        return;
      }

      this.view.offsetX += this.state.velocityX;
      this.view.offsetY += this.state.velocityY;
      this.callbacks.onViewChange(this.view);
      this.callbacks.onRenderNeeded();

      this.momentumFrameId = requestAnimationFrame(tick);
    };

    this.momentumFrameId = requestAnimationFrame(tick);
  }

  private stopMomentum(): void {
    if (this.momentumFrameId !== null) {
      cancelAnimationFrame(this.momentumFrameId);
      this.momentumFrameId = null;
    }
    this.state.velocityX = 0;
    this.state.velocityY = 0;
  }

  // ==========================================================================
  // Animation Loop
  // ==========================================================================

  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) return;

    const tick = () => {
      // Update view animation
      const interpolated = this.animator.updateView(this.view);

      if (interpolated) {
        this.view = interpolated;
        this.callbacks.onViewChange(this.view);
        this.callbacks.onRenderNeeded();
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.stopAnimationLoop();
        this.callbacks.onRenderNeeded();
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
