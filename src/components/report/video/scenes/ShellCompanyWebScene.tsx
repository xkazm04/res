'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { NetworkDiagram, type NetworkNode, type NetworkEdge } from '../primitives';
import { WebIcon, WarningIcon, PersonIcon, FlagIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface ShellEntity {
  name: string;
  type: 'company' | 'person' | 'offshore' | 'unknown';
  suspicious?: boolean;
}

interface ShellConnection {
  from: string;
  to: string;
  relationship: string;
  hidden?: boolean;
}

interface ShellCompanyWebSceneProps extends BaseSceneProps {
  entities: ShellEntity[];
  connections: ShellConnection[];
  title?: string;
  accentColor: string;
}

/**
 * Shell company network visualization showing ownership structures.
 * World-class visual with dramatic web reveal.
 */
export function ShellCompanyWebScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  entities,
  connections,
  title = 'Ownership Structure',
  accentColor,
}: ShellCompanyWebSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const legendProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 20, easing: easeOutCubic });
  const networkProgress = spring({ frame: sceneFrame, fps, delay: 10, durationFrames: 38, easing: easeOutExpo });
  const statsProgress = spring({ frame: sceneFrame, fps, delay: 45, durationFrames: 25, easing: easeOutQuart });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Scanning line effect for investigation feel
  const scanY = ((sceneFrame / fps) * 60) % 400;

  // Background particles - web strands
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 + (sceneFrame / fps) * 0.08;
    const radius = 140 + Math.sin((sceneFrame / fps) * 1.2 + i * 0.8) * 50;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.6,
      opacity: 0.08 + Math.sin((sceneFrame / fps) * 2 + i * 0.3) * 0.05,
      size: 1.5 + Math.sin((sceneFrame / fps) + i) * 0.5,
    };
  });

  // Convert to network nodes
  const nodes: NetworkNode[] = entities.map((entity) => ({
    id: entity.name,
    label: entity.name.split(' ')[0],
    type: entity.suspicious ? 'warning' :
          entity.type === 'offshore' ? 'highlight' :
          entity.type === 'person' ? 'primary' : 'secondary',
  }));

  // Convert to network edges
  const edges: NetworkEdge[] = connections.map(conn => ({
    from: conn.from,
    to: conn.to,
    label: conn.relationship.length > 10 ? conn.relationship.slice(0, 8) + '...' : conn.relationship,
    type: conn.hidden ? 'hidden' : 'normal',
  }));

  // Count suspicious entities
  const suspiciousCount = entities.filter(e => e.suspicious).length;
  const offshoreCount = entities.filter(e => e.type === 'offshore').length;
  const hiddenLinks = connections.filter(c => c.hidden).length;

  // Network dimensions
  const networkWidth = isMobile ? 300 : 700;
  const networkHeight = isMobile ? 220 : 300;

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-4 pt-8' : 'p-6'}`}>
      {/* Cinematic letterbox */}
      {!isMobile && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
        </>
      )}

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 50% 40%, ${accentColor}12 0%, transparent 60%)`
            : `radial-gradient(ellipse at 50% 40%, ${accentColor}06 0%, transparent 60%)`,
          opacity: headerProgress,
        }}
      />

      {/* Scanning line effect */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none z-30"
        style={{
          top: `${scanY}px`,
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
          opacity: networkProgress * 0.5,
          boxShadow: `0 0 20px ${accentColor}30`,
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
        style={{ opacity: headerProgress, transform: `translateX(${(1 - headerProgress) * -30}px)` }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: '#f59e0b', filter: 'blur(16px)', opacity: 0.4 + pulse * 0.2, transform: `scale(${1.2 + pulse * 0.1})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-amber-500/30 border border-amber-400/30' : 'bg-amber-100/80 border border-amber-200'
              }`}
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <WebIcon size={isMobile ? 22 : 26} color="#f59e0b" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {entities.length} entities, {connections.length} connections
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, #f59e0b, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Legend - glassmorphism */}
      <div
        className={`
          relative z-20 inline-flex flex-wrap gap-4 mb-4 p-3 rounded-xl backdrop-blur-sm
          ${isRadar ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/60 border border-stone-200'}
        `}
        style={{ opacity: legendProgress, transform: `translateY(${(1 - legendProgress) * 10}px)` }}
      >
        {[
          { Icon: PersonIcon, label: 'Person', color: isRadar ? '#22d3ee' : '#0ea5e9' },
          { Icon: WarningIcon, label: 'Offshore', color: '#f59e0b' },
          { Icon: FlagIcon, label: 'Suspicious', color: '#ef4444' },
        ].map((item, i) => {
          const itemProgress = spring({ frame: sceneFrame, fps, delay: 8 + i * 3, durationFrames: 15, easing: easeOutCubic });
          return (
            <div key={item.label} className="flex items-center gap-2" style={{ opacity: itemProgress }}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: item.color, filter: 'blur(4px)', opacity: 0.4 }} />
                <item.Icon size={14} color={item.color} />
              </div>
              <span className={`text-[11px] font-medium ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Network visualization */}
      <div
        className="relative z-20 flex justify-center"
        style={{ opacity: networkProgress, transform: `scale(${0.9 + networkProgress * 0.1})` }}
      >
        {/* Network glow effect */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at center, ${accentColor}10 0%, transparent 50%)`,
            filter: 'blur(30px)',
            transform: `scale(${1.1 + pulse * 0.05})`,
          }}
        />
        <NetworkDiagram
          nodes={nodes}
          edges={edges}
          frame={sceneFrame - 10}
          fps={fps}
          isRadar={isRadar}
          width={networkWidth}
          height={networkHeight}
          revealStyle="sequential"
          accentColor={accentColor}
        />
      </div>

      {/* Findings summary - premium cards */}
      <div
        className="relative z-20 mt-4 flex gap-4 justify-center"
        style={{ opacity: statsProgress, transform: `translateY(${(1 - statsProgress) * 15}px)` }}
      >
        {offshoreCount > 0 && (
          <div
            className={`
              relative overflow-hidden px-5 py-3 rounded-xl backdrop-blur-sm text-center
              bg-gradient-to-br from-amber-500/15 to-amber-600/5
              ${isRadar ? 'border border-amber-500/30' : 'border border-amber-200'}
            `}
            style={{ boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)' }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: `radial-gradient(ellipse at center, rgba(245, 158, 11, ${0.1 + pulse * 0.05}) 0%, transparent 70%)` }}
            />
            <div className="relative flex items-center justify-center gap-2 mb-1">
              <WarningIcon size={18} color="#f59e0b" />
              <p className={`text-2xl font-bold tabular-nums ${isRadar ? 'text-amber-400' : 'text-amber-600'}`}>{offshoreCount}</p>
            </div>
            <p className={`relative text-[10px] font-medium ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>Offshore</p>
          </div>
        )}
        {suspiciousCount > 0 && (
          <div
            className={`
              relative overflow-hidden px-5 py-3 rounded-xl backdrop-blur-sm text-center
              bg-gradient-to-br from-red-500/15 to-red-600/5
              ${isRadar ? 'border border-red-500/30' : 'border border-red-200'}
            `}
            style={{ boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)' }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: `radial-gradient(ellipse at center, rgba(239, 68, 68, ${0.1 + pulse * 0.08}) 0%, transparent 70%)` }}
            />
            <div className="relative flex items-center justify-center gap-2 mb-1">
              <FlagIcon size={18} color="#ef4444" />
              <p className={`text-2xl font-bold tabular-nums ${isRadar ? 'text-red-400' : 'text-red-600'}`}>{suspiciousCount}</p>
            </div>
            <p className={`relative text-[10px] font-medium ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>Flagged</p>
          </div>
        )}
        {hiddenLinks > 0 && (
          <div
            className={`
              relative overflow-hidden px-5 py-3 rounded-xl backdrop-blur-sm text-center
              bg-gradient-to-br from-slate-500/15 to-slate-600/5
              ${isRadar ? 'border border-slate-600' : 'border border-stone-200'}
            `}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: `radial-gradient(ellipse at center, rgba(100, 116, 139, ${0.08 + pulse * 0.04}) 0%, transparent 70%)` }}
            />
            <p className={`relative text-2xl font-bold tabular-nums mb-1 ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>{hiddenLinks}</p>
            <p className={`relative text-[10px] font-medium ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>Hidden Links</p>
          </div>
        )}
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
