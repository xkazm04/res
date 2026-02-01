'use client';

import { useMemo, useState } from 'react';
import type { SessionWithDetails } from '@/src/types/research';
import { useReportTheme } from '../core/ThemeContext';
import { useVideoPlayback, spring, easeOutCubic } from './useVideoPlayback';
import { TitleScene, MetricsScene, ChartsScene, InsightsScene, SummaryScene } from './scenes/index';
import { VideoControls } from './VideoControls';
import type { VideoOverviewContent } from './contentTransformer';

// Video format types
export type VideoFormat = 'standard' | 'mobile';

interface VideoOverviewProps {
  session: SessionWithDetails;
  stats: {
    findings: number;
    sources: number;
    perspectives: number;
    avgConfidence: number;
    highConfidence: number;
    redFlags: number;
    gaps: number;
  };
  /** Optional override for video content (from ContentSelector) */
  contentOverride?: VideoOverviewContent;
}

// Format configurations
const FORMAT_CONFIG = {
  standard: {
    width: 640,
    height: 360,
    aspectRatio: '16/9',
    label: 'YouTube',
    icon: '📺',
  },
  mobile: {
    width: 270,
    height: 480,
    aspectRatio: '9/16',
    label: 'Shorts',
    icon: '📱',
  },
};

// Scene timeline (in frames at 30fps) - Optimized for viral content
const SCENE_CONFIG = {
  fps: 30,
  scenes: [
    { name: 'Title', start: 0, end: 65 },       // 0-2.2s - Hook immediately
    { name: 'Metrics', start: 50, end: 140 },   // 1.7-4.7s - Key numbers
    { name: 'Charts', start: 125, end: 255 },   // 4.2-8.5s - Data visualization
    { name: 'Insights', start: 240, end: 360 }, // 8-12s - Value delivery
    { name: 'Summary', start: 345, end: 450 },  // 11.5-15s - Memorable close
  ],
  totalFrames: 450, // 15 seconds
};

