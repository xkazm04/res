'use client';

import { cn } from '@/src/lib/utils';
import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SwissCollapsibleProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function SwissCollapsible({
  title,
  subtitle,
  badge,
  children,
  defaultOpen = false,
  className,
}: SwissCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border-b border-[var(--border-color)]', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header w-full"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[var(--text-muted)] transition-transform shrink-0',
              isOpen && 'rotate-180'
            )}
          />
          <div className="min-w-0 text-left">
            <span className="text-headline text-sm">{title}</span>
            {subtitle && (
              <span className="text-secondary ml-2">{subtitle}</span>
            )}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </button>
      <div
        className="collapsible-content"
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Simple expandable text
interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableText({
  text,
  maxLines = 3,
  className,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Rough estimate: if text is longer than ~150 chars per line, it probably needs expansion
  const needsExpansion = text.length > maxLines * 150;

  if (!needsExpansion) {
    return <p className={cn('text-body', className)}>{text}</p>;
  }

  return (
    <div className={className}>
      <p
        className={cn(
          'text-body',
          !isExpanded && `truncate-${maxLines}`
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[var(--text-link)] text-sm mt-1 hover:underline"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

// Section header with collapsible behavior
interface CollapsibleSectionProps {
  title: string;
  count?: number;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  count,
  icon,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full py-2 group"
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[var(--text-muted)] transition-transform',
            isOpen && 'rotate-180'
          )}
        />
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
        <span className="text-label">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-[var(--text-muted)]">({count})</span>
        )}
      </button>
      <div
        className="collapsible-content"
        data-state={isOpen ? 'open' : 'closed'}
      >
        {children}
      </div>
    </section>
  );
}
