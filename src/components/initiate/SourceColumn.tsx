'use client';

import { LucideIcon } from 'lucide-react';
import { VirtualizedTopicList } from './VirtualizedTopicList';
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
    userVerdict?: 'accepted' | 'rejected';
  }>;
  onTopicStatusChange?: (id: string, status: TopicStatus, sessionId?: string) => void;
  onVerdictChange?: (id: string, verdict: 'accepted' | 'rejected') => void;
}

export function SourceColumn({
  name,
  slug,
  icon: Icon,
  color,
  isFirst = false,
  topics = [],
  onTopicStatusChange,
  onVerdictChange,
}: SourceColumnProps) {
  const undecided = topics.filter(t => !t.userVerdict && t.status !== 'deleted');
  const newCount = undecided.filter(t => t.status === 'new').length;
  const activeCount = undecided.filter(t => t.status === 'queued' || t.status === 'researching').length;

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
          <div
            className="w-6 h-6 rounded flex items-center justify-center relative"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={13} style={{ color }} />
            {activeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-sm font-medium ${initiateTheme.text}`}>
              {name}
            </span>
            <span className={`text-[10px] ${initiateTheme.textMuted}`}>
              {undecided.length}
            </span>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-hidden">
        <VirtualizedTopicList
          items={topics}
          onTopicStatusChange={onTopicStatusChange}
          onVerdictChange={onVerdictChange}
        />
      </div>

      {/* Minimal footer */}
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
