'use client';

/**
 * EventHighlighter
 *
 * Displays animated narration text and visual emphasis when
 * events appear during playback.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { StoryEvent } from '@/src/lib/storyScript';
import { cn } from '@/src/lib/utils';
import { Quote, Mic, Volume2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface EventHighlighterProps {
  event: StoryEvent | null;
  eventProgress: number;
  isPlaying: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function EventHighlighter({
  event,
  eventProgress,
  isPlaying,
}: EventHighlighterProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();

  // Split narration into words for typewriter effect
  const words = useMemo(() => {
    if (!event) return [];
    return event.narration.split(' ');
  }, [event?.narration]);

  // Calculate how many words to show based on progress
  const visibleWordCount = useMemo(() => {
    if (!event || words.length === 0) return 0;
    // Show words progressively during the first 80% of event duration
    const textProgress = Math.min(eventProgress / 0.8, 1);
    return Math.ceil(textProgress * words.length);
  }, [eventProgress, words.length, event]);

  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn('px-6 py-4 border-t', surfaceClasses)}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.cardBg,
      }}
    >
      {/* Narration container */}
      <div className="max-w-3xl mx-auto">
        {/* Speaking indicator */}
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{
              scale: isPlaying ? [1, 1.2, 1] : 1,
              opacity: isPlaying ? 1 : 0.5,
            }}
            transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.primaryFill }}
          >
            {isPlaying ? (
              <Volume2 size={12} style={{ color: colors.primary }} />
            ) : (
              <Mic size={12} style={{ color: colors.textMuted }} />
            )}
          </motion.div>

          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: colors.textMuted }}
          >
            {event.importance === 'major' ? 'Key Moment' : 'Narration'}
          </span>

          {/* Sound wave animation when playing */}
          {isPlaying && (
            <div className="flex items-center gap-0.5 ml-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  animate={{
                    height: ['8px', '16px', '8px'],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Narration text with typewriter effect */}
        <div
          className="relative text-lg leading-relaxed"
          style={{ color: colors.textPrimary }}
        >
          <Quote
            size={20}
            className="absolute -left-6 -top-1 opacity-30"
            style={{ color: colors.primary }}
          />

          <AnimatePresence mode="wait">
            <motion.p
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif"
            >
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: i < visibleWordCount ? 1 : 0.2,
                  }}
                  transition={{ duration: 0.1 }}
                  className={cn(
                    'inline-block mr-1',
                    i >= visibleWordCount && 'blur-[2px]'
                  )}
                >
                  {word}
                </motion.span>
              ))}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Context points */}
        {event.contextPoints && event.contextPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: eventProgress > 0.5 ? 1 : 0, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {event.contextPoints.map((point, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: eventProgress > 0.5 + i * 0.1 ? 1 : 0,
                  scale: 1,
                }}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: colors.primaryFill,
                  color: colors.primary,
                }}
              >
                {point}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Progress bar for current event */}
        <div
          className="mt-4 h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.border }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.primary }}
            animate={{ width: `${eventProgress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Event metadata */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span style={{ color: colors.textMuted }}>
            Chapter: {event.chapter}
          </span>
          <span style={{ color: colors.textMuted }}>
            {Math.round(eventProgress * 100)}% complete
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default EventHighlighter;
