'use client';

/**
 * useStoryPlayback Hook
 *
 * Manages playback state for the animated story mode, including
 * play/pause, seeking, speed control, and chapter navigation.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { TimelineEvent } from '@/src/types/research';
import {
  generateStoryScript,
  getCurrentEvent,
  getCurrentChapter,
  getChapterMarkers,
  type StoryScript,
  type StoryEvent,
  type StoryChapter,
  type ChapterMarker,
  type PlaybackSpeed,
} from '@/src/lib/storyScript';

// ============================================================================
// Types
// ============================================================================

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: PlaybackSpeed;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
}

export interface StoryPlaybackState extends PlaybackState {
  script: StoryScript | null;
  currentEvent: StoryEvent | null;
  currentChapter: StoryChapter | null;
  chapterMarkers: ChapterMarker[];
  progress: number; // 0-1
  eventProgress: number; // 0-1 progress within current event
  isGenerating: boolean;
  error: string | null;
}

export interface StoryPlaybackActions {
  // Playback controls
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;

  // Seeking
  seek: (time: number) => void;
  seekToProgress: (progress: number) => void;
  seekToEvent: (eventIndex: number) => void;
  seekToChapter: (chapterIndex: number) => void;

  // Navigation
  nextEvent: () => void;
  previousEvent: () => void;
  nextChapter: () => void;
  previousChapter: () => void;

  // Speed & volume
  setSpeed: (speed: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Looping
  toggleLoop: () => void;

  // Script management
  generateScript: (events: TimelineEvent[], title?: string) => void;
  setScript: (script: StoryScript) => void;
  clearScript: () => void;
}

export interface UseStoryPlaybackReturn {
  state: StoryPlaybackState;
  actions: StoryPlaybackActions;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useStoryPlayback(
  initialEvents?: TimelineEvent[],
  options?: {
    autoGenerate?: boolean;
    title?: string;
    defaultSpeed?: PlaybackSpeed;
    defaultVolume?: number;
    onEventChange?: (event: StoryEvent | null) => void;
    onChapterChange?: (chapter: StoryChapter | null) => void;
    onComplete?: () => void;
  }
): UseStoryPlaybackReturn {
  const {
    autoGenerate = false,
    title,
    defaultSpeed = 1,
    defaultVolume = 0.7,
    onEventChange,
    onChapterChange,
    onComplete,
  } = options ?? {};

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(defaultSpeed);
  const [volume, setVolumeState] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Script state
  const [script, setScriptState] = useState<StoryScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for animation loop
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const previousEventRef = useRef<StoryEvent | null>(null);
  const previousChapterRef = useRef<StoryChapter | null>(null);

  // Derived state
  const duration = script?.totalDuration ?? 0;
  const currentEvent = script ? getCurrentEvent(script, currentTime) : null;
  const currentChapter = script ? getCurrentChapter(script, currentTime) : null;
  const chapterMarkers = useMemo(
    () => (script ? getChapterMarkers(script) : []),
    [script]
  );
  const progress = duration > 0 ? currentTime / duration : 0;

  // Calculate event progress
  const eventProgress = useMemo(() => {
    if (!currentEvent) return 0;
    const eventStart = script?.events
      .slice(0, script.events.indexOf(currentEvent))
      .reduce((sum, e) => sum + e.duration, 0) ?? 0;
    const elapsed = currentTime - eventStart;
    return Math.min(1, Math.max(0, elapsed / currentEvent.duration));
  }, [currentEvent, currentTime, script]);

  // Event/chapter change callbacks
  useEffect(() => {
    if (currentEvent !== previousEventRef.current) {
      previousEventRef.current = currentEvent;
      onEventChange?.(currentEvent);
    }
  }, [currentEvent, onEventChange]);

  useEffect(() => {
    if (currentChapter !== previousChapterRef.current) {
      previousChapterRef.current = currentChapter;
      onChapterChange?.(currentChapter);
    }
  }, [currentChapter, onChapterChange]);

  // Auto-generate script on mount if events provided
  useEffect(() => {
    if (autoGenerate && initialEvents && initialEvents.length > 0 && !script) {
      generateScript(initialEvents, title);
    }
  }, [autoGenerate, initialEvents, title, script]);

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!isPlaying || !script) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = timestamp;

      setCurrentTime((prev) => {
        const newTime = prev + deltaTime * speed;

        // Check for completion
        if (newTime >= duration) {
          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            onComplete?.();
            return duration;
          }
        }

        return newTime;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [isPlaying, script, speed, duration, isLooping, onComplete]
  );

  // Start/stop animation loop based on playback state
  useEffect(() => {
    if (isPlaying && script) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    }

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, script, animate]);

  // ============================================================================
  // Actions
  // ============================================================================

  const play = useCallback(() => {
    if (!script) return;
    setIsPlaying(true);
  }, [script]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const seek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(duration, time));
      setCurrentTime(clampedTime);
    },
    [duration]
  );

  const seekToProgress = useCallback(
    (progressValue: number) => {
      const clampedProgress = Math.max(0, Math.min(1, progressValue));
      seek(clampedProgress * duration);
    },
    [duration, seek]
  );

  const seekToEvent = useCallback(
    (eventIndex: number) => {
      if (!script) return;

      if (eventIndex < 0 || eventIndex >= script.events.length) return;

      // Calculate time at start of event
      const time = script.events
        .slice(0, eventIndex)
        .reduce((sum, e) => sum + e.duration, 0);

      seek(time);
    },
    [script, seek]
  );

  const seekToChapter = useCallback(
    (chapterIndex: number) => {
      if (!script) return;

      if (chapterIndex < 0 || chapterIndex >= script.chapters.length) return;

      const chapter = script.chapters[chapterIndex];
      seek(chapter.startTime);
    },
    [script, seek]
  );

  const nextEvent = useCallback(() => {
    if (!script || !currentEvent) return;

    const currentIndex = script.events.indexOf(currentEvent);
    if (currentIndex < script.events.length - 1) {
      seekToEvent(currentIndex + 1);
    }
  }, [script, currentEvent, seekToEvent]);

  const previousEvent = useCallback(() => {
    if (!script || !currentEvent) return;

    const currentIndex = script.events.indexOf(currentEvent);

    // If we're more than 2 seconds into an event, go to start of current event
    // Otherwise go to previous event
    if (eventProgress > 0.1 && currentEvent.duration > 2) {
      seekToEvent(currentIndex);
    } else if (currentIndex > 0) {
      seekToEvent(currentIndex - 1);
    } else {
      seek(0);
    }
  }, [script, currentEvent, eventProgress, seekToEvent, seek]);

  const nextChapter = useCallback(() => {
    if (!script || !currentChapter) return;

    const currentIndex = script.chapters.indexOf(currentChapter);
    if (currentIndex < script.chapters.length - 1) {
      seekToChapter(currentIndex + 1);
    }
  }, [script, currentChapter, seekToChapter]);

  const previousChapter = useCallback(() => {
    if (!script || !currentChapter) return;

    const currentIndex = script.chapters.indexOf(currentChapter);
    const chapterProgress =
      (currentTime - currentChapter.startTime) /
      (currentChapter.endTime - currentChapter.startTime);

    // If we're more than 10% into a chapter, go to start of current chapter
    // Otherwise go to previous chapter
    if (chapterProgress > 0.1) {
      seekToChapter(currentIndex);
    } else if (currentIndex > 0) {
      seekToChapter(currentIndex - 1);
    } else {
      seek(0);
    }
  }, [script, currentChapter, currentTime, seekToChapter, seek]);

  const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    setSpeedState(newSpeed);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  const generateScript = useCallback(
    (events: TimelineEvent[], scriptTitle?: string) => {
      setIsGenerating(true);
      setError(null);

      try {
        const newScript = generateStoryScript(events, scriptTitle);
        setScriptState(newScript);
        setCurrentTime(0);
        setIsPlaying(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate script');
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const setScript = useCallback((newScript: StoryScript) => {
    setScriptState(newScript);
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
  }, []);

  const clearScript = useCallback(() => {
    setScriptState(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  const state: StoryPlaybackState = {
    isPlaying,
    currentTime,
    duration,
    speed,
    volume,
    isMuted,
    isLooping,
    script,
    currentEvent,
    currentChapter,
    chapterMarkers,
    progress,
    eventProgress,
    isGenerating,
    error,
  };

  const actions: StoryPlaybackActions = {
    play,
    pause,
    toggle,
    stop,
    seek,
    seekToProgress,
    seekToEvent,
    seekToChapter,
    nextEvent,
    previousEvent,
    nextChapter,
    previousChapter,
    setSpeed,
    setVolume,
    toggleMute,
    toggleLoop,
    generateScript,
    setScript,
    clearScript,
  };

  return { state, actions };
}

export default useStoryPlayback;
