'use client';

/**
 * TimelineAnimator
 *
 * Controls timeline progression with smooth animations,
 * showing events appearing and transitioning over time.
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { StoryScript, StoryEvent, StoryChapter } from '@/src/lib/storyScript';
import { cn } from '@/src/lib/utils';
import { Circle, Star, AlertTriangle, Zap, Flag } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface TimelineAnimatorProps {
  script: StoryScript;
  currentTime: number;
  currentEvent: StoryEvent | null;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TimelineAnimator({
  script,
  currentTime,
  currentEvent,
  isPlaying,
  onSeek,
}: TimelineAnimatorProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate which events are visible (past + current)
  const visibleEvents = useMemo(() => {
    let accumulatedTime = 0;
    const visible: Array<StoryEvent & { startTime: number; endTime: number }> = [];

    for (const event of script.events) {
      const startTime = accumulatedTime;
      const endTime = accumulatedTime + event.duration;

      if (startTime <= currentTime) {
        visible.push({ ...event, startTime, endTime });
      }

      accumulatedTime = endTime;
    }

    return visible;
  }, [script.events, currentTime]);

  // Current chapter info
  const currentChapterInfo = useMemo(() => {
    if (!currentEvent) return null;
    return script.chapters.find((c) => c.id === currentEvent.chapter);
  }, [currentEvent, script.chapters]);

  // Auto-scroll to current event
  useEffect(() => {
    if (!currentEvent || !timelineRef.current) return;

    const eventElement = timelineRef.current.querySelector(
      `[data-event-id="${currentEvent.id}"]`
    );

    if (eventElement) {
      eventElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentEvent?.id]);

  // Handle click on timeline to seek
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = clickX / rect.width;
      const newTime = progress * script.totalDuration;

      onSeek(newTime);
    },
    [script.totalDuration, onSeek]
  );

  // Get icon for event importance
  const getEventIcon = (importance: StoryEvent['importance']) => {
    switch (importance) {
      case 'major':
        return Star;
      case 'minor':
        return Circle;
      case 'transitional':
        return Zap;
      default:
        return Circle;
    }
  };

  // Get mood color
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

  // Progress through timeline
  const progress = (currentTime / script.totalDuration) * 100;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Chapter indicator */}
      {currentChapterInfo && (
        <motion.div
          key={currentChapterInfo.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3"
        >
          <div
            className="w-1 h-8 rounded-full"
            style={{ backgroundColor: getMoodColor(currentChapterInfo.mood) }}
          />
          <div>
            <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {currentChapterInfo.title}
            </h3>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {currentChapterInfo.description}
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      <div
        ref={containerRef}
        className="h-2 rounded-full cursor-pointer mb-6"
        style={{ backgroundColor: colors.border }}
        onClick={handleTimelineClick}
      >
        <motion.div
          className="h-full rounded-full relative"
          style={{ backgroundColor: colors.primary }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        >
          {/* Playhead */}
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg"
            style={{ backgroundColor: colors.primary }}
            animate={{ scale: isPlaying ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
          />
        </motion.div>

        {/* Chapter markers */}
        {script.chapters.map((chapter, i) => {
          if (i === 0) return null;
          const markerProgress = (chapter.startTime / script.totalDuration) * 100;
          return (
            <div
              key={chapter.id}
              className="absolute top-0 w-0.5 h-full"
              style={{
                left: `${markerProgress}%`,
                backgroundColor: getMoodColor(chapter.mood),
                opacity: 0.5,
              }}
              title={chapter.title}
            />
          );
        })}
      </div>

      {/* Events timeline */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2"
      >
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event, i) => {
            const isCurrent = currentEvent?.id === event.id;
            const isPast = event.endTime <= currentTime;
            const EventIcon = getEventIcon(event.importance);

            return (
              <motion.div
                key={event.id}
                data-event-id={event.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{
                  opacity: isPast ? 0.6 : 1,
                  x: 0,
                  scale: isCurrent ? 1.02 : 1,
                }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  'relative p-4 rounded-xl transition-all cursor-pointer',
                  isCurrent && 'ring-2'
                )}
                style={{
                  backgroundColor: isCurrent ? colors.primaryFill : colors.surfaceBg,
                  borderColor: colors.borderSubtle,
                  ...(isCurrent && { '--tw-ring-color': colors.primary } as React.CSSProperties),
                }}
                onClick={() => onSeek(event.startTime)}
              >
                {/* Connection line to previous event */}
                {i > 0 && (
                  <div
                    className="absolute -top-3 left-6 w-0.5 h-3"
                    style={{ backgroundColor: colors.border }}
                  />
                )}

                <div className="flex items-start gap-3">
                  {/* Event icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isCurrent && 'animate-pulse'
                    )}
                    style={{
                      backgroundColor: isCurrent ? colors.primary : colors.border,
                    }}
                  >
                    <EventIcon
                      size={18}
                      style={{
                        color: isCurrent ? colors.textOnDark : colors.textSecondary,
                      }}
                    />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    {/* Date badge */}
                    {event.date && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-medium"
                        style={{ color: colors.textMuted }}
                      >
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}

                    {/* Title */}
                    <h4
                      className={cn('text-sm font-medium mt-0.5', isCurrent && 'font-semibold')}
                      style={{ color: colors.textPrimary }}
                    >
                      {event.title}
                    </h4>

                    {/* Description */}
                    <p
                      className={cn('text-xs mt-1', isCurrent ? 'line-clamp-none' : 'line-clamp-2')}
                      style={{ color: colors.textSecondary }}
                    >
                      {event.description}
                    </p>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: colors.border,
                              color: colors.textMuted,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Importance indicator */}
                  {event.importance === 'major' && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors.warning }}
                      title="Major event"
                    />
                  )}
                </div>

                {/* Current event progress indicator */}
                {isCurrent && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 rounded-b-xl"
                    style={{ backgroundColor: colors.primary }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentTime - event.startTime) / event.duration) * 100}%`,
                    }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Future events placeholder */}
        {visibleEvents.length < script.events.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-4 rounded-xl"
            style={{ backgroundColor: colors.surfaceBg }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.border }}
            >
              <Flag size={18} style={{ color: colors.textMuted }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {script.events.length - visibleEvents.length} more event
                {script.events.length - visibleEvents.length !== 1 ? 's' : ''} ahead
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default TimelineAnimator;
