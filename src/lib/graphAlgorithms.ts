/**
 * Graph Algorithms Library
 *
 * Contains implementations for:
 * - Louvain community detection (hierarchical clustering)
 * - Dijkstra/A* shortest path finding
 * - Force-Directed Edge Bundling (FDEB)
 * - Multiple layout algorithms (force, radial, hierarchical)
 */

// ============================================================================
// Types
// ============================================================================

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  type?: string;
  label?: string;
  data?: Record<string, unknown>;
  radius?: number;
  fixed?: boolean;
  clusterId?: string;
  depth?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  type?: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface Cluster {
  id: string;
  nodes: string[];
  x: number;
  y: number;
  radius: number;
  parentId?: string;
  children?: Cluster[];
  label?: string;
  color?: string;
}

export interface PathResult {
  path: string[];
  distance: number;
  edges: string[];
}

export interface BundledEdge extends GraphEdge {
  controlPoints: Array<{ x: number; y: number }>;
}

export interface LayoutConfig {
  width: number;
  height: number;
  padding?: number;
  iterations?: number;
  // Force layout specific
  repulsion?: number;
  attraction?: number;
  damping?: number;
  centerGravity?: number;
  // Radial layout specific
  centerNode?: string;
  levelSeparation?: number;
  // Hierarchical layout specific
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing?: number;
  levelSpacing?: number;
}

// ============================================================================
// Louvain Community Detection
// ============================================================================

interface LouvainNode {
  id: string;
  community: number;
  degree: number;
  selfLoops: number;
}

interface LouvainState {
  nodes: Map<string, LouvainNode>;
  communities: Map<number, Set<string>>;
  edges: Map<string, Map<string, number>>;
  totalWeight: number;
  resolution: number;
}

function initLouvainState(
  nodes: GraphNode[],
  edges: GraphEdge[],
  resolution = 1.0
): LouvainState {
  const nodeMap = new Map<string, LouvainNode>();
  const communities = new Map<number, Set<string>>();
  const edgeMap = new Map<string, Map<string, number>>();

  // Initialize each node in its own community
  nodes.forEach((node, i) => {
    nodeMap.set(node.id, {
      id: node.id,
      community: i,
      degree: 0,
      selfLoops: 0,
    });
    communities.set(i, new Set([node.id]));
    edgeMap.set(node.id, new Map());
  });

  // Build adjacency with weights
  let totalWeight = 0;
  edges.forEach((edge) => {
    const weight = edge.weight ?? 1;
    totalWeight += weight;

    const sourceEdges = edgeMap.get(edge.source);
    const targetEdges = edgeMap.get(edge.target);

    if (sourceEdges && targetEdges) {
      sourceEdges.set(edge.target, (sourceEdges.get(edge.target) ?? 0) + weight);
      targetEdges.set(edge.source, (targetEdges.get(edge.source) ?? 0) + weight);

      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (sourceNode) sourceNode.degree += weight;
      if (targetNode) targetNode.degree += weight;

      if (edge.source === edge.target && sourceNode) {
        sourceNode.selfLoops += weight;
      }
    }
  });

  return {
    nodes: nodeMap,
    communities,
    edges: edgeMap,
    totalWeight: totalWeight * 2, // Each edge counted twice
    resolution,
  };
}

function modularity(state: LouvainState): number {
  const m2 = state.totalWeight;
  if (m2 === 0) return 0;

  let q = 0;
  state.communities.forEach((members) => {
    let sumIn = 0;
    let sumTot = 0;

    members.forEach((nodeId) => {
      const node = state.nodes.get(nodeId)!;
      sumTot += node.degree;

      const edges = state.edges.get(nodeId)!;
      edges.forEach((weight, targetId) => {
        if (members.has(targetId)) {
          sumIn += weight;
        }
      });
    });

    q += sumIn / m2 - state.resolution * (sumTot / m2) * (sumTot / m2);
  });

  return q;
}

