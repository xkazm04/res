/**
 * Remotion Entry Point for Server-Side Rendering
 *
 * Registers all video compositions for @remotion/renderer.
 * Each composition accepts inputProps for dynamic content (sceneComposition, videoContent).
 */

import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { RemotionComposition } from '@/src/components/maker/RemotionComposition';
import { TEMPLATE_VIDEO_CONFIGS } from '@/src/components/report/video/configs';
import type { TemplateType, VideoContent } from '@/src/lib/videoShowcaseMockData';
import type { ComposedScene } from '@/src/components/maker/cli/types';
import {
  DIMENSIONS,
  TEMPLATE_TYPES,
  getCompositionId,
} from './Root';
import type { VideoFormat } from './Root';
import './styles.css';

const defaultVideoContent: VideoContent = {
  title: 'Research Video',
  subtitle: '',
  hook: 'Discover the truth',
  verdict: 'Analysis complete',
  verdictType: 'mixed',
  keyNarratives: [],
  warnings: [],
};

/**
 * Wrapper component that bridges Remotion's Record<string, unknown> props
 * to our typed RemotionCompositionProps.
 */
const CompositionEntry: React.FC<Record<string, unknown>> = (props) => (
  <RemotionComposition
    templateType={(props.templateType as TemplateType) || 'investigative'}
    videoContent={(props.videoContent as VideoContent) || defaultVideoContent}
    format={(props.format as VideoFormat) || 'standard'}
    sceneComposition={props.sceneComposition as ComposedScene[] | null | undefined}
  />
);

export const RemotionRoot: React.FC = () => {
  const compositions: React.ReactNode[] = [];

  TEMPLATE_TYPES.forEach((templateType) => {
    const config = TEMPLATE_VIDEO_CONFIGS[templateType];
    if (!config) return;

    const defaultFps = config.fps;
    const defaultTotalFrames = config.totalFrames;

    // Standard 16:9 composition
    compositions.push(
      <Composition
        key={`${templateType}-standard`}
        id={getCompositionId(templateType, 'standard')}
        component={CompositionEntry}
        defaultProps={{
          templateType,
          format: 'standard' as VideoFormat,
          videoContent: defaultVideoContent,
        }}
        calculateMetadata={({ props }) => {
          const scenes = props.sceneComposition as ComposedScene[] | null | undefined;
          if (scenes && scenes.length > 0) {
            const totalSeconds = scenes.reduce((sum: number, s: ComposedScene) => sum + s.durationSeconds, 0);
            return {
              durationInFrames: Math.ceil(totalSeconds * defaultFps),
              fps: defaultFps,
              width: DIMENSIONS.standard.width,
              height: DIMENSIONS.standard.height,
            };
          }
          return {
            durationInFrames: defaultTotalFrames,
            fps: defaultFps,
            width: DIMENSIONS.standard.width,
            height: DIMENSIONS.standard.height,
          };
        }}
        durationInFrames={defaultTotalFrames}
        fps={defaultFps}
        width={DIMENSIONS.standard.width}
        height={DIMENSIONS.standard.height}
      />
    );

    // Mobile 9:16 composition (Shorts)
    compositions.push(
      <Composition
        key={`${templateType}-mobile`}
        id={getCompositionId(templateType, 'mobile')}
        component={CompositionEntry}
        defaultProps={{
          templateType,
          format: 'mobile' as VideoFormat,
          videoContent: defaultVideoContent,
        }}
        calculateMetadata={({ props }) => {
          const scenes = props.sceneComposition as ComposedScene[] | null | undefined;
          if (scenes && scenes.length > 0) {
            const totalSeconds = scenes.reduce((sum: number, s: ComposedScene) => sum + s.durationSeconds, 0);
            return {
              durationInFrames: Math.ceil(totalSeconds * defaultFps),
              fps: defaultFps,
              width: DIMENSIONS.mobile.width,
              height: DIMENSIONS.mobile.height,
            };
          }
          return {
            durationInFrames: defaultTotalFrames,
            fps: defaultFps,
            width: DIMENSIONS.mobile.width,
            height: DIMENSIONS.mobile.height,
          };
        }}
        durationInFrames={defaultTotalFrames}
        fps={defaultFps}
        width={DIMENSIONS.mobile.width}
        height={DIMENSIONS.mobile.height}
      />
    );
  });

  return <>{compositions}</>;
};

registerRoot(RemotionRoot);

export default RemotionRoot;
