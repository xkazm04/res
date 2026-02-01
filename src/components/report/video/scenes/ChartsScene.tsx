'use client';

import { memo } from 'react';
import { spring, easeOutCubic, easeOutQuart, easeInOutCubic } from '../useVideoPlayback';
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
export const ChartsScene = memo(function ChartsScene({ frame, fps, isRadar, format, barData, lineData, pieData }: ChartsSceneProps) {
  const isMobile = format === 'mobile';
  const headerProgress = spring({ frame, fps, delay: 0, durationFrames: 18, easing: easeOutCubic });
  const chart1Progress = spring({ frame, fps, delay: 6, durationFrames: 20, easing: easeOutQuart });
  const chart2Progress = spring({ frame, fps, delay: 12, durationFrames: 20, easing: easeOutQuart });
  const chart3Progress = spring({ frame, fps, delay: 18, durationFrames: 20, easing: easeOutQuart });

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
        <div className="space-y-3">
          {/* Bar + Pie row */}
          <div className="flex gap-3">
            <ChartCard
              title="Distribution"
              progress={chart1Progress}
              isRadar={isRadar}
              borderColor="border-cyan-500/15"
              isMobile
            >
              <AnimatedBarChart data={barData} frame={frame - 10} fps={fps} width={100} height={70} isRadar={isRadar} />
            </ChartCard>

            <ChartCard
              title="Sources"
              progress={chart3Progress}
              isRadar={isRadar}
              borderColor="border-violet-500/15"
              isMobile
              centered
            >
              <AnimatedPieChart data={pieData} frame={frame - 24} fps={fps} size={70} isRadar={isRadar} />
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
            <AnimatedLineChart data={lineData} frame={frame - 18} fps={fps} width={230} height={80} isRadar={isRadar} />
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

      <div className="grid grid-cols-3 gap-3" style={{ height: 170 }}>
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
            <AnimatedBarChart data={barData} frame={frame - 10} fps={fps} width={165} height={120} isRadar={isRadar} />
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
            <AnimatedLineChart data={lineData} frame={frame - 18} fps={fps} width={165} height={120} isRadar={isRadar} />
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
            <AnimatedPieChart data={pieData} frame={frame - 26} fps={fps} size={100} isRadar={isRadar} />
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
      <div className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-medium mb-2 ${centered ? 'self-start' : ''} ${titleClass}`}>
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
