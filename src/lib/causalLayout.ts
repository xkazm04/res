/**
 * Causal Layout Engine
 *
 * Provides layout algorithms for causal chains and Sankey diagrams,
 * including automatic positioning, flow calculations, and impact propagation.
 */

// ============================================================================
// Types
// ============================================================================

export interface CausalNode {
  id: string;
  label: string;
  type: 'cause' | 'effect' | 'mediator' | 'moderator';
  weight: number; // 0-1 importance/magnitude
  confidence: number; // 0-1 confidence in this node
  x?: number;
  y?: number;
  column?: number;
  row?: number;
  metadata?: Record<string, unknown>;
}

export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // 0-1 strength of relationship
  confidence: number; // 0-1 confidence in this edge
  type: 'direct' | 'indirect' | 'bidirectional' | 'conditional';
  label?: string;
  controlPoints?: Array<{ x: number; y: number }>;
}

export interface CausalChain {
  id: string;
  name: string;
  nodes: CausalNode[];
  edges: CausalEdge[];
  rootNodeIds: string[];
  leafNodeIds: string[];
}

export interface SankeyNode extends CausalNode {
  value: number; // Total flow through this node
  sourceLinks: SankeyLink[];
  targetLinks: SankeyLink[];
  y0?: number; // Top of node
  y1?: number; // Bottom of node
}

export interface SankeyLink {
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  width?: number;
  y0?: number; // Source Y position
  y1?: number; // Target Y position
  confidence: number;
}

export interface LayoutConfig {
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  nodePadding: number;
  columnGap: number;
  rowGap: number;
  iterations?: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  modifications: Array<{
    nodeId?: string;
    edgeId?: string;
    property: 'weight' | 'confidence' | 'value';
    originalValue: number;
    newValue: number;
  }>;
}

export interface PropagationResult {
  nodeId: string;
  originalValue: number;
  newValue: number;
  changePercent: number;
  direction: 'increase' | 'decrease' | 'unchanged';
}

// ============================================================================
// Layout Constants
// ============================================================================

const DEFAULT_CONFIG: LayoutConfig = {
  width: 800,
  height: 600,
  nodeWidth: 150,
  nodeHeight: 60,
  nodePadding: 20,
  columnGap: 200,
  rowGap: 80,
  iterations: 32,
};

// ============================================================================
// Topological Sorting
// ============================================================================

/**
 * Topologically sort nodes to determine column order
 */
export function topologicalSort(chain: CausalChain): string[][] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  chain.nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });

  // Build adjacency and count in-degrees
  chain.edges.forEach((edge) => {
    const targets = adjacency.get(edge.source) || [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // BFS for level assignment
  const levels: string[][] = [];
  let currentLevel = chain.nodes
    .filter((n) => (inDegree.get(n.id) || 0) === 0)
    .map((n) => n.id);

  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    const nextLevel: string[] = [];

    currentLevel.forEach((nodeId) => {
      const targets = adjacency.get(nodeId) || [];
      targets.forEach((targetId) => {
        const newDegree = (inDegree.get(targetId) || 0) - 1;
        inDegree.set(targetId, newDegree);
        if (newDegree === 0 && !nextLevel.includes(targetId)) {
          nextLevel.push(targetId);
        }
      });
    });

    currentLevel = nextLevel;
  }

  return levels;
}

// ============================================================================
// Hierarchical Layout
// ============================================================================

/**
 * Calculate hierarchical layout for causal chain
 */
export function calculateHierarchicalLayout(
  chain: CausalChain,
  config: Partial<LayoutConfig> = {}
): CausalChain {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const levels = topologicalSort(chain);

  if (levels.length === 0) return chain;

  // Assign columns and initial rows
  const nodeMap = new Map(chain.nodes.map((n) => [n.id, { ...n }]));

  levels.forEach((level, column) => {
    level.forEach((nodeId, row) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.column = column;
        node.row = row;
        node.x = cfg.nodePadding + column * (cfg.nodeWidth + cfg.columnGap);
        node.y = cfg.nodePadding + row * (cfg.nodeHeight + cfg.rowGap);
      }
    });
  });

  // Minimize edge crossings with barycenter method
  for (let iter = 0; iter < (cfg.iterations || 32); iter++) {
    // Forward pass
    for (let col = 1; col < levels.length; col++) {
      sortByBarycenter(levels[col], levels[col - 1], chain.edges, nodeMap, 'backward');
    }
    // Backward pass
    for (let col = levels.length - 2; col >= 0; col--) {
      sortByBarycenter(levels[col], levels[col + 1], chain.edges, nodeMap, 'forward');
    }
  }

  // Final position assignment
  levels.forEach((level, column) => {
    level.forEach((nodeId, row) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.row = row;
        node.y = cfg.nodePadding + row * (cfg.nodeHeight + cfg.rowGap);
      }
    });
  });

  // Center vertically
  const maxRows = Math.max(...levels.map((l) => l.length));
  const totalHeight = maxRows * (cfg.nodeHeight + cfg.rowGap);
  const yOffset = (cfg.height - totalHeight) / 2;

  nodeMap.forEach((node) => {
    if (node.y !== undefined) {
      node.y += Math.max(0, yOffset);
    }
  });

  return {
    ...chain,
    nodes: Array.from(nodeMap.values()),
  };
}

