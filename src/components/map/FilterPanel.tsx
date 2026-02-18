'use client';

/**
 * FilterPanel - Unified multi-faceted filter for both Radar and Swiss modes.
 *
 * Positioned below the theme switcher. Provides:
 * - Template type toggles (colored dots)
 * - Status filter chips
 * - Date range presets (7d/30d/90d/all)
 * - Sort options
 * - Clear all button
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { getTemplateDisplayName, getTemplateColor } from '@/src/stores/appStore';
import type { FilterCriteria } from '@/src/lib/mapData';

// ============================================================================
// Types
// ============================================================================

export type SortOption = 'newest' | 'oldest' | 'most-findings' | 'alphabetical';

interface FilterPanelProps {
  /** Available template types */
  templates: string[];
  /** Current filter criteria */
  criteria: FilterCriteria;
  /** Sort option */
  sort: SortOption;
  /** Number of matching results */
  matchCount?: number;
  /** Total count */
  totalCount?: number;
  /** Callback when filter changes */
  onChange: (criteria: FilterCriteria) => void;
  /** Callback when sort changes */
  onSortChange: (sort: SortOption) => void;
  /** Whether the panel is in radar (dark) mode */
  isRadar?: boolean;
  /** Suppress the own border-b and background when embedded in a parent header */
  embedded?: boolean;
}

// ============================================================================
// Date Range Presets
// ============================================================================

const DATE_PRESETS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: 0 },
] as const;

const STATUS_OPTIONS = [
  { value: 'completed', label: 'DONE', color: '#22C55E' },
  { value: 'active', label: 'ACTIVE', color: '#FACC15' },
  { value: 'searching', label: 'SEARCH', color: '#38BDF8' },
  { value: 'failed', label: 'FAIL', color: '#EF4444' },
] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most-findings', label: 'Findings' },
  { value: 'alphabetical', label: 'A-Z' },
];

// ============================================================================
// Component
// ============================================================================

export const FilterPanel = memo(function FilterPanel({
  templates,
  criteria,
  sort,
  matchCount,
  totalCount,
  onChange,
  onSortChange,
  isRadar = false,
  embedded = false,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return (
      (criteria.templates && criteria.templates.length > 0) ||
      (criteria.statuses && criteria.statuses.length > 0) ||
      criteria.dateRange !== undefined ||
      (criteria.minFindings !== undefined && criteria.minFindings > 0)
    );
  }, [criteria]);

  const activeDatePreset = useMemo(() => {
    if (!criteria.dateRange) return 0;
    const days = Math.round(
      (criteria.dateRange.to.getTime() - criteria.dateRange.from.getTime()) / (1000 * 60 * 60 * 24),
    );
    return days;
  }, [criteria.dateRange]);

  // Toggle a template filter
  const toggleTemplate = useCallback(
    (template: string) => {
      const current = criteria.templates || [];
      const updated = current.includes(template)
        ? current.filter((t) => t !== template)
        : [...current, template];
      onChange({ ...criteria, templates: updated.length > 0 ? updated : undefined });
    },
    [criteria, onChange],
  );

  // Toggle a status filter
  const toggleStatus = useCallback(
    (status: string) => {
      const current = criteria.statuses || [];
      const updated = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      onChange({ ...criteria, statuses: updated.length > 0 ? updated : undefined });
    },
    [criteria, onChange],
  );

  // Set date range
  const setDateRange = useCallback(
    (days: number) => {
      if (days === 0) {
        onChange({ ...criteria, dateRange: undefined });
      } else {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - days);
        onChange({ ...criteria, dateRange: { from, to } });
      }
    },
    [criteria, onChange],
  );

  // Clear all filters
  const clearAll = useCallback(() => {
    onChange({});
  }, [onChange]);

  // Theme-aware classes
  const bg = isRadar ? 'bg-slate-900/90' : 'bg-white/95';
  const border = isRadar ? 'border-slate-700' : 'border-gray-200';
  const text = isRadar ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isRadar ? 'text-gray-500' : 'text-gray-400';
  const chipBg = isRadar ? 'bg-slate-800' : 'bg-gray-100';
  const chipActiveBg = isRadar ? 'bg-cyan-900/50' : 'bg-black';
  const chipActiveText = isRadar ? 'text-cyan-300' : 'text-white';

  return (
    <div className={`${embedded ? '' : `${bg} backdrop-blur-sm border-b ${border}`} px-3 py-1.5`}>
      {/* Compact row */}
      <div className="flex items-center gap-2 min-h-[28px]">
        {/* Template dots */}
        <div className="flex items-center gap-1">
          {templates.map((t) => {
            const active = !criteria.templates || criteria.templates.includes(t);
            const color = getTemplateColor(t);
            return (
              <button
                key={t}
                onClick={() => toggleTemplate(t)}
                className="group relative flex items-center justify-center w-5 h-5 rounded-full transition-all duration-150 hover:scale-125"
                title={getTemplateDisplayName(t)}
              >
                <div
                  className="rounded-full transition-all duration-150"
                  style={{
                    width: active ? 8 : 6,
                    height: active ? 8 : 6,
                    backgroundColor: color,
                    opacity: active ? 1 : 0.3,
                    boxShadow: active ? `0 0 6px ${color}40` : 'none',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className={`w-px h-4 ${isRadar ? 'bg-slate-700' : 'bg-gray-200'}`} />

        {/* Status chips */}
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((s) => {
            const active = criteria.statuses?.includes(s.value);
            return (
              <button
                key={s.value}
                onClick={() => toggleStatus(s.value)}
                className={`px-1.5 py-0.5 text-[9px] uppercase tracking-widest rounded transition-all duration-150 ${
                  active
                    ? `${chipActiveBg} ${chipActiveText}`
                    : `${chipBg} ${textMuted} hover:${text}`
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className={`w-px h-4 ${isRadar ? 'bg-slate-700' : 'bg-gray-200'}`} />

        {/* Date range */}
        <div className="flex items-center gap-0.5">
          {DATE_PRESETS.map((preset) => {
            const active =
              preset.days === 0
                ? !criteria.dateRange
                : activeDatePreset === preset.days;
            return (
              <button
                key={preset.label}
                onClick={() => setDateRange(preset.days)}
                className={`px-1.5 py-0.5 text-[9px] uppercase tracking-widest rounded transition-all duration-150 ${
                  active
                    ? `${chipActiveBg} ${chipActiveText}`
                    : `${chipBg} ${textMuted} hover:${text}`
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className={`text-[9px] uppercase tracking-widest ${textMuted} bg-transparent border-none outline-none cursor-pointer py-0.5`}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Match count */}
        {hasActiveFilters && matchCount !== undefined && (
          <span className={`text-[9px] font-mono tabular-nums ${textMuted}`}>
            {matchCount.toLocaleString()}
            {totalCount !== undefined && `/${totalCount.toLocaleString()}`}
          </span>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className={`text-[9px] uppercase tracking-widest ${textMuted} hover:${text} transition-colors duration-150`}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
});
