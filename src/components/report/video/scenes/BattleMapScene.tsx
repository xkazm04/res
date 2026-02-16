'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';
import { ComparisonBars, type ComparisonItem } from '../primitives';
import { CompetitiveIcon, TrendUpIcon, TrendDownIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface BattleMapSceneProps extends BaseSceneProps {
  competitor1: { name: string; scores: Record<string, number> };
  competitor2: { name: string; scores: Record<string, number> };
  dimensions: string[];
  accentColor: string;
}

/**
 * Head-to-head battle comparison between two competitors.
 * Used in Competitive template.
 */
export function BattleMapScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  competitor1,
  competitor2,
  dimensions,
  accentColor,
}: BattleMapSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 20, easing: easeOutCubic });
  const vsProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 24, easing: easeOutQuart });
  const barsProgress = spring({ frame: sceneFrame, fps, delay: 15, durationFrames: 28, easing: easeOutCubic });

  // Build comparison items
  const comparisonItems: ComparisonItem[] = dimensions.slice(0, isMobile ? 4 : 5).map(dim => {
    const score1 = competitor1.scores[dim] || 50;
    const score2 = competitor2.scores[dim] || 50;

    return {
      label: dim.length > 14 ? dim.slice(0, 12) + '...' : dim,
      leftValue: score1,
      rightValue: score2,
      highlight: score1 > score2 ? 'left' : score2 > score1 ? 'right' : 'none',
    };
  });

  // Calculate winner
  const score1Total = Object.values(competitor1.scores).reduce((a, b) => a + b, 0);
  const score2Total = Object.values(competitor2.scores).reduce((a, b) => a + b, 0);
  const winner = score1Total > score2Total ? competitor1.name : score2Total > score1Total ? competitor2.name : 'Tie';
  const winMargin = Math.abs(score1Total - score2Total);

  return (
    <div className={`absolute inset-0 flex flex-col ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>
      {/* Header */}
      <div
        className="mb-4"
        style={{
          opacity: headerProgress,
          transform: `translateX(${(1 - headerProgress) * -20}px)`,
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <div
            className={`flex items-center justify-center rounded-lg ${
              isRadar ? 'bg-purple-500/20' : 'bg-purple-100'
            }`}
            style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64 }}
          >
            <CompetitiveIcon size={isMobile ? 28 : 34} color="#a855f7" />
          </div>
          <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
            Head to Head
          </h2>
        </div>
      </div>

      {/* VS Header - larger and more prominent */}
      <div
        className={`
          flex items-center justify-between gap-4 mb-4 p-4 rounded-xl
          ${isRadar ? 'bg-slate-800/60 border border-slate-700' : 'bg-white/80 border border-stone-200'}
        `}
        style={{ opacity: vsProgress }}
      >
        {/* Competitor 1 */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendUpIcon size={16} color="#22c55e" />
            <span className={`text-base font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {competitor1.name}
            </span>
          </div>
          <span className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
            Score: {score1Total}
          </span>
        </div>

        {/* VS badge */}
        <div
          className={`
            w-14 h-14 rounded-full flex items-center justify-center text-base font-bold
            ${isRadar ? 'bg-slate-700 text-slate-300' : 'bg-stone-200 text-stone-600'}
          `}
        >
          VS
        </div>

        {/* Competitor 2 */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendDownIcon size={16} color="#ef4444" />
            <span className={`text-base font-bold ${isRadar ? 'text-red-400' : 'text-red-600'}`}>
              {competitor2.name}
            </span>
          </div>
          <span className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
            Score: {score2Total}
          </span>
        </div>
      </div>

      {/* Comparison bars */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ opacity: barsProgress }}
      >
        <ComparisonBars
          items={comparisonItems}
          frame={sceneFrame - 15}
          fps={fps}
          isRadar={isRadar}
          width={isMobile ? 440 : 840}
          leftHeader={competitor1.name}
          rightHeader={competitor2.name}
          leftColor="#22c55e"
          rightColor="#ef4444"
          maxValue={100}
          showPercentage={true}
        />
      </div>

      {/* Winner announcement - larger */}
      <div
        className={`
          mt-4 text-center p-4 rounded-xl
          ${winner === competitor1.name
            ? (isRadar ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200')
            : winner === competitor2.name
              ? (isRadar ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200')
              : (isRadar ? 'bg-slate-800/50 border border-slate-700' : 'bg-stone-100 border border-stone-200')
          }
        `}
        style={{
          opacity: spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 22, easing: easeOutCubic }),
        }}
      >
        <span className={`text-base ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>Overall Winner: </span>
        <span className={`text-xl font-bold ${
          winner === competitor1.name
            ? (isRadar ? 'text-emerald-400' : 'text-emerald-600')
            : winner === competitor2.name
              ? (isRadar ? 'text-red-400' : 'text-red-600')
              : (isRadar ? 'text-slate-300' : 'text-stone-700')
        }`}>
          {winner === 'Tie' ? 'Too close to call' : winner}
        </span>
        {winner !== 'Tie' && (
          <span className={`text-sm ml-2 ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            (+{winMargin} points)
          </span>
        )}
      </div>
    </div>
  );
}
