'use client';

import { useReportTheme } from '../core/ThemeContext';

export interface FilterChipProps {
  /** Label text or emoji icon */
  label: string;
  /** Count to display in badge */
  count: number;
  /** Whether this filter is currently active */
  active: boolean;
  /** Click handler */
  onClick: () => void;
  /** Optional size variant */
  size?: 'small' | 'medium';
}

/**
 * FilterChip - A theme-aware filter button with count badge.
 *
 * Used for filtering lists by category (entity types, key point types, etc.)
 * Supports both text labels ("All") and emoji icons ("👤").
 */
export function FilterChip({
  label,
  count,
  active,
  onClick,
  size = 'small',
}: FilterChipProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const sizeClasses = size === 'medium' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  const badgeSizeClasses = size === 'medium' ? 'px-1.5 py-0.5 text-[10px]' : 'px-1 py-0.5 text-[9px]';

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-lg flex items-center gap-1 transition-all ${
        active
          ? isRadar
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            : 'bg-stone-800 text-white'
          : isRadar
            ? 'bg-slate-800/50 text-slate-400 hover:text-white'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {label}
      <span
        className={`${badgeSizeClasses} rounded ${
          active
            ? isRadar
              ? 'bg-cyan-500/30'
              : 'bg-white/20'
            : 'bg-black/10'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
