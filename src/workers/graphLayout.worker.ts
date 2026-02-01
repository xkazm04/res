/**
 * Graph Layout Web Worker
 *
 * Offloads heavy computation for:
 * - Force-directed layout simulation
 * - Hierarchical clustering
 * - Edge bundling
 * - Path finding
 *
 * Designed for graphs with 500+ nodes without blocking the main thread.
 */

// Types (duplicated to avoid import issues in worker context)
interface WorkerGraphNode {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  type?: string;
  label?: string;
  radius?: number;
  fixed?: boolean;
  clusterId?: string;
}

interface WorkerGraphEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  type?: string;
}

interface WorkerCluster {
  id: string;
  nodes: string[];
  x: number;
  y: number;
  radius: number;
  parentId?: string;
}

interface WorkerLayoutConfig {
  width: number;
  height: number;
  padding?: number;
  iterations?: number;
  repulsion?: number;
  attraction?: number;
  damping?: number;
  centerGravity?: number;
  centerNode?: string;
  levelSeparation?: number;
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing?: number;
  levelSpacing?: number;
}

type LayoutAlgorithm = 'force' | 'radial' | 'hierarchical';

interface WorkerMessage {
  type: 'layout' | 'cluster' | 'bundle' | 'pathfind' | 'cancel';
  id: string;
  data?: {
    nodes?: WorkerGraphNode[];
    edges?: WorkerGraphEdge[];
    config?: WorkerLayoutConfig;
    algorithm?: LayoutAlgorithm;
    sourceId?: string;
    targetId?: string;
    resolution?: number;
    bundleConfig?: {
      subdivisions?: number;
      iterations?: number;
      compatibility?: number;
    };
  };
}

interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  id: string;
  data?: {
    nodes?: WorkerGraphNode[];
    clusters?: WorkerCluster[];
    bundledEdges?: Array<WorkerGraphEdge & { controlPoints: Array<{ x: number; y: number }> }>;
    path?: { path: string[]; distance: number; edges: string[] } | null;
    progress?: number;
    message?: string;
  };
  error?: string;
}

let currentTaskId: string | null = null;
let isCancelled = false;

// ============================================================================
// Force Layout Implementation
// ============================================================================

function forceLayoutWorker(
  nodes: WorkerGraphNode[],
  edges: WorkerGraphEdge[],
  config: WorkerLayoutConfig,
  reportProgress: (progress: number) => void
): WorkerGraphNode[] {
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

  // Initialize positions
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

  // Barnes-Hut quadtree for large graphs
  const useQuadtree = nodes.length > 200;

  for (let iter = 0; iter < iterations; iter++) {
    if (isCancelled) return layoutNodes;

    const alpha = 1 - iter / iterations;

    if (useQuadtree) {
      // Simplified quadtree approximation for repulsion
      applyRepulsionQuadtree(layoutNodes, repulsion, alpha);
    } else {
      // Direct N^2 calculation for smaller graphs
      applyRepulsionDirect(layoutNodes, repulsion, alpha);
    }

    // Attraction along edges
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

    // Apply velocities
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

    // Report progress every 10 iterations
    if (iter % 10 === 0) {
      reportProgress(iter / iterations);
    }
  }

  reportProgress(1);
  return layoutNodes;
}

function applyRepulsionDirect(
  nodes: WorkerGraphNode[],
  repulsion: number,
  alpha: number
): void {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].fixed) continue;

    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];

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
}

