'use client';

import { memo } from 'react';
import { spring, easeOutCubic, easeOutQuart, easeInOutCubic } from '../useVideoPlayback';
import { spreadEntrance } from '@/src/lib/animation/motion';
import { AnimatedBarChart, AnimatedLineChart, AnimatedPieChart } from '../AnimatedCharts';
import { SceneHeader, SceneContainer, BackgroundOrb, type SceneProps } from './primitives';

interface ChartsSceneProps extends SceneProps {
  barData: Array<{ label: string; value: number }>;
  lineData: number[];
  pieData: Array<{ label: string; value: number; color: string }>;
}

/**
 * Charts scene with animated bar, line, and pie charts.
 * Adapts layout between mobile (vertical stack) and desktop (horizontal grid).
 */
export const ChartsScene = memo(function ChartsScene({ frame, fps, isRadar, format, barData, lineData, pieData, sceneFrame, sceneDuration }: ChartsSceneProps) {
  const isMobile = format === 'mobile';
  const f = sceneFrame ?? frame;
  const dur = sceneDuration ?? 120;
  const getDelay = spreadEntrance(dur, 4, { startPct: 0.03, endPct: 0.50 });
  const headerProgress = spring({ frame: f, fps, delay: getDelay(0), durationFrames: 18, easing: easeOutCubic });
  const chart1Progress = spring({ frame: f, fps, delay: getDelay(1), durationFrames: 20, easing: easeOutQuart });
  const chart2Progress = spring({ frame: f, fps, delay: getDelay(2), durationFrames: 20, easing: easeOutQuart });
  const chart3Progress = spring({ frame: f, fps, delay: getDelay(3), durationFrames: 20, easing: easeOutQuart });

  // Mobile layout: vertical stack
  if (isMobile) {
    return (
      <SceneContainer isMobile={isMobile}>
        <SceneHeader
          title="Data Analysis"
          frame={frame}
          fps={fps}
          isRadar={isRadar}
          isMobile={isMobile}
          accentGradient="from-blue-400 to-cyan-600"
        />

        {/* Charts - vertical stack for mobile */}
        <div className="space-y-4">
          {/* Bar + Pie row */}
          <div className="flex gap-4">
            <ChartCard
              title="Distribution"
              progress={chart1Progress}
              isRadar={isRadar}
              borderColor="border-cyan-500/15"
              isMobile
            >
              <AnimatedBarChart data={barData} frame={f - 10} fps={fps} width={150} height={100} isRadar={isRadar} />
            </ChartCard>

            <ChartCard
              title="Sources"
              progress={chart3Progress}
              isRadar={isRadar}
              borderColor="border-violet-500/15"
              isMobile
              centered
            >
              <AnimatedPieChart data={pieData} frame={f - 24} fps={fps} size={100} isRadar={isRadar} />
            </ChartCard>
          </div>

          {/* Line chart - full width */}
          <ChartCard
            title="Confidence Trend"
            progress={chart2Progress}
            isRadar={isRadar}
            borderColor="border-emerald-500/15"
            isMobile
          >
            <AnimatedLineChart data={lineData} frame={f - 18} fps={fps} width={340} height={120} isRadar={isRadar} />
          </ChartCard>
        </div>
      </SceneContainer>
    );
  }

  // Standard layout: horizontal grid
  return (
    <SceneContainer isMobile={isMobile}>
      <BackgroundOrb
        position="bottom-left"
        color={isRadar ? 'bg-blue-500/5' : 'bg-stone-400/5'}
        opacity={headerProgress}
      />

      <SceneHeader
        title="Data Analysis"
        frame={frame}
        fps={fps}
        isRadar={isRadar}
        isMobile={isMobile}
        accentGradient="from-blue-400 to-cyan-600"
      />

      <div className="grid grid-cols-3 gap-3" style={{ height: 250 }}>
        {/* Bar Chart */}
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-xl blur-lg ${isRadar ? 'bg-cyan-500/10' : 'bg-blue-500/5'}`}
            style={{ opacity: chart1Progress * 0.3 }}
          />
          <ChartCard
            title="Distribution"
            progress={chart1Progress}
            isRadar={isRadar}
            borderColor="border-cyan-500/15"
            titleColor={isRadar ? 'text-cyan-400/80' : 'text-stone-500'}
            fullHeight
          >
            <AnimatedBarChart data={barData} frame={f - 10} fps={fps} width={245} height={180} isRadar={isRadar} />
          </ChartCard>
        </div>

        {/* Line Chart */}
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-xl blur-lg ${isRadar ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`}
            style={{ opacity: chart2Progress * 0.3 }}
          />
          <ChartCard
            title="Confidence Trend"
            progress={chart2Progress}
            isRadar={isRadar}
            borderColor="border-emerald-500/15"
            titleColor={isRadar ? 'text-emerald-400/80' : 'text-stone-500'}
            fullHeight
          >
            <AnimatedLineChart data={lineData} frame={f - 18} fps={fps} width={245} height={180} isRadar={isRadar} />
          </ChartCard>
        </div>

        {/* Pie Chart */}
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-xl blur-lg ${isRadar ? 'bg-violet-500/10' : 'bg-violet-500/5'}`}
            style={{ opacity: chart3Progress * 0.3 }}
          />
          <ChartCard
            title="Source Mix"
            progress={chart3Progress}
            isRadar={isRadar}
            borderColor="border-violet-500/15"
            titleColor={isRadar ? 'text-violet-400/80' : 'text-stone-500'}
            fullHeight
            centered
          >
            <AnimatedPieChart data={pieData} frame={f - 26} fps={fps} size={140} isRadar={isRadar} />
          </ChartCard>
        </div>
      </div>
    </SceneContainer>
  );
});

interface ChartCardProps {
  title: string;
  progress: number;
  isRadar: boolean;
  borderColor: string;
  titleColor?: string;
  isMobile?: boolean;
  fullHeight?: boolean;
  centered?: boolean;
  children: React.ReactNode;
}

function ChartCard({
  title,
  progress,
  isRadar,
  borderColor,
  titleColor,
  isMobile = false,
  fullHeight = false,
  centered = false,
  children,
}: ChartCardProps) {
  const titleClass = titleColor || (isRadar ? 'text-cyan-400/80' : 'text-stone-500');

  return (
    <div
      className={`
        ${fullHeight ? 'relative h-full' : 'flex-1'}
        p-3 rounded-xl backdrop-blur-sm
        ${isRadar ? 'bg-slate-900/70' : 'bg-white/90'}
        border ${isRadar ? borderColor : 'border-stone-200'}
        ${centered ? 'flex flex-col items-center' : ''}
      `}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 10}px)${fullHeight ? ` scale(${0.96 + progress * 0.04})` : ''}`,
      }}
    >
      <div className={`${isMobile ? 'text-xs' : 'text-[13px]'} font-medium mb-2 ${centered ? 'self-start' : ''} ${titleClass}`}>
        {title}
      </div>
      {centered && !isMobile ? (
        <div className="flex-1 flex items-center justify-center">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
