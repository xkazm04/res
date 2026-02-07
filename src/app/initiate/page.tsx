'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Twitter, Globe, Newspaper, Cpu, TrendingUp,
  Shield, Zap, MessageCircle, RefreshCw, List
} from 'lucide-react';
import { SourceColumn } from '@/src/components/initiate/SourceColumn';
import { ScrollIndicator } from '@/src/components/initiate/ScrollIndicator';
import { QueueDashboard } from '@/src/components/initiate/QueueDashboard';
import { InitiateThemeProvider, initiateTheme } from '@/src/components/initiate/InitiateTheme';
import { SOURCES } from '@/src/lib/sources';
import { supabase } from '@/src/lib/supabase';
import { TopicStatus, TOPIC_STATUSES } from '@/src/types/research';
import { useStatusPolling, TopicStatusUpdate } from '@/src/hooks/useStatusPolling';
import { useAppStore } from '@/src/stores/appStore';

// Map source slugs to Lucide icons
const ICON_MAP: Record<string, typeof Twitter> = {
  twitter: Twitter,
  bbc: Globe,
  reuters: Newspaper,
  techcrunch: Cpu,
  bloomberg: TrendingUp,
  nyt: Newspaper,
  guardian: Shield,
  'ap-news': Zap,
  'al-jazeera': Globe,
  reddit: MessageCircle,
};

// Topic type from database
interface Topic {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  discoveredAt: string;
  updatedAt?: string;
  sessionId?: string;
  signals?: string[];
  researchQuery?: string;
  suggestedTemplate?: string;
  claim?: string;
  sourceBias?: string;
  debunkable?: number;
}

// Database row shape
interface TopicRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  discovered_at: string;
  updated_at: string;
  session_id: string | null;
  signals: string[] | null;
  research_query: string | null;
  suggested_template: string | null;
  claim: string | null;
  source_bias: string | null;
  debunkable: number | null;
}

// Transform database row to UI topic
function transformTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: (TOPIC_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as TopicStatus)
      : 'new',
    discoveredAt: row.discovered_at,
    updatedAt: row.updated_at,
    sessionId: row.session_id ?? undefined,
    signals: row.signals ?? undefined,
    researchQuery: row.research_query ?? undefined,
    suggestedTemplate: row.suggested_template ?? undefined,
    claim: row.claim ?? undefined,
    sourceBias: row.source_bias ?? undefined,
    debunkable: row.debunkable ?? undefined,
  };
}

function InitiatePageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topicsBySource, setTopicsBySource] = useState<Record<string, Topic[]>>({});
  const [discoveringSource, setDiscoveringSource] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Get openReportModal from appStore for viewing completed research
  const openReportModal = useAppStore((state) => state.openReportModal);

  // Fetch topics for a specific source
  const fetchTopicsForSource = useCallback(async (sourceSlug: string) => {
    const { data: source } = await supabase
      .from('data_sources')
      .select('id')
      .eq('slug', sourceSlug)
      .single();

    if (source) {
      const { data: topics } = await supabase
        .from('research_topics')
        .select('id, title, description, status, discovered_at, updated_at, session_id, signals, research_query, suggested_template, claim, source_bias, debunkable')
        .eq('source_id', source.id)
        .neq('status', 'deleted')
        .order('discovered_at', { ascending: false });

      if (topics) {
        setTopicsBySource(prev => ({
          ...prev,
          [sourceSlug]: topics.map(transformTopic),
        }));
      }
    }
  }, []);

  // Load initial topics on mount
  useEffect(() => {
    SOURCES.forEach(source => {
      fetchTopicsForSource(source.slug);
    });
  }, [fetchTopicsForSource]);

  // Handle successful topic discovery
  const handleTopicsDiscovered = useCallback(async (slug: string, _count: number) => {
    await fetchTopicsForSource(slug);
  }, [fetchTopicsForSource]);

  // Handle discovery error
  const handleDiscoveryError = useCallback((_slug: string, error: string) => {
    alert(`Discovery failed: ${error}`);
  }, []);

  // Handle download (not yet implemented - stub for SourceColumn prop)
  const handleDownload = useCallback((_slug: string) => {}, []);

  // Handle discover from empty state
  const handleDiscover = useCallback((slug: string) => {
    setDiscoveringSource(slug);
  }, []);

  // Handle topic status change (optimistic update)
  const handleTopicStatusChange = useCallback(
    (id: string, status: TopicStatus, sessionId?: string) => {
      setTopicsBySource((prev) => {
        const updated = { ...prev };
        for (const slug of Object.keys(updated)) {
          const topics = updated[slug];
          const topicIndex = topics.findIndex((t) => t.id === id);
          if (topicIndex !== -1) {
            updated[slug] = topics.map((t) =>
              t.id === id ? { ...t, status, sessionId: sessionId || t.sessionId } : t
            );
            break;
          }
        }
        return updated;
      });
    },
    []
  );

  // Handle topic removal (after reject/delete)
  const handleTopicRemoved = useCallback((id: string) => {
    setTopicsBySource((prev) => {
      const updated = { ...prev };
      for (const slug of Object.keys(updated)) {
        const topics = updated[slug];
        const hasTopicIndex = topics.findIndex((t) => t.id === id);
        if (hasTopicIndex !== -1) {
          // Filter out the removed topic
          updated[slug] = topics.filter((t) => t.id !== id);
          break;
        }
      }
      return updated;
    });
  }, []);

  // Handle accept (stub - topic is already accepted via TopicCard's API call)
  const handleAccept = useCallback((_id: string) => {}, []);

  // Handle viewing completed research session
  const handleViewSession = useCallback(
    (sessionId: string) => {
      openReportModal(sessionId);
    },
    [openReportModal]
  );

  // Compute active topics count
  const activeTopicsCount = Object.values(topicsBySource).reduce(
    (count, topics) =>
      count + topics.filter((t) => t.status === 'queued' || t.status === 'researching').length,
    0
  );
  const hasActiveTopics = activeTopicsCount > 0;

  // Handle status updates from polling
  const handleStatusUpdate = useCallback((updates: TopicStatusUpdate[]) => {
    // Build a lookup map for O(1) update matching
    const updateMap = new Map(updates.map((u) => [u.id, u]));

    setTopicsBySource((prev) => {
      let changed = false;
      const next: Record<string, Topic[]> = {};

      for (const slug of Object.keys(prev)) {
        const topics = prev[slug];
        const newTopics = topics.map((t) => {
          const update = updateMap.get(t.id);
          if (update) {
            changed = true;
            return {
              ...t,
              status: update.status,
              updatedAt: update.updatedAt,
              sessionId: update.sessionId || t.sessionId,
            };
          }
          return t;
        });
        next[slug] = newTopics;
      }

      return changed ? next : prev;
    });
  }, []);

  // Activate polling when there are active topics
  useStatusPolling(hasActiveTopics, handleStatusUpdate);

  // Manual refresh function
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAllActiveTopics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/topics/status?active=true');
      if (response.ok) {
        const data = await response.json();
        if (data.topics && data.topics.length > 0) {
          const updates: TopicStatusUpdate[] = data.topics.map((topic: { id: string; status: string; updatedAt: string; sessionId?: string }) => ({
            id: topic.id,
            status: topic.status as TopicStatus,
            updatedAt: topic.updatedAt,
            sessionId: topic.sessionId,
          }));
          handleStatusUpdate(updates);
        }
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [handleStatusUpdate]);

  // Count total topics to review
  const totalToReview = Object.values(topicsBySource).reduce(
    (count, topics) => count + topics.filter((t) => t.status === 'new').length,
    0
  );

  return (
    <main className="h-screen flex flex-col">
      {/* Minimal Header */}
      <header className={`
        h-[44px] flex-shrink-0
        flex items-center justify-between px-4
        ${initiateTheme.bgSecondary}
        border-b ${initiateTheme.borderSubtle}
      `}>
        <div className="flex items-center gap-3">
          <h1 className={`text-sm font-medium ${initiateTheme.text}`}>
            Initiate
          </h1>
          {totalToReview > 0 && (
            <span className={`text-xs ${initiateTheme.textMuted}`}>
              {totalToReview} to review
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Queue button */}
          <button
            onClick={() => setIsQueueOpen(true)}
            className={`
              relative flex items-center gap-1.5 px-2 py-1
              text-xs rounded
              ${initiateTheme.buttonSecondary}
              transition-colors
            `}
            title="View queue"
          >
            <List size={12} />
            Queue
            {activeTopicsCount > 0 && (
              <span className={`
                ml-1 min-w-[16px] h-[16px]
                flex items-center justify-center
                text-[9px] font-semibold
                bg-cyan-500 text-slate-950 rounded-full
              `}>
                {activeTopicsCount}
              </span>
            )}
          </button>

          {hasActiveTopics && (
            <button
              onClick={refreshAllActiveTopics}
              disabled={isRefreshing}
              className={`
                p-1.5 rounded
                ${initiateTheme.textMuted}
                hover:text-slate-100
                ${initiateTheme.bgHover}
                transition-colors
                disabled:opacity-50
              `}
              title="Refresh"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          )}

          {/* Keyboard hints */}
          <div className={`
            hidden sm:flex items-center gap-1
            text-[9px] ${initiateTheme.textMuted}
          `}>
            <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">J</kbd>
            <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">K</kbd>
            <span>nav</span>
            <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 ml-1">A</kbd>
            <span>accept</span>
            <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 ml-1">R</kbd>
            <span>reject</span>
          </div>
        </div>
      </header>

      {/* Source Columns Grid */}
      <div
        ref={containerRef}
        className={`
          initiate-grid-container flex-1 overflow-x-auto
          ${initiateTheme.scrollbar}
        `}
      >
        {SOURCES.map((source, index) => (
          <SourceColumn
            key={source.slug}
            name={source.name}
            slug={source.slug}
            icon={ICON_MAP[source.slug] || Globe}
            color={source.color}
            isFirst={index === 0}
            topics={topicsBySource[source.slug] || []}
            onDownload={handleDownload}
            onDiscover={() => handleDiscover(source.slug)}
            onTopicsDiscovered={handleTopicsDiscovered}
            onDiscoveryError={handleDiscoveryError}
            isDiscovering={discoveringSource === source.slug}
            onTopicStatusChange={handleTopicStatusChange}
            onTopicRemoved={handleTopicRemoved}
            onAccept={handleAccept}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator
        containerRef={containerRef}
        totalColumns={SOURCES.length}
      />

      {/* Queue Dashboard */}
      <QueueDashboard
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        topics={Object.entries(topicsBySource).flatMap(([sourceSlug, topics]) =>
          topics.map((t) => ({ ...t, sourceSlug }))
        )}
      />
    </main>
  );
}

export default function InitiatePage() {
  return (
    <InitiateThemeProvider>
      <InitiatePageContent />
    </InitiateThemeProvider>
  );
}
