'use client';

import { useEffect } from 'react';
import { useVideoPlayback } from './useVideoPlayback';
import {
  getTemplateConfig,
  getSceneProgress,
  getCurrentScene,
  type BaseSceneProps,
  type SceneDefinition,
} from './configs';
import type { TemplateType, VideoContent } from '@/src/lib/videoShowcaseMockData';

// Import all scenes
import {
  HookScene,
  VerdictScene,
  ActorNetworkScene,
  MoneyTrailScene,
  PatternRevealScene,
  BullBearScene,
  RiskMeterScene,
  CompetitiveLandscapeScene,
  BattleMapScene,
  RulingImpactScene,
  AtRiskScene,
  HypeVsRealityScene,
  AdoptionCurveScene,
  PriceComparisonScene,
  ShellCompanyWebScene,
  CorruptionFlagsScene,
  NarrativeComparisonScene,
  CausalChainScene,
  RedFlagCompilationScene,
  LeadershipHistoryScene,
} from './scenes/index';

export type VideoFormat = 'standard' | 'mobile';
export type VideoTheme = 'radar' | 'swiss';

interface TemplateVideoPlayerProps {
  templateType: TemplateType;
  videoContent: VideoContent;
  format: VideoFormat;
  theme: VideoTheme;
  onFrameChange?: (frame: number) => void;
  autoPlay?: boolean;
}

/**
 * Config-driven video player that renders template-specific scenes
 * based on the template configuration.
 */
