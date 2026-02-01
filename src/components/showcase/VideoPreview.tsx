'use client';

import { useEffect } from 'react';
import { VideoShowcaseMock, TEMPLATE_META } from '@/src/lib/videoShowcaseMockData';
import { TemplateVideoPlayer } from '@/src/components/report/video/TemplateVideoPlayer';
import type { VideoFormat, VideoTheme } from './ShowcaseLayout';

interface VideoPreviewProps {
  mock: VideoShowcaseMock | undefined;
  format: VideoFormat;
  theme: VideoTheme;
  onFrameChange?: (frame: number) => void;
}

export function VideoPreview({ mock, format, theme, onFrameChange }: VideoPreviewProps) {
  // Keyboard controls for playback are now handled in TemplateVideoPlayer

  if (!mock) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-500">No mock data available</p>
      </div>
    );
  }

  const meta = TEMPLATE_META[mock.templateType];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Template Info */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{meta.icon}</span>
        <div>
          <h2 className="font-semibold text-white">{meta.name}</h2>
          <p className="text-xs text-slate-400">{mock.templateType}</p>
        </div>
      </div>

      {/* Video Player */}
      <TemplateVideoPlayer
        templateType={mock.templateType}
        videoContent={mock.videoContent}
        format={format}
        theme={theme}
        onFrameChange={onFrameChange}
      />

      {/* Query Display */}
      <div className="max-w-lg text-center">
        <p className="text-xs text-slate-500 mb-1">Research Query</p>
        <p className="text-sm text-slate-400">{mock.query}</p>
      </div>
    </div>
  );
}
