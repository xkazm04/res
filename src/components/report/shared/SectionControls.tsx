'use client';

import { motion } from 'framer-motion';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { useSectionCollapseContext } from '@/src/hooks/useSectionCollapse';

interface SectionControlsProps {
  /** Optional className for styling */
  className?: string;
  /** Show only when there are sections */
  hideWhenEmpty?: boolean;
}

/**
 * Expand All / Collapse All controls for collapsible sections.
 * Must be used within a SectionCollapseProvider.
 */
export function SectionControls({ className = '', hideWhenEmpty = true }: SectionControlsProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const context = useSectionCollapseContext();

  // Don't render if no context or no sections
  if (!context) return null;
  if (hideWhenEmpty && context.totalSections === 0) return null;

  const { expandAll, collapseAll, collapsedCount, totalSections } = context;
  const allCollapsed = collapsedCount === totalSections && totalSections > 0;
  const allExpanded = collapsedCount === 0;

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="section-controls">
      {/* Section count indicator */}
      <span className={`text-[10px] ${styles.textMuted}`}>
        {collapsedCount}/{totalSections} collapsed
      </span>

      {/* Expand All button */}
      <motion.button
        onClick={expandAll}
        disabled={allExpanded}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          allExpanded
            ? isRadar
              ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            : isRadar
              ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700 hover:text-cyan-200 border border-cyan-500/20'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 hover:border-stone-400'
        }`}
        title="Expand all sections"
        data-testid="section-controls-expand-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span>Expand All</span>
      </motion.button>

      {/* Collapse All button */}
      <motion.button
        onClick={collapseAll}
        disabled={allCollapsed}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          allCollapsed
            ? isRadar
              ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            : isRadar
              ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700 hover:text-cyan-200 border border-cyan-500/20'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 hover:border-stone-400'
        }`}
        title="Collapse all sections"
        data-testid="section-controls-collapse-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
        <span>Collapse All</span>
      </motion.button>
    </div>
  );
}

/**
 * Compact version of section controls for tight spaces
 */
export function SectionControlsCompact({ className = '' }: { className?: string }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  const context = useSectionCollapseContext();

  if (!context || context.totalSections === 0) return null;

  const { expandAll, collapseAll, collapsedCount, totalSections } = context;
  const allCollapsed = collapsedCount === totalSections && totalSections > 0;
  const allExpanded = collapsedCount === 0;

  const buttonBase = `p-1.5 rounded transition-colors ${
    isRadar
      ? 'hover:bg-slate-800 text-slate-400 hover:text-cyan-300'
      : 'hover:bg-stone-100 text-stone-500 hover:text-stone-700'
  }`;

  const disabledBase = isRadar
    ? 'text-slate-700 cursor-not-allowed'
    : 'text-stone-300 cursor-not-allowed';

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="section-controls-compact">
      <button
        onClick={expandAll}
        disabled={allExpanded}
        className={allExpanded ? disabledBase : buttonBase}
        title="Expand all sections"
        data-testid="section-controls-expand-all-compact"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
      <button
        onClick={collapseAll}
        disabled={allCollapsed}
        className={allCollapsed ? disabledBase : buttonBase}
        title="Collapse all sections"
        data-testid="section-controls-collapse-all-compact"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
      </button>
    </div>
  );
}
