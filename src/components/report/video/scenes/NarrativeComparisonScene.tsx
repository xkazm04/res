'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { SplitCompareIcon, NewsIcon, InvestigativeIcon, WarningIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface NarrativeComparisonSceneProps extends BaseSceneProps {
  officialNarrative: string[];
  realStory: string[];
  discrepancies?: string[];
  accentColor: string;
}

/**
 * Official vs real narrative comparison visualization.
 * World-class visual with dramatic confrontation effects.
 */
export function NarrativeComparisonScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  officialNarrative,
  realStory,
  discrepancies = [],
  accentColor,
}: NarrativeComparisonSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const leftPanelProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 30, easing: easeOutQuart });
  const rightPanelProgress = spring({ frame: sceneFrame, fps, delay: 12, durationFrames: 30, easing: easeOutQuart });
  const dividerProgress = spring({ frame: sceneFrame, fps, delay: 20, durationFrames: 35, easing: easeOutExpo });
  const discrepancyProgress = spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 25, easing: easeOutCubic });

  // Animated pulse for confrontation effect
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;
  const slowPulse = Math.sin((sceneFrame / fps) * Math.PI) * 0.5 + 0.5;

  // Particle system for visual interest
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + (sceneFrame / fps) * 0.3;
    const radius = 150 + Math.sin((sceneFrame / fps) * 2 + i) * 30;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0.3 + Math.sin((sceneFrame / fps) * 3 + i * 0.5) * 0.2,
      size: 2 + Math.sin((sceneFrame / fps) * 2 + i) * 1,
    };
  });

  // Word animation helper
  const animateWords = (text: string, baseDelay: number, itemIndex: number) => {
    const words = text.split(' ');
    return words.map((word, wordIndex) => {
      const wordDelay = baseDelay + itemIndex * 8 + wordIndex * 2;
      const wordProgress = spring({ frame: sceneFrame, fps, delay: wordDelay, durationFrames: 12, easing: easeOutCubic });
      return (
        <span
          key={wordIndex}
          style={{
            opacity: wordProgress,
            transform: `translateY(${(1 - wordProgress) * 8}px)`,
            display: 'inline-block',
            marginRight: '0.25em',
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
            style={{ height: '8%', opacity: headerProgress * 0.9 }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black z-10"
            style={{ height: '8%', opacity: headerProgress * 0.9 }}
          />
        </>
      )}

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? 'radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)',
          opacity: headerProgress,
        }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: i % 2 === 0 ? '#3b82f6' : '#a855f7',
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * headerProgress,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Header with icon */}
      <div
        className="relative z-20 mb-6 text-center"
        style={{
          opacity: headerProgress,
          transform: `translateY(${(1 - headerProgress) * -20}px)`,
        }}
      >
        <div className="inline-flex items-center gap-3">
          {/* Icon with multi-layer glow */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundColor: '#a855f7',
                filter: 'blur(16px)',
                opacity: 0.4 + pulse * 0.2,
                transform: `scale(${1.2 + pulse * 0.1})`,
              }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-purple-500/30 border border-purple-400/30' : 'bg-purple-100/80 border border-purple-200'
              }`}
              style={{ width: isMobile ? 42 : 52, height: isMobile ? 42 : 52 }}
            >
              <SplitCompareIcon size={isMobile ? 22 : 28} color="#a855f7" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              The Two Stories
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              What they say vs. what happened
            </p>
          </div>
        </div>
      </div>

      {/* Main comparison layout */}
      <div className={`relative z-20 flex ${isMobile ? 'flex-col gap-4' : 'gap-6'} ${isMobile ? '' : 'px-4'}`}>
        {/* Left Panel - Official Story */}
        <div
          className="flex-1"
          style={{
            opacity: leftPanelProgress,
            transform: `translateX(${(1 - leftPanelProgress) * -40}px)`,
          }}
        >
          {/* Panel with glassmorphism */}
          <div
            className={`
              relative overflow-hidden rounded-2xl p-4
              ${isRadar
                ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-400/20'
                : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200'}
            `}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {/* Accent glow */}
            <div
              className="absolute -top-20 -left-20 w-40 h-40 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Title */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
              >
                <NewsIcon size={16} color="#3b82f6" />
              </div>
              <h3 className={`text-sm font-bold ${isRadar ? 'text-blue-400' : 'text-blue-700'}`}>
                Official Story
              </h3>
            </div>

            {/* Content items */}
            <div className="space-y-3">
              {officialNarrative.slice(0, isMobile ? 3 : 4).map((point, i) => {
                const itemProgress = spring({ frame: sceneFrame, fps, delay: 18 + i * 6, durationFrames: 22, easing: easeOutQuart });
                return (
                  <div
                    key={i}
                    className={`
                      relative p-3 rounded-xl
                      ${isRadar ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/60 border border-blue-100'}
                    `}
                    style={{
                      opacity: itemProgress,
                      transform: `translateX(${(1 - itemProgress) * 20}px)`,
                    }}
                  >
                    {/* Left accent */}
                    <div
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                      style={{ backgroundColor: '#3b82f6' }}
                    />
                    <p className={`text-xs pl-3 leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
                      {animateWords(point.length > 60 ? point.slice(0, 57) + '...' : point, 20, i)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Divider with VS badge */}
        {!isMobile && (
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ width: 60 }}
          >
            {/* Animated divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                background: `linear-gradient(to bottom, transparent, ${isRadar ? '#6366f1' : '#a855f7'}, transparent)`,
                opacity: dividerProgress,
                transform: `scaleY(${dividerProgress})`,
              }}
            />

            {/* Energy pulse on divider */}
            <div
              className="absolute w-1 rounded-full"
              style={{
                height: 40,
                backgroundColor: '#a855f7',
                top: `${30 + slowPulse * 40}%`,
                opacity: 0.6,
                filter: 'blur(4px)',
              }}
            />

            {/* VS Badge */}
            <div
              className="relative z-10"
              style={{
                opacity: dividerProgress,
                transform: `scale(${dividerProgress})`,
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                  filter: 'blur(12px)',
                  opacity: 0.5 + pulse * 0.3,
                  transform: `scale(${1.3 + pulse * 0.2})`,
                }}
              />
              <div
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                  ${isRadar ? 'bg-slate-900 text-white border border-slate-600' : 'bg-white text-stone-900 border border-stone-200'}
                `}
                style={{
                  boxShadow: isRadar
                    ? '0 0 20px rgba(99, 102, 241, 0.3)'
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                VS
              </div>
            </div>
          </div>
        )}

        {/* Right Panel - Real Story */}
        <div
          className="flex-1"
          style={{
            opacity: rightPanelProgress,
            transform: `translateX(${(1 - rightPanelProgress) * 40}px)`,
          }}
        >
          {/* Panel with glassmorphism */}
          <div
            className={`
              relative overflow-hidden rounded-2xl p-4
              ${isRadar
                ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-400/20'
                : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200'}
            `}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {/* Accent glow */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Title */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
              >
                <InvestigativeIcon size={16} color="#a855f7" />
              </div>
              <h3 className={`text-sm font-bold ${isRadar ? 'text-purple-400' : 'text-purple-700'}`}>
                Real Story
              </h3>
            </div>

            {/* Content items */}
            <div className="space-y-3">
              {realStory.slice(0, isMobile ? 3 : 4).map((point, i) => {
                const itemProgress = spring({ frame: sceneFrame, fps, delay: 25 + i * 6, durationFrames: 22, easing: easeOutQuart });
                return (
                  <div
                    key={i}
                    className={`
                      relative p-3 rounded-xl
                      ${isRadar ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/60 border border-purple-100'}
                    `}
                    style={{
                      opacity: itemProgress,
                      transform: `translateX(${(1 - itemProgress) * -20}px)`,
                    }}
                  >
                    {/* Left accent */}
                    <div
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                      style={{ backgroundColor: '#a855f7' }}
                    />
                    <p className={`text-xs pl-3 leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
                      {animateWords(point.length > 60 ? point.slice(0, 57) + '...' : point, 27, i)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancies alert */}
      {discrepancies.length > 0 && (
        <div
          className="relative z-20 mt-6 flex justify-center"
          style={{
            opacity: discrepancyProgress,
            transform: `translateY(${(1 - discrepancyProgress) * 20}px)`,
          }}
        >
          <div
            className={`
              relative overflow-hidden px-6 py-3 rounded-2xl
              ${isRadar
                ? 'bg-amber-500/10 border border-amber-400/30'
                : 'bg-amber-50 border border-amber-200'}
            `}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {/* Animated glow */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(245, 158, 11, ${0.1 + pulse * 0.1}), transparent)`,
                transform: `translateX(${-100 + (sceneFrame / fps * 50) % 200}%)`,
              }}
            />

            <div className="relative flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  boxShadow: `0 0 ${10 + pulse * 5}px rgba(245, 158, 11, 0.3)`,
                }}
              >
                <WarningIcon size={16} color="#f59e0b" />
              </div>
              <div>
                <p className={`text-sm font-bold ${isRadar ? 'text-amber-400' : 'text-amber-700'}`}>
                  {discrepancies.length} Major Discrepancies
                </p>
                <p className={`text-xs ${isRadar ? 'text-amber-500/70' : 'text-amber-600/70'}`}>
                  Critical contradictions identified
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[10%] left-4 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.4 }}>
            <path
              d="M 0 40 L 0 8 Q 0 0 8 0 L 40 0"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute top-[10%] right-4 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.4 }}>
            <path
              d="M 64 40 L 64 8 Q 64 0 56 0 L 24 0"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[10%] left-4 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.4 }}>
            <path
              d="M 0 24 L 0 56 Q 0 64 8 64 L 40 64"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[10%] right-4 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.4 }}>
            <path
              d="M 64 24 L 64 56 Q 64 64 56 64 L 24 64"
              fill="none"
              stroke={isRadar ? '#6366f1' : '#a855f7'}
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
