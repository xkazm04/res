'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResearchContradiction, ResearchGap, CausalChain } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { ThemedBadge } from '../ThemedCards';
import { AnimatedNumber } from '../core/AnimatedNumber';
import { CausalFlow } from '../visualizations/CausalFlow';
import { ContradictionMatrix } from '../visualizations/ContradictionMatrix';
import { ViewHeader } from '../shared/ViewHeader';
import { EmptyState } from '../shared/EmptyState';

interface AnalysisViewProps {
  contradictions: ResearchContradiction[];
  gaps: ResearchGap[];
  causalChains: CausalChain[];
}

type AnalysisTab = 'contradictions' | 'gaps' | 'chains';

export function AnalysisView({ contradictions, gaps, causalChains }: AnalysisViewProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const [activeTab, setActiveTab] = useState<AnalysisTab>('contradictions');

  const tabs: { key: AnalysisTab; label: string; count: number; icon: string }[] = [
    { key: 'contradictions', label: 'Contradictions', count: contradictions.length, icon: '⚡' },
    { key: 'gaps', label: 'Research Gaps', count: gaps.length, icon: '🔍' },
    { key: 'chains', label: 'Causal Chains', count: causalChains.length, icon: '🔗' },
  ];

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
    <div className="space-y-4">
      <ViewHeader title="Analysis" count={totalItems} subtitle="Contradictions, gaps, and causal relationships" persona="contradiction" />

      {/* Tab navigation - sticky for long scrolling views */}
      <div className={`sticky top-0 z-10 flex gap-2 p-2 rounded-xl backdrop-blur-sm ${isRadar ? 'bg-slate-900/80' : 'bg-stone-100/95'}`}>
        {tabs.filter(t => t.count > 0).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? isRadar ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-stone-900 shadow'
                : isRadar ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
              activeTab === tab.key
                ? isRadar ? 'bg-cyan-500/30' : 'bg-stone-800 text-white'
                : isRadar ? 'bg-slate-700' : 'bg-stone-200'
            }`}>
              <AnimatedNumber value={tab.count} />
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'contradictions' && contradictions.length > 0 && (
          <motion.div key="contradictions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ContradictionMatrix contradictions={contradictions} />
          </motion.div>
        )}

        {activeTab === 'gaps' && gaps.length > 0 && (
          <motion.div key="gaps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            {gaps.map((g, i) => <GapCard key={g.id} gap={g} delay={i * 0.05} />)}
          </motion.div>
        )}

        {activeTab === 'chains' && causalChains.length > 0 && (
          <motion.div key="chains" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <CausalFlow chains={causalChains} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
