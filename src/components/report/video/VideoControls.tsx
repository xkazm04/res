'use client';

import { useEffect } from 'react';
import type { VideoFormat } from './VideoOverview';

interface PlaybackState {
  frame: number;
  playing: boolean;
  progress: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  seekTo: (frame: number) => void;
  config: { fps: number; durationInFrames: number };
}

interface VideoControlsProps {
  playback: PlaybackState;
  isRadar: boolean;
  format: VideoFormat;
}

// Match scene config from VideoOverview (optimized timing)
const SCENES = [
  { name: 'Title', start: 0, icon: '🎯' },
  { name: 'Metrics', start: 50, icon: '📊' },
  { name: 'Charts', start: 125, icon: '📈' },
  { name: 'Insights', start: 240, icon: '💡' },
  { name: 'Summary', start: 345, icon: '✅' },
];

export function VideoControls({ playback, isRadar, format }: VideoControlsProps) {
  const { frame, playing, progress, toggle, reset, seekTo, config } = playback;
  const { fps, durationInFrames } = config;
  const isMobile = format === 'mobile';

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); toggle(); break;
        case 'r': reset(); break;
        case 'ArrowLeft': seekTo(Math.max(0, frame - fps)); break;
        case 'ArrowRight': seekTo(Math.min(durationInFrames - 1, frame + fps)); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, reset, seekTo, frame, fps, durationInFrames]);

  const formatTime = (f: number) => {
    const secs = Math.floor(f / fps);
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Find current scene
  const currentSceneIndex = SCENES.reduce((acc, scene, i) => frame >= scene.start ? i : acc, 0);

  // Mobile layout - compact controls
  if (isMobile) {
    return (
      <div className={`absolute bottom-0 left-0 right-0 ${isRadar ? 'bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent' : 'bg-gradient-to-t from-stone-200 via-stone-200/95 to-transparent'}`} style={{ paddingTop: 32 }}>
        <div className="px-3 pb-3">
          {/* Minimal timeline */}
          <div className="mb-2">
            <input
              type="range"
              min={0}
              max={durationInFrames - 1}
              value={frame}
              onChange={e => seekTo(parseInt(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${isRadar ? '#22d3ee' : '#57534e'} 0%, ${isRadar ? '#22d3ee' : '#57534e'} ${progress * 100}%, ${isRadar ? '#1e293b' : '#e7e5e4'} ${progress * 100}%, ${isRadar ? '#1e293b' : '#e7e5e4'} 100%)`
              }}
            />
          </div>

          {/* Compact controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={toggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isRadar
                    ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-slate-900 shadow-lg shadow-cyan-500/20'
                    : 'bg-gradient-to-br from-stone-600 to-stone-800 text-white shadow-lg'
                }`}
              >
                {playing ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                ) : (
                  <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              {/* Time */}
              <span className={`text-[10px] font-mono tabular-nums ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                {formatTime(frame)}
              </span>
            </div>

            {/* Scene dots indicator */}
            <div className="flex gap-1">
              {SCENES.map((scene, i) => {
                const isActive = i === currentSceneIndex;
                const isPast = i < currentSceneIndex;
                return (
                  <button
                    key={scene.name}
                    onClick={() => seekTo(scene.start)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isActive
                        ? isRadar ? 'bg-cyan-400 scale-125' : 'bg-stone-700 scale-125'
                        : isPast
                          ? isRadar ? 'bg-cyan-500/50' : 'bg-stone-500/50'
                          : isRadar ? 'bg-slate-700' : 'bg-stone-300'
                    }`}
                    title={scene.name}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard layout - full controls
  return (
    <div className={`absolute bottom-0 left-0 right-0 ${isRadar ? 'bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent' : 'bg-gradient-to-t from-stone-200 via-stone-200/95 to-transparent'}`} style={{ paddingTop: 40 }}>
      <div className="px-4 pb-3">
        {/* Timeline with scene markers */}
        <div className="mb-2.5 relative">
          {/* Scene markers on timeline */}
          <div className="absolute inset-x-0 top-0 h-1.5 flex">
            {SCENES.map((scene, i) => {
              const nextScene = SCENES[i + 1];
              const endPos = nextScene ? (nextScene.start / durationInFrames) * 100 : 100;
              const startPos = (scene.start / durationInFrames) * 100;
              return (
                <div
                  key={scene.name}
                  className="absolute h-full"
                  style={{
                    left: `${startPos}%`,
                    width: `${endPos - startPos}%`,
                    borderLeft: i > 0 ? `1px solid ${isRadar ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.08)'}` : 'none',
                  }}
                />
              );
            })}
          </div>
          <input
            type="range"
            min={0}
            max={durationInFrames - 1}
            value={frame}
            onChange={e => seekTo(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer relative z-10"
            style={{
              background: `linear-gradient(to right, ${isRadar ? '#22d3ee' : '#57534e'} 0%, ${isRadar ? '#22d3ee' : '#57534e'} ${progress * 100}%, ${isRadar ? '#1e293b' : '#e7e5e4'} ${progress * 100}%, ${isRadar ? '#1e293b' : '#e7e5e4'} 100%)`
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Play/Pause with glow */}
            <button
              onClick={toggle}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isRadar
                  ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/25'
                  : 'bg-gradient-to-br from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-white shadow-lg'
              }`}
            >
              {playing ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            {/* Reset */}
            <button onClick={reset} className={`p-1.5 rounded-lg transition-colors ${isRadar ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-300'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Time */}
            <span className={`text-xs font-mono tabular-nums ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {formatTime(frame)} / {formatTime(durationInFrames)}
            </span>
          </div>

          {/* Scene buttons with icons */}
          <div className="flex gap-1">
            {SCENES.map((scene, i) => {
              const isActive = i === currentSceneIndex;
              return (
                <button
                  key={scene.name}
                  onClick={() => seekTo(scene.start)}
                  className={`px-2 py-1 text-[9px] rounded-md transition-all flex items-center gap-1 ${
                    isActive
                      ? isRadar ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-stone-700 text-white'
                      : isRadar ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-300'
                  }`}
                  title={scene.name}
                >
                  <span>{scene.icon}</span>
                  <span className="font-medium">{scene.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
