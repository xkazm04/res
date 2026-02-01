'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Twitter, Globe, Newspaper, Cpu, TrendingUp,
  Shield, Zap, MessageCircle, RefreshCw, List
} from 'lucide-react';
import { SourceColumn } from '@/src/components/initiate/SourceColumn';
import { ScrollIndicator } from '@/src/components/initiate/ScrollIndicator';
import { QueueDashboard } from '@/src/components/initiate/QueueDashboard';
import { SOURCES } from '@/src/lib/sources';
import { supabase } from '@/src/lib/supabase';
import { TopicStatus } from '@/src/types/research';
import { useStatusPolling, TopicStatusUpdate } from '@/src/hooks/useStatusPolling';
import { useAppStore } from '@/src/stores/appStore';

// Map source slugs to Lucide icons (icons can't be serialized in SOURCES)
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
}

// Transform database row to UI topic
function transformTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as TopicStatus,
    discoveredAt: row.discovered_at,
    updatedAt: row.updated_at,
    sessionId: row.session_id ?? undefined,
  };
}

export default function InitiatePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topicsBySource, setTopicsBySource] = useState<Record<string, Topic[]>>({});
  const [discoveringSource, setDiscoveringSource] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Get openReportModal from appStore for viewing completed research
  const openReportModal = useAppStore((state) => state.openReportModal);

  // Fetch topics for a specific source
  const fetchTopicsForSource = useCallback(async (sourceSlug: string) => {
    // Get source ID from slug
    const { data: source } = await supabase
      .from('data_sources')
      .select('id')
      .eq('slug', sourceSlug)
      .single();

    if (source) {
      const { data: topics } = await supabase
        .from('research_topics')
        .select('id, title, description, status, discovered_at, updated_at, session_id')
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
  const handleTopicsDiscovered = useCallback(async (slug: string, count: number) => {
    // Refresh topics for this source
    await fetchTopicsForSource(slug);

    // Log success
    console.log(`Discovered ${count} topic${count !== 1 ? 's' : ''} from ${slug}`);
  }, [fetchTopicsForSource]);

  // Handle discovery error
  const handleDiscoveryError = useCallback((slug: string, error: string) => {
    console.error(`Discovery failed for ${slug}: ${error}`);
    // Show alert for user feedback (can upgrade to toast library later)
    alert(`Discovery failed: ${error}`);
  }, []);

  // Handle download (placeholder)
  const handleDownload = useCallback((slug: string) => {
    console.log(`Download requested for ${slug}`);
  }, []);

  // Handle discover from empty state (triggers same flow as button)
  const handleDiscover = useCallback((slug: string) => {
    setDiscoveringSource(slug);
  }, []);

  // Handle topic status change (optimistic update)
  const handleTopicStatusChange = useCallback(
    (id: string, status: TopicStatus, sessionId?: string) => {
      setTopicsBySource((prev) => {
        const updated = { ...prev };
        // Find which source has this topic and update it
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
      // Log for debugging
      console.log(`Topic ${id} status changed to ${status}${sessionId ? `, session: ${sessionId}` : ''}`);
    },
    []
  );

  // Handle viewing completed research session
  const handleViewSession = useCallback(
    (sessionId: string) => {
      openReportModal(sessionId);
    },
    [openReportModal]
  );

  // Handle retrying failed research
  const handleRetry = useCallback(
    async (topicId: string) => {
      try {
        const res = await fetch(`/api/topics/${topicId}/research`, {
          method: 'POST',
        });

        if (res.status === 202) {
          const data = await res.json();
          // Optimistic update to queued status
          handleTopicStatusChange(topicId, 'queued', data.session_id);
        } else if (res.status === 409) {
          const data = await res.json();
          alert(`Research already ${data.status} for this topic.`);
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to retry research');
        }
      } catch (error) {
        console.error('Retry failed:', error);
        alert('Failed to retry research. Please try again.');
      }
    },
    [handleTopicStatusChange]
  );

  // Compute active topics count and existence
  const activeTopicsCount = Object.values(topicsBySource).reduce(
    (count, topics) =>
      count + topics.filter((t) => t.status === 'queued' || t.status === 'researching').length,
    0
  );
  const hasActiveTopics = activeTopicsCount > 0;

  // Handle status updates from polling
  const handleStatusUpdate = useCallback((updates: TopicStatusUpdate[]) => {
    setTopicsBySource((prev) => {
      const updated = { ...prev };
      for (const update of updates) {
        // Find which source has this topic and update it
        for (const slug of Object.keys(updated)) {
          const topics = updated[slug];
          const topicIndex = topics.findIndex((t) => t.id === update.id);
          if (topicIndex !== -1) {
            updated[slug] = topics.map((t) =>
              t.id === update.id
                ? {
                    ...t,
                    status: update.status,
                    updatedAt: update.updatedAt,
                    sessionId: update.sessionId || t.sessionId,
                  }
                : t
            );
            break;
          }
        }
      }
      return updated;
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

  return (
    <main className="h-screen bg-[var(--bg-primary)]">
      {/* Page Header */}
      <header className="h-[60px] flex items-center justify-between px-6 border-b border-[var(--border-default)]">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Research Initiation
        </h1>
        <div className="flex items-center gap-4">
          {/* Queue button */}
          <button
            onClick={() => setIsQueueOpen(true)}
            className="
              relative flex items-center gap-1.5 px-2 py-1
              text-sm text-[var(--text-secondary)]
              hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-hover)]
              rounded transition-colors
            "
            title="View research queue"
          >
            <List size={14} />
            Queue
            {activeTopicsCount > 0 && (
              <span className="
                absolute -top-1 -right-1
                min-w-[18px] h-[18px]
                flex items-center justify-center
                px-1 rounded-full
                text-[10px] font-medium
                bg-[var(--blue-primary)] text-white
              ">
                {activeTopicsCount}
              </span>
            )}
          </button>
          {hasActiveTopics && (
            <button
              onClick={refreshAllActiveTopics}
              disabled={isRefreshing}
              className="
                flex items-center gap-1.5 px-2 py-1
                text-sm text-[var(--text-secondary)]
                hover:text-[var(--text-primary)]
                hover:bg-[var(--bg-hover)]
                rounded transition-colors
                disabled:opacity-50
              "
              title="Refresh active topic statuses"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
          <div className="text-sm text-[var(--text-muted)]">
            {SOURCES.length} sources
          </div>
        </div>
      </header>

      {/* 10-Column Grid */}
      <div ref={containerRef} className="initiate-grid-container">
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
            onViewSession={handleViewSession}
            onRetry={handleRetry}
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