function sortByBarycenter(
  currentLevel: string[],
  adjacentLevel: string[],
  edges: CausalEdge[],
  nodeMap: Map<string, CausalNode>,
  direction: 'forward' | 'backward'
): void {
  const barycenters = new Map<string, number>();

  currentLevel.forEach((nodeId) => {
    const connectedNodes = edges
      .filter((e) =>
        direction === 'forward'
          ? e.source === nodeId && adjacentLevel.includes(e.target)
          : e.target === nodeId && adjacentLevel.includes(e.source)
      )
      .map((e) => (direction === 'forward' ? e.target : e.source));

    if (connectedNodes.length > 0) {
      const positions = connectedNodes.map((id) => adjacentLevel.indexOf(id));
      const avg = positions.reduce((a, b) => a + b, 0) / positions.length;
      barycenters.set(nodeId, avg);
    } else {
      barycenters.set(nodeId, currentLevel.indexOf(nodeId));
    }
  });

  currentLevel.sort((a, b) => (barycenters.get(a) || 0) - (barycenters.get(b) || 0));
}

// ============================================================================
// Sankey Layout
// ============================================================================

/**
 * Calculate Sankey diagram layout
 */
export function calculateSankeyLayout(
  chain: CausalChain,
  config: Partial<LayoutConfig> = {}
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const levels = topologicalSort(chain);

  if (levels.length === 0) {
    return { nodes: [], links: [] };
  }

  // Create Sankey nodes with initial values
  const sankeyNodes = new Map<string, SankeyNode>();
  chain.nodes.forEach((node) => {
    sankeyNodes.set(node.id, {
      ...node,
      value: node.weight,
      sourceLinks: [],
      targetLinks: [],
    });
  });

  // Create links and calculate flow values
  const links: SankeyLink[] = chain.edges.map((edge) => {
    const source = sankeyNodes.get(edge.source)!;
    const target = sankeyNodes.get(edge.target)!;
    const value = edge.weight * Math.min(source.weight, target.weight);

    return {
      source,
      target,
      value,
      confidence: edge.confidence,
    };
  });

  // Assign links to nodes
  links.forEach((link) => {
    link.source.sourceLinks.push(link);
    link.target.targetLinks.push(link);
  });

  // Calculate node values from flows
  sankeyNodes.forEach((node) => {
    const inFlow = node.targetLinks.reduce((sum, l) => sum + l.value, 0);
    const outFlow = node.sourceLinks.reduce((sum, l) => sum + l.value, 0);
    node.value = Math.max(inFlow, outFlow, node.weight * 0.5);
  });

  // Position nodes horizontally
  const columnWidth = (cfg.width - cfg.nodePadding * 2) / levels.length;

  levels.forEach((level, col) => {
    level.forEach((nodeId) => {
      const node = sankeyNodes.get(nodeId);
      if (node) {
        node.column = col;
        node.x = cfg.nodePadding + col * columnWidth + columnWidth / 2 - cfg.nodeWidth / 2;
      }
    });
  });

  // Position nodes vertically within columns (proportional to value)
  levels.forEach((level) => {
    const levelNodes = level.map((id) => sankeyNodes.get(id)!);
    const totalValue = levelNodes.reduce((sum, n) => sum + n.value, 0);
    const availableHeight = cfg.height - cfg.nodePadding * 2 - cfg.rowGap * (level.length - 1);

    let currentY = cfg.nodePadding;
    levelNodes.forEach((node) => {
      const nodeHeight = Math.max(
        cfg.nodeHeight * 0.5,
        (node.value / totalValue) * availableHeight
      );
      node.y0 = currentY;
      node.y1 = currentY + nodeHeight;
      node.y = currentY + nodeHeight / 2;
      currentY += nodeHeight + cfg.rowGap;
    });
  });

  // Calculate link positions
  sankeyNodes.forEach((node) => {
    // Sort links by target/source position
    node.sourceLinks.sort((a, b) => (a.target.y || 0) - (b.target.y || 0));
    node.targetLinks.sort((a, b) => (a.source.y || 0) - (b.source.y || 0));

    // Assign vertical positions for outgoing links
    let sy = node.y0 || 0;
    const nodeHeight = (node.y1 || 0) - (node.y0 || 0);
    const totalOutValue = node.sourceLinks.reduce((sum, l) => sum + l.value, 0);

    node.sourceLinks.forEach((link) => {
      link.width = (link.value / totalOutValue) * nodeHeight;
      link.y0 = sy + link.width / 2;
      sy += link.width;
    });

    // Assign vertical positions for incoming links
    let ty = node.y0 || 0;
    const totalInValue = node.targetLinks.reduce((sum, l) => sum + l.value, 0);

    node.targetLinks.forEach((link) => {
      link.width = (link.value / totalInValue) * nodeHeight;
      link.y1 = ty + link.width / 2;
      ty += link.width;
    });
  });

  return {
    nodes: Array.from(sankeyNodes.values()),
    links,
  };
}

