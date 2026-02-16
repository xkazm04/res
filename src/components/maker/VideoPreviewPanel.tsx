'use client';

import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, PlayerRef } from '@remotion/player';
import {
  Eye, EyeOff, ChevronDown, ChevronUp, Volume2, VolumeX,
  Loader2, Play, Pause, X, RotateCcw, Hash, Smartphone,
} from 'lucide-react';
import { RemotionComposition, type VideoFormat } from './RemotionComposition';
import { AspectRatioToggle, type AspectRatio } from './AspectRatioToggle';
import { SafeZoneOverlay } from './SafeZoneOverlay';
import { PlayerControls } from './PlayerControls';
import { ExportPanel } from './ExportPanel';
import { buildVideoContent, buildVideoContentFromDraft, hasSelection } from './utils/buildVideoContent';
import { getTemplateConfig } from '@/src/components/report/video/configs';
import { compositionTotalFrames, compositionDurationSeconds } from './compositionUtils';
import { getCompositionId } from '@/src/remotion/Root';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';
import type { TemplateType } from '@/src/lib/videoShowcaseMockData';
import type { SessionWithDetails, ComposedScene } from '@/src/types/research';
import type { VideoFormat as ExportVideoFormat } from '@/src/types/research';

interface VideoPreviewPanelProps {
  session: SessionWithDetails;
  selectionState?: ContentSelectionState;
  sceneComposition?: ComposedScene[] | null;
  keywords?: string[];
  preGeneratedAudio?: string | null;
  preGeneratedAudioDuration?: number | null;
}

const VALID_TEMPLATES: TemplateType[] = [
  'investigative', 'financial', 'competitive', 'legal',
  'tech_market', 'contract', 'understanding', 'due_diligence',
];

const DIMENSIONS = {
  shorts: { width: 540, height: 960 },
  standard: { width: 960, height: 540 },
} as const;

