'use client';

import { useState, useMemo, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Player, PlayerRef } from '@remotion/player';
import { Eye, EyeOff } from 'lucide-react';
import { RemotionComposition, type VideoFormat } from './RemotionComposition';
import { AspectRatioToggle, type AspectRatio } from './AspectRatioToggle';
import { SafeZoneOverlay } from './SafeZoneOverlay';
import { PlayerControls } from './PlayerControls';
import { ExportPanel } from './ExportPanel';
import { buildVideoContent, buildVideoContentFromDraft, hasSelection } from './utils/buildVideoContent';
import { getTemplateConfig } from '@/src/components/report/video/configs';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';
import type { TemplateType } from '@/src/lib/videoShowcaseMockData';
import type { SessionWithDetails } from '@/src/types/research';
import type { VideoFormat as ExportVideoFormat } from '@/src/types/research';

interface VideoPreviewPanelProps {
  session: SessionWithDetails;
  selectionState?: ContentSelectionState;
}

const VALID_TEMPLATES: TemplateType[] = [
  'investigative', 'financial', 'competitive', 'legal',
  'tech_market', 'contract', 'understanding', 'due_diligence',
];

const DIMENSIONS = {
  shorts: { width: 360, height: 640 },
  standard: { width: 640, height: 360 },
} as const;

export const VideoPreviewPanel = memo(function VideoPreviewPanel({ session, selectionState }: VideoPreviewPanelProps) {
  const playerRef = useRef<PlayerRef>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('shorts');
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const templateType = VALID_TEMPLATES.includes(session.template_type as TemplateType)
    ? (session.template_type as TemplateType)
    : 'investigative';
  const config = getTemplateConfig(templateType);

  // Use draft-aware builder when selection exists, otherwise fall back to default
  const videoContent = useMemo(() => {
    if (selectionState && hasSelection(selectionState)) {
      return buildVideoContentFromDraft(session, selectionState);
    }
    return buildVideoContent(session);
  }, [session, selectionState]);

  const dimensions = DIMENSIONS[aspectRatio];
  const format: VideoFormat = aspectRatio === 'shorts' ? 'mobile' : 'standard';

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pause() : playerRef.current.play();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.pause();
    setIsPlaying(false);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900/20">
      {/* Controls Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-6 py-3 border-b border-slate-800/50"
      >
        <div className="flex items-center gap-3">
          {aspectRatio === 'shorts' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         transition-all duration-200 border
                         ${showSafeZone
                           ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                           : 'text-slate-400 hover:text-white border-slate-700/50 hover:border-slate-600'
                         }`}
            >
              {showSafeZone ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Safe Zone
            </motion.button>
          )}

          {/* Draft indicator */}
          {selectionState && hasSelection(selectionState) && (
            <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
              Using draft selection
            </span>
          )}
        </div>

        <AspectRatioToggle value={aspectRatio} onChange={setAspectRatio} />
      </motion.header>

      {/* Player Area - Centered */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="flex flex-col items-center gap-6"
        >
          {/* Player Container */}
          <div
            ref={playerContainerRef}
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40
                       ring-1 ring-white/5"
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            <Player
              ref={playerRef}
              component={RemotionComposition}
              inputProps={{ templateType, videoContent, format }}
              durationInFrames={config.totalFrames}
              fps={config.fps}
              compositionWidth={dimensions.width}
              compositionHeight={dimensions.height}
              style={{ width: '100%', height: '100%' }}
              controls={false}
            />

            {aspectRatio === 'shorts' && (
              <SafeZoneOverlay visible={showSafeZone} width={dimensions.width} height={dimensions.height} />
            )}

            {/* Template badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md
                            text-[10px] font-semibold text-slate-300 uppercase tracking-wider
                            border border-white/10">
              {templateType.replace('_', ' ')}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-md">
            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              duration={`${config.durationSeconds}s`}
              fps={config.fps}
              sceneCount={config.scenes.length}
            />
          </div>
        </motion.div>
      </div>

      {/* Export Panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="px-6 py-4 border-t border-slate-800/50"
      >
        <div className="max-w-md mx-auto">
          <ExportPanel
            sessionId={session.id}
            templateType={templateType}
            format={(aspectRatio === 'shorts' ? '9:16' : '16:9') as ExportVideoFormat}
            playerRef={playerContainerRef}
            durationInFrames={config.totalFrames}
            fps={config.fps}
          />
        </div>
      </motion.div>
    </div>
  );
});
