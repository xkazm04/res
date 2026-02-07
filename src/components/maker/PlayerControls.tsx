'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  duration: string;
  fps: number;
  sceneCount: number;
}

export const PlayerControls = memo(function PlayerControls({
  isPlaying,
  onPlayPause,
  onReset,
  duration,
  fps,
  sceneCount,
}: PlayerControlsProps) {
  return (
    <div className="space-y-4">
      {/* Control buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Reset */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={onReset}
          className="p-2.5 rounded-xl bg-slate-800/60 text-slate-400
                     hover:text-white hover:bg-slate-700/60
                     transition-colors border border-slate-700/40"
          title="Reset to start"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={onPlayPause}
          className="relative p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600
                     text-white shadow-lg shadow-cyan-500/25
                     hover:from-cyan-400 hover:to-cyan-500 hover:shadow-cyan-500/40
                     transition-all duration-200"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.span
                key="pause"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Pause className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="play"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Play className="w-5 h-5 ml-0.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Fullscreen (placeholder) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="p-2.5 rounded-xl bg-slate-800/60 text-slate-500
                     border border-slate-700/40 cursor-not-allowed opacity-50"
          title="Fullscreen (coming soon)"
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Video info */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <span className="font-medium text-slate-400">{duration}</span>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <span>{fps} fps</span>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <span>{sceneCount} scenes</span>
      </div>
    </div>
  );
});
