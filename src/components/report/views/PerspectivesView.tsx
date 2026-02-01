'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResearchPerspective } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { AnimatedProgressRing } from '../core/AnimatedNumber';
import { ViewHeader } from '../shared/ViewHeader';
import { EmptyState } from '../shared/EmptyState';
import { getPerspectiveGradient } from '../shared/typeConfig';

interface PerspectivesViewProps {
  perspectives: ResearchPerspective[];
}

// Stagger animation variants - calculated once at parent level
const selectorContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const selectorItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export function PerspectivesView({ perspectives }: PerspectivesViewProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const [expanded, setExpanded] = useState<string | null>(perspectives[0]?.id || null);

  if (perspectives.length === 0) {
    return (
      <EmptyState
        type="lightbulb"
        title="No perspectives available"
        description="Analysis viewpoints haven't been generated for this research yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ViewHeader title="Perspectives" count={perspectives.length} subtitle="Multi-angle analysis viewpoints" persona="domain" />

      {/* Perspective selector */}
      <motion.div
        className="flex flex-wrap gap-2"
        variants={selectorContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {perspectives.map((p) => {
          const gradient = getPerspectiveGradient(p.perspective_type);
          const isActive = expanded === p.id;
          return (
            <motion.button
              key={p.id}
              variants={selectorItemVariants}
              onClick={() => setExpanded(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                  : theme === 'radar'
                    ? 'bg-slate-800/50 text-slate-400 hover:text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {p.perspective_type.replace('_', ' ')}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Active perspective detail */}
      <AnimatePresence mode="wait">
        {perspectives.filter(p => p.id === expanded).map(perspective => (
          <PerspectiveDetail key={perspective.id} perspective={perspective} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function PerspectiveDetail({ perspective }: { perspective: ResearchPerspective }) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const gradient = getPerspectiveGradient(perspective.perspective_type);
  const confidence = perspective.confidence || 0;
  const insights = perspective.key_insights || [];
  const warnings = perspective.warnings || [];
  const recommendations = perspective.recommendations || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl overflow-hidden ${theme === 'radar' ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}
    >
      {/* Header */}
      <div className={`p-4 bg-gradient-to-r ${gradient}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white capitalize">{perspective.perspective_type.replace('_', ' ')} Analysis</h3>
            <p className="text-sm text-white/70 mt-1">Confidence: {Math.round(confidence * 100)}%</p>
          </div>
          <AnimatedProgressRing value={confidence * 100} size={56} strokeWidth={4} color="rgba(255,255,255,0.9)" bgColor="rgba(255,255,255,0.2)" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {perspective.analysis_text && (
          <p className={`text-sm leading-relaxed ${styles.text}`}>{perspective.analysis_text}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Insights */}
          {insights.length > 0 && (
            <div className={`p-3 rounded-lg ${theme === 'radar' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'radar' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Insights
              </h4>
              <ul className="space-y-2">
                {insights.slice(0, 4).map((ins, i) => (
                  <li key={i} className={`text-xs ${theme === 'radar' ? 'text-emerald-200/80' : 'text-emerald-800'}`}>
                    • {ins}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className={`p-3 rounded-lg ${theme === 'radar' ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'radar' ? 'text-amber-400' : 'text-amber-700'}`}>
                Warnings
              </h4>
              <ul className="space-y-2">
                {warnings.slice(0, 4).map((w, i) => (
                  <li key={i} className={`text-xs ${theme === 'radar' ? 'text-amber-200/80' : 'text-amber-800'}`}>
                    • {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className={`p-3 rounded-lg ${theme === 'radar' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'radar' ? 'text-blue-400' : 'text-blue-700'}`}>
                Actions
              </h4>
              <ul className="space-y-2">
                {recommendations.slice(0, 4).map((rec, i) => (
                  <li key={i} className={`text-xs ${theme === 'radar' ? 'text-blue-200/80' : 'text-blue-800'}`}>
                    {i + 1}. {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
