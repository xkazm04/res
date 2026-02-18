'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
  userVerdict?: 'accepted' | 'rejected';
}

interface VirtualizedTopicListProps {
  items: TopicItem[];
  estimatedItemHeight?: number;
  onTopicStatusChange?: (id: string, status: TopicStatus, sessionId?: string) => void;
  onVerdictChange?: (id: string, verdict: 'accepted' | 'rejected') => void;
}

export function VirtualizedTopicList({
  items,
  estimatedItemHeight = 90,
  onTopicStatusChange,
  onVerdictChange,
}: VirtualizedTopicListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // Brief window after a removal where wrapper divs animate their translateY
  const [sliding, setSliding] = useState(false);

  // Only show undecided items (no verdict yet, not deleted)
  const visibleItems = useMemo(
    () => items.filter(item => item.status !== 'deleted' && !item.userVerdict),
    [items]
  );

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
        if (focusedIndex === -1 && visibleItems.length > 0) {
          setFocusedId(visibleItems[0].id);
          virtualizer.scrollToIndex(0, { align: 'start' });
        } else if (focusedIndex < visibleItems.length - 1) {
          setFocusedId(visibleItems[focusedIndex + 1].id);
          virtualizer.scrollToIndex(focusedIndex + 1, { align: 'center' });
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (focusedIndex > 0) {
          setFocusedId(visibleItems[focusedIndex - 1].id);
          virtualizer.scrollToIndex(focusedIndex - 1, { align: 'center' });
        }
      } else if (e.key === 'Escape') {
        setFocusedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, visibleItems, virtualizer]);

  // After verdict, item will be filtered out. Move focus to neighbor first.
  const handleVerdict = useCallback((id: string, verdict: 'accepted' | 'rejected') => {
    const idx = visibleItems.findIndex(item => item.id === id);
    const nextId = visibleItems[idx + 1]?.id ?? visibleItems[idx - 1]?.id ?? null;
    setFocusedId(nextId);
    // Enable smooth slide-up for remaining items
    setSliding(true);
    setTimeout(() => setSliding(false), 350);
    onVerdictChange?.(id, verdict);
  }, [visibleItems, onVerdictChange]);

  const handleAccept = useCallback((id: string) => {
    handleVerdict(id, 'accepted');
  }, [handleVerdict]);

  const handleReject = useCallback((id: string) => {
    handleVerdict(id, 'rejected');
  }, [handleVerdict]);

  const handleFocus = useCallback((id: string) => {
    setFocusedId(id);
  }, []);

  if (visibleItems.length === 0) {
    return <EmptyState />;
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
                ...(sliding ? { transition: 'transform 250ms ease-out' } : undefined),
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
