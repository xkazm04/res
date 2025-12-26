import { cn } from '@/src/lib/utils';
import type { FindingType, RelationshipType, GapPriority, SourceType, PerspectiveType } from '@/src/types/research';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
  secondary: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
  outline: 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Finding type badge with semantic colors
const findingTypeColors: Record<FindingType, { bg: string; text: string }> = {
  fact: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400' },
  claim: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400' },
  event: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400' },
  actor: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-800 dark:text-rose-400' },
  relationship: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-400' },
  pattern: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-400' },
  gap: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' },
  evidence: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-400' },
};

export function FindingTypeBadge({ type, size = 'sm' }: { type: FindingType; size?: 'sm' | 'md' | 'lg' }) {
  const colors = findingTypeColors[type];
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full uppercase tracking-wide',
        colors.bg,
        colors.text,
        sizeStyles[size]
      )}
    >
      {type}
    </span>
  );
}

// Relationship type badge
const relationshipColors: Record<RelationshipType, string> = {
  causes: 'bg-red-500',
  supports: 'bg-green-500',
  contradicts: 'bg-orange-500',
  expands: 'bg-blue-500',
  supersedes: 'bg-purple-500',
  related_to: 'bg-zinc-500',
  part_of: 'bg-cyan-500',
  precedes: 'bg-amber-500',
  follows: 'bg-amber-600',
  enables: 'bg-emerald-500',
  prevents: 'bg-rose-500',
  involves: 'bg-indigo-500',
};

export function RelationshipBadge({ type }: { type: RelationshipType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-medium text-white px-2 py-0.5 rounded-full',
        relationshipColors[type]
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
      {type.replace('_', ' ')}
    </span>
  );
}

// Priority badge for gaps
const priorityStyles: Record<GapPriority, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export function PriorityBadge({ priority }: { priority: GapPriority }) {
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase', priorityStyles[priority])}>
      {priority}
    </span>
  );
}

// Source type badge
const sourceTypeColors: Record<SourceType, string> = {
  news: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  academic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  government: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  corporate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  blog: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  social: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  wiki: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  unknown: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
};

export function SourceTypeBadge({ type }: { type: SourceType }) {
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', sourceTypeColors[type])}>
      {type}
    </span>
  );
}

// Perspective type badge
const perspectiveColors: Record<PerspectiveType, { bg: string; icon: string }> = {
  historical: { bg: 'bg-amber-500', icon: 'H' },
  political: { bg: 'bg-red-500', icon: 'P' },
  economic: { bg: 'bg-emerald-500', icon: 'E' },
  psychological: { bg: 'bg-purple-500', icon: 'Y' },
  military: { bg: 'bg-zinc-700', icon: 'M' },
  social: { bg: 'bg-cyan-500', icon: 'S' },
  technological: { bg: 'bg-blue-500', icon: 'T' },
  financial: { bg: 'bg-green-600', icon: '$' },
  journalist: { bg: 'bg-rose-500', icon: 'J' },
  conspirator: { bg: 'bg-violet-600', icon: '?' },
  network: { bg: 'bg-indigo-500', icon: 'N' },
};

export function PerspectiveBadge({ type, showLabel = true }: { type: PerspectiveType; showLabel?: boolean }) {
  const { bg, icon } = perspectiveColors[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-medium text-white px-1.5 py-0.5 rounded',
        bg
      )}
    >
      <span className="font-bold">{icon}</span>
      {showLabel && <span className="capitalize">{type}</span>}
    </span>
  );
}
