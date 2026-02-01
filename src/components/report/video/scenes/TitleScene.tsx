'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';
import { pulse, type SceneProps } from './primitives';

interface TitleSceneProps extends SceneProps {
  title: string;
  subtitle: string;
  date: string;
}

/**
 * Title scene with news-style bold typography and animated entrance.
 */
export function TitleScene({ frame, fps, isRadar, format, title, subtitle, date }: TitleSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const logoProgress = spring({ frame, fps, delay: 0, durationFrames: 22, easing: easeOutQuart });
  const glowProgress = spring({ frame, fps, delay: 3, durationFrames: 28, easing: easeOutCubic });
  const titleProgress = spring({ frame, fps, delay: 8, durationFrames: 26, easing: easeOutCubic });
  const subtitleProgress = spring({ frame, fps, delay: 16, durationFrames: 22, easing: easeOutCubic });
  const dateProgress = spring({ frame, fps, delay: 24, durationFrames: 20, easing: easeOutCubic });
  const breathe = pulse(frame, fps, 0.8);

  return (
    <div className={`absolute inset-0 flex flex-col items-center overflow-hidden ${isMobile ? 'justify-start pt-16' : 'justify-center'}`}>
      {/* Background gradient orb */}
      <div
        className={`absolute ${isMobile ? 'w-64 h-64 top-1/4' : 'w-96 h-96'} rounded-full blur-3xl ${isRadar ? 'bg-cyan-500/10' : 'bg-stone-400/10'}`}
        style={{ opacity: glowProgress * 0.6, transform: `scale(${0.5 + glowProgress * 0.5 * breathe})` }}
      />

      {/* Decorative rings */}
      <div
        className={`absolute ${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full border ${isRadar ? 'border-cyan-500/20' : 'border-stone-400/20'}`}
        style={{ opacity: logoProgress * 0.5, transform: `scale(${0.8 + logoProgress * 0.4})` }}
      />

      {/* Logo with glow */}
      <div className="relative">
        <div
          className={`absolute inset-0 rounded-2xl blur-xl ${isRadar ? 'bg-cyan-500/40' : 'bg-stone-600/30'}`}
          style={{ opacity: glowProgress * 0.6, transform: `scale(${1.2 * breathe})` }}
        />
        <div
          className={`relative ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-2xl flex items-center justify-center shadow-2xl ${
            isRadar ? 'bg-gradient-to-br from-cyan-400 to-blue-600' : 'bg-gradient-to-br from-stone-600 to-stone-800'
          }`}
          style={{ opacity: logoProgress, transform: `scale(${0.5 + logoProgress * 0.5})` }}
        >
          <svg className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Title container */}
      <div className={`${isMobile ? 'mt-6 px-4' : 'mt-6 px-6'} text-center`}>
        {/* Subtitle badge - NEWS CATEGORY */}
        <div
          className={`mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
            isRadar ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-100 border border-red-200'
          }`}
          style={{ opacity: subtitleProgress, transform: `scale(${0.9 + subtitleProgress * 0.1})` }}
        >
          <span className={`text-[10px] font-bold tracking-wider ${isRadar ? 'text-red-400' : 'text-red-600'}`}>
            {subtitle}
          </span>
        </div>

        {/* Main Title */}
        <h1
          className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold tracking-tight leading-tight ${
            isRadar ? 'bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent' : 'text-stone-900'
          }`}
          style={{ opacity: titleProgress, transform: `translateY(${(1 - titleProgress) * 10}px)` }}
        >
          {title}
        </h1>

        {/* Date line */}
        <div
          className={`mt-3 flex items-center justify-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}
          style={{ opacity: dateProgress }}
        >
          <div className={`w-8 h-px ${isRadar ? 'bg-slate-600' : 'bg-stone-300'}`} />
          <span className={`${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>{date}</span>
          <div className={`w-8 h-px ${isRadar ? 'bg-slate-600' : 'bg-stone-300'}`} />
        </div>
      </div>

      {/* Mobile: Additional bottom element */}
      {isMobile && (
        <div
          className="absolute bottom-20 left-4 right-4"
          style={{ opacity: dateProgress, transform: `translateY(${(1 - dateProgress) * 20}px)` }}
        >
          <div className={`h-px ${isRadar ? 'bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-stone-400/30 to-transparent'}`} />
          <p className={`mt-3 text-center text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            Swipe for insights ↓
          </p>
        </div>
      )}
    </div>
  );
}
