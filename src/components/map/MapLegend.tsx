'use client';

import { cn } from '@/src/lib/utils';

interface LegendItem {
  template: string;
  displayName: string;
  count: number;
  color: string;
}

interface MapLegendProps {
  items: LegendItem[];
  className?: string;
}

export function MapLegend({ items, className }: MapLegendProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      {items.map((item) => (
        <div key={item.template} className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
          <span
            className="w-3 h-3 rounded-sm shadow-sm transition-transform duration-200 hover:scale-110"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-[var(--text-secondary)]">
            {item.displayName}
          </span>
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            ({item.count})
          </span>
        </div>
      ))}
    </div>
  );
}

// Compact inline legend
interface CompactLegendProps {
  items: LegendItem[];
  className?: string;
}

export function CompactLegend({ items, className }: CompactLegendProps) {
  return (
    <div className={cn('flex items-center gap-3 text-xs', className)}>
      {items.slice(0, 5).map((item) => (
        <div key={item.template} className="flex items-center gap-1 transition-opacity duration-150 hover:opacity-80">
          <span
            className="w-2 h-2 rounded-sm shadow-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[var(--text-muted)] tabular-nums">{item.count}</span>
        </div>
      ))}
      {items.length > 5 && (
        <span className="text-[var(--text-muted)]">
          +{items.length - 5} more
        </span>
      )}
    </div>
  );
}
