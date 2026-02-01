'use client';

/**
 * PathFinder
 *
 * Interface for finding and highlighting shortest paths between nodes.
 * Uses Dijkstra's algorithm via the graph hook.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { GraphNode, PathResult } from '@/src/lib/graphAlgorithms';
import { cn } from '@/src/lib/utils';
import { X, ArrowRight, RotateCcw, MapPin, Navigation } from 'lucide-react';

interface PathFinderProps {
  nodes: GraphNode[];
  currentPath: PathResult | null;
  onFindPath: (sourceId: string, targetId: string) => void;
  onClearPath: () => void;
  onClose: () => void;
}

export function PathFinder({
  nodes,
  currentPath,
  onFindPath,
  onClearPath,
  onClose,
}: PathFinderProps) {
  const { colors, isRadar, cardClasses, entityColors } = useVisualizationTheme();
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // Filter nodes by search
  const filteredSourceNodes = useMemo(() => {
    if (!sourceSearch) return nodes.slice(0, 10);
    const q = sourceSearch.toLowerCase();
    return nodes
      .filter((n) =>
        n.id.toLowerCase().includes(q) || n.label?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [nodes, sourceSearch]);

  const filteredTargetNodes = useMemo(() => {
    if (!targetSearch) return nodes.slice(0, 10);
    const q = targetSearch.toLowerCase();
    return nodes
      .filter((n) =>
        n.id.toLowerCase().includes(q) || n.label?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [nodes, targetSearch]);

  // Get node by ID
  const getNode = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes]
  );

  // Handle find path
  const handleFindPath = useCallback(() => {
    if (sourceId && targetId && sourceId !== targetId) {
      onFindPath(sourceId, targetId);
    }
  }, [sourceId, targetId, onFindPath]);

  // Handle clear
  const handleClear = useCallback(() => {
    setSourceId('');
    setTargetId('');
    setSourceSearch('');
    setTargetSearch('');
    onClearPath();
  }, [onClearPath]);

  // Select source node
  const selectSource = useCallback((id: string) => {
    const node = nodes.find((n) => n.id === id);
    setSourceId(id);
    setSourceSearch(node?.label ?? id);
    setShowSourceDropdown(false);
  }, [nodes]);

  // Select target node
  const selectTarget = useCallback((id: string) => {
    const node = nodes.find((n) => n.id === id);
    setTargetId(id);
    setTargetSearch(node?.label ?? id);
    setShowTargetDropdown(false);
  }, [nodes]);

  // Swap source and target
  const swapNodes = useCallback(() => {
    const tempId = sourceId;
    const tempSearch = sourceSearch;
    setSourceId(targetId);
    setSourceSearch(targetSearch);
    setTargetId(tempId);
    setTargetSearch(tempSearch);
  }, [sourceId, targetId, sourceSearch, targetSearch]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn('absolute top-12 left-3 w-72 rounded-lg overflow-hidden', cardClasses)}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center gap-2">
          <Navigation size={14} style={{ color: colors.primary }} />
          <h3 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
            Find Path
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X size={14} style={{ color: colors.textMuted }} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Source node selector */}
        <div className="relative">
          <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>
            <MapPin size={10} className="inline mr-1" style={{ color: colors.success }} />
            From
          </label>
          <input
            type="text"
            placeholder="Search start node..."
            value={sourceSearch}
            onChange={(e) => {
              setSourceSearch(e.target.value);
              setShowSourceDropdown(true);
              if (!e.target.value) setSourceId('');
            }}
            onFocus={() => setShowSourceDropdown(true)}
            onBlur={() => setTimeout(() => setShowSourceDropdown(false), 200)}
            className="w-full px-3 py-2 text-sm rounded-md bg-transparent border outline-none focus:ring-1"
            style={{
              borderColor: colors.border,
              color: colors.textPrimary,
              '--tw-ring-color': colors.primary,
            } as React.CSSProperties}
          />
          {showSourceDropdown && filteredSourceNodes.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-md overflow-hidden z-10 max-h-40 overflow-y-auto"
              style={{ backgroundColor: colors.tooltipBg }}
            >
              {filteredSourceNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => selectSource(node.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                  style={{ color: colors.textPrimary }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: entityColors[(node.type?.toLowerCase() ?? 'other') as keyof typeof entityColors] ?? entityColors.other,
                    }}
                  />
                  {node.label ?? node.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={swapNodes}
            className="p-2 rounded-full border hover:bg-white/10 transition-colors"
            style={{ borderColor: colors.border }}
            title="Swap"
          >
            <RotateCcw size={14} style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Target node selector */}
        <div className="relative">
          <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>
            <MapPin size={10} className="inline mr-1" style={{ color: colors.danger }} />
            To
          </label>
          <input
            type="text"
            placeholder="Search end node..."
            value={targetSearch}
            onChange={(e) => {
              setTargetSearch(e.target.value);
              setShowTargetDropdown(true);
              if (!e.target.value) setTargetId('');
            }}
            onFocus={() => setShowTargetDropdown(true)}
            onBlur={() => setTimeout(() => setShowTargetDropdown(false), 200)}
            className="w-full px-3 py-2 text-sm rounded-md bg-transparent border outline-none focus:ring-1"
            style={{
              borderColor: colors.border,
              color: colors.textPrimary,
              '--tw-ring-color': colors.primary,
            } as React.CSSProperties}
          />
          {showTargetDropdown && filteredTargetNodes.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-md overflow-hidden z-10 max-h-40 overflow-y-auto"
              style={{ backgroundColor: colors.tooltipBg }}
            >
              {filteredTargetNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => selectTarget(node.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                  style={{ color: colors.textPrimary }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: entityColors[(node.type?.toLowerCase() ?? 'other') as keyof typeof entityColors] ?? entityColors.other,
                    }}
                  />
                  {node.label ?? node.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleFindPath}
            disabled={!sourceId || !targetId || sourceId === targetId}
            className={cn(
              'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              sourceId && targetId && sourceId !== targetId
                ? (isRadar ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30' : 'bg-stone-800 text-white hover:bg-stone-700')
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            Find Path
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-md text-sm border transition-colors hover:bg-white/10"
            style={{ borderColor: colors.border, color: colors.textSecondary }}
          >
            Clear
          </button>
        </div>

        {/* Path result */}
        {currentPath && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-md"
            style={{ backgroundColor: colors.surfaceBg }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                Shortest Path Found
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: colors.successFill,
                  color: colors.success,
                }}
              >
                {currentPath.path.length} nodes
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {currentPath.path.map((nodeId, i) => {
                const node = getNode(nodeId);
                return (
                  <span key={nodeId} className="flex items-center gap-1">
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: isRadar ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: colors.textPrimary,
                      }}
                    >
                      {node?.label ?? nodeId}
                    </span>
                    {i < currentPath.path.length - 1 && (
                      <ArrowRight size={10} style={{ color: colors.textMuted }} />
                    )}
                  </span>
                );
              })}
            </div>
            <div className="mt-2 text-[10px]" style={{ color: colors.textMuted }}>
              Total weight: {currentPath.distance.toFixed(2)}
            </div>
          </motion.div>
        )}

        {/* No path found message */}
        {sourceId && targetId && sourceId !== targetId && currentPath === null && (
          <div
            className="p-3 rounded-md text-center text-xs"
            style={{ backgroundColor: colors.dangerFill, color: colors.danger }}
          >
            No path exists between these nodes
          </div>
        )}
      </div>
    </motion.div>
  );
}