export function VideoOverview({ session, stats, contentOverride }: VideoOverviewProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  const [format, setFormat] = useState<VideoFormat>('standard');
  const playback = useVideoPlayback({ fps: SCENE_CONFIG.fps, durationInFrames: SCENE_CONFIG.totalFrames });
  const { frame } = playback;
  const fps = SCENE_CONFIG.fps;
  const formatConfig = FORMAT_CONFIG[format];

  // Use content override stats if provided, otherwise use props stats
  const effectiveStats = contentOverride?.stats || stats;

  // Prepare chart data (memoized) - use override if provided
  const chartData = useMemo(() => {
    if (contentOverride?.chartData) {
      return contentOverride.chartData;
    }

    const findingCounts: Record<string, number> = {};
    session.findings?.forEach(f => { findingCounts[f.finding_type] = (findingCounts[f.finding_type] || 0) + 1; });

    const sourceCounts: Record<string, number> = {};
    session.sources?.forEach(s => { sourceCounts[s.source_type || 'web'] = (sourceCounts[s.source_type || 'web'] || 0) + 1; });
    const pieColors = ['#ef4444', '#f59e0b', '#22d3ee', '#a78bfa', '#34d399'];

    return {
      barData: Object.entries(findingCounts).slice(0, 5).map(([label, value]) => ({ label: label.slice(0, 4), value })),
      lineData: session.findings?.slice(0, 10).map(f => (f.confidence_score || 0.5) * 100) || [50],
      pieData: Object.entries(sourceCounts).slice(0, 4).map(([label, value], i) => ({ label, value, color: pieColors[i] })),
    };
  }, [session.findings, session.sources, contentOverride?.chartData]);

  // Extract insights - use override if provided
  const contentData = useMemo(() => {
    if (contentOverride?.contentData) {
      return contentOverride.contentData;
    }

    const insights: string[] = [];
    const warnings: string[] = [];
    session.perspectives?.forEach(p => {
      p.key_insights?.slice(0, 2).forEach(i => insights.push(i));
      p.warnings?.slice(0, 1).forEach(w => warnings.push(w));
    });
    return { insights: insights.slice(0, 3), warnings: warnings.slice(0, 2) };
  }, [session.perspectives, contentOverride?.contentData]);

  // Build metrics - use curated override if provided
  const metrics = useMemo(() => {
    if (contentOverride?.metrics && contentOverride.metrics.length >= 4) {
      return contentOverride.metrics.slice(0, 4);
    }
    return [
      { label: 'Findings', value: effectiveStats.findings, color: 'cyan' },
      { label: 'Sources', value: effectiveStats.sources, color: 'emerald' },
      { label: 'Confidence', value: effectiveStats.avgConfidence, suffix: '%', color: 'amber' },
      { label: 'Alerts', value: effectiveStats.redFlags + effectiveStats.gaps, color: 'rose' },
    ];
  }, [contentOverride?.metrics, effectiveStats]);

  // Calculate scene visibilities with smooth crossfade
  const getSceneOpacity = (sceneStart: number, sceneEnd: number, fadeFrames: number = 16) => {
    if (frame < sceneStart) return 0;
    if (frame > sceneEnd) return 0;

    const fadeInEnd = sceneStart + fadeFrames;
    if (frame < fadeInEnd) {
      return spring({ frame: frame - sceneStart, fps, delay: 0, durationFrames: fadeFrames, easing: easeOutCubic });
    }

    const fadeOutStart = sceneEnd - fadeFrames;
    if (frame > fadeOutStart) {
      return 1 - spring({ frame: frame - fadeOutStart, fps, delay: 0, durationFrames: fadeFrames, easing: easeOutCubic });
    }

    return 1;
  };

  // Ambient animation
  const ambientPulse = Math.sin((frame / fps) * Math.PI * 0.3) * 0.5 + 0.5;

  // Determine template category for news style
  const templateType = session.template_type || 'analysis';
  const isUrgent = ['investigative', 'due_diligence', 'legal'].includes(templateType);

  // News ticker text based on template type
  const tickerText = useMemo(() => {
    const base = session.query?.slice(0, 40) || 'Analysis Report';
    const extras = [
      `${effectiveStats.findings} findings verified`,
      `${effectiveStats.sources} sources analyzed`,
      `${effectiveStats.avgConfidence}% confidence`,
      effectiveStats.redFlags > 0 ? `${effectiveStats.redFlags} red flags detected` : null,
    ].filter(Boolean);
    return `${base} • ${extras.join(' • ')}`;
  }, [session.query, effectiveStats]);

  // Ticker animation
  const tickerOffset = (frame / fps) * 50; // pixels per second

  return (
    <div className="space-y-4">
      {/* Format Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(Object.keys(FORMAT_CONFIG) as VideoFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                format === f
                  ? isRadar
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-stone-800 text-white'
                  : isRadar
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <span>{FORMAT_CONFIG[f].icon}</span>
              <span>{FORMAT_CONFIG[f].label}</span>
            </button>
          ))}
        </div>
        <div className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
          {formatConfig.width}×{formatConfig.height}
        </div>
      </div>

      {/* Video Container */}
      <div
        className="flex justify-center"
        style={{ minHeight: format === 'mobile' ? 520 : 400 }}
      >
        <div
          className={`relative overflow-hidden ${isRadar ? 'bg-slate-950' : 'bg-stone-100'} ${format === 'standard' ? 'rounded-2xl' : 'rounded-3xl'}`}
          style={{
            width: formatConfig.width,
            height: formatConfig.height,
            aspectRatio: formatConfig.aspectRatio,
          }}
        >
          {/* Breaking News Banner (for urgent content) */}
          {isUrgent && (
            <div
              className="absolute top-0 left-0 right-0 z-20 overflow-hidden"
              style={{ opacity: frame < 30 ? spring({ frame, fps, delay: 5, durationFrames: 15, easing: easeOutCubic }) : 1 }}
            >
              <div className={`py-1 text-center text-[10px] font-bold uppercase tracking-wider ${
                isRadar ? 'bg-red-600 text-white' : 'bg-red-600 text-white'
              }`}>
                <span className="animate-pulse mr-2">●</span>
                Breaking Analysis
                <span className="animate-pulse ml-2">●</span>
              </div>
            </div>
          )}

          {/* Ambient background */}
          <div
            className={`absolute inset-0 pointer-events-none ${isRadar ? 'bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20' : 'bg-gradient-to-br from-stone-200/30 via-transparent to-stone-300/30'}`}
            style={{ opacity: 0.5 + ambientPulse * 0.2 }}
          />

          {/* Noise texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            }}
          />

          {/* Scene container */}
          <div className="absolute inset-0">
            {/* Title Scene */}
            <div className="absolute inset-0" style={{ opacity: getSceneOpacity(0, 65) }}>
              <TitleScene
                frame={frame}
                fps={fps}
                isRadar={isRadar}
                format={format}
                title={session.query?.slice(0, format === 'mobile' ? 40 : 55) || 'Research Report'}
                subtitle={session.template_type?.replace(/_/g, ' ').toUpperCase() || 'ANALYSIS'}
                date={new Date(session.created_at || Date.now()).toLocaleDateString()}
              />
            </div>

            {/* Metrics Scene */}
            <div className="absolute inset-0" style={{ opacity: getSceneOpacity(50, 140) }}>
              <MetricsScene frame={frame - 50} fps={fps} isRadar={isRadar} format={format} metrics={metrics} />
            </div>

            {/* Charts Scene */}
            <div className="absolute inset-0" style={{ opacity: getSceneOpacity(125, 255) }}>
              <ChartsScene frame={frame - 125} fps={fps} isRadar={isRadar} format={format} {...chartData} />
            </div>

            {/* Insights Scene */}
            <div className="absolute inset-0" style={{ opacity: getSceneOpacity(240, 360) }}>
              <InsightsScene frame={frame - 240} fps={fps} isRadar={isRadar} format={format} {...contentData} />
            </div>

            {/* Summary Scene */}
            <div className="absolute inset-0" style={{ opacity: getSceneOpacity(345, 450) }}>
              <SummaryScene
                frame={frame - 345}
                fps={fps}
                isRadar={isRadar}
                format={format}
                confidence={effectiveStats.avgConfidence}
                findings={effectiveStats.findings}
                sources={effectiveStats.sources}
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${isUrgent ? '' : ''} ${isRadar ? 'bg-slate-900' : 'bg-stone-300'}`} style={{ top: isUrgent ? 20 : 0 }}>
            <div
              className={`h-full ${isRadar ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-stone-600 to-stone-500'}`}
              style={{ width: `${playback.progress * 100}%`, transition: 'width 33ms linear' }}
            />
            <div
              className={`absolute top-0 h-1 blur-sm ${isRadar ? 'bg-cyan-400' : 'bg-stone-500'}`}
              style={{ width: `${playback.progress * 100}%`, opacity: 0.5 }}
            />
          </div>

          {/* News Ticker - Bottom crawl for standard format */}
          {format === 'standard' && frame > 30 && (
            <div
              className={`absolute left-0 right-0 overflow-hidden ${isRadar ? 'bg-slate-900/90' : 'bg-stone-800/90'}`}
              style={{
                bottom: 52,
                opacity: spring({ frame: frame - 30, fps, delay: 0, durationFrames: 15, easing: easeOutCubic }),
              }}
            >
              <div className="flex items-center h-6">
                <div className={`px-2 py-1 text-[9px] font-bold uppercase ${isRadar ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`}>
                  Live
                </div>
                <div className="flex-1 overflow-hidden">
                  <div
                    className={`whitespace-nowrap text-[10px] font-medium ${isRadar ? 'text-cyan-300' : 'text-white'}`}
                    style={{ transform: `translateX(${300 - tickerOffset % 600}px)` }}
                  >
                    {tickerText} • {tickerText}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Watermark */}
          <div
            className={`absolute ${format === 'mobile' ? 'top-6 right-2' : 'top-2 right-3'} flex items-center gap-1 px-2 py-0.5 rounded ${isRadar ? 'bg-slate-900/60' : 'bg-white/60'}`}
            style={{ opacity: frame > 15 ? 0.7 : 0 }}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isRadar ? 'bg-cyan-400' : 'bg-stone-600'}`} />
            <span className={`text-[8px] font-bold tracking-wider uppercase ${isRadar ? 'text-cyan-400' : 'text-stone-600'}`}>
              Research
            </span>
          </div>

          {/* Controls */}
          <VideoControls playback={playback} isRadar={isRadar} format={format} />
        </div>
      </div>
    </div>
  );
}