export function TemplateVideoPlayer({
  templateType,
  videoContent,
  format,
  theme,
  onFrameChange,
  autoPlay = false,
}: TemplateVideoPlayerProps) {
  const config = getTemplateConfig(templateType);
  const isRadar = theme === 'radar';

  const playback = useVideoPlayback({
    fps: config.fps,
    durationInFrames: config.totalFrames,
  });

  // Notify parent of frame changes
  useEffect(() => {
    onFrameChange?.(playback.frame);
  }, [playback.frame, onFrameChange]);

  // Auto-play if requested
  useEffect(() => {
    if (autoPlay && !playback.playing) {
      playback.play();
    }
  }, [autoPlay, playback]);

  // Get current scene
  const currentScene = getCurrentScene(playback.frame, config.scenes);

  // Calculate dimensions based on format - larger for better visuals
  const dimensions = format === 'standard'
    ? { width: 960, height: 540 }  // HD 16:9 - much larger canvas
    : { width: 360, height: 640 }; // 9:16 mobile - larger for clarity

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Video Container */}
      <div
        className={`relative overflow-hidden ${
          isRadar ? 'bg-slate-950' : 'bg-stone-100'
        }`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: format === 'standard' ? 16 : 24,
        }}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: isRadar
              ? `radial-gradient(circle at 50% 50%, ${config.visuals.accentColor}40 0%, transparent 70%)`
              : `radial-gradient(circle at 50% 50%, ${config.visuals.accentColor}20 0%, transparent 70%)`,
          }}
        />

        {/* Scene Renderer */}
        {currentScene && (
          <SceneRenderer
            scene={currentScene}
            frame={playback.frame}
            fps={config.fps}
            isRadar={isRadar}
            format={format}
            videoContent={videoContent}
            templateType={templateType}
            config={config}
          />
        )}

        {/* Progress bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 ${
            isRadar ? 'bg-slate-800' : 'bg-stone-300'
          }`}
        >
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${(playback.frame / config.totalFrames) * 100}%`,
              backgroundColor: config.visuals.accentColor,
            }}
          />
        </div>

        {/* Scene indicator */}
        {currentScene && (
          <div
            className={`
              absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium
              ${isRadar ? 'bg-slate-800/80 text-slate-300' : 'bg-stone-200/80 text-stone-600'}
            `}
          >
            {currentScene.name}
          </div>
        )}

        {/* Frame counter */}
        <div
          className={`
            absolute top-3 right-3 px-2 py-1 rounded text-xs font-mono
            ${isRadar ? 'bg-slate-800/80 text-slate-400' : 'bg-stone-200/80 text-stone-600'}
          `}
        >
          {playback.frame}/{config.totalFrames}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={playback.reset}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reset (R)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={playback.toggle}
          className="p-3 rounded-full text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: config.visuals.accentColor }}
          title="Play/Pause (Space)"
        >
          {playback.playing ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>

        {/* Seek bar */}
        <div className="w-64">
          <input
            type="range"
            min={0}
            max={config.totalFrames}
            value={playback.frame}
            onChange={(e) => playback.seekTo(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: config.visuals.accentColor,
            }}
          />
        </div>

        <span className="text-sm text-slate-400 font-mono w-24">
          {(playback.frame / config.fps).toFixed(1)}s / {config.durationSeconds}s
        </span>
      </div>

      {/* Scene Timeline */}
      <div className="flex gap-1 w-full max-w-[640px]">
        {config.scenes.map((scene) => {
          const isActive = currentScene?.id === scene.id;
          const width = ((scene.endFrame - scene.startFrame) / config.totalFrames) * 100;

          return (
            <button
              key={scene.id}
              onClick={() => playback.seekTo(scene.startFrame)}
              className={`
                h-2 rounded-full transition-all
                ${isActive
                  ? 'opacity-100'
                  : 'opacity-40 hover:opacity-70'
                }
              `}
              style={{
                width: `${width}%`,
                backgroundColor: config.visuals.accentColor,
              }}
              title={scene.name}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Scene Renderer
 * Routes to appropriate scene component based on scene definition
 */
interface SceneRendererProps {
  scene: SceneDefinition;
  frame: number;
  fps: number;
  isRadar: boolean;
  format: VideoFormat;
  videoContent: VideoContent;
  templateType: TemplateType;
  config: ReturnType<typeof getTemplateConfig>;
}

function SceneRenderer({
  scene,
  frame,
  fps,
  isRadar,
  format,
  videoContent,
  templateType,
  config,
}: SceneRendererProps) {
  const { sceneFrame, sceneDuration, sceneProgress } = getSceneProgress(
    frame,
    scene.startFrame,
    scene.endFrame
  );

  const baseProps: BaseSceneProps = {
    frame,
    fps,
    isRadar,
    format,
    sceneFrame,
    sceneDuration,
    sceneProgress,
  };

  // Route to appropriate scene component
  switch (scene.component) {
    // Universal Scenes
    case 'HookScene':
      return (
        <HookScene
          {...baseProps}
          hook={videoContent.hook}
          title={videoContent.title}
          templateType={templateType}
          accentColor={config.visuals.accentColor}
          icon={config.visuals.icon}
        />
      );

    case 'VerdictScene':
      return (
        <VerdictScene
          {...baseProps}
          verdict={videoContent.verdict}
          verdictType={videoContent.verdictType}
          accentColor={config.visuals.accentColor}
          warnings={videoContent.warnings}
          cta={config.hooks.closingPattern}
        />
      );

    // Investigative Scenes
    case 'ActorNetworkScene':
      return (
        <ActorNetworkScene
          {...baseProps}
          actors={videoContent.actors || []}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'MoneyTrailScene':
      return (
        <MoneyTrailScene
          {...baseProps}
          flows={videoContent.moneyFlows || []}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'PatternRevealScene':
      return (
        <PatternRevealScene
          {...baseProps}
          patterns={videoContent.patterns || []}
          accentColor={config.visuals.accentColor}
        />
      );

    // Financial Scenes
    case 'BullBearScene':
      return (
        <BullBearScene
          {...baseProps}
          bullCase={videoContent.bullCase || videoContent.keyNarratives.slice(0, 3)}
          bearCase={videoContent.bearCase || videoContent.warnings}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'RiskMeterScene':
      return (
        <RiskMeterScene
          {...baseProps}
          riskScore={videoContent.riskScore || 50}
          riskFactors={videoContent.riskFactors || []}
          accentColor={config.visuals.accentColor}
        />
      );

    // Competitive Scenes
    case 'CompetitiveLandscapeScene':
      return (
        <CompetitiveLandscapeScene
          {...baseProps}
          competitors={videoContent.competitors || []}
          marketName={videoContent.marketName}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'BattleMapScene':
      return (
        <BattleMapScene
          {...baseProps}
          competitor1={videoContent.competitor1 || { name: 'Company A', scores: {} }}
          competitor2={videoContent.competitor2 || { name: 'Company B', scores: {} }}
          dimensions={videoContent.comparisonDimensions || ['Feature', 'Price', 'Support']}
          accentColor={config.visuals.accentColor}
        />
      );

    // Legal Scenes
    case 'RulingImpactScene':
      return (
        <RulingImpactScene
          {...baseProps}
          ruling={videoContent.ruling || videoContent.keyNarratives[0] || ''}
          impacts={videoContent.impacts || []}
          jurisdiction={videoContent.jurisdiction}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'AtRiskScene':
      return (
        <AtRiskScene
          {...baseProps}
          entities={videoContent.atRiskEntities || []}
          accentColor={config.visuals.accentColor}
        />
      );

    // Tech Market Scenes
    case 'HypeVsRealityScene':
      return (
        <HypeVsRealityScene
          {...baseProps}
          items={videoContent.hypeRealityItems || []}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'AdoptionCurveScene':
      return (
        <AdoptionCurveScene
          {...baseProps}
          technology={videoContent.title}
          currentPosition={videoContent.adoptionPosition || 25}
          phase={videoContent.adoptionPhase || 'early_adopters'}
          growthRate={videoContent.growthRate || 15}
          timeToMainstream={videoContent.timeToMainstream}
          accentColor={config.visuals.accentColor}
        />
      );

    // Contract Scenes
    case 'PriceComparisonScene':
      return (
        <PriceComparisonScene
          {...baseProps}
          items={videoContent.priceItems || []}
          contractName={videoContent.contractName}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'ShellCompanyWebScene':
      return (
        <ShellCompanyWebScene
          {...baseProps}
          entities={videoContent.shellEntities || []}
          connections={videoContent.shellConnections || []}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'CorruptionFlagsScene':
      return (
        <CorruptionFlagsScene
          {...baseProps}
          flags={videoContent.corruptionFlags || videoContent.redFlags || []}
          accentColor={config.visuals.accentColor}
        />
      );

    // Understanding Scenes
    case 'NarrativeComparisonScene':
      return (
        <NarrativeComparisonScene
          {...baseProps}
          officialNarrative={videoContent.officialNarrative || videoContent.keyNarratives}
          realStory={videoContent.realStory || []}
          discrepancies={videoContent.discrepancies}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'CausalChainScene':
      return (
        <CausalChainScene
          {...baseProps}
          events={videoContent.causalEvents || []}
          accentColor={config.visuals.accentColor}
        />
      );

    // Due Diligence Scenes
    case 'RedFlagCompilationScene':
      return (
        <RedFlagCompilationScene
          {...baseProps}
          flags={videoContent.redFlags || []}
          accentColor={config.visuals.accentColor}
        />
      );

    case 'LeadershipHistoryScene':
      return (
        <LeadershipHistoryScene
          {...baseProps}
          leaders={videoContent.leaders || []}
          accentColor={config.visuals.accentColor}
        />
      );

    // Default fallback for unimplemented scenes
    default:
      return (
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
          <div className={`px-3 py-1.5 rounded-lg ${isRadar ? 'bg-slate-800' : 'bg-stone-200'}`}>
            {scene.name}
          </div>
          <p className="mt-2 text-xs opacity-50">{scene.component}</p>
        </div>
      );
  }
}
