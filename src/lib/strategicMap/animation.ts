/**
 * Animation Controller
 *
 * Manages finite transitions (no infinite loops).
 * Supports:
 * - View transitions (zoom, pan)
 * - Node transitions (position, radius, opacity)
 * - Spring physics animations
 * - Staggered group animations
 * - Easing functions
 */

import type { Animation, ViewState, StrategicMapNode } from './types';

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Cubic ease-out (decelerating)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Cubic ease-in-out (smooth start and end)
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Quart ease-out (stronger deceleration)
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Quint ease-out (very smooth deceleration)
 */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Linear (no easing)
 */
export function linear(t: number): number {
  return t;
}

/**
 * Spring physics easing (overshoot and settle)
 * Good for hover/click feedback
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Elastic spring (bouncy)
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 :
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Bounce effect
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

// ============================================================================
// Spring Physics
// ============================================================================

export interface SpringConfig {
  stiffness: number;  // Spring stiffness (default: 170)
  damping: number;    // Damping ratio (default: 26)
  mass: number;       // Mass (default: 1)
}

const DEFAULT_SPRING: SpringConfig = {
  stiffness: 170,
  damping: 26,
  mass: 1,
};

export interface SpringState {
  value: number;
  velocity: number;
  target: number;
}

/**
 * Calculate next spring state using physics simulation
 */
export function stepSpring(
  state: SpringState,
  config: SpringConfig = DEFAULT_SPRING,
  deltaTime: number = 1/60
): SpringState {
  const { stiffness, damping, mass } = config;
  const { value, velocity, target } = state;

  // Spring force: F = -k * x
  const displacement = value - target;
  const springForce = -stiffness * displacement;

  // Damping force: F = -c * v
  const dampingForce = -damping * velocity;

  // Acceleration: a = F / m
  const acceleration = (springForce + dampingForce) / mass;

  // Update velocity and position (Euler integration)
  const newVelocity = velocity + acceleration * deltaTime;
  const newValue = value + newVelocity * deltaTime;

  return {
    value: newValue,
    velocity: newVelocity,
    target,
  };
}

/**
 * Check if spring is at rest (settled at target)
 */
export function isSpringAtRest(state: SpringState, threshold: number = 0.01): boolean {
  return Math.abs(state.value - state.target) < threshold &&
         Math.abs(state.velocity) < threshold;
}

// ============================================================================
// Animation Controller
// ============================================================================

// ============================================================================
// Transition State for Drill-Down
// ============================================================================

export interface DrillTransition {
  type: 'drill-in' | 'drill-out';
  startTime: number;
  duration: number;
  phase: 'fade-out' | 'zoom' | 'burst' | 'complete';
  progress: number;
  targetNodeId: string;
  fadingNodeIds: Set<string>;
  burstingNodeIds: string[];
  burstDelays: Map<string, number>;
}

export interface NodeTransitionState {
  nodeId: string;
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

// ============================================================================
// Animation Controller
// ============================================================================

export class AnimationController {
  private animations: Map<string, Animation> = new Map();
  private viewAnimation: {
    startTime: number;
    duration: number;
    from: ViewState;
    to: ViewState;
    easing: (t: number) => number;
    onComplete?: () => void;
  } | null = null;

  // Spring animations for hover effects
  private springs: Map<string, SpringState> = new Map();
  private springConfigs: Map<string, SpringConfig> = new Map();

  // Drill transition state
  private drillTransition: DrillTransition | null = null;
  private nodeTransitions: Map<string, NodeTransitionState> = new Map();

  private onRenderNeeded: () => void;
  private reducedMotion: boolean;
  private animationFrameId: number | null = null;

  constructor(onRenderNeeded: () => void, reducedMotion: boolean = false) {
    this.onRenderNeeded = onRenderNeeded;
    this.reducedMotion = reducedMotion;
  }

  /**
   * Set reduced motion preference
   */
  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
  }

  // ==========================================================================
  // View Animations
  // ==========================================================================

