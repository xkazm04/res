'use client';

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const aiCompose = useAICompose({
    session,
    selectionState,
    onComposition: draftState.setSceneComposition,
    onKeywords: draftState.setKeywords,
    onAudio: draftState.setAudio,
  });

  // Wrap handleResult to auto-save draft after AI compose
  const handleResultWithAutoSave = useCallback((result: Parameters<typeof aiCompose.handleResult>[0]) => {
    aiCompose.handleResult(result);
    // Auto-save after a tick so selection state is updated
    setTimeout(() => draftState.autoSave(), 100);
  }, [aiCompose, draftState]);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Draft Bar + Compose Buttons */}
      <DraftBar
        draftState={draftState}
        onShorts={aiCompose.startCompose}
        onFull={aiCompose.startCompose}
        isComposing={aiCompose.isComposing}
        lastError={aiCompose.lastError}
      />

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
