'use client';

import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import {
  getTemplateConfig,
  getSceneProgress,
  getCurrentScene,
  type BaseSceneProps,
} from '@/src/components/report/video/configs';
import type { TemplateType, VideoContent } from '@/src/lib/videoShowcaseMockData';
import { renderScene } from './sceneRegistry';

export type VideoFormat = 'standard' | 'mobile';

interface RemotionCompositionProps {
  templateType: TemplateType;
  videoContent: VideoContent;
  format: VideoFormat;
}

/**
 * Remotion Composition Component
 *
 * Main composition that renders video scenes using Remotion's frame system.
 * Delegates scene rendering to the scene registry for cleaner separation.
 */
export function RemotionComposition({
  templateType,
  videoContent,
  format,
}: RemotionCompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = getTemplateConfig(templateType);
  const currentScene = getCurrentScene(frame, config.scenes);

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

  return (
    <AbsoluteFill className="bg-slate-950">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${config.visuals.accentColor}40 0%, transparent 70%)`,
        }}
      />

      {/* Scene content */}
      {currentScene && baseProps && (
        renderScene(currentScene.component, {
          baseProps,
          videoContent,
          templateType,
          accentColor: config.visuals.accentColor,
          config: {
            visuals: { icon: config.visuals.icon },
            hooks: { closingPattern: config.hooks.closingPattern },
          },
        })
      )}
    </AbsoluteFill>
  );
}
