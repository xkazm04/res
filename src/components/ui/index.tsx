'use client';

import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import {
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2,
  ExternalLink,
  Copy,
  Mail,
  Database,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Eye,
  FileText,
  Users,
  Globe,
  BarChart3,
  Scale,
  Building2,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// GLASS CARD
// ============================================================================
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'inset' | 'glow';
  glowColor?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose';
  animated?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glowColor, animated, children, ...props }, ref) => {
    const baseStyles = 'relative rounded-2xl transition-all duration-300';
    const variants = {
      default: 'glass-card glass-card-highlight',
      elevated: 'glass-card glass-card-highlight shadow-elevation-2 hover:shadow-elevation-3',
      inset: 'bg-[var(--obsidian)] border border-[var(--glass-border)]',
      glow: clsx('glass-card', glowColor && `glow-${glowColor}`),
    };
    const animatedStyles = animated ? 'animated-border' : '';

    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variants[variant], animatedStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

// ============================================================================
// BADGE
// ============================================================================
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  icon?: LucideIcon;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', pulse, icon: Icon, children, ...props }, ref) => {
    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    const variants = {
      default: 'bg-[var(--ash)] text-[var(--cloud)] border-[var(--glass-border)]',
      cyan: 'bg-[var(--cyan-glow)]/10 text-[var(--cyan-glow)] border-[var(--cyan-glow)]/30',
      violet: 'bg-[var(--violet-glow)]/10 text-[var(--violet-glow)] border-[var(--violet-glow)]/30',
      amber: 'bg-[var(--amber-glow)]/10 text-[var(--amber-glow)] border-[var(--amber-glow)]/30',
      emerald: 'bg-[var(--emerald-glow)]/10 text-[var(--emerald-glow)] border-[var(--emerald-glow)]/30',
      rose: 'bg-[var(--rose-glow)]/10 text-[var(--rose-glow)] border-[var(--rose-glow)]/30',
      muted: 'bg-[var(--graphite)] text-[var(--mist)] border-[var(--ash)]',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-1.5 font-medium rounded-full border uppercase tracking-wide',
          sizes[size],
          variants[variant],
          pulse && 'pulse-ring',
          className
        )}
        {...props}
      >
        {Icon && <Icon className="w-3 h-3" />}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

