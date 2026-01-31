'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TopicStatus } from '@/src/types/research';

interface TopicItem {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
}

interface VirtualizedTopicListProps {
  items: TopicItem[];
  estimatedItemHeight?: number;
}

export function VirtualizedTopicList({
  items,
  estimatedItemHeight = 80
}: VirtualizedTopicListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan: 5,
    // CRITICAL: Required for React 19 compatibility
    useFlushSync: false,
  });

  if (items.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--text-muted)]">
        No topics yet. Click Discover to find trending topics.
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={item.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {/* Topic Card Placeholder - Phase 9 will add full TopicCard */}
              <div className="px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors">
                <div className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                  {item.title}
                </div>
                {item.description && (
                  <div className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                    {item.description}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`
                    text-xs px-2 py-0.5 rounded
                    ${item.status === 'new' ? 'bg-[var(--blue-light)] text-[var(--blue-primary)]' : ''}
                    ${item.status === 'queued' ? 'bg-[var(--amber-light)] text-[var(--amber-primary)]' : ''}
                    ${item.status === 'researching' ? 'bg-[var(--blue-light)] text-[var(--blue-primary)]' : ''}
                    ${item.status === 'completed' ? 'bg-[var(--green-light)] text-[var(--green-primary)]' : ''}
                    ${item.status === 'failed' ? 'bg-[var(--red-light)] text-[var(--red-primary)]' : ''}
                  `}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
