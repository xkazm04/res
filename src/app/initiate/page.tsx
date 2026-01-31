'use client';

import {
  Twitter, Globe, Newspaper, Cpu, TrendingUp,
  Shield, Zap, MessageCircle
} from 'lucide-react';
import { SourceColumn } from '@/src/components/initiate/SourceColumn';
import { SOURCES } from '@/src/lib/sources';

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

export default function InitiatePage() {
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
      <div className="initiate-grid-container">
        {SOURCES.map((source, index) => (
          <SourceColumn
            key={source.slug}
            name={source.name}
            slug={source.slug}
            icon={ICON_MAP[source.slug] || Globe}
            color={source.color}
            isFirst={index === 0}
          />
        ))}
      </div>
    </main>
  );
}