  /**
   * Animate to a new view state
   */
  animateToView(
    from: ViewState,
    to: ViewState,
    duration: number = 300,
    easing: (t: number) => number = easeOutCubic,
    onComplete?: () => void
  ): void {
    if (this.reducedMotion) {
      // Skip animation, go directly to target
      this.viewAnimation = null;
      onComplete?.();
      this.onRenderNeeded();
      return;
    }

    this.viewAnimation = {
      startTime: performance.now(),
      duration,
      from,
      to,
      easing,
      onComplete,
    };

    this.onRenderNeeded();
  }

  /**
   * Update view animation and return current interpolated state
   * Returns null if no animation is active
   */
  updateView(currentView: ViewState): ViewState | null {
    if (!this.viewAnimation) {
      return null;
    }

    const elapsed = performance.now() - this.viewAnimation.startTime;
    const progress = Math.min(1, elapsed / this.viewAnimation.duration);
    const t = this.viewAnimation.easing(progress);

    const interpolated: ViewState = {
      offsetX: lerp(this.viewAnimation.from.offsetX, this.viewAnimation.to.offsetX, t),
      offsetY: lerp(this.viewAnimation.from.offsetY, this.viewAnimation.to.offsetY, t),
      scale: lerp(this.viewAnimation.from.scale, this.viewAnimation.to.scale, t),
    };

    if (progress >= 1) {
      const onComplete = this.viewAnimation.onComplete;
      this.viewAnimation = null;
      onComplete?.();
      return this.viewAnimation ? interpolated : null;
    }

    return interpolated;
  }

  /**
   * Get the target view state (for snap-to on interrupt)
   */
  getViewTarget(): ViewState | null {
    return this.viewAnimation?.to || null;
  }

  /**
   * Cancel any active view animation
   */
  cancelViewAnimation(): ViewState | null {
    const target = this.viewAnimation?.to;
    this.viewAnimation = null;
    return target || null;
  }

  /**
   * Check if view is animating
   */
  isViewAnimating(): boolean {
    return this.viewAnimation !== null;
  }

  // ==========================================================================
  // Node Animations
  // ==========================================================================

  /**
   * Add a node property animation
   */
  addAnimation(
    id: string,
    target: string,
    property: string,
    startValue: number,
    endValue: number,
    duration: number = 300,
    easing: (t: number) => number = easeOutCubic,
    onComplete?: () => void
  ): void {
    if (this.reducedMotion) {
      onComplete?.();
      this.onRenderNeeded();
      return;
    }

    this.animations.set(id, {
      id,
      startTime: performance.now(),
      duration,
      startValue,
      endValue,
      property,
      target,
      easing,
      onComplete,
    });

    this.onRenderNeeded();
  }

  /**
   * Update all node animations and return completed ones
   */
  updateAnimations(): { property: string; target: string; value: number }[] {
    const updates: { property: string; target: string; value: number }[] = [];
    const completed: string[] = [];

    for (const [id, anim] of this.animations) {
      const elapsed = performance.now() - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      const t = anim.easing(progress);

      const value = lerp(anim.startValue, anim.endValue, t);
      updates.push({
        property: anim.property,
        target: anim.target,
        value,
      });

      if (progress >= 1) {
        completed.push(id);
        anim.onComplete?.();
      }
    }

    for (const id of completed) {
      this.animations.delete(id);
    }

    return updates;
  }

  /**
   * Cancel all animations for a target
   */
  cancelAnimationsForTarget(target: string): void {
    for (const [id, anim] of this.animations) {
      if (anim.target === target) {
        this.animations.delete(id);
      }
    }
  }

  /**
   * Check if any animations are active
   */
  isAnimating(): boolean {
    return this.viewAnimation !== null || this.animations.size > 0;
  }

  /**
   * Clear all animations
   */
  clear(): void {
    this.animations.clear();
    this.viewAnimation = null;
    this.springs.clear();
    this.drillTransition = null;
    this.nodeTransitions.clear();
  }

