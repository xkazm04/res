'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { FinancialIcon, TrendUpIcon, TrendDownIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface BullBearSceneProps extends BaseSceneProps {
  bullCase: string[];
  bearCase: string[];
  accentColor: string;
}

/**
 * Split screen bull vs bear case visualization.
 * World-class visual with dramatic split-screen effects.
 */
export function BullBearScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  bullCase,
  bearCase,
  accentColor,
}: BullBearSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const barProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 30, easing: easeOutExpo });
  const leftProgress = spring({ frame: sceneFrame, fps, delay: 10, durationFrames: 30, easing: easeOutQuart });
  const rightProgress = spring({ frame: sceneFrame, fps, delay: 14, durationFrames: 30, easing: easeOutQuart });
  const summaryProgress = spring({ frame: sceneFrame, fps, delay: 55, durationFrames: 25, easing: easeOutCubic });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Calculate balance
  const total = bullCase.length + bearCase.length;
  const bullPercent = total > 0 ? Math.round((bullCase.length / total) * 100) : 50;

  // Particles for each side
  const bullParticles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI - Math.PI / 2 + (sceneFrame / fps) * 0.2;
    const radius = 80 + Math.sin((sceneFrame / fps) * 1.5 + i) * 20;
    return {
      x: -100 + Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0.2 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.15,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  const bearParticles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI + Math.PI / 2 + (sceneFrame / fps) * 0.2;
    const radius = 80 + Math.sin((sceneFrame / fps) * 1.5 + i) * 20;
    return {
      x: 100 + Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0.2 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.15,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

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
            transform: `translateY(${(1 - wordProgress) * 5}px)`,
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

      {/* Background gradients - split */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.06) 0%, transparent 30%, transparent 70%, rgba(239, 68, 68, 0.06) 100%)'
            : 'linear-gradient(90deg, rgba(34, 197, 94, 0.04) 0%, transparent 30%, transparent 70%, rgba(239, 68, 68, 0.04) 100%)',
          opacity: headerProgress,
        }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {bullParticles.map((p, i) => (
          <div
            key={`bull-${i}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: '#22c55e',
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * leftProgress,
              filter: 'blur(1px)',
            }}
          />
        ))}
        {bearParticles.map((p, i) => (
          <div
            key={`bear-${i}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: '#ef4444',
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * rightProgress,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className="relative z-20 mb-4 text-center"
        style={{
          opacity: headerProgress,
          transform: `translateY(${(1 - headerProgress) * -20}px)`,
        }}
      >
        <div className="inline-flex items-center gap-3">
          {/* Icon with glow */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundColor: accentColor,
                filter: 'blur(14px)',
                opacity: 0.4 + pulse * 0.2,
                transform: `scale(${1.2 + pulse * 0.1})`,
              }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-blue-500/30 border border-blue-400/30' : 'bg-blue-100/80 border border-blue-200'
              }`}
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <FinancialIcon size={isMobile ? 22 : 26} color={accentColor} />
            </div>
          </div>
          <div className="text-left">
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              Investment Thesis
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              Bull vs Bear Analysis
            </p>
          </div>
        </div>

        {/* Premium balance bar */}
        <div
          className="mt-4 mx-auto"
          style={{
            width: isMobile ? '80%' : '60%',
            opacity: barProgress,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {bullPercent}% Bullish
            </span>
            <span className={`text-xs font-medium ${isRadar ? 'text-red-400' : 'text-red-600'}`}>
              {100 - bullPercent}% Bearish
            </span>
          </div>
          <div
            className={`h-2 rounded-full overflow-hidden ${isRadar ? 'bg-slate-700' : 'bg-stone-200'}`}
          >
            <div className="flex h-full">
              <div
                className="h-full rounded-l-full transition-all duration-500"
                style={{
                  width: `${bullPercent * barProgress}%`,
                  background: 'linear-gradient(90deg, #22c55e, #10b981)',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
                }}
              />
              <div
                className="h-full rounded-r-full transition-all duration-500"
                style={{
                  width: `${(100 - bullPercent) * barProgress}%`,
                  background: 'linear-gradient(90deg, #f87171, #ef4444)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Split screen content */}
      <div className={`relative z-20 flex ${isMobile ? 'flex-col gap-4' : 'gap-4'} ${isMobile ? '' : 'px-2'}`}>
        {/* Bull Case Panel */}
        <div
          className="flex-1"
          style={{
            opacity: leftProgress,
            transform: `translateX(${(1 - leftProgress) * -40}px)`,
          }}
        >
          <div
            className={`
              relative overflow-hidden rounded-2xl p-4 h-full backdrop-blur-sm
              ${isRadar
                ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-400/25'
                : 'bg-gradient-to-br from-emerald-50/90 to-green-50/70 border border-emerald-200'}
            `}
          >
            {/* Accent glow */}
            <div
              className="absolute -top-16 -left-16 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Title */}
            <div className="relative flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}
              >
                <TrendUpIcon size={20} color="#ffffff" />
              </div>
              <h3 className={`text-base font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Bull Case
              </h3>
            </div>

            {/* Points */}
            <div className="relative space-y-2.5">
              {bullCase.slice(0, isMobile ? 3 : 4).map((point, i) => {
                const itemDelay = 20 + i * 6;
                const itemProgress = spring({ frame: sceneFrame, fps, delay: itemDelay, durationFrames: 22, easing: easeOutQuart });
                return (
                  <div
                    key={i}
                    className={`
                      p-3 rounded-xl
                      ${isRadar ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/70 border border-emerald-100'}
                    `}
                    style={{
                      opacity: itemProgress,
                      transform: `translateX(${(1 - itemProgress) * 20}px)`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>+</span>
                      <p className={`text-xs leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
                        {animateWords(point.length > 60 ? point.slice(0, 57) + '...' : point, itemDelay + 3)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center VS badge - desktop only */}
        {!isMobile && (
          <div
            className="relative flex items-center justify-center"
            style={{ width: 60 }}
          >
            <div
              className="absolute inset-0 w-px mx-auto"
              style={{
                background: `linear-gradient(to bottom, transparent, ${isRadar ? '#475569' : '#d6d3d1'}, transparent)`,
                opacity: leftProgress,
              }}
            />
            <div
              className="relative z-10"
              style={{ transform: `scale(${Math.min(leftProgress, rightProgress)})` }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #ef4444)',
                  filter: 'blur(12px)',
                  opacity: 0.4 + pulse * 0.2,
                  transform: `scale(1.3)`,
                }}
              />
              <div
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                  ${isRadar ? 'bg-slate-900 text-white border border-slate-600' : 'bg-white text-stone-900 border border-stone-200'}
                `}
                style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}
              >
                VS
              </div>
            </div>
          </div>
        )}

        {/* Bear Case Panel */}
        <div
          className="flex-1"
          style={{
            opacity: rightProgress,
            transform: `translateX(${(1 - rightProgress) * 40}px)`,
          }}
        >
          <div
            className={`
              relative overflow-hidden rounded-2xl p-4 h-full backdrop-blur-sm
              ${isRadar
                ? 'bg-gradient-to-br from-red-500/15 to-red-600/5 border border-red-400/25'
                : 'bg-gradient-to-br from-red-50/90 to-rose-50/70 border border-red-200'}
            `}
          >
            {/* Accent glow */}
            <div
              className="absolute -top-16 -right-16 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Title */}
            <div className="relative flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                <TrendDownIcon size={20} color="#ffffff" />
              </div>
              <h3 className={`text-base font-bold ${isRadar ? 'text-red-400' : 'text-red-700'}`}>
                Bear Case
              </h3>
            </div>

            {/* Points */}
            <div className="relative space-y-2.5">
              {bearCase.slice(0, isMobile ? 3 : 4).map((point, i) => {
                const itemDelay = 28 + i * 6;
                const itemProgress = spring({ frame: sceneFrame, fps, delay: itemDelay, durationFrames: 22, easing: easeOutQuart });
                return (
                  <div
                    key={i}
                    className={`
                      p-3 rounded-xl
                      ${isRadar ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/70 border border-red-100'}
                    `}
                    style={{
                      opacity: itemProgress,
                      transform: `translateX(${(1 - itemProgress) * -20}px)`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-bold ${isRadar ? 'text-red-400' : 'text-red-600'}`}>-</span>
                      <p className={`text-xs leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
                        {animateWords(point.length > 60 ? point.slice(0, 57) + '...' : point, itemDelay + 3)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary insight - premium badge */}
      <div
        className="relative z-20 mt-5 flex justify-center"
        style={{
          opacity: summaryProgress,
          transform: `translateY(${(1 - summaryProgress) * 15}px)`,
        }}
      >
        <div
          className={`
            relative overflow-hidden flex items-center gap-6 px-6 py-3 rounded-2xl backdrop-blur-sm
            ${isRadar
              ? 'bg-slate-800/60 border border-slate-700/50'
              : 'bg-white/80 border border-stone-200'}
          `}
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
        >
          {/* Animated shine */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${isRadar ? '0.03' : '0.2'}), transparent)`,
              transform: `translateX(${-100 + (sceneFrame / fps * 30) % 200}%)`,
            }}
          />

          <div className="relative flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
            >
              <TrendUpIcon size={16} color="#22c55e" />
            </div>
            <div>
              <span className={`text-lg font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {bullCase.length}
              </span>
              <span className={`text-xs ml-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                Bullish
              </span>
            </div>
          </div>

          <div className={`h-8 w-px ${isRadar ? 'bg-slate-700' : 'bg-stone-200'}`} />

          <div className="relative flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <TrendDownIcon size={16} color="#ef4444" />
            </div>
            <div>
              <span className={`text-lg font-bold ${isRadar ? 'text-red-400' : 'text-red-600'}`}>
                {bearCase.length}
              </span>
              <span className={`text-xs ml-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                Bearish
              </span>
            </div>
          </div>
        </div>
      </div>

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
              stroke="#ef4444"
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
              stroke="#ef4444"
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
