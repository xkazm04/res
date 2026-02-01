'use client';

/**
 * ChainStepEditor
 *
 * Panel for editing individual causal chain node properties
 * including label, type, weight, and confidence.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { CausalNode, CausalEdge } from '@/src/lib/causalLayout';
import { cn } from '@/src/lib/utils';
import {
  X,
  Save,
  Trash2,
  AlertCircle,
  ArrowRight,
  ArrowLeftRight,
  ArrowRightLeft,
  HelpCircle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ChainStepEditorProps {
  node?: CausalNode | null;
  edge?: CausalEdge | null;
  relatedEdges?: CausalEdge[];
  onNodeUpdate?: (nodeId: string, updates: Partial<CausalNode>) => void;
  onEdgeUpdate?: (edgeId: string, updates: Partial<CausalEdge>) => void;
  onNodeRemove?: (nodeId: string) => void;
  onEdgeRemove?: (edgeId: string) => void;
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ChainStepEditor({
  node,
  edge,
  relatedEdges = [],
  onNodeUpdate,
  onEdgeUpdate,
  onNodeRemove,
  onEdgeRemove,
  onClose,
  className,
}: ChainStepEditorProps) {
  const { colors, isRadar, getConfidenceColor } = useVisualizationTheme();

  // Local edit state
  const [editedNode, setEditedNode] = useState<Partial<CausalNode> | null>(
    node ? { ...node } : null
  );
  const [editedEdge, setEditedEdge] = useState<Partial<CausalEdge> | null>(
    edge ? { ...edge } : null
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Reset when selection changes
  useState(() => {
    setEditedNode(node ? { ...node } : null);
    setEditedEdge(edge ? { ...edge } : null);
    setHasChanges(false);
  });

  // Handle node field change
  const handleNodeChange = useCallback(
    (field: keyof CausalNode, value: unknown) => {
      setEditedNode((prev) => (prev ? { ...prev, [field]: value } : null));
      setHasChanges(true);
    },
    []
  );

  // Handle edge field change
  const handleEdgeChange = useCallback(
    (field: keyof CausalEdge, value: unknown) => {
      setEditedEdge((prev) => (prev ? { ...prev, [field]: value } : null));
      setHasChanges(true);
    },
    []
  );

  // Save changes
  const handleSave = useCallback(() => {
    if (node && editedNode && onNodeUpdate) {
      onNodeUpdate(node.id, editedNode);
    }
    if (edge && editedEdge && onEdgeUpdate) {
      onEdgeUpdate(edge.id, editedEdge);
    }
    setHasChanges(false);
  }, [node, edge, editedNode, editedEdge, onNodeUpdate, onEdgeUpdate]);

  // Node types
  const nodeTypes: Array<{ value: CausalNode['type']; label: string; description: string }> = [
    { value: 'cause', label: 'Cause', description: 'Initial trigger or factor' },
    { value: 'effect', label: 'Effect', description: 'Resulting outcome' },
    { value: 'mediator', label: 'Mediator', description: 'Intermediate step' },
    { value: 'moderator', label: 'Moderator', description: 'Influences strength' },
  ];

  // Edge types
  const edgeTypes: Array<{ value: CausalEdge['type']; label: string; icon: typeof ArrowRight }> = [
    { value: 'direct', label: 'Direct', icon: ArrowRight },
    { value: 'indirect', label: 'Indirect', icon: ArrowRightLeft },
    { value: 'bidirectional', label: 'Bidirectional', icon: ArrowLeftRight },
    { value: 'conditional', label: 'Conditional', icon: HelpCircle },
  ];

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

  // No selection
  if (!node && !edge) {
    return (
      <div
        className={cn('p-6 text-center', className)}
        style={{ backgroundColor: colors.cardBg }}
      >
        <AlertCircle
          size={32}
          className="mx-auto mb-3"
          style={{ color: colors.textMuted }}
        />
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Select a node or edge to edit its properties
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn('flex flex-col', className)}
      style={{
        backgroundColor: colors.cardBg,
        borderLeft: `1px solid ${colors.border}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {node ? 'Edit Node' : 'Edit Edge'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10"
          title="Close"
        >
          <X size={16} style={{ color: colors.textSecondary }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Node editing */}
        {node && editedNode && (
          <>
            {/* Label */}
            <div>
              <label
                className="text-xs font-medium mb-2 block"
                style={{ color: colors.textSecondary }}
              >
                Label
              </label>
              <input
                type="text"
                value={editedNode.label || ''}
                onChange={(e) => handleNodeChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: colors.surfaceBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>

            {/* Type */}
            <div>
              <label
                className="text-xs font-medium mb-2 block"
                style={{ color: colors.textSecondary }}
              >
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {nodeTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleNodeChange('type', type.value)}
                    className={cn(
                      'p-2 rounded-lg text-left transition-colors',
                      editedNode.type === type.value && 'ring-2'
                    )}
                    style={{
                      backgroundColor:
                        editedNode.type === type.value
                          ? `${getNodeColor(type.value)}20`
                          : colors.surfaceBg,
                      border: `1px solid ${
                        editedNode.type === type.value
                          ? getNodeColor(type.value)
                          : colors.border
                      }`,
                      '--tw-ring-color': getNodeColor(type.value),
                    } as React.CSSProperties}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          editedNode.type === type.value
                            ? getNodeColor(type.value)
                            : colors.textPrimary,
                      }}
                    >
                      {type.label}
                    </span>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: colors.textMuted }}
                    >
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Weight slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Weight (Importance)
                </label>
                <span
                  className="text-xs font-medium"
                  style={{ color: getNodeColor(editedNode.type as CausalNode['type']) }}
                >
                  {Math.round((editedNode.weight || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={(editedNode.weight || 0) * 100}
                onChange={(e) => handleNodeChange('weight', parseInt(e.target.value) / 100)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${getNodeColor(editedNode.type as CausalNode['type'])} 0%, ${getNodeColor(editedNode.type as CausalNode['type'])} ${(editedNode.weight || 0) * 100}%, ${colors.border} ${(editedNode.weight || 0) * 100}%, ${colors.border} 100%)`,
                }}
              />
            </div>

            {/* Confidence slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Confidence
                </label>
                <span
                  className="text-xs font-medium"
                  style={{ color: getConfidenceColor(editedNode.confidence || 0) }}
                >
                  {Math.round((editedNode.confidence || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={(editedNode.confidence || 0) * 100}
                onChange={(e) => handleNodeChange('confidence', parseInt(e.target.value) / 100)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${getConfidenceColor(editedNode.confidence || 0)} 0%, ${getConfidenceColor(editedNode.confidence || 0)} ${(editedNode.confidence || 0) * 100}%, ${colors.border} ${(editedNode.confidence || 0) * 100}%, ${colors.border} 100%)`,
                }}
              />
            </div>

            {/* Related edges */}
            {relatedEdges.length > 0 && (
              <div>
                <label
                  className="text-xs font-medium mb-2 block"
                  style={{ color: colors.textSecondary }}
                >
                  Connections ({relatedEdges.length})
                </label>
                <div className="space-y-1">
                  {relatedEdges.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded text-xs"
                      style={{ backgroundColor: colors.surfaceBg }}
                    >
                      <span style={{ color: colors.textPrimary }}>
                        {e.source === node.id ? `→ ${e.target}` : `${e.source} →`}
                      </span>
                      <span style={{ color: colors.textMuted }}>
                        {Math.round(e.weight * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Edge editing */}
        {edge && editedEdge && (
          <>
            {/* Type */}
            <div>
              <label
                className="text-xs font-medium mb-2 block"
                style={{ color: colors.textSecondary }}
              >
                Connection Type
              </label>
              <div className="space-y-2">
                {edgeTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleEdgeChange('type', type.value)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                        editedEdge.type === type.value && 'ring-2'
                      )}
                      style={{
                        backgroundColor:
                          editedEdge.type === type.value
                            ? colors.primaryFill
                            : colors.surfaceBg,
                        border: `1px solid ${
                          editedEdge.type === type.value ? colors.primary : colors.border
                        }`,
                        '--tw-ring-color': colors.primary,
                      } as React.CSSProperties}
                    >
                      <Icon
                        size={18}
                        style={{
                          color:
                            editedEdge.type === type.value
                              ? colors.primary
                              : colors.textSecondary,
                        }}
                      />
                      <span
                        className="text-sm"
                        style={{
                          color:
                            editedEdge.type === type.value
                              ? colors.primary
                              : colors.textPrimary,
                        }}
                      >
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Label */}
            <div>
              <label
                className="text-xs font-medium mb-2 block"
                style={{ color: colors.textSecondary }}
              >
                Label (optional)
              </label>
              <input
                type="text"
                value={editedEdge.label || ''}
                onChange={(e) => handleEdgeChange('label', e.target.value)}
                placeholder="e.g., 'increases', 'reduces'"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: colors.surfaceBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>

            {/* Weight slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Strength
                </label>
                <span className="text-xs font-medium" style={{ color: colors.primary }}>
                  {Math.round((editedEdge.weight || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={(editedEdge.weight || 0) * 100}
                onChange={(e) => handleEdgeChange('weight', parseInt(e.target.value) / 100)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${(editedEdge.weight || 0) * 100}%, ${colors.border} ${(editedEdge.weight || 0) * 100}%, ${colors.border} 100%)`,
                }}
              />
            </div>

            {/* Confidence slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Confidence
                </label>
                <span
                  className="text-xs font-medium"
                  style={{ color: getConfidenceColor(editedEdge.confidence || 0) }}
                >
                  {Math.round((editedEdge.confidence || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={(editedEdge.confidence || 0) * 100}
                onChange={(e) => handleEdgeChange('confidence', parseInt(e.target.value) / 100)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${getConfidenceColor(editedEdge.confidence || 0)} 0%, ${getConfidenceColor(editedEdge.confidence || 0)} ${(editedEdge.confidence || 0) * 100}%, ${colors.border} ${(editedEdge.confidence || 0) * 100}%, ${colors.border} 100%)`,
                }}
              />
            </div>

            {/* Connection info */}
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: colors.surfaceBg }}
            >
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: colors.textMuted }}>From</span>
                <span style={{ color: colors.textPrimary }}>{edge.source}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span style={{ color: colors.textMuted }}>To</span>
                <span style={{ color: colors.textPrimary }}>{edge.target}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderColor: colors.border }}
      >
        <button
          onClick={() => {
            if (node) onNodeRemove?.(node.id);
            if (edge) onEdgeRemove?.(edge.id);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs"
          style={{ color: colors.danger }}
        >
          <Trash2 size={14} />
          Delete
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium',
            !hasChanges && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            backgroundColor: hasChanges ? colors.primary : colors.border,
            color: hasChanges ? colors.textOnDark : colors.textMuted,
          }}
        >
          <Save size={14} />
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}

export default ChainStepEditor;