  // ==========================================================================
  // Spring Animations (for hover effects)
  // ==========================================================================

  /**
   * Start a spring animation for a node property
   */
  startSpring(
    id: string,
    currentValue: number,
    targetValue: number,
    config?: Partial<SpringConfig>
  ): void {
    if (this.reducedMotion) return;

    this.springs.set(id, {
      value: currentValue,
      velocity: 0,
      target: targetValue,
    });

    if (config) {
      this.springConfigs.set(id, { ...DEFAULT_SPRING, ...config });
    }

    this.scheduleUpdate();
  }

  /**
   * Update spring target (e.g., on hover change)
   */
  setSpringTarget(id: string, target: number): void {
    const spring = this.springs.get(id);
    if (spring) {
      spring.target = target;
      this.scheduleUpdate();
    }
  }

  /**
   * Get current spring value
   */
  getSpringValue(id: string): number | undefined {
    return this.springs.get(id)?.value;
  }

  /**
   * Update all springs (call in animation loop)
   */
  updateSprings(deltaTime: number = 1/60): boolean {
    let hasActive = false;

    for (const [id, state] of this.springs.entries()) {
      const config = this.springConfigs.get(id) || DEFAULT_SPRING;
      const newState = stepSpring(state, config, deltaTime);
      this.springs.set(id, newState);

      if (!isSpringAtRest(newState)) {
        hasActive = true;
      }
    }

    return hasActive;
  }

  /**
   * Remove a spring
   */
  removeSpring(id: string): void {
    this.springs.delete(id);
    this.springConfigs.delete(id);
  }

  // ==========================================================================
  // Drill Transition (Cinematic animations)
  // ==========================================================================

