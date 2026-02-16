'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { FlowVisualization, type FlowNode, type FlowConnection } from '../primitives';
import { MoneyIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';
import { spreadEntrance } from '@/src/lib/animation/motion';

interface MoneyFlow {
  from: string;
  to: string;
  amount: string;
  why: string;
}

interface MoneyTrailSceneProps extends BaseSceneProps {
  flows: MoneyFlow[];
  title?: string;
  accentColor: string;
}

/**
 * Animated money flow visualization showing financial connections.
 * World-class visual with dramatic money flow effects.
 */
export function MoneyTrailScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  flows,
  title = 'Follow The Money',
  accentColor,
}: MoneyTrailSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const flowProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 35, easing: easeOutExpo });
  const cardsProgress = spring({ frame: sceneFrame, fps, delay: 25, durationFrames: 28, easing: easeOutCubic });

  // Proportional stagger delays for flow cards
  const getFlowDelay = spreadEntrance(sceneDuration, flows.length, { startPct: 0.05, endPct: 0.65 });

  // Animated pulse for money flow effect
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;
  // Money particles floating up
  const moneyParticles = Array.from({ length: 12 }, (_, i) => {
    const x = (i / 12) * 100 - 50 + Math.sin((sceneFrame / fps) + i * 2) * 20;
    const y = ((sceneFrame / fps * 30) + i * 30) % 120 - 60;
    const opacity = Math.sin(((sceneFrame / fps * 30) + i * 30) % 120 / 120 * Math.PI) * 0.5;
    return { x, y, opacity, size: 3 + Math.random() * 2 };
  });

  // Extract unique entities from flows
  const entities = new Set<string>();
  flows.forEach(flow => {
    entities.add(flow.from);
    entities.add(flow.to);
  });

  // Convert to FlowNodes
  const flowNodes: FlowNode[] = Array.from(entities).map((entity) => {
    const isSource = flows.some(f => f.from === entity) && !flows.some(f => f.to === entity);
    const isDestination = flows.some(f => f.to === entity) && !flows.some(f => f.from === entity);

    return {
      id: entity,
      label: entity.length > 15 ? entity.slice(0, 13) + '...' : entity,
      type: isSource ? 'source' : isDestination ? 'destination' : 'intermediary',
    };
  });

  // Convert to FlowConnections
  const flowConnections: FlowConnection[] = flows.map(flow => ({
    from: flow.from,
    to: flow.to,
    amount: flow.amount,
    type: parseFloat(flow.amount.replace(/[^0-9.]/g, '')) > 1000000 ? 'large' : 'normal',
  }));

  // Visualization dimensions — must fit within 960x540 viewport (minus padding)
  const vizWidth = isMobile ? 500 : 840;
  const vizHeight = isMobile ? 280 : 210;

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? 'radial-gradient(ellipse at 30% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 30% 30%, rgba(34, 197, 94, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)',
          opacity: headerProgress,
        }}
      />

      {/* Floating money particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {moneyParticles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: '#22c55e',
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * headerProgress,
              boxShadow: '0 0 6px #22c55e',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className="relative z-20 mb-4"
        style={{
          opacity: headerProgress,
          transform: `translateX(${(1 - headerProgress) * -30}px)`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon with glow */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundColor: '#22c55e',
                filter: 'blur(16px)',
                opacity: 0.4 + pulse * 0.2,
                transform: `scale(${1.2 + pulse * 0.1})`,
              }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-emerald-500/30 border border-emerald-400/30' : 'bg-emerald-100/80 border border-emerald-200'
              }`}
              style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72 }}
            >
              <MoneyIcon size={isMobile ? 30 : 36} color="#22c55e" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {flows.length} transactions • {flowNodes.length} entities tracked
            </p>
          </div>
        </div>

        {/* Animated divider */}
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #22c55e, #10b981, transparent)',
            transform: `scaleX(${headerProgress})`,
            transformOrigin: 'left',
          }}
        />
      </div>

      {/* Flow visualization */}
      <div
        className="relative z-20 flex justify-center"
        style={{
          opacity: flowProgress,
        }}
      >
        <FlowVisualization
          nodes={flowNodes}
          flows={flowConnections}
          frame={sceneFrame - 5}
          fps={fps}
          isRadar={isRadar}
          width={vizWidth}
          height={vizHeight}
          direction={isMobile ? 'vertical' : 'horizontal'}
          animateParticles={true}
          accentColor="#22c55e"
        />
      </div>

      {/* Flow details - compact stacked cards */}
      <div
        className="relative z-20 mt-3 space-y-2 px-1"
        style={{ opacity: cardsProgress }}
      >
        {flows.slice(0, 2).map((flow, i) => {
          const delay = getFlowDelay(i);
          const itemProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 24, easing: easeOutQuart });

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden px-4 py-2.5 rounded-xl backdrop-blur-sm
                ${isRadar
                  ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50'
                  : 'bg-gradient-to-br from-white/80 to-stone-50/60 border border-stone-200'}
              `}
              style={{
                opacity: itemProgress,
                transform: `translateY(${(1 - itemProgress) * 15}px)`,
              }}
            >
              {/* Single-row: from → amount → to | why */}
              <div className="relative flex items-center gap-2">
                <span className={`text-sm font-semibold flex-shrink-0 ${isRadar ? 'text-slate-200' : 'text-stone-700'}`}>
                  {flow.from.length > 10 ? flow.from.slice(0, 8) + '..' : flow.from}
                </span>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="w-6 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)' }} />
                  <span className={`text-base font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {flow.amount}
                  </span>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <span className={`text-sm font-semibold flex-shrink-0 ${isRadar ? 'text-slate-200' : 'text-stone-700'}`}>
                  {flow.to.length > 10 ? flow.to.slice(0, 8) + '..' : flow.to}
                </span>

                <span className={`text-xs ml-2 truncate ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                  {flow.why}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 42 L 0 8 Q 0 0 8 0 L 42 0"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute top-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 64 42 L 64 8 Q 64 0 56 0 L 22 0"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 22 L 0 56 Q 0 64 8 64 L 42 64"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 64 22 L 64 56 Q 64 64 56 64 L 22 64"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
        </>
      )}
    </div>
  );
}
