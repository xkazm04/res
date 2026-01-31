'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock, Inbox } from 'lucide-react';
import { TopicStatus } from '@/src/types/research';
import { formatRelativeTime } from '@/src/lib/utils';
import { getSourceBySlug } from '@/src/lib/sources';

interface QueueTopic {
  id: string;
  title: string;
  status: TopicStatus;
  updatedAt?: string;
  sourceSlug: string;
}

interface QueueDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  topics: QueueTopic[];
}

// Status config for queue display
const QUEUE_STATUS_CONFIG: Record<
  'queued' | 'researching',
  { label: string; bgClass: string; textClass: string; animate?: boolean }
> = {
  queued: {
    label: 'Queued',
    bgClass: 'bg-[var(--bg-tertiary)]',
    textClass: 'text-[var(--text-muted)]',
  },
  researching: {
    label: 'Researching',
    bgClass: 'bg-[var(--blue-light)]',
    textClass: 'text-[var(--blue-primary)]',
    animate: true,
  },
};

export function QueueDashboard({ isOpen, onClose, topics }: QueueDashboardProps) {
  // Filter to only queued or researching topics
  const activeTopics = topics.filter(
    (t) => t.status === 'queued' || t.status === 'researching'
  );

  // Group by source slug
  const topicsBySource = activeTopics.reduce((acc, topic) => {
    if (!acc[topic.sourceSlug]) {
      acc[topic.sourceSlug] = [];
    }
    acc[topic.sourceSlug].push(topic);
    return acc;
  }, {} as Record<string, QueueTopic[]>);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="
              fixed right-0 top-0 bottom-0 z-50
              w-[90vw] max-w-[400px]
              bg-[var(--bg-primary)]
              border-l border-[var(--border-default)]
              shadow-xl
              flex flex-col
            "
            role="dialog"
            aria-modal="true"
            aria-label="Research Queue"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Research Queue
                </h2>
                {activeTopics.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--blue-light)] text-[var(--blue-primary)]">
                    {activeTopics.length} active
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="
                  p-1.5 rounded
                  hover:bg-[var(--bg-hover)]
                  transition-colors
                  text-[var(--text-muted)]
                  hover:text-[var(--text-primary)]
                "
                aria-label="Close queue"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTopics.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                    <Inbox size={24} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    No active research
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Initiate research on a topic to see it here
                  </p>
                </div>
              ) : (
                /* Topic list grouped by source */
                <div className="py-2">
                  {Object.entries(topicsBySource).map(([sourceSlug, sourceTopics]) => {
                    const source = getSourceBySlug(sourceSlug);
                    return (
                      <div key={sourceSlug} className="mb-4">
                        {/* Source header */}
                        <div className="px-4 py-2 bg-[var(--bg-secondary)]">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ backgroundColor: source?.color ? `${source.color}20` : 'var(--bg-tertiary)' }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: source?.color || 'var(--text-muted)' }}
                              />
                            </div>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {source?.name || sourceSlug}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              ({sourceTopics.length})
                            </span>
                          </div>
                        </div>

                        {/* Topics in this source */}
                        <div>
                          {sourceTopics.map((topic) => {
                            const config = QUEUE_STATUS_CONFIG[topic.status as 'queued' | 'researching'];
                            return (
                              <div
                                key={topic.id}
                                className="px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
                              >
                                {/* Title - truncated to 2 lines */}
                                <p className="text-sm text-[var(--text-primary)] line-clamp-2 leading-tight">
                                  {topic.title}
                                </p>

                                {/* Status and timestamp */}
                                <div className="flex items-center gap-2 mt-2">
                                  <span
                                    className={`
                                      inline-flex items-center gap-1
                                      px-1.5 py-0.5 rounded
                                      text-[10px] font-medium
                                      ${config.bgClass} ${config.textClass}
                                    `}
                                  >
                                    {config.animate ? (
                                      <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                      <Clock size={10} />
                                    )}
                                    {config.label}
                                  </span>

                                  {topic.updatedAt && (
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                      Updated {formatRelativeTime(topic.updatedAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
