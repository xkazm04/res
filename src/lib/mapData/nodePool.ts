/**
 * Node Pool - Object recycling to avoid GC pressure
 *
 * When rendering 10,000+ nodes with viewport culling, nodes are constantly
 * created/destroyed as the user pans. An object pool recycles node objects
 * instead of allocating new ones, reducing garbage collection pauses.
 */

import type { StrategicMapNode, StrategicNodeType, LODLevel } from '@/src/lib/strategicMap/types';

// ============================================================================
// Pool Configuration
// ============================================================================

const DEFAULT_POOL_SIZE = 2000;
const GROW_FACTOR = 1.5;

// ============================================================================
// Node Pool
// ============================================================================

export class NodePool {
  private pool: StrategicMapNode[] = [];
  private activeCount = 0;
  private totalCreated = 0;

  constructor(initialSize: number = DEFAULT_POOL_SIZE) {
    this.preallocate(initialSize);
  }

  /**
   * Pre-allocate empty nodes to avoid initial allocation burst
   */
  private preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createEmptyNode());
    }
  }

  /**
   * Create a blank node with default values
   */
  private createEmptyNode(): StrategicMapNode {
    this.totalCreated++;
    return {
      id: '',
      type: 'session' as StrategicNodeType,
      x: 0,
      y: 0,
      radius: 10,
      color: '#888888',
      label: '',
      aggregatedCount: 0,
      children: [],
      parent: undefined,
      visible: false,
      lod: 'minimal' as LODLevel,
      templateType: undefined,
      thematicGroup: undefined,
      topic: undefined,
      session: undefined,
      sessions: undefined,
      targetX: undefined,
      targetY: undefined,
      targetRadius: undefined,
      pulsePhase: undefined,
    };
  }

  /**
   * Acquire a node from the pool. Initializes it with the given properties.
   */
  acquire(props: {
    id: string;
    type: StrategicNodeType;
    x: number;
    y: number;
    radius: number;
    color: string;
    label: string;
    aggregatedCount: number;
    parent?: string;
    templateType?: string;
    thematicGroup?: string;
    topic?: StrategicMapNode['topic'];
    session?: StrategicMapNode['session'];
    sessions?: StrategicMapNode['sessions'];
  }): StrategicMapNode {
    let node: StrategicMapNode;

    if (this.pool.length > 0) {
      node = this.pool.pop()!;
    } else {
      // Pool exhausted, grow by creating a new node
      node = this.createEmptyNode();
    }

    // Initialize with provided properties
    node.id = props.id;
    node.type = props.type;
    node.x = props.x;
    node.y = props.y;
    node.radius = props.radius;
    node.color = props.color;
    node.label = props.label;
    node.aggregatedCount = props.aggregatedCount;
    node.children = [];
    node.parent = props.parent;
    node.visible = true;
    node.lod = 'standard';
    node.templateType = props.templateType;
    node.thematicGroup = props.thematicGroup;
    node.topic = props.topic;
    node.session = props.session;
    node.sessions = props.sessions;
    node.targetX = undefined;
    node.targetY = undefined;
    node.targetRadius = undefined;
    node.pulsePhase = undefined;

    this.activeCount++;
    return node;
  }

  /**
   * Release a node back to the pool for reuse
   */
  release(node: StrategicMapNode): void {
    // Clear references to allow GC of referenced objects
    node.id = '';
    node.label = '';
    node.children = [];
    node.parent = undefined;
    node.visible = false;
    node.topic = undefined;
    node.session = undefined;
    node.sessions = undefined;
    node.templateType = undefined;
    node.thematicGroup = undefined;

    this.pool.push(node);
    this.activeCount--;
  }

  /**
   * Release multiple nodes back to the pool
   */
  releaseAll(nodes: StrategicMapNode[]): void {
    for (const node of nodes) {
      this.release(node);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    available: number;
    active: number;
    totalCreated: number;
    poolSize: number;
  } {
    return {
      available: this.pool.length,
      active: this.activeCount,
      totalCreated: this.totalCreated,
      poolSize: this.pool.length + this.activeCount,
    };
  }

  /**
   * Shrink pool if it's significantly oversized (call during idle)
   */
  compact(targetAvailable: number = DEFAULT_POOL_SIZE): void {
    if (this.pool.length > targetAvailable * GROW_FACTOR) {
      this.pool.length = targetAvailable;
    }
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    this.pool = [];
    this.activeCount = 0;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let poolInstance: NodePool | null = null;

export function getNodePool(): NodePool {
  if (!poolInstance) {
    poolInstance = new NodePool();
  }
  return poolInstance;
}
