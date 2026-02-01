'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { FlowVisualization, type FlowNode, type FlowConnection } from '../primitives';
import { MoneyIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

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
  flows,
  title = 'Follow The Money',
  accentColor,
}: MoneyTrailSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const flowProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 35, easing: easeOutExpo });
  const cardsProgress = spring({ frame: sceneFrame, fps, delay: 25, durationFrames: 28, easing: easeOutCubic });
  const totalProgress = spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 30, easing: easeOutQuart });

  // Animated pulse for money flow effect
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;
  const slowPulse = Math.sin((sceneFrame / fps) * Math.PI * 0.6) * 0.5 + 0.5;

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

  // Calculate total
  const totalAmount = flows.reduce((sum, flow) => {
    const amount = parseFloat(flow.amount.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const formatTotal = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  // Visualization dimensions
  const vizWidth = isMobile ? 340 : 850;
  const vizHeight = isMobile ? 200 : 240;

  // Word animation helper
  const animateWords = (text: string, baseDelay: number) => {
    const words = text.split(' ');
    return words.map((word, wordIndex) => {
      const wordDelay = baseDelay + wordIndex * 1.5;
      const wordProgress = spring({ frame: sceneFrame, fps, delay: wordDelay, durationFrames: 10, easing: easeOutCubic });
      return (
        <span
          key={wordIndex}
          style={{
            opacity: wordProgress,
            transform: `translateY(${(1 - wordProgress) * 6}px)`,
            display: 'inline-block',
            marginRight: '0.2em',
          }}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-4 pt-8' : 'p-6'}`}>
      {/* Cinematic letterbox for desktop */}
      {!isMobile && (
        <>
          <div
            className="absolute top-0 left-0 right-0 bg-black z-10"
            style={{ height: '6%', opacity: headerProgress * 0.9 }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black z-10"
            style={{ height: '6%', opacity: headerProgress * 0.9 }}
          />
        </>
      )}

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
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <MoneyIcon size={isMobile ? 22 : 26} color="#22c55e" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
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
        {/* Background glow for flow */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
            transform: `scale(${1 + slowPulse * 0.05})`,
          }}
        />

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

      {/* Flow details - glassmorphism cards */}
      <div
        className={`relative z-20 mt-4 ${isMobile ? 'space-y-2' : 'grid grid-cols-3 gap-3 px-2'}`}
        style={{ opacity: cardsProgress }}
      >
        {flows.slice(0, isMobile ? 2 : 3).map((flow, i) => {
          const delay = 30 + i * 6;
          const itemProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 24, easing: easeOutQuart });

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden p-4 rounded-xl backdrop-blur-sm
                ${isRadar
                  ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50'
                  : 'bg-gradient-to-br from-white/80 to-stone-50/60 border border-stone-200'}
              `}
              style={{
                opacity: itemProgress,
                transform: `translateY(${(1 - itemProgress) * 20}px)`,
                boxShadow: `0 4px 20px rgba(34, 197, 94, 0.1), inset 0 1px 0 ${isRadar ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}`,
              }}
            >
              {/* Accent glow */}
              <div
                className="absolute -top-10 -right-10 w-20 h-20 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
                  filter: 'blur(10px)',
                }}
              />

              {/* Flow direction */}
              <div className="relative flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold ${isRadar ? 'text-slate-200' : 'text-stone-700'}`}>
                  {flow.from.length > 12 ? flow.from.slice(0, 10) + '...' : flow.from}
                </span>

                {/* Animated arrow */}
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="h-0.5 flex-1 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)' }}
                  />
                  <svg className="w-5 h-5 text-emerald-500 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <span className={`text-xs font-semibold ${isRadar ? 'text-slate-200' : 'text-stone-700'}`}>
                  {flow.to.length > 12 ? flow.to.slice(0, 10) + '...' : flow.to}
                </span>
              </div>

              {/* Amount with glow */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.2), transparent)',
                    filter: 'blur(8px)',
                  }}
                />
                <div className={`relative text-xl font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {flow.amount}
                </div>
              </div>

              {/* Why description */}
              <div className={`text-[10px] mt-2 leading-relaxed ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                {animateWords(flow.why.length > 50 ? flow.why.slice(0, 47) + '...' : flow.why, delay + 10)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total tracked - premium badge */}
      {totalAmount > 0 && (
        <div
          className="relative z-20 mt-5 flex justify-center"
          style={{
            opacity: totalProgress,
            transform: `translateY(${(1 - totalProgress) * 15}px)`,
          }}
        >
          <div
            className={`
              relative overflow-hidden flex items-center gap-4 px-6 py-4 rounded-2xl
              ${isRadar
                ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-400/30'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'}
            `}
            style={{
              boxShadow: `0 4px 30px rgba(34, 197, 94, ${isRadar ? '0.2' : '0.15'})`,
            }}
          >
            {/* Animated shine effect */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${isRadar ? '0.05' : '0.3'}), transparent)`,
                transform: `translateX(${-100 + (sceneFrame / fps * 30) % 200}%)`,
              }}
            />

            {/* Pulsing glow behind icon */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: '#22c55e',
                  filter: 'blur(12px)',
                  opacity: 0.4 + pulse * 0.3,
                  transform: `scale(${1.4 + pulse * 0.2})`,
                }}
              />
              <div
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center
                  ${isRadar ? 'bg-emerald-500/30' : 'bg-emerald-100'}
                `}
              >
                <MoneyIcon size={24} color="#22c55e" />
              </div>
            </div>

            <div>
              <span className={`text-sm font-medium block ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                Total Tracked
              </span>
              <span
                className={`text-3xl font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}
                style={{
                  textShadow: isRadar ? '0 0 20px rgba(34, 197, 94, 0.3)' : 'none',
                }}
              >
                {formatTotal(totalAmount)}
              </span>
            </div>

            {/* Decorative corner accent */}
            <svg className="absolute top-2 right-2 w-8 h-8" style={{ opacity: 0.3 }}>
              <path
                d="M 32 0 L 32 8 Q 32 16 24 16 L 0 16"
                fill="none"
                stroke="#22c55e"
                strokeWidth={1}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
        </>
      )}
    </div>
  );
}
