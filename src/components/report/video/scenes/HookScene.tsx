'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import type { BaseSceneProps } from '../configs/types';
import type { TemplateType } from '@/src/lib/videoShowcaseMockData';
import { getTemplateIcon } from '../icons';

interface HookSceneProps extends BaseSceneProps {
  hook: string;
  title: string;
  templateType: TemplateType;
  accentColor: string;
  icon: string;
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
  hook,
  title,
  templateType,
  accentColor,
}: HookSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings - carefully orchestrated reveals
  const flashProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 8, easing: easeOutExpo });
  const particleProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 45, easing: easeOutQuart });
  const ringProgress = spring({ frame: sceneFrame, fps, delay: 2, durationFrames: 35, easing: easeOutQuart });
  const iconProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 25, easing: easeOutExpo });
  const badgeProgress = spring({ frame: sceneFrame, fps, delay: 12, durationFrames: 20, easing: easeOutCubic });
  const hookProgress = spring({ frame: sceneFrame, fps, delay: 18, durationFrames: 35, easing: easeOutCubic });
  const lineProgress = spring({ frame: sceneFrame, fps, delay: 35, durationFrames: 25, easing: easeOutCubic });
  const titleProgress = spring({ frame: sceneFrame, fps, delay: 45, durationFrames: 22, easing: easeOutCubic });
  const glowPulse = spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 30, easing: easeOutCubic });

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

  // Generate particle positions
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2 + time * 0.3;
    const radius = 150 + Math.sin(i * 1.5 + time * 2) * 50;
    const size = 2 + Math.sin(i * 2 + time * 3) * 1.5;
    return {
      x: Math.cos(angle) * radius * (isMobile ? 0.6 : 1),
      y: Math.sin(angle) * radius * (isMobile ? 0.6 : 1),
      size,
      opacity: 0.3 + Math.sin(i + time * 2) * 0.2,
    };
  });

  // Split hook text for animated reveal
  const hookWords = hook.split(' ');
  const wordsPerLine = isMobile ? 4 : 6;
  const lines: string[][] = [];
  for (let i = 0; i < hookWords.length; i += wordsPerLine) {
    lines.push(hookWords.slice(i, i + wordsPerLine));
  }

  return (
    <div className={`absolute inset-0 flex flex-col items-center overflow-hidden ${isMobile ? 'justify-start pt-16' : 'justify-center'}`}>
      {/* Cinematic letterbox bars for desktop */}
      {!isMobile && (
        <>
          <div
            className="absolute top-0 left-0 right-0 z-20"
            style={{
              height: 40,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 z-20"
            style={{
              height: 40,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            }}
          />
        </>
      )}

      {/* Initial dramatic flash */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(circle at 50% ${isMobile ? '25%' : '50%'}, ${accentColor} 0%, white 30%, transparent 60%)`,
          opacity: (1 - flashProgress) * 0.7,
          mixBlendMode: 'screen',
        }}
      />

      {/* Dynamic gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse 80% 50% at 50% ${isMobile ? '30%' : '50%'}, ${accentColor}20 0%, transparent 50%),
               radial-gradient(ellipse 60% 80% at 20% 80%, ${accentColor}10 0%, transparent 40%),
               radial-gradient(ellipse 60% 80% at 80% 20%, ${accentColor}08 0%, transparent 40%)`
            : `radial-gradient(ellipse 80% 50% at 50% ${isMobile ? '30%' : '50%'}, ${accentColor}15 0%, transparent 50%)`,
          opacity: ringProgress,
        }}
      />

      {/* Animated particle field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute"
          style={{
            left: '50%',
            top: isMobile ? '25%' : '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: accentColor,
                left: p.x,
                top: p.y,
                opacity: p.opacity * particleProgress,
                boxShadow: `0 0 ${p.size * 2}px ${accentColor}`,
              }}
            />
          ))}
        </div>
      </div>

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
              width: (isMobile ? 80 : 120) * scale,
              height: (isMobile ? 80 : 120) * scale,
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

      {/* Central icon with dramatic reveal */}
      <div className="relative z-10">
        {/* Multi-layer glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: isMobile ? 140 : 200,
            height: isMobile ? 140 : 200,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${breathe})`,
            background: `radial-gradient(circle, ${accentColor}60 0%, ${accentColor}20 40%, transparent 70%)`,
            opacity: iconProgress * 0.8,
            filter: 'blur(30px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: isMobile ? 100 : 140,
            height: isMobile ? 100 : 140,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${1 + pulse * 0.05})`,
            background: `radial-gradient(circle, ${accentColor}80 0%, transparent 60%)`,
            opacity: glowPulse * 0.6,
            filter: 'blur(15px)',
          }}
        />

        {/* Icon container with glassmorphism */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: isMobile ? 80 : 110,
            height: isMobile ? 80 : 110,
            opacity: iconProgress,
            transform: `scale(${0.3 + iconProgress * 0.7})`,
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
          <TemplateIcon size={isMobile ? 40 : 54} color={accentColor} />
        </div>
      </div>

      {/* Template type badge with premium styling */}
      <div
        className="relative mt-5 z-10"
        style={{
          opacity: badgeProgress,
          transform: `translateY(${(1 - badgeProgress) * 20}px) scale(${0.8 + badgeProgress * 0.2})`,
        }}
      >
        <div
          className="px-5 py-2 rounded-full font-black tracking-[0.2em] text-xs"
          style={{
            background: isRadar
              ? `linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))`
              : `linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 245, 244, 0.9))`,
            color: accentColor,
            border: `1px solid ${accentColor}40`,
            boxShadow: `0 4px 20px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          {getTemplateEmphasis()}
        </div>
      </div>

      {/* Hook text with word-by-word animation */}
      <div className={`${isMobile ? 'mt-8 px-5' : 'mt-10 px-8'} text-center max-w-3xl z-10`}>
        <div className="space-y-1">
          {lines.map((lineWords, lineIdx) => (
            <p
              key={lineIdx}
              className={`
                font-black leading-tight
                ${isMobile ? 'text-[1.6rem]' : 'text-[2.5rem]'}
                ${isRadar ? 'text-white' : 'text-stone-900'}
              `}
              style={{
                letterSpacing: '-0.02em',
              }}
            >
              {lineWords.map((word, wordIdx) => {
                const globalIdx = lineIdx * wordsPerLine + wordIdx;
                const wordDelay = 18 + globalIdx * 2;
                const wordProgress = spring({ frame: sceneFrame, fps, delay: wordDelay, durationFrames: 20, easing: easeOutCubic });

                return (
                  <span
                    key={wordIdx}
                    className="inline-block mr-2"
                    style={{
                      opacity: wordProgress,
                      transform: `translateY(${(1 - wordProgress) * 20}px)`,
                      textShadow: isRadar ? `0 0 40px ${accentColor}40` : 'none',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          ))}
        </div>

        {/* Animated accent line with gradient */}
        <div className="relative mx-auto mt-8 overflow-hidden" style={{ width: isMobile ? 120 : 200, height: 3 }}>
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

        {/* Title with subtle animation */}
        <h2
          className={`
            mt-6 font-medium tracking-wide
            ${isMobile ? 'text-sm' : 'text-lg'}
            ${isRadar ? 'text-slate-400' : 'text-stone-500'}
          `}
          style={{
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 15}px)`,
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Premium corner accents - desktop */}
      {!isMobile && (
        <>
          {/* Top left */}
          <div className="absolute top-8 left-8" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path
                d="M0 30 L0 0 L30 0"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60 - lineProgress * 60,
                }}
              />
              <circle cx="0" cy="0" r="3" fill={accentColor} />
            </svg>
          </div>
          {/* Top right */}
          <div className="absolute top-8 right-8" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path
                d="M30 0 L60 0 L60 30"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60 - lineProgress * 60,
                }}
              />
              <circle cx="60" cy="0" r="3" fill={accentColor} />
            </svg>
          </div>
          {/* Bottom left */}
          <div className="absolute bottom-8 left-8" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path
                d="M0 30 L0 60 L30 60"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60 - lineProgress * 60,
                }}
              />
              <circle cx="0" cy="60" r="3" fill={accentColor} />
            </svg>
          </div>
          {/* Bottom right */}
          <div className="absolute bottom-8 right-8" style={{ opacity: lineProgress * 0.6 }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path
                d="M60 30 L60 60 L30 60"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60 - lineProgress * 60,
                }}
              />
              <circle cx="60" cy="60" r="3" fill={accentColor} />
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

      {/* Mobile scroll indicator */}
      {isMobile && (
        <div
          className="absolute bottom-16 left-0 right-0 flex flex-col items-center z-10"
          style={{ opacity: titleProgress * 0.4 }}
        >
          <div
            className="w-1 h-8 rounded-full overflow-hidden"
            style={{
              backgroundColor: isRadar ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
          >
            <div
              className="w-full rounded-full"
              style={{
                height: '40%',
                backgroundColor: accentColor,
                animation: 'bounce 1.5s ease-in-out infinite',
                transform: `translateY(${Math.sin(time * 4) * 100}%)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