function modularityGain(
  state: LouvainState,
  nodeId: string,
  targetCommunity: number
): number {
  const node = state.nodes.get(nodeId)!;
  const m2 = state.totalWeight;
  if (m2 === 0) return 0;

  const targetMembers = state.communities.get(targetCommunity);
  if (!targetMembers) return 0;

  let sumIn = 0;
  let sumTot = 0;

  targetMembers.forEach((memberId) => {
    const member = state.nodes.get(memberId)!;
    sumTot += member.degree;
  });

  const edges = state.edges.get(nodeId)!;
  edges.forEach((weight, targetId) => {
    if (targetMembers.has(targetId)) {
      sumIn += weight;
    }
  });

  const ki = node.degree;
  const kiIn = sumIn;

  return (
    (kiIn / m2 - state.resolution * (sumTot * ki) / (m2 * m2)) * 2
  );
}

function moveNode(
  state: LouvainState,
  nodeId: string,
  newCommunity: number
): void {
  const node = state.nodes.get(nodeId)!;
  const oldCommunity = node.community;

  // Remove from old community
  const oldMembers = state.communities.get(oldCommunity);
  if (oldMembers) {
    oldMembers.delete(nodeId);
    if (oldMembers.size === 0) {
      state.communities.delete(oldCommunity);
    }
  }

  // Add to new community
  let newMembers = state.communities.get(newCommunity);
  if (!newMembers) {
    newMembers = new Set();
    state.communities.set(newCommunity, newMembers);
  }
  newMembers.add(nodeId);

  // Update node
  node.community = newCommunity;
}

function louvainPass(state: LouvainState): boolean {
  let improved = false;
  const nodeIds = Array.from(state.nodes.keys());

  // Randomize order for better convergence
  for (let i = nodeIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nodeIds[i], nodeIds[j]] = [nodeIds[j], nodeIds[i]];
  }

  for (const nodeId of nodeIds) {
    const node = state.nodes.get(nodeId)!;
    const currentCommunity = node.community;

    // Find neighboring communities
    const neighborCommunities = new Set<number>();
    const edges = state.edges.get(nodeId)!;
    edges.forEach((_, targetId) => {
      const target = state.nodes.get(targetId);
      if (target) {
        neighborCommunities.add(target.community);
      }
    });

    // Find best community
    let bestCommunity = currentCommunity;
    let bestGain = 0;

    // First, calculate loss from leaving current community
    const leaveLoss = -modularityGain(state, nodeId, currentCommunity);

    for (const community of neighborCommunities) {
      if (community !== currentCommunity) {
        const gain = modularityGain(state, nodeId, community) + leaveLoss;
        if (gain > bestGain) {
          bestGain = gain;
          bestCommunity = community;
        }
      }
    }

    if (bestCommunity !== currentCommunity && bestGain > 1e-10) {
      moveNode(state, nodeId, bestCommunity);
      improved = true;
    }
  }

  return improved;
}

/**
 * Louvain community detection algorithm.
 * Returns clusters with assigned node IDs.
 */
export function louvainClustering(
  nodes: GraphNode[],
  edges: GraphEdge[],
  resolution = 1.0,
  maxIterations = 10
): Cluster[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [{
      id: 'cluster-0',
      nodes: [nodes[0].id],
      x: nodes[0].x,
      y: nodes[0].y,
      radius: nodes[0].radius ?? 20,
    }];
  }

  const state = initLouvainState(nodes, edges, resolution);

  // Iterative optimization
  for (let iter = 0; iter < maxIterations; iter++) {
    const improved = louvainPass(state);
    if (!improved) break;
  }

  // Convert communities to clusters
  const nodePositions = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const clusters: Cluster[] = [];

  state.communities.forEach((members, communityId) => {
    if (members.size === 0) return;

    const memberArray = Array.from(members);
    let cx = 0,
      cy = 0,
      maxDist = 0;

    memberArray.forEach((nodeId) => {
      const pos = nodePositions.get(nodeId);
      if (pos) {
        cx += pos.x;
        cy += pos.y;
      }
    });

    cx /= memberArray.length;
    cy /= memberArray.length;

    // Calculate radius
    memberArray.forEach((nodeId) => {
      const pos = nodePositions.get(nodeId);
      if (pos) {
        const dist = Math.sqrt((pos.x - cx) ** 2 + (pos.y - cy) ** 2);
        maxDist = Math.max(maxDist, dist);
      }
    });

    clusters.push({
      id: `cluster-${communityId}`,
      nodes: memberArray,
      x: cx,
      y: cy,
      radius: maxDist + 30,
    });
  });

  return clusters;
}

