'use client';

/**
 * PlaybackControls
 *
 * Full playback control interface with play/pause, seek, speed,
 * volume, and navigation controls.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { StoryPlaybackState, StoryPlaybackActions } from '@/src/hooks/useStoryPlayback';
import type { PlaybackSpeed } from '@/src/lib/storyScript';
import { cn } from '@/src/lib/utils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Repeat,
  Maximize2,
  Columns,
  Clock,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PlaybackControlsProps {
  state: StoryPlaybackState;
  actions: StoryPlaybackActions;
  showContextCard: boolean;
  onToggleContextCard: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

// ============================================================================
// Component
// ============================================================================

export function PlaybackControls({
  state,
  actions,
  showContextCard,
  onToggleContextCard,
}: PlaybackControlsProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Handle progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = clickX / rect.width;

      actions.seekToProgress(progress);
    },
    [actions]
  );

  // Handle progress bar drag
  const handleProgressDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1 || !progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const progress = clickX / rect.width;

      actions.seekToProgress(progress);
    },
    [actions]
  );

  return (
    <div
      className="px-4 py-3 border-t"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.cardBg,
      }}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs tabular-nums w-12 text-right" style={{ color: colors.textMuted }}>
          {formatTime(state.currentTime)}
        </span>

        <div
          ref={progressRef}
          className="flex-1 h-2 rounded-full cursor-pointer group relative"
          style={{ backgroundColor: colors.border }}
          onClick={handleProgressClick}
          onMouseMove={handleProgressDrag}
        >
          {/* Buffered/loaded indicator */}
          <div
            className="absolute inset-0 h-full rounded-full opacity-30"
            style={{ backgroundColor: colors.primary }}
          />

          {/* Progress fill */}
          <motion.div
            className="h-full rounded-full relative"
            style={{ backgroundColor: colors.primary }}
            animate={{ width: `${state.progress * 100}%` }}
            transition={{ duration: 0.1 }}
          >
            {/* Playhead handle */}
            <motion.div
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                state.isPlaying && 'opacity-100'
              )}
              style={{
                backgroundColor: colors.primary,
                boxShadow: `0 0 0 2px ${colors.cardBg}`,
              }}
              whileHover={{ scale: 1.2 }}
            />
          </motion.div>

          {/* Chapter markers on progress bar */}
          {state.chapterMarkers.slice(1).map((marker, i) => (
            <div
              key={marker.chapterIndex}
              className="absolute top-0 w-0.5 h-full"
              style={{
                left: `${marker.progress * 100}%`,
                backgroundColor: colors.textMuted,
                opacity: 0.3,
              }}
              title={`Chapter ${marker.chapterIndex + 1}: ${marker.title}`}
            />
          ))}
        </div>

        <span className="text-xs tabular-nums w-12" style={{ color: colors.textMuted }}>
          {formatTime(state.duration)}
        </span>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-between">
        {/* Left: Secondary controls */}
        <div className="flex items-center gap-1">
          {/* Speed control */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showSpeedMenu ? 'bg-white/10' : 'hover:bg-white/5'
              )}
              style={{ color: colors.textSecondary }}
            >
              <Clock size={14} />
              {state.speed}x
            </button>

            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 p-2 rounded-lg shadow-lg z-10"
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <p className="text-[10px] uppercase tracking-wider mb-2 px-2" style={{ color: colors.textMuted }}>
                    Playback Speed
                  </p>
                  <div className="space-y-0.5">
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          actions.setSpeed(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={cn(
                          'w-full px-3 py-1.5 text-xs text-left rounded transition-colors',
                          state.speed === speed
                            ? 'bg-primary/20 text-primary'
                            : 'hover:bg-white/5'
                        )}
                        style={{
                          color: state.speed === speed ? colors.primary : colors.textPrimary,
                        }}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Loop toggle */}
          <button
            onClick={actions.toggleLoop}
            className={cn(
              'p-2 rounded-lg transition-colors',
              state.isLooping ? 'bg-primary/20' : 'hover:bg-white/5'
            )}
            title={state.isLooping ? 'Disable loop' : 'Enable loop'}
          >
            <Repeat
              size={16}
              style={{ color: state.isLooping ? colors.primary : colors.textSecondary }}
            />
          </button>
        </div>

        {/* Center: Main playback controls */}
        <div className="flex items-center gap-2">
          {/* Previous chapter */}
          <button
            onClick={actions.previousChapter}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Previous chapter"
          >
            <Rewind size={18} style={{ color: colors.textSecondary }} />
          </button>

          {/* Previous event */}
          <button
            onClick={actions.previousEvent}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Previous event"
          >
            <SkipBack size={18} style={{ color: colors.textSecondary }} />
          </button>

          {/* Play/Pause */}
          <motion.button
            onClick={actions.toggle}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {state.isPlaying ? (
              <Pause size={24} style={{ color: colors.textOnDark }} />
            ) : (
              <Play size={24} style={{ color: colors.textOnDark, marginLeft: 2 }} />
            )}
          </motion.button>

          {/* Next event */}
          <button
            onClick={actions.nextEvent}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Next event"
          >
            <SkipForward size={18} style={{ color: colors.textSecondary }} />
          </button>

          {/* Next chapter */}
          <button
            onClick={actions.nextChapter}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Next chapter"
          >
            <FastForward size={18} style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Right: Volume and view controls */}
        <div className="flex items-center gap-1">
          {/* Volume control */}
          <div className="relative flex items-center">
            <button
              onClick={actions.toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {state.isMuted || state.volume === 0 ? (
                <VolumeX size={16} style={{ color: colors.textSecondary }} />
              ) : (
                <Volume2 size={16} style={{ color: colors.textSecondary }} />
              )}
            </button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 100 }}
                  exit={{ opacity: 0, width: 0 }}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="overflow-hidden flex items-center"
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={state.isMuted ? 0 : state.volume * 100}
                    onChange={(e) => actions.setVolume(parseInt(e.target.value) / 100)}
                    className="w-20 h-1 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${state.volume * 100}%, ${colors.border} ${state.volume * 100}%, ${colors.border} 100%)`,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Context card toggle */}
          <button
            onClick={onToggleContextCard}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showContextCard ? 'bg-white/10' : 'hover:bg-white/5'
            )}
            title={showContextCard ? 'Hide context' : 'Show context'}
          >
            <Columns
              size={16}
              style={{ color: showContextCard ? colors.primary : colors.textSecondary }}
            />
          </button>
        </div>
      </div>

      {/* Event info line */}
      {state.currentEvent && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs" style={{ color: colors.textMuted }}>
            Now playing:
          </span>
          <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>
            {state.currentEvent.title}
          </span>
          <span className="text-xs" style={{ color: colors.textMuted }}>
            ({Math.round(state.eventProgress * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
}

export default PlaybackControls;
