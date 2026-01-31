'use client';

import { LucideIcon, Download } from 'lucide-react';
import { VirtualizedTopicList } from './VirtualizedTopicList';
import { DiscoverButton } from './DiscoverButton';
import { TopicStatus } from '@/src/types/research';

interface SourceColumnProps {
  name: string;
  slug: string;
  icon: LucideIcon;
  color: string;
  isFirst?: boolean;
  topics?: Array<{
    id: string;
    title: string;
    description?: string;
    status: TopicStatus;
    discoveredAt: string;
  }>;
  onDownload?: (slug: string) => void;
  onDiscover?: () => void;
  onTopicsDiscovered?: (slug: string, count: number) => void;
  onDiscoveryError?: (slug: string, error: string) => void;
  isDiscovering?: boolean;
  onTopicStatusChange?: (id: string, status: TopicStatus, sessionId?: string) => void;
}

export function SourceColumn({
  name,
  slug,
  icon: Icon,
  color,
  isFirst = false,
  topics = [],
  onDownload,
  onDiscover,
  onTopicsDiscovered,
  onDiscoveryError,
  isDiscovering = false,
  onTopicStatusChange,
}: SourceColumnProps) {
  return (
    <div
      className={`
        flex flex-col h-full min-w-[280px] max-w-[320px]
        border-r border-[var(--border-default)]
        bg-[var(--bg-primary)]
        ${isFirst ? 'sticky-first-column' : ''}
      `}
      data-source={slug}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DiscoverButton
            sourceSlug={slug}
            onDiscovered={(count) => onTopicsDiscovered?.(slug, count)}
            onError={(error) => onDiscoveryError?.(slug, error)}
            disabled={isDiscovering}
          />
          <button
            onClick={() => onDownload?.(slug)}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Download topics"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-hidden">
        <VirtualizedTopicList
          items={topics}
          onDiscover={onDiscover}
          onTopicStatusChange={onTopicStatusChange}
        />
      </div>
    </div>
  );
}
