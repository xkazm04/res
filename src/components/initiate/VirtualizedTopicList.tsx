'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TopicStatus } from '@/src/types/research';
import { EmptyState } from './EmptyState';
import { TopicCard } from './TopicCard';
import { initiateTheme } from './InitiateTheme';

interface TopicItem {
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
}

interface VirtualizedTopicListProps {
  items: TopicItem[];
  estimatedItemHeight?: number;
  onDiscover?: () => void;
  onTopicStatusChange?: (id: string, status: TopicStatus, sessionId?: string) => void;
  onTopicRemoved?: (id: string) => void;
  onAccept?: (id: string) => void;
}

export function VirtualizedTopicList({
  items,
  estimatedItemHeight = 90,
  onDiscover,
  onTopicStatusChange,
  onTopicRemoved,
  onAccept,
}: VirtualizedTopicListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Filter out deleted items for display
  const visibleItems = items.filter(item => item.status !== 'deleted');

  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan: 5,
    useFlushSync: false,
  });

  // Get index of focused item
  const focusedIndex = focusedId
    ? visibleItems.findIndex(item => item.id === focusedId)
    : -1;

  // Keyboard navigation: J = down, K = up
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        // Move focus down
        if (focusedIndex < visibleItems.length - 1) {
          const nextItem = visibleItems[focusedIndex + 1];
          setFocusedId(nextItem.id);
          // Scroll into view
          virtualizer.scrollToIndex(focusedIndex + 1, { align: 'center' });
        } else if (focusedIndex === -1 && visibleItems.length > 0) {
          // No focus yet, focus first item
          setFocusedId(visibleItems[0].id);
          virtualizer.scrollToIndex(0, { align: 'start' });
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        // Move focus up
        if (focusedIndex > 0) {
          const prevItem = visibleItems[focusedIndex - 1];
          setFocusedId(prevItem.id);
          virtualizer.scrollToIndex(focusedIndex - 1, { align: 'center' });
        }
      } else if (e.key === 'Escape') {
        // Clear focus
        setFocusedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, visibleItems, virtualizer]);

  const handleAccept = useCallback((id: string) => {
    // Move focus to next item before removing
    const currentIndex = visibleItems.findIndex(item => item.id === id);
    if (currentIndex < visibleItems.length - 1) {
      setFocusedId(visibleItems[currentIndex + 1].id);
    } else if (currentIndex > 0) {
      setFocusedId(visibleItems[currentIndex - 1].id);
    } else {
      setFocusedId(null);
    }

    // Notify parent to remove from state (topic is deleted after accept)
    onTopicRemoved?.(id);
  }, [visibleItems, onTopicRemoved]);

  const handleReject = useCallback((id: string) => {
    // Move focus to next item before removing
    const currentIndex = visibleItems.findIndex(item => item.id === id);
    if (currentIndex < visibleItems.length - 1) {
      setFocusedId(visibleItems[currentIndex + 1].id);
    } else if (currentIndex > 0) {
      setFocusedId(visibleItems[currentIndex - 1].id);
    } else {
      setFocusedId(null);
    }

    // Notify parent to remove from state
    onTopicRemoved?.(id);
  }, [visibleItems, onTopicRemoved]);

  const handleFocus = useCallback((id: string) => {
    setFocusedId(id);
  }, []);

  if (visibleItems.length === 0) {
    return (
      <EmptyState
        action={onDiscover ? { label: 'Discover Topics', onClick: onDiscover } : undefined}
      />
    );
  }

  return (
    <div
      ref={parentRef}
      className={`h-full overflow-y-auto ${initiateTheme.scrollbar}`}
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
          const item = visibleItems[virtualItem.index];
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
                focused={focusedId === item.id}
                onAccept={handleAccept}
                onReject={handleReject}
                onFocus={handleFocus}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
