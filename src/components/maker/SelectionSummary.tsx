'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, BarChart3, FileText, Sparkles } from 'lucide-react';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';
import type { DraftMode } from '@/src/hooks/useVideoDrafts';

interface SelectionSummaryProps {
  selectionState: ContentSelectionState;
  mode: DraftMode;
}

export const SelectionSummary = memo(function SelectionSummary({ selectionState, mode }: SelectionSummaryProps) {
  const { counts } = selectionState;
  const totalSelected =
    counts.findings.selected + counts.perspectives.selected + counts.analysis.selected;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CountBadge
          label="Findings"
          selected={counts.findings.selected}
          total={counts.findings.total}
          icon={<Search className="w-3.5 h-3.5" />}
        />
        <CountBadge
          label="Perspectives"
          selected={counts.perspectives.selected}
          total={counts.perspectives.total}
          icon={<Eye className="w-3.5 h-3.5" />}
        />
        <CountBadge
          label="Analysis"
          selected={counts.analysis.selected}
          total={counts.analysis.total}
          icon={<BarChart3 className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Mode indicator */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium ${
          mode === 'draft'
            ? 'text-violet-400 bg-violet-500/10'
            : 'text-slate-500 bg-slate-800/40'
        }`}>
          {mode === 'draft' ? (
            <Sparkles className="w-3 h-3" />
          ) : (
            <FileText className="w-3 h-3" />
          )}
          {mode === 'draft' ? 'Draft' : 'Original'}
        </div>

        <motion.div
          key={totalSelected}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-medium text-cyan-400"
        >
          {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected for video
        </motion.div>
      </div>
    </div>
  );
});

interface CountBadgeProps {
  label: string;
  selected: number;
  total: number;
  icon: React.ReactNode;
}

const CountBadge = memo(function CountBadge({ label, selected, total, icon }: CountBadgeProps) {
  const hasSelection = selected > 0;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        hasSelection
          ? 'bg-cyan-500/8 border border-cyan-500/20'
          : 'bg-slate-800/40 border border-transparent'
      }`}
    >
      <span className={hasSelection ? 'text-cyan-400' : 'text-slate-500'}>
        {icon}
      </span>
      <span className={`text-xs ${hasSelection ? 'text-cyan-300' : 'text-slate-500'}`}>
        {label}
      </span>
      <span
        className={`font-mono text-sm ${
          hasSelection ? 'text-cyan-300' : 'text-slate-400'
        }`}
      >
        {selected}/{total}
      </span>
    </div>
  );
});
