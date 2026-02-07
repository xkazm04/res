/**
 * Remotion Entry Point for Lambda Rendering
 *
 * This file registers all video compositions for Remotion Lambda.
 * Deploy with: npx remotion lambda sites create src/remotion/entry.tsx --site-name=res-video
 */

import React from 'react';
import { Composition } from 'remotion';
import { RemotionComposition } from '@/src/components/maker/RemotionComposition';
import { TEMPLATE_VIDEO_CONFIGS } from '@/src/components/report/video/configs';
import type { TemplateType, VideoContent } from '@/src/lib/videoShowcaseMockData';
import {
  DIMENSIONS,
  TEMPLATE_TYPES,
  getCompositionId,
} from './Root';

/**
 * Default video content for when content isn't provided
 */
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
 * Root component registering all compositions
 */
export const RemotionRoot: React.FC = () => {
  const compositions: React.ReactNode[] = [];

  TEMPLATE_TYPES.forEach((templateType) => {
    const config = TEMPLATE_VIDEO_CONFIGS[templateType];
    if (!config) return;

    // Standard 16:9 composition
    compositions.push(
      <Composition
        key={`${templateType}-standard`}
        id={getCompositionId(templateType, 'standard')}
        component={() => (
          <RemotionComposition
            templateType={templateType}
            format="standard"
            videoContent={defaultVideoContent}
          />
        )}
        durationInFrames={config.totalFrames}
        fps={config.fps}
        width={DIMENSIONS.standard.width}
        height={DIMENSIONS.standard.height}
      />
    );

    // Mobile 9:16 composition (Shorts)
    compositions.push(
      <Composition
        key={`${templateType}-mobile`}
        id={getCompositionId(templateType, 'mobile')}
        component={() => (
          <RemotionComposition
            templateType={templateType}
            format="mobile"
            videoContent={defaultVideoContent}
          />
        )}
        durationInFrames={config.totalFrames}
        fps={config.fps}
        width={DIMENSIONS.mobile.width}
        height={DIMENSIONS.mobile.height}
      />
    );
  });

  return <>{compositions}</>;
};

export default RemotionRoot;
