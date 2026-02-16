'use client';

import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  memo,
} from 'react';
import type { ResearchSession } from '@/src/types/research';
import {
  useAppStore,
  getTemplateDisplayName,
  groupSessionsByTemplate,
  getTopicsForTemplate,
  getUncategorizedSessions,
  type TopicWithSessions,
} from '@/src/stores/appStore';
import { getTemplateColor } from '@/src/stores/appStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import {
  SwissInteractionManager,
  getSwissZoomLevelName,
  type SwissViewState,
  type SwissMapConfig,
  DEFAULT_SWISS_CONFIG,
} from '@/src/lib/swissMap';
import { getSessionCache } from '@/src/lib/sessionCache';
import { useMapNavigation } from '@/src/hooks/useMapNavigation';
import { ZoomControls } from './ZoomControls';

// ============================================================================
// Types
// ============================================================================

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
// Number Formatting
// ============================================================================

const numFmt = new Intl.NumberFormat('en-US');

function formatNumber(n: number): string {
  return numFmt.format(n);
}

// ============================================================================
// Relative Time
// ============================================================================

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

// ============================================================================
// Animated Count-Up Hook
// ============================================================================

function useCountUp(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const from = prevTargetRef.current;
    prevTargetRef.current = target;
    startRef.current = null;

    if (from === target) {
      setCurrent(target);
      return;
    }

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (target - from) * eased);
      setCurrent(val);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

// ============================================================================
// Micro-Sparkline: 30-day activity
// ============================================================================

function buildSparklineData(sessions: ResearchSession[]): number[] {
  const now = Date.now();
  const bins = new Array<number>(30).fill(0);

  for (const s of sessions) {
    const age = now - new Date(s.created_at).getTime();
    const dayIndex = 29 - Math.floor(age / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 30) {
      bins[dayIndex]++;
    }
  }
  return bins;
}

// ============================================================================
// Sub-Components (inline, memo'd)
// ============================================================================

// --- Stats Header ---

interface StatsHeaderProps {
  sessions: ResearchSession[];
  templates: string[];
  grouped: Record<string, ResearchSession[]>;
  stats: { sessions: number; templates: number; findings: number; sources: number };
}

const StatsHeader = memo(function StatsHeader({
  sessions: _sessions,
  templates,
  grouped,
  stats,
}: StatsHeaderProps) {
  const animSessions = useCountUp(stats.sessions);
  const animTemplates = useCountUp(stats.templates);
  const animFindings = useCountUp(stats.findings);
  const animSources = useCountUp(stats.sources);

  // Calculate template proportion bar
  const total = stats.sessions || 1;
  const segments = templates.map((t) => ({
    template: t,
    color: getTemplateColor(t),
    fraction: (grouped[t]?.length || 0) / total,
  }));

  return (
    <div className="mb-px">
      {/* Proportion bar */}
      <div className="flex w-full h-1" style={{ gap: 0 }}>
        {segments.map((seg) => (
          <div
            key={seg.template}
            style={{
              width: `${seg.fraction * 100}%`,
              backgroundColor: seg.color,
              minWidth: seg.fraction > 0 ? 2 : 0,
            }}
          />
        ))}
      </div>

      {/* Stats row */}
      <div className="bg-white px-4 py-3 flex items-baseline gap-6 flex-wrap">
        <StatItem value={animSessions} label="SESSIONS" />
        <Divider />
        <StatItem value={animTemplates} label="CATEGORIES" />
        <Divider />
        <StatItem value={animFindings} label="FINDINGS" />
        <Divider />
        <StatItem value={animSources} label="SOURCES" />
      </div>
    </div>
  );
});

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-mono tabular-nums text-sm text-black">
        {formatNumber(value)}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-gray-400">
        {label}
      </span>
    </span>
  );
}

function Divider() {
  return <span className="text-gray-200 text-xs select-none">|</span>;
}

// --- Template Card ---

interface TemplateCardProps {
  templateId: string;
  sessions: ResearchSession[];
  onClick: () => void;
}