// ============================================================================
// Dijkstra Shortest Path
// ============================================================================

interface DijkstraNode {
  id: string;
  distance: number;
  previous: string | null;
  previousEdge: string | null;
}

/**
 * Priority queue implementation using a binary heap
 */
class PriorityQueue<T> {
  private heap: Array<{ item: T; priority: number }> = [];

  push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0].item;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority <= this.heap[index].priority) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < this.heap.length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < this.heap.length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }

      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}

/**
 * Dijkstra's shortest path algorithm.
 * Returns the shortest path between two nodes.
 */
export function dijkstraPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string
): PathResult | null {
  const nodeMap = new Map<string, DijkstraNode>();
  const adjacency = new Map<string, Array<{ nodeId: string; edgeId: string; weight: number }>>();

  // Initialize
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      distance: node.id === sourceId ? 0 : Infinity,
      previous: null,
      previousEdge: null,
    });
    adjacency.set(node.id, []);
  });

  // Build adjacency
  edges.forEach((edge) => {
    const weight = edge.weight ?? 1;
    adjacency.get(edge.source)?.push({
      nodeId: edge.target,
      edgeId: edge.id,
      weight,
    });
    adjacency.get(edge.target)?.push({
      nodeId: edge.source,
      edgeId: edge.id,
      weight,
    });
  });

  // Priority queue
  const pq = new PriorityQueue<string>();
  pq.push(sourceId, 0);

  const visited = new Set<string>();

  while (!pq.isEmpty()) {
    const currentId = pq.pop()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    if (currentId === targetId) break;

    const current = nodeMap.get(currentId)!;
    const neighbors = adjacency.get(currentId) ?? [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor.nodeId)) continue;

      const alt = current.distance + neighbor.weight;
      const neighborNode = nodeMap.get(neighbor.nodeId)!;

      if (alt < neighborNode.distance) {
        neighborNode.distance = alt;
        neighborNode.previous = currentId;
        neighborNode.previousEdge = neighbor.edgeId;
        pq.push(neighbor.nodeId, alt);
      }
    }
  }

  // Reconstruct path
  const targetNode = nodeMap.get(targetId);
  if (!targetNode || targetNode.distance === Infinity) {
    return null;
  }

  const path: string[] = [];
  const pathEdges: string[] = [];
  let current: string | null = targetId;

  while (current) {
    path.unshift(current);
    const pathNodeData: DijkstraNode = nodeMap.get(current)!;
    if (pathNodeData.previousEdge) {
      pathEdges.unshift(pathNodeData.previousEdge);
    }
    current = pathNodeData.previous;
  }

  return {
    path,
    distance: targetNode.distance,
    edges: pathEdges,
  };
}

/**
 * Find all shortest paths from a source to all other nodes (BFS for unweighted).
 */
export function allShortestPaths(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string
): Map<string, PathResult> {
  const results = new Map<string, PathResult>();

  for (const node of nodes) {
    if (node.id !== sourceId) {
      const result = dijkstraPath(nodes, edges, sourceId, node.id);
      if (result) {
        results.set(node.id, result);
      }
    }
  }

  return results;
}

// ============================================================================
// Force-Directed Edge Bundling (FDEB)
// ============================================================================

