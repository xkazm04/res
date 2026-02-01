'use client';

/**
 * ChapterNavigator
 *
 * Displays chapter markers and allows jumping between key periods
 * in the timeline.
 */

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { StoryChapter, ChapterMarker } from '@/src/lib/storyScript';
import { cn } from '@/src/lib/utils';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ChapterNavigatorProps {
  chapters: StoryChapter[];
  currentChapter: StoryChapter | null;
  markers: ChapterMarker[];
  progress: number;
  onSeekToChapter: (chapterIndex: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ChapterNavigator({
  chapters,
  currentChapter,
  markers,
  progress,
  onSeekToChapter,
}: ChapterNavigatorProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current chapter
  useEffect(() => {
    if (!currentChapter || !scrollRef.current) return;

    const chapterElement = scrollRef.current.querySelector(
      `[data-chapter-id="${currentChapter.id}"]`
    );

    if (chapterElement) {
      chapterElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentChapter?.id]);

  // Get mood icon color
  const getMoodColor = (mood: StoryChapter['mood']) => {
    switch (mood) {
      case 'tension':
        return colors.warning;
      case 'revelation':
        return colors.primary;
      case 'resolution':
        return colors.success;
      case 'conclusion':
        return colors.secondary;
      default:
        return colors.textMuted;
    }
  };

  // Get mood label
  const getMoodLabel = (mood: StoryChapter['mood']) => {
    switch (mood) {
      case 'tension':
        return 'Rising Action';
      case 'revelation':
        return 'Discovery';
      case 'resolution':
        return 'Resolution';
      case 'conclusion':
        return 'Conclusion';
      default:
        return 'Introduction';
    }
  };

  const currentIndex = currentChapter
    ? chapters.findIndex((c) => c.id === currentChapter.id)
    : -1;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < chapters.length - 1;

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 border-b"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.surfaceBg,
      }}
    >
      {/* Chapter icon */}
      <BookOpen size={16} style={{ color: colors.textMuted }} className="flex-shrink-0" />

      {/* Previous button */}
      <button
        onClick={() => canGoPrev && onSeekToChapter(currentIndex - 1)}
        disabled={!canGoPrev}
        className={cn(
          'p-1.5 rounded-lg transition-colors flex-shrink-0',
          canGoPrev ? 'hover:bg-white/5' : 'opacity-30 cursor-not-allowed'
        )}
      >
        <ChevronLeft size={16} style={{ color: colors.textSecondary }} />
      </button>

      {/* Chapters scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
      >
        {chapters.map((chapter, i) => {
          const isCurrent = currentChapter?.id === chapter.id;
          const isPast =
            currentChapter &&
            chapters.indexOf(currentChapter) > i;
          const marker = markers.find((m) => m.chapterIndex === i);

          return (
            <motion.button
              key={chapter.id}
              data-chapter-id={chapter.id}
              onClick={() => onSeekToChapter(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-shrink-0',
                isCurrent && 'ring-2'
              )}
              style={{
                backgroundColor: isCurrent ? colors.primaryFill : 'transparent',
                opacity: isPast ? 0.6 : 1,
                ...(isCurrent && { '--tw-ring-color': colors.primary } as React.CSSProperties),
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Chapter number indicator */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: isCurrent ? colors.primary : colors.border,
                  color: isCurrent ? colors.textOnDark : colors.textSecondary,
                }}
              >
                {i + 1}
              </div>

              {/* Chapter info */}
              <div className="text-left">
                <p
                  className={cn('text-xs font-medium', isCurrent && 'font-semibold')}
                  style={{ color: colors.textPrimary }}
                >
                  {chapter.title}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px]"
                    style={{ color: getMoodColor(chapter.mood) }}
                  >
                    {getMoodLabel(chapter.mood)}
                  </span>
                  {marker && (
                    <span className="text-[10px]" style={{ color: colors.textMuted }}>
                      &bull; {marker.eventCount} events
                    </span>
                  )}
                </div>
              </div>

              {/* Current indicator dot */}
              {isCurrent && (
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => canGoNext && onSeekToChapter(currentIndex + 1)}
        disabled={!canGoNext}
        className={cn(
          'p-1.5 rounded-lg transition-colors flex-shrink-0',
          canGoNext ? 'hover:bg-white/5' : 'opacity-30 cursor-not-allowed'
        )}
      >
        <ChevronRight size={16} style={{ color: colors.textSecondary }} />
      </button>

      {/* Progress through chapters indicator */}
      <div className="flex items-center gap-1 pl-2 border-l" style={{ borderColor: colors.border }}>
        {chapters.map((_, i) => {
          const chapterProgress = markers[i]?.progress ?? 0;
          const isCurrent = currentIndex === i;
          const isPast = currentIndex > i;

          return (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  isPast || (isCurrent && chapterProgress > 0.5)
                    ? colors.primary
                    : colors.border,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ChapterNavigator;
