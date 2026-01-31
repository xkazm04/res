'use client';

import {
  Sparkles,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
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
  return (
    <div
      className={`
        px-3 py-2
        border-b border-[var(--border-subtle)]
        hover:bg-[var(--bg-hover)]
        transition-colors
        cursor-pointer
      `}
    >
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
  );
}