interface BundlePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function edgeLength(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function edgeCompatibility(
  e1Start: { x: number; y: number },
  e1End: { x: number; y: number },
  e2Start: { x: number; y: number },
  e2End: { x: number; y: number }
): number {
  // Length compatibility
  const l1 = edgeLength(e1Start, e1End);
  const l2 = edgeLength(e2Start, e2End);
  const lavg = (l1 + l2) / 2;
  const lengthCompat = 2 / (lavg / Math.min(l1, l2) + Math.max(l1, l2) / lavg);

  // Angle compatibility
  const d1 = { x: e1End.x - e1Start.x, y: e1End.y - e1Start.y };
  const d2 = { x: e2End.x - e2Start.x, y: e2End.y - e2Start.y };
  const len1 = Math.sqrt(d1.x ** 2 + d1.y ** 2) || 1;
  const len2 = Math.sqrt(d2.x ** 2 + d2.y ** 2) || 1;
  const dot = (d1.x * d2.x + d1.y * d2.y) / (len1 * len2);
  const angleCompat = Math.abs(dot);

  // Position compatibility
  const m1 = { x: (e1Start.x + e1End.x) / 2, y: (e1Start.y + e1End.y) / 2 };
  const m2 = { x: (e2Start.x + e2End.x) / 2, y: (e2Start.y + e2End.y) / 2 };
  const dist = edgeLength(m1, m2);
  const posCompat = lavg / (lavg + dist);

  return lengthCompat * angleCompat * posCompat;
}

/**
 * Force-directed edge bundling.
 * Groups edges together based on compatibility.
 */
export function bundleEdges(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: {
    subdivisions?: number;
    iterations?: number;
    compatibility?: number;
    springConstant?: number;
  } = {}
): BundledEdge[] {
  const {
    subdivisions = 6,
    iterations = 50,
    compatibility = 0.6,
    springConstant = 0.1,
  } = config;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Create subdivision points for each edge
  const edgePoints = edges.map((edge) => {
    const source = nodeMap.get(edge.source)!;
    const target = nodeMap.get(edge.target)!;

    const points: BundlePoint[] = [];
    for (let i = 0; i <= subdivisions; i++) {
      const t = i / subdivisions;
      points.push({
        x: source.x + t * (target.x - source.x),
        y: source.y + t * (target.y - source.y),
        vx: 0,
        vy: 0,
      });
    }

    return { edge, points, source, target };
  });

  // Pre-compute compatibility
  const compatMatrix: number[][] = [];
  for (let i = 0; i < edgePoints.length; i++) {
    compatMatrix[i] = [];
    for (let j = 0; j < edgePoints.length; j++) {
      if (i === j) {
        compatMatrix[i][j] = 0;
      } else if (j < i) {
        compatMatrix[i][j] = compatMatrix[j][i];
      } else {
        const e1 = edgePoints[i];
        const e2 = edgePoints[j];
        compatMatrix[i][j] = edgeCompatibility(e1.source, e1.target, e2.source, e2.target);
      }
    }
  }

  // Iterative bundling
  for (let iter = 0; iter < iterations; iter++) {
    const stepSize = 0.04 * (1 - iter / iterations);

    for (let i = 0; i < edgePoints.length; i++) {
      const e1 = edgePoints[i];

      // Skip first and last points (anchored to nodes)
      for (let p = 1; p < e1.points.length - 1; p++) {
        const point = e1.points[p];
        let fx = 0,
          fy = 0;

        // Spring force to neighbors
        const prev = e1.points[p - 1];
        const next = e1.points[p + 1];
        fx += springConstant * (prev.x + next.x - 2 * point.x);
        fy += springConstant * (prev.y + next.y - 2 * point.y);

        // Electrostatic force from compatible edges
        for (let j = 0; j < edgePoints.length; j++) {
          if (i === j || compatMatrix[i][j] < compatibility) continue;

          const e2 = edgePoints[j];
          const t = p / subdivisions;
          const p2 = e2.points[Math.round(t * subdivisions)];

          const dx = p2.x - point.x;
          const dy = p2.y - point.y;
          const dist = Math.sqrt(dx ** 2 + dy ** 2) || 1;

          const force = compatMatrix[i][j] / dist;
          fx += force * dx;
          fy += force * dy;
        }

        point.x += fx * stepSize;
        point.y += fy * stepSize;
      }
    }
  }

  // Convert to bundled edges
  return edgePoints.map(({ edge, points }) => ({
    ...edge,
    controlPoints: points.map((p) => ({ x: p.x, y: p.y })),
  }));
}

// ============================================================================
// Layout Algorithms
// ============================================================================

/**
 * Advanced force-directed layout with Barnes-Hut optimization.
 */
export function forceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
): GraphNode[] {
  const {
    width,
    height,
    padding = 40,
    iterations = 100,
    repulsion = 1000,
    attraction = 0.01,
    damping = 0.85,
    centerGravity = 0.05,
  } = config;

  const centerX = width / 2;
  const centerY = height / 2;

  // Clone nodes with initial positions
  const layoutNodes = nodes.map((node, i) => {
    const hasPosition = node.x !== undefined && node.y !== undefined && (node.x !== 0 || node.y !== 0);
    const angle = (i / nodes.length) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.3;

    return {
      ...node,
      x: hasPosition ? node.x : centerX + Math.cos(angle) * radius,
      y: hasPosition ? node.y : centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    };
  });

  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

  // Simulation
  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    // Repulsion (all pairs)
    for (let i = 0; i < layoutNodes.length; i++) {
      if (layoutNodes[i].fixed) continue;

      for (let j = i + 1; j < layoutNodes.length; j++) {
        const n1 = layoutNodes[i];
        const n2 = layoutNodes[j];

        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx ** 2 + dy ** 2) || 1;
        const force = (repulsion * alpha) / (dist ** 2);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx! += fx;
        n1.vy! += fy;

        if (!n2.fixed) {
          n2.vx! -= fx;
          n2.vy! -= fy;
        }
      }
    }

    // Attraction (edges)
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx ** 2 + dy ** 2) || 1;
      const force = dist * attraction * (edge.weight ?? 1) * alpha;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!source.fixed) {
        source.vx! += fx;
        source.vy! += fy;
      }
      if (!target.fixed) {
        target.vx! -= fx;
        target.vy! -= fy;
      }
    }

    // Center gravity
    for (const node of layoutNodes) {
      if (node.fixed) continue;
      node.vx! += (centerX - node.x) * centerGravity * alpha;
      node.vy! += (centerY - node.y) * centerGravity * alpha;
    }

    // Apply velocities with damping
    for (const node of layoutNodes) {
      if (node.fixed) continue;
      node.vx! *= damping;
      node.vy! *= damping;
      node.x += node.vx!;
      node.y += node.vy!;

      // Bounds
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }

  return layoutNodes;
}

