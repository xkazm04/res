/**
 * useForceGraph Hook
 *
 * Provides state management and interaction handling for the advanced network graph.
 * Integrates with the Web Worker for heavy computations.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  GraphNode,
  GraphEdge,
  Cluster,
  PathResult,
  BundledEdge,
  LayoutConfig,
} from '@/src/lib/graphAlgorithms';

// ============================================================================
// Types
// ============================================================================

export type LayoutAlgorithm = 'force' | 'radial' | 'hierarchical';

export interface GraphViewState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface GraphSelection {
  nodes: Set<string>;
  edges: Set<string>;
}

export interface GraphFilter {
  nodeTypes: Set<string>;
  edgeTypes: Set<string>;
  minConfidence: number;
  minConnections: number;
  searchQuery: string;
}

export interface UseForceGraphOptions {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  initialLayout?: LayoutAlgorithm;
  enableClustering?: boolean;
  enableEdgeBundling?: boolean;
  clusterResolution?: number;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  onClusterClick?: (cluster: Cluster) => void;
  onSelectionChange?: (selection: GraphSelection) => void;
}

export interface UseForceGraphReturn {
  // Layout state
  layoutNodes: GraphNode[];
  clusters: Cluster[];
  bundledEdges: BundledEdge[];
  currentPath: PathResult | null;
  layoutProgress: number;
  isComputing: boolean;

  // View state
  viewState: GraphViewState;
  setViewState: (state: GraphViewState) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToView: () => void;
  resetView: () => void;

  // Selection
  selection: GraphSelection;
  selectNode: (nodeId: string, additive?: boolean) => void;
  selectEdge: (edgeId: string, additive?: boolean) => void;
  selectCluster: (clusterId: string) => void;
  clearSelection: () => void;
  selectNeighbors: (nodeId: string, hops?: number) => void;

  // Filtering
  filter: GraphFilter;
  setFilter: (filter: Partial<GraphFilter>) => void;
  filteredNodes: GraphNode[];
  filteredEdges: GraphEdge[];
  matchingNodeIds: Set<string>;

  // Layout operations
  currentLayout: LayoutAlgorithm;
  setLayout: (algorithm: LayoutAlgorithm) => void;
  runLayout: () => void;
  runClustering: () => void;
  runEdgeBundling: () => void;

  // Path finding
  findPath: (sourceId: string, targetId: string) => void;
  clearPath: () => void;

  // Node interactions
  dragNode: (nodeId: string, x: number, y: number) => void;
  pinNode: (nodeId: string, pinned: boolean) => void;
  highlightNode: (nodeId: string | null) => void;
  highlightedNode: string | null;

  // Search
  searchNodes: (query: string) => GraphNode[];

  // Export
  getGraphData: () => { nodes: GraphNode[]; edges: GraphEdge[] };
  getVisibleBounds: () => { x: number; y: number; width: number; height: number };
}

// ============================================================================
// Worker Communication
// ============================================================================

type WorkerCallback = (data: unknown) => void;

interface WorkerManager {
  worker: Worker | null;
  pendingCallbacks: Map<string, WorkerCallback>;
  progressCallbacks: Map<string, (progress: number) => void>;
  nextId: number;
}

function createWorkerManager(): WorkerManager {
  return {
    worker: null,
    pendingCallbacks: new Map(),
    progressCallbacks: new Map(),
    nextId: 0,
  };
}

function getWorker(manager: WorkerManager): Worker | null {
  if (typeof window === 'undefined') return null;

  if (!manager.worker) {
    try {
      manager.worker = new Worker(
        new URL('../workers/graphLayout.worker.ts', import.meta.url),
        { type: 'module' }
      );

      manager.worker.onmessage = (event) => {
        const { type, id, data, error } = event.data;

        if (type === 'progress') {
          const progressCb = manager.progressCallbacks.get(id);
          progressCb?.(data?.progress ?? 0);
        } else if (type === 'result') {
          const callback = manager.pendingCallbacks.get(id);
          callback?.(data);
          manager.pendingCallbacks.delete(id);
          manager.progressCallbacks.delete(id);
        } else if (type === 'error') {
          console.error('Worker error:', error);
          manager.pendingCallbacks.delete(id);
          manager.progressCallbacks.delete(id);
        }
      };
    } catch (e) {
      console.warn('Web Worker not available, falling back to main thread', e);
      return null;
    }
  }

  return manager.worker;
}

function postToWorker(
  manager: WorkerManager,
  message: Record<string, unknown>,
  onResult: WorkerCallback,
  onProgress?: (progress: number) => void
): string {
  const id = `task-${manager.nextId++}`;
  manager.pendingCallbacks.set(id, onResult);
  if (onProgress) {
    manager.progressCallbacks.set(id, onProgress);
  }

  const worker = getWorker(manager);
  if (worker) {
    worker.postMessage({ ...message, id });
  }

  return id;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useForceGraph(options: UseForceGraphOptions): UseForceGraphReturn {
  const {
    nodes,
    edges,
    width,
    height,
    initialLayout = 'force',
    enableClustering = true,
    enableEdgeBundling = false,
    clusterResolution = 1.0,
    onNodeClick,
    onEdgeClick,
    onClusterClick,
    onSelectionChange,
  } = options;

  // Worker manager
  const workerRef = useRef<WorkerManager>(createWorkerManager());

  // Layout state
  const [layoutNodes, setLayoutNodes] = useState<GraphNode[]>(nodes);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [bundledEdges, setBundledEdges] = useState<BundledEdge[]>([]);
  const [currentPath, setCurrentPath] = useState<PathResult | null>(null);
  const [layoutProgress, setLayoutProgress] = useState(0);
  const [isComputing, setIsComputing] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutAlgorithm>(initialLayout);

  // View state
  const [viewState, setViewState] = useState<GraphViewState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  // Selection state
  const [selection, setSelection] = useState<GraphSelection>({
    nodes: new Set(),
    edges: new Set(),
  });

  // Filter state
  const [filter, setFilterState] = useState<GraphFilter>({
    nodeTypes: new Set(),
    edgeTypes: new Set(),
    minConfidence: 0,
    minConnections: 0,
    searchQuery: '',
  });

  // Highlighted node
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  // Computed adjacency map
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    nodes.forEach((n) => map.set(n.id, new Set()));
    edges.forEach((e) => {
      map.get(e.source)?.add(e.target);
      map.get(e.target)?.add(e.source);
    });
    return map;
  }, [nodes, edges]);

  // Node degree map
  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((n) => map.set(n.id, 0));
    edges.forEach((e) => {
      map.set(e.source, (map.get(e.source) ?? 0) + 1);
      map.set(e.target, (map.get(e.target) ?? 0) + 1);
    });
    return map;
  }, [nodes, edges]);

  // Filtered nodes and edges
  const { filteredNodes, filteredEdges, matchingNodeIds } = useMemo(() => {
    let filtered = nodes;
    const matchIds = new Set<string>();

    // Filter by type
    if (filter.nodeTypes.size > 0) {
      filtered = filtered.filter((n) =>
        n.type ? filter.nodeTypes.has(n.type) : true
      );
    }

    // Filter by connections
    if (filter.minConnections > 0) {
      filtered = filtered.filter(
        (n) => (degreeMap.get(n.id) ?? 0) >= filter.minConnections
      );
    }

    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter((n) => {
        const matches =
          n.id.toLowerCase().includes(query) ||
          n.label?.toLowerCase().includes(query);
        if (matches) matchIds.add(n.id);
        return matches;
      });
    }

    const nodeIdSet = new Set(filtered.map((n) => n.id));

    // Filter edges to only include visible nodes
    let filteredEdgeList = edges.filter(
      (e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)
    );

    if (filter.edgeTypes.size > 0) {
      filteredEdgeList = filteredEdgeList.filter((e) =>
        e.type ? filter.edgeTypes.has(e.type) : true
      );
    }

    return {
      filteredNodes: filtered,
      filteredEdges: filteredEdgeList,
      matchingNodeIds: matchIds,
    };
  }, [nodes, edges, filter, degreeMap]);

  // Run layout computation
  const runLayout = useCallback(() => {
    setIsComputing(true);
    setLayoutProgress(0);

    const config: LayoutConfig = {
      width,
      height,
      padding: 60,
      iterations: 100,
      repulsion: 1500,
      attraction: 0.015,
      damping: 0.85,
      centerGravity: 0.03,
    };

    const worker = getWorker(workerRef.current);

    if (worker) {
      postToWorker(
        workerRef.current,
        {
          type: 'layout',
          data: {
            nodes: filteredNodes,
            edges: filteredEdges,
            config,
            algorithm: currentLayout,
          },
        },
        (result: unknown) => {
          const data = result as { nodes?: GraphNode[] };
          if (data.nodes) {
            setLayoutNodes(data.nodes);
          }
          setIsComputing(false);
          setLayoutProgress(1);
        },
        setLayoutProgress
      );
    } else {
      // Fallback: main thread computation (simplified)
      import('@/src/lib/graphAlgorithms').then(
        ({ forceLayout, radialLayout, hierarchicalLayout }) => {
          let resultNodes: GraphNode[];

          switch (currentLayout) {
            case 'radial':
              resultNodes = radialLayout(filteredNodes, filteredEdges, config);
              break;
            case 'hierarchical':
              resultNodes = hierarchicalLayout(filteredNodes, filteredEdges, config);
              break;
            default:
              resultNodes = forceLayout(filteredNodes, filteredEdges, config);
          }

          setLayoutNodes(resultNodes);
          setIsComputing(false);
          setLayoutProgress(1);
        }
      );
    }
  }, [filteredNodes, filteredEdges, width, height, currentLayout]);

  // Run clustering
  const runClustering = useCallback(() => {
    if (!enableClustering) return;

    setIsComputing(true);

    const worker = getWorker(workerRef.current);

    if (worker) {
      postToWorker(
        workerRef.current,
        {
          type: 'cluster',
          data: {
            nodes: layoutNodes,
            edges: filteredEdges,
            resolution: clusterResolution,
          },
        },
        (result: unknown) => {
          const data = result as { clusters?: Cluster[] };
          if (data.clusters) {
            setClusters(data.clusters);
          }
          setIsComputing(false);
        },
        setLayoutProgress
      );
    } else {
      import('@/src/lib/graphAlgorithms').then(({ louvainClustering }) => {
        const result = louvainClustering(
          layoutNodes,
          filteredEdges,
          clusterResolution
        );
        setClusters(result);
        setIsComputing(false);
      });
    }
  }, [layoutNodes, filteredEdges, clusterResolution, enableClustering]);

  // Run edge bundling
  const runEdgeBundling = useCallback(() => {
    if (!enableEdgeBundling) return;

    setIsComputing(true);

    const worker = getWorker(workerRef.current);

    if (worker) {
      postToWorker(
        workerRef.current,
        {
          type: 'bundle',
          data: {
            nodes: layoutNodes,
            edges: filteredEdges,
            bundleConfig: {
              subdivisions: 6,
              iterations: 40,
              compatibility: 0.65,
            },
          },
        },
        (result: unknown) => {
          const data = result as { bundledEdges?: BundledEdge[] };
          if (data.bundledEdges) {
            setBundledEdges(data.bundledEdges);
          }
          setIsComputing(false);
        },
        setLayoutProgress
      );
    } else {
      import('@/src/lib/graphAlgorithms').then(({ bundleEdges }) => {
        const result = bundleEdges(layoutNodes, filteredEdges, {
          subdivisions: 6,
          iterations: 40,
          compatibility: 0.65,
        });
        setBundledEdges(result);
        setIsComputing(false);
      });
    }
  }, [layoutNodes, filteredEdges, enableEdgeBundling]);

  // Path finding
  const findPath = useCallback(
    (sourceId: string, targetId: string) => {
      setIsComputing(true);

      const worker = getWorker(workerRef.current);

      if (worker) {
        postToWorker(
          workerRef.current,
          {
            type: 'pathfind',
            data: {
              nodes: layoutNodes,
              edges: filteredEdges,
              sourceId,
              targetId,
            },
          },
          (result: unknown) => {
            const data = result as { path?: PathResult | null };
            setCurrentPath(data.path ?? null);
            setIsComputing(false);
          }
        );
      } else {
        import('@/src/lib/graphAlgorithms').then(({ dijkstraPath }) => {
          const result = dijkstraPath(layoutNodes, filteredEdges, sourceId, targetId);
          setCurrentPath(result);
          setIsComputing(false);
        });
      }
    },
    [layoutNodes, filteredEdges]
  );

  const clearPath = useCallback(() => {
    setCurrentPath(null);
  }, []);

  // Run initial layout
  useEffect(() => {
    if (nodes.length > 0) {
      runLayout();
    }
  }, [nodes.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Run clustering after layout
  useEffect(() => {
    if (layoutNodes.length > 0 && enableClustering && !isComputing) {
      runClustering();
    }
  }, [layoutNodes, enableClustering]); // eslint-disable-line react-hooks/exhaustive-deps

  // View controls
  const zoomIn = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.25, 5),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.25, 0.1),
    }));
  }, []);

  const fitToView = useCallback(() => {
    if (layoutNodes.length === 0) return;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    layoutNodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });

    const graphWidth = maxX - minX || 100;
    const graphHeight = maxY - minY || 100;
    const zoom = Math.min(
      (width - 80) / graphWidth,
      (height - 80) / graphHeight,
      2
    );

    setViewState({
      zoom,
      panX: -(minX + graphWidth / 2) * zoom + width / 2,
      panY: -(minY + graphHeight / 2) * zoom + height / 2,
    });
  }, [layoutNodes, width, height]);

  const resetView = useCallback(() => {
    setViewState({ zoom: 1, panX: 0, panY: 0 });
  }, []);

  // Selection
  const selectNode = useCallback(
    (nodeId: string, additive = false) => {
      setSelection((prev) => {
        const newNodes = new Set(additive ? prev.nodes : []);
        if (newNodes.has(nodeId)) {
          newNodes.delete(nodeId);
        } else {
          newNodes.add(nodeId);
        }
        const newSelection = { nodes: newNodes, edges: prev.edges };
        onSelectionChange?.(newSelection);
        return newSelection;
      });

      const node = layoutNodes.find((n) => n.id === nodeId);
      if (node) onNodeClick?.(node);
    },
    [layoutNodes, onNodeClick, onSelectionChange]
  );

  const selectEdge = useCallback(
    (edgeId: string, additive = false) => {
      setSelection((prev) => {
        const newEdges = new Set(additive ? prev.edges : []);
        if (newEdges.has(edgeId)) {
          newEdges.delete(edgeId);
        } else {
          newEdges.add(edgeId);
        }
        const newSelection = { nodes: prev.nodes, edges: newEdges };
        onSelectionChange?.(newSelection);
        return newSelection;
      });

      const edge = edges.find((e) => e.id === edgeId);
      if (edge) onEdgeClick?.(edge);
    },
    [edges, onEdgeClick, onSelectionChange]
  );

  const selectCluster = useCallback(
    (clusterId: string) => {
      const cluster = clusters.find((c) => c.id === clusterId);
      if (!cluster) return;

      setSelection((prev) => {
        const newNodes = new Set(cluster.nodes);
        const newSelection = { nodes: newNodes, edges: prev.edges };
        onSelectionChange?.(newSelection);
        return newSelection;
      });

      onClusterClick?.(cluster);
    },
    [clusters, onClusterClick, onSelectionChange]
  );

  const clearSelection = useCallback(() => {
    setSelection({ nodes: new Set(), edges: new Set() });
    onSelectionChange?.({ nodes: new Set(), edges: new Set() });
  }, [onSelectionChange]);

  const selectNeighbors = useCallback(
    (nodeId: string, hops = 1) => {
      const result = new Set<string>([nodeId]);
      let frontier = new Set([nodeId]);

      for (let i = 0; i < hops; i++) {
        const newFrontier = new Set<string>();
        frontier.forEach((id) => {
          adjacencyMap.get(id)?.forEach((neighbor) => {
            if (!result.has(neighbor)) {
              result.add(neighbor);
              newFrontier.add(neighbor);
            }
          });
        });
        frontier = newFrontier;
      }

      setSelection((prev) => {
        const newSelection = { nodes: result, edges: prev.edges };
        onSelectionChange?.(newSelection);
        return newSelection;
      });
    },
    [adjacencyMap, onSelectionChange]
  );

  // Filter
  const setFilter = useCallback((update: Partial<GraphFilter>) => {
    setFilterState((prev) => ({ ...prev, ...update }));
  }, []);

  // Layout control
  const setLayout = useCallback(
    (algorithm: LayoutAlgorithm) => {
      setCurrentLayout(algorithm);
      // Layout will be rerun via effect
    },
    []
  );

  // Node interactions
  const dragNode = useCallback((nodeId: string, x: number, y: number) => {
    setLayoutNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x, y, fixed: true } : n))
    );
  }, []);

  const pinNode = useCallback((nodeId: string, pinned: boolean) => {
    setLayoutNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, fixed: pinned } : n))
    );
  }, []);

  const highlightNode = useCallback((nodeId: string | null) => {
    setHighlightedNode(nodeId);
  }, []);

  // Search
  const searchNodes = useCallback(
    (query: string): GraphNode[] => {
      if (!query) return [];
      const q = query.toLowerCase();
      return layoutNodes.filter(
        (n) =>
          n.id.toLowerCase().includes(q) || n.label?.toLowerCase().includes(q)
      );
    },
    [layoutNodes]
  );

  // Export
  const getGraphData = useCallback(() => {
    return { nodes: layoutNodes, edges: filteredEdges };
  }, [layoutNodes, filteredEdges]);

  const getVisibleBounds = useCallback(() => {
    const { zoom, panX, panY } = viewState;
    return {
      x: -panX / zoom,
      y: -panY / zoom,
      width: width / zoom,
      height: height / zoom,
    };
  }, [viewState, width, height]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current.worker?.terminate();
    };
  }, []);

  return {
    // Layout state
    layoutNodes,
    clusters,
    bundledEdges,
    currentPath,
    layoutProgress,
    isComputing,

    // View state
    viewState,
    setViewState,
    zoomIn,
    zoomOut,
    fitToView,
    resetView,

    // Selection
    selection,
    selectNode,
    selectEdge,
    selectCluster,
    clearSelection,
    selectNeighbors,

    // Filtering
    filter,
    setFilter,
    filteredNodes,
    filteredEdges,
    matchingNodeIds,

    // Layout operations
    currentLayout,
    setLayout,
    runLayout,
    runClustering,
    runEdgeBundling,

    // Path finding
    findPath,
    clearPath,

    // Node interactions
    dragNode,
    pinNode,
    highlightNode,
    highlightedNode,

    // Search
    searchNodes,

    // Export
    getGraphData,
    getVisibleBounds,
  };
}
