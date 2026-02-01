'use client';

/**
 * GraphFilterPanel
 *
 * Side panel for filtering nodes and edges by:
 * - Node type
 * - Edge type
 * - Minimum connections
 * - Confidence threshold
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { GraphNode, GraphEdge } from '@/src/lib/graphAlgorithms';
import type { GraphFilter } from '@/src/hooks/useForceGraph';
import { cn } from '@/src/lib/utils';
import { X, Check } from 'lucide-react';

interface GraphFilterPanelProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  filter: GraphFilter;
  onFilterChange: (filter: Partial<GraphFilter>) => void;
  onClose: () => void;
}

export function GraphFilterPanel({
  nodes,
  edges,
  filter,
  onFilterChange,
  onClose,
}: GraphFilterPanelProps) {
  const { colors, isRadar, cardClasses, entityColors } = useVisualizationTheme();

  // Extract unique node types
  const nodeTypes = useMemo(() => {
    const types = new Map<string, number>();
    nodes.forEach((n) => {
      const type = n.type ?? 'other';
      types.set(type, (types.get(type) ?? 0) + 1);
    });
    return Array.from(types.entries()).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  // Extract unique edge types
  const edgeTypes = useMemo(() => {
    const types = new Map<string, number>();
    edges.forEach((e) => {
      const type = e.type ?? 'default';
      types.set(type, (types.get(type) ?? 0) + 1);
    });
    return Array.from(types.entries()).sort((a, b) => b[1] - a[1]);
  }, [edges]);

  // Calculate max connections for slider
  const maxConnections = useMemo(() => {
    const degreeMap = new Map<string, number>();
    nodes.forEach((n) => degreeMap.set(n.id, 0));
    edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
    });
    return Math.max(...degreeMap.values(), 1);
  }, [nodes, edges]);

  // Toggle node type filter
  const toggleNodeType = (type: string) => {
    const newTypes = new Set(filter.nodeTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onFilterChange({ nodeTypes: newTypes });
  };

  // Toggle edge type filter
  const toggleEdgeType = (type: string) => {
    const newTypes = new Set(filter.edgeTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onFilterChange({ edgeTypes: newTypes });
  };

  // Clear all filters
  const clearFilters = () => {
    onFilterChange({
      nodeTypes: new Set(),
      edgeTypes: new Set(),
      minConfidence: 0,
      minConnections: 0,
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filter.nodeTypes.size > 0 ||
    filter.edgeTypes.size > 0 ||
    filter.minConnections > 0 ||
    filter.minConfidence > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn('absolute top-12 right-14 w-64 rounded-lg overflow-hidden', cardClasses)}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <h3 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: colors.primary }}
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X size={14} style={{ color: colors.textMuted }} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 max-h-80 overflow-y-auto">
        {/* Node Types */}
        {nodeTypes.length > 1 && (
          <div>
            <h4 className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
              Node Types
            </h4>
            <div className="space-y-1">
              {nodeTypes.map(([type, count]) => {
                const isActive = filter.nodeTypes.size === 0 || filter.nodeTypes.has(type);
                const color = entityColors[type as keyof typeof entityColors] ?? entityColors.other;

                return (
                  <button
                    key={type}
                    onClick={() => toggleNodeType(type)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors',
                      isActive ? 'bg-white/5' : 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        className="capitalize"
                        style={{ color: colors.textPrimary }}
                      >
                        {type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.textMuted }}>{count}</span>
                      {filter.nodeTypes.has(type) && (
                        <Check size={12} style={{ color: colors.primary }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Edge Types */}
        {edgeTypes.length > 1 && (
          <div>
            <h4 className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
              Edge Types
            </h4>
            <div className="space-y-1">
              {edgeTypes.map(([type, count]) => {
                const isActive = filter.edgeTypes.size === 0 || filter.edgeTypes.has(type);

                return (
                  <button
                    key={type}
                    onClick={() => toggleEdgeType(type)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors',
                      isActive ? 'bg-white/5' : 'opacity-50'
                    )}
                  >
                    <span
                      className="capitalize"
                      style={{ color: colors.textPrimary }}
                    >
                      {type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.textMuted }}>{count}</span>
                      {filter.edgeTypes.has(type) && (
                        <Check size={12} style={{ color: colors.primary }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Minimum Connections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              Min Connections
            </h4>
            <span className="text-xs" style={{ color: colors.textMuted }}>
              {filter.minConnections}+
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxConnections}
            value={filter.minConnections}
            onChange={(e) => onFilterChange({ minConnections: parseInt(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${(filter.minConnections / maxConnections) * 100}%, ${colors.border} ${(filter.minConnections / maxConnections) * 100}%, ${colors.border} 100%)`,
            }}
          />
        </div>

        {/* Quick filters */}
        <div>
          <h4 className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
            Quick Filters
          </h4>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => onFilterChange({ minConnections: 3 })}
              className="px-2 py-1 text-xs rounded border transition-colors hover:bg-white/5"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              Hubs (3+)
            </button>
            <button
              onClick={() => onFilterChange({ minConnections: 1 })}
              className="px-2 py-1 text-xs rounded border transition-colors hover:bg-white/5"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              Connected
            </button>
            <button
              onClick={() => onFilterChange({ minConnections: 0 })}
              className="px-2 py-1 text-xs rounded border transition-colors hover:bg-white/5"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div
        className="px-4 py-2 text-[10px] border-t"
        style={{ borderColor: colors.border, color: colors.textMuted }}
      >
        Showing {nodes.length} nodes, {edges.length} edges
      </div>
    </motion.div>
  );
}
