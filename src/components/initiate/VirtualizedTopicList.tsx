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
  updatedAt?: string;
  sessionId?: string;
}

interface VirtualizedTopicListProps {
  items: TopicItem[];
  estimatedItemHeight?: number;
  onDiscover?: () => void;
  onTopicAction?: (id: string, action: 'menu' | 'delete' | 'research') => void;
  onTopicStatusChange?: (id: string, status: TopicStatus, sessionId?: string) => void;
  onViewSession?: (sessionId: string) => void;
  onRetry?: (topicId: string) => void;
}

export function VirtualizedTopicList({
  items,
  estimatedItemHeight = 96,
  onDiscover,
  onTopicAction,
  onTopicStatusChange,
  onViewSession,
  onRetry,
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
    async (id: string, action: 'menu' | 'delete' | 'research') => {
      if (action === 'research') {
        try {
          const res = await fetch(`/api/topics/${id}/research`, {
            method: 'POST',
          });

          if (res.status === 202) {
            const data = await res.json();
            // Notify parent of status change for optimistic update
            onTopicStatusChange?.(id, 'queued', data.session_id);
          } else if (res.status === 409) {
            const data = await res.json();
            alert(`Research already ${data.status} for this topic.`);
          } else {
            const data = await res.json();
            alert(data.error || 'Failed to initiate research');
          }
        } catch (error) {
          console.error('Research initiation failed:', error);
          alert('Failed to initiate research. Please try again.');
        }
        return;
      }

      // Existing action handling
      console.log(`Topic action: ${action} on ${id}`);
      onTopicAction?.(id, action);
    },
    [onTopicAction, onTopicStatusChange]
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
                onViewSession={onViewSession}
                onRetry={onRetry}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