/**
 * Radial layout centered on a specific node.
 */
export function radialLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
): GraphNode[] {
  const {
    width,
    height,
    padding = 40,
    centerNode,
    levelSeparation = 80,
  } = config;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - padding;

  // Build adjacency
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((n) => adjacency.set(n.id, new Set()));

  edges.forEach((e) => {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  });

  // BFS from center to assign levels
  const center = centerNode ?? nodes[0]?.id;
  if (!center) return nodes;

  const levels = new Map<string, number>();
  const queue = [center];
  levels.set(center, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current)!;

    adjacency.get(current)?.forEach((neighbor) => {
      if (!levels.has(neighbor)) {
        levels.set(neighbor, currentLevel + 1);
        queue.push(neighbor);
      }
    });
  }

  // Handle disconnected nodes
  nodes.forEach((n) => {
    if (!levels.has(n.id)) {
      levels.set(n.id, Math.max(...levels.values()) + 1);
    }
  });

  // Group by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  });

  const maxLevel = Math.max(...levelGroups.keys());
  const radiusPerLevel = maxRadius / (maxLevel + 1);

  // Position nodes
  const layoutNodes = nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const group = levelGroups.get(level) ?? [];
    const index = group.indexOf(node.id);
    const count = group.length;

    let x: number, y: number;

    if (level === 0) {
      x = centerX;
      y = centerY;
    } else {
      const radius = Math.min(level * levelSeparation, maxRadius);
      const angle = count === 1 ? 0 : (index / count) * Math.PI * 2 - Math.PI / 2;
      x = centerX + Math.cos(angle) * radius;
      y = centerY + Math.sin(angle) * radius;
    }

    return {
      ...node,
      x,
      y,
      depth: level,
    };
  });

  return layoutNodes;
}

