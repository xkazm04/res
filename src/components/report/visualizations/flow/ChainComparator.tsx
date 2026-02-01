'use client';

/**
 * ChainComparator
 *
 * Side-by-side comparison of two causal chain scenarios,
 * highlighting differences in nodes, edges, and weights.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type {
  CausalChain,
  CausalNode,
  ChainDifference,
} from '@/src/lib/causalLayout';
import { cn } from '@/src/lib/utils';
import {
  GitCompare,
  Plus,
  Minus,
  Edit3,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Equal,
  X,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ChainComparatorProps {
  chainA: CausalChain;
  chainB: CausalChain;
  differences: ChainDifference[];
  labelA?: string;
  labelB?: string;
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ChainComparator({
  chainA,
  chainB,
  differences,
  labelA = 'Original',
  labelB = 'Modified',
  onClose,
  className,
}: ChainComparatorProps) {
  const { colors, isRadar, getConfidenceColor } = useVisualizationTheme();

  // Group differences by type
  const groupedDifferences = useMemo(() => {
    const groups = {
      nodeAdded: [] as ChainDifference[],
      nodeRemoved: [] as ChainDifference[],
      nodeModified: [] as ChainDifference[],
      edgeAdded: [] as ChainDifference[],
      edgeRemoved: [] as ChainDifference[],
      edgeModified: [] as ChainDifference[],
    };

    differences.forEach((diff) => {
      switch (diff.type) {
        case 'node_added':
          groups.nodeAdded.push(diff);
          break;
        case 'node_removed':
          groups.nodeRemoved.push(diff);
          break;
        case 'node_modified':
          groups.nodeModified.push(diff);
          break;
        case 'edge_added':
          groups.edgeAdded.push(diff);
          break;
        case 'edge_removed':
          groups.edgeRemoved.push(diff);
          break;
        case 'edge_modified':
          groups.edgeModified.push(diff);
          break;
      }
    });

    return groups;
  }, [differences]);

  // Build node maps
  const nodeMapA = useMemo(
    () => new Map(chainA.nodes.map((n) => [n.id, n])),
    [chainA.nodes]
  );
  const nodeMapB = useMemo(
    () => new Map(chainB.nodes.map((n) => [n.id, n])),
    [chainB.nodes]
  );

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalChanges = differences.length;
    const nodeChanges =
      groupedDifferences.nodeAdded.length +
      groupedDifferences.nodeRemoved.length +
      groupedDifferences.nodeModified.length;
    const edgeChanges =
      groupedDifferences.edgeAdded.length +
      groupedDifferences.edgeRemoved.length +
      groupedDifferences.edgeModified.length;

    // Calculate net impact
    let netWeightChange = 0;
    groupedDifferences.nodeModified.forEach((diff) => {
      if (diff.property === 'weight') {
        const original = (diff.originalValue as number) || 0;
        const modified = (diff.newValue as number) || 0;
        netWeightChange += modified - original;
      }
    });

    return {
      totalChanges,
      nodeChanges,
      edgeChanges,
      netWeightChange,
    };
  }, [differences, groupedDifferences]);

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

  // Get difference icon
  const getDiffIcon = (type: ChainDifference['type']) => {
    switch (type) {
      case 'node_added':
      case 'edge_added':
        return Plus;
      case 'node_removed':
      case 'edge_removed':
        return Minus;
      case 'node_modified':
      case 'edge_modified':
        return Edit3;
      default:
        return Equal;
    }
  };

  // Get difference color
  const getDiffColor = (type: ChainDifference['type']) => {
    switch (type) {
      case 'node_added':
      case 'edge_added':
        return colors.success;
      case 'node_removed':
      case 'edge_removed':
        return colors.danger;
      case 'node_modified':
      case 'edge_modified':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  // No differences
  if (differences.length === 0) {
    return (
      <div
        className={cn('p-8 text-center rounded-xl', className)}
        style={{ backgroundColor: colors.cardBg }}
      >
        <Equal size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
        <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
          No Differences Found
        </h3>
        <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
          The two scenarios are identical
        </p>
      </div>
    );
  }

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
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: colors.surfaceBg,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-2">
          <GitCompare size={18} style={{ color: colors.primary }} />
          <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Scenario Comparison
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
            title="Close comparison"
          >
            <X size={16} style={{ color: colors.textSecondary }} />
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div
        className="grid grid-cols-4 gap-4 p-4 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: colors.primary }}>
            {stats.totalChanges}
          </div>
          <div className="text-[10px] uppercase" style={{ color: colors.textMuted }}>
            Total Changes
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: colors.secondary }}>
            {stats.nodeChanges}
          </div>
          <div className="text-[10px] uppercase" style={{ color: colors.textMuted }}>
            Node Changes
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: colors.warning }}>
            {stats.edgeChanges}
          </div>
          <div className="text-[10px] uppercase" style={{ color: colors.textMuted }}>
            Edge Changes
          </div>
        </div>
        <div className="text-center">
          <div
            className="text-2xl font-bold flex items-center justify-center gap-1"
            style={{
              color:
                stats.netWeightChange > 0
                  ? colors.success
                  : stats.netWeightChange < 0
                    ? colors.danger
                    : colors.textMuted,
            }}
          >
            {stats.netWeightChange > 0 && <ArrowUp size={16} />}
            {stats.netWeightChange < 0 && <ArrowDown size={16} />}
            {stats.netWeightChange === 0 && <Equal size={16} />}
            {Math.abs(stats.netWeightChange * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] uppercase" style={{ color: colors.textMuted }}>
            Net Impact
          </div>
        </div>
      </div>

      {/* Scenario labels */}
      <div
        className="grid grid-cols-2 gap-4 px-4 py-2 border-b"
        style={{
          backgroundColor: colors.surfaceBg,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.textMuted }}
          />
          <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {labelA} ({chainA.nodes.length} nodes)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {labelB} ({chainB.nodes.length} nodes)
          </span>
        </div>
      </div>

      {/* Differences list */}
      <div className="max-h-96 overflow-y-auto">
        {/* Node modifications */}
        {groupedDifferences.nodeModified.length > 0 && (
          <DifferenceSection
            title="Modified Nodes"
            icon={Edit3}
            color={colors.warning}
            colors={colors}
          >
            {groupedDifferences.nodeModified.map((diff) => {
              const nodeA = nodeMapA.get(diff.elementId);
              const nodeB = nodeMapB.get(diff.elementId);
              if (!nodeA || !nodeB) return null;

              const change = ((diff.newValue as number) - (diff.originalValue as number));
              const changePercent = (change / (diff.originalValue as number)) * 100;

              return (
                <motion.div
                  key={`${diff.elementId}-${diff.property}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.surfaceBg }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: getNodeColor(nodeA.type) }}
                    />
                    <div>
                      <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {nodeA.label}
                      </div>
                      <div className="text-[10px]" style={{ color: colors.textMuted }}>
                        {diff.property}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      {((diff.originalValue as number) * 100).toFixed(0)}%
                    </span>
                    <ArrowRight size={12} style={{ color: colors.textMuted }} />
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: change > 0 ? colors.success : colors.danger,
                      }}
                    >
                      {((diff.newValue as number) * 100).toFixed(0)}%
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          change > 0 ? colors.successFill : colors.dangerFill,
                        color: change > 0 ? colors.success : colors.danger,
                      }}
                    >
                      {change > 0 ? '+' : ''}
                      {changePercent.toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </DifferenceSection>
        )}

        {/* Added nodes */}
        {groupedDifferences.nodeAdded.length > 0 && (
          <DifferenceSection
            title="Added Nodes"
            icon={Plus}
            color={colors.success}
            colors={colors}
          >
            {groupedDifferences.nodeAdded.map((diff) => {
              const node = nodeMapB.get(diff.elementId);
              if (!node) return null;

              return (
                <motion.div
                  key={diff.elementId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.successFill }}
                >
                  <div className="flex items-center gap-3">
                    <Plus size={14} style={{ color: colors.success }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {node.label}
                      </div>
                      <div className="text-[10px]" style={{ color: colors.textMuted }}>
                        {node.type} • {Math.round(node.weight * 100)}% weight
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </DifferenceSection>
        )}

        {/* Removed nodes */}
        {groupedDifferences.nodeRemoved.length > 0 && (
          <DifferenceSection
            title="Removed Nodes"
            icon={Minus}
            color={colors.danger}
            colors={colors}
          >
            {groupedDifferences.nodeRemoved.map((diff) => {
              const node = nodeMapA.get(diff.elementId);
              if (!node) return null;

              return (
                <motion.div
                  key={diff.elementId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.dangerFill }}
                >
                  <div className="flex items-center gap-3">
                    <Minus size={14} style={{ color: colors.danger }} />
                    <div>
                      <div
                        className="text-sm font-medium line-through"
                        style={{ color: colors.textPrimary }}
                      >
                        {node.label}
                      </div>
                      <div className="text-[10px]" style={{ color: colors.textMuted }}>
                        {node.type}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </DifferenceSection>
        )}

        {/* Edge changes */}
        {(groupedDifferences.edgeAdded.length > 0 ||
          groupedDifferences.edgeRemoved.length > 0 ||
          groupedDifferences.edgeModified.length > 0) && (
          <DifferenceSection
            title="Connection Changes"
            icon={ArrowRight}
            color={colors.secondary}
            colors={colors}
          >
            {groupedDifferences.edgeAdded.map((diff) => (
              <motion.div
                key={diff.elementId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ backgroundColor: colors.successFill }}
              >
                <Plus size={12} style={{ color: colors.success }} />
                <span className="text-xs" style={{ color: colors.textPrimary }}>
                  New connection: {diff.elementId}
                </span>
              </motion.div>
            ))}
            {groupedDifferences.edgeRemoved.map((diff) => (
              <motion.div
                key={diff.elementId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ backgroundColor: colors.dangerFill }}
              >
                <Minus size={12} style={{ color: colors.danger }} />
                <span
                  className="text-xs line-through"
                  style={{ color: colors.textPrimary }}
                >
                  Removed: {diff.elementId}
                </span>
              </motion.div>
            ))}
            {groupedDifferences.edgeModified.map((diff) => (
              <motion.div
                key={diff.elementId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: colors.warningFill }}
              >
                <div className="flex items-center gap-2">
                  <Edit3 size={12} style={{ color: colors.warning }} />
                  <span className="text-xs" style={{ color: colors.textPrimary }}>
                    {diff.elementId}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: colors.textMuted }}>
                  {diff.property}: {String(diff.originalValue)} → {String(diff.newValue)}
                </span>
              </motion.div>
            ))}
          </DifferenceSection>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Difference Section Component
// ============================================================================

interface DifferenceSectionProps {
  title: string;
  icon: typeof Edit3;
  color: string;
  colors: ReturnType<typeof useVisualizationTheme>['colors'];
  children: React.ReactNode;
}

function DifferenceSection({
  title,
  icon: Icon,
  color,
  colors,
  children,
}: DifferenceSectionProps) {
  return (
    <div className="p-4 border-b" style={{ borderColor: colors.border }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color }} />
        <h4 className="text-xs font-semibold uppercase" style={{ color: colors.textSecondary }}>
          {title}
        </h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default ChainComparator;
