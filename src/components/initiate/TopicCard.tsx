'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MoreVertical,
  Beaker,
  LucideIcon,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { formatRelativeTime } from '@/src/lib/utils';
import { TopicStatus } from '@/src/types/research';

// WCAG-compliant status config: icon + color + text (not just color)
const STATUS_CONFIG: Record<
  TopicStatus,
  { icon: LucideIcon; label: string; bgClass: string; textClass: string; animate?: boolean }
> = {
  new: {
    icon: Sparkles,
    label: 'New',
    bgClass: 'bg-[var(--blue-light)]',
    textClass: 'text-[var(--blue-primary)]',
  },
  queued: {
    icon: Clock,
    label: 'Queued',
    bgClass: 'bg-[var(--bg-tertiary)]',
    textClass: 'text-[var(--text-muted)]',
  },
  researching: {
    icon: Loader2,
    label: 'Researching',
    bgClass: 'bg-[var(--blue-light)]',
    textClass: 'text-[var(--blue-primary)]',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    bgClass: 'bg-[var(--green-light)]',
    textClass: 'text-[var(--green-primary)]',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    bgClass: 'bg-[var(--red-light)]',
    textClass: 'text-[var(--red-primary)]',
  },
  deleted: {
    icon: Trash2,
    label: 'Deleted',
    bgClass: 'bg-[var(--bg-hover)]',
    textClass: 'text-[var(--text-muted)]',
  },
};

interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    description?: string;
    status: TopicStatus;
    discoveredAt: string;
    updatedAt?: string;
    sessionId?: string;
  };
  selected: boolean;
  onSelect: (id: string) => void;
  onAction: (id: string, action: 'menu' | 'delete' | 'research') => void;
  onViewSession?: (sessionId: string) => void;
  onRetry?: (topicId: string) => void;
}

export function TopicCard({ topic, selected, onSelect, onAction, onViewSession, onRetry }: TopicCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  // Status checks
  const canResearch = topic.status === 'new' || topic.status === 'failed';
  const canViewResults = topic.status === 'completed' && !!topic.sessionId;
  const canRetry = topic.status === 'failed';

  // Click-outside handler
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-topic-menu]')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(topic.id);
  };

  const handleResearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setResearchLoading(true);
    onAction(topic.id, 'research');
    // Note: Parent handles the actual API call and resets loading via status update
  };

  const handleViewResults = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (topic.sessionId && onViewSession) {
      onViewSession(topic.sessionId);
    }
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onRetry) {
      setRetryLoading(true);
      onRetry(topic.id);
      // Note: Loading will be reset when status changes via useEffect
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/topics/${topic.id}`, { method: 'DELETE' });
      if (res.ok) {
        onAction(topic.id, 'delete');
      } else {
        console.error('Failed to delete topic');
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };

  // Reset loading states when status changes (e.g., to 'queued')
  useEffect(() => {
    if (topic.status !== 'new' && topic.status !== 'failed') {
      setResearchLoading(false);
      setRetryLoading(false);
    }
  }, [topic.status]);

  return (
    <div
      className={`
        relative flex gap-2
        px-3 py-2
        border-b border-[var(--border-subtle)]
        hover:bg-[var(--bg-hover)]
        transition-colors
        ${selected ? 'bg-[var(--blue-light)]' : ''}
      `}
    >
      {/* Selection checkbox */}
      <div className="flex-shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleCheckboxChange}
          className="
            w-4 h-4 rounded
            border-[var(--border-default)]
            accent-[var(--blue-primary)]
            cursor-pointer
            focus:ring-2 focus:ring-[var(--blue-primary)] focus:ring-offset-1
          "
          aria-label={`Select ${topic.title}`}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
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

        {/* Footer with timestamp and status */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            {formatRelativeTime(topic.discoveredAt)}
          </span>

          {/* WCAG-compliant status: icon + color + text */}
          {(() => {
            const config = STATUS_CONFIG[topic.status];
            const Icon = config.icon;
            return (
              <span
                className={`
                  inline-flex items-center gap-1
                  px-1.5 py-0.5 rounded
                  text-[10px] font-medium
                  ${config.bgClass} ${config.textClass}
                `}
              >
                <Icon size={12} className={config.animate ? 'animate-spin' : ''} />
                {config.label}
              </span>
            );
          })()}

          {/* Updated timestamp for non-new statuses */}
          {topic.status !== 'new' && topic.updatedAt && (
            <span className="text-[10px] text-[var(--text-muted)]">
              Updated {formatRelativeTime(topic.updatedAt)}
            </span>
          )}

          {/* View Results button for completed topics */}
          {canViewResults && (
            <button
              onClick={handleViewResults}
              className="
                inline-flex items-center gap-1
                px-1.5 py-0.5 rounded
                text-[10px] font-medium
                text-[var(--blue-primary)]
                hover:bg-[var(--blue-light)]
                transition-colors
              "
            >
              <Eye size={10} />
              View Results
            </button>
          )}

          {/* Retry button for failed topics */}
          {canRetry && (
            <button
              onClick={handleRetry}
              disabled={retryLoading}
              className="
                inline-flex items-center gap-1
                px-1.5 py-0.5 rounded
                text-[10px] font-medium
                text-[var(--amber-primary,#D97706)]
                hover:bg-[var(--amber-light,#FEF3C7)]
                transition-colors
                disabled:opacity-50
              "
            >
              {retryLoading ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <RefreshCw size={10} />
              )}
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Action menu */}
      <div className="flex-shrink-0 relative" data-topic-menu>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="
            p-1 rounded
            hover:bg-[var(--bg-secondary)]
            transition-colors
            text-[var(--text-muted)]
            hover:text-[var(--text-primary)]
          "
          aria-label={`Actions for ${topic.title}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div
            className="
              absolute right-0 top-full mt-1
              bg-[var(--bg-primary)] border border-[var(--border-default)]
              rounded shadow-lg z-10 min-w-[140px]
            "
            role="menu"
          >
            {/* View Results for completed topics */}
            {canViewResults && (
              <button
                onClick={handleViewResults}
                className="
                  w-full px-3 py-2 text-left text-sm
                  flex items-center gap-2
                  hover:bg-[var(--bg-hover)]
                  text-[var(--text-primary)]
                "
                role="menuitem"
              >
                <Eye size={14} />
                View Results
              </button>
            )}
            {/* Research for new/failed topics (not completed) */}
            {!canViewResults && (
              <button
                onClick={handleResearch}
                disabled={!canResearch || researchLoading}
                className="
                  w-full px-3 py-2 text-left text-sm
                  flex items-center gap-2
                  hover:bg-[var(--bg-hover)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-[var(--text-primary)]
                "
                role="menuitem"
              >
                {researchLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Beaker size={14} />
                )}
                Research
              </button>
            )}
            {/* Retry for failed topics */}
            {canRetry && (
              <button
                onClick={handleRetry}
                disabled={retryLoading}
                className="
                  w-full px-3 py-2 text-left text-sm
                  flex items-center gap-2
                  hover:bg-[var(--amber-light,#FEF3C7)]
                  text-[var(--amber-primary,#D97706)]
                  disabled:opacity-50
                "
                role="menuitem"
              >
                {retryLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Retry
              </button>
            )}
            <button
              onClick={handleDelete}
              className="
                w-full px-3 py-2 text-left text-sm
                flex items-center gap-2
                hover:bg-[var(--red-light)]
                text-[var(--red-primary)]
              "
              role="menuitem"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
