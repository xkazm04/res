'use client';

import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';

// ========== SHARED HOOKS ==========

/** Detect user's reduced motion preference */
function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/** Handle escape key to close */
function useEscapeKey(enabled: boolean, onClose: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onClose]);
}

// ========== TYPES ==========

export type ReadingModeType = 'spotlight' | 'speed';

interface ReadingModeBaseProps {
  enabled: boolean;
  onClose: () => void;
}

interface SpotlightModeProps extends ReadingModeBaseProps {
  mode: 'spotlight';
  children: ReactNode;
}

interface SpeedModeProps extends ReadingModeBaseProps {
  mode: 'speed';
  text: string;
  wordsPerMinute?: number;
}

export type ReadingModeProps = SpotlightModeProps | SpeedModeProps;

// ========== SHARED OVERLAY COMPONENT ==========

interface ReadingOverlayProps {
  enabled: boolean;
  onClose: () => void;
  children: ReactNode;
  fullscreen?: boolean;
}

function ReadingOverlay({ enabled, onClose, children, fullscreen = false }: ReadingOverlayProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  const reducedMotion = useReducedMotion();

  useEscapeKey(enabled, onClose);

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex ${fullscreen ? 'flex-col' : ''} items-center justify-center`}
          onClick={fullscreen ? undefined : onClose}
        >
          {/* Background */}
          <div className={`absolute inset-0 ${isRadar ? 'bg-slate-950/98' : fullscreen ? 'bg-stone-100' : 'bg-stone-950/95'}`} />

          {/* Radial gradient spotlight (spotlight mode only) */}
          {!fullscreen && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isRadar
                  ? 'radial-gradient(ellipse 60% 50% at center, transparent 0%, rgba(0,0,0,0.8) 100%)'
                  : 'radial-gradient(ellipse 60% 50% at center, transparent 0%, rgba(0,0,0,0.9) 100%)',
              }}
            />
          )}

          {/* Content */}
          {children}

          {/* Ambient glow for radar theme with breathing animation (spotlight mode only) */}
          {isRadar && !fullscreen && (
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500 blur-3xl rounded-full"
                initial={{ scale: 1, opacity: 0.05 }}
                animate={
                  reducedMotion
                    ? { scale: 1, opacity: 0.05 }
                    : {
                        scale: [0.95, 1.05, 0.95],
                        opacity: [0.03, 0.07, 0.03],
                      }
                }
                transition={
                  reducedMotion
                    ? undefined
                    : {
                        duration: 4,
                        ease: 'easeInOut',
                        repeat: Infinity,
                      }
                }
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========== SPOTLIGHT MODE CONTENT ==========

interface SpotlightContentProps {
  children: ReactNode;
  onClose: () => void;
}

function SpotlightContent({ children, onClose }: SpotlightContentProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={`relative z-10 max-w-3xl max-h-[80vh] overflow-y-auto p-8 rounded-2xl ${
        isRadar ? 'bg-slate-900/90 border border-cyan-500/30' : 'bg-white shadow-2xl'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close hint */}
      <div className={`absolute top-4 right-4 text-xs ${isRadar ? 'text-cyan-400/60' : 'text-stone-400'}`}>
        Press ESC to exit
      </div>

      {children}
    </motion.div>
  );
}

// ========== SPEED READER CONTENT ==========

interface SpeedReaderContentProps {
  text: string;
  wordsPerMinute: number;
  onClose: () => void;
  isActive: boolean;
}