// Simplified quadtree-like grouping for performance
function applyRepulsionQuadtree(
  nodes: WorkerGraphNode[],
  repulsion: number,
  alpha: number
): void {
  // Divide space into grid cells
  const gridSize = 100;
  const cells = new Map<string, WorkerGraphNode[]>();

  for (const node of nodes) {
    const cellX = Math.floor(node.x / gridSize);
    const cellY = Math.floor(node.y / gridSize);
    const key = `${cellX},${cellY}`;

    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(node);
  }

  // Process each node
  for (const node of nodes) {
    if (node.fixed) continue;

    const cellX = Math.floor(node.x / gridSize);
    const cellY = Math.floor(node.y / gridSize);

    // Check neighboring cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const cellNodes = cells.get(key);
        if (!cellNodes) continue;

        for (const other of cellNodes) {
          if (other.id === node.id) continue;

          const ddx = node.x - other.x;
          const ddy = node.y - other.y;
          const dist = Math.sqrt(ddx ** 2 + ddy ** 2) || 1;
          const force = (repulsion * alpha) / (dist ** 2);

          node.vx! += (ddx / dist) * force;
          node.vy! += (ddy / dist) * force;
        }
      }
    }

    // Approximate force from distant cells
    cells.forEach((cellNodes, key) => {
      const [cx, cy] = key.split(',').map(Number);
      if (Math.abs(cx - cellX) <= 1 && Math.abs(cy - cellY) <= 1) return;

      // Use cell center of mass
      let massCenterX = 0,
        massCenterY = 0;
      for (const cn of cellNodes) {
        massCenterX += cn.x;
        massCenterY += cn.y;
      }
      massCenterX /= cellNodes.length;
      massCenterY /= cellNodes.length;

      const ddx = node.x - massCenterX;
      const ddy = node.y - massCenterY;
      const dist = Math.sqrt(ddx ** 2 + ddy ** 2) || 1;
      const force = (repulsion * alpha * cellNodes.length) / (dist ** 2);

      node.vx! += (ddx / dist) * force;
      node.vy! += (ddy / dist) * force;
    });
  }
}

// ============================================================================
// Radial Layout Implementation
// ============================================================================

function radialLayoutWorker(
  nodes: WorkerGraphNode[],
  edges: WorkerGraphEdge[],
  config: WorkerLayoutConfig,
  reportProgress: (progress: number) => void
): WorkerGraphNode[] {
  const { width, height, padding = 40, centerNode, levelSeparation = 80 } = config;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - padding;

  reportProgress(0.2);

  // Build adjacency
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((n) => adjacency.set(n.id, new Set()));
  edges.forEach((e) => {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  });

  reportProgress(0.4);

  // BFS from center
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

  // Handle disconnected
  nodes.forEach((n) => {
    if (!levels.has(n.id)) {
      levels.set(n.id, Math.max(...levels.values()) + 1);
    }
  });

  reportProgress(0.6);

  // Group by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  });

  const maxLevel = Math.max(...levelGroups.keys());

  reportProgress(0.8);

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

    return { ...node, x, y };
  });

  reportProgress(1);
  return layoutNodes;
}

// ============================================================================
// Hierarchical Layout Implementation
// ============================================================================

function hierarchicalLayoutWorker(
  nodes: WorkerGraphNode[],
  edges: WorkerGraphEdge[],
  config: WorkerLayoutConfig,
  reportProgress: (progress: number) => void
): WorkerGraphNode[] {
  const {
    width,
    height,
    padding = 40,
    direction = 'TB',
    nodeSpacing = 50,
    levelSpacing = 100,
  } = config;

  reportProgress(0.2);

  // Build tree
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

  reportProgress(0.4);

  // Find roots
  const roots = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  if (roots.length === 0) roots.push(nodes[0].id);

  // Assign levels
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

  nodes.forEach((n) => {
    if (!levels.has(n.id)) levels.set(n.id, 0);
  });

  reportProgress(0.6);

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

  reportProgress(0.8);

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

    primary = Math.max(padding, Math.min(availableWidth - padding, primary));
    secondary = Math.max(padding, Math.min(availableHeight - padding, secondary));

    return {
      ...node,
      x: isHorizontal ? secondary : primary,
      y: isHorizontal ? primary : secondary,
    };
  });

  reportProgress(1);
  return layoutNodes;
}

