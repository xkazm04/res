'use client';

import { useRef } from 'react';
import {
  Twitter, Globe, Newspaper, Cpu, TrendingUp,
  Shield, Zap, MessageCircle
} from 'lucide-react';
import { SourceColumn } from '@/src/components/initiate/SourceColumn';
import { ScrollIndicator } from '@/src/components/initiate/ScrollIndicator';
import { SOURCES } from '@/src/lib/sources';
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

// Mock data generator for performance testing (120 items per column)
function generateMockTopics(sourceSlug: string, count: number = 120) {
  const statuses: TopicStatus[] = ['new', 'queued', 'researching', 'completed', 'failed'];
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `${sourceSlug}-topic-${i}`,
    title: `Topic ${i + 1}: Breaking news about ${sourceSlug} developments in technology sector`,
    description: `This is a summary of topic ${i + 1} from ${sourceSlug}. It contains important information that users might want to research further.`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    // Spread timestamps: newest at top, oldest at bottom
    discoveredAt: new Date(now - i * 3600000 * (Math.random() * 2 + 0.5)).toISOString(),
  }));
}

export default function InitiatePage() {
  const containerRef = useRef<HTMLDivElement>(null);
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
            topics={generateMockTopics(source.slug)}
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
