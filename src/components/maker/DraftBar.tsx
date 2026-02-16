'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, Sparkles, Film } from 'lucide-react';
import type { VideoDraftState } from '@/src/hooks/useVideoDrafts';

interface DraftBarProps {
  draftState: VideoDraftState;
  onShorts?: () => void;
  onFull?: () => void;
  isComposing?: boolean;
  lastError?: string | null;
}

export const DraftBar = memo(function DraftBar({
  draftState,
  onShorts,
  onFull,
  isComposing = false,
  lastError,
}: DraftBarProps) {
  const { mode, hasDraft, isSaving } = draftState;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 mb-3 px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-700/40"
    >
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 rounded-lg border border-slate-700/30">
        <button
          onClick={draftState.switchToOriginal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'original'
              ? 'bg-slate-700/80 text-white border border-slate-600/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <FileText className="w-3 h-3" />
          Original
        </button>

        <button
          onClick={draftState.switchToDraft}
          disabled={!hasDraft}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'draft'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-sm'
              : hasDraft
                ? 'text-slate-400 hover:text-slate-300'
                : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Draft
        </button>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 text-[11px] text-cyan-400"
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </motion.div>
      )}

      {/* Draft version info */}
      {hasDraft && !isSaving && (
        <span className="text-[11px] text-slate-500">
          v{draftState.draft!.version}
        </span>
      )}

      {/* Compose Buttons — pushed right */}
      <div className="flex items-center gap-2 ml-auto">
        {lastError && (
          <span className="text-[11px] text-red-400 max-w-[200px] truncate">
            {lastError}
          </span>
        )}

        {onShorts && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onShorts}
            disabled={isComposing}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${isComposing
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg hover:shadow-violet-500/10'
              }
              bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white
              border border-violet-400/30
            `}
          >
            <Sparkles className="w-3 h-3" />
            {isComposing ? 'Composing...' : 'Shorts'}
          </motion.button>
        )}

        {onFull && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFull}
            disabled={isComposing}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${isComposing
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg hover:shadow-cyan-500/10'
              }
              bg-gradient-to-r from-cyan-500/80 to-teal-500/80 text-white
              border border-cyan-400/30
            `}
          >
            <Film className="w-3 h-3" />
            Full
          </motion.button>
        )}
      </div>
    </motion.div>
  );
});