// ============================================================================
// Louvain Clustering Implementation
// ============================================================================

function louvainClusteringWorker(
  nodes: WorkerGraphNode[],
  edges: WorkerGraphEdge[],
  resolution: number,
  reportProgress: (progress: number) => void
): WorkerCluster[] {
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

  reportProgress(0.1);

  // Initialize state
  const nodeMap = new Map<string, { community: number; degree: number }>();
  const communities = new Map<number, Set<string>>();
  const edgeMap = new Map<string, Map<string, number>>();

  nodes.forEach((node, i) => {
    nodeMap.set(node.id, { community: i, degree: 0 });
    communities.set(i, new Set([node.id]));
    edgeMap.set(node.id, new Map());
  });

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
    }
  });

  totalWeight *= 2;

  reportProgress(0.3);

  // Optimization iterations
  const maxIterations = 10;
  for (let iter = 0; iter < maxIterations; iter++) {
    if (isCancelled) break;

    let improved = false;
    const nodeIds = Array.from(nodeMap.keys());

    // Shuffle for better convergence
    for (let i = nodeIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nodeIds[i], nodeIds[j]] = [nodeIds[j], nodeIds[i]];
    }

    for (const nodeId of nodeIds) {
      const node = nodeMap.get(nodeId)!;
      const currentCommunity = node.community;

      // Find neighboring communities
      const neighborCommunities = new Set<number>();
      const edges = edgeMap.get(nodeId)!;
      edges.forEach((_, targetId) => {
        const target = nodeMap.get(targetId);
        if (target) neighborCommunities.add(target.community);
      });

      // Find best community
      let bestCommunity = currentCommunity;
      let bestGain = 0;

      for (const community of neighborCommunities) {
        if (community === currentCommunity) continue;

        const targetMembers = communities.get(community);
        if (!targetMembers) continue;

        let sumIn = 0;
        let sumTot = 0;

        targetMembers.forEach((memberId) => {
          const member = nodeMap.get(memberId)!;
          sumTot += member.degree;
        });

        edges.forEach((weight, targetId) => {
          if (targetMembers.has(targetId)) sumIn += weight;
        });

        const ki = node.degree;
        const gain = totalWeight > 0
          ? (sumIn / totalWeight - resolution * (sumTot * ki) / (totalWeight * totalWeight)) * 2
          : 0;

        if (gain > bestGain) {
          bestGain = gain;
          bestCommunity = community;
        }
      }

      if (bestCommunity !== currentCommunity && bestGain > 1e-10) {
        // Move node
        const oldMembers = communities.get(currentCommunity);
        if (oldMembers) {
          oldMembers.delete(nodeId);
          if (oldMembers.size === 0) communities.delete(currentCommunity);
        }

        let newMembers = communities.get(bestCommunity);
        if (!newMembers) {
          newMembers = new Set();
          communities.set(bestCommunity, newMembers);
        }
        newMembers.add(nodeId);
        node.community = bestCommunity;

        improved = true;
      }
    }

    reportProgress(0.3 + (iter / maxIterations) * 0.5);

    if (!improved) break;
  }

  reportProgress(0.8);

  // Convert to clusters
  const nodePositions = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const clusters: WorkerCluster[] = [];

  communities.forEach((members, communityId) => {
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

  reportProgress(1);
  return clusters;
}

// ============================================================================
// Edge Bundling Implementation
// ============================================================================

function bundleEdgesWorker(
  nodes: WorkerGraphNode[],
  edges: WorkerGraphEdge[],
  config: { subdivisions?: number; iterations?: number; compatibility?: number },
  reportProgress: (progress: number) => void
): Array<WorkerGraphEdge & { controlPoints: Array<{ x: number; y: number }> }> {
  const { subdivisions = 6, iterations = 50, compatibility = 0.6 } = config;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Create subdivision points
  const edgePoints = edges.map((edge) => {
    const source = nodeMap.get(edge.source)!;
    const target = nodeMap.get(edge.target)!;

    const points: Array<{ x: number; y: number; vx: number; vy: number }> = [];
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

  reportProgress(0.1);

  // Compute compatibility
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

        const l1 = Math.sqrt((e1.target.x - e1.source.x) ** 2 + (e1.target.y - e1.source.y) ** 2);
        const l2 = Math.sqrt((e2.target.x - e2.source.x) ** 2 + (e2.target.y - e2.source.y) ** 2);
        const lavg = (l1 + l2) / 2;
        const lengthCompat = 2 / (lavg / Math.min(l1, l2) + Math.max(l1, l2) / lavg);

        const d1 = { x: e1.target.x - e1.source.x, y: e1.target.y - e1.source.y };
        const d2 = { x: e2.target.x - e2.source.x, y: e2.target.y - e2.source.y };
        const len1 = Math.sqrt(d1.x ** 2 + d1.y ** 2) || 1;
        const len2 = Math.sqrt(d2.x ** 2 + d2.y ** 2) || 1;
        const dot = (d1.x * d2.x + d1.y * d2.y) / (len1 * len2);
        const angleCompat = Math.abs(dot);

        const m1 = { x: (e1.source.x + e1.target.x) / 2, y: (e1.source.y + e1.target.y) / 2 };
        const m2 = { x: (e2.source.x + e2.target.x) / 2, y: (e2.source.y + e2.target.y) / 2 };
        const dist = Math.sqrt((m1.x - m2.x) ** 2 + (m1.y - m2.y) ** 2);
        const posCompat = lavg / (lavg + dist);

        compatMatrix[i][j] = lengthCompat * angleCompat * posCompat;
      }
    }
  }

  reportProgress(0.3);

  // Iterative bundling
  for (let iter = 0; iter < iterations; iter++) {
    if (isCancelled) break;

    const stepSize = 0.04 * (1 - iter / iterations);

    for (let i = 0; i < edgePoints.length; i++) {
      const e1 = edgePoints[i];

      for (let p = 1; p < e1.points.length - 1; p++) {
        const point = e1.points[p];
        let fx = 0,
          fy = 0;

        // Spring force
        const prev = e1.points[p - 1];
        const next = e1.points[p + 1];
        fx += 0.1 * (prev.x + next.x - 2 * point.x);
        fy += 0.1 * (prev.y + next.y - 2 * point.y);

        // Electrostatic force
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

    if (iter % 10 === 0) {
      reportProgress(0.3 + (iter / iterations) * 0.6);
    }
  }

  reportProgress(1);

  return edgePoints.map(({ edge, points }) => ({
    ...edge,
    controlPoints: points.map((p) => ({ x: p.x, y: p.y })),
  }));
}

// ============================================================================
// Path Finding Implementation
// ============================================================================

function dijkstraPathWorker(
  nodes: WorkerGraphNode[],
  edges: WorkerGraphEdge[],
  sourceId: string,
  targetId: string,
  reportProgress: (progress: number) => void
): { path: string[]; distance: number; edges: string[] } | null {
  const nodeMap = new Map<string, { distance: number; previous: string | null; previousEdge: string | null }>();
  const adjacency = new Map<string, Array<{ nodeId: string; edgeId: string; weight: number }>>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      distance: node.id === sourceId ? 0 : Infinity,
      previous: null,
      previousEdge: null,
    });
    adjacency.set(node.id, []);
  });

  edges.forEach((edge) => {
    const weight = edge.weight ?? 1;
    adjacency.get(edge.source)?.push({ nodeId: edge.target, edgeId: edge.id, weight });
    adjacency.get(edge.target)?.push({ nodeId: edge.source, edgeId: edge.id, weight });
  });

  reportProgress(0.2);

  // Simple priority queue
  const unvisited = new Set(nodes.map((n) => n.id));
  let processed = 0;

  while (unvisited.size > 0) {
    if (isCancelled) return null;

    // Find minimum distance node
    let minDist = Infinity;
    let current: string | null = null;

    unvisited.forEach((id) => {
      const dist = nodeMap.get(id)!.distance;
      if (dist < minDist) {
        minDist = dist;
        current = id;
      }
    });

    if (current === null || minDist === Infinity) break;
    if (current === targetId) break;

    unvisited.delete(current);
    processed++;

    const currentNode = nodeMap.get(current)!;
    const neighbors = adjacency.get(current) ?? [];

    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.nodeId)) continue;

      const alt = currentNode.distance + neighbor.weight;
      const neighborNode = nodeMap.get(neighbor.nodeId)!;

      if (alt < neighborNode.distance) {
        neighborNode.distance = alt;
        neighborNode.previous = current;
        neighborNode.previousEdge = neighbor.edgeId;
      }
    }

    if (processed % 50 === 0) {
      reportProgress(0.2 + (processed / nodes.length) * 0.6);
    }
  }

  reportProgress(0.9);

  // Reconstruct path
  const targetNode = nodeMap.get(targetId);
  if (!targetNode || targetNode.distance === Infinity) {
    reportProgress(1);
    return null;
  }

  const path: string[] = [];
  const pathEdges: string[] = [];
  let curr: string | null = targetId;

  while (curr) {
    path.unshift(curr);
    const pathNodeEntry: { distance: number; previous: string | null; previousEdge: string | null } = nodeMap.get(curr)!;
    if (pathNodeEntry.previousEdge) pathEdges.unshift(pathNodeEntry.previousEdge);
    curr = pathNodeEntry.previous;
  }

  reportProgress(1);

  return {
    path,
    distance: targetNode.distance,
    edges: pathEdges,
  };
}

