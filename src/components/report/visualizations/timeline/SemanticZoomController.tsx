'use client';

/**
 * SemanticZoomController
 *
 * Zoom level controls with semantic labels (decade, year, month, etc.)
 * and quick navigation buttons.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { ZoomLevel } from '@/src/lib/temporalClustering';
import { cn } from '@/src/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronDown,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SemanticZoomControllerProps {
  currentLevel: ZoomLevel;
  onZoomToLevel: (level: ZoomLevel, centerDate?: Date) => void;
  onZoomIn: (centerDate?: Date) => void;
  onZoomOut: (centerDate?: Date) => void;
  onZoomToFit: () => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const ZOOM_LEVELS: Array<{
  level: ZoomLevel;
  label: string;
  shortLabel: string;
}> = [
  { level: 'decade', label: 'Decades', shortLabel: '10Y' },
  { level: 'year', label: 'Years', shortLabel: '1Y' },
  { level: 'quarter', label: 'Quarters', shortLabel: '3M' },
  { level: 'month', label: 'Months', shortLabel: '1M' },
  { level: 'week', label: 'Weeks', shortLabel: '1W' },
  { level: 'day', label: 'Days', shortLabel: '1D' },
];

// ============================================================================
// Component
// ============================================================================

export function SemanticZoomController({
  currentLevel,
  onZoomToLevel,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  className,
}: SemanticZoomControllerProps) {
  const { colors, isRadar } = useVisualizationTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentLevelInfo = ZOOM_LEVELS.find((l) => l.level === currentLevel);
  const currentIndex = ZOOM_LEVELS.findIndex((l) => l.level === currentLevel);

  const canZoomIn = currentIndex < ZOOM_LEVELS.length - 1;
  const canZoomOut = currentIndex > 0;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Zoom out button */}
      <button
        onClick={() => onZoomOut()}
        disabled={!canZoomOut}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canZoomOut ? 'hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
        )}
        title="Zoom out"
      >
        <ZoomOut size={16} style={{ color: colors.textSecondary }} />
      </button>

      {/* Level selector dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          style={{
            backgroundColor: isDropdownOpen ? colors.primaryFill : 'transparent',
          }}
        >
          <span
            className="text-xs font-medium"
            style={{ color: colors.textPrimary }}
          >
            {currentLevelInfo?.label || currentLevel}
          </span>
          <ChevronDown
            size={14}
            className={cn('transition-transform', isDropdownOpen && 'rotate-180')}
            style={{ color: colors.textMuted }}
          />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-1 z-20 rounded-lg shadow-lg overflow-hidden"
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {ZOOM_LEVELS.map((item, index) => {
                  const isCurrent = item.level === currentLevel;

                  return (
                    <button
                      key={item.level}
                      onClick={() => {
                        onZoomToLevel(item.level);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-4 px-4 py-2 text-left transition-colors',
                        'hover:bg-white/10',
                        isCurrent && 'bg-white/5'
                      )}
                    >
                      <span
                        className="text-xs"
                        style={{
                          color: isCurrent ? colors.primary : colors.textPrimary,
                          fontWeight: isCurrent ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: colors.textMuted }}
                      >
                        {item.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Zoom in button */}
      <button
        onClick={() => onZoomIn()}
        disabled={!canZoomIn}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canZoomIn ? 'hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
        )}
        title="Zoom in"
      >
        <ZoomIn size={16} style={{ color: colors.textSecondary }} />
      </button>

      {/* Fit to view button */}
      <button
        onClick={onZoomToFit}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Fit to view"
      >
        <Maximize size={16} style={{ color: colors.textSecondary }} />
      </button>
    </div>
  );
}

export default SemanticZoomController;
