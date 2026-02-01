/**
 * Swiss Map Interactions
 *
 * Handles mouse, wheel, touch, and keyboard interactions for the infinite Swiss map.
 * Based on the Strategic Map interaction patterns but simplified for DOM-based rendering.
 */

import type {
  SwissViewState,
  SwissInteractionState,
  SwissMapConfig,
} from './types';
import { DEFAULT_SWISS_CONFIG } from './types';

// ============================================================================
// Interaction Callbacks
// ============================================================================

export interface SwissInteractionCallbacks {
  onViewChange: (view: SwissViewState) => void;
  onRenderNeeded: () => void;
}

// ============================================================================
// Interaction Manager
// ============================================================================

export class SwissInteractionManager {
  private container: HTMLElement;
  private config: SwissMapConfig;
  private callbacks: SwissInteractionCallbacks;

  private view: SwissViewState;
  private interaction: SwissInteractionState;

  // Animation
  private animationFrameId: number | null = null;
  private momentumFrameId: number | null = null;
  private keyPanFrameId: number | null = null;

  // Keyboard state
  private keysPressed: Set<string> = new Set();

  // Bound handlers
  private boundHandlers: {
    wheel: (e: WheelEvent) => void;
    mouseDown: (e: MouseEvent) => void;
    mouseMove: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
    keyDown: (e: KeyboardEvent) => void;
    keyUp: (e: KeyboardEvent) => void;
    touchStart: (e: TouchEvent) => void;
    touchMove: (e: TouchEvent) => void;
    touchEnd: (e: TouchEvent) => void;
  };