// ============================================================================
// Message Handler
// ============================================================================

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, id, data } = event.data;

  if (type === 'cancel') {
    isCancelled = true;
    return;
  }

  currentTaskId = id;
  isCancelled = false;

  const reportProgress = (progress: number) => {
    if (isCancelled) return;
    const response: WorkerResponse = {
      type: 'progress',
      id,
      data: { progress },
    };
    self.postMessage(response);
  };

  try {
    let response: WorkerResponse;

    switch (type) {
      case 'layout': {
        const { nodes = [], edges = [], config = { width: 800, height: 600 }, algorithm = 'force' } = data || {};

        let resultNodes: WorkerGraphNode[];

        switch (algorithm) {
          case 'radial':
            resultNodes = radialLayoutWorker(nodes, edges, config, reportProgress);
            break;
          case 'hierarchical':
            resultNodes = hierarchicalLayoutWorker(nodes, edges, config, reportProgress);
            break;
          case 'force':
          default:
            resultNodes = forceLayoutWorker(nodes, edges, config, reportProgress);
        }

        response = {
          type: 'result',
          id,
          data: { nodes: resultNodes },
        };
        break;
      }

      case 'cluster': {
        const { nodes = [], edges = [], resolution = 1.0 } = data || {};
        const clusters = louvainClusteringWorker(nodes, edges, resolution, reportProgress);

        response = {
          type: 'result',
          id,
          data: { clusters },
        };
        break;
      }

      case 'bundle': {
        const { nodes = [], edges = [], bundleConfig = {} } = data || {};
        const bundledEdges = bundleEdgesWorker(nodes, edges, bundleConfig, reportProgress);

        response = {
          type: 'result',
          id,
          data: { bundledEdges },
        };
        break;
      }

      case 'pathfind': {
        const { nodes = [], edges = [], sourceId, targetId } = data || {};
        if (!sourceId || !targetId) {
          throw new Error('sourceId and targetId are required for pathfinding');
        }

        const path = dijkstraPathWorker(nodes, edges, sourceId, targetId, reportProgress);

        response = {
          type: 'result',
          id,
          data: { path },
        };
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};
