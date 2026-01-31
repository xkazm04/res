'use client';

import { useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TopicStatus } from '@/src/types/research';
import { EmptyState } from './EmptyState';
import { TopicCard } from './TopicCard';

interface TopicItem {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  discoveredAt: string;
}

interface VirtualizedTopicListProps {
  items: TopicItem[];
  estimatedItemHeight?: number;
  onDiscover?: () => void;
  onTopicAction?: (id: string, action: 'menu' | 'delete' | 'research') => void;
}

export function VirtualizedTopicList({
  items,
  estimatedItemHeight = 96,
  onDiscover,
  onTopicAction,
}: VirtualizedTopicListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan: 5,
    // CRITICAL: Required for React 19 compatibility
    useFlushSync: false,
  });

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAction = useCallback(
    (id: string, action: 'menu' | 'delete' | 'research') => {
      // Log for now; delete wiring in Task 4
      console.log(`Topic action: ${action} on ${id}`);
      onTopicAction?.(id, action);
    },
    [onTopicAction]
  );

  if (items.length === 0) {
    return (
      <EmptyState
        action={onDiscover ? { label: 'Discover Topics', onClick: onDiscover } : undefined}
      />
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
              <TopicCard
                topic={item}
                selected={selectedIds.has(item.id)}
                onSelect={handleSelect}
                onAction={handleAction}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