// ============================================================================
// Sankey Path Generation
// ============================================================================

/**
 * Generate SVG path for a Sankey link
 */
export function generateSankeyPath(link: SankeyLink, nodeWidth: number): string {
  const sourceX = (link.source.x || 0) + nodeWidth;
  const targetX = link.target.x || 0;
  const sourceY = link.y0 || 0;
  const targetY = link.y1 || 0;

  const curvature = 0.5;
  const xi = (targetX - sourceX) * curvature;

  return `M${sourceX},${sourceY}
          C${sourceX + xi},${sourceY}
           ${targetX - xi},${targetY}
           ${targetX},${targetY}`;
}

// ============================================================================
// Impact Propagation
// ============================================================================

/**
 * Calculate impact propagation through the causal chain
 */
export function calculateImpactPropagation(
  chain: CausalChain,
  modifiedNodeId: string,
  changePercent: number
): PropagationResult[] {
  const results: PropagationResult[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(chain.nodes.map((n) => [n.id, n]));

  // Build adjacency for forward propagation
  const forwardEdges = new Map<string, CausalEdge[]>();
  chain.edges.forEach((edge) => {
    const edges = forwardEdges.get(edge.source) || [];
    edges.push(edge);
    forwardEdges.set(edge.source, edges);
  });

  // BFS propagation
  const queue: Array<{ nodeId: string; impact: number; depth: number }> = [
    { nodeId: modifiedNodeId, impact: changePercent, depth: 0 },
  ];

  while (queue.length > 0) {
    const { nodeId, impact, depth } = queue.shift()!;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    // Calculate new value based on impact
    const dampening = Math.pow(0.85, depth); // Impact decreases with distance
    const effectiveImpact = impact * dampening;
    const newValue = node.weight * (1 + effectiveImpact / 100);

    results.push({
      nodeId,
      originalValue: node.weight,
      newValue,
      changePercent: effectiveImpact,
      direction:
        effectiveImpact > 1 ? 'increase' : effectiveImpact < -1 ? 'decrease' : 'unchanged',
    });

    // Propagate to downstream nodes
    const edges = forwardEdges.get(nodeId) || [];
    edges.forEach((edge) => {
      if (!visited.has(edge.target)) {
        // Impact is weighted by edge strength and confidence
        const propagatedImpact = effectiveImpact * edge.weight * edge.confidence;
        queue.push({
          nodeId: edge.target,
          impact: propagatedImpact,
          depth: depth + 1,
        });
      }
    });
  }

  return results;
}

// ============================================================================
// What-If Analysis
// ============================================================================

/**
 * Apply a what-if scenario to the chain and calculate results
 */
export function applyWhatIfScenario(
  chain: CausalChain,
  scenario: WhatIfScenario
): {
  modifiedChain: CausalChain;
  propagations: PropagationResult[];
} {
  // Deep clone the chain
  const modifiedChain: CausalChain = {
    ...chain,
    nodes: chain.nodes.map((n) => ({ ...n })),
    edges: chain.edges.map((e) => ({ ...e })),
  };

  const allPropagations: PropagationResult[] = [];

  // Apply each modification
  scenario.modifications.forEach((mod) => {
    if (mod.nodeId) {
      const nodeIndex = modifiedChain.nodes.findIndex((n) => n.id === mod.nodeId);
      if (nodeIndex >= 0) {
        const node = modifiedChain.nodes[nodeIndex];
        const originalValue = mod.property === 'weight' ? node.weight : node.confidence;

        // Update the node property
        if (mod.property === 'weight') {
          modifiedChain.nodes[nodeIndex] = { ...node, weight: mod.newValue };
        } else if (mod.property === 'confidence') {
          modifiedChain.nodes[nodeIndex] = { ...node, confidence: mod.newValue };
        }

        // Calculate propagation for this change
        const changePercent = ((mod.newValue - originalValue) / originalValue) * 100;
        const propagations = calculateImpactPropagation(
          modifiedChain,
          mod.nodeId,
          changePercent
        );
        allPropagations.push(...propagations);
      }
    }

    if (mod.edgeId) {
      const edgeIndex = modifiedChain.edges.findIndex((e) => e.id === mod.edgeId);
      if (edgeIndex >= 0) {
        const edge = modifiedChain.edges[edgeIndex];
        if (mod.property === 'weight') {
          modifiedChain.edges[edgeIndex] = { ...edge, weight: mod.newValue };
        } else if (mod.property === 'confidence') {
          modifiedChain.edges[edgeIndex] = { ...edge, confidence: mod.newValue };
        }
      }
    }
  });

  // Deduplicate propagations, keeping max impact
  const propagationMap = new Map<string, PropagationResult>();
  allPropagations.forEach((p) => {
    const existing = propagationMap.get(p.nodeId);
    if (!existing || Math.abs(p.changePercent) > Math.abs(existing.changePercent)) {
      propagationMap.set(p.nodeId, p);
    }
  });

  return {
    modifiedChain,
    propagations: Array.from(propagationMap.values()),
  };
}

// ============================================================================
// Chain Comparison
// ============================================================================

export interface ChainDifference {
  type: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'edge_modified';
  elementId: string;
  originalValue?: unknown;
  newValue?: unknown;
  property?: string;
}

/**
 * Compare two causal chains and identify differences
 */
export function compareChains(
  chainA: CausalChain,
  chainB: CausalChain
): ChainDifference[] {
  const differences: ChainDifference[] = [];

  const nodesA = new Map(chainA.nodes.map((n) => [n.id, n]));
  const nodesB = new Map(chainB.nodes.map((n) => [n.id, n]));
  const edgesA = new Map(chainA.edges.map((e) => [e.id, e]));
  const edgesB = new Map(chainB.edges.map((e) => [e.id, e]));

  // Check nodes
  nodesA.forEach((nodeA, id) => {
    const nodeB = nodesB.get(id);
    if (!nodeB) {
      differences.push({ type: 'node_removed', elementId: id });
    } else {
      // Compare properties
      if (nodeA.weight !== nodeB.weight) {
        differences.push({
          type: 'node_modified',
          elementId: id,
          property: 'weight',
          originalValue: nodeA.weight,
          newValue: nodeB.weight,
        });
      }
      if (nodeA.confidence !== nodeB.confidence) {
        differences.push({
          type: 'node_modified',
          elementId: id,
          property: 'confidence',
          originalValue: nodeA.confidence,
          newValue: nodeB.confidence,
        });
      }
    }
  });

  nodesB.forEach((_, id) => {
    if (!nodesA.has(id)) {
      differences.push({ type: 'node_added', elementId: id });
    }
  });

  // Check edges
  edgesA.forEach((edgeA, id) => {
    const edgeB = edgesB.get(id);
    if (!edgeB) {
      differences.push({ type: 'edge_removed', elementId: id });
    } else {
      if (edgeA.weight !== edgeB.weight) {
        differences.push({
          type: 'edge_modified',
          elementId: id,
          property: 'weight',
          originalValue: edgeA.weight,
          newValue: edgeB.weight,
        });
      }
    }
  });

  edgesB.forEach((_, id) => {
    if (!edgesA.has(id)) {
      differences.push({ type: 'edge_added', elementId: id });
    }
  });

  return differences;
}

// ============================================================================
// Edge Path Utilities
// ============================================================================

/**
 * Generate curved edge path between two nodes
 */
export function generateEdgePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  curveStrength: number = 0.5
): string {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  // Control points for bezier curve
  const cx1 = sourceX + dx * curveStrength;
  const cy1 = sourceY;
  const cx2 = targetX - dx * curveStrength;
  const cy2 = targetY;

  return `M ${sourceX} ${sourceY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX} ${targetY}`;
}

