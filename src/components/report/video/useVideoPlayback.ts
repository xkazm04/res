'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Re-export animation utilities from shared library for backward compatibility
export {
  easeOutCubic,
  easeOutQuart,
  easeInOutCubic,
  easeOutExpo,
  spring,
  interpolate,
  linear,
} from '@/src/lib/animation';

interface VideoConfig {
  fps: number;
  durationInFrames: number;
}

interface PlaybackState {
  frame: number;
  playing: boolean;
  progress: number;
}

export function useVideoPlayback(config: VideoConfig) {
  const { fps, durationInFrames } = config;
  const [state, setState] = useState<PlaybackState>({ frame: 0, playing: false, progress: 0 });
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  const play = useCallback(() => setState(s => ({ ...s, playing: true })), []);
  const pause = useCallback(() => setState(s => ({ ...s, playing: false })), []);
  const toggle = useCallback(() => setState(s => ({ ...s, playing: !s.playing })), []);
  const reset = useCallback(() => {
    frameRef.current = 0;
    setState({ frame: 0, playing: false, progress: 0 });
  }, []);
  const seekTo = useCallback((frame: number) => {
    const clamped = Math.max(0, Math.min(durationInFrames - 1, frame));
    frameRef.current = clamped;
    setState(s => ({ ...s, frame: clamped, progress: clamped / (durationInFrames - 1) }));
  }, [durationInFrames]);

  useEffect(() => {
    if (!state.playing) return;

    const frameDuration = 1000 / fps;
    let animationId: number;

    const tick = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;

      if (delta >= frameDuration) {
        const framesToAdd = Math.floor(delta / frameDuration);
        frameRef.current = Math.min(frameRef.current + framesToAdd, durationInFrames - 1);
        lastTimeRef.current = time - (delta % frameDuration);

        setState(s => ({
          ...s,
          frame: frameRef.current,
          progress: frameRef.current / (durationInFrames - 1),
        }));

        if (frameRef.current >= durationInFrames - 1) {
          setState(s => ({ ...s, playing: false }));
          return;
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = 0;
    animationId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationId);
  }, [state.playing, fps, durationInFrames]);

  return { ...state, play, pause, toggle, reset, seekTo, config };
}
