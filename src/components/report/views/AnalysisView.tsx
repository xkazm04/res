'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResearchContradiction, ResearchGap, CausalChain } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { ThemedBadge } from '../ThemedCards';
import { CausalFlow } from '../visualizations/CausalFlow';
import { ContradictionMatrix } from '../visualizations/ContradictionMatrix';
import { ViewHeader } from '../shared/ViewHeader';
import { EmptyState } from '../shared/EmptyState';
import { CollapsibleSection, SectionGroup } from '../shared/CollapsibleSection';

interface AnalysisViewProps {
  contradictions: ResearchContradiction[];
  gaps: ResearchGap[];
  causalChains: CausalChain[];
}

export function AnalysisView({ contradictions, gaps, causalChains }: AnalysisViewProps) {
  const hasContent = contradictions.length > 0 || gaps.length > 0 || causalChains.length > 0;

  if (!hasContent) {
    return (
      <EmptyState
        type="chain"
        title="No analysis data available"
        description="Contradictions, gaps, and causal chains haven't been identified yet."
      />
    );
  }

  const totalItems = contradictions.length + gaps.length + causalChains.length;

  return (
    <SectionGroup>
      <ViewHeader title="Analysis" count={totalItems} subtitle="Contradictions, gaps, and causal relationships" persona="contradiction" />

      {/* Contradictions Section */}
      {contradictions.length > 0 && (
        <CollapsibleSection
          sectionId="analysis-contradictions"
          title="Contradictions"
          subtitle="Conflicting claims and source disagreements"
          icon="⚡"
          count={contradictions.length}
          variant="card"
        >
          <ContradictionMatrix contradictions={contradictions} />
        </CollapsibleSection>
      )}

      {/* Research Gaps Section */}
      {gaps.length > 0 && (
        <CollapsibleSection
          sectionId="analysis-gaps"
          title="Research Gaps"
          subtitle="Areas requiring further investigation"
          icon="🔍"
          count={gaps.length}
          variant="card"
        >
          <div className="space-y-3">
            {gaps.map((g, i) => <GapCard key={g.id} gap={g} delay={i * 0.05} />)}
          </div>
        </CollapsibleSection>
      )}

      {/* Causal Chains Section */}
      {causalChains.length > 0 && (
        <CollapsibleSection
          sectionId="analysis-chains"
          title="Causal Chains"
          subtitle="Cause-and-effect relationships"
          icon="🔗"
          count={causalChains.length}
          variant="card"
        >
          <CausalFlow chains={causalChains} />
        </CollapsibleSection>
      )}
    </SectionGroup>
  );
}

function GapCard({ gap, delay }: { gap: ResearchGap; delay: number }) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const [showQueries, setShowQueries] = useState(false);
  const queries = gap.suggested_queries || [];

  const priorityColors = {
    high: isRadar ? 'text-rose-400 bg-rose-500/20' : 'text-rose-700 bg-rose-100',
    medium: isRadar ? 'text-amber-400 bg-amber-500/20' : 'text-amber-700 bg-amber-100',
    low: isRadar ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-700 bg-emerald-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`rounded-xl overflow-hidden ${isRadar ? 'bg-slate-900/60 border border-violet-500/20' : 'bg-white border border-violet-200'}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <ThemedBadge variant="warning">{gap.gap_type}</ThemedBadge>
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium uppercase ${priorityColors[gap.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
            {gap.priority}
          </span>
        </div>

        <p className={`text-sm ${styles.text}`}>{gap.description}</p>

        {queries.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowQueries(!showQueries)}
              className={`text-xs font-medium flex items-center gap-1 ${isRadar ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-800'}`}
            >
              <span>{showQueries ? '▼' : '▶'}</span>
              {queries.length} suggested queries
            </button>

            <AnimatePresence>
              {showQueries && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-2"
                >
                  {queries.map((q, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-2 rounded-lg text-xs flex items-center gap-2 ${isRadar ? 'bg-slate-800/50 text-slate-300' : 'bg-stone-50 text-stone-700'}`}
                    >
                      <span className={isRadar ? 'text-violet-400' : 'text-violet-500'}>→</span>
                      {q}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