  constructor(
    container: HTMLElement,
    config: Partial<SwissMapConfig>,
    callbacks: SwissInteractionCallbacks
  ) {
    this.container = container;
    this.config = { ...DEFAULT_SWISS_CONFIG, ...config };
    this.callbacks = callbacks;

    this.view = {
      offsetX: 0,
      offsetY: 0,
      scale: 1.0,
    };

    this.interaction = {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      lastMouseX: 0,
      lastMouseY: 0,
      velocityX: 0,
      velocityY: 0,
    };

    // Bind handlers
    this.boundHandlers = {
      wheel: this.handleWheel.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      keyDown: this.handleKeyDown.bind(this),
      keyUp: this.handleKeyUp.bind(this),
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
    };

    this.attachListeners();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getView(): SwissViewState {
    return { ...this.view };
  }

  setView(view: Partial<SwissViewState>, animate: boolean = false): void {
    if (animate && !this.config.reducedMotion) {
      this.animateToView({
        offsetX: view.offsetX ?? this.view.offsetX,
        offsetY: view.offsetY ?? this.view.offsetY,
        scale: view.scale ?? this.view.scale,
      });
    } else {
      this.view = {
        ...this.view,
        ...view,
      };
      this.clampView();
      this.callbacks.onViewChange(this.getView());
    }
  }

  resetView(): void {
    this.setView({ offsetX: 0, offsetY: 0, scale: 1.0 }, true);
  }

  setConfig(config: Partial<SwissMapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  dispose(): void {
    this.detachListeners();
    this.stopMomentum();
    this.stopKeyPan();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // ============================================================================
  // Zoom Methods
  // ============================================================================

  zoomIn(): void {
    const newScale = Math.min(
      this.config.maxScale,
      this.view.scale * this.config.zoomSpeed
    );
    this.setView({ scale: newScale }, true);
  }

  zoomOut(): void {
    const newScale = Math.max(
      this.config.minScale,
      this.view.scale / this.config.zoomSpeed
    );
    this.setView({ scale: newScale }, true);
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  private attachListeners(): void {
    this.container.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
    this.container.addEventListener('mousedown', this.boundHandlers.mouseDown);
    window.addEventListener('mousemove', this.boundHandlers.mouseMove);
    window.addEventListener('mouseup', this.boundHandlers.mouseUp);
    window.addEventListener('keydown', this.boundHandlers.keyDown);
    window.addEventListener('keyup', this.boundHandlers.keyUp);
    this.container.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    this.container.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
    this.container.addEventListener('touchend', this.boundHandlers.touchEnd);
  }

  private detachListeners(): void {
    this.container.removeEventListener('wheel', this.boundHandlers.wheel);
    this.container.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    window.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    window.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    window.removeEventListener('keydown', this.boundHandlers.keyDown);
    window.removeEventListener('keyup', this.boundHandlers.keyUp);
    this.container.removeEventListener('touchstart', this.boundHandlers.touchStart);
    this.container.removeEventListener('touchmove', this.boundHandlers.touchMove);
    this.container.removeEventListener('touchend', this.boundHandlers.touchEnd);
  }

  // ============================================================================
  // Mouse Handlers
  // ============================================================================

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom toward mouse position
    const zoomFactor = e.deltaY < 0 ? this.config.zoomSpeed : 1 / this.config.zoomSpeed;
    const newScale = Math.max(
      this.config.minScale,
      Math.min(this.config.maxScale, this.view.scale * zoomFactor)
    );

    if (newScale !== this.view.scale) {
      // Adjust offset to zoom toward mouse
      const scaleRatio = newScale / this.view.scale;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const newOffsetX = mouseX - (mouseX - this.view.offsetX - centerX) * scaleRatio - centerX;
      const newOffsetY = mouseY - (mouseY - this.view.offsetY - centerY) * scaleRatio - centerY;

      this.view = {
        ...this.view,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
        scale: newScale,
      };

      this.callbacks.onViewChange(this.getView());
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // Only left click

    this.stopMomentum();
    this.interaction.isDragging = true;
    this.interaction.dragStartX = e.clientX - this.view.offsetX;
    this.interaction.dragStartY = e.clientY - this.view.offsetY;
    this.interaction.lastMouseX = e.clientX;
    this.interaction.lastMouseY = e.clientY;
    this.interaction.velocityX = 0;
    this.interaction.velocityY = 0;

    this.container.style.cursor = 'grabbing';
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.interaction.isDragging) return;

    const dx = e.clientX - this.interaction.lastMouseX;
    const dy = e.clientY - this.interaction.lastMouseY;

    this.interaction.velocityX = dx;
    this.interaction.velocityY = dy;
    this.interaction.lastMouseX = e.clientX;
    this.interaction.lastMouseY = e.clientY;

    this.view.offsetX = e.clientX - this.interaction.dragStartX;
    this.view.offsetY = e.clientY - this.interaction.dragStartY;

    this.callbacks.onViewChange(this.getView());
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (!this.interaction.isDragging) return;

    this.interaction.isDragging = false;
    this.container.style.cursor = 'grab';

    // Start momentum if velocity is significant
    if (
      !this.config.reducedMotion &&
      (Math.abs(this.interaction.velocityX) > 1 || Math.abs(this.interaction.velocityY) > 1)
    ) {
      this.startMomentum();
    }
  }

  // ============================================================================
  // Touch Handlers
  // ============================================================================

  private lastTouchDistance: number = 0;

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.stopMomentum();
      this.interaction.isDragging = true;
      this.interaction.dragStartX = touch.clientX - this.view.offsetX;
      this.interaction.dragStartY = touch.clientY - this.view.offsetY;
      this.interaction.lastMouseX = touch.clientX;
      this.interaction.lastMouseY = touch.clientY;
    } else if (e.touches.length === 2) {
      e.preventDefault();
      this.lastTouchDistance = this.getTouchDistance(e.touches);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1 && this.interaction.isDragging) {
      e.preventDefault();
      const touch = e.touches[0];

      const dx = touch.clientX - this.interaction.lastMouseX;
      const dy = touch.clientY - this.interaction.lastMouseY;

      this.interaction.velocityX = dx;
      this.interaction.velocityY = dy;
      this.interaction.lastMouseX = touch.clientX;
      this.interaction.lastMouseY = touch.clientY;

      this.view.offsetX = touch.clientX - this.interaction.dragStartX;
      this.view.offsetY = touch.clientY - this.interaction.dragStartY;

      this.callbacks.onViewChange(this.getView());
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const newDistance = this.getTouchDistance(e.touches);
      const zoomFactor = newDistance / this.lastTouchDistance;

      const newScale = Math.max(
        this.config.minScale,
        Math.min(this.config.maxScale, this.view.scale * zoomFactor)
      );

      this.view.scale = newScale;
      this.lastTouchDistance = newDistance;

      this.callbacks.onViewChange(this.getView());
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.interaction.isDragging = false;

      if (
        !this.config.reducedMotion &&
        (Math.abs(this.interaction.velocityX) > 1 || Math.abs(this.interaction.velocityY) > 1)
      ) {
        this.startMomentum();
      }
    }
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ============================================================================
  // Keyboard Handlers
  // ============================================================================

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore if typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const key = e.key.toLowerCase();

    // Pan keys
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
      this.keysPressed.add(key);
      this.startKeyPan();
    }

    // Zoom keys
    if (key === '=' || key === '+') {
      e.preventDefault();
      this.zoomIn();
    }
    if (key === '-' || key === '_') {
      e.preventDefault();
      this.zoomOut();
    }

    // Reset
    if (key === 'home' || key === '0') {
      e.preventDefault();
      this.resetView();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keysPressed.delete(key);

    if (this.keysPressed.size === 0) {
      this.stopKeyPan();
    }
  }

  private startKeyPan(): void {
    if (this.keyPanFrameId !== null) return;

    const panSpeed = this.config.panSpeed;

    const tick = () => {
      let dx = 0;
      let dy = 0;

      if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) dy += panSpeed;
      if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) dy -= panSpeed;
      if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) dx += panSpeed;
      if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) dx -= panSpeed;

      if (dx !== 0 || dy !== 0) {
        this.view.offsetX += dx;
        this.view.offsetY += dy;
        this.callbacks.onViewChange(this.getView());
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

  // ============================================================================
  // Momentum
  // ============================================================================

  private startMomentum(): void {
    this.stopMomentum();

    const tick = () => {
      this.interaction.velocityX *= this.config.panInertia;
      this.interaction.velocityY *= this.config.panInertia;

      if (
        Math.abs(this.interaction.velocityX) < 0.5 &&
        Math.abs(this.interaction.velocityY) < 0.5
      ) {
        this.stopMomentum();
        return;
      }

      this.view.offsetX += this.interaction.velocityX;
      this.view.offsetY += this.interaction.velocityY;
      this.callbacks.onViewChange(this.getView());

      this.momentumFrameId = requestAnimationFrame(tick);
    };

    this.momentumFrameId = requestAnimationFrame(tick);
  }

  private stopMomentum(): void {
    if (this.momentumFrameId !== null) {
      cancelAnimationFrame(this.momentumFrameId);
      this.momentumFrameId = null;
    }
  }

  // ============================================================================
  // Animation
  // ============================================================================

  private animateToView(target: SwissViewState): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const startView = { ...this.view };
    const startTime = performance.now();
    const duration = this.config.animationDuration;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);

      this.view = {
        offsetX: startView.offsetX + (target.offsetX - startView.offsetX) * eased,
        offsetY: startView.offsetY + (target.offsetY - startView.offsetY) * eased,
        scale: startView.scale + (target.scale - startView.scale) * eased,
      };

      this.callbacks.onViewChange(this.getView());

      if (t < 1) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private clampView(): void {
    this.view.scale = Math.max(
      this.config.minScale,
      Math.min(this.config.maxScale, this.view.scale)
    );
  }
}

// ============================================================================
// Easing Functions
// ============================================================================

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
