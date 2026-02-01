'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { AnimatedNumber } from '../core/AnimatedNumber';
import { FilterChip } from '../shared/FilterChip';

export interface KeyPoint {
  id: string;
  text: string;
  type: 'insight' | 'warning' | 'action' | 'fact';
  confidence: number;
  sourceCount: number;
  /** Related finding IDs for navigation */
  relatedFindings?: string[];
  /** Source IDs that support this point */
  sourceIds?: string[];
}

export interface KeyPointsPanelProps {
  points: KeyPoint[];
  /** @deprecated Use onNavigateToFinding instead */
  onPointClick?: (pointId: string) => void;
  highlightedPoint?: string;
  /** Navigate to a specific finding - called when user clicks a related finding */
  onNavigateToFinding?: (findingId: string) => void;
  /** Navigate to a specific source - called when user clicks a source link */
  onNavigateToSource?: (sourceId: string) => void;
}

// Icon mapping for KeyPoint types (colors now come from theme semantic system)
const typeIcons: Record<KeyPoint['type'], string> = {
  insight: '💡',
  warning: '⚠️',
  action: '🎯',
  fact: '📊',
};

export function KeyPointsPanel({
  points,
  onPointClick,
  highlightedPoint,
  onNavigateToFinding,
  onNavigateToSource,
}: KeyPointsPanelProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const [filter, setFilter] = useState<KeyPoint['type'] | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredPoints = filter === 'all' ? points : points.filter(p => p.type === filter);
  const typeCounts = {
    insight: points.filter(p => p.type === 'insight').length,
    warning: points.filter(p => p.type === 'warning').length,
    action: points.filter(p => p.type === 'action').length,
    fact: points.filter(p => p.type === 'fact').length,
  };

  // Get semantic colors for a KeyPoint type from the theme
  const getSemanticColors = (type: KeyPoint['type']) => styles.semantic[type];

  return (
    <div className={`rounded-2xl overflow-hidden ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isRadar ? 'border-cyan-500/10' : 'border-stone-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${styles.text}`}>Key Points</h3>
          <span className={`text-xs ${styles.textMuted}`}>
            <AnimatedNumber value={filteredPoints.length} /> points
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All"
            count={points.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {(Object.keys(typeIcons) as KeyPoint['type'][]).map(type => (
            <FilterChip
              key={type}
              label={typeIcons[type]}
              count={typeCounts[type]}
              active={filter === type}
              onClick={() => setFilter(type)}
            />
          ))}
        </div>
      </div>

      {/* Points list */}
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredPoints.map((point, i) => {
            const semanticColors = getSemanticColors(point.type);
            const icon = typeIcons[point.type];
            const isExpanded = expanded === point.id;
            const isHighlighted = highlightedPoint === point.id;

            return (
              <motion.div
                key={point.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl border cursor-pointer overflow-hidden transition-all ${semanticColors.bg} ${semanticColors.border} ${semanticColors.bgHover} ${isHighlighted ? (isRadar ? 'ring-2 ring-cyan-400' : 'ring-2 ring-stone-800') : ''}`}
                onClick={() => {
                  setExpanded(isExpanded ? null : point.id);
                  onPointClick?.(point.id);
                }}
              >
                {/* Main content */}
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${semanticColors.text}`}>
                        {point.text}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] ${styles.textMuted}`}>
                          {Math.round(point.confidence * 100)}% confidence
                        </span>
                        <span className={`text-[10px] ${styles.textMuted}`}>
                          {point.sourceCount} sources
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (point.relatedFindings || point.sourceIds) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`border-t ${isRadar ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}
                    >
                      <div className="p-3 space-y-3">
                        {/* Related Findings - clickable for navigation */}
                        {point.relatedFindings && point.relatedFindings.length > 0 && (
                          <div>
                            <div className={`text-[10px] uppercase tracking-wider mb-2 ${styles.textMuted}`}>
                              Related Findings
                            </div>
                            <ul className="space-y-1">
                              {point.relatedFindings.slice(0, 3).map((findingId, j) => (
                                <li key={j}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigateToFinding?.(findingId);
                                    }}
                                    className={`text-xs text-left w-full transition-colors ${
                                      onNavigateToFinding
                                        ? isRadar
                                          ? 'text-cyan-400 hover:text-cyan-300 hover:underline'
                                          : 'text-stone-700 hover:text-stone-900 hover:underline'
                                        : styles.textMuted
                                    }`}
                                    disabled={!onNavigateToFinding}
                                  >
                                    → {findingId}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Source links - clickable for navigation */}
                        {point.sourceIds && point.sourceIds.length > 0 && (
                          <div>
                            <div className={`text-[10px] uppercase tracking-wider mb-2 ${styles.textMuted}`}>
                              Sources
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {point.sourceIds.slice(0, 5).map((sourceId, j) => (
                                <button
                                  key={j}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToSource?.(sourceId);
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                                    onNavigateToSource
                                      ? isRadar
                                        ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                                      : isRadar
                                        ? 'bg-slate-800 text-slate-400'
                                        : 'bg-stone-100 text-stone-400'
                                  }`}
                                  disabled={!onNavigateToSource}
                                >
                                  [{j + 1}]
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
