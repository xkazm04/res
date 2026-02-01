'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { PersonIcon, WarningIcon, DueDiligenceIcon, CheckIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface LeaderProfile {
  name: string;
  role: string;
  previousCompanies: string[];
  issues?: string[];
  yearsExperience?: number;
}

interface LeadershipHistorySceneProps extends BaseSceneProps {
  leaders: LeaderProfile[];
  title?: string;
  accentColor: string;
}

/**
 * Leadership track record timeline visualization.
 * World-class visual with executive profile cards.
 */
export function LeadershipHistoryScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  leaders,
  title = 'Leadership History',
  accentColor,
}: LeadershipHistorySceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const warningProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 22, easing: easeOutCubic });
  const statsProgress = spring({ frame: sceneFrame, fps, delay: 12, durationFrames: 25, easing: easeOutQuart });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Background particles
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + (sceneFrame / fps) * 0.15;
    const radius = 200 + Math.sin((sceneFrame / fps) * 1.2 + i) * 50;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0.15 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.1,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  // Count leaders with issues
  const leadersWithIssues = leaders.filter(l => l.issues && l.issues.length > 0).length;
  const cleanLeaders = leaders.length - leadersWithIssues;
  const totalExperience = leaders.reduce((sum, l) => sum + (l.yearsExperience || 0), 0);

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

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 30% 30%, ${accentColor}12 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(244, 63, 94, 0.08) 0%, transparent 50%)`
            : `radial-gradient(ellipse at 30% 30%, ${accentColor}08 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(244, 63, 94, 0.04) 0%, transparent 50%)`,
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
              backgroundColor: accentColor,
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * headerProgress,
              filter: 'blur(1px)',
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
                backgroundColor: accentColor,
                filter: 'blur(16px)',
                opacity: 0.4 + pulse * 0.2,
                transform: `scale(${1.2 + pulse * 0.1})`,
              }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-rose-500/30 border border-rose-400/30' : 'bg-rose-100/80 border border-rose-200'
              }`}
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <DueDiligenceIcon size={isMobile ? 22 : 26} color={accentColor} />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {leaders.length} executives • {totalExperience}+ years combined
            </p>
          </div>
        </div>

        {/* Animated divider */}
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            transform: `scaleX(${headerProgress})`,
            transformOrigin: 'left',
          }}
        />
      </div>

      {/* Stats row */}
      {!isMobile && (
        <div
          className="relative z-20 flex gap-4 mb-4"
          style={{ opacity: statsProgress }}
        >
          {/* Clean leaders */}
          <div
            className={`
              flex-1 p-3 rounded-xl backdrop-blur-sm
              ${isRadar
                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-400/20'
                : 'bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-200'}
            `}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
              >
                <CheckIcon size={16} color="#22c55e" />
              </div>
              <div>
                <span className={`text-lg font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {cleanLeaders}
                </span>
                <span className={`text-xs ml-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                  Clean Records
                </span>
              </div>
            </div>
          </div>

          {/* Leaders with concerns */}
          {leadersWithIssues > 0 && (
            <div
              className={`
                flex-1 p-3 rounded-xl backdrop-blur-sm
                ${isRadar
                  ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-400/20'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200'}
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                >
                  <WarningIcon size={16} color="#f59e0b" />
                </div>
                <div>
                  <span className={`text-lg font-bold ${isRadar ? 'text-amber-400' : 'text-amber-600'}`}>
                    {leadersWithIssues}
                  </span>
                  <span className={`text-xs ml-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                    With Concerns
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning banner if issues found - mobile only */}
      {isMobile && leadersWithIssues > 0 && (
        <div
          className={`
            relative z-20 mb-4 p-3 rounded-xl flex items-center gap-3 backdrop-blur-sm
            ${isRadar ? 'bg-amber-500/10 border border-amber-400/30' : 'bg-amber-50 border border-amber-200'}
          `}
          style={{
            opacity: warningProgress,
            transform: `translateY(${(1 - warningProgress) * 10}px)`,
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              boxShadow: `0 0 ${8 + pulse * 4}px rgba(245, 158, 11, 0.3)`,
            }}
          >
            <WarningIcon size={16} color="#f59e0b" />
          </div>
          <p className={`text-sm font-medium ${isRadar ? 'text-amber-400' : 'text-amber-700'}`}>
            {leadersWithIssues} of {leaders.length} leaders have concerning history
          </p>
        </div>
      )}

      {/* Leader profiles - glassmorphism cards */}
      <div className={`relative z-20 space-y-3`}>
        {leaders.slice(0, isMobile ? 2 : 3).map((leader, i) => {
          const delay = 18 + i * 10;
          const cardProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 28, easing: easeOutQuart });
          const hasIssues = leader.issues && leader.issues.length > 0;

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm
                ${hasIssues
                  ? (isRadar
                    ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-400/30'
                    : 'bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-amber-200')
                  : (isRadar
                    ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-slate-700/50'
                    : 'bg-gradient-to-br from-white/80 to-stone-50/60 border-stone-200')}
              `}
              style={{
                opacity: cardProgress,
                transform: `translateY(${(1 - cardProgress) * 25}px)`,
                boxShadow: hasIssues
                  ? `0 4px 20px rgba(245, 158, 11, 0.1), inset 0 1px 0 ${isRadar ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)'}`
                  : `0 4px 20px rgba(0,0,0,${isRadar ? '0.2' : '0.05'}), inset 0 1px 0 ${isRadar ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)'}`,
              }}
            >
              {/* Accent glow for leaders with issues */}
              {hasIssues && (
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
                    filter: 'blur(10px)',
                    opacity: 0.5 + pulse * 0.3,
                  }}
                />
              )}

              {/* Leader info */}
              <div className="relative flex items-start gap-4">
                {/* Avatar with status ring */}
                <div className="relative flex-shrink-0">
                  {hasIssues && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: '#f59e0b',
                        filter: 'blur(8px)',
                        opacity: 0.3 + pulse * 0.2,
                        transform: `scale(1.4)`,
                      }}
                    />
                  )}
                  <div
                    className={`
                      relative w-14 h-14 rounded-full flex items-center justify-center
                      ${hasIssues
                        ? (isRadar ? 'bg-amber-500/25 border-2 border-amber-400/40' : 'bg-amber-100 border-2 border-amber-200')
                        : (isRadar ? 'bg-slate-700/80 border-2 border-slate-600/40' : 'bg-stone-100 border-2 border-stone-200')}
                    `}
                  >
                    {hasIssues ? (
                      <WarningIcon size={24} color="#f59e0b" />
                    ) : (
                      <PersonIcon size={24} color={isRadar ? '#94a3b8' : '#78716c'} />
                    )}
                  </div>

                  {/* Experience badge */}
                  {leader.yearsExperience && (
                    <div
                      className={`
                        absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-bold
                        ${isRadar ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-white text-stone-600 border border-stone-200'}
                      `}
                      style={{
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {leader.yearsExperience}y
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name and role */}
                  <div className="mb-2">
                    <span className={`text-base font-bold ${isRadar ? 'text-white' : 'text-stone-800'}`}>
                      {animateWords(leader.name, delay + 5)}
                    </span>
                    <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                      {leader.role}
                    </p>
                  </div>

                  {/* Previous companies - pills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {leader.previousCompanies.slice(0, 4).map((company, j) => {
                      const pillDelay = delay + 10 + j * 3;
                      const pillProgress = spring({ frame: sceneFrame, fps, delay: pillDelay, durationFrames: 15, easing: easeOutCubic });
                      return (
                        <span
                          key={j}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium ${
                            isRadar ? 'bg-slate-700/80 text-slate-300' : 'bg-stone-100 text-stone-600'
                          }`}
                          style={{
                            opacity: pillProgress,
                            transform: `scale(${pillProgress})`,
                          }}
                        >
                          {company}
                        </span>
                      );
                    })}
                    {leader.previousCompanies.length > 4 && (
                      <span className={`text-[10px] self-center ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                        +{leader.previousCompanies.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Issues - highlighted section */}
                  {hasIssues && (
                    <div
                      className={`p-2.5 rounded-xl ${isRadar ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-100/60 border border-amber-200'}`}
                      style={{
                        opacity: spring({ frame: sceneFrame, fps, delay: delay + 18, durationFrames: 20, easing: easeOutCubic }),
                      }}
                    >
                      {leader.issues!.slice(0, 2).map((issue, k) => (
                        <div
                          key={k}
                          className="flex items-start gap-2 mb-1.5 last:mb-0"
                        >
                          <WarningIcon size={12} color="#f59e0b" />
                          <p className={`text-[10px] leading-relaxed ${isRadar ? 'text-amber-400' : 'text-amber-700'}`}>
                            {issue.length > 55 ? issue.slice(0, 52) + '...' : issue}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* More indicator */}
      {leaders.length > (isMobile ? 2 : 3) && (
        <div
          className="relative z-20 mt-4 text-center"
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
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            +{leaders.length - (isMobile ? 2 : 3)} more executives analyzed
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
              stroke={accentColor}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0"
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48"
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48"
              fill="none"
              stroke={accentColor}
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