/**
 * Calculate arrow head points
 */
export function calculateArrowHead(
  x: number,
  y: number,
  angle: number,
  size: number = 10
): string {
  const angle1 = angle + Math.PI * 0.8;
  const angle2 = angle - Math.PI * 0.8;

  const x1 = x + Math.cos(angle1) * size;
  const y1 = y + Math.sin(angle1) * size;
  const x2 = x + Math.cos(angle2) * size;
  const y2 = y + Math.sin(angle2) * size;

  return `M ${x} ${y} L ${x1} ${y1} L ${x2} ${y2} Z`;
}

// ============================================================================
// Auto Layout Utilities
// ============================================================================

/**
 * Find optimal node positions to minimize edge crossings
 */
export function optimizeLayout(
  chain: CausalChain,
  iterations: number = 50
): CausalChain {
  let currentChain = calculateHierarchicalLayout(chain, { iterations: 0 });
  let bestCrossings = countEdgeCrossings(currentChain);

  for (let i = 0; i < iterations; i++) {
    const candidateChain = calculateHierarchicalLayout(chain, { iterations: i + 1 });
    const crossings = countEdgeCrossings(candidateChain);

    if (crossings < bestCrossings) {
      currentChain = candidateChain;
      bestCrossings = crossings;
    }

    // Early termination if no crossings
    if (bestCrossings === 0) break;
  }

  return currentChain;
}

