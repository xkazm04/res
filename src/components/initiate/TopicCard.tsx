'use client';

import {
  Sparkles,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MoreVertical,
  LucideIcon,
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
    bgClass: 'bg-[var(--amber-light)]',
    textClass: 'text-[var(--amber-primary)]',
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
  };
  selected: boolean;
  onSelect: (id: string) => void;
  onAction: (id: string, action: 'menu' | 'delete' | 'research') => void;
}

export function TopicCard({ topic, selected, onSelect, onAction }: TopicCardProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(topic.id);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(topic.id, 'menu');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 flex flex-col gap-1">
        {/* Action menu button */}
        <button
          onClick={handleActionClick}
          className="
            p-1 rounded
            hover:bg-[var(--bg-secondary)]
            transition-colors
            text-[var(--text-muted)]
            hover:text-[var(--text-primary)]
          "
          aria-label={`Actions for ${topic.title}`}
        >
          <MoreVertical size={16} />
        </button>

        {/* Delete button (simple for now, dropdown in Phase 11) */}
        <button
          onClick={handleDelete}
          className="
            p-1 rounded
            hover:bg-[var(--red-light)]
            transition-colors
            text-[var(--text-muted)]
            hover:text-[var(--red-primary)]
          "
          aria-label={`Delete ${topic.title}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
