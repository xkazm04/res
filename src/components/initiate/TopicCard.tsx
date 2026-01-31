'use client';

import { formatRelativeTime } from '@/src/lib/utils';
import { TopicStatus } from '@/src/types/research';

interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    description?: string;
    status: TopicStatus;
    discoveredAt: string;
  };
  selected: boolean;
  onSelect: (id: string) => void;
  onAction: (id: string, action: 'menu' | 'delete' | 'research') => void;
}

export function TopicCard({ topic, selected, onSelect, onAction }: TopicCardProps) {
  return (
    <div
      className={`
        px-3 py-2
        border-b border-[var(--border-subtle)]
        hover:bg-[var(--bg-hover)]
        transition-colors
        cursor-pointer
      `}
    >
      {/* Title - bold, 2 lines max */}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-tight">
        {topic.title}
      </h3>

      {/* Snippet - 3 lines max */}
      {topic.description && (
        <p className="text-xs text-[var(--text-muted)] line-clamp-3 mt-1 leading-relaxed">
          {topic.description}
        </p>
      )}

      {/* Footer with timestamp */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">
          {formatRelativeTime(topic.discoveredAt)}
        </span>
      </div>
    </div>
  );
}