// ============================================================================
// CONFIDENCE INDICATOR
// ============================================================================
interface ConfidenceIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (percentage >= 80) return { bar: 'var(--emerald-glow)', text: 'emerald' };
    if (percentage >= 60) return { bar: 'var(--amber-glow)', text: 'amber' };
    return { bar: 'var(--rose-glow)', text: 'rose' };
  };
  const color = getColor();

  const sizes = {
    sm: { width: 40, height: 4, text: 'text-[10px]' },
    md: { width: 60, height: 6, text: 'text-xs' },
    lg: { width: 80, height: 8, text: 'text-sm' },
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className="rounded-full overflow-hidden bg-[var(--graphite)]"
        style={{ width: sizes[size].width, height: sizes[size].height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color.bar}88, ${color.bar})`,
            boxShadow: `0 0 8px ${color.bar}66`,
          }}
        />
      </div>
      {showLabel && (
        <span className={clsx('font-mono font-medium', sizes[size].text, `text-[var(--${color.text}-glow)]`)}>
          {percentage}%
        </span>
      )}
    </div>
  );
};

// ============================================================================
// PROGRESS RING
// ============================================================================
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  className,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--graphite)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--cyan-glow)" />
            <stop offset="100%" stopColor="var(--violet-glow)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

// ============================================================================
// INPUT
// ============================================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: Icon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mist)]" />
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-[var(--obsidian)] border border-[var(--ash)] rounded-xl',
            'text-[var(--pure)] placeholder-[var(--mist)]',
            'focus:border-[var(--cyan-glow)]/50 focus:ring-2 focus:ring-[var(--cyan-glow)]/20',
            'transition-all duration-200',
            'px-4 py-3 text-sm',
            Icon && 'pl-10',
            error && 'border-[var(--rose-glow)]/50',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[var(--rose-glow)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ============================================================================
// TEXTAREA
// ============================================================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <textarea
          ref={ref}
          className={clsx(
            'w-full bg-[var(--obsidian)] border border-[var(--ash)] rounded-xl',
            'text-[var(--pure)] placeholder-[var(--mist)]',
            'focus:border-[var(--cyan-glow)]/50 focus:ring-2 focus:ring-[var(--cyan-glow)]/20',
            'transition-all duration-200 resize-none',
            'px-4 py-3 text-sm',
            error && 'border-[var(--rose-glow)]/50',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[var(--rose-glow)]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ============================================================================
// SELECT
// ============================================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={clsx(
          'w-full bg-[var(--obsidian)] border border-[var(--ash)] rounded-xl',
          'text-[var(--pure)]',
          'focus:border-[var(--cyan-glow)]/50 focus:ring-2 focus:ring-[var(--cyan-glow)]/20',
          'transition-all duration-200',
          'px-4 py-3 text-sm cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

// ============================================================================
// BUTTON
// ============================================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      icon: Icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    };

    const variants = {
      primary: clsx(
        'bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)]',
        'text-[var(--void)] font-semibold',
        'hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]',
        'active:scale-[0.98]'
      ),
      secondary: clsx(
        'bg-[var(--graphite)] border border-[var(--ash)]',
        'text-[var(--pure)]',
        'hover:bg-[var(--slate)] hover:border-[var(--mist)]/30'
      ),
      ghost: clsx('bg-transparent text-[var(--mist)]', 'hover:bg-[var(--graphite)] hover:text-[var(--pure)]'),
      danger: clsx(
        'bg-[var(--rose-glow)]/10 border border-[var(--rose-glow)]/30',
        'text-[var(--rose-glow)]',
        'hover:bg-[var(--rose-glow)]/20'
      ),
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'relative inline-flex items-center justify-center font-medium rounded-xl',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
          sizes[size],
          variants[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ============================================================================
// TABS
// ============================================================================
interface TabsProps {
  tabs: { id: string; label: string; icon?: LucideIcon; count?: number }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={clsx('flex gap-1 p-1 bg-[var(--obsidian)] rounded-xl', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-[var(--cyan-glow)]/10 to-[var(--violet-glow)]/10 text-[var(--pure)] border border-[var(--cyan-glow)]/20'
                : 'text-[var(--mist)] hover:text-[var(--cloud)] hover:bg-[var(--graphite)]'
            )}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded text-[10px] font-mono',
                  isActive ? 'bg-[var(--cyan-glow)]/20 text-[var(--cyan-glow)]' : 'bg-[var(--ash)] text-[var(--mist)]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// STAT CARD
// ============================================================================
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  color?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  color = 'cyan',
  className,
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <GlassCard className={clsx('p-4', className)}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-[var(--mist)] uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg bg-[var(--${color}-glow)]/10`}>
            <Icon className={`w-4 h-4 text-[var(--${color}-glow)]`} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold text-gradient-${color}`}>{value}</span>
        {trend && (
          <TrendIcon
            className={clsx(
              'w-4 h-4 mb-1',
              trend === 'up' && 'text-[var(--emerald-glow)]',
              trend === 'down' && 'text-[var(--rose-glow)]',
              trend === 'neutral' && 'text-[var(--mist)]'
            )}
          />
        )}
      </div>
      {subValue && <span className="text-xs text-[var(--mist)] mt-1">{subValue}</span>}
    </GlassCard>
  );
};

// ============================================================================
// LOADING SPINNER
// ============================================================================
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={clsx('relative', sizes[size], className)}>
      <div
        className="absolute inset-0 rounded-full border-2 border-[var(--graphite)]"
        style={{ borderTopColor: 'var(--cyan-glow)' }}
      />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
        style={{
          borderTopColor: 'var(--cyan-glow)',
          animationDuration: '0.8s',
        }}
      />
      <div
        className="absolute inset-1 rounded-full border-2 border-transparent animate-spin"
        style={{
          borderTopColor: 'var(--violet-glow)',
          animationDuration: '1.2s',
          animationDirection: 'reverse',
        }}
      />
    </div>
  );
};

// ============================================================================
// LOADING STATE (Full page)
// ============================================================================
interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  progress?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, subMessage, progress }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="p-12 text-center scale-in">
      <div className="flex flex-col items-center">
        {progress !== undefined ? (
          <ProgressRing progress={progress} size={100} strokeWidth={8}>
            <span className="text-xl font-bold text-gradient-cyan">{Math.round(progress)}%</span>
          </ProgressRing>
        ) : (
          <LoadingSpinner size="lg" />
        )}

        <p className="mt-6 text-lg font-medium text-[var(--pure)]">
          {message || 'Processing'}
          <span className="inline-block w-6 text-left">{dots}</span>
        </p>

        {subMessage && <p className="mt-2 text-sm text-[var(--mist)]">{subMessage}</p>}

        <div className="mt-6 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--cyan-glow)] animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[var(--violet-glow)] animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[var(--amber-glow)] animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = Sparkles, title, description, action, className }) => {
  return (
    <GlassCard className={clsx('p-12 text-center', className)}>
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyan-glow)]/20 to-[var(--violet-glow)]/20 blur-xl rounded-full" />
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[var(--graphite)] to-[var(--obsidian)] border border-[var(--glass-border)]">
            <Icon className="w-8 h-8 text-[var(--mist)]" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-[var(--pure)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h3>

        {description && <p className="text-sm text-[var(--mist)] max-w-sm">{description}</p>}

        {action && <div className="mt-6">{action}</div>}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// TOOLTIP
// ============================================================================
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div
          className={clsx(
            'absolute z-50 px-3 py-1.5 text-xs font-medium text-[var(--pure)] bg-[var(--graphite)] border border-[var(--ash)] rounded-lg whitespace-nowrap fade-in',
            positions[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ICONS EXPORT
// ============================================================================
export const Icons = {
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2,
  ExternalLink,
  Copy,
  Mail,
  Database,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Eye,
  FileText,
  Users,
  Globe,
  BarChart3,
  Scale,
  Building2,
};
