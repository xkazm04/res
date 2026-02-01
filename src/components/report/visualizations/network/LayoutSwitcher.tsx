'use client';

/**
 * LayoutSwitcher
 *
 * Control panel for switching between layout algorithms:
 * - Force-directed (default)
 * - Radial (centered on a node)
 * - Hierarchical (tree-like)
 */

import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { LayoutAlgorithm } from '@/src/hooks/useForceGraph';
import { cn } from '@/src/lib/utils';
import { Network, Target, GitFork, RefreshCw } from 'lucide-react';

interface LayoutSwitcherProps {
  currentLayout: LayoutAlgorithm;
  onLayoutChange: (layout: LayoutAlgorithm) => void;
  onRunLayout: () => void;
  isComputing: boolean;
}

const layouts: Array<{
  id: LayoutAlgorithm;
  label: string;
  icon: typeof Network;
  description: string;
}> = [
  {
    id: 'force',
    label: 'Force',
    icon: Network,
    description: 'Physics-based simulation',
  },
  {
    id: 'radial',
    label: 'Radial',
    icon: Target,
    description: 'Concentric circles from center',
  },
  {
    id: 'hierarchical',
    label: 'Tree',
    icon: GitFork,
    description: 'Top-down hierarchy',
  },
];

export function LayoutSwitcher({
  currentLayout,
  onLayoutChange,
  onRunLayout,
  isComputing,
}: LayoutSwitcherProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();

  return (
    <div className={cn('absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-lg', surfaceClasses)}>
      {layouts.map(({ id, label, icon: Icon, description }) => {
        const isActive = currentLayout === id;

        return (
          <motion.button
            key={id}
            onClick={() => onLayoutChange(id)}
            className={cn(
              'relative px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors text-sm',
              isActive
                ? (isRadar ? 'bg-cyan-500/20' : 'bg-stone-800')
                : 'hover:bg-white/10'
            )}
            title={description}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon
              size={14}
              style={{
                color: isActive
                  ? (isRadar ? colors.primary : '#fff')
                  : colors.textSecondary,
              }}
            />
            <span
              style={{
                color: isActive
                  ? (isRadar ? colors.primary : '#fff')
                  : colors.textSecondary,
              }}
            >
              {label}
            </span>
          </motion.button>
        );
      })}

      <div
        className="w-px h-6 mx-1"
        style={{ backgroundColor: colors.border }}
      />

      <motion.button
        onClick={onRunLayout}
        disabled={isComputing}
        className={cn(
          'p-2 rounded-md transition-colors',
          isComputing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        )}
        title="Re-run layout"
        whileHover={!isComputing ? { scale: 1.05 } : undefined}
        whileTap={!isComputing ? { scale: 0.95 } : undefined}
      >
        <motion.div
          animate={isComputing ? { rotate: 360 } : { rotate: 0 }}
          transition={isComputing ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
        >
          <RefreshCw size={14} style={{ color: colors.textSecondary }} />
        </motion.div>
      </motion.button>
    </div>
  );
}
