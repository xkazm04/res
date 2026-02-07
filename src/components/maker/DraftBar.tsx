'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import type { VideoDraftState } from '@/src/hooks/useVideoDrafts';

interface DraftBarProps {
  draftState: VideoDraftState;
}

export const DraftBar = memo(function DraftBar({ draftState }: DraftBarProps) {
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
    </motion.div>
  );
});
