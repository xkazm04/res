import { cn } from '@/src/lib/utils';
import { ReactNode } from 'react';

interface SwissCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default: 'card transition-shadow duration-150',
  elevated: 'card-elevated transition-shadow duration-150 hover:shadow-md',
  outlined: 'card transition-shadow duration-150',
  interactive: 'card-interactive active:scale-[0.995]',
};

export function SwissCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
}: SwissCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        onClick && 'text-left w-full',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}

// Specialized card header
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SwissCardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="text-headline text-base">{title}</h3>
        {subtitle && <p className="text-secondary mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Specialized card section
interface CardSectionProps {
  children: ReactNode;
  className?: string;
  noBorder?: boolean;
}

export function SwissCardSection({ children, className, noBorder }: CardSectionProps) {
  return (
    <div className={cn(!noBorder && 'border-t border-[var(--border-color)] pt-4 mt-4', className)}>
      {children}
    </div>
  );
}
