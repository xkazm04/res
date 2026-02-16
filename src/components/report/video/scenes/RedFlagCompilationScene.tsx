'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';
import { DueDiligenceIcon, CriticalIcon, WarningIcon, InfoIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';
import { spreadEntrance } from '@/src/lib/animation/motion';

interface RedFlag {
  flag: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  evidence?: string;
}

interface RedFlagCompilationSceneProps extends BaseSceneProps {
  flags: RedFlag[];
  title?: string;
  accentColor: string;
}

/**
 * Red flags compilation with visual risk radar and animated cards.
 * Enhanced visualization for Due Diligence template.
 */
export function RedFlagCompilationScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  flags,
  title = 'Red Flags Identified',
  accentColor,
}: RedFlagCompilationSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 20, easing: easeOutCubic });
  const radarProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 35, easing: easeOutQuart });
  const cardsProgress = spring({ frame: sceneFrame, fps, delay: 15, durationFrames: 25, easing: easeOutCubic });

  // Proportional stagger delays for dots and cards
  const getDotDelay = spreadEntrance(sceneDuration, Math.min(8, flags.length), { startPct: 0.05, endPct: 0.65 });
  const getCardDelay = spreadEntrance(sceneDuration, isMobile ? 3 : 4, { startPct: 0.05, endPct: 0.65 });

  // Sort flags by severity
  const severityOrder = ['critical', 'high', 'medium', 'low'] as const;
  const sortedFlags = [...flags].sort((a, b) =>
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  // Count by severity
  const severityCounts = {
    critical: flags.filter(f => f.severity === 'critical').length,
    high: flags.filter(f => f.severity === 'high').length,
    medium: flags.filter(f => f.severity === 'medium').length,
    low: flags.filter(f => f.severity === 'low').length,
  };

  // Calculate risk score (weighted)
  const riskScore = Math.min(100,
    severityCounts.critical * 25 +
    severityCounts.high * 15 +
    severityCounts.medium * 8 +
    severityCounts.low * 3
  );

  // Severity colors
  const severityColors = {
    critical: { main: '#ef4444', bg: isRadar ? 'bg-red-500/15' : 'bg-red-50', text: isRadar ? 'text-red-400' : 'text-red-700' },
    high: { main: '#f97316', bg: isRadar ? 'bg-orange-500/15' : 'bg-orange-50', text: isRadar ? 'text-orange-400' : 'text-orange-700' },
    medium: { main: '#f59e0b', bg: isRadar ? 'bg-amber-500/15' : 'bg-amber-50', text: isRadar ? 'text-amber-400' : 'text-amber-700' },
    low: { main: '#64748b', bg: isRadar ? 'bg-slate-500/15' : 'bg-slate-100', text: isRadar ? 'text-slate-400' : 'text-slate-600' },
  };

  // Risk level
  const getRiskLevel = () => {
    if (riskScore > 60) return { label: 'HIGH RISK', color: '#ef4444', Icon: CriticalIcon };
    if (riskScore > 30) return { label: 'MODERATE', color: '#f59e0b', Icon: WarningIcon };
    return { label: 'LOW RISK', color: '#22c55e', Icon: InfoIcon };
  };
  const riskLevel = getRiskLevel();

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // SVG dimensions for radar
  const radarSize = isMobile ? 200 : 260;
  const radarCenter = radarSize / 2;

  return (
    <div className={`absolute inset-0 ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>
      {/* Header */}
      <div
        className="mb-4"
        style={{
          opacity: headerProgress,
          transform: `translateX(${(1 - headerProgress) * -20}px)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center rounded-lg ${
              isRadar ? 'bg-rose-500/20' : 'bg-rose-100'
            }`}
            style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64 }}
          >
            <DueDiligenceIcon size={isMobile ? 28 : 34} color="#f43f5e" />
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-500' : 'text-stone-500'}`}>
              {flags.length} issues detected
            </p>
          </div>
        </div>
      </div>

      {/* Main content - Risk radar + Cards side by side */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'gap-6'}`}>
        {/* Risk Radar Visualization */}
        <div
          className={`flex-shrink-0 flex flex-col items-center ${isMobile ? '' : 'w-[280px]'}`}
          style={{ opacity: radarProgress }}
        >
          <svg
            width={radarSize}
            height={radarSize}
            className="overflow-visible"
          >
            {/* Background rings */}
            {[0.3, 0.5, 0.7, 0.9].map((scale, i) => (
              <circle
                key={i}
                cx={radarCenter}
                cy={radarCenter}
                r={radarCenter * scale * radarProgress}
                fill="none"
                stroke={isRadar ? '#334155' : '#e7e5e4'}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}

            {/* Risk zone fills */}
            <circle
              cx={radarCenter}
              cy={radarCenter}
              r={radarCenter * 0.9 * radarProgress}
              fill={isRadar ? '#22c55e10' : '#22c55e08'}
            />
            <circle
              cx={radarCenter}
              cy={radarCenter}
              r={radarCenter * 0.6 * radarProgress}
              fill={isRadar ? '#f59e0b15' : '#f59e0b10'}
            />
            <circle
              cx={radarCenter}
              cy={radarCenter}
              r={radarCenter * 0.3 * radarProgress}
              fill={isRadar ? '#ef444420' : '#ef444415'}
            />

            {/* Risk indicator needle */}
            {radarProgress > 0.5 && (
              <g transform={`translate(${radarCenter}, ${radarCenter})`}>
                {/* Needle glow */}
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={-(radarCenter * 0.75 * (riskScore / 100))}
                  stroke={riskLevel.color}
                  strokeWidth={6}
                  strokeLinecap="round"
                  opacity={0.3 + pulse * 0.3}
                  style={{ filter: 'blur(4px)' }}
                  transform={`rotate(${-90 + (riskScore / 100) * 180})`}
                />
                {/* Needle */}
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={-(radarCenter * 0.75 * (riskScore / 100))}
                  stroke={riskLevel.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  transform={`rotate(${-90 + (riskScore / 100) * 180})`}
                />
                {/* Center dot */}
                <circle r={8} fill={riskLevel.color} />
                <circle r={4} fill="#fff" />
              </g>
            )}

            {/* Severity dots around the radar */}
            {sortedFlags.slice(0, 8).map((flag, i) => {
              const angle = (i / Math.min(8, flags.length)) * Math.PI * 2 - Math.PI / 2;
              const distanceRatio = flag.severity === 'critical' ? 0.25 :
                                    flag.severity === 'high' ? 0.45 :
                                    flag.severity === 'medium' ? 0.65 : 0.85;
              const distance = radarCenter * distanceRatio;
              const x = radarCenter + Math.cos(angle) * distance;
              const y = radarCenter + Math.sin(angle) * distance;
              const dotDelay = getDotDelay(i);
              const dotProgress = spring({ frame: sceneFrame, fps, delay: dotDelay, durationFrames: 20, easing: easeOutQuart });
              const color = severityColors[flag.severity].main;

              return (
                <g key={i}>
                  {/* Dot glow */}
                  <circle
                    cx={x}
                    cy={y}
                    r={10 * dotProgress}
                    fill={color}
                    opacity={0.3 + (flag.severity === 'critical' ? pulse * 0.3 : 0)}
                    style={{ filter: 'blur(4px)' }}
                  />
                  {/* Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={5 * dotProgress}
                    fill={color}
                  />
                </g>
              );
            })}
          </svg>

          {/* Risk Score */}
          <div className="text-center mt-2">
            <div className="flex items-center justify-center gap-2">
              <riskLevel.Icon size={18} color={riskLevel.color} />
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: riskLevel.color }}
              >
                {Math.round(riskScore * radarProgress)}
              </span>
            </div>
            <span
              className="text-[13px] font-bold tracking-wider"
              style={{ color: riskLevel.color }}
            >
              {riskLevel.label}
            </span>
          </div>

          {/* Severity Legend */}
          <div className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-1`}>
            {(severityOrder as readonly ('critical' | 'high' | 'medium' | 'low')[]).map(sev => (
              severityCounts[sev] > 0 && (
                <div key={sev} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: severityColors[sev].main }}
                  />
                  <span className={`text-xs capitalize ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                    {sev}: {severityCounts[sev]}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Flag Cards */}
        <div
          className="flex-1 space-y-2.5"
          style={{ opacity: cardsProgress }}
        >
          {sortedFlags.slice(0, isMobile ? 3 : 4).map((flag, i) => {
            const cardDelay = getCardDelay(i);
            const cardProgress = spring({ frame: sceneFrame, fps, delay: cardDelay, durationFrames: 25, easing: easeOutQuart });
            const colors = severityColors[flag.severity];

            return (
              <div
                key={i}
                className={`
                  relative overflow-hidden rounded-xl border p-3.5
                  ${colors.bg}
                  ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}
                `}
                style={{
                  opacity: cardProgress,
                  transform: `translateX(${(1 - cardProgress) * 30}px)`,
                }}
              >
                {/* Severity accent line */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: colors.main }}
                />

                {/* Pulse effect for critical */}
                {flag.severity === 'critical' && (
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      backgroundColor: colors.main,
                      opacity: pulse * 0.05,
                    }}
                  />
                )}

                <div className="flex items-start gap-3 pl-2">
                  {/* Severity icon */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.main}20` }}
                  >
                    {flag.severity === 'critical' ? (
                      <CriticalIcon size={20} color={colors.main} />
                    ) : flag.severity === 'high' ? (
                      <WarningIcon size={20} color={colors.main} />
                    ) : (
                      <InfoIcon size={20} color={colors.main} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-base font-semibold ${colors.text}`}>
                        {flag.flag.length > 35 ? flag.flag.slice(0, 32) + '...' : flag.flag}
                      </h4>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: colors.main }}
                      >
                        {flag.severity}
                      </span>
                    </div>
                    {flag.evidence && (
                      <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                        {flag.evidence.length > 60 ? flag.evidence.slice(0, 57) + '...' : flag.evidence}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* More indicator */}
          {flags.length > (isMobile ? 3 : 4) && (
            <div
              className={`text-center py-2 text-sm ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}
              style={{
                opacity: spring({ frame: sceneFrame, fps, delay: 55, durationFrames: 20, easing: easeOutCubic }),
              }}
            >
              +{flags.length - (isMobile ? 3 : 4)} more issues identified
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
