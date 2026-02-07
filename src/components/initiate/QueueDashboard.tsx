'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock, Inbox, Activity } from 'lucide-react';
import { TopicStatus } from '@/src/types/research';
import { formatRelativeTime } from '@/src/lib/utils';
import { getSourceBySlug } from '@/src/lib/sources';
import { initiateTheme, getStatusStyle } from './InitiateTheme';

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

  // Count by status
  const queuedCount = activeTopics.filter(t => t.status === 'queued').length;
  const researchingCount = activeTopics.filter(t => t.status === 'researching').length;

  // Handle escape key (stop propagation to prevent VirtualizedTopicList from also handling it)
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
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
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              fixed right-0 top-0 bottom-0 z-50
              w-[90vw] max-w-[420px]
              ${initiateTheme.bgSecondary}
              border-l ${initiateTheme.borderAccent}
              ${initiateTheme.elevation3}
              flex flex-col
            `}
            style={{
              boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5), -4px 0 20px rgba(34, 211, 238, 0.1)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Research Queue"
          >
            {/* Header */}
            <div className={`
              flex items-center justify-between px-5 py-4
              border-b ${initiateTheme.borderAccent}
              ${initiateTheme.bgCard}
            `}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-cyan-400" />
                  <h2 className={`text-lg font-semibold ${initiateTheme.text}`}>
                    Research Queue
                  </h2>
                </div>
                {activeTopics.length > 0 && (
                  <div className="flex items-center gap-2">
                    {researchingCount > 0 && (
                      <span className={`
                        px-2.5 py-1 rounded-full
                        text-xs font-medium
                        bg-blue-500/20 text-blue-400
                        border border-blue-500/30
                        flex items-center gap-1.5
                      `}>
                        <Loader2 size={10} className="animate-spin" />
                        {researchingCount} active
                      </span>
                    )}
                    {queuedCount > 0 && (
                      <span className={`
                        px-2.5 py-1 rounded-full
                        text-xs font-medium
                        bg-slate-500/20 text-slate-400
                        border border-slate-500/30
                      `}>
                        {queuedCount} queued
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-lg
                  ${initiateTheme.textMuted}
                  hover:text-slate-100
                  ${initiateTheme.bgHover}
                  transition-all duration-200
                  ${initiateTheme.focusRing}
                `}
                aria-label="Close queue"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto ${initiateTheme.scrollbar}`}>
              {activeTopics.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                  <div className={`
                    w-16 h-16 rounded-2xl
                    ${initiateTheme.bgGlass}
                    border ${initiateTheme.borderSubtle}
                    flex items-center justify-center mb-5
                  `}>
                    <Inbox size={28} className={initiateTheme.textMuted} />
                  </div>
                  <p className={`text-base font-medium ${initiateTheme.text} mb-2`}>
                    No active research
                  </p>
                  <p className={`text-sm ${initiateTheme.textMuted} max-w-[240px]`}>
                    Start research on a topic to see it here. Active tasks will show their progress.
                  </p>
                </div>
              ) : (
                /* Topic list grouped by source */
                <div className="py-3">
                  {Object.entries(topicsBySource).map(([sourceSlug, sourceTopics]) => {
                    const source = getSourceBySlug(sourceSlug);
                    return (
                      <div key={sourceSlug} className="mb-1">
                        {/* Source header */}
                        <div className={`
                          px-5 py-2.5
                          ${initiateTheme.bgCard}
                          border-y ${initiateTheme.borderSubtle}
                          sticky top-0 z-10
                        `}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{
                                backgroundColor: source?.color ? `${source.color}15` : 'rgba(148, 163, 184, 0.1)',
                                boxShadow: source?.color ? `0 0 8px ${source.color}30` : undefined,
                              }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: source?.color || '#94a3b8' }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${initiateTheme.text}`}>
                              {source?.name || sourceSlug}
                            </span>
                            <span className={`text-xs ${initiateTheme.textMuted}`}>
                              {sourceTopics.length} item{sourceTopics.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Topics in this source */}
                        <div>
                          {sourceTopics.map((topic) => {
                            const statusStyle = getStatusStyle(topic.status);
                            const isResearching = topic.status === 'researching';
                            return (
                              <div
                                key={topic.id}
                                className={`
                                  px-5 py-3.5
                                  border-b ${initiateTheme.borderSubtle}
                                  ${initiateTheme.bgHover}
                                  transition-all duration-200
                                  ${isResearching ? 'border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}
                                `}
                              >
                                {/* Title - truncated to 2 lines */}
                                <p className={`text-sm ${initiateTheme.text} line-clamp-2 leading-relaxed`}>
                                  {topic.title}
                                </p>

                                {/* Status and timestamp */}
                                <div className="flex items-center gap-3 mt-2.5">
                                  <span
                                    className={`
                                      inline-flex items-center gap-1.5
                                      px-2.5 py-1 rounded-full
                                      text-[10px] font-medium
                                      ${statusStyle.bg} ${statusStyle.text}
                                      border ${statusStyle.border}
                                    `}
                                  >
                                    {isResearching ? (
                                      <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                      <Clock size={10} />
                                    )}
                                    {topic.status.charAt(0).toUpperCase() + topic.status.slice(1)}
                                  </span>

                                  {topic.updatedAt && (
                                    <span className={`text-[10px] ${initiateTheme.textMuted}`}>
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

            {/* Footer stats */}
            {activeTopics.length > 0 && (
              <div className={`
                px-5 py-3
                border-t ${initiateTheme.borderAccent}
                ${initiateTheme.bgCard}
                flex items-center justify-between
              `}>
                <span className={`text-xs ${initiateTheme.textMuted}`}>
                  {activeTopics.length} total in queue
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className={`text-xs ${initiateTheme.textMuted}`}>
                    Auto-refreshing
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
