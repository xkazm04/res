'use client';

/**
 * EventClusterNode
 *
 * Collapsed view of dense events that expands on click
 * to show cluster contents.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { TimelineEvent, EventCluster } from '@/src/lib/temporalClustering';
import { cn } from '@/src/lib/utils';
import { Layers, ChevronRight, X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface EventClusterNodeProps {
  cluster: EventCluster;
  x: number;
  y: number;
  trackColor: string;
  isSelected: boolean;
  onExpand: () => void;
  onEventClick: (event: TimelineEvent) => void;
}

// ============================================================================
// Component
// ============================================================================

export function EventClusterNode({
  cluster,
  x,
  y,
  trackColor,
  isSelected,
  onExpand,
  onEventClick,
}: EventClusterNodeProps) {
  const { colors, isRadar } = useVisualizationTheme();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const eventCount = cluster.events.length;
  const size = Math.min(48, 24 + eventCount * 2);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="absolute cursor-pointer"
        style={{
          left: x - size / 2,
          top: y - size / 2,
        }}
        onClick={() => setIsPopoverOpen(true)}
      >
        {/* Cluster node */}
        <div
          className={cn(
            'relative rounded-xl flex items-center justify-center',
            isSelected && 'ring-2 ring-offset-1'
          )}
          style={{
            width: size,
            height: size,
            backgroundColor: trackColor,
            boxShadow: `0 0 16px ${trackColor}60`,
            '--tw-ring-color': colors.textPrimary,
            '--tw-ring-offset-color': colors.cardBg,
          } as React.CSSProperties}
        >
          <Layers size={size * 0.4} style={{ color: colors.textOnDark }} />

          {/* Event count badge */}
          <div
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
            style={{
              backgroundColor: colors.cardBg,
              border: `2px solid ${trackColor}`,
            }}
          >
            <span
              className="text-[10px] font-bold"
              style={{ color: trackColor }}
            >
              {eventCount}
            </span>
          </div>
        </div>

        {/* Ripple effect for stacked events */}
        {eventCount > 3 && (
          <>
            <div
              className="absolute rounded-xl opacity-40"
              style={{
                width: size - 4,
                height: size - 4,
                left: 4,
                top: 4,
                backgroundColor: trackColor,
                zIndex: -1,
              }}
            />
            <div
              className="absolute rounded-xl opacity-20"
              style={{
                width: size - 8,
                height: size - 8,
                left: 8,
                top: 8,
                backgroundColor: trackColor,
                zIndex: -2,
              }}
            />
          </>
        )}
      </motion.div>

      {/* Popover with cluster contents */}
      <AnimatePresence>
        {isPopoverOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsPopoverOpen(false)}
            />

            {/* Popover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-50 rounded-xl shadow-xl overflow-hidden"
              style={{
                left: x - 140,
                top: y + size / 2 + 8,
                width: 280,
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                  backgroundColor: trackColor,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center gap-2">
                  <Layers size={16} style={{ color: colors.textOnDark }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.textOnDark }}
                  >
                    {eventCount} Events
                  </span>
                </div>
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="p-1 rounded hover:bg-black/10"
                >
                  <X size={14} style={{ color: colors.textOnDark }} />
                </button>
              </div>

              {/* Date range */}
              <div
                className="px-4 py-2 border-b text-xs"
                style={{
                  backgroundColor: colors.surfaceBg,
                  borderColor: colors.border,
                  color: colors.textMuted,
                }}
              >
                {cluster.startDate.toLocaleDateString()} –{' '}
                {cluster.endDate.toLocaleDateString()}
              </div>

              {/* Events list */}
              <div className="max-h-60 overflow-y-auto">
                {cluster.events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      onEventClick(event);
                      setIsPopoverOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: trackColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: colors.textPrimary }}
                      >
                        {event.title}
                      </p>
                      <p
                        className="text-[10px] truncate"
                        style={{ color: colors.textMuted }}
                      >
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: colors.textMuted }} />
                  </button>
                ))}
              </div>

              {/* Expand action */}
              <div
                className="px-4 py-2 border-t"
                style={{ borderColor: colors.border }}
              >
                <button
                  onClick={() => {
                    onExpand();
                    setIsPopoverOpen(false);
                  }}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: colors.primaryFill,
                    color: colors.primary,
                  }}
                >
                  Zoom to this period
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default EventClusterNode;
