'use client';

import { useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, RefreshCw, X, Inbox } from 'lucide-react';
import { initiateTheme } from './InitiateTheme';
import type { QueueTopic } from './useResearch';

const ease = [0.25, 0.1, 0.25, 1] as const;

interface ResearchQueueProps {
  isOpen: boolean;
  topics: QueueTopic[];
  activeTopicId: string | null;
  isLoading: boolean;
  onPlay: (topicId: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}

const QueueRow = memo(function QueueRow({
  topic,
  isActive,
  isBusy,
  onPlay,
}: {
  topic: QueueTopic;
  isActive: boolean;
  isBusy: boolean;
  onPlay: (id: string) => void;
}) {
  const isFailed = topic.status === 'failed';

  return (
    <div
      className={`
        group flex items-center h-8 px-3 gap-2
        transition-colors duration-150
        hover:bg-slate-800/60
        ${isActive ? 'bg-cyan-500/10' : ''}
        ${isFailed ? 'border-l-2 border-l-rose-400/60' : isActive ? 'border-l-2 border-l-cyan-400 animate-pulse' : 'border-l-2 border-l-transparent'}
      `}
    >
      <span
        className={`
          flex-1 text-xs truncate
          ${isActive ? 'text-cyan-300' : isFailed ? 'text-rose-300/80' : 'text-slate-300'}
        `}
        title={topic.title}
      >
        {topic.title}
      </span>

      {isActive ? (
        <Loader2 size={12} className="flex-shrink-0 text-cyan-400 animate-spin" />
      ) : !isBusy ? (
        <button
          onClick={() => onPlay(topic.id)}
          className="
            flex-shrink-0 p-0.5 rounded
            text-slate-600 opacity-0 group-hover:opacity-100
            hover:text-cyan-400 hover:bg-cyan-500/15
            transition-all duration-150
          "
          title="Research this topic"
        >
          <Play size={12} />
        </button>
      ) : null}
    </div>
  );
});

export function ResearchQueue({
  isOpen,
  topics,
  activeTopicId,
  isLoading,
  onPlay,
  onRefresh,
  onClose,
}: ResearchQueueProps) {
  // Escape to close
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          className={`
            flex-shrink-0 h-full flex flex-col overflow-hidden
            ${initiateTheme.bgSecondary}
            border-r ${initiateTheme.borderSubtle}
          `}
        >
          {/* Header */}
          <div className={`
            flex items-center justify-between px-3 py-2.5
            border-b ${initiateTheme.borderSubtle}
            ${initiateTheme.bgCard}
          `}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${initiateTheme.text}`}>Queue</span>
              {topics.length > 0 && (
                <span className="min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-semibold bg-cyan-500 text-slate-950 rounded-full">
                  {topics.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className={`
                  p-1 rounded
                  ${initiateTheme.textMuted}
                  hover:text-slate-100
                  ${initiateTheme.bgHover}
                  transition-colors
                  disabled:opacity-50
                `}
                title="Refresh queue"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className={`
                  p-1 rounded
                  ${initiateTheme.textMuted}
                  hover:text-slate-100
                  ${initiateTheme.bgHover}
                  transition-colors
                `}
                title="Close queue"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Topic list */}
          <div className={`flex-1 overflow-y-auto ${initiateTheme.scrollbar}`}>
            {topics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <Inbox size={20} className={initiateTheme.textMuted} />
                <p className={`text-xs ${initiateTheme.textMuted} mt-2`}>
                  {isLoading ? 'Loading...' : 'No accepted topics'}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {topics.map((topic) => (
                  <QueueRow
                    key={topic.id}
                    topic={topic}
                    isActive={topic.id === activeTopicId}
                    isBusy={activeTopicId !== null}
                    onPlay={onPlay}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {topics.length > 0 && (
            <div className={`
              px-3 py-2
              border-t ${initiateTheme.borderSubtle}
              ${initiateTheme.bgCard}
            `}>
              <span className={`text-[10px] ${initiateTheme.textMuted}`}>
                {topics.length} topic{topics.length !== 1 ? 's' : ''} ready
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
