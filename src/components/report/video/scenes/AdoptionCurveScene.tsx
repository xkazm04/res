'use client';

import { spring, easeOutCubic, easeOutQuart, easeInOutCubic, easeOutExpo } from '../useVideoPlayback';
import { TrendUpIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface AdoptionCurveSceneProps extends BaseSceneProps {
  technology: string;
  currentPosition: number; // 0-100, where on the S-curve
  phase: 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards';
  growthRate: number; // percentage
  timeToMainstream?: string;
  accentColor: string;
}

/**
 * S-curve adoption visualization with current position marker.
 * World-class visual with dramatic curve animation.
 */
export function AdoptionCurveScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  technology,
  currentPosition,
  phase,
  growthRate,
  timeToMainstream,
  accentColor,
}: AdoptionCurveSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const curveProgress = spring({ frame: sceneFrame, fps, delay: 10, durationFrames: 40, easing: easeInOutCubic });
  const markerProgress = spring({ frame: sceneFrame, fps, delay: 35, durationFrames: 28, easing: easeOutExpo });
  const detailsProgress = spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 25, easing: easeOutCubic });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Phase info with enhanced styling
  const phaseInfo = {
    innovators: { label: 'Innovators', range: '0-2.5%', color: '#8b5cf6', gradient: 'from-purple-500/20 to-purple-600/5' },
    early_adopters: { label: 'Early Adopters', range: '2.5-16%', color: '#06b6d4', gradient: 'from-cyan-500/20 to-cyan-600/5' },
    early_majority: { label: 'Early Majority', range: '16-50%', color: '#22c55e', gradient: 'from-emerald-500/20 to-emerald-600/5' },
    late_majority: { label: 'Late Majority', range: '50-84%', color: '#f59e0b', gradient: 'from-amber-500/20 to-amber-600/5' },
    laggards: { label: 'Laggards', range: '84-100%', color: '#64748b', gradient: 'from-slate-500/20 to-slate-600/5' },
  };

  const currentPhase = phaseInfo[phase];

  // S-curve dimensions
  const curveWidth = isMobile ? 380 : 740;
  const curveHeight = isMobile ? 190 : 250;

  // Generate S-curve path
  const generateSCurvePath = (progress: number) => {
    const points: string[] = [];
    const steps = 60;

    for (let i = 0; i <= steps * progress; i++) {
      const x = (i / steps) * curveWidth;
      const t = i / steps;
      const y = curveHeight - (1 / (1 + Math.exp(-10 * (t - 0.5)))) * curveHeight;
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }

    return points.join(' ');
  };

  // Calculate marker position
  const markerX = (currentPosition / 100) * curveWidth;
  const markerT = currentPosition / 100;
  const markerY = curveHeight - (1 / (1 + Math.exp(-10 * (markerT - 0.5)))) * curveHeight;

  // Background particles along the curve
  const particles = Array.from({ length: 12 }, (_, i) => {
    const t = ((i / 12) + (sceneFrame / fps) * 0.03) % 1;
    const x = t * curveWidth;
    const y = curveHeight - (1 / (1 + Math.exp(-10 * (t - 0.5)))) * curveHeight;
    return {
      x: 20 + x,
      y: 10 + y + Math.sin((sceneFrame / fps) * 2 + i) * 8,
      opacity: 0.15 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.1,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 50% 60%, ${currentPhase.color}15 0%, transparent 60%)`
            : `radial-gradient(ellipse at 50% 60%, ${currentPhase.color}08 0%, transparent 60%)`,
          opacity: headerProgress,
        }}
      />

      {/* Header */}
      <div
        className="relative z-20 mb-4"
        style={{ opacity: headerProgress, transform: `translateX(${(1 - headerProgress) * -30}px)` }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: accentColor, filter: 'blur(16px)', opacity: 0.4 + pulse * 0.2, transform: `scale(${1.2 + pulse * 0.1})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-cyan-500/30 border border-cyan-400/30' : 'bg-cyan-100/80 border border-cyan-200'
              }`}
              style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72 }}
            >
              <TrendUpIcon size={isMobile ? 30 : 36} color={accentColor} />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              Adoption Curve
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {technology}
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* S-Curve visualization */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
        <svg
          width={curveWidth + 60}
          height={curveHeight + 60}
          className="overflow-visible"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <filter id="curveGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid - enhanced */}
          <g opacity={0.15 * headerProgress}>
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <line
                key={i}
                x1={30 + t * curveWidth}
                y1={15}
                x2={30 + t * curveWidth}
                y2={curveHeight + 15}
                stroke={isRadar ? '#475569' : '#d6d3d1'}
                strokeDasharray="3 6"
              />
            ))}
            {[0, 0.5, 1].map((t, i) => (
              <line
                key={`h${i}`}
                x1={30}
                y1={15 + t * curveHeight}
                x2={30 + curveWidth}
                y2={15 + t * curveHeight}
                stroke={isRadar ? '#475569' : '#d6d3d1'}
                strokeDasharray="3 6"
              />
            ))}
          </g>

          {/* Phase regions - glassmorphism effect */}
          {Object.entries(phaseInfo).map(([key, info], i) => {
            const starts = [0, 0.025, 0.16, 0.5, 0.84];
            const ends = [0.025, 0.16, 0.5, 0.84, 1];
            const start = starts[i];
            const end = ends[i];
            const regionProgress = spring({ frame: sceneFrame, fps, delay: 5 + i * 3, durationFrames: 20, easing: easeOutCubic });

            return (
              <rect
                key={key}
                x={30 + start * curveWidth}
                y={15}
                width={(end - start) * curveWidth}
                height={curveHeight}
                fill={info.color}
                opacity={(key === phase ? 0.2 : 0.06) * regionProgress}
                rx={4}
              />
            );
          })}

          {/* Animated particles along curve */}
          {particles.map((p, i) => (
            <circle
              key={i}
              cx={p.x + 10}
              cy={p.y + 5}
              r={p.size}
              fill={accentColor}
              opacity={p.opacity * curveProgress}
            />
          ))}

          {/* S-curve line - with glow */}
          <g transform="translate(30, 15)">
            {/* Glow layer */}
            <path
              d={generateSCurvePath(curveProgress)}
              fill="none"
              stroke={accentColor}
              strokeWidth={8}
              strokeLinecap="round"
              opacity={0.2}
              filter="url(#curveGlow)"
            />
            {/* Main curve */}
            <path
              d={generateSCurvePath(curveProgress)}
              fill="none"
              stroke="url(#curveGradient)"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </g>

          {/* Current position marker - enhanced */}
          <g
            transform={`translate(${30 + markerX}, ${15 + markerY})`}
            opacity={markerProgress}
          >
            {/* Outer pulsing ring */}
            <circle
              r={20 + pulse * 5}
              fill="none"
              stroke={currentPhase.color}
              strokeWidth={1.5}
              opacity={0.3 - pulse * 0.15}
            />
            {/* Glow */}
            <circle r={14} fill={currentPhase.color} opacity={0.25 + pulse * 0.15} />
            {/* Marker */}
            <circle r={8} fill={currentPhase.color} stroke={isRadar ? '#1e293b' : 'white'} strokeWidth={3} />

            {/* Label with background */}
            <g transform="translate(0, -28)">
              <rect
                x={-22}
                y={-12}
                width={44}
                height={22}
                rx={11}
                fill={isRadar ? '#1e293b' : 'white'}
                opacity={0.9}
              />
              <text
                textAnchor="middle"
                y={4}
                className="text-xs font-bold"
                fill={currentPhase.color}
              >
                {currentPosition}%
              </text>
            </g>
          </g>

          {/* X-axis labels */}
          <text x={30} y={curveHeight + 40} className="text-[13px] font-medium" fill={isRadar ? '#64748b' : '#a8a29e'}>
            Early
          </text>
          <text x={curveWidth + 20} y={curveHeight + 40} className="text-[13px] font-medium" fill={isRadar ? '#64748b' : '#a8a29e'} textAnchor="end">
            Mature
          </text>
        </svg>

        {/* Phase indicator - glassmorphism */}
        <div
          className={`
            relative overflow-hidden mt-3 px-5 py-2.5 rounded-2xl backdrop-blur-sm
            bg-gradient-to-br ${currentPhase.gradient}
            ${isRadar ? 'border border-slate-700/50' : 'border border-stone-200'}
          `}
          style={{ opacity: markerProgress, transform: `translateY(${(1 - markerProgress) * 10}px)` }}
        >
          {/* Shine effect */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${isRadar ? '0.05' : '0.2'}), transparent)`,
              transform: `translateX(${-100 + (sceneFrame / fps * 30) % 200}%)`,
            }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentPhase.color, boxShadow: `0 0 8px ${currentPhase.color}60` }}
            />
            <span className="text-base font-bold" style={{ color: currentPhase.color }}>
              {currentPhase.label}
            </span>
            <span className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              ({currentPhase.range})
            </span>
          </div>
        </div>
      </div>

      {/* Details - premium cards */}
      <div
        className="relative z-20 flex justify-center gap-4 mt-4"
        style={{ opacity: detailsProgress, transform: `translateY(${(1 - detailsProgress) * 15}px)` }}
      >
        <div
          className={`
            relative overflow-hidden px-5 py-3 rounded-xl backdrop-blur-sm text-center
            ${isRadar ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white/70 border border-stone-200'}
          `}
        >
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: growthRate > 0
                ? `radial-gradient(ellipse at center, rgba(34, 197, 94, ${0.1 + pulse * 0.05}) 0%, transparent 70%)`
                : `radial-gradient(ellipse at center, rgba(239, 68, 68, ${0.1 + pulse * 0.05}) 0%, transparent 70%)`,
            }}
          />
          <p className={`relative text-3xl font-bold tabular-nums ${growthRate > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {growthRate > 0 ? '+' : ''}{growthRate}%
          </p>
          <p className={`relative text-[13px] font-medium ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>YoY Growth</p>
        </div>
        {timeToMainstream && (
          <div
            className={`
              relative overflow-hidden px-5 py-3 rounded-xl backdrop-blur-sm text-center
              ${isRadar ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white/70 border border-stone-200'}
            `}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: `radial-gradient(ellipse at center, rgba(6, 182, 212, ${0.1 + pulse * 0.05}) 0%, transparent 70%)`,
              }}
            />
            <p className={`relative text-3xl font-bold ${isRadar ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {timeToMainstream}
            </p>
            <p className={`relative text-[13px] font-medium ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>To Mainstream</p>
          </div>
        )}
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 40 L 0 8 Q 0 0 8 0 L 40 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute top-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 64 40 L 64 8 Q 64 0 56 0 L 24 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute bottom-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 24 L 0 56 Q 0 64 8 64 L 40 64" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute bottom-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 64 24 L 64 56 Q 64 64 56 64 L 24 64" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