  /**
   * Start a cinematic drill-in transition
   */
  startDrillIn(
    targetNodeId: string,
    fadingNodeIds: string[],
    burstingNodeIds: string[],
    duration: number = 600
  ): void {
    if (this.reducedMotion) return;

    // Create staggered delays for burst animation
    const burstDelays = new Map<string, number>();
    const staggerDelay = 50; // 50ms between each child
    burstingNodeIds.forEach((id, index) => {
      burstDelays.set(id, index * staggerDelay);
    });

    this.drillTransition = {
      type: 'drill-in',
      startTime: performance.now(),
      duration,
      phase: 'fade-out',
      progress: 0,
      targetNodeId,
      fadingNodeIds: new Set(fadingNodeIds),
      burstingNodeIds,
      burstDelays,
    };

    // Initialize node transitions
    for (const nodeId of fadingNodeIds) {
      this.nodeTransitions.set(nodeId, {
        nodeId,
        opacity: 1,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
    }

    for (const nodeId of burstingNodeIds) {
      this.nodeTransitions.set(nodeId, {
        nodeId,
        opacity: 0,
        scale: 0.3,
        offsetX: 0,
        offsetY: 0,
      });
    }

    this.scheduleUpdate();
  }

  /**
   * Start a cinematic drill-out transition
   */
  startDrillOut(
    targetNodeId: string,
    collapsingNodeIds: string[],
    revealingNodeIds: string[],
    duration: number = 500
  ): void {
    if (this.reducedMotion) return;

    const burstDelays = new Map<string, number>();

    this.drillTransition = {
      type: 'drill-out',
      startTime: performance.now(),
      duration,
      phase: 'fade-out',
      progress: 0,
      targetNodeId,
      fadingNodeIds: new Set(collapsingNodeIds),
      burstingNodeIds: revealingNodeIds,
      burstDelays,
    };

    // Initialize transitions for collapsing nodes
    for (const nodeId of collapsingNodeIds) {
      this.nodeTransitions.set(nodeId, {
        nodeId,
        opacity: 1,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
    }

    // Initialize transitions for revealing nodes
    for (const nodeId of revealingNodeIds) {
      this.nodeTransitions.set(nodeId, {
        nodeId,
        opacity: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
    }

    this.scheduleUpdate();
  }

  /**
   * Update drill transition state
   */
  updateDrillTransition(): boolean {
    if (!this.drillTransition) return false;

    const elapsed = performance.now() - this.drillTransition.startTime;
    const progress = Math.min(1, elapsed / this.drillTransition.duration);
    this.drillTransition.progress = progress;

    const { type, fadingNodeIds, burstingNodeIds, burstDelays } = this.drillTransition;

    if (type === 'drill-in') {
      // Phase timing: fade-out (0-0.3), zoom (0.2-0.7), burst (0.4-1.0)
      const fadeProgress = Math.min(1, progress / 0.3);
      const burstStart = 0.4;

      // Update fading nodes
      for (const nodeId of fadingNodeIds) {
        const state = this.nodeTransitions.get(nodeId);
        if (state) {
          state.opacity = 1 - easeOutCubic(fadeProgress);
          state.scale = 1 - 0.2 * easeOutCubic(fadeProgress);
        }
      }

      // Update bursting nodes with stagger
      for (const nodeId of burstingNodeIds) {
        const delay = burstDelays.get(nodeId) || 0;
        const delayNormalized = delay / this.drillTransition.duration;
        const adjustedProgress = Math.max(0, (progress - burstStart - delayNormalized) / (1 - burstStart));

        const state = this.nodeTransitions.get(nodeId);
        if (state) {
          state.opacity = easeOutCubic(Math.min(1, adjustedProgress * 2));
          state.scale = 0.3 + 0.7 * easeOutBack(Math.min(1, adjustedProgress));
        }
      }
    } else {
      // Drill-out: collapse then reveal
      const collapseProgress = Math.min(1, progress / 0.5);
      const revealProgress = Math.max(0, (progress - 0.3) / 0.7);

      // Update collapsing nodes
      for (const nodeId of fadingNodeIds) {
        const state = this.nodeTransitions.get(nodeId);
        if (state) {
          state.opacity = 1 - easeOutCubic(collapseProgress);
          state.scale = 1 - 0.7 * easeOutCubic(collapseProgress);
        }
      }

      // Update revealing nodes
      for (const nodeId of burstingNodeIds) {
        const state = this.nodeTransitions.get(nodeId);
        if (state) {
          state.opacity = easeOutCubic(revealProgress);
        }
      }
    }

    if (progress >= 1) {
      this.drillTransition = null;
      this.nodeTransitions.clear();
      return false;
    }

    return true;
  }

  /**
   * Get node transition state
   */
  getNodeTransition(nodeId: string): NodeTransitionState | undefined {
    return this.nodeTransitions.get(nodeId);
  }

  /**
   * Check if drill transition is active
   */
  isDrillTransitioning(): boolean {
    return this.drillTransition !== null;
  }

  /**
   * Schedule an animation frame update
   */
  private scheduleUpdate(): void {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.animationFrameId = null;
        this.onRenderNeeded();
      });
    }
  }

  // ==========================================================================
  // Batch Operations
  // ==========================================================================

  /**
   * Animate multiple nodes to new positions
   */
  animateNodesToPositions(
    nodes: StrategicMapNode[],
    positions: Map<string, { x: number; y: number }>,
    duration: number = 300
  ): void {
    for (const node of nodes) {
      const target = positions.get(node.id);
      if (!target) continue;

      if (node.x !== target.x) {
        this.addAnimation(
          `${node.id}-x`,
          node.id,
          'x',
          node.x,
          target.x,
          duration
        );
      }

      if (node.y !== target.y) {
        this.addAnimation(
          `${node.id}-y`,
          node.id,
          'y',
          node.y,
          target.y,
          duration
        );
      }
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Linear interpolation
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Clamp a value to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if two values are approximately equal
 */
export function approxEqual(a: number, b: number, epsilon: number = 0.001): number {
  return Math.abs(a - b) < epsilon ? 1 : 0;
}
