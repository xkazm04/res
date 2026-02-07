'use client';

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Globe, Wand2 } from 'lucide-react';
import { ContentSelector } from '@/src/components/report/video/ContentSelector';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';
import type { SessionWithDetails } from '@/src/types/research';
import type { VideoDraftState } from '@/src/hooks/useVideoDrafts';
import { SelectionSummary } from './SelectionSummary';
import { DraftBar } from './DraftBar';
import { MakerTerminal } from './cli/MakerTerminal';
import { useAICompose } from './cli/useAICompose';

interface ContentSelectionAreaProps {
  session: SessionWithDetails;
  selectionState: ContentSelectionState;
  draftState: VideoDraftState;
}

const ease = [0.25, 0.1, 0.25, 1] as const;

export const ContentSelectionArea = memo(function ContentSelectionArea({
  session,
  selectionState,
  draftState,
}: ContentSelectionAreaProps) {
  const aiCompose = useAICompose({ session, selectionState });

  // Wrap handleResult to auto-save draft after AI compose
  const handleResultWithAutoSave = useCallback((result: Parameters<typeof aiCompose.handleResult>[0]) => {
    aiCompose.handleResult(result);
    // Auto-save after a tick so selection state is updated
    setTimeout(() => draftState.autoSave(), 100);
  }, [aiCompose, draftState]);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Draft Bar */}
      <DraftBar draftState={draftState} />

      {/* AI Compose Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={aiCompose.startCompose}
          disabled={aiCompose.isComposing}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all
            ${aiCompose.isComposing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg hover:shadow-violet-500/10'
            }
            bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white
            border border-violet-400/30
          `}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {aiCompose.isComposing ? 'Composing...' : 'AI Compose'}
        </motion.button>

        {/* Option toggles */}
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={aiCompose.composeOptions.enableResearch || false}
            onChange={(e) => aiCompose.setComposeOptions(prev => ({ ...prev, enableResearch: e.target.checked }))}
            className="w-3 h-3 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0"
          />
          <Globe className="w-3 h-3 group-hover:text-slate-300 transition-colors" />
          <span className="group-hover:text-slate-300 transition-colors">Web Research</span>
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={aiCompose.composeOptions.enableRewriting || false}
            onChange={(e) => aiCompose.setComposeOptions(prev => ({ ...prev, enableRewriting: e.target.checked }))}
            className="w-3 h-3 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0"
          />
          <Wand2 className="w-3 h-3 group-hover:text-slate-300 transition-colors" />
          <span className="group-hover:text-slate-300 transition-colors">Optimize Copy</span>
        </label>

        {aiCompose.lastError && (
          <span className="text-[11px] text-red-400 ml-auto">
            {aiCompose.lastError}
          </span>
        )}
      </motion.div>

      {/* Main content area - split when terminal is open */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Content Selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          layout
          className={`overflow-auto transition-all ${
            aiCompose.isTerminalOpen ? 'w-1/2' : 'w-full'
          }`}
        >
          <ContentSelector
            selectionState={selectionState}
            onRecreate={() => {}}
            isRadar={true}
            showCurationOption={false}
          />
        </motion.div>

        {/* AI Terminal Panel */}
        <AnimatePresence>
          {aiCompose.isTerminalOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '50%' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden flex-shrink-0"
            >
              <MakerTerminal
                isOpen={true}
                projectPath={aiCompose.projectPath}
                prompt={aiCompose.prompt}
                onResult={handleResultWithAutoSave}
                onClose={aiCompose.closeTerminal}
                onError={aiCompose.handleError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary Panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mt-6 pt-6 border-t border-slate-800/50"
      >
        <SelectionSummary
          selectionState={selectionState}
          mode={draftState.mode}
        />
      </motion.div>
    </div>
  );
});
