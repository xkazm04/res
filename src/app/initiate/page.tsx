'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Twitter, Globe, Newspaper, Cpu, TrendingUp,
  Shield, Zap, MessageCircle
} from 'lucide-react';
import { SourceColumn } from '@/src/components/initiate/SourceColumn';
import { ScrollIndicator } from '@/src/components/initiate/ScrollIndicator';
import { SOURCES } from '@/src/lib/sources';
import { supabase } from '@/src/lib/supabase';
import { TopicStatus } from '@/src/types/research';

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
}

// Database row shape
interface TopicRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  discovered_at: string;
}

// Transform database row to UI topic
function transformTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as TopicStatus,
    discoveredAt: row.discovered_at,
  };
}

export default function InitiatePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topicsBySource, setTopicsBySource] = useState<Record<string, Topic[]>>({});
  const [discoveringSource, setDiscoveringSource] = useState<string | null>(null);

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
        .select('id, title, description, status, discovered_at')
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
              t.id === id ? { ...t, status } : t
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

  return (
    <main className="h-screen bg-[var(--bg-primary)]">
      {/* Page Header */}
      <header className="h-[60px] flex items-center justify-between px-6 border-b border-[var(--border-default)]">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Research Initiation
        </h1>
        <div className="text-sm text-[var(--text-muted)]">
          {SOURCES.length} sources
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
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator
        containerRef={containerRef}
        totalColumns={SOURCES.length}
      />
    </main>
  );
}