function SpeedReaderContent({ text, wordsPerMinute, onClose, isActive }: SpeedReaderContentProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  // Pre-calculate all word splits and focal points once when text changes
  const wordData = useMemo(() => {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return words.map(word => {
      // Find the optimal focal point (slightly left of center for English)
      const focalIndex = Math.floor(word.length * 0.35);
      return {
        word,
        beforeFocal: word.slice(0, focalIndex),
        focal: word[focalIndex] || '',
        afterFocal: word.slice(focalIndex + 1),
      };
    });
  }, [text]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(wordsPerMinute);
  const [sliderWpm, setSliderWpm] = useState(wordsPerMinute);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentWordData = wordData[currentIndex] || { word: '', beforeFocal: '', focal: '', afterFocal: '' };
  const progress = wordData.length > 0 ? (currentIndex / wordData.length) * 100 : 0;

  const play = useCallback(() => setIsPlaying(true), []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setCurrentIndex(0);
  }, [pause]);

  // Playback interval
  useEffect(() => {
    if (isPlaying && currentIndex < wordData.length - 1) {
      const msPerWord = 60000 / wpm;
      intervalRef.current = setInterval(() => {
        setCurrentIndex(i => Math.min(i + 1, wordData.length - 1));
      }, msPerWord);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else if (currentIndex >= wordData.length - 1) {
      pause();
    }
  }, [isPlaying, wpm, wordData.length, currentIndex, pause]);

  // Reset when closed
  useEffect(() => {
    if (!isActive) reset();
  }, [isActive, reset]);

  // Keyboard controls
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        isPlaying ? pause() : play();
      }
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 5));
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(wordData.length - 1, i + 5));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPlaying, play, pause, wordData.length]);

  return (
    <>
      {/* Word display */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className={`relative px-16 py-8 rounded-2xl ${isRadar ? 'bg-slate-900/80' : 'bg-white shadow-xl'}`}>
          {/* Focal point marker */}
          <div className={`absolute top-0 left-1/2 w-0.5 h-3 -translate-x-1/2 ${isRadar ? 'bg-cyan-400' : 'bg-stone-800'}`} />
          <div className={`absolute bottom-0 left-1/2 w-0.5 h-3 -translate-x-1/2 ${isRadar ? 'bg-cyan-400' : 'bg-stone-800'}`} />

          {/* Word */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-mono tracking-wider flex justify-center"
          >
            <span className={styles.textMuted}>{currentWordData.beforeFocal}</span>
            <span className={isRadar ? 'text-cyan-400' : 'text-rose-600'}>{currentWordData.focal}</span>
            <span className={styles.text}>{currentWordData.afterFocal}</span>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className={`w-full max-w-md p-6 relative z-10 ${isRadar ? 'border-t border-cyan-500/20' : 'border-t border-stone-200'}`}>
        {/* Progress bar */}
        <div className={`h-1 rounded-full mb-4 ${isRadar ? 'bg-slate-800' : 'bg-stone-200'}`}>
          <motion.div
            className={`h-full rounded-full ${isRadar ? 'bg-cyan-400' : 'bg-stone-800'}`}
            animate={{ width: `${progress}%` }}
          />
        </div>

        {/* Button row */}
        <div className="flex items-center justify-between">
          <button
            onClick={reset}
            className={`px-4 py-2 rounded-lg text-sm ${
              isRadar ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            Reset
          </button>

          <button
            onClick={isPlaying ? pause : play}
            className={`px-8 py-3 rounded-xl font-semibold ${
              isRadar ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-stone-800 text-white hover:bg-stone-700'
            }`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-xs ${styles.textMuted}`}>WPM:</span>
            <input
              type="range"
              min="100"
              max="600"
              step="50"
              value={sliderWpm}
              onChange={(e) => setSliderWpm(Number(e.target.value))}
              onMouseUp={() => setWpm(sliderWpm)}
              onTouchEnd={() => setWpm(sliderWpm)}
              className="w-20"
            />
            <span className={`text-xs font-mono ${styles.text}`}>{sliderWpm}</span>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className={`mt-4 text-center text-[10px] ${styles.textMuted}`}>
          Space: Play/Pause | ← →: Skip | ESC: Close
        </div>
      </div>
    </>
  );
}

// ========== MAIN COMPONENT ==========

/**
 * Unified reading mode component that provides focused reading experiences.
 *
 * Two modes:
 * - `spotlight`: Displays content in a focused overlay with ambient effects
 * - `speed`: RSVP (Rapid Serial Visual Presentation) speed reading with controls
 *
 * @example
 * // Spotlight mode for focused reading
 * <ReadingMode mode="spotlight" enabled={true} onClose={handleClose}>
 *   <article>Content here...</article>
 * </ReadingMode>
 *
 * @example
 * // Speed reading mode
 * <ReadingMode
 *   mode="speed"
 *   enabled={true}
 *   onClose={handleClose}
 *   text="Your text content here..."
 *   wordsPerMinute={300}
 * />
 */
export function ReadingMode(props: ReadingModeProps) {
  const { enabled, onClose, mode } = props;

  if (mode === 'spotlight') {
    return (
      <ReadingOverlay enabled={enabled} onClose={onClose}>
        <SpotlightContent onClose={onClose}>
          {props.children}
        </SpotlightContent>
      </ReadingOverlay>
    );
  }

  // Speed mode
  return (
    <ReadingOverlay enabled={enabled} onClose={onClose} fullscreen>
      <SpeedReaderContent
        text={props.text}
        wordsPerMinute={props.wordsPerMinute ?? 300}
        onClose={onClose}
        isActive={enabled}
      />
    </ReadingOverlay>
  );
}

// ========== LEGACY EXPORTS FOR BACKWARDS COMPATIBILITY ==========

/** @deprecated Use ReadingMode with mode="spotlight" instead */
export function FocusMode({ children, enabled, onClose }: { children: ReactNode; enabled: boolean; onClose: () => void }) {
  return (
    <ReadingMode mode="spotlight" enabled={enabled} onClose={onClose}>
      {children}
    </ReadingMode>
  );
}

/** @deprecated Use ReadingMode with mode="speed" instead */
export function SpeedReader({
  text,
  isActive,
  onClose,
  wordsPerMinute = 300,
}: {
  text: string;
  isActive: boolean;
  onClose: () => void;
  wordsPerMinute?: number;
}) {
  return (
    <ReadingMode mode="speed" enabled={isActive} onClose={onClose} text={text} wordsPerMinute={wordsPerMinute} />
  );
}
