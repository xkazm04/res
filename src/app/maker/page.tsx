'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Loader2, Layers, Play, Sparkles } from 'lucide-react';
import { useAppStore } from '@/src/stores/appStore';
import { useContentSelection } from '@/src/components/report/video/useContentSelection';
import { useVideoDrafts } from '@/src/hooks/useVideoDrafts';
import { SessionBrowser } from '@/src/components/maker/SessionBrowser';
import { ContentSelectionArea } from '@/src/components/maker/ContentSelectionArea';
import { VideoPreviewPanel } from '@/src/components/maker/VideoPreviewPanel';

type CenterTab = 'compose' | 'preview';

const TAB_CONFIG: { key: CenterTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'compose', label: 'Compose', Icon: Layers },
  { key: 'preview', label: 'Preview', Icon: Play },
];

const ease = [0.25, 0.1, 0.25, 1] as const;

const contentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.2, ease },
  }),
};

export default function MakerPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CenterTab>('compose');
  const [direction, setDirection] = useState(0);
  const { fetchSession, currentSession, currentSessionLoading } = useAppStore();

  // Lift selection state to page level so both tabs share it
  const selectionState = useContentSelection(currentSession);
  const draftState = useVideoDrafts(selectedSessionId, selectionState);

  useEffect(() => {
    if (selectedSessionId) fetchSession(selectedSessionId);
  }, [selectedSessionId, fetchSession]);

  const handleTabChange = useCallback((tab: CenterTab) => {
    setDirection(tab === 'preview' ? 1 : -1);
    setActiveTab(tab);
  }, []);

  return (
    <div className="h-screen flex bg-slate-950">
      {/* Sidebar - Session Browser */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-800/60 overflow-hidden flex flex-col bg-slate-900/40">
        <SessionBrowser
          onSelectSession={(id) => setSelectedSessionId(id || null)}
          selectedId={selectedSessionId}
        />
      </aside>

      {/* Main Center Area */}
      {currentSessionLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Loading session...</p>
          </motion.div>
        </div>
      ) : currentSession && selectedSessionId ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative">
            {/* Compose / Preview toggle — top-right of content area */}
            <div className="absolute top-3 right-4 z-20 flex items-center gap-1 p-1 bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-700/40">
              {TAB_CONFIG.map(tab => {
                const isActive = activeTab === tab.key;
                const TabIcon = tab.Icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`
                      relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="makerTabIndicator"
                        className="absolute inset-0 bg-slate-700/80 rounded-lg border border-slate-600/40"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <TabIcon className="w-3.5 h-3.5" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              {activeTab === 'compose' ? (
                <motion.div
                  key="compose"
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 overflow-auto"
                >
                  <ContentSelectionArea
                    session={currentSession}
                    selectionState={selectionState}
                    draftState={draftState}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 overflow-hidden"
                >
                  <VideoPreviewPanel
                    session={currentSession}
                    selectionState={selectionState}
                    sceneComposition={draftState.sceneComposition}
                    keywords={draftState.keywords}
                    preGeneratedAudio={draftState.audioData}
                    preGeneratedAudioDuration={draftState.audioDuration}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="text-center max-w-xs"
      >
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10
                          border border-slate-700/50 flex items-center justify-center">
            <Film className="w-7 h-7 text-slate-500" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border border-slate-700/60
                        flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
          </motion.div>
        </div>
        <h2 className="text-base font-semibold text-white">Select a session</h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Choose a research session from the sidebar to start composing your video
        </p>
      </motion.div>
    </div>
  );
}