function countEdgeCrossings(chain: CausalChain): number {
  let crossings = 0;
  const edges = chain.edges;
  const nodeMap = new Map(chain.nodes.map((n) => [n.id, n]));

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];

      const s1 = nodeMap.get(e1.source);
      const t1 = nodeMap.get(e1.target);
      const s2 = nodeMap.get(e2.source);
      const t2 = nodeMap.get(e2.target);

      if (!s1 || !t1 || !s2 || !t2) continue;

      // Check if edges are in adjacent columns
      if (s1.column === s2.column && t1.column === t2.column) {
        // Check for crossing
        const s1Row = s1.row ?? 0;
        const t1Row = t1.row ?? 0;
        const s2Row = s2.row ?? 0;
        const t2Row = t2.row ?? 0;

        if ((s1Row < s2Row && t1Row > t2Row) || (s1Row > s2Row && t1Row < t2Row)) {
          crossings++;
        }
      }
    }
  }

  return crossings;
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Export chain as JSON for sharing
 */
export function exportChainAsJSON(chain: CausalChain): string {
  return JSON.stringify(
    {
      ...chain,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    null,
    2
  );
}

/**
 * Import chain from JSON
 */
export function importChainFromJSON(json: string): CausalChain | null {
  try {
    const data = JSON.parse(json);
    if (!data.nodes || !data.edges) return null;
    return {
      id: data.id || `imported-${Date.now()}`,
      name: data.name || 'Imported Chain',
      nodes: data.nodes,
      edges: data.edges,
      rootNodeIds: data.rootNodeIds || [],
      leafNodeIds: data.leafNodeIds || [],
    };
  } catch {
    return null;
  }
}
