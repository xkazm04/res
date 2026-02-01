'use client';

/**
 * WhatIfControls
 *
 * Interactive sliders and controls for what-if scenario analysis,
 * allowing users to adjust parameters and see propagation effects.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type {
  CausalChain,
  CausalNode,
  WhatIfScenario,
  PropagationResult,
} from '@/src/lib/causalLayout';
import { cn } from '@/src/lib/utils';
import {
  Sliders,
  Play,
  RotateCcw,
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface WhatIfControlsProps {
  chain: CausalChain;
  scenario: WhatIfScenario | null;
  propagations: PropagationResult[];
  onCreateScenario: (name: string) => WhatIfScenario;
  onUpdateScenario: (scenario: WhatIfScenario) => void;
  onApplyScenario: (scenario: WhatIfScenario) => void;
  onClearScenario: () => void;
  onSaveScenario?: (scenario: WhatIfScenario) => void;
  savedScenarios?: WhatIfScenario[];
  onLoadScenario?: (scenario: WhatIfScenario) => void;
  onDeleteScenario?: (scenarioId: string) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function WhatIfControls({
  chain,
  scenario,
  propagations,
  onCreateScenario,
  onUpdateScenario,
  onApplyScenario,
  onClearScenario,
  onSaveScenario,
  savedScenarios = [],
  onLoadScenario,
  onDeleteScenario,
  className,
}: WhatIfControlsProps) {
  const { colors, isRadar, getConfidenceColor } = useVisualizationTheme();

  // Local state
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSavedScenarios, setShowSavedScenarios] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  // Get current modifications as a map for easy lookup
  const modificationMap = useMemo(() => {
    if (!scenario) return new Map();
    const map = new Map<string, WhatIfScenario['modifications'][0]>();
    scenario.modifications.forEach((mod) => {
      const key = mod.nodeId || mod.edgeId || '';
      map.set(key, mod);
    });
    return map;
  }, [scenario]);

  // Get node color
  const getNodeColor = (type: CausalNode['type']): string => {
    switch (type) {
      case 'cause':
        return colors.primary;
      case 'effect':
        return colors.success;
      case 'mediator':
        return colors.secondary;
      case 'moderator':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  // Create new scenario
  const handleCreateScenario = useCallback(() => {
    const name = newScenarioName.trim() || `Scenario ${Date.now()}`;
    const newScenario = onCreateScenario(name);
    setNewScenarioName('');
    onApplyScenario(newScenario);
  }, [newScenarioName, onCreateScenario, onApplyScenario]);

  // Add or update modification
  const handleModification = useCallback(
    (nodeId: string, property: 'weight' | 'confidence', newValue: number) => {
      if (!scenario) return;

      const node = chain.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const originalValue = node[property];
      const existingModIndex = scenario.modifications.findIndex(
        (m) => m.nodeId === nodeId && m.property === property
      );

      let updatedModifications = [...scenario.modifications];

      if (existingModIndex >= 0) {
        // Update existing
        if (Math.abs(newValue - originalValue) < 0.01) {
          // Remove if back to original
          updatedModifications.splice(existingModIndex, 1);
        } else {
          updatedModifications[existingModIndex] = {
            ...updatedModifications[existingModIndex],
            newValue,
          };
        }
      } else {
        // Add new
        updatedModifications.push({
          nodeId,
          property,
          originalValue,
          newValue,
        });
      }

      const updatedScenario: WhatIfScenario = {
        ...scenario,
        modifications: updatedModifications,
      };

      onUpdateScenario(updatedScenario);
      onApplyScenario(updatedScenario);
    },
    [scenario, chain.nodes, onUpdateScenario, onApplyScenario]
  );

  // Get modified value for a node
  const getModifiedValue = useCallback(
    (nodeId: string, property: 'weight' | 'confidence', original: number): number => {
      const mod = scenario?.modifications.find(
        (m) => m.nodeId === nodeId && m.property === property
      );
      return mod ? mod.newValue : original;
    },
    [scenario]
  );

  // Get propagation for a node
  const getPropagation = useCallback(
    (nodeId: string): PropagationResult | undefined => {
      return propagations.find((p) => p.nodeId === nodeId);
    },
    [propagations]
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const increases = propagations.filter((p) => p.direction === 'increase').length;
    const decreases = propagations.filter((p) => p.direction === 'decrease').length;
    const unchanged = propagations.filter((p) => p.direction === 'unchanged').length;
    const maxImpact = Math.max(...propagations.map((p) => Math.abs(p.changePercent)), 0);
    return { increases, decreases, unchanged, maxImpact };
  }, [propagations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl overflow-hidden', className)}
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: colors.surfaceBg }}
      >
        <div className="flex items-center gap-2">
          <Sliders size={16} style={{ color: colors.primary }} />
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            What-If Analysis
          </span>
          {scenario && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: colors.primaryFill,
                color: colors.primary,
              }}
            >
              {scenario.modifications.length} changes
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={16} style={{ color: colors.textSecondary }} />
        ) : (
          <ChevronDown size={16} style={{ color: colors.textSecondary }} />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* No scenario state */}
              {!scenario && (
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Create a scenario to explore how changes propagate through the causal chain.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      placeholder="Scenario name (optional)"
                      className="flex-1 px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: colors.surfaceBg,
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                      }}
                    />
                    <button
                      onClick={handleCreateScenario}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: colors.primary,
                        color: colors.textOnDark,
                      }}
                    >
                      <Plus size={14} />
                      Create
                    </button>
                  </div>

                  {/* Saved scenarios */}
                  {savedScenarios.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowSavedScenarios(!showSavedScenarios)}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: colors.textMuted }}
                      >
                        {showSavedScenarios ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {savedScenarios.length} saved scenario{savedScenarios.length !== 1 ? 's' : ''}
                      </button>
                      <AnimatePresence>
                        {showSavedScenarios && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 space-y-1"
                          >
                            {savedScenarios.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between p-2 rounded-lg"
                                style={{ backgroundColor: colors.surfaceBg }}
                              >
                                <span className="text-xs" style={{ color: colors.textPrimary }}>
                                  {s.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onLoadScenario?.(s)}
                                    className="p-1 rounded hover:bg-white/10"
                                    title="Load"
                                  >
                                    <Play size={12} style={{ color: colors.primary }} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteScenario?.(s.id)}
                                    className="p-1 rounded hover:bg-white/10"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} style={{ color: colors.danger }} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {/* Active scenario */}
              {scenario && (
                <>
                  {/* Scenario header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {scenario.name}
                      </h4>
                      <p className="text-[10px]" style={{ color: colors.textMuted }}>
                        Adjust sliders to see impact propagation
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {onSaveScenario && (
                        <button
                          onClick={() => onSaveScenario(scenario)}
                          className="p-1.5 rounded hover:bg-white/10"
                          title="Save scenario"
                        >
                          <Save size={14} style={{ color: colors.textSecondary }} />
                        </button>
                      )}
                      <button
                        onClick={onClearScenario}
                        className="p-1.5 rounded hover:bg-white/10"
                        title="Reset scenario"
                      >
                        <RotateCcw size={14} style={{ color: colors.textSecondary }} />
                      </button>
                    </div>
                  </div>

                  {/* Impact summary */}
                  {propagations.length > 0 && (
                    <div
                      className="grid grid-cols-3 gap-2 p-3 rounded-lg"
                      style={{ backgroundColor: colors.surfaceBg }}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp size={12} style={{ color: colors.success }} />
                          <span className="text-sm font-semibold" style={{ color: colors.success }}>
                            {summaryStats.increases}
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>
                          Increase
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Minus size={12} style={{ color: colors.textMuted }} />
                          <span className="text-sm font-semibold" style={{ color: colors.textMuted }}>
                            {summaryStats.unchanged}
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>
                          Unchanged
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingDown size={12} style={{ color: colors.danger }} />
                          <span className="text-sm font-semibold" style={{ color: colors.danger }}>
                            {summaryStats.decreases}
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>
                          Decrease
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Node sliders */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {chain.nodes.map((node) => {
                      const modifiedWeight = getModifiedValue(node.id, 'weight', node.weight);
                      const modifiedConfidence = getModifiedValue(node.id, 'confidence', node.confidence);
                      const propagation = getPropagation(node.id);
                      const hasModification = modificationMap.has(node.id);

                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'p-3 rounded-lg transition-colors',
                            hasModification && 'ring-1'
                          )}
                          style={{
                            backgroundColor: colors.surfaceBg,
                            ...(hasModification && {
                              '--tw-ring-color': getNodeColor(node.type),
                            } as React.CSSProperties),
                          }}
                        >
                          {/* Node header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getNodeColor(node.type) }}
                              />
                              <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                                {node.label}
                              </span>
                            </div>
                            {propagation && propagation.direction !== 'unchanged' && (
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor:
                                    propagation.direction === 'increase'
                                      ? colors.successFill
                                      : colors.dangerFill,
                                  color:
                                    propagation.direction === 'increase'
                                      ? colors.success
                                      : colors.danger,
                                }}
                              >
                                {propagation.direction === 'increase' ? '+' : ''}
                                {propagation.changePercent.toFixed(1)}%
                              </span>
                            )}
                          </div>

                          {/* Weight slider */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px]" style={{ color: colors.textMuted }}>
                                Weight
                              </span>
                              <span
                                className="text-[10px] font-medium"
                                style={{
                                  color:
                                    modifiedWeight !== node.weight
                                      ? colors.primary
                                      : colors.textSecondary,
                                }}
                              >
                                {Math.round(modifiedWeight * 100)}%
                                {modifiedWeight !== node.weight && (
                                  <span style={{ color: colors.textMuted }}>
                                    {' '}
                                    (was {Math.round(node.weight * 100)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={modifiedWeight * 100}
                              onChange={(e) =>
                                handleModification(node.id, 'weight', parseInt(e.target.value) / 100)
                              }
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, ${getNodeColor(node.type)} 0%, ${getNodeColor(node.type)} ${modifiedWeight * 100}%, ${colors.border} ${modifiedWeight * 100}%, ${colors.border} 100%)`,
                              }}
                            />
                          </div>

                          {/* Confidence slider */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px]" style={{ color: colors.textMuted }}>
                                Confidence
                              </span>
                              <span
                                className="text-[10px] font-medium"
                                style={{
                                  color:
                                    modifiedConfidence !== node.confidence
                                      ? colors.primary
                                      : colors.textSecondary,
                                }}
                              >
                                {Math.round(modifiedConfidence * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={modifiedConfidence * 100}
                              onChange={(e) =>
                                handleModification(node.id, 'confidence', parseInt(e.target.value) / 100)
                              }
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, ${getConfidenceColor(modifiedConfidence)} 0%, ${getConfidenceColor(modifiedConfidence)} ${modifiedConfidence * 100}%, ${colors.border} ${modifiedConfidence * 100}%, ${colors.border} 100%)`,
                              }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: colors.border }}>
                    <button
                      onClick={onClearScenario}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      <RotateCcw size={12} />
                      Reset All
                    </button>
                    <div className="flex items-center gap-1">
                      <Sparkles size={12} style={{ color: colors.warning }} />
                      <span className="text-[10px]" style={{ color: colors.textMuted }}>
                        Changes propagate automatically
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default WhatIfControls;
