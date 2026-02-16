'use client';

import { spring, easeOutCubic, easeOutQuart, easeInOutCubic } from '../useVideoPlayback';
import { spreadEntrance } from '@/src/lib/animation/motion';
import { SceneHeader, SceneContainer, BackgroundOrb, type SceneProps } from './primitives';

interface InsightsSceneProps extends SceneProps {
  insights: string[];
  warnings: string[];
}

/**
 * Insights scene displaying key findings and alerts in a two-column layout.
 */
export function InsightsScene({ frame, fps, isRadar, format, insights, warnings, sceneFrame, sceneDuration }: InsightsSceneProps) {
  const isMobile = format === 'mobile';
  const f = sceneFrame ?? frame;
  const dur = sceneDuration ?? 120;
  const getDelay = spreadEntrance(dur, 3, { startPct: 0.03, endPct: 0.45 });
  const headerProgress = spring({ frame: f, fps, delay: getDelay(0), durationFrames: 18, easing: easeOutCubic });
  const col1Progress = spring({ frame: f, fps, delay: getDelay(1), durationFrames: 20, easing: easeOutQuart });
  const col2Progress = spring({ frame: f, fps, delay: getDelay(2), durationFrames: 20, easing: easeOutQuart });

  // Mobile: vertical stack
  if (isMobile) {
    return (
      <SceneContainer isMobile={isMobile}>
        <BackgroundOrb
          position="center"
          color={isRadar ? 'bg-emerald-500/5' : 'bg-emerald-400/5'}
          size="sm"
          opacity={headerProgress}
        />

        <SceneHeader
          title="Key Findings"
          frame={frame}
          fps={fps}
          isRadar={isRadar}
          isMobile={isMobile}
          accentGradient="from-emerald-400 to-emerald-600"
        />

        {/* Vertical stack for mobile */}
        <div className="space-y-4">
          {/* Insights */}
          <InsightColumn
            title="Insights"
            icon="💡"
            items={insights.slice(0, 2)}
            type="insight"
            progress={col1Progress}
            isRadar={isRadar}
            isMobile
            frame={f}
            fps={fps}
            baseIndex={0}
            sceneDuration={dur}
            totalItems={insights.length + warnings.length}
          />

          {/* Warnings */}
          <InsightColumn
            title="Alerts"
            icon="⚠️"
            items={warnings.slice(0, 2)}
            type="warning"
            progress={col2Progress}
            isRadar={isRadar}
            isMobile
            frame={f}
            fps={fps}
            baseIndex={insights.length}
            sceneDuration={dur}
            totalItems={insights.length + warnings.length}
          />
        </div>
      </SceneContainer>
    );
  }

  // Standard: two columns
  return (
    <SceneContainer isMobile={isMobile}>
      <BackgroundOrb
        position="top-left"
        color={isRadar ? 'bg-emerald-500/5' : 'bg-emerald-400/5'}
        size="md"
        opacity={headerProgress}
      />
      <BackgroundOrb
        position="top-right"
        color={isRadar ? 'bg-amber-500/5' : 'bg-amber-400/5'}
        size="md"
        opacity={headerProgress}
      />

      <SceneHeader
        title="Key Findings"
        frame={frame}
        fps={fps}
        isRadar={isRadar}
        isMobile={isMobile}
        accentGradient="from-emerald-400 to-emerald-600"
      />

      <div className="grid grid-cols-2 gap-5">
        <InsightColumn
          title="Insights"
          icon="💡"
          items={insights.slice(0, 3)}
          type="insight"
          progress={col1Progress}
          isRadar={isRadar}
          frame={f}
          fps={fps}
          baseIndex={0}
          transformDir="left"
          sceneDuration={dur}
          totalItems={insights.length + warnings.length}
        />

        <InsightColumn
          title="Alerts"
          icon="⚠️"
          items={warnings.slice(0, 2)}
          type="warning"
          progress={col2Progress}
          isRadar={isRadar}
          frame={f}
          fps={fps}
          baseIndex={insights.length}
          transformDir="right"
          sceneDuration={dur}
          totalItems={insights.length + warnings.length}
        />
      </div>
    </SceneContainer>
  );
}

