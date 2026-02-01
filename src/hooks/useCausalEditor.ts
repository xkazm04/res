'use client';

/**
 * useCausalEditor Hook
 *
 * Manages state for the interactive causal chain editor including
 * undo/redo, drag-and-drop, what-if scenarios, and layout updates.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  type CausalChain,
  type CausalNode,
  type CausalEdge,
  type WhatIfScenario,
  type PropagationResult,
  type ChainDifference,
  calculateHierarchicalLayout,
  calculateSankeyLayout,
  applyWhatIfScenario,
  compareChains,
  optimizeLayout,
  exportChainAsJSON,
  importChainFromJSON,
  type SankeyNode,
  type SankeyLink,
} from '@/src/lib/causalLayout';

// ============================================================================
// Types
// ============================================================================

export type ViewMode = 'chain' | 'sankey';
export type EditMode = 'view' | 'edit' | 'compare';

export interface EditorState {
  chain: CausalChain;
  viewMode: ViewMode;
  editMode: EditMode;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  highlightedPath: string[];
  activeScenario: WhatIfScenario | null;
  comparisonChain: CausalChain | null;
  differences: ChainDifference[];
  propagations: PropagationResult[];
  isDirty: boolean;
}

export interface HistoryEntry {
  chain: CausalChain;
  description: string;
  timestamp: number;
}

export interface EditorActions {
  // Selection
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;

  // Node operations
  addNode: (node: Omit<CausalNode, 'x' | 'y' | 'column' | 'row'>) => void;
  updateNode: (nodeId: string, updates: Partial<CausalNode>) => void;
  removeNode: (nodeId: string) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;

  // Edge operations
  addEdge: (edge: Omit<CausalEdge, 'controlPoints'>) => void;
  updateEdge: (edgeId: string, updates: Partial<CausalEdge>) => void;
  removeEdge: (edgeId: string) => void;

  // Drag-and-drop reordering
  reorderNode: (nodeId: string, newIndex: number, column: number) => void;

  // Layout
  recalculateLayout: () => void;
  optimizeLayout: () => void;

  // View modes
  setViewMode: (mode: ViewMode) => void;
  setEditMode: (mode: EditMode) => void;

  // What-if analysis
  createScenario: (name: string) => WhatIfScenario;
  applyScenario: (scenario: WhatIfScenario) => void;
  clearScenario: () => void;
  addModification: (
    scenario: WhatIfScenario,
    modification: WhatIfScenario['modifications'][0]
  ) => WhatIfScenario;

  // Comparison
  setComparisonChain: (chain: CausalChain | null) => void;

  // Path highlighting
  highlightPath: (nodeIds: string[]) => void;
  clearHighlight: () => void;
  findPathBetween: (sourceId: string, targetId: string) => string[];

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Import/Export
  exportChain: () => string;
  importChain: (json: string) => boolean;
  resetChain: (chain: CausalChain) => void;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface UseCausalEditorReturn {
  state: EditorState;
  actions: EditorActions;
  sankeyData: SankeyData | null;
  layoutConfig: {
    width: number;
    height: number;
    nodeWidth: number;
    nodeHeight: number;
  };
  setLayoutConfig: (config: Partial<UseCausalEditorReturn['layoutConfig']>) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCausalEditor(
  initialChain: CausalChain,
  options?: {
    maxHistorySize?: number;
    autoLayout?: boolean;
    layoutWidth?: number;
    layoutHeight?: number;
  }
): UseCausalEditorReturn {
  const {
    maxHistorySize = 50,
    autoLayout = true,
    layoutWidth = 800,
    layoutHeight = 600,
  } = options ?? {};

  // Layout config
  const [layoutConfig, setLayoutConfigState] = useState({
    width: layoutWidth,
    height: layoutHeight,
    nodeWidth: 150,
    nodeHeight: 60,
  });

  // Initialize with layout
  const initialLayoutedChain = useMemo(
    () =>
      autoLayout
        ? calculateHierarchicalLayout(initialChain, layoutConfig)
        : initialChain,
    [initialChain, autoLayout, layoutConfig]
  );

  // Core state
  const [chain, setChain] = useState<CausalChain>(initialLayoutedChain);
  const [viewMode, setViewMode] = useState<ViewMode>('chain');
  const [editMode, setEditMode] = useState<EditMode>('view');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [activeScenario, setActiveScenario] = useState<WhatIfScenario | null>(null);
  const [comparisonChain, setComparisonChain] = useState<CausalChain | null>(null);
  const [propagations, setPropagations] = useState<PropagationResult[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([
    { chain: initialLayoutedChain, description: 'Initial state', timestamp: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Track original chain for comparison
  const originalChainRef = useRef<CausalChain>(initialLayoutedChain);

  // Calculate differences when in compare mode
  const differences = useMemo(() => {
    if (editMode !== 'compare' || !comparisonChain) return [];
    return compareChains(chain, comparisonChain);
  }, [chain, comparisonChain, editMode]);

  // Calculate Sankey data when in sankey mode
  const sankeyData = useMemo(() => {
    if (viewMode !== 'sankey') return null;
    return calculateSankeyLayout(chain, layoutConfig);
  }, [chain, viewMode, layoutConfig]);

  // ============================================================================
  // History Management
  // ============================================================================

  const pushHistory = useCallback(
    (newChain: CausalChain, description: string) => {
      setHistory((prev) => {
        // Remove any future history if we're not at the end
        const truncated = prev.slice(0, historyIndex + 1);
        const newHistory = [
          ...truncated,
          { chain: newChain, description, timestamp: Date.now() },
        ];
        // Limit history size
        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(-maxHistorySize);
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
      setIsDirty(true);
    },
    [historyIndex, maxHistorySize]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setChain(history[newIndex].chain);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setChain(history[newIndex].chain);
    }
  }, [historyIndex, history]);

  // ============================================================================
  // Selection
  // ============================================================================

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  const selectEdge = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // ============================================================================
  // Node Operations
  // ============================================================================

  const addNode = useCallback(
    (node: Omit<CausalNode, 'x' | 'y' | 'column' | 'row'>) => {
      const newChain: CausalChain = {
        ...chain,
        nodes: [...chain.nodes, { ...node, x: 0, y: 0 }],
      };
      const layoutedChain = autoLayout
        ? calculateHierarchicalLayout(newChain, layoutConfig)
        : newChain;
      setChain(layoutedChain);
      pushHistory(layoutedChain, `Added node: ${node.label}`);
    },
    [chain, autoLayout, layoutConfig, pushHistory]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<CausalNode>) => {
      const newChain: CausalChain = {
        ...chain,
        nodes: chain.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n
        ),
      };
      setChain(newChain);
      pushHistory(newChain, `Updated node: ${nodeId}`);
    },
    [chain, pushHistory]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      const newChain: CausalChain = {
        ...chain,
        nodes: chain.nodes.filter((n) => n.id !== nodeId),
        edges: chain.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
        rootNodeIds: chain.rootNodeIds.filter((id) => id !== nodeId),
        leafNodeIds: chain.leafNodeIds.filter((id) => id !== nodeId),
      };
      const layoutedChain = autoLayout
        ? calculateHierarchicalLayout(newChain, layoutConfig)
        : newChain;
      setChain(layoutedChain);
      pushHistory(layoutedChain, `Removed node: ${nodeId}`);

      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [chain, autoLayout, layoutConfig, pushHistory, selectedNodeId]
  );

  const moveNode = useCallback(
    (nodeId: string, x: number, y: number) => {
      const newChain: CausalChain = {
        ...chain,
        nodes: chain.nodes.map((n) =>
          n.id === nodeId ? { ...n, x, y } : n
        ),
      };
      setChain(newChain);
      // Don't push to history for every move, just update state
      setIsDirty(true);
    },
    [chain]
  );

  const reorderNode = useCallback(
    (nodeId: string, newIndex: number, column: number) => {
      // This is handled by drag-and-drop, just recalculate layout
      const newChain = calculateHierarchicalLayout(chain, layoutConfig);
      setChain(newChain);
      pushHistory(newChain, `Reordered node: ${nodeId}`);
    },
    [chain, layoutConfig, pushHistory]
  );

  // ============================================================================
  // Edge Operations
  // ============================================================================

  const addEdge = useCallback(
    (edge: Omit<CausalEdge, 'controlPoints'>) => {
      // Check if edge already exists
      const exists = chain.edges.some(
        (e) => e.source === edge.source && e.target === edge.target
      );
      if (exists) return;

      const newChain: CausalChain = {
        ...chain,
        edges: [...chain.edges, { ...edge, controlPoints: [] }],
      };
      const layoutedChain = autoLayout
        ? calculateHierarchicalLayout(newChain, layoutConfig)
        : newChain;
      setChain(layoutedChain);
      pushHistory(layoutedChain, `Added edge: ${edge.source} → ${edge.target}`);
    },
    [chain, autoLayout, layoutConfig, pushHistory]
  );

  const updateEdge = useCallback(
    (edgeId: string, updates: Partial<CausalEdge>) => {
      const newChain: CausalChain = {
        ...chain,
        edges: chain.edges.map((e) =>
          e.id === edgeId ? { ...e, ...updates } : e
        ),
      };
      setChain(newChain);
      pushHistory(newChain, `Updated edge: ${edgeId}`);
    },
    [chain, pushHistory]
  );

  const removeEdge = useCallback(
    (edgeId: string) => {
      const newChain: CausalChain = {
        ...chain,
        edges: chain.edges.filter((e) => e.id !== edgeId),
      };
      const layoutedChain = autoLayout
        ? calculateHierarchicalLayout(newChain, layoutConfig)
        : newChain;
      setChain(layoutedChain);
      pushHistory(layoutedChain, `Removed edge: ${edgeId}`);

      if (selectedEdgeId === edgeId) {
        setSelectedEdgeId(null);
      }
    },
    [chain, autoLayout, layoutConfig, pushHistory, selectedEdgeId]
  );

  // ============================================================================
  // Layout
  // ============================================================================

  const recalculateLayout = useCallback(() => {
    const layoutedChain = calculateHierarchicalLayout(chain, layoutConfig);
    setChain(layoutedChain);
  }, [chain, layoutConfig]);

  const optimizeLayoutAction = useCallback(() => {
    const optimizedChain = optimizeLayout(chain, 50);
    setChain(optimizedChain);
    pushHistory(optimizedChain, 'Optimized layout');
  }, [chain, pushHistory]);

  const setLayoutConfig = useCallback(
    (config: Partial<UseCausalEditorReturn['layoutConfig']>) => {
      setLayoutConfigState((prev) => ({ ...prev, ...config }));
    },
    []
  );

  // ============================================================================
  // What-If Analysis
  // ============================================================================

  const createScenario = useCallback((name: string): WhatIfScenario => {
    return {
      id: `scenario-${Date.now()}`,
      name,
      modifications: [],
    };
  }, []);

  const addModification = useCallback(
    (
      scenario: WhatIfScenario,
      modification: WhatIfScenario['modifications'][0]
    ): WhatIfScenario => {
      return {
        ...scenario,
        modifications: [...scenario.modifications, modification],
      };
    },
    []
  );

  const applyScenarioAction = useCallback(
    (scenario: WhatIfScenario) => {
      const result = applyWhatIfScenario(chain, scenario);
      setActiveScenario(scenario);
      setPropagations(result.propagations);
      // Don't modify actual chain, just show propagations
    },
    [chain]
  );

  const clearScenario = useCallback(() => {
    setActiveScenario(null);
    setPropagations([]);
  }, []);

  // ============================================================================
  // Path Finding
  // ============================================================================

  const findPathBetween = useCallback(
    (sourceId: string, targetId: string): string[] => {
      // BFS to find shortest path
      const visited = new Set<string>();
      const queue: Array<{ nodeId: string; path: string[] }> = [
        { nodeId: sourceId, path: [sourceId] },
      ];

      const adjacency = new Map<string, string[]>();
      chain.edges.forEach((edge) => {
        const targets = adjacency.get(edge.source) || [];
        targets.push(edge.target);
        adjacency.set(edge.source, targets);
      });

      while (queue.length > 0) {
        const { nodeId, path } = queue.shift()!;

        if (nodeId === targetId) {
          return path;
        }

        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const neighbors = adjacency.get(nodeId) || [];
        neighbors.forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            queue.push({ nodeId: neighbor, path: [...path, neighbor] });
          }
        });
      }

      return [];
    },
    [chain]
  );

  const highlightPath = useCallback((nodeIds: string[]) => {
    setHighlightedPath(nodeIds);
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedPath([]);
  }, []);

  // ============================================================================
  // Import/Export
  // ============================================================================

  const exportChain = useCallback(() => {
    return exportChainAsJSON(chain);
  }, [chain]);

  const importChainAction = useCallback(
    (json: string): boolean => {
      const imported = importChainFromJSON(json);
      if (!imported) return false;

      const layoutedChain = autoLayout
        ? calculateHierarchicalLayout(imported, layoutConfig)
        : imported;
      setChain(layoutedChain);
      pushHistory(layoutedChain, 'Imported chain');
      return true;
    },
    [autoLayout, layoutConfig, pushHistory]
  );

  const resetChain = useCallback(
    (newChain: CausalChain) => {
      const layoutedChain = autoLayout
        ? calculateHierarchicalLayout(newChain, layoutConfig)
        : newChain;
      setChain(layoutedChain);
      originalChainRef.current = layoutedChain;
      setHistory([
        { chain: layoutedChain, description: 'Reset chain', timestamp: Date.now() },
      ]);
      setHistoryIndex(0);
      setIsDirty(false);
      clearSelection();
      clearScenario();
      clearHighlight();
    },
    [autoLayout, layoutConfig, clearSelection, clearScenario, clearHighlight]
  );

  // ============================================================================
  // Return
  // ============================================================================

  const state: EditorState = {
    chain,
    viewMode,
    editMode,
    selectedNodeId,
    selectedEdgeId,
    highlightedPath,
    activeScenario,
    comparisonChain,
    differences,
    propagations,
    isDirty,
  };

  const actions: EditorActions = {
    selectNode,
    selectEdge,
    clearSelection,
    addNode,
    updateNode,
    removeNode,
    moveNode,
    addEdge,
    updateEdge,
    removeEdge,
    reorderNode,
    recalculateLayout,
    optimizeLayout: optimizeLayoutAction,
    setViewMode,
    setEditMode,
    createScenario,
    applyScenario: applyScenarioAction,
    clearScenario,
    addModification,
    setComparisonChain,
    highlightPath,
    clearHighlight,
    findPathBetween,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    exportChain,
    importChain: importChainAction,
    resetChain,
  };

  return {
    state,
    actions,
    sankeyData,
    layoutConfig,
    setLayoutConfig,
  };
}

export default useCausalEditor;