export const VideoPreviewPanel = memo(function VideoPreviewPanel({
  session, selectionState, sceneComposition, keywords = [],
  preGeneratedAudio, preGeneratedAudioDuration,
}: VideoPreviewPanelProps) {
  const playerRef = useRef<PlayerRef>(null);
  const fullscreenPlayerRef = useRef<PlayerRef>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('standard');
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [narrationOpen, setNarrationOpen] = useState(false);
  const [audioStatus, setAudioStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsIsPlaying, setFsIsPlaying] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [mpIsPlaying, setMpIsPlaying] = useState(false);
  const mobilePlayerRef = useRef<PlayerRef>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const hasComposition = sceneComposition && sceneComposition.length > 0;

  // Extract narration texts from composition
  const narrationTexts = useMemo(() => {
    if (!hasComposition) return [];
    return sceneComposition
      .filter(s => s.narration)
      .map(s => ({ sceneId: s.sceneId, component: s.component, narration: s.narration! }));
  }, [sceneComposition, hasComposition]);

  const hasNarration = narrationTexts.length > 0;

  // Concatenate all narrations with pauses for TTS
  const fullNarrationText = useMemo(() => {
    return narrationTexts.map(n => n.narration).join(' ... ');
  }, [narrationTexts]);

  // --- Audio narration helpers ---

  const handleGenerateAudio = useCallback(async () => {
    if (!fullNarrationText) return;
    setAudioStatus('generating');
    try {
      const res = await fetch('/api/audio/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullNarrationText }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const data = await res.json();
      const audio = new Audio(data.audioData);
      audio.addEventListener('ended', () => {
        setIsAudioPlaying(false);
      });
      audioRef.current = audio;
      setAudioStatus('ready');
    } catch {
      setAudioStatus('error');
    }
  }, [fullNarrationText]);

  const toggleAudioPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      audio.play();
      setIsAudioPlaying(true);
    }
  }, [isAudioPlaying]);

  // Sync audio with video: play/pause
  const syncAudioPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioStatus !== 'ready') return;
    audio.play();
    setIsAudioPlaying(true);
  }, [audioStatus]);

  const syncAudioPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsAudioPlaying(false);
  }, []);

  const syncAudioReset = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
    setIsAudioPlaying(true);
  }, []);

  // Auto-load pre-generated audio from compose pipeline
  useEffect(() => {
    if (!preGeneratedAudio) return;
    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(preGeneratedAudio);
    audio.addEventListener('ended', () => {
      setIsAudioPlaying(false);
    });
    audioRef.current = audio;
    setAudioStatus('ready');
  }, [preGeneratedAudio]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const dimensions = DIMENSIONS[aspectRatio];
  const format: VideoFormat = aspectRatio === 'shorts' ? 'mobile' : 'standard';

  // Dynamic frame count and duration based on composition
  const totalFrames = hasComposition
    ? compositionTotalFrames(sceneComposition, config.fps)
    : config.totalFrames;
  const durationSeconds = hasComposition
    ? compositionDurationSeconds(sceneComposition)
    : config.durationSeconds;
  const sceneCount = hasComposition
    ? sceneComposition.length
    : config.scenes.length;

  // --- Main player controls ---

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
      syncAudioPause();
    } else {
      playerRef.current.play();
      if (audioStatus === 'ready') syncAudioPlay();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioStatus, syncAudioPlay, syncAudioPause]);

  const handleReset = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);
    if (audioStatus === 'ready') syncAudioReset();
  }, [audioStatus, syncAudioReset]);

  // --- Fullscreen modal ---

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setFsIsPlaying(false);
    // Pause main player when opening fullscreen
    if (playerRef.current && isPlaying) {
      playerRef.current.pause();
      syncAudioPause();
      setIsPlaying(false);
    }
  }, [isPlaying, syncAudioPause]);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (fullscreenPlayerRef.current) {
      fullscreenPlayerRef.current.pause();
    }
    syncAudioPause();
    setFsIsPlaying(false);
  }, [syncAudioPause]);

  const fsPlayPause = useCallback(() => {
    if (!fullscreenPlayerRef.current) return;
    if (fsIsPlaying) {
      fullscreenPlayerRef.current.pause();
      syncAudioPause();
    } else {
      fullscreenPlayerRef.current.play();
      if (audioStatus === 'ready') syncAudioPlay();
    }
    setFsIsPlaying(!fsIsPlaying);
  }, [fsIsPlaying, audioStatus, syncAudioPlay, syncAudioPause]);

  const fsReset = useCallback(() => {
    if (!fullscreenPlayerRef.current) return;
    fullscreenPlayerRef.current.seekTo(0);
    fullscreenPlayerRef.current.play();
    setFsIsPlaying(true);
    if (audioStatus === 'ready') syncAudioReset();
  }, [audioStatus, syncAudioReset]);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFullscreen();
      if (e.key === ' ') { e.preventDefault(); fsPlayPause(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, closeFullscreen, fsPlayPause]);

  // --- Mobile preview modal ---

  const openMobilePreview = useCallback(() => {
    setIsMobilePreview(true);
    setMpIsPlaying(false);
    if (playerRef.current && isPlaying) {
      playerRef.current.pause();
      syncAudioPause();
      setIsPlaying(false);
    }
  }, [isPlaying, syncAudioPause]);

  const closeMobilePreview = useCallback(() => {
    setIsMobilePreview(false);
    if (mobilePlayerRef.current) {
      mobilePlayerRef.current.pause();
    }
    syncAudioPause();
    setMpIsPlaying(false);
  }, [syncAudioPause]);

  const mpPlayPause = useCallback(() => {
    if (!mobilePlayerRef.current) return;
    if (mpIsPlaying) {
      mobilePlayerRef.current.pause();
      syncAudioPause();
    } else {
      mobilePlayerRef.current.play();
      if (audioStatus === 'ready') syncAudioPlay();
    }
    setMpIsPlaying(!mpIsPlaying);
  }, [mpIsPlaying, audioStatus, syncAudioPlay, syncAudioPause]);

  const mpReset = useCallback(() => {
    if (!mobilePlayerRef.current) return;
    mobilePlayerRef.current.seekTo(0);
    mobilePlayerRef.current.play();
    setMpIsPlaying(true);
    if (audioStatus === 'ready') syncAudioReset();
  }, [audioStatus, syncAudioReset]);

  useEffect(() => {
    if (!isMobilePreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobilePreview();
      if (e.key === ' ') { e.preventDefault(); mpPlayPause(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobilePreview, closeMobilePreview, mpPlayPause]);

  // Mobile preview dimensions: portrait 540x960 scaled for visibility
  const mpScale = 0.8; // 540 × 0.8 = 432px wide — reasonable phone sim

  // Fullscreen scale: fit the video as large as possible within the viewport
  const fsScale = 1.5; // 960 × 1.5 = 1440px wide — fits most monitors

  const inputProps = useMemo(() => ({
    templateType,
    videoContent,
    format,
    sceneComposition: sceneComposition || undefined,
  }), [templateType, videoContent, format, sceneComposition]);

  return (
    <div className="h-full overflow-y-auto bg-slate-900/20">
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
      <div className="flex items-center justify-center p-8">
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
              inputProps={inputProps}
              durationInFrames={totalFrames}
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
              onFullscreen={openFullscreen}
              onMobilePreview={openMobilePreview}
              duration={`${durationSeconds}s`}
              fps={config.fps}
              sceneCount={sceneCount}
            />
          </div>
        </motion.div>
      </div>

      {/* Narration Panel */}
      {hasNarration && (
        <div className="px-6 border-t border-slate-800/50">
          <button
            onClick={() => setNarrationOpen(!narrationOpen)}
            className="w-full flex items-center justify-between py-3 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Narration ({narrationTexts.length} scenes)
              {audioStatus === 'ready' && (
                <span className="ml-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Audio ready
                </span>
              )}
            </span>
            {narrationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <AnimatePresence>
            {narrationOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-3 space-y-2 max-h-40 overflow-y-auto">
                  {narrationTexts.map(n => (
                    <div key={n.sceneId} className="text-[11px] text-slate-400 leading-relaxed">
                      <span className="text-cyan-400/70 font-medium">{n.component}:</span>{' '}
                      {n.narration}
                    </div>
                  ))}
                </div>

                {/* Audio controls row */}
                <div className="mb-3 flex items-center gap-2">
                  {/* Generate button */}
                  <button
                    onClick={handleGenerateAudio}
                    disabled={audioStatus === 'generating'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                               bg-cyan-500/10 text-cyan-400 border border-cyan-500/30
                               hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                  >
                    {audioStatus === 'generating' ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                    ) : audioStatus === 'ready' ? (
                      <><Volume2 className="w-3.5 h-3.5" /> Regenerate</>
                    ) : (
                      <><Volume2 className="w-3.5 h-3.5" /> Generate Audio</>
                    )}
                  </button>

                  {/* Play/Pause audio standalone */}
                  {audioStatus === 'ready' && (
                    <button
                      onClick={toggleAudioPlayback}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                  border transition-colors ${
                                    isAudioPlaying
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                      : 'bg-slate-700/40 text-slate-300 border-slate-600/40 hover:bg-slate-700/60'
                                  }`}
                    >
                      {isAudioPlaying ? (
                        <><VolumeX className="w-3.5 h-3.5" /> Pause Audio</>
                      ) : (
                        <><Play className="w-3 h-3" /> Play Audio</>
                      )}
                    </button>
                  )}
                </div>

                {audioStatus === 'error' && (
                  <p className="text-[10px] text-red-400 mb-2">Failed to generate audio. Check ElevenLabs config.</p>
                )}

                {audioStatus === 'ready' && (
                  <p className="text-[10px] text-slate-500 mb-2">
                    {preGeneratedAudioDuration
                      ? `Audio: ${preGeneratedAudioDuration.toFixed(1)}s — syncs automatically with video.`
                      : 'Audio syncs automatically with video playback.'}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Keywords / Hashtags */}
      {keywords.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-800/50">
          <div className="flex items-center gap-2 flex-wrap">
            <Hash className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            {keywords.map((kw) => (
              <span
                key={kw}
                className="text-[11px] font-medium text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded-md
                           border border-cyan-500/20 select-all cursor-text"
              >
                #{kw.replace(/^#/, '')}
              </span>
            ))}
          </div>
        </div>
      )}

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
            sessionTitle={session.title}
            templateType={templateType}
            format={(aspectRatio === 'shorts' ? '9:16' : '16:9') as ExportVideoFormat}
            compositionId={getCompositionId(templateType, format === 'mobile' ? 'mobile' : 'standard')}
            inputProps={inputProps}
            audioData={preGeneratedAudio}
            keywords={keywords}
          />
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeFullscreen(); }}
          >
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-6 right-6 z-10 p-2.5 rounded-xl
                         bg-white/10 text-white/70 hover:text-white hover:bg-white/20
                         transition-colors backdrop-blur-sm"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Fullscreen player + controls */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="flex flex-col items-center gap-8"
            >
              {/* Large video player */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10"
                style={{
                  width: Math.round(dimensions.width * fsScale),
                  height: Math.round(dimensions.height * fsScale),
                }}
              >
                <Player
                  ref={fullscreenPlayerRef}
                  component={RemotionComposition}
                  inputProps={inputProps}
                  durationInFrames={totalFrames}
                  fps={config.fps}
                  compositionWidth={dimensions.width}
                  compositionHeight={dimensions.height}
                  style={{ width: '100%', height: '100%' }}
                  controls={false}
                />
              </div>

              {/* Fullscreen controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={fsReset}
                  className="p-3 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20
                             transition-colors backdrop-blur-sm"
                  title="Restart"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={fsPlayPause}
                  className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600
                             text-white shadow-lg shadow-cyan-500/30
                             hover:from-cyan-400 hover:to-cyan-500
                             transition-all duration-200"
                  title={fsIsPlaying ? 'Pause' : 'Play'}
                >
                  {fsIsPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                {audioStatus === 'ready' && (
                  <button
                    onClick={toggleAudioPlayback}
                    className={`p-3 rounded-xl backdrop-blur-sm transition-colors ${
                      isAudioPlaying
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                    }`}
                    title={isAudioPlaying ? 'Mute narration' : 'Play narration'}
                  >
                    {isAudioPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* Info bar */}
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="font-medium text-white/60">{durationSeconds}s</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{sceneCount} scenes</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Press Space to play/pause, Esc to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Preview Modal */}
      <AnimatePresence>
        {isMobilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeMobilePreview(); }}
          >
            {/* Close button */}
            <button
              onClick={closeMobilePreview}
              className="absolute top-6 right-6 z-10 p-2.5 rounded-xl
                         bg-white/10 text-white/70 hover:text-white hover:bg-white/20
                         transition-colors backdrop-blur-sm"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Label */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/50 font-medium">Mobile Preview (9:16)</span>
            </div>

            {/* Mobile player + controls */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="flex flex-col items-center gap-6"
            >
              {/* Phone-style frame */}
              <div
                className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-black/60
                           ring-1 ring-white/10 bg-black"
                style={{
                  width: Math.round(DIMENSIONS.shorts.width * mpScale) + 16,
                  height: Math.round(DIMENSIONS.shorts.height * mpScale) + 16,
                  padding: 8,
                }}
              >
                <div
                  className="relative rounded-[1.5rem] overflow-hidden"
                  style={{
                    width: Math.round(DIMENSIONS.shorts.width * mpScale),
                    height: Math.round(DIMENSIONS.shorts.height * mpScale),
                  }}
                >
                  <Player
                    ref={mobilePlayerRef}
                    component={RemotionComposition}
                    inputProps={{
                      ...inputProps,
                      format: 'mobile' as VideoFormat,
                    }}
                    durationInFrames={totalFrames}
                    fps={config.fps}
                    compositionWidth={DIMENSIONS.shorts.width}
                    compositionHeight={DIMENSIONS.shorts.height}
                    style={{ width: '100%', height: '100%' }}
                    controls={false}
                  />
                </div>
              </div>

              {/* Mobile preview controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={mpReset}
                  className="p-3 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20
                             transition-colors backdrop-blur-sm"
                  title="Restart"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={mpPlayPause}
                  className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600
                             text-white shadow-lg shadow-cyan-500/30
                             hover:from-cyan-400 hover:to-cyan-500
                             transition-all duration-200"
                  title={mpIsPlaying ? 'Pause' : 'Play'}
                >
                  {mpIsPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                {audioStatus === 'ready' && (
                  <button
                    onClick={toggleAudioPlayback}
                    className={`p-3 rounded-xl backdrop-blur-sm transition-colors ${
                      isAudioPlaying
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                    }`}
                    title={isAudioPlaying ? 'Mute narration' : 'Play narration'}
                  >
                    {isAudioPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* Info bar */}
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="font-medium text-white/60">{durationSeconds}s</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{sceneCount} scenes</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Space to play/pause, Esc to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