const TemplateCard = memo(function TemplateCard({
  templateId,
  sessions,
  onClick,
}: TemplateCardProps) {
  const color = getTemplateColor(templateId);
  const name = getTemplateDisplayName(templateId);
  const count = sessions.length;
  const sparkline = useMemo(() => buildSparklineData(sessions), [sessions]);
  const maxBin = Math.max(1, ...sparkline);

  // Top 3 topic-like groupings: use thematic_group or unique query prefixes
  const topLabels = useMemo(() => {
    const groups = new Map<string, number>();
    for (const s of sessions) {
      const key = s.thematic_group || s.query.split(/\s+/).slice(0, 3).join(' ');
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
  }, [sessions]);

  return (
    <button
      onClick={onClick}
      aria-label={`${name} template: ${count} sessions`}
      className="bg-white text-left group transition-all duration-200 hover:shadow-lg hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none relative overflow-hidden"
      style={{ minHeight: 140, contain: 'layout style paint' }}
    >
      {/* Full-bleed color header bar */}
      <div className="w-full" style={{ height: 6, backgroundColor: color }} />

      <div className="px-4 pt-3 pb-3 flex flex-col justify-between h-[calc(100%-6px)]">
        <div>
          {/* Large monospace count */}
          <div className="text-5xl font-light tabular-nums font-mono leading-none text-black">
            {formatNumber(count)}
          </div>
          {/* Template name */}
          <div className="text-[11px] uppercase tracking-widest text-gray-500 mt-2">
            {name}
          </div>
        </div>

        {/* Micro-sparkline */}
        <div className="flex items-end gap-px mt-3" style={{ height: 20 }}>
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                height: `${(v / maxBin) * 100}%`,
                minHeight: v > 0 ? 1 : 0,
                backgroundColor: color,
                opacity: 0.4,
                borderRadius: '1px 1px 0 0',
              }}
            />
          ))}
        </div>

        {/* Hover: top 3 topics */}
        <div className="overflow-hidden max-h-0 group-hover:max-h-16 transition-all duration-200">
          <div className="pt-2 space-y-0.5">
            {topLabels.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-400 truncate leading-tight"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
});

// --- Topic Card ---

interface TopicCardProps {
  topicId: string;
  templateId: string;
  name: string;
  description?: string;
  sessions: ResearchSession[];
  onClick: () => void;
}

const TopicCard = memo(function TopicCard({
  topicId: _topicId,
  templateId,
  name,
  description,
  sessions,
  onClick,
}: TopicCardProps) {
  const color = getTemplateColor(templateId);
  const count = sessions.length;

  // Status counts
  const statusCounts = useMemo(() => {
    let completed = 0;
    let active = 0;
    let failed = 0;
    for (const s of sessions) {
      if (s.status === 'completed') completed++;
      else if (s.status === 'active' || s.status === 'searching' || s.status === 'analyzing') active++;
      else if (s.status === 'failed') failed++;
    }
    const total = completed + active + failed || 1;
    return { completed, active, failed, total };
  }, [sessions]);

  return (
    <button
      onClick={onClick}
      aria-label={`${name}: ${count} sessions`}
      className="bg-white text-left group transition-all duration-150 hover:shadow-md focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none relative overflow-hidden flex"
      style={{ minHeight: 100, contain: 'layout style paint' }}
    >
      {/* Left color bar */}
      <div className="flex-shrink-0" style={{ width: 3, backgroundColor: color }} />

      <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
        <div className="min-w-0">
          {/* Session count */}
          <div className="text-4xl font-light tabular-nums font-mono leading-none text-black">
            {formatNumber(count)}
          </div>
          {/* Topic name */}
          <div className="text-[15px] font-medium text-black mt-1 truncate">
            {name}
          </div>
          {/* Description */}
          {description && (
            <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">
              {description}
            </div>
          )}
        </div>

        {/* Status bar at bottom */}
        <div className="flex w-full h-1 mt-3 rounded-full overflow-hidden bg-gray-100">
          {statusCounts.completed > 0 && (
            <div
              style={{
                width: `${(statusCounts.completed / statusCounts.total) * 100}%`,
                backgroundColor: '#22C55E',
              }}
            />
          )}
          {statusCounts.active > 0 && (
            <div
              style={{
                width: `${(statusCounts.active / statusCounts.total) * 100}%`,
                backgroundColor: '#FACC15',
              }}
            />
          )}
          {statusCounts.failed > 0 && (
            <div
              style={{
                width: `${(statusCounts.failed / statusCounts.total) * 100}%`,
                backgroundColor: '#EF4444',
              }}
            />
          )}
        </div>
      </div>
    </button>
  );
});

// --- Session Card ---

interface SessionCardProps {
  session: ResearchSession;
  templateId: string;
  onClick: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22C55E',
  active: '#FACC15',
  searching: '#FACC15',
  analyzing: '#FACC15',
  failed: '#EF4444',
};

