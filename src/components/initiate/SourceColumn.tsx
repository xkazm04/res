'use client';

import { LucideIcon, Download } from 'lucide-react';
import { VirtualizedTopicList } from './VirtualizedTopicList';
import { DiscoverButton } from './DiscoverButton';
import { TopicStatus } from '@/src/types/research';
import { initiateTheme } from './InitiateTheme';

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
    updatedAt?: string;
    sessionId?: string;
    signals?: string[];
    researchQuery?: string;
    suggestedTemplate?: string;
    claim?: string;
    sourceBias?: string;
    debunkable?: number;
  }>;
  onDownload?: (slug: string) => void;
  onDiscover?: () => void;
  onTopicsDiscovered?: (slug: string, count: number) => void;
  onDiscoveryError?: (slug: string, error: string) => void;
  isDiscovering?: boolean;
  onTopicStatusChange?: (id: string, status: TopicStatus, sessionId?: string) => void;
  onTopicRemoved?: (id: string) => void;
  onAccept?: (id: string) => void;
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
  onTopicRemoved,
  onAccept,
}: SourceColumnProps) {
  // Count topics by status (excluding deleted)
  const visibleTopics = topics.filter(t => t.status !== 'deleted');
  const newCount = visibleTopics.filter(t => t.status === 'new').length;
  const activeCount = visibleTopics.filter(t => t.status === 'queued' || t.status === 'researching').length;

  return (
    <div
      className={`
        flex flex-col h-full min-w-[280px] max-w-[320px]
        border-r ${initiateTheme.border}
        ${initiateTheme.bg}
        ${isFirst ? 'sticky-first-column' : ''}
      `}
      data-source={slug}
    >
      {/* Column Header - Compact */}
      <div className={`
        flex items-center justify-between px-3 py-2
        border-b ${initiateTheme.borderSubtle}
        ${initiateTheme.bgSecondary}
      `}>
        <div className="flex items-center gap-2">
          {/* Icon with source color */}
          <div
            className="w-6 h-6 rounded flex items-center justify-center relative"
            style={{
              backgroundColor: `${color}15`,
            }}
          >
            <Icon size={13} style={{ color }} />
            {activeCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-pulse"
              />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-sm font-medium ${initiateTheme.text}`}>
              {name}
            </span>
            <span className={`text-[10px] ${initiateTheme.textMuted}`}>
              {visibleTopics.length}
            </span>
          </div>
        </div>

        {/* Compact action buttons */}
        <div className="flex items-center gap-0.5">
          <DiscoverButton
            sourceSlug={slug}
            onDiscovered={(count) => onTopicsDiscovered?.(slug, count)}
            onError={(error) => onDiscoveryError?.(slug, error)}
            disabled={isDiscovering}
          />
          <button
            onClick={() => onDownload?.(slug)}
            className={`
              p-1.5 rounded
              ${initiateTheme.textMuted}
              hover:text-slate-100
              ${initiateTheme.bgHover}
              transition-colors
            `}
            title="Download"
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* Column Content */}
      <div className={`flex-1 overflow-hidden`}>
        <VirtualizedTopicList
          items={topics}
          onDiscover={onDiscover}
          onTopicStatusChange={onTopicStatusChange}
          onTopicRemoved={onTopicRemoved}
          onAccept={onAccept}
        />
      </div>

      {/* Minimal footer - only show if there are new items */}
      {newCount > 0 && (
        <div className={`
          px-3 py-1.5
          border-t ${initiateTheme.borderSubtle}
          flex items-center gap-2
        `}>
          <span className="text-[10px] text-cyan-400/70">
            {newCount} to review
          </span>
        </div>
      )}
    </div>
  );
}
