'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { ResearchSession } from '@/src/types/research';
import {
  useAppStore,
  getTemplateDisplayName,
  type TopicWithSessions,
} from '@/src/stores/appStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { useMapNavigation } from '@/src/hooks/useMapNavigation';
import {
  buildNodeHierarchy,
  StrategicMapRenderer,
  AnimationController,
  InteractionManager,
  FocusController,
  getZoomLevelName,
  generateDynamicZoomLevels,
  clearZoomLevelCache,
  type ViewState,
  type StrategicMapNode,
  type NodeHierarchy,
  type StrategicMapConfig,
  type DrillDownState,
  type DynamicZoomLevelConfig,
  type RenderMode,
  DEFAULT_CONFIG,
} from '@/src/lib/strategicMap';
import { getSessionCache } from '@/src/lib/sessionCache';
import { Minimap } from './Minimap';
import { ZoomControls } from './ZoomControls';
import { Breadcrumbs } from './Breadcrumbs';
import { SearchOverlay } from './SearchOverlay';
import { HeatmapToggle } from './HeatmapToggle';

interface StrategicMapViewProps {
  sessions: ResearchSession[];
  onSessionSelect?: (session: ResearchSession) => void;
}

/**
 * Strategic Map View
 *
 * A Total War-style strategic map visualization with:
 * - Semantic zoom levels (clusters → templates → topics → sessions)
 * - Level of Detail (LOD) rendering
 * - On-demand rendering (no infinite animation loops)
 * - Keyboard navigation (WASD, Arrows, +/-, Home, Escape)
 */
