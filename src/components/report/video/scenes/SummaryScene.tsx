'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { spreadEntrance } from '@/src/lib/animation/motion';
import { AnimatedCounter } from '../AnimatedCharts';
import { pulse, type SceneProps } from './primitives';

interface SummarySceneProps extends SceneProps {
  confidence: number;
  findings: number;
  sources: number;
}

/**
 * Summary scene with dramatic confidence display and completion badge.
 */
export function SummaryScene({ frame, fps, isRadar, format, confidence, findings, sources, sceneFrame, sceneDuration }: SummarySceneProps) {
  const isMobile = format === 'mobile';
  const f = sceneFrame ?? frame;
  const dur = sceneDuration ?? 120;
  const getDelay = spreadEntrance(dur, 5, { startPct: 0.02, endPct: 0.55 });

  // Animation timings
  const bgProgress = spring({ frame: f, fps, delay: getDelay(0), durationFrames: 28, easing: easeOutCubic });
  const mainProgress = spring({ frame: f, fps, delay: getDelay(1), durationFrames: 26, easing: easeOutExpo });
  const ringProgress = spring({ frame: f, fps, delay: getDelay(1), durationFrames: 32, easing: easeOutCubic });
  const statsProgress = spring({ frame: f, fps, delay: getDelay(3), durationFrames: 22, easing: easeOutCubic });
  const badgeProgress = spring({ frame: f, fps, delay: getDelay(4), durationFrames: 20, easing: easeOutQuart });
  const breathe = pulse(f, fps, 0.5);

  const confidenceColor = confidence >= 80
    ? (isRadar ? 'text-emerald-400' : 'text-emerald-600')
    : confidence >= 60
      ? (isRadar ? 'text-cyan-400' : 'text-blue-600')
      : (isRadar ? 'text-amber-400' : 'text-amber-600');

  return (
    <div className={`absolute inset-0 flex flex-col items-center overflow-hidden ${isMobile ? 'justify-start pt-12' : 'justify-center'}`}>
      {/* Radial gradient background */}
      <div
        className={`absolute ${isMobile ? 'w-80 h-80' : 'w-[550px] h-[550px]'} rounded-full ${isRadar ? 'bg-gradient-radial from-cyan-500/15 via-transparent to-transparent' : 'bg-gradient-radial from-stone-400/10 via-transparent to-transparent'}`}
        style={{ opacity: bgProgress }}
      />

      {/* Animated rings */}
      <div
        className={`absolute ${isMobile ? 'w-44 h-44' : 'w-56 h-56'} rounded-full border-2 ${isRadar ? 'border-cyan-500/20' : 'border-stone-400/20'}`}
        style={{ opacity: ringProgress * 0.5, transform: `scale(${0.6 + ringProgress * 0.5 * breathe})` }}
      />
      <div
        className={`absolute ${isMobile ? 'w-64 h-64' : 'w-72 h-72'} rounded-full border ${isRadar ? 'border-cyan-500/10' : 'border-stone-400/10'}`}
        style={{ opacity: ringProgress * 0.3, transform: `scale(${0.5 + ringProgress * 0.6 * breathe})` }}
      />

      {/* Main confidence display */}
      <div className="relative" style={{ opacity: mainProgress, transform: `scale(${0.5 + mainProgress * 0.5})` }}>
        <div
          className={`absolute inset-0 blur-2xl ${confidence >= 80 ? (isRadar ? 'bg-emerald-500/30' : 'bg-emerald-500/20') : (isRadar ? 'bg-cyan-500/30' : 'bg-blue-500/20')}`}
          style={{ transform: `scale(${1.4 * breathe})` }}
        />
        <div className="relative text-center">
          <div className={`${isMobile ? 'text-6xl' : 'text-7xl'} font-bold tabular-nums ${confidenceColor}`}>
            <AnimatedCounter value={confidence} frame={f} fps={fps} delay={getDelay(2)} suffix="%" />
          </div>
          <div className={`${isMobile ? 'text-base' : 'text-lg'} mt-1 font-medium ${isRadar ? 'text-white/90' : 'text-stone-700'}`}>
            Overall Confidence
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className={`flex ${isMobile ? 'gap-5 mt-8' : 'gap-8 mt-10'}`}
        style={{ opacity: statsProgress, transform: `translateY(${(1 - statsProgress) * 10}px)` }}
      >
        <StatCard
          value={findings}
          label="Findings"
          frame={f}
          fps={fps}
          delay={getDelay(3) + 4}
          isRadar={isRadar}
          isMobile={isMobile}
          color={isRadar ? 'text-cyan-400' : 'text-blue-600'}
        />
        <StatCard
          value={sources}
          label="Sources"
          frame={f}
          fps={fps}
          delay={getDelay(3) + 8}
          isRadar={isRadar}
          isMobile={isMobile}
          color={isRadar ? 'text-emerald-400' : 'text-emerald-600'}
        />
      </div>

      {/* Completion badge */}
      <div
        className={`${isMobile ? 'mt-5 px-4 py-2' : 'mt-6 px-5 py-2.5'} rounded-full shadow-lg ${
          isRadar ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-gradient-to-r from-emerald-100 to-cyan-100 border border-emerald-300 text-emerald-700'
        }`}
        style={{ opacity: badgeProgress, transform: `scale(${0.88 + badgeProgress * 0.12})` }}
      >
        <div className="flex items-center gap-2">
          <div className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} rounded-full flex items-center justify-center ${isRadar ? 'bg-emerald-500/30' : 'bg-emerald-500/20'}`}>
            <svg className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>Analysis Complete</span>
        </div>
      </div>

      {/* Mobile: CTA at bottom */}
      {isMobile && (
        <div
          className="absolute bottom-16 left-4 right-4 text-center"
          style={{ opacity: badgeProgress }}
        >
          <p className={`text-[13px] ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            Follow for more insights
          </p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  frame: number;
  fps: number;
  delay: number;
  isRadar: boolean;
  isMobile: boolean;
  color: string;
}

function StatCard({ value, label, frame, fps, delay, isRadar, isMobile, color }: StatCardProps) {
  return (
    <div className={`text-center ${isMobile ? 'px-4 py-2' : 'px-5 py-2.5'} rounded-xl ${isRadar ? 'bg-slate-800/60 border border-slate-700' : 'bg-white/80 border border-stone-200'}`}>
      <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tabular-nums ${color}`}>
        <AnimatedCounter value={value} frame={frame} fps={fps} delay={delay} />
      </div>
      <div className={`text-[13px] mt-0.5 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>{label}</div>
    </div>
  );
}
