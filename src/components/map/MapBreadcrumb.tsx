'use client';

import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { getTemplateDisplayName } from '@/src/stores/appStore';

interface MapBreadcrumbProps {
  path: string[];
  onNavigate: (path: string[]) => void;
  className?: string;
}

export function MapBreadcrumb({ path, onNavigate, className }: MapBreadcrumbProps) {
  const getDisplayName = (segment: string, index: number): string => {
    if (segment === 'root') return 'All Research';
    if (index === 1) return getTemplateDisplayName(segment);
    // For topics and sessions, decode the name
    return segment
      .replace(/^topic-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleClick = (index: number) => {
    const newPath = path.slice(0, index + 1);
    onNavigate(newPath);
  };

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      {path.map((segment, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-[var(--border-strong)] mx-1" />
          )}
          <button
            onClick={() => handleClick(index)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200',
              index === path.length - 1
                ? 'text-[var(--text-primary)] font-medium bg-[var(--bg-hover)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:shadow-sm active:scale-95'
            )}
          >
            {index === 0 && <Home className="w-3.5 h-3.5" />}
            <span>{getDisplayName(segment, index)}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}