const SessionCard = memo(function SessionCard({
  session,
  templateId,
  onClick,
}: SessionCardProps) {
  const color = getTemplateColor(templateId);
  const statusColor = STATUS_COLORS[session.status] || '#9CA3AF';

  return (
    <button
      onClick={onClick}
      aria-label={`${session.title || session.query}: ${session.status}`}
      className="bg-white text-left w-full hover:bg-gray-50 transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none border-b border-gray-100 last:border-b-0"
      style={{ minHeight: 56, contain: 'layout style paint', contentVisibility: 'auto', containIntrinsicSize: '0 56px' } as React.CSSProperties}
    >
      <div className="px-4 py-2.5 flex items-center gap-3">
        {/* Left: color dot + status */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div
            className="rounded-full"
            style={{ width: 6, height: 6, backgroundColor: color }}
          />
        </div>

        {/* Center: title + query */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-black truncate">
              {session.title}
            </span>
            <span
              className="text-[9px] uppercase tracking-widest flex-shrink-0 px-1.5 py-0.5 rounded"
              style={{
                color: statusColor,
                backgroundColor: `${statusColor}14`,
              }}
            >
              {session.status}
            </span>
          </div>
          <div className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
            {session.query}
          </div>
        </div>

        {/* Right: claim count + timestamp */}
        <div className="flex-shrink-0 text-right">
          <div className="font-mono tabular-nums text-sm text-black">
            {formatNumber(session.claim_count || 0)}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-gray-400">
            FINDINGS
          </div>
        </div>

        {/* Far right: relative time */}
        <div className="flex-shrink-0 text-[10px] text-gray-300 font-mono tabular-nums w-14 text-right">
          {relativeTime(session.created_at)}
        </div>
      </div>
    </button>
  );
});

// --- Breadcrumb Nav ---

interface BreadcrumbNavProps {
  breadcrumb: string[];
  itemCount: number;
  canGoBack: boolean;
  onBack: () => void;
  onBreadcrumbClick: (index: number) => void;
}

const BreadcrumbNav = memo(function BreadcrumbNav({
  breadcrumb,
  itemCount,
  canGoBack,
  onBack,
  onBreadcrumbClick,
}: BreadcrumbNavProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={onBack}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition-colors duration-150 p-1 -m-1 rounded hover:bg-gray-100"
              aria-label="Go back"
            >
              &larr;
            </button>
          )}
          <div className="flex items-center gap-1 text-xs">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">/</span>}
                <button
                  onClick={() => onBreadcrumbClick(i)}
                  className={`uppercase tracking-widest transition-colors duration-150 px-1 rounded hover:bg-gray-100 ${
                    i === breadcrumb.length - 1
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
        <div className="text-xs text-gray-400 font-mono tabular-nums">
          {formatNumber(itemCount)} items
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

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

  // URL state integration for browser back/forward
  const handleUrlNavigate = useCallback((state: { level: DrillLevel; templateId: string | null; topicId: string | null }) => {
    setDrill({
      level: state.level,
      templateId: state.templateId ?? undefined,
      topicId: state.topicId ?? undefined,
    });
    interactionRef.current?.setView({ offsetX: 0, offsetY: 0 }, true);
  }, []);

  useMapNavigation({
    drillState: {
      level: drill.level,
      focusedTemplateId: drill.templateId ?? null,
      focusedTopicId: drill.topicId ?? null,
      breadcrumbs: [],
    },
    onNavigate: handleUrlNavigate,
  });

  const {
    topics,
    fetchTopics,
    fetchSessionsByTemplate,
    fetchSessionsByTopic,
    templatePagination,
    topicPagination,
  } = useAppStore();
  const reducedMotion = useReducedMotion();

  // Container size for responsive layout
  const [containerWidth, setContainerWidth] = useState(1200);

  // Loading state for lazy loading
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Track container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
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
      const items: Array<{
        id: string;
        type: 'topic';
        label: string;
        description?: string;
        count: number;
        sessions: ResearchSession[];
        topic?: TopicWithSessions;
      }> = templateTopics.map((topic) => ({
        id: topic.id,
        type: 'topic' as const,
        label: topic.name,
        description: topic.description,
        count:
          topic.sessions?.filter((s) => s.template_type === templateId).length || 0,
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
          topic: undefined,
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
  const stats = useMemo(
    () => ({
      sessions: sessions.length,
      templates: templates.length,
      findings: sessions.reduce((sum, s) => sum + (s.claim_count || 0), 0),
      sources: sessions.reduce((sum, s) => sum + (s.source_count || 0), 0),
    }),
    [sessions, templates]
  );

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

  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      if (index === 0) {
        setDrill({ level: 'overview' });
      } else if (index === 1 && drill.templateId) {
        setDrill({ level: 'template', templateId: drill.templateId });
      }
      interactionRef.current?.setView({ offsetX: 0, offsetY: 0 }, true);
    },
    [drill.templateId]
  );

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

  const zoomLevelName = getSwissZoomLevelName(view.scale);

  // Grid column style based on drill level
  const gridStyle = useMemo((): React.CSSProperties => {
    if (drill.level === 'overview') {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 1,
        width: containerWidth,
      };
    }
    if (drill.level === 'template') {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 1,
        width: containerWidth,
      };
    }
    // topic level: single column list
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 0,
      width: Math.min(700, containerWidth),
      margin: '0 auto',
    };
  }, [drill.level, containerWidth]);

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
          {/* Stats header - overview only */}
          {drill.level === 'overview' && (
            <div style={{ width: containerWidth }}>
              <StatsHeader
                sessions={sessions}
                templates={templates}
                grouped={grouped}
                stats={stats}
              />
            </div>
          )}

          {/* Grid with bg-black for 1px grid lines */}
          <div
            className={drill.level !== 'topic' ? 'bg-black' : ''}
            style={
              drill.level === 'topic'
                ? { width: containerWidth, display: 'flex', justifyContent: 'center' }
                : { width: containerWidth }
            }
          >
            <div style={gridStyle}>
              {/* Overview: Template cards */}
              {drill.level === 'overview' &&
                viewData.items.map((item) => (
                  <TemplateCard
                    key={item.id}
                    templateId={item.id}
                    sessions={item.sessions}
                    onClick={() => handleItemClick(item)}
                  />
                ))}

              {/* Template level: Topic cards */}
              {drill.level === 'template' &&
                drill.templateId &&
                viewData.items.map((item) => (
                  <TopicCard
                    key={item.id}
                    topicId={item.id}
                    templateId={drill.templateId!}
                    name={item.label}
                    description={'description' in item ? item.description : undefined}
                    sessions={item.sessions}
                    onClick={() => handleItemClick(item)}
                  />
                ))}

              {/* Topic level: Session cards */}
              {drill.level === 'topic' &&
                drill.templateId &&
                viewData.items.map((item) => {
                  const session = 'session' in item ? item.session : undefined;
                  if (!session) return null;
                  return (
                    <SessionCard
                      key={item.id}
                      session={session}
                      templateId={drill.templateId!}
                      onClick={() => handleItemClick(item)}
                    />
                  );
                })}
            </div>
          </div>

          {/* Load more button */}
          {hasMoreData && (
            <div
              style={{ width: drill.level === 'topic' ? Math.min(700, containerWidth) : containerWidth }}
              className={drill.level === 'topic' ? 'mx-auto' : ''}
            >
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full py-3 bg-white hover:bg-gray-50 border-t border-gray-200 text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors duration-150 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none"
              >
                {isLoadingMore ? 'LOADING...' : 'LOAD MORE'}
              </button>
            </div>
          )}

          {/* Empty state */}
          {viewData.items.length === 0 && !isLoadingMore && (
            <div
              className="bg-white flex items-center justify-center"
              style={{ width: containerWidth, height: 200 }}
            >
              <span className="text-[11px] uppercase tracking-widest text-gray-300">
                NO ITEMS
              </span>
            </div>
          )}

          {/* Loading state */}
          {isLoadingMore && viewData.items.length === 0 && (
            <div
              className="bg-white flex items-center justify-center"
              style={{ width: containerWidth, height: 200 }}
            >
              <span className="text-[11px] uppercase tracking-widest text-gray-400 animate-pulse">
                LOADING...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fixed UI overlays */}

      {/* Breadcrumb navigation */}
      <BreadcrumbNav
        breadcrumb={viewData.breadcrumb}
        itemCount={viewData.items.length}
        canGoBack={drill.level !== 'overview'}
        onBack={handleBack}
        onBreadcrumbClick={handleBreadcrumbClick}
      />

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
      <div className="absolute bottom-3 left-3 text-gray-300 text-[10px] font-mono">
        <span className="hidden sm:inline">
          WASD: Pan &bull; Scroll: Zoom &bull; Click: Open
        </span>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-3 right-3 text-gray-300 text-[10px] font-mono tabular-nums">
        {zoomLevelName} &bull; {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}
