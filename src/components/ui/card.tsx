'use client';

import { cn } from '@/src/lib/utils';
import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-white dark:bg-zinc-900',
  elevated: 'bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-950/50',
  bordered: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
  glass: 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'bordered', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg', variantStyles[variant], paddingStyles[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold text-zinc-900 dark:text-zinc-100', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center pt-4', className)} {...props} />;
}

// Detective Board specific card - paper style
interface PaperCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pinColor?: 'red' | 'blue' | 'green' | 'yellow' | 'white';
  rotation?: number;
}

const pinColors = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  white: 'bg-zinc-300',
};

export function PaperCard({ className, pinColor = 'red', rotation = 0, children, style, ...props }: PaperCardProps) {
  return (
    <div
      className={cn(
        'relative bg-[#f4e8d1] dark:bg-[#d4c8b1] shadow-md',
        'before:absolute before:top-2 before:left-1/2 before:-translate-x-1/2',
        'before:w-3 before:h-3 before:rounded-full before:shadow-sm',
        `before:${pinColors[pinColor]}`,
        className
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
      {...props}
    >
      {/* Pushpin */}
      <div
        className={cn(
          'absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-md z-10',
          pinColors[pinColor]
        )}
      >
        <div className="absolute inset-1 rounded-full bg-white/30" />
      </div>
      <div className="pt-4 px-4 pb-4">{children}</div>
    </div>
  );
}

// Financial card - dark terminal style
export function TerminalCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-[#0a0a0a] border border-zinc-800 rounded',
        'font-mono text-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// McKinsey style card - clean professional
export function ConsultingCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
