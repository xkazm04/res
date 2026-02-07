'use client';

import { getTemplateDisplayName, getTemplateColor } from '@/src/stores/appStore';
import { getSessionIndex } from '@/src/lib/sessionIndex';
import { useMemo } from 'react';

const TEMPLATE_TYPES = [
  'investigative',
  'financial',
  'competitive',
  'understanding',
  'tech_market',
  'legal',
  'due_diligence',
  'reputation',
] as const;

interface TemplateFilterProps {
  value: string | null;
  onChange: (template: string | null) => void;
}

export function TemplateFilter({ value, onChange }: TemplateFilterProps) {
  const stats = useMemo(() => {
    const index = getSessionIndex();
    return index.getStats();
  }, []);

  const totalCount = stats.totalSessions;

  return (
    <div className="flex flex-wrap gap-1 p-2">
      <FilterChip
        label="All"
        count={totalCount}
        active={!value}
        onClick={() => onChange(null)}
      />
      {TEMPLATE_TYPES.map((template) => {
        const count = stats.templateCounts[template] || 0;
        if (count === 0) return null;
        return (
          <FilterChip
            key={template}
            label={getTemplateDisplayName(template)}
            count={count}
            active={value === template}
            onClick={() => onChange(template)}
            color={getTemplateColor(template)}
          />
        );
      })}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}

function FilterChip({ label, count, active, onClick, color }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all
        ${active
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
        }
      `}
    >
      {color && !active && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{label}</span>
      <span className={`text-[10px] ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}
