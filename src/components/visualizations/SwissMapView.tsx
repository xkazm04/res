'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ResearchSession } from '@/src/types/research';
import {
  useAppStore,
  getTemplateDisplayName,
  groupSessionsByTemplate,
  getTopicsForTemplate,
  getUncategorizedSessions,
  type TopicWithSessions,
} from '@/src/stores/appStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import {
  SwissInteractionManager,
  getSwissZoomLevel,
  getSwissZoomLevelName,
  type SwissViewState,
  type SwissMapConfig,
  DEFAULT_SWISS_CONFIG,
} from '@/src/lib/swissMap';
import { getSessionCache } from '@/src/lib/sessionCache';
import { ZoomControls } from './ZoomControls';

interface SwissMapViewProps {
  sessions: ResearchSession[];
  onSessionSelect?: (session: ResearchSession) => void;
}

type DrillLevel = 'overview' | 'template' | 'topic';

interface DrillState {
  level: DrillLevel;
  templateId?: string;
  topicId?: string;
}

// ============================================================================
// Dynamic Grid Layout Calculation
// ============================================================================

interface GridLayout {
  columnCount: number;
  columnWidth: number;
  cardHeight: number;
  gap: number;
}

/**
 * Calculate optimal grid layout based on container width and item count
 * Replaces fixed 12-column grid with adaptive layout
 */
function calculateGridLayout(containerWidth: number, itemCount: number): GridLayout {
  // Minimum card width for readability
  const minCardWidth = 180;

  // Maximum columns based on container width
  const maxColumns = Math.min(12, Math.floor(containerWidth / minCardWidth));

  // Adaptive column count based on item count (avoid too sparse grids)
  const columnCount = Math.max(2, Math.min(maxColumns, Math.ceil(Math.sqrt(itemCount))));

  // Column width fills available space
  const gap = 1; // 1px gap (bg-black shows through)
  const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;

  // Card height adapts to density
  const cardHeight = itemCount > 50 ? 80 : itemCount > 20 ? 100 : 120;

  return { columnCount, columnWidth, cardHeight, gap };
}

// Use session threshold for when to show virtualized list vs grid
const VIRTUALIZATION_THRESHOLD = 100;

/**
 * Swiss Map View
 *
 * An infinite Swiss-style map with:
 * - Keyboard navigation (WASD, Arrows)
 * - Semantic zoom levels
 * - Space-efficient compact design
 * - Hierarchical drill-down navigation
 */