interface InsightColumnProps {
  title: string;
  icon: string;
  items: string[];
  type: 'insight' | 'warning';
  progress: number;
  isRadar: boolean;
  isMobile?: boolean;
  frame: number;
  fps: number;
  baseIndex: number;
  transformDir?: 'left' | 'right';
  sceneDuration: number;
  totalItems: number;
}

function InsightColumn({
  title,
  icon,
  items,
  type,
  progress,
  isRadar,
  isMobile = false,
  frame,
  fps,
  baseIndex,
  transformDir,
  sceneDuration,
  totalItems,
}: InsightColumnProps) {
  const isInsight = type === 'insight';
  const bgColor = isInsight
    ? isRadar ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50/50 border-emerald-200'
    : isRadar ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50/50 border-amber-200';
  const titleColor = isInsight
    ? isRadar ? 'text-emerald-400' : 'text-emerald-600'
    : isRadar ? 'text-amber-400' : 'text-amber-600';

  const transform = transformDir === 'left'
    ? `translateX(${(1 - progress) * -12}px)`
    : transformDir === 'right'
    ? `translateX(${(1 - progress) * 12}px)`
    : `translateY(${(1 - progress) * 10}px)`;

  return (
    <div
      className={`p-4 rounded-xl border ${bgColor}`}
      style={{ opacity: progress, transform }}
    >
      <div className={`${isMobile ? 'text-xs' : 'text-[13px]'} uppercase tracking-wider font-semibold mb-${isMobile ? '2' : '3'} flex items-center gap-1.5 ${titleColor}`}>
        <span>{icon}</span> {title}
      </div>
      <div className="space-y-3">
        {items.map((text, i) => (
          <InsightItem
            key={i}
            text={text}
            type={type}
            index={baseIndex + i}
            frame={frame}
            fps={fps}
            isRadar={isRadar}
            isMobile={isMobile}
            sceneDuration={sceneDuration}
            totalItems={totalItems}
          />
        ))}
        {items.length === 0 && (
          <p className={`text-sm italic ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            No {type === 'insight' ? 'insights available' : 'alerts'}
          </p>
        )}
      </div>
    </div>
  );
}

interface InsightItemProps {
  text: string;
  type: 'insight' | 'warning';
  index: number;
  frame: number;
  fps: number;
  isRadar: boolean;
  isMobile: boolean;
  sceneDuration: number;
  totalItems: number;
}

function InsightItem({ text, type, index, frame, fps, isRadar, isMobile, sceneDuration, totalItems }: InsightItemProps) {
  const getDelay = spreadEntrance(sceneDuration, totalItems, { startPct: 0.15, endPct: 0.65 });
  const progress = spring({ frame, fps, delay: getDelay(index), durationFrames: 22, easing: easeOutCubic });

  const isInsight = type === 'insight';
  const textColor = isInsight
    ? isRadar ? 'text-emerald-200' : 'text-emerald-800'
    : isRadar ? 'text-amber-200' : 'text-amber-800';
  const dotColor = isInsight
    ? isRadar ? 'bg-emerald-400' : 'bg-emerald-500'
    : isRadar ? 'bg-amber-400' : 'bg-amber-500';

  const maxLen = isMobile ? 60 : 85;

  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg ${isRadar ? 'bg-slate-900/30' : 'bg-white/60'}`}
      style={{ opacity: progress, transform: `translateY(${(1 - progress) * 8}px)` }}
    >
      <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <p className={`text-sm leading-relaxed ${textColor}`}>
        {text.slice(0, maxLen)}{text.length > maxLen ? '...' : ''}
      </p>
    </div>
  );
}
