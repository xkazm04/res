'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { ChainIcon, ArrowDownIcon, LockIcon, InfoIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface CausalEvent {
  event: string;
  date?: string;
  impact: string;
  type: 'cause' | 'effect' | 'hidden';
}

interface CausalChainSceneProps extends BaseSceneProps {
  events: CausalEvent[];
  title?: string;
  accentColor: string;
}

/**
 * Causal chain visualization showing event connections.
 * World-class visual with flowing energy effects and premium cards.
 */
export function CausalChainScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  events,
  title = 'Cause & Effect',
  accentColor,
}: CausalChainSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const legendProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 20, easing: easeOutCubic });
  const lineProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 50, easing: easeOutExpo });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;
  const slowPulse = Math.sin((sceneFrame / fps) * Math.PI * 0.8) * 0.5 + 0.5;

  // Energy particles flowing down the chain
  const energyParticles = Array.from({ length: 5 }, (_, i) => {
    const progress = ((sceneFrame / fps * 0.4) + i * 0.2) % 1;
    return {
      progress,
      opacity: Math.sin(progress * Math.PI) * 0.8,
      size: 4 + Math.sin(progress * Math.PI) * 2,
    };
  });

  // Event type styling - enhanced
  const typeStyles = {
    cause: {
      bg: isRadar ? 'bg-blue-500/10' : 'bg-blue-50/80',
      border: isRadar ? 'border-blue-400/30' : 'border-blue-200',
      text: isRadar ? 'text-blue-400' : 'text-blue-700',
      color: '#3b82f6',
      gradient: 'from-blue-500/20 to-blue-600/5',
      Icon: InfoIcon,
    },
    effect: {
      bg: isRadar ? 'bg-purple-500/10' : 'bg-purple-50/80',
      border: isRadar ? 'border-purple-400/30' : 'border-purple-200',
      text: isRadar ? 'text-purple-400' : 'text-purple-700',
      color: '#a855f7',
      gradient: 'from-purple-500/20 to-purple-600/5',
      Icon: InfoIcon,
    },
    hidden: {
      bg: isRadar ? 'bg-amber-500/10' : 'bg-amber-50/80',
      border: isRadar ? 'border-amber-400/30' : 'border-amber-200',
      text: isRadar ? 'text-amber-400' : 'text-amber-700',
      color: '#f59e0b',
      gradient: 'from-amber-500/20 to-amber-600/5',
      Icon: LockIcon,
    },
  };

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
            ? 'radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(168, 85, 247, 0.06) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(168, 85, 247, 0.03) 0%, transparent 50%)',
          opacity: headerProgress,
        }}
      />

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
                backgroundColor: '#a855f7',
                filter: 'blur(14px)',
                opacity: 0.4 + pulse * 0.2,
                transform: `scale(${1.2 + pulse * 0.1})`,
              }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-purple-500/30 border border-purple-400/30' : 'bg-purple-100/80 border border-purple-200'
              }`}
              style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }}
            >
              <ChainIcon size={isMobile ? 22 : 26} color="#a855f7" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {events.length} connected events revealed
            </p>
          </div>
        </div>
      </div>

      {/* Legend - glassmorphism style */}
      <div
        className={`
          relative z-20 inline-flex gap-5 mb-5 px-4 py-2.5 rounded-xl backdrop-blur-sm
          ${isRadar ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/60 border border-stone-200'}
        `}
        style={{
          opacity: legendProgress,
          transform: `translateY(${(1 - legendProgress) * 10}px)`,
        }}
      >
        {(['cause', 'effect', 'hidden'] as const).map((type, i) => {
          const style = typeStyles[type];
          const itemProgress = spring({ frame: sceneFrame, fps, delay: 8 + i * 4, durationFrames: 18, easing: easeOutCubic });
          return (
            <div
              key={type}
              className="flex items-center gap-2"
              style={{ opacity: itemProgress }}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: style.color,
                    filter: 'blur(4px)',
                    opacity: 0.4,
                  }}
                />
                <div
                  className="relative w-3 h-3 rounded-full"
                  style={{ backgroundColor: style.color }}
                />
              </div>
              <span className={`text-[11px] font-medium capitalize ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                {type}
              </span>
            </div>
          );
        })}
      </div>

      {/* Causal chain - main content */}
      <div className="relative z-20">
        {/* Animated connecting line with energy flow */}
        <div
          className={`absolute ${isMobile ? 'left-[22px]' : 'left-[26px]'} top-6 bottom-6`}
          style={{ width: 3 }}
        >
          {/* Base line */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(to bottom, #3b82f6, #a855f7, #f59e0b)`,
              transform: `scaleY(${lineProgress})`,
              transformOrigin: 'top',
              opacity: 0.3,
            }}
          />

          {/* Glowing line */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(to bottom, #3b82f6, #a855f7, #f59e0b)`,
              transform: `scaleY(${lineProgress})`,
              transformOrigin: 'top',
              filter: 'blur(4px)',
              opacity: 0.5,
            }}
          />

          {/* Energy particles */}
          {energyParticles.map((particle, i) => (
            <div
              key={i}
              className="absolute left-1/2 rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: '#a855f7',
                top: `${particle.progress * 100}%`,
                transform: 'translateX(-50%)',
                opacity: particle.opacity * lineProgress,
                boxShadow: '0 0 8px #a855f7',
              }}
            />
          ))}
        </div>

        {/* Event cards */}
        <div className={`space-y-4 ${isMobile ? 'pl-12' : 'pl-14'}`}>
          {events.slice(0, isMobile ? 4 : 5).map((event, i) => {
            const delay = 15 + i * 10;
            const cardProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 28, easing: easeOutQuart });
            const style = typeStyles[event.type];

            return (
              <div
                key={i}
                className="relative"
                style={{
                  opacity: cardProgress,
                  transform: `translateX(${(1 - cardProgress) * 40}px)`,
                }}
              >
                {/* Connection node with pulse */}
                <div
                  className={`absolute ${isMobile ? '-left-[38px]' : '-left-[40px]'} top-5`}
                >
                  {/* Outer pulse ring */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: 20,
                      height: 20,
                      left: -4,
                      top: -4,
                      border: `2px solid ${style.color}`,
                      opacity: 0.3 + (event.type === 'hidden' ? pulse * 0.4 : 0),
                      transform: `scale(${1 + (event.type === 'hidden' ? pulse * 0.3 : 0)})`,
                    }}
                  />

                  {/* Node glow */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: style.color,
                      filter: 'blur(6px)',
                      opacity: 0.6,
                    }}
                  />

                  {/* Node */}
                  <div
                    className="relative w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: style.color,
                      boxShadow: `0 0 0 3px ${isRadar ? '#0f172a' : '#fff'}, 0 0 12px ${style.color}`,
                    }}
                  />
                </div>

                {/* Arrow connector */}
                {i > 0 && (
                  <div
                    className={`absolute ${isMobile ? '-left-[35px]' : '-left-[37px]'} -top-3`}
                    style={{ opacity: cardProgress * 0.7 }}
                  >
                    <ArrowDownIcon size={14} color={style.color} />
                  </div>
                )}

                {/* Event card - glassmorphism */}
                <div
                  className={`
                    relative overflow-hidden p-4 rounded-2xl backdrop-blur-sm
                    bg-gradient-to-br ${style.gradient}
                    ${style.border} border
                  `}
                  style={{
                    boxShadow: isRadar
                      ? `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                      : `0 4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
                  }}
                >
                  {/* Accent line */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />

                  {/* Corner accent glow */}
                  <div
                    className="absolute -top-10 -right-10 w-20 h-20 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${style.color}20 0%, transparent 70%)`,
                      filter: 'blur(10px)',
                    }}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex-1 pl-3">
                      {/* Event title with icon */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${style.color}25` }}
                        >
                          <style.Icon size={14} color={style.color} />
                        </div>
                        <span className={`text-sm font-bold ${style.text}`}>
                          {animateWords(
                            event.event.length > 35 ? event.event.slice(0, 32) + '...' : event.event,
                            delay + 5
                          )}
                        </span>
                      </div>

                      {/* Impact description */}
                      <p className={`text-xs leading-relaxed ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                        {animateWords(
                          event.impact.length > 65 ? event.impact.slice(0, 62) + '...' : event.impact,
                          delay + 10
                        )}
                      </p>
                    </div>

                    {/* Date badge */}
                    {event.date && (
                      <div
                        className={`
                          flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold
                          ${isRadar ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-stone-600 border border-stone-200'}
                        `}
                        style={{
                          opacity: spring({ frame: sceneFrame, fps, delay: delay + 15, durationFrames: 15, easing: easeOutCubic }),
                        }}
                      >
                        {event.date}
                      </div>
                    )}
                  </div>

                  {/* Chain link visual for hidden events */}
                  {event.type === 'hidden' && (
                    <div
                      className="absolute top-2 right-2"
                      style={{ opacity: 0.3 + pulse * 0.2 }}
                    >
                      <LockIcon size={14} color={style.color} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* More indicator with animation */}
      {events.length > (isMobile ? 4 : 5) && (
        <div
          className="relative z-20 mt-5 text-center"
          style={{
            opacity: spring({ frame: sceneFrame, fps, delay: 60, durationFrames: 20, easing: easeOutCubic }),
          }}
        >
          <span
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm
              ${isRadar ? 'bg-slate-800/60 text-slate-400 border border-slate-700/50' : 'bg-stone-100 text-stone-500 border border-stone-200'}
            `}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            +{events.length - (isMobile ? 4 : 5)} more events in chain
          </span>
        </div>
      )}

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
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
