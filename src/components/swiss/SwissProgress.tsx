import { cn } from '@/src/lib/utils';

type ProgressVariant = 'default' | 'green' | 'amber' | 'red';
type ProgressSize = 'sm' | 'md' | 'lg';

interface SwissProgressProps {
  value: number; // 0-1 or 0-100
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  className?: string;
}

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

const variantClasses: Record<ProgressVariant, string> = {
  default: '',
  green: 'progress-bar-green',
  amber: 'progress-bar-amber',
  red: 'progress-bar-red',
};

export function SwissProgress({
  value,
  max = 1,
  variant = 'default',
  size = 'md',
  showLabel,
  className,
}: SwissProgressProps) {
  // Normalize value to 0-100 percentage
  const normalizedValue = max === 1 ? value * 100 : (value / max) * 100;
  const clampedValue = Math.max(0, Math.min(100, normalizedValue));

  // Auto-select variant based on value if not specified
  let effectiveVariant = variant;
  if (variant === 'default') {
    if (clampedValue >= 70) effectiveVariant = 'green';
    else if (clampedValue >= 40) effectiveVariant = 'amber';
    else effectiveVariant = 'red';
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('progress-bar flex-1', variantClasses[effectiveVariant], sizeClasses[size])}>
        <div
          className="progress-bar-fill transition-[width] duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--text-muted)] tabular-nums min-w-[2.5rem] text-right">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}

// Confidence progress with automatic color coding
interface ConfidenceProgressProps {
  score: number; // 0-1
  showLabel?: boolean;
  size?: ProgressSize;
  className?: string;
}

export function ConfidenceProgress({
  score,
  showLabel = true,
  size = 'sm',
  className,
}: ConfidenceProgressProps) {
  let variant: ProgressVariant = 'green';
  if (score < 0.5) variant = 'red';
  else if (score < 0.7) variant = 'amber';

  return (
    <SwissProgress
      value={score}
      variant={variant}
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}

// Simple progress indicator for loading states
interface LoadingProgressProps {
  className?: string;
}

export function LoadingProgress({ className }: LoadingProgressProps) {
  return (
    <div className={cn('progress-bar h-1 overflow-hidden', className)}>
      <div
        className="progress-bar-fill animate-pulse"
        style={{ width: '100%' }}
      />
    </div>
  );
}
