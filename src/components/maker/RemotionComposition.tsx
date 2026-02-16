'use client';

import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import {
  getTemplateConfig,
  getSceneProgress,
  getCurrentScene,
  type BaseSceneProps,
} from '@/src/components/report/video/configs';
import type { TemplateType, VideoContent } from '@/src/lib/videoShowcaseMockData';
import type { ComposedScene } from './cli/types';
import { renderScene, renderComposedScene } from './sceneRegistry';
import { compositionToSceneDefinitions } from './compositionUtils';
import { PACING_CONFIG } from './cli/sceneCatalog';
import { VideoAtmosphere } from '@/src/components/report/video/primitives/VideoAtmosphere';
import { SceneTransition } from '@/src/components/report/video/primitives/SceneTransition';
import { NarrationSubtitle } from '@/src/components/report/video/primitives/NarrationSubtitle';

export type VideoFormat = 'standard' | 'mobile';

export interface RemotionCompositionProps {
  templateType: TemplateType;
  videoContent: VideoContent;
  format: VideoFormat;
  sceneComposition?: ComposedScene[] | null;
}

/**
 * Remotion Composition Component
 *
 * Dual-mode rendering:
 * - When sceneComposition is provided: uses AI-composed scene sequence with per-scene data
 * - When null/empty: falls back to static template config with global VideoContent
 */
export function RemotionComposition({
  templateType,
  videoContent,
  format,
  sceneComposition,
}: RemotionCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const config = getTemplateConfig(templateType);

  const useComposition = sceneComposition && sceneComposition.length > 0;

  // Determine scenes based on mode
  const scenes = useComposition
    ? compositionToSceneDefinitions(sceneComposition, fps)
    : config.scenes;

  const currentScene = getCurrentScene(frame, scenes);

  // Build base props for scene rendering
  const baseProps: BaseSceneProps | null = currentScene
    ? {
        frame,
        fps,
        isRadar: true,
        format,
        ...getSceneProgress(frame, currentScene.startFrame, currentScene.endFrame),
      }
    : null;

  // Find the composed scene data for the current scene (composition mode only)
  const currentComposedScene = useComposition && currentScene
    ? sceneComposition.find(s => s.sceneId === currentScene.id)
    : null;

  // Scene index for zoom drift alternation
  const sceneIndex = currentScene
    ? scenes.indexOf(currentScene)
    : 0;

  // Resolve per-scene styling from composed scene (defaults for fallback path)
  const sceneMood = currentComposedScene?.mood ?? 'neutral';
  const sceneEnter = currentComposedScene?.transition?.enter ?? 'flash-cut';
  const sceneExit = currentComposedScene?.transition?.exit ?? 'fade';
  const pacingCfg = PACING_CONFIG[currentComposedScene?.pacing ?? 'normal'];

  return (
    <AbsoluteFill className="bg-slate-950">
      {/* Animated atmosphere background */}
      <VideoAtmosphere
        frame={frame}
        fps={fps}
        accentColor={config.visuals.accentColor}
        width={width}
        height={height}
        mood={sceneMood}
      />

      {/* Scene content with enter/exit transitions */}
      {currentScene && baseProps && (
        <>
          <SceneTransition
            frame={baseProps.sceneFrame}
            fps={fps}
            sceneDuration={baseProps.sceneDuration}
            enterType={sceneEnter}
            exitType={sceneExit}
            enterFrames={pacingCfg.enterFrames}
            exitFrames={pacingCfg.exitFrames}
            sceneIndex={sceneIndex}
          >
            {currentComposedScene
              ? renderComposedScene(currentComposedScene, baseProps, config.visuals.accentColor)
              : renderScene(currentScene.component, {
                  baseProps,
                  videoContent,
                  templateType,
                  accentColor: config.visuals.accentColor,
                  config: {
                    visuals: { icon: config.visuals.icon },
                    hooks: { closingPattern: config.hooks.closingPattern },
                  },
                })}
          </SceneTransition>

          {/* Narration burn-in subtitles (composition mode only) */}
          {currentComposedScene?.narration && baseProps && (
            <NarrationSubtitle
              text={currentComposedScene.narration}
              sceneFrame={baseProps.sceneFrame}
              sceneDuration={baseProps.sceneDuration}
              fps={fps}
              accentColor={config.visuals.accentColor}
              wordTimestamps={currentComposedScene.narrationTimestamps}
            />
          )}
        </>
      )}
    </AbsoluteFill>
  );
}
