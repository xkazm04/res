'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { impactShake, scalePunch, bounceIn, spreadEntrance } from '@/src/lib/animation/motion';
import { KineticText } from '../primitives/KineticText';
import type { BaseSceneProps } from '../configs/types';
import type { TemplateType } from '@/src/lib/videoShowcaseMockData';
import { getTemplateIcon } from '../icons';

interface HookSceneProps extends BaseSceneProps {
  hook: string;
  title: string;
  templateType: TemplateType;
  accentColor: string;
  icon: string;
  variant?: 'centered' | 'editorial' | 'cinematic';
}

/**
 * Cinematic opening hook scene with dramatic reveals.
 * Optimized for social media impact with bold typography and dynamic animations.
 */
export function HookScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  hook,
  title,
  templateType,
  accentColor,
  variant = 'centered',
}: HookSceneProps) {
  const isMobile = format === 'mobile';

  // Proportional delays for main elements (flash, ring, icon, badge, hookText, line, title, glow)
  const getDelay = spreadEntrance(sceneDuration, 8, { startPct: 0.05, endPct: 0.65 });

  // Animation timings — carefully orchestrated reveals
  const flashProgress = spring({ frame: sceneFrame, fps, delay: getDelay(0), durationFrames: 8, easing: easeOutExpo });
  const ringProgress = spring({ frame: sceneFrame, fps, delay: getDelay(1), durationFrames: 35, easing: easeOutQuart });
  const lineProgress = spring({ frame: sceneFrame, fps, delay: getDelay(5), durationFrames: 25, easing: easeOutCubic });
  const glowPulse = spring({ frame: sceneFrame, fps, delay: getDelay(7), durationFrames: 30, easing: easeOutCubic });

  // New motion primitives for punch
  const iconScale = scalePunch(sceneFrame, getDelay(2), { overshoot: 1.22, durationFrames: 18 });
  const iconOpacity = spring({ frame: sceneFrame, fps, delay: getDelay(2), durationFrames: 10, easing: easeOutExpo });
  const badgeBounce = bounceIn(sceneFrame, fps, { delay: getDelay(3), durationFrames: 18, overshoot: 0.18 });

  // Camera shake on entry
  const shake = impactShake(sceneFrame, 0, { intensity: 3, decayFrames: 10, frequency: 8 });

  // Dynamic effects
  const time = sceneFrame / fps;
  const breathe = 1 + Math.sin(time * Math.PI * 0.6) * 0.03;
  const pulse = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;
  const slowPulse = Math.sin(time * Math.PI * 0.8) * 0.5 + 0.5;

  // Get template icon
  const TemplateIcon = getTemplateIcon(templateType);

  // Template emphasis text
  const getTemplateEmphasis = () => {
    const emphases: Record<TemplateType, string> = {
      investigative: 'INVESTIGATION',
      financial: 'ANALYSIS',
      competitive: 'BATTLE REPORT',
      legal: 'LEGAL IMPACT',
      tech_market: 'MARKET INTEL',
      contract: 'CONTRACT REVIEW',
      understanding: 'DEEP DIVE',
      due_diligence: 'DUE DILIGENCE',
    };
    return emphases[templateType] || 'ANALYSIS';
  };

  // ── Editorial variant ──
  if (variant === 'editorial') {
    return (
      <div
        className={`absolute inset-0 flex flex-col overflow-hidden ${isMobile ? 'p-6 pt-14' : 'p-10'}`}
        style={{ transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)` }}
      >
        {/* Flash */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `radial-gradient(circle at 20% 30%, ${accentColor} 0%, transparent 50%)`,
            opacity: (1 - flashProgress) * 0.5,
            mixBlendMode: 'screen',
          }}
        />

        {/* Left accent line */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10"
          style={{
            width: 4,
            background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`,
            opacity: lineProgress,
          }}
        />

        {/* Small icon top-right */}
        <div
          className="absolute z-10"
          style={{
            top: isMobile ? 14 : 24,
            right: isMobile ? 16 : 28,
            opacity: iconOpacity,
            transform: `scale(${iconScale * 0.6})`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 56,
              height: 56,
              background: isRadar
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 250, 249, 0.9))',
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 0 20px ${accentColor}30`,
            }}
          >
            <TemplateIcon size={28} color={accentColor} />
          </div>
        </div>

        {/* Hook text — left-aligned, large */}
        <div className="flex-1 flex flex-col justify-center z-10 max-w-[85%]">
          <KineticText
            text={hook}
            mode="letter-burst"
            frame={sceneFrame}
            fps={fps}
            startFrame={18}
            accentColor={accentColor}
            staggerFrames={1}
            className={`
              font-black leading-tight
              ${isMobile ? 'text-[3rem]' : 'text-[4.5rem]'}
              ${isRadar ? 'text-white' : 'text-stone-900'}
            `}
          />

          {/* Title as smaller caption */}
          <div className="mt-4">
            <KineticText
              text={title}
              mode="gradient-sweep"
              frame={sceneFrame}
              fps={fps}
              startFrame={45}
              accentColor={accentColor}
              className={`
                font-medium tracking-wide ${isMobile ? 'text-sm' : 'text-base'}
                ${isRadar ? 'text-slate-500' : 'text-stone-400'}
              `}
            />
          </div>
        </div>

        {/* Scanline */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${isRadar ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} 2px, ${isRadar ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} 4px)`,
            opacity: 0.5,
          }}
        />
      </div>
    );
  }

  // ── Cinematic variant ──
  if (variant === 'cinematic') {
    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden ${isMobile ? 'px-6' : 'px-10'}`}
        style={{ transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)` }}
      >
        {/* Stronger flash on enter */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, white 0%, ${accentColor} 20%, transparent 50%)`,
            opacity: (1 - flashProgress) * 0.9,
            mixBlendMode: 'screen',
          }}
        />

        {/* Hook text — massive centered */}
        <div className="text-center max-w-full z-10">
          <KineticText
            text={hook}
            mode="letter-burst"
            frame={sceneFrame}
            fps={fps}
            startFrame={14}
            accentColor={accentColor}
            staggerFrames={1}
            className={`
              font-black leading-none
              ${isMobile ? 'text-[3.5rem]' : 'text-[5rem]'}
              ${isRadar ? 'text-white' : 'text-stone-900'}
            `}
          />
        </div>

        {/* Tiny title overlay bottom-left */}
        <div
          className="absolute z-10"
          style={{
            bottom: isMobile ? 20 : 28,
            left: isMobile ? 20 : 32,
            opacity: lineProgress,
          }}
        >
          <KineticText
            text={title}
            mode="gradient-sweep"
            frame={sceneFrame}
            fps={fps}
            startFrame={45}
            accentColor={accentColor}
            className={`
              font-medium tracking-widest uppercase
              ${isMobile ? 'text-xs' : 'text-sm'}
              ${isRadar ? 'text-slate-500' : 'text-stone-400'}
            `}
          />
        </div>

        {/* Scanline */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${isRadar ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} 2px, ${isRadar ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} 4px)`,
            opacity: 0.5,
          }}
        />
      </div>
    );
  }

  // ── Centered variant (default) ──
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center overflow-hidden ${isMobile ? 'justify-start pt-16' : 'justify-center'}`}
      style={{
        transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)`,
      }}
    >

      {/* Initial dramatic flash */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(circle at 50% ${isMobile ? '25%' : '50%'}, ${accentColor} 0%, white 30%, transparent 60%)`,
          opacity: (1 - flashProgress) * 0.7,
          mixBlendMode: 'screen',
        }}
      />

      {/* Orbital rings with glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: isMobile ? '25%' : '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {[1, 1.4, 1.8, 2.2].map((scale, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: (isMobile ? 120 : 180) * scale,
              height: (isMobile ? 120 : 180) * scale,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${0.8 + ringProgress * 0.3}) rotate(${time * (15 - i * 3)}deg)`,
              border: `1px solid ${accentColor}`,
              borderRadius: '50%',
              opacity: ringProgress * (0.4 - i * 0.08) * (1 + slowPulse * 0.2),
              boxShadow: i === 0 ? `0 0 20px ${accentColor}40, inset 0 0 20px ${accentColor}20` : 'none',
            }}
          />
        ))}
      </div>

      {/* Central icon with dramatic punch entrance */}
      <div className="relative z-10">
        {/* Multi-layer glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: isMobile ? 200 : 280,
            height: isMobile ? 200 : 280,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${breathe})`,
            background: `radial-gradient(circle, ${accentColor}60 0%, ${accentColor}20 40%, transparent 70%)`,
            opacity: iconOpacity * 0.8,
            filter: 'blur(30px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: isMobile ? 140 : 200,
            height: isMobile ? 140 : 200,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${1 + pulse * 0.05})`,
            background: `radial-gradient(circle, ${accentColor}80 0%, transparent 60%)`,
            opacity: glowPulse * 0.6,
            filter: 'blur(15px)',
          }}
        />

        {/* Icon container with glassmorphism — uses scalePunch for overshoot */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: isMobile ? 110 : 150,
            height: isMobile ? 110 : 150,
            opacity: iconOpacity,
            transform: `scale(${iconScale})`,
            background: isRadar
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 250, 249, 0.9))',
            boxShadow: `
              0 0 60px ${accentColor}40,
              0 0 100px ${accentColor}20,
              inset 0 1px 0 rgba(255,255,255,0.2),
              0 20px 40px rgba(0,0,0,0.3)
            `,
            border: `2px solid ${accentColor}60`,
          }}
        >
          <TemplateIcon size={isMobile ? 56 : 72} color={accentColor} />
        </div>
      </div>

      {/* Template type badge with bounce entrance */}
      <div
        className="relative mt-5 z-10"
        style={{
          opacity: Math.min(badgeBounce * 2, 1),
          transform: `translateY(${(1 - Math.min(badgeBounce, 1)) * 20}px) scale(${0.8 + Math.min(badgeBounce, 1) * 0.2 + (badgeBounce > 1 ? (badgeBounce - 1) * 0.5 : 0)})`,
        }}
      >
        <div
          className="px-5 py-2 rounded-full font-black tracking-[0.2em] text-sm"
          style={{
            background: isRadar
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 245, 244, 0.9))',
            color: accentColor,
            border: `1px solid ${accentColor}40`,
            boxShadow: `0 4px 20px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          {getTemplateEmphasis()}
        </div>
      </div>

      {/* Hook text — letter-burst kinetic animation */}
      <div className={`${isMobile ? 'mt-10 px-6' : 'mt-12 px-10'} text-center max-w-3xl z-10`}>
        <KineticText
          text={hook}
          mode="letter-burst"
          frame={sceneFrame}
          fps={fps}
          startFrame={getDelay(4)}
          accentColor={accentColor}
          staggerFrames={1}
          className={`
            font-black leading-tight
            ${isMobile ? 'text-[2.2rem]' : 'text-[3.5rem]'}
            ${isRadar ? 'text-white' : 'text-stone-900'}
          `}
        />

        {/* Animated accent line with gradient */}
        <div className="relative mx-auto mt-8 overflow-hidden" style={{ width: isMobile ? 160 : 280, height: 3 }}>
          <div
            className="absolute inset-y-0"
            style={{
              left: `${50 - lineProgress * 50}%`,
              right: `${50 - lineProgress * 50}%`,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              borderRadius: 2,
              boxShadow: `0 0 20px ${accentColor}80`,
            }}
          />
        </div>

        {/* Title with gradient-sweep */}
        <div className={`mt-8 ${isMobile ? 'text-base' : 'text-xl'}`}>
          <KineticText
            text={title}
            mode="gradient-sweep"
            frame={sceneFrame}
            fps={fps}
            startFrame={getDelay(6)}
            accentColor={accentColor}
            className={`
              font-medium tracking-wide
              ${isRadar ? 'text-slate-400' : 'text-stone-500'}
            `}
          />
        </div>
      </div>

      {/* Premium corner accents — desktop */}
      {!isMobile && (
        <>
          <div className="absolute top-10 left-10" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <path d="M0 40 L0 0 L40 0" fill="none" stroke={accentColor} strokeWidth="2"
                style={{ strokeDasharray: 80, strokeDashoffset: 80 - lineProgress * 80 }} />
              <circle cx="0" cy="0" r="4" fill={accentColor} />
            </svg>
          </div>
          <div className="absolute top-10 right-10" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <path d="M40 0 L80 0 L80 40" fill="none" stroke={accentColor} strokeWidth="2"
                style={{ strokeDasharray: 80, strokeDashoffset: 80 - lineProgress * 80 }} />
              <circle cx="80" cy="0" r="4" fill={accentColor} />
            </svg>
          </div>
          <div className="absolute bottom-10 left-10" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <path d="M0 40 L0 80 L40 80" fill="none" stroke={accentColor} strokeWidth="2"
                style={{ strokeDasharray: 80, strokeDashoffset: 80 - lineProgress * 80 }} />
              <circle cx="0" cy="80" r="4" fill={accentColor} />
            </svg>
          </div>
          <div className="absolute bottom-10 right-10" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <path d="M80 40 L80 80 L40 80" fill="none" stroke={accentColor} strokeWidth="2"
                style={{ strokeDasharray: 80, strokeDashoffset: 80 - lineProgress * 80 }} />
              <circle cx="80" cy="80" r="4" fill={accentColor} />
            </svg>
          </div>
        </>
      )}

      {/* Subtle scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${isRadar ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} 2px,
            ${isRadar ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} 4px
          )`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}
