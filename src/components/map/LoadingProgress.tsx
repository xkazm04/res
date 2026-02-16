'use client';

/**
 * LoadingProgress - Progressive loading visualization
 *
 * Thin progress bar at top of viewport with count badge.
 * Shows skeleton states for cards/nodes while loading.
 */

import { memo, useEffect, useState, useRef } from 'react';

interface LoadingProgressProps {
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Number of items loaded so far */
  loadedCount: number;
  /** Estimated total items (may be approximate) */
  totalCount?: number;
  /** Whether to use radar (dark) styling */
  isRadar?: boolean;
}

export const LoadingProgress = memo(function LoadingProgress({
  isLoading,
  loadedCount,
  totalCount,
  isRadar = false,
}: LoadingProgressProps) {
  const [visible, setVisible] = useState(false);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const rafRef = useRef<number>(0);

  // Show/hide with slight delay to avoid flicker on fast loads
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(timer);
    } else {
      // Keep visible briefly after completion
      const timer = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Animate progress bar width
  useEffect(() => {
    if (!totalCount || totalCount === 0) {
      // Indeterminate mode
      setAnimatedWidth(isLoading ? 70 : 100);
      return;
    }

    const target = Math.min(100, (loadedCount / totalCount) * 100);

    const animate = () => {
      setAnimatedWidth((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) return target;
        return prev + diff * 0.15;
      });
      if (isLoading) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loadedCount, totalCount, isLoading]);

  if (!visible && !isLoading) return null;

  const barColor = isRadar ? 'bg-cyan-500' : 'bg-black';
  const trackColor = isRadar ? 'bg-slate-800' : 'bg-gray-200';
  const textColor = isRadar ? 'text-cyan-400' : 'text-gray-500';
  const badgeBg = isRadar ? 'bg-slate-800/90' : 'bg-white/90';

  const isIndeterminate = !totalCount;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
      }}
    >
      {/* Progress bar track */}
      <div className={`h-[2px] ${trackColor} w-full overflow-hidden`}>
        <div
          className={`h-full ${barColor} transition-all duration-300 ease-out ${
            isIndeterminate ? 'animate-pulse' : ''
          }`}
          style={{
            width: `${animatedWidth}%`,
            ...(isIndeterminate && {
              animation: 'indeterminate 1.5s ease-in-out infinite',
            }),
          }}
        />
      </div>

      {/* Count badge */}
      {loadedCount > 0 && (
        <div className="flex justify-center mt-2">
          <div
            className={`${badgeBg} backdrop-blur-sm px-2.5 py-0.5 rounded-full border ${
              isRadar ? 'border-slate-700' : 'border-gray-200'
            } shadow-sm pointer-events-auto`}
          >
            <span className={`text-[10px] font-mono tabular-nums ${textColor}`}>
              {isLoading ? 'Loading ' : ''}
              {loadedCount.toLocaleString()}
              {totalCount ? ` / ~${totalCount.toLocaleString()}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Indeterminate animation keyframes */}
      {isIndeterminate && (
        <style jsx>{`
          @keyframes indeterminate {
            0% { transform: translateX(-100%); width: 40%; }
            50% { width: 60%; }
            100% { transform: translateX(250%); width: 40%; }
          }
        `}</style>
      )}
    </div>
  );
});
