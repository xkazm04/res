'use client';

/**
 * StoryModePlayer
 *
 * Main container for the animated story mode that orchestrates
 * timeline playback, narration, and all sub-components.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import { useStoryPlayback } from '@/src/hooks/useStoryPlayback';
import { TimelineAnimator } from './TimelineAnimator';
import { EventHighlighter } from './EventHighlighter';
import { ContextCard } from './ContextCard';
import { ChapterNavigator } from './ChapterNavigator';
import { PlaybackControls } from './PlaybackControls';
import { StoryExporter } from './StoryExporter';
import type { TimelineEvent, ResearchSource } from '@/src/types/research';
import type { StoryEvent, StoryChapter } from '@/src/lib/storyScript';
import { cn } from '@/src/lib/utils';
import {
  Play,
  Pause,
  Film,
  Maximize2,
  Minimize2,
  Settings,
  X,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface StoryModePlayerProps {
  events: TimelineEvent[];
  sources?: ResearchSource[];
  title?: string;
  onClose?: () => void;
  className?: string;
}

type ViewMode = 'standard' | 'fullscreen' | 'theater';

// ============================================================================
// Component
// ============================================================================

export function StoryModePlayer({
  events,
  sources = [],
  title = 'Research Timeline',
  onClose,
  className,
}: StoryModePlayerProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();

  // Playback hook
  const { state, actions } = useStoryPlayback(events, {
    autoGenerate: true,
    title,
    defaultSpeed: 1,
    onEventChange: handleEventChange,
    onChapterChange: handleChapterChange,
    onComplete: handlePlaybackComplete,
  });

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [showSettings, setShowSettings] = useState(false);
  const [showExporter, setShowExporter] = useState(false);
  const [autoNarrate, setAutoNarrate] = useState(true);
  const [showContextCard, setShowContextCard] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Get source for current event
  const currentSource = state.currentEvent
    ? sources.find((s) => s.id === state.currentEvent?.source_id)
    : undefined;

  // ============================================================================
  // Event handlers
  // ============================================================================

  function handleEventChange(event: StoryEvent | null) {
    // Narrate the event if auto-narrate is enabled
    if (event && autoNarrate && !state.isMuted) {
      speakNarration(event.narration);
    }
  }

  function handleChapterChange(chapter: StoryChapter | null) {
    // Could trigger chapter transition effects here
  }

  function handlePlaybackComplete() {
    // Stop any ongoing narration
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  // Speech synthesis for narration
  const speakNarration = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = state.speed;
      utterance.volume = state.volume;
      speechRef.current = utterance;

      window.speechSynthesis.speak(utterance);
    },
    [state.speed, state.volume]
  );

  // Stop narration when paused or muted
  useEffect(() => {
    if ((!state.isPlaying || state.isMuted) && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
  }, [state.isPlaying, state.isMuted]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (viewMode === 'fullscreen') {
      document.exitFullscreen?.();
      setViewMode('standard');
    } else {
      containerRef.current.requestFullscreen?.();
      setViewMode('fullscreen');
    }
  }, [viewMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          actions.toggle();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            actions.nextChapter();
          } else {
            actions.nextEvent();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            actions.previousChapter();
          } else {
            actions.previousEvent();
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          actions.toggleMute();
          break;
        case 'Escape':
          if (viewMode === 'fullscreen') {
            setViewMode('standard');
          } else {
            onClose?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, toggleFullscreen, viewMode, onClose]);

  // ============================================================================
  // Render
  // ============================================================================

  if (state.isGenerating) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center min-h-[400px]',
          surfaceClasses,
          className
        )}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Film size={48} style={{ color: colors.primary }} />
        </motion.div>
        <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>
          Generating story script...
        </p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center min-h-[400px]',
          surfaceClasses,
          className
        )}
      >
        <div
          className="p-4 rounded-xl text-center"
          style={{ backgroundColor: colors.dangerFill }}
        >
          <p className="text-sm font-medium" style={{ color: colors.danger }}>
            {state.error}
          </p>
        </div>
      </div>
    );
  }

  if (!state.script) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center min-h-[400px]',
          surfaceClasses,
          className
        )}
      >
        <Film size={48} style={{ color: colors.textMuted }} />
        <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>
          No events to display
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col rounded-2xl overflow-hidden',
        viewMode === 'fullscreen' && 'fixed inset-0 z-50 rounded-none',
        viewMode === 'theater' && 'min-h-[600px]',
        surfaceClasses,
        className
      )}
      style={{
        backgroundColor: colors.cardBg,
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          <Film size={20} style={{ color: colors.primary }} />
          <div>
            <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {state.script.title}
            </h2>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {state.script.events.length} events &bull;{' '}
              {Math.ceil(state.duration / 60)} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExporter(true)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Export"
          >
            <Film size={18} style={{ color: colors.textSecondary }} />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <Settings size={18} style={{ color: colors.textSecondary }} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title={viewMode === 'fullscreen' ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {viewMode === 'fullscreen' ? (
              <Minimize2 size={18} style={{ color: colors.textSecondary }} />
            ) : (
              <Maximize2 size={18} style={{ color: colors.textSecondary }} />
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Close"
            >
              <X size={18} style={{ color: colors.textSecondary }} />
            </button>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chapter navigator */}
        <ChapterNavigator
          chapters={state.script.chapters}
          currentChapter={state.currentChapter}
          markers={state.chapterMarkers}
          progress={state.progress}
          onSeekToChapter={actions.seekToChapter}
        />

        {/* Timeline + Event area */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Timeline animator */}
          <div className="flex-1 min-w-0">
            <TimelineAnimator
              script={state.script}
              currentTime={state.currentTime}
              currentEvent={state.currentEvent}
              isPlaying={state.isPlaying}
              onSeek={actions.seek}
            />
          </div>

          {/* Context card */}
          <AnimatePresence>
            {showContextCard && state.currentEvent && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80 border-l p-4 overflow-y-auto"
                style={{ borderColor: colors.border }}
              >
                <ContextCard
                  event={state.currentEvent}
                  source={currentSource}
                  eventProgress={state.eventProgress}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Event highlighter (narration display) */}
        <EventHighlighter
          event={state.currentEvent}
          eventProgress={state.eventProgress}
          isPlaying={state.isPlaying}
        />
      </div>

      {/* Playback controls */}
      <PlaybackControls
        state={state}
        actions={actions}
        showContextCard={showContextCard}
        onToggleContextCard={() => setShowContextCard(!showContextCard)}
      />

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-4 top-16 w-64 p-4 rounded-xl shadow-lg z-10"
            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
          >
            <h3 className="text-xs font-semibold mb-3" style={{ color: colors.textSecondary }}>
              Settings
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.textPrimary }}>
                  Auto-narrate
                </span>
                <button
                  onClick={() => setAutoNarrate(!autoNarrate)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative',
                    autoNarrate ? 'bg-primary' : 'bg-gray-500'
                  )}
                  style={{
                    backgroundColor: autoNarrate ? colors.primary : colors.border,
                  }}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                    animate={{ left: autoNarrate ? '22px' : '2px' }}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.textPrimary }}>
                  Show context card
                </span>
                <button
                  onClick={() => setShowContextCard(!showContextCard)}
                  className={cn('w-10 h-5 rounded-full transition-colors relative')}
                  style={{
                    backgroundColor: showContextCard ? colors.primary : colors.border,
                  }}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                    animate={{ left: showContextCard ? '22px' : '2px' }}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.textPrimary }}>
                  Loop playback
                </span>
                <button
                  onClick={actions.toggleLoop}
                  className={cn('w-10 h-5 rounded-full transition-colors relative')}
                  style={{
                    backgroundColor: state.isLooping ? colors.primary : colors.border,
                  }}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                    animate={{ left: state.isLooping ? '22px' : '2px' }}
                  />
                </button>
              </label>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-4 w-full py-2 text-xs rounded-lg"
              style={{ backgroundColor: colors.surfaceBg, color: colors.textSecondary }}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export modal */}
      <AnimatePresence>
        {showExporter && (
          <StoryExporter
            script={state.script}
            containerRef={containerRef}
            onClose={() => setShowExporter(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default StoryModePlayer;