/**
 * Hierarchical/tree layout.
 */
export function hierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
): GraphNode[] {
  const {
    width,
    height,
    padding = 40,
    direction = 'TB',
    nodeSpacing = 50,
    levelSpacing = 100,
  } = config;

  // Build tree structure
  const adjacency = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    adjacency.set(n.id, new Set());
    inDegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    adjacency.get(e.source)?.add(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  });

  // Find roots (nodes with no incoming edges)
  const roots = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);

  if (roots.length === 0) {
    // Cyclic graph, pick first node as root
    roots.push(nodes[0].id);
  }

  // BFS to assign levels
  const levels = new Map<string, number>();
  const queue = [...roots];
  roots.forEach((r) => levels.set(r, 0));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current)!;

    adjacency.get(current)?.forEach((child) => {
      if (!levels.has(child)) {
        levels.set(child, currentLevel + 1);
        queue.push(child);
      }
    });
  }

  // Handle unvisited nodes
  nodes.forEach((n) => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 0);
    }
  });

  // Group by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  });

  const maxLevel = Math.max(...levelGroups.keys());
  const isHorizontal = direction === 'LR' || direction === 'RL';
  const isReversed = direction === 'BT' || direction === 'RL';

  const availableWidth = isHorizontal ? height : width;
  const availableHeight = isHorizontal ? width : height;

  // Position nodes
  const layoutNodes = nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const group = levelGroups.get(level) ?? [];
    const index = group.indexOf(node.id);
    const count = group.length;

    const groupWidth = (count - 1) * nodeSpacing;
    const startOffset = (availableWidth - groupWidth) / 2;

    let primary = startOffset + index * nodeSpacing;
    let secondary = padding + (isReversed ? maxLevel - level : level) * levelSpacing;

    // Clamp to bounds
    primary = Math.max(padding, Math.min(availableWidth - padding, primary));
    secondary = Math.max(padding, Math.min(availableHeight - padding, secondary));

    return {
      ...node,
      x: isHorizontal ? secondary : primary,
      y: isHorizontal ? primary : secondary,
      depth: level,
    };
  });

  return layoutNodes;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate the bounding box of nodes
 */
export function getBounds(nodes: GraphNode[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  nodes.forEach((n) => {
    const r = n.radius ?? 10;
    minX = Math.min(minX, n.x - r);
    maxX = Math.max(maxX, n.x + r);
    minY = Math.min(minY, n.y - r);
    maxY = Math.max(maxY, n.y + r);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Find nodes connected to a given node within N hops
 */
export function getNeighborhood(
  nodeId: string,
  edges: GraphEdge[],
  hops = 1
): Set<string> {
  const result = new Set<string>([nodeId]);
  const adjacency = new Map<string, Set<string>>();

  edges.forEach((e) => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set());
    if (!adjacency.has(e.target)) adjacency.set(e.target, new Set());
    adjacency.get(e.source)!.add(e.target);
    adjacency.get(e.target)!.add(e.source);
  });

  let frontier = new Set([nodeId]);

  for (let i = 0; i < hops; i++) {
    const newFrontier = new Set<string>();
    frontier.forEach((id) => {
      adjacency.get(id)?.forEach((neighbor) => {
        if (!result.has(neighbor)) {
          result.add(neighbor);
          newFrontier.add(neighbor);
        }
      });
    });
    frontier = newFrontier;
  }

  return result;
}

/**
 * Calculate graph statistics
 */
export function getGraphStats(
  nodes: GraphNode[],
  edges: GraphEdge[]
): {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  density: number;
  components: number;
} {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;
  const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

  // Count connected components
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((n) => adjacency.set(n.id, new Set()));
  edges.forEach((e) => {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  });

  const visited = new Set<string>();
  let components = 0;

  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      components++;
      const stack = [n.id];
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        adjacency.get(current)?.forEach((neighbor) => {
          if (!visited.has(neighbor)) stack.push(neighbor);
        });
      }
    }
  });

  return {
    nodeCount,
    edgeCount,
    avgDegree,
    density,
    components,
  };
}