export function SwissMapView({
  sessions,
  onSessionSelect,
}: SwissMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<SwissInteractionManager | null>(null);

  const [view, setView] = useState<SwissViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  });
  const [drill, setDrill] = useState<DrillState>({ level: 'overview' });

  const {
    topics,
    fetchTopics,
    fetchSessionsByTemplate,
    fetchSessionsByTopic,
    templatePagination,
    topicPagination,
  } = useAppStore();
  const reducedMotion = useReducedMotion();

  // Container size for dynamic grid
  const [containerSize, setContainerSize] = useState({ width: 900, height: 600 });

  // Virtualized list parent ref
  const listParentRef = useRef<HTMLDivElement>(null);

  // Loading state for lazy loading
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch topics
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Track container size for dynamic grid
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Data processing
  const grouped = useMemo(() => groupSessionsByTemplate(sessions), [sessions]);
  const templates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  // Current view data based on drill level
  const viewData = useMemo(() => {
    if (drill.level === 'overview') {
      return {
        items: templates.map((t) => ({
          id: t,
          type: 'template' as const,
          label: getTemplateDisplayName(t),
          count: grouped[t].length,
          sessions: grouped[t],
        })),
        title: 'Research Index',
        breadcrumb: ['Index'],
      };
    }

    if (drill.level === 'template' && drill.templateId) {
      const templateTopics = getTopicsForTemplate(drill.templateId, topics);
      const uncategorized = getUncategorizedSessions(
        grouped[drill.templateId] || [],
        topics
      );

      const templateId = drill.templateId;
      const items = templateTopics.map((topic) => ({
        id: topic.id,
        type: 'topic' as const,
        label: topic.name,
        description: topic.description,
        count: topic.sessions?.filter((s) => s.template_type === templateId).length || 0,
        sessions: (grouped[templateId] || []).filter((s: ResearchSession) =>
          topic.sessions?.some((ts) => ts.id === s.id)
        ),
        topic,
      }));

      if (uncategorized.length > 0) {
        items.push({
          id: '__uncategorized__',
          type: 'topic' as const,
          label: 'Uncategorized',
          description: undefined,
          count: uncategorized.length,
          sessions: uncategorized,
          topic: undefined as unknown as TopicWithSessions,
        });
      }

      return {
        items,
        title: getTemplateDisplayName(drill.templateId),
        breadcrumb: ['Index', getTemplateDisplayName(drill.templateId)],
      };
    }

    if (drill.level === 'topic' && drill.templateId && drill.topicId) {
      const topic = topics.find((t) => t.id === drill.topicId);
      const templateSessions = grouped[drill.templateId] || [];
      let topicSessions: ResearchSession[];

      if (drill.topicId === '__uncategorized__') {
        topicSessions = getUncategorizedSessions(templateSessions, topics);
      } else {
        topicSessions = templateSessions.filter((s) =>
          topic?.sessions?.some((ts) => ts.id === s.id)
        );
      }

      return {
        items: topicSessions.map((s) => ({
          id: s.id,
          type: 'session' as const,
          label: s.title,
          description: s.query,
          count: s.claim_count || 0,
          sessions: [s],
          session: s,
        })),
        title: topic?.name || 'Uncategorized',
        breadcrumb: [
          'Index',
          getTemplateDisplayName(drill.templateId),
          topic?.name || 'Uncategorized',
        ],
      };
    }

    return { items: [], title: '', breadcrumb: [] };
  }, [drill, templates, grouped, topics]);

  // Stats
  const stats = useMemo(() => ({
    sessions: sessions.length,
    templates: templates.length,
    findings: sessions.reduce((sum, s) => sum + (s.claim_count || 0), 0),
    sources: sessions.reduce((sum, s) => sum + (s.source_count || 0), 0),
  }), [sessions, templates]);

  // Calculate dynamic grid layout
  const gridLayout = useMemo(() => {
    const width = Math.min(containerSize.width - 32, 900); // Max 900px with padding
    return calculateGridLayout(width, viewData.items.length);
  }, [containerSize.width, viewData.items.length]);

  // Determine if we should use virtualized list (for session-level views with many items)
  const shouldVirtualize = drill.level === 'topic' && viewData.items.length > VIRTUALIZATION_THRESHOLD;

  // Initialize interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config: Partial<SwissMapConfig> = {
      ...DEFAULT_SWISS_CONFIG,
      reducedMotion,
    };

    const interaction = new SwissInteractionManager(container, config, {
      onViewChange: (newView) => setView({ ...newView }),
      onRenderNeeded: () => {},
    });

    interactionRef.current = interaction;

    return () => {
      interaction.dispose();
    };
  }, [reducedMotion]);

  // Apply view transform
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.style.transform = `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.scale})`;
  }, [view]);

  // Navigation handlers with lazy loading
  const handleItemClick = useCallback(
    async (item: (typeof viewData.items)[0]) => {
      if (item.type === 'template') {
        // Lazy load template data if not cached
        const cache = getSessionCache();
        if (!cache.hasTemplateData(item.id)) {
          setIsLoadingMore(true);
          try {
            await fetchSessionsByTemplate(item.id);
          } finally {
            setIsLoadingMore(false);
          }
        }

        setDrill({ level: 'template', templateId: item.id });
        interactionRef.current?.setView({ offsetX: 0, offsetY: 0 }, true);
      } else if (item.type === 'topic') {
        // Lazy load topic sessions if not cached
        const cache = getSessionCache();
        if (!cache.hasTopicData(item.id)) {
          setIsLoadingMore(true);
          try {
            await fetchSessionsByTopic(item.id);
          } finally {
            setIsLoadingMore(false);
          }
        }

        setDrill({
          level: 'topic',
          templateId: drill.templateId,
          topicId: item.id,
        });
        interactionRef.current?.setView({ offsetX: 0, offsetY: 0 }, true);
      } else if (item.type === 'session' && 'session' in item && item.session) {
        onSessionSelect?.(item.session);
      }
    },
    [drill.templateId, onSessionSelect, fetchSessionsByTemplate, fetchSessionsByTopic]
  );

  // Load more handler for pagination
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      if (drill.level === 'template' && drill.templateId) {
        await fetchSessionsByTemplate(drill.templateId, true);
      } else if (drill.level === 'topic' && drill.topicId) {
        await fetchSessionsByTopic(drill.topicId, true);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [drill, fetchSessionsByTemplate, fetchSessionsByTopic, isLoadingMore]);

  // Check if there's more data to load
  const hasMoreData = useMemo(() => {
    if (drill.level === 'template' && drill.templateId) {
      return templatePagination[drill.templateId]?.hasMore ?? false;
    }
    if (drill.level === 'topic' && drill.topicId) {
      return topicPagination[drill.topicId]?.hasMore ?? false;
    }
    return false;
  }, [drill, templatePagination, topicPagination]);

  const handleBack = useCallback(() => {
    if (drill.level === 'topic') {
      setDrill({ level: 'template', templateId: drill.templateId });
    } else if (drill.level === 'template') {
      setDrill({ level: 'overview' });
    }
    interactionRef.current?.setView({ offsetX: 0, offsetY: 0 }, true);
  }, [drill]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index === 0) {
      setDrill({ level: 'overview' });
    } else if (index === 1 && drill.templateId) {
      setDrill({ level: 'template', templateId: drill.templateId });
    }
    interactionRef.current?.setView({ offsetX: 0, offsetY: 0 }, true);
  }, [drill.templateId]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    interactionRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    interactionRef.current?.zoomOut();
  }, []);

  const handleReset = useCallback(() => {
    interactionRef.current?.resetView();
    setDrill({ level: 'overview' });
  }, []);

  const zoomConfig = getSwissZoomLevel(view.scale);
  const zoomLevelName = getSwissZoomLevelName(view.scale);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white cursor-grab select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Infinite content layer */}
      <div
        ref={contentRef}
        className="absolute origin-center"
        style={{
          left: '50%',
          top: '50%',
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          {/* Stats bar - compact */}
          {drill.level === 'overview' && zoomConfig.showStats && (
            <div className="flex gap-px bg-black mb-px" style={{ width: '900px' }}>
              <StatBox label="Sessions" value={stats.sessions} />
              <StatBox label="Categories" value={stats.templates} />
              <StatBox label="Findings" value={stats.findings} />
              <StatBox label="Sources" value={stats.sources} />
            </div>
          )}

          {/* Grid layout - dynamic based on data */}
          <div
            className="grid gap-px bg-black"
            style={{
              gridTemplateColumns: `repeat(${gridLayout.columnCount}, 1fr)`,
              width: `${Math.min(containerSize.width - 32, 900)}px`,
            }}
          >
            {viewData.items.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                index={idx}
                zoomConfig={zoomConfig}
                onClick={() => handleItemClick(item)}
                drillLevel={drill.level}
                cardHeight={gridLayout.cardHeight}
              />
            ))}
          </div>

          {/* Load more button for pagination */}
          {hasMoreData && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full py-3 bg-white hover:bg-gray-50 border-t border-black text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors disabled:opacity-50"
              style={{ width: `${Math.min(containerSize.width - 32, 900)}px` }}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}

          {/* Empty state */}
          {viewData.items.length === 0 && (
            <div className="bg-white p-8 text-center text-gray-400" style={{ width: '600px' }}>
              No items found
            </div>
          )}
        </div>
      </div>

      {/* Fixed UI overlay */}
      {/* Header with breadcrumb */}
      <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-black z-10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            {drill.level !== 'overview' && (
              <button
                onClick={handleBack}
                className="text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
              >
                ←
              </button>
            )}
            <div className="flex items-center gap-1 text-xs">
              {viewData.breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">/</span>}
                  <button
                    onClick={() => handleBreadcrumbClick(i)}
                    className={`uppercase tracking-widest ${
                      i === viewData.breadcrumb.length - 1
                        ? 'text-black font-medium'
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    {crumb}
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {viewData.items.length} items
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-16 right-3 z-10">
        <ZoomControls
          scale={view.scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-3 left-3 text-gray-400 text-[10px] font-mono">
        <span className="hidden sm:inline">
          WASD: Pan &bull; Scroll: Zoom &bull; Click: Open
        </span>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-3 right-3 text-gray-400 text-[10px] font-mono">
        {zoomLevelName} &bull; {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components - Compact Design
// ============================================================================

interface StatBoxProps {
  label: string;
  value: number;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="flex-1 bg-white px-3 py-2">
      <div className="text-2xl font-light leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">{label}</div>
    </div>
  );
}

interface ItemCardProps {
  item: {
    id: string;
    type: 'template' | 'topic' | 'session';
    label: string;
    description?: string;
    count: number;
    sessions: ResearchSession[];
  };
  index: number;
  zoomConfig: ReturnType<typeof getSwissZoomLevel>;
  onClick: () => void;
  drillLevel: DrillLevel;
  cardHeight?: number;
}

function ItemCard({ item, index, zoomConfig, onClick, drillLevel, cardHeight }: ItemCardProps) {
  const isSession = item.type === 'session';
  const showDescription = zoomConfig.showDescriptions && item.description;

  // Compact sizing based on zoom level
  const padding = zoomConfig.cardSize === 'compact' ? 'p-2' : zoomConfig.cardSize === 'normal' ? 'p-3' : 'p-4';
  const titleSize = zoomConfig.cardSize === 'compact' ? 'text-sm' : zoomConfig.cardSize === 'normal' ? 'text-base' : 'text-lg';
  const countSize = zoomConfig.cardSize === 'compact' ? 'text-lg' : zoomConfig.cardSize === 'normal' ? 'text-xl' : 'text-2xl';

  // Dynamic card height from grid layout or fallback
  const minHeight = cardHeight ?? (drillLevel === 'topic'
    ? (zoomConfig.cardSize === 'compact' ? 60 : 80)
    : (zoomConfig.cardSize === 'compact' ? 70 : 90));

  return (
    <button
      onClick={onClick}
      className={`bg-white hover:bg-gray-50 transition-colors text-left group ${padding}`}
      style={{ minHeight }}
    >
      <div className="h-full flex flex-col justify-between">
        <div>
          {/* Index number - only show at normal/detail zoom */}
          {zoomConfig.showStats && (
            <div className="text-[8px] uppercase tracking-widest text-gray-300 mb-0.5">
              {String(index + 1).padStart(2, '0')}
            </div>
          )}
          <h3 className={`${titleSize} font-light leading-tight group-hover:underline decoration-1 underline-offset-2 line-clamp-2`}>
            {item.label}
          </h3>
          {showDescription && (
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-end justify-between mt-1">
          <div className={`${countSize} font-light leading-none`}>
            {isSession ? item.count : item.sessions.length}
          </div>
          {zoomConfig.showStats && (
            <div className="text-[8px] text-gray-400 uppercase tracking-widest">
              {isSession ? 'findings' : drillLevel === 'overview' ? 'sessions' : 'sessions'}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
