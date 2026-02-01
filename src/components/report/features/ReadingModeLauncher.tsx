'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme } from '../core/ThemeContext';
import { ReadingMode, type ReadingModeType } from './ReadingMode';

// ========== TYPES ==========

export interface ReadingModeLauncherProps {
  /** Content to display in spotlight mode */
  children: ReactNode;
  /** Text content for speed reading mode */
  text: string;
  /** Enable keyboard shortcut (R key) */
  enableShortcut?: boolean;
  /** Words per minute for speed reading */
  wordsPerMinute?: number;
  /** Callback when reading mode is activated */
  onActivate?: (mode: ReadingModeType) => void;
  /** Callback when reading mode is closed */
  onClose?: () => void;
}

// ========== HOOK ==========

/**
 * Hook to manage reading mode state with keyboard shortcut support.
 * Press 'R' to open the launcher, then select a mode.
 */
export function useReadingModeLauncher(enableShortcut = true) {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<ReadingModeType | null>(null);
  const [selectedText, setSelectedText] = useState('');

  // Capture selected text when launcher opens
  const openLauncher = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    setSelectedText(text);
    setLauncherOpen(true);
  }, []);

  const closeLauncher = useCallback(() => {
    setLauncherOpen(false);
  }, []);

  const selectMode = useCallback((mode: ReadingModeType) => {
    setActiveMode(mode);
    setLauncherOpen(false);
  }, []);

  const closeReadingMode = useCallback(() => {
    setActiveMode(null);
  }, []);

  // Keyboard shortcut: R to open launcher
  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // R key opens launcher (only if not already in reading mode)
      if (e.key === 'r' || e.key === 'R') {
        if (!launcherOpen && !activeMode) {
          e.preventDefault();
          openLauncher();
        }
      }

      // ESC closes launcher
      if (e.key === 'Escape' && launcherOpen) {
        closeLauncher();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut, launcherOpen, activeMode, openLauncher, closeLauncher]);

  return {
    launcherOpen,
    activeMode,
    selectedText,
    openLauncher,
    closeLauncher,
    selectMode,
    closeReadingMode,
  };
}

// ========== LAUNCHER MODAL ==========

interface LauncherModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMode: (mode: ReadingModeType) => void;
  hasSelectedText: boolean;
}

function LauncherModal({ open, onClose, onSelectMode, hasSelectedText }: LauncherModalProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  // Keyboard navigation: 1 for spotlight, 2 for speed
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onSelectMode('spotlight');
      }
      if (e.key === '2' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onSelectMode('speed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onSelectMode]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className={`absolute inset-0 ${isRadar ? 'bg-slate-950/90' : 'bg-stone-950/80'}`} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative z-10 p-6 rounded-2xl ${
              isRadar
                ? 'bg-slate-900 border border-cyan-500/30'
                : 'bg-white shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className={`text-lg font-semibold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
                Reading Mode
              </h2>
              <p className={`text-sm mt-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                {hasSelectedText ? 'Read selected text' : 'Choose how to read'}
              </p>
            </div>

            {/* Mode options */}
            <div className="flex gap-4">
              {/* Spotlight Mode */}
              <button
                onClick={() => onSelectMode('spotlight')}
                className={`group flex-1 p-4 rounded-xl transition-all ${
                  isRadar
                    ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50'
                    : 'bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  isRadar ? 'bg-cyan-500/20' : 'bg-stone-200'
                }`}>
                  <svg
                    className={`w-6 h-6 ${isRadar ? 'text-cyan-400' : 'text-stone-600'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <div className={`font-medium ${isRadar ? 'text-white' : 'text-stone-900'}`}>
                  Focus
                </div>
                <div className={`text-xs mt-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                  Spotlight view
                </div>
                <div className={`text-[10px] mt-2 ${isRadar ? 'text-cyan-400/60' : 'text-stone-400'}`}>
                  Press F or 1
                </div>
              </button>

              {/* Speed Read Mode */}
              <button
                onClick={() => onSelectMode('speed')}
                className={`group flex-1 p-4 rounded-xl transition-all ${
                  isRadar
                    ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50'
                    : 'bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  isRadar ? 'bg-cyan-500/20' : 'bg-stone-200'
                }`}>
                  <svg
                    className={`w-6 h-6 ${isRadar ? 'text-cyan-400' : 'text-stone-600'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className={`font-medium ${isRadar ? 'text-white' : 'text-stone-900'}`}>
                  Speed
                </div>
                <div className={`text-xs mt-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                  RSVP reading
                </div>
                <div className={`text-[10px] mt-2 ${isRadar ? 'text-cyan-400/60' : 'text-stone-400'}`}>
                  Press S or 2
                </div>
              </button>
            </div>

            {/* Footer hint */}
            <div className={`text-center mt-4 text-[10px] ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
              Press ESC to cancel
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========== MAIN COMPONENT ==========

/**
 * Unified reading mode launcher that provides a single entry point for all reading modes.
 *
 * Press 'R' to open the launcher, then choose:
 * - Focus (F or 1): Spotlight mode for distraction-free reading
 * - Speed (S or 2): RSVP speed reading mode
 *
 * @example
 * <ReadingModeLauncher text={articleText}>
 *   <article>{articleContent}</article>
 * </ReadingModeLauncher>
 */
export function ReadingModeLauncher({
  children,
  text,
  enableShortcut = true,
  wordsPerMinute = 300,
  onActivate,
  onClose,
}: ReadingModeLauncherProps) {
  const {
    launcherOpen,
    activeMode,
    selectedText,
    closeLauncher,
    selectMode,
    closeReadingMode,
  } = useReadingModeLauncher(enableShortcut);

  // Determine text to use for speed reading
  const speedText = selectedText || text;

  const handleSelectMode = useCallback((mode: ReadingModeType) => {
    selectMode(mode);
    onActivate?.(mode);
  }, [selectMode, onActivate]);

  const handleCloseReadingMode = useCallback(() => {
    closeReadingMode();
    onClose?.();
  }, [closeReadingMode, onClose]);

  return (
    <>
      {/* Launcher modal */}
      <LauncherModal
        open={launcherOpen}
        onClose={closeLauncher}
        onSelectMode={handleSelectMode}
        hasSelectedText={selectedText.length > 0}
      />

      {/* Reading mode */}
      {activeMode === 'spotlight' && (
        <ReadingMode mode="spotlight" enabled={true} onClose={handleCloseReadingMode}>
          {children}
        </ReadingMode>
      )}

      {activeMode === 'speed' && (
        <ReadingMode
          mode="speed"
          enabled={true}
          onClose={handleCloseReadingMode}
          text={speedText}
          wordsPerMinute={wordsPerMinute}
        />
      )}
    </>
  );
}
