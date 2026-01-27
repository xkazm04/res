import { cn } from '@/src/lib/utils';
import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple';
type BadgeSize = 'sm' | 'md';

interface SwissBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'badge-default',
  blue: 'badge-blue',
  green: 'badge-green',
  red: 'badge-red',
  amber: 'badge-amber',
  purple: 'badge-purple',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-muted)]',
  blue: 'bg-[var(--accent-info)]',
  green: 'bg-[var(--accent-success)]',
  red: 'bg-[var(--accent-danger)]',
  amber: 'bg-[var(--accent-warning)]',
  purple: 'bg-[var(--purple-primary)]',
};

export function SwissBadge({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot,
}: SwissBadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

// Template type badge helper
const templateVariants: Record<string, BadgeVariant> = {
  investigative: 'red',
  financial: 'blue',
  competitive: 'purple',
  tech_market: 'green',
  legal: 'blue',
  due_diligence: 'amber',
  contract: 'purple',
  purchase_decision: 'amber',
  reputation: 'red',
  understanding: 'blue',
};

interface TemplateBadgeProps {
  template: string;
  className?: string;
}

export function TemplateBadge({ template, className }: TemplateBadgeProps) {
  const variant = templateVariants[template] || 'default';
  const label = template.replace(/_/g, ' ');

  return (
    <SwissBadge variant={variant} className={className}>
      {label}
    </SwissBadge>
  );
}

// Finding type badge helper
const findingVariants: Record<string, BadgeVariant> = {
  fact: 'blue',
  event: 'green',
  actor: 'red',
  relationship: 'purple',
  pattern: 'amber',
  evidence: 'green',
  claim: 'blue',
  gap: 'default',
  risk: 'red',
  red_flag: 'red',
  market_trend: 'blue',
  tech_trend: 'green',
  recommendation: 'purple',
};

interface FindingBadgeProps {
  type: string;
  className?: string;
}

export function FindingBadge({ type, className }: FindingBadgeProps) {
  const variant = findingVariants[type] || 'default';
  const label = type.replace(/_/g, ' ');

  return (
    <SwissBadge variant={variant} size="sm" className={className}>
      {label}
    </SwissBadge>
  );
}

// Confidence badge
interface ConfidenceBadgeProps {
  score: number;
  className?: string;
}

export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const percent = Math.round(score * 100);
  let variant: BadgeVariant = 'green';
  if (score < 0.5) variant = 'red';
  else if (score < 0.7) variant = 'amber';

  return (
    <SwissBadge variant={variant} size="sm" className={className}>
      {percent}%
    </SwissBadge>
  );
}