export function StrategicMapView({
  sessions,
  onSessionSelect,
}: StrategicMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for non-reactive state
  const rendererRef = useRef<StrategicMapRenderer | null>(null);
  const animatorRef = useRef<AnimationController | null>(null);
  const interactionRef = useRef<InteractionManager | null>(null);
  const focusControllerRef = useRef<FocusController | null>(null);
  const hierarchyRef = useRef<NodeHierarchy | null>(null);

  // Reactive state
  const [view, setView] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 0.12, // Start fully zoomed out to see all categories
  });
  const [hoveredNode, setHoveredNode] = useState<StrategicMapNode | null>(null);
  const [focusedNode, setFocusedNode] = useState<StrategicMapNode | null>(null);
  const [drillState, setDrillState] = useState<DrillDownState>({
    level: 'overview',
    focusedTemplateId: null,
    focusedTopicId: null,
    breadcrumbs: [],
  });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // New UX features state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHighlights, setSearchHighlights] = useState<Set<string>>(new Set());
  const [renderMode, setRenderMode] = useState<RenderMode>('default');

  // Refs to break stale-closure cycles between requestRender and the init effect.
  // Without these, changing searchHighlights/renderMode/drillState would cause the
  // entire renderer + interaction manager to be re-created, losing view position.
  const searchHighlightsRef = useRef<Set<string>>(new Set());
  const renderModeRef = useRef<RenderMode>('default');
  const drillStateRef = useRef<DrillDownState>({
    level: 'overview',
    focusedTemplateId: null,
    focusedTopicId: null,
    breadcrumbs: [],
  });
  // Keep refs in sync with state on every render
  searchHighlightsRef.current = searchHighlights;
  renderModeRef.current = renderMode;
  drillStateRef.current = drillState;

  // Store
  const {
    topics,
    fetchTopics,
    fetchAggregates,
    fetchSessionsByTemplate,
    aggregates,
  } = useAppStore();

  // Accessibility
  const reducedMotion = useReducedMotion();

  // Dynamic zoom levels based on hierarchy
  const [dynamicZoomLevels, setDynamicZoomLevels] = useState<DynamicZoomLevelConfig[] | null>(null);

  // Loading state for progressive loading
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // Navigation callback for browser history integration
  const handleHistoryNavigate = useCallback(
    (state: { level: 'overview' | 'template' | 'topic'; templateId: string | null; topicId: string | null }) => {
      // Wait for focus controller to be initialized
      if (focusControllerRef.current) {
        focusControllerRef.current.navigateToState(state.level, state.templateId, state.topicId);
      }
    },
    []
  );

  // Browser history integration for back/forward button support
  useMapNavigation({
    drillState,
    onNavigate: handleHistoryNavigate,
    useHash: true,
  });

  // Fetch aggregates and topics on mount
  useEffect(() => {
    fetchAggregates();
    fetchTopics();
  }, [fetchAggregates, fetchTopics]);

  // Build hierarchy when data changes
  const hierarchy = useMemo(() => {
    const h = buildNodeHierarchy(sessions, topics);
    hierarchyRef.current = h;

    // Generate dynamic zoom levels based on the hierarchy
    if (h.allNodes.length > 0) {
      const levels = generateDynamicZoomLevels(h);
      setDynamicZoomLevels(levels);
    }

    return h;
  }, [sessions, topics]);

  // Request render callback — intentionally has NO state dependencies.
  // All render options are read from mutable refs at call time, so this function
  // never changes identity and does NOT cause the init effect to re-run.
  const requestRender = useCallback(() => {
    if (rendererRef.current && interactionRef.current) {
      const currentView = interactionRef.current.getView();
      const fc = focusControllerRef.current;
      const nodeFilter = fc
        ? (nodes: StrategicMapNode[]) => fc.filterNodes(nodes)
        : undefined;

      // Get parent node ID for grayed back-navigation node
      const parentNodeId = fc?.getParentNodeId() ?? null;
      const drillLevel = drillStateRef.current.level;

      rendererRef.current.render(currentView, {
        hoveredNodeId: interactionRef.current.getHoveredNodeId(),
        focusedNodeId: interactionRef.current.getFocusedNodeId(),
        nodeFilter,
        searchMatchIds: searchHighlightsRef.current.size > 0 ? searchHighlightsRef.current : undefined,
        renderMode: renderModeRef.current,
        showAmbient: false,
        showConnections: true,
        parentNodeId,
        // Skip label collision avoidance when drilled in — few nodes, all labels should show
        skipLabelCollision: drillLevel !== 'overview',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — reads from refs

  // Initialize renderer and interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Create config
    const config: StrategicMapConfig = {
      ...DEFAULT_CONFIG,
      reducedMotion,
    };

    // Create renderer
    const renderer = new StrategicMapRenderer(canvas, config);
    rendererRef.current = renderer;

    // Create animator
    const animator = new AnimationController(requestRender, reducedMotion);
    animatorRef.current = animator;

    // Create focus controller for drill-down navigation
    const focusController = new FocusController(
      (state) => {
        setDrillState(state);
        requestRender();
      },
      (viewUpdate, animate) => {
        if (interaction) {
          interaction.setView(
            { ...interaction.getView(), ...viewUpdate },
            animate
          );
        }
      }
    );
    focusControllerRef.current = focusController;

    // Create interaction manager
    const interaction = new InteractionManager(
      canvas,
      config,
      {
        onViewChange: (newView) => {
          setView({ ...newView });
        },
        onNodeClick: (node) => {
          if (!node) return;

          const fc = focusControllerRef.current;

          // Check if clicking the parent node for drill-back navigation
          if (fc && fc.shouldDrillBack(node)) {
            fc.drillOut();
            return;
          }

          // Handle session clicks - open report
          if (node.type === 'session' && node.session && onSessionSelect) {
            onSessionSelect(node.session);
            return;
          }

          // Handle drill-down for templates and topics
          if (fc && fc.canDrillInto(node)) {
            // Lazy load data for templates when drilling down
            if (node.type === 'template' && node.templateType) {
              const cache = getSessionCache();
              if (!cache.hasTemplateData(node.templateType)) {
                setLoadingNodes(prev => new Set(prev).add(node.id));
                fetchSessionsByTemplate(node.templateType).finally(() => {
                  setLoadingNodes(prev => {
                    const next = new Set(prev);
                    next.delete(node.id);
                    return next;
                  });
                });
              }
            }

            fc.drillInto(node);
            return;
          }

          // Otherwise just focus the node
          setFocusedNode(node);
        },
        onNodeHover: (node) => {
          setHoveredNode(node);
        },
        onRenderNeeded: requestRender,
        findNodeAt: (x, y, view) => {
          // Apply the same FocusController node filter used in rendering so that
          // hit detection only considers currently-visible nodes.  Without this,
          // hidden nodes from other templates could intercept clicks when drilled in.
          const fc = focusControllerRef.current;
          if (fc && fc.getLevel() !== 'overview') {
            return renderer.findNodeAt(x, y, view, (nodes) => fc.filterNodes(nodes));
          }
          return renderer.findNodeAt(x, y, view);
        },
        onEscape: () => {
          // Handle Escape for drill-back navigation
          if (focusControllerRef.current?.getLevel() !== 'overview') {
            focusControllerRef.current?.drillOut();
            return true; // Prevent default unfocus
          }
          return false;
        },
      },
      animator
    );
    interactionRef.current = interaction;

    // Now update the focus controller to use the interaction for view changes
    focusController.setHierarchy(hierarchyRef.current!);

    // Replace with a new controller that can use interaction for view changes
    focusControllerRef.current = new FocusController(
      (state) => {
        setDrillState(state);
        requestRender();
      },
      (viewUpdate, animate) => {
        interaction.setView(
          { ...interaction.getView(), ...viewUpdate },
          animate
        );
      }
    );

    // Set hierarchy on the new controller
    if (hierarchyRef.current) {
      focusControllerRef.current.setHierarchy(hierarchyRef.current);
    }

    // Set initial data
    if (hierarchyRef.current) {
      renderer.setData(hierarchyRef.current);
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setCanvasDimensions({ width: rect.width, height: rect.height });
      renderer.updateCanvasSize();
      requestRender();
    });

    resizeObserver.observe(container);

    // Initial render
    const rect = container.getBoundingClientRect();
    setCanvasDimensions({ width: rect.width, height: rect.height });
    renderer.updateCanvasSize();
    requestRender();

    return () => {
      resizeObserver.disconnect();
      interaction.dispose();
      renderer.dispose();
      animator.clear();
    };
  // requestRender is intentionally omitted from deps — it never changes (empty useCallback)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, onSessionSelect]);

  // Update renderer and focus controller when hierarchy changes
  useEffect(() => {
    if (rendererRef.current && hierarchy) {
      rendererRef.current.setData(hierarchy);
    }
    if (focusControllerRef.current && hierarchy) {
      focusControllerRef.current.setHierarchy(hierarchy);
    }
    requestRender();
  }, [hierarchy, requestRender]);

  // Update reduced motion setting
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setReducedMotion(reducedMotion);
    }
    if (interactionRef.current) {
      interactionRef.current.setConfig({ reducedMotion });
    }
  }, [reducedMotion]);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    if (!interactionRef.current) return;
    const currentView = interactionRef.current.getView();
    const newScale = Math.min(3.0, currentView.scale * 1.2);
    interactionRef.current.setView({ ...currentView, scale: newScale }, true);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!interactionRef.current) return;
    const currentView = interactionRef.current.getView();
    const newScale = Math.max(0.1, currentView.scale / 1.2);
    interactionRef.current.setView({ ...currentView, scale: newScale }, true);
  }, []);

  const handleReset = useCallback(() => {
    interactionRef.current?.resetView();
    focusControllerRef.current?.reset();
  }, []);

  // Breadcrumb navigation handlers
  const handleBreadcrumbNavigate = useCallback((id: string) => {
    focusControllerRef.current?.navigateToBreadcrumb(id);
  }, []);

  const handleDrillBack = useCallback(() => {
    focusControllerRef.current?.drillOut();
  }, []);

  // Minimap navigation
  const handleMinimapNavigate = useCallback((offsetX: number, offsetY: number) => {
    if (!interactionRef.current) return;
    const currentView = interactionRef.current.getView();
    interactionRef.current.setView({ ...currentView, offsetX, offsetY }, true);
  }, []);

  // Search handlers
  const handleSearchSelect = useCallback((nodeId: string) => {
    // Find the node and fly to it
    const node = hierarchy.nodeMap.get(nodeId);
    if (!node || !interactionRef.current) return;

    // Calculate view to center on node
    const targetScale = Math.max(1.5, view.scale);
    const offsetX = -node.x;
    const offsetY = -node.y;

    interactionRef.current.setView({ offsetX, offsetY, scale: targetScale }, true);
    setFocusedNode(node);
    setSearchHighlights(new Set()); // Clear highlights after selection
  }, [hierarchy, view.scale]);

  const handleSearchHighlight = useCallback((nodeIds: Set<string>) => {
    setSearchHighlights(nodeIds);
  }, []);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Forward slash when not in input
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get zoom level name for display
  const zoomLevel = getZoomLevelName(view.scale);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#0A0A0B]"
    >
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab"
      />

      {/* Tooltip for hovered node */}
      {hoveredNode && (
        <NodeTooltip
          node={hoveredNode}
          containerRef={containerRef}
        />
      )}

      {/* Focused node panel */}
      {focusedNode && focusedNode.type !== 'session' && focusedNode.sessions && (
        <FocusedNodePanel
          node={focusedNode}
          onSessionSelect={onSessionSelect}
          onClose={() => {
            setFocusedNode(null);
            interactionRef.current?.clearFocus();
          }}
        />
      )}

      {/* Breadcrumbs - show when drilled in */}
      {drillState.breadcrumbs.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Breadcrumbs
            items={drillState.breadcrumbs}
            onNavigate={handleBreadcrumbNavigate}
            onBack={handleDrillBack}
          />
        </div>
      )}

      {/* Minimap */}
      <div className="absolute top-4 left-4 z-10">
        <Minimap
          hierarchy={hierarchy}
          view={view}
          canvasWidth={canvasDimensions.width}
          canvasHeight={canvasDimensions.height}
          onNavigate={handleMinimapNavigate}
        />
      </div>

      {/* Heatmap toggle */}
      <div className="absolute top-4 right-4 z-10">
        <HeatmapToggle mode={renderMode} onChange={setRenderMode} />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-24 right-4 z-10">
        <ZoomControls
          scale={view.scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      </div>

      {/* Search button */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="absolute bottom-24 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1E] border border-[#27272A] rounded-lg text-[#A1A1AA] hover:text-[#E8E8E8] hover:border-[#3F3F46] transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-xs">Search</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-[#27272A] rounded">/</kbd>
      </button>

      {/* Search overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchHighlights(new Set());
        }}
        onSelect={handleSearchSelect}
        nodes={hierarchy.allNodes}
        onHighlight={handleSearchHighlight}
      />

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-4 text-[#52525B] text-xs">
        <span className="hidden sm:inline">
          WASD/Arrows: Pan &bull; Scroll: Zoom &bull; Click: Drill &bull; /: Search &bull; Esc: Back
        </span>
        <span className="sm:hidden">
          Drag: Pan &bull; Pinch: Zoom
        </span>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 text-[#52525B] text-xs font-mono">
        {zoomLevel} &bull; {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface NodeTooltipProps {
  node: StrategicMapNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function NodeTooltip({ node, containerRef }: NodeTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef]);

  const typeLabel = node.type === 'template'
    ? 'Research Type'
    : node.type === 'topic'
    ? 'Topic'
    : node.type === 'cluster'
    ? 'Category'
    : 'Session';

  return (
    <div
      className="absolute pointer-events-none z-20 bg-[#1A1A1E]/95 backdrop-blur-sm border border-[#27272A] rounded-lg p-3 shadow-xl max-w-[280px] animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full transition-transform duration-150"
          style={{ backgroundColor: node.color, boxShadow: `0 0 8px ${node.color}` }}
        />
        <span className="text-[#E8E8E8] font-medium truncate">{node.label}</span>
        <span className="text-[#52525B] text-xs uppercase ml-auto">
          {typeLabel}
        </span>
      </div>

      {node.aggregatedCount > 0 && (
        <div className="text-[#A1A1AA] text-sm mb-2">
          {node.aggregatedCount} {node.type === 'session' ? 'findings' : 'sessions'}
        </div>
      )}

      {node.sessions && node.sessions.length > 0 && (
        <div className="text-xs text-[#71717A] space-y-0.5">
          {node.sessions.slice(0, 3).map(s => (
            <div key={s.id} className="truncate">{s.title}</div>
          ))}
          {node.sessions.length > 3 && (
            <div>+{node.sessions.length - 3} more...</div>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-[#22D3EE]">
        {node.type === 'session'
          ? 'Click to open report'
          : 'Click to focus'}
      </div>
    </div>
  );
}

interface FocusedNodePanelProps {
  node: StrategicMapNode;
  onSessionSelect?: (session: ResearchSession) => void;
  onClose: () => void;
}

function FocusedNodePanel({ node, onSessionSelect, onClose }: FocusedNodePanelProps) {
  const sessions = node.sessions || [];

  return (
    <div className="absolute top-4 right-16 z-10 bg-[#1A1A1E]/95 backdrop-blur-sm border border-[#27272A] rounded-lg p-4 max-w-xs shadow-xl animate-in slide-in-from-right-2 fade-in duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: node.color, boxShadow: `0 0 6px ${node.color}40` }}
          />
          <h3 className="text-[#E8E8E8] font-medium tracking-tight">{node.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#71717A] hover:text-[#E8E8E8] transition-all duration-150 hover:bg-[#27272A] rounded p-1 -m-1 active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4L4 12M4 4L12 12" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-[#A1A1AA] mb-3 tabular-nums">
        {sessions.length} research session{sessions.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-1 max-h-48 overflow-auto">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSessionSelect?.(session)}
            className="w-full text-left text-sm text-[#A1A1AA] hover:text-[#22D3EE] truncate transition-all duration-150 py-1 hover:pl-1"
          >
            {session.title}
          </button>
        ))}
      </div>

      {sessions.length === 0 && (
        <p className="text-sm text-[#52525B] italic">No sessions in this group</p>
      )}
    </div>
  );
}
