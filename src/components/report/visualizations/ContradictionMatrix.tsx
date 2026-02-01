'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';
import type { ResearchContradiction } from '@/src/types/research';

interface ContradictionMatrixProps {
  contradictions: ResearchContradiction[];
}

type ResolutionStatus = 'unresolved' | 'investigating' | 'resolved';

export function ContradictionMatrix({ contradictions }: ContradictionMatrixProps) {
  const { colors, isRadar, surfaceClasses, getStatusColor, getButtonClasses } = useVisualizationTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ResolutionStatus>>({});

  const setStatus = (id: string, status: ResolutionStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  };

  return (
    <div className="space-y-3">
      {contradictions.map((c, i) => {
        const status = statuses[c.id] || 'unresolved';
        const isExpanded = expanded === c.id;
        const statusColors = getStatusColor(status);

        return (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${statusColors.border}40`,
            }}
          >
            {/* Header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : c.id)}
              className="w-full p-4 flex items-center gap-4"
            >
              {/* Severity indicator */}
              <motion.div
                animate={{ scale: status === 'unresolved' ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 2, repeat: status === 'unresolved' ? Infinity : 0 }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: statusColors.bg,
                  color: statusColors.text,
                }}
              >
                {status === 'resolved' ? '✓' : status === 'investigating' ? '?' : '⚡'}
              </motion.div>

              {/* Summary */}
              <div className="flex-1 text-left">
                <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {c.claim_1?.slice(0, 50)}... <span style={{ color: colors.danger }}>vs</span> {c.claim_2?.slice(0, 50)}...
                </div>
                <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {status === 'resolved' ? 'Resolved' : status === 'investigating' ? 'Under investigation' : 'Needs resolution'}
                </div>
              </div>

              {/* Expand arrow */}
              <motion.svg
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="w-5 h-5"
                style={{ color: colors.textSecondary }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
                >
                  <div className="p-4 space-y-4">
                    {/* Claims comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <ClaimCard label="Claim A" text={c.claim_1 || ''} colors={colors} />
                      <ClaimCard label="Claim B" text={c.claim_2 || ''} colors={colors} />
                    </div>

                    {/* Resolution hint */}
                    {c.resolution_hint && (
                      <div className={`p-3 rounded-lg ${surfaceClasses}`}>
                        <div
                          className="text-[10px] uppercase tracking-wider mb-1"
                          style={{ color: isRadar ? colors.primaryMuted : colors.textSecondary }}
                        >
                          Resolution Hint
                        </div>
                        <p className="text-sm" style={{ color: colors.textPrimary }}>{c.resolution_hint}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {(['unresolved', 'investigating', 'resolved'] as ResolutionStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setStatus(c.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${getButtonClasses(status === s)}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function ClaimCard({ label, text, colors }: { label: string; text: string; colors: ReturnType<typeof useVisualizationTheme>['colors'] }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: colors.surfaceBg }}>
      <div
        className="text-[10px] uppercase tracking-wider mb-2"
        style={{ color: `${colors.danger}99` }}
      >
        {label}
      </div>
      <p className="text-sm" style={{ color: colors.textPrimary }}>{text}</p>
    </div>
  );
}
