'use client';

import { cn } from '@/src/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  showValue?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantStyles = {
  default: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
};

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 text-right">{Math.round(percentage)}%</div>
      )}
    </div>
  );
}

// Circular progress / ring indicator
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  className?: string;
}

const ringVariantStyles = {
  default: 'stroke-blue-500',
  success: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  danger: 'stroke-red-500',
};

export function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showValue = true,
  className,
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', ringVariantStyles[variant])}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

// Status indicator with animated pulse
interface StatusIndicatorProps {
  status: 'active' | 'searching' | 'analyzing' | 'completed' | 'paused' | 'failed';
  showLabel?: boolean;
  className?: string;
}

const statusStyles = {
  active: { color: 'bg-blue-500', label: 'Active', pulse: true },
  searching: { color: 'bg-amber-500', label: 'Searching', pulse: true },
  analyzing: { color: 'bg-purple-500', label: 'Analyzing', pulse: true },
  completed: { color: 'bg-emerald-500', label: 'Completed', pulse: false },
  paused: { color: 'bg-zinc-400', label: 'Paused', pulse: false },
  failed: { color: 'bg-red-500', label: 'Failed', pulse: false },
};

export function StatusIndicator({ status, showLabel = true, className }: StatusIndicatorProps) {
  const { color, label, pulse } = statusStyles[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', color)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', color)} />
      </span>
      {showLabel && <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>}
    </div>
  );
}
