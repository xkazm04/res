'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SourceColumnProps {
  name: string;
  slug: string;
  icon: LucideIcon;
  color: string;
  isFirst?: boolean;
  children?: ReactNode;
}

export function SourceColumn({
  name,
  slug,
  icon: Icon,
  color,
  isFirst = false,
  children
}: SourceColumnProps) {
  return (
    <div
      className={`
        flex flex-col h-full min-w-[280px] max-w-[320px]
        border-r border-[var(--border-default)]
        bg-[var(--bg-primary)]
        ${isFirst ? 'sticky-first-column' : ''}
      `}
      data-source={slug}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {name}
        </span>
      </div>

      {/* Column Content - placeholder for virtualized list */}
      <div className="flex-1 overflow-hidden">
        {children || (
          <div className="p-4 text-sm text-[var(--text-muted)]">
            No topics yet. Click Discover to find trending topics.
          </div>
        )}
      </div>
    </div>
  );
}
