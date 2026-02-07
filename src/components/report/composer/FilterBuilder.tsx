'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme } from '../core/ThemeContext';
import type {
  TextFilter,
  ConfidenceFilter,
  CredibilityFilter,
} from '@/src/stores/customTabStore';
import type {
  FindingType,
  EntityType,
  SourceType,
  PerspectiveType,
  GapPriority,
  TemporalContext,
} from '@/src/types/research';

// ============================================
// SHARED FILTER COMPONENTS
// ============================================

interface TextFilterBuilderProps {
  value: TextFilter;
  onChange: (value: TextFilter) => void;
  placeholder?: string;
}

export function TextFilterBuilder({ value, onChange, placeholder = 'Search...' }: TextFilterBuilderProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="rounded"
          data-testid="text-filter-enabled"
        />
        <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
          Enable text filter
        </span>
      </div>

      <AnimatePresence>
        {value.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <input
              type="text"
              value={value.query}
              onChange={(e) => onChange({ ...value, query: e.target.value })}
              placeholder={placeholder}
              className={`w-full px-3 py-1.5 text-sm rounded border ${
                isRadar
                  ? 'bg-slate-800 border-cyan-500/30 text-white placeholder-slate-500 focus:border-cyan-400'
                  : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-400'
              } focus:outline-none`}
              data-testid="text-filter-query"
            />

            <div className="flex gap-1">
              {(['contains', 'exact', 'regex'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onChange({ ...value, matchType: type })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    value.matchType === type
                      ? isRadar
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-stone-900 text-white'
                      : isRadar
                        ? 'bg-slate-700 text-slate-400 hover:text-white'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                  data-testid={`text-filter-match-${type}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RangeFilterBuilderProps {
  label: string;
  value: ConfidenceFilter | CredibilityFilter;
  onChange: (value: ConfidenceFilter | CredibilityFilter) => void;
}

export function RangeFilterBuilder({ label, value, onChange }: RangeFilterBuilderProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="rounded"
          data-testid={`range-filter-${label.toLowerCase()}-enabled`}
        />
        <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
          Filter by {label}
        </span>
      </div>

      <AnimatePresence>
        {value.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                Min: {value.min}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={value.min}
                onChange={(e) => onChange({ ...value, min: parseInt(e.target.value) })}
                className="flex-1"
                data-testid={`range-filter-${label.toLowerCase()}-min`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                Max: {value.max}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={value.max}
                onChange={(e) => onChange({ ...value, max: parseInt(e.target.value) })}
                className="flex-1"
                data-testid={`range-filter-${label.toLowerCase()}-max`}
              />
            </div>

            {/* Quick presets */}
            <div className="flex gap-1">
              <button
                onClick={() => onChange({ ...value, min: 0, max: 50 })}
                className={`px-2 py-1 text-xs rounded ${
                  isRadar
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-rose-100 text-rose-700'
                }`}
                data-testid={`range-filter-${label.toLowerCase()}-low`}
              >
                Low
              </button>
              <button
                onClick={() => onChange({ ...value, min: 50, max: 80 })}
                className={`px-2 py-1 text-xs rounded ${
                  isRadar
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-amber-100 text-amber-700'
                }`}
                data-testid={`range-filter-${label.toLowerCase()}-medium`}
              >
                Medium
              </button>
              <button
                onClick={() => onChange({ ...value, min: 80, max: 100 })}
                className={`px-2 py-1 text-xs rounded ${
                  isRadar
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
                data-testid={`range-filter-${label.toLowerCase()}-high`}
              >
                High
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MULTI-SELECT CHIPS
// ============================================

interface MultiSelectChipsProps<T extends string> {
  label: string;
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  getLabel?: (option: T) => string;
}

export function MultiSelectChips<T extends string>({
  label,
  options,
  selected,
  onChange,
  getLabel = (o) => o.charAt(0).toUpperCase() + o.slice(1),
}: MultiSelectChipsProps<T>) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const toggleOption = useCallback(
    (option: T) => {
      if (selected.includes(option)) {
        onChange(selected.filter((s) => s !== option));
      } else {
        onChange([...selected, option]);
      }
    },
    [selected, onChange]
  );

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
          {label}
        </span>
        <div className="flex gap-1">
          <button
            onClick={selectAll}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              isRadar
                ? 'text-cyan-400 hover:bg-cyan-500/10'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            data-testid={`multi-select-${label.toLowerCase().replace(/\s/g, '-')}-all`}
          >
            All
          </button>
          <button
            onClick={clearAll}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              isRadar
                ? 'text-slate-400 hover:bg-slate-700'
                : 'text-stone-400 hover:bg-stone-100'
            }`}
            data-testid={`multi-select-${label.toLowerCase().replace(/\s/g, '-')}-none`}
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                isSelected
                  ? isRadar
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                    : 'bg-stone-900 text-white'
                  : isRadar
                    ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
              data-testid={`multi-select-chip-${option}`}
            >
              {getLabel(option)}
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className={`text-[10px] ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
          No filter applied (all included)
        </p>
      )}
    </div>
  );
}

// ============================================
// SECTION TOGGLE
// ============================================

interface SectionToggleProps {
  label: string;
  icon: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  count?: number;
  children: React.ReactNode;
}

export function SectionToggle({
  label,
  icon,
  enabled,
  onToggle,
  count,
  children,
}: SectionToggleProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  const [expanded, setExpanded] = useState(enabled);

  return (
    <div
      className={`rounded-lg border transition-colors ${
        enabled
          ? isRadar
            ? 'border-cyan-500/30 bg-slate-800/50'
            : 'border-stone-300 bg-white'
          : isRadar
            ? 'border-slate-700 bg-slate-900/50 opacity-60'
            : 'border-stone-200 bg-stone-50 opacity-60'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center gap-3 text-left ${
          isRadar ? 'hover:bg-slate-700/30' : 'hover:bg-stone-50'
        }`}
        data-testid={`section-toggle-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            e.stopPropagation();
            onToggle(e.target.checked);
          }}
          className="rounded"
          data-testid={`section-enabled-${label.toLowerCase().replace(/\s/g, '-')}`}
        />

        <span className="text-lg">{icon}</span>

        <span className={`flex-1 text-sm font-medium ${isRadar ? 'text-white' : 'text-stone-900'}`}>
          {label}
        </span>

        {count !== undefined && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              isRadar ? 'bg-slate-700 text-slate-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {count}
          </span>
        )}

        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''} ${
            isRadar ? 'text-slate-400' : 'text-stone-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`px-4 pb-4 pt-2 border-t space-y-4 ${
                isRadar ? 'border-slate-700' : 'border-stone-100'
              }`}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// TYPE-SPECIFIC FILTER BUILDERS
// ============================================

const FINDING_TYPES: FindingType[] = ['fact', 'claim', 'event', 'actor', 'relationship', 'pattern', 'gap', 'evidence'];
const ENTITY_TYPES: EntityType[] = ['person', 'organization', 'location', 'product', 'concept', 'event'];
const SOURCE_TYPES: SourceType[] = ['news', 'academic', 'government', 'corporate', 'blog', 'social', 'wiki', 'unknown'];
const PERSPECTIVE_TYPES: PerspectiveType[] = ['historical', 'political', 'economic', 'psychological', 'military', 'social', 'technological', 'financial', 'journalist', 'conspirator', 'network'];
const GAP_PRIORITIES: GapPriority[] = ['high', 'medium', 'low'];
const TEMPORAL_CONTEXTS: TemporalContext[] = ['historical', 'current', 'ongoing', 'predicted', 'past', 'present', 'prediction'];

export { FINDING_TYPES, ENTITY_TYPES, SOURCE_TYPES, PERSPECTIVE_TYPES, GAP_PRIORITIES, TEMPORAL_CONTEXTS };

// ============================================
// LIMIT INPUT
// ============================================

interface LimitInputProps {
  value?: number;
  onChange: (value?: number) => void;
}

export function LimitInput({ value, onChange }: LimitInputProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
        Limit results:
      </span>
      <input
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
        placeholder="No limit"
        className={`w-20 px-2 py-1 text-xs rounded border ${
          isRadar
            ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
            : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
        } focus:outline-none`}
        data-testid="limit-input"
      />
    </div>
  );
}
