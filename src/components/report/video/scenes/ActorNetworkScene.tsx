'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { spreadEntrance } from '@/src/lib/animation/motion';
import { NetworkDiagram, type NetworkNode, type NetworkEdge } from '../primitives';
import { NetworkIcon, PersonIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface Actor {
  name: string;
  role: string;
  connection: string;
}

interface ActorNetworkSceneProps extends BaseSceneProps {
  actors: Actor[];
  title?: string;
  accentColor: string;
}

/**
 * Actor network visualization showing key players and their connections.
 * World-class visual with dramatic reveal effects.
 */
export function ActorNetworkScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  actors,
  title = 'Key Players',
  accentColor,
}: ActorNetworkSceneProps) {
  const isMobile = format === 'mobile';

  // Proportional delays for main elements (header, network, list)
  const getMainDelay = spreadEntrance(sceneDuration, 3, { startPct: 0.05, endPct: 0.35 });

  // Proportional delays for actor items
  const getActorDelay = spreadEntrance(sceneDuration, actors.length, { startPct: 0.25, endPct: 0.6 });

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: getMainDelay(0), durationFrames: 25, easing: easeOutQuart });
  const networkProgress = spring({ frame: sceneFrame, fps, delay: getMainDelay(1), durationFrames: 35, easing: easeOutExpo });
  const listProgress = spring({ frame: sceneFrame, fps, delay: getMainDelay(2), durationFrames: 30, easing: easeOutCubic });

  // Animated pulse for dramatic effect
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;
  const slowPulse = Math.sin((sceneFrame / fps) * Math.PI * 0.7) * 0.5 + 0.5;

  // Scanning line effect
  const scanProgress = ((sceneFrame / fps) * 0.5) % 1;

  // Background particles
  const particles = Array.from({ length: 15 }, (_, i) => {
    const angle = (i / 15) * Math.PI * 2 + (sceneFrame / fps) * 0.2;
    const radius = 180 + Math.sin((sceneFrame / fps) * 1.5 + i) * 40;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0.2 + Math.sin((sceneFrame / fps) * 2 + i * 0.4) * 0.15,
      size: 1.5 + Math.sin((sceneFrame / fps) + i) * 0.5,
    };
  });

  // Convert actors to network nodes
  const nodes: NetworkNode[] = actors.map((actor, i) => ({
    id: `actor-${i}`,
    label: actor.name.split(' ')[0],
    type: i === 0 ? 'primary' : actor.role.toLowerCase().includes('ceo') || actor.role.toLowerCase().includes('chief') ? 'highlight' : 'secondary',
  }));

  // Create edges between actors
  const edges: NetworkEdge[] = actors.slice(1).map((actor, i) => ({
    from: 'actor-0',
    to: `actor-${i + 1}`,
    label: actor.connection.split(' ').slice(0, 2).join(' '),
    type: actor.connection.toLowerCase().includes('money') || actor.connection.toLowerCase().includes('payment') ? 'money' : 'normal',
  }));

  // Network dimensions
  const networkWidth = isMobile ? 420 : 840;
  const networkHeight = isMobile ? 320 : 400;

  // Word animation helper
  const animateWords = (text: string, baseDelay: number) => {
    const words = text.split(' ');
    return words.map((word, wordIndex) => {
      const wordDelay = baseDelay + wordIndex * 2;
      const wordProgress = spring({ frame: sceneFrame, fps, delay: wordDelay, durationFrames: 12, easing: easeOutCubic });
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
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>

      {/* Background effects */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? 'radial-gradient(ellipse at 50% 40%, rgba(6, 182, 212, 0.1) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(6, 182, 212, 0.06) 0%, transparent 60%)',
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

      {/* Scanning line effect */}
      <div
        className="absolute left-0 right-0 h-px z-10 pointer-events-none"
        style={{
          top: `${scanProgress * 100}%`,
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
          opacity: headerProgress * 0.6,
          boxShadow: `0 0 20px ${accentColor}40`,
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
                backgroundColor: accentColor,
                filter: 'blur(16px)',
                opacity: 0.4 + pulse * 0.2,
                transform: `scale(${1.2 + pulse * 0.1})`,
              }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-cyan-500/30 border border-cyan-400/30' : 'bg-cyan-100/80 border border-cyan-200'
              }`}
              style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72 }}
            >
              <NetworkIcon size={isMobile ? 30 : 36} color={accentColor} />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {actors.length} actors • {edges.length} connections identified
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

      {/* Network visualization */}
      <div
        className="relative z-20 flex justify-center"
        style={{
          opacity: networkProgress,
          transform: `scale(${0.9 + networkProgress * 0.1})`,
        }}
      >
        {/* Background glow for network */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `radial-gradient(ellipse at center, ${accentColor}10 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: `scale(${1 + slowPulse * 0.05})`,
          }}
        />

        <NetworkDiagram
          nodes={nodes}
          edges={edges}
          frame={sceneFrame - 5}
          fps={fps}
          isRadar={isRadar}
          width={networkWidth}
          height={networkHeight}
          revealStyle="radial"
          accentColor={accentColor}
        />
      </div>

      {/* Actor details list - glassmorphism cards */}
      <div
        className={`relative z-20 mt-4 ${isMobile ? 'space-y-2' : 'grid grid-cols-4 gap-3 px-2'}`}
        style={{ opacity: listProgress }}
      >
        {actors.slice(0, isMobile ? 3 : 4).map((actor, i) => {
          const itemProgress = spring({ frame: sceneFrame, fps, delay: getActorDelay(i), durationFrames: 22, easing: easeOutQuart });
          const isMain = i === 0;

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden p-3 rounded-xl backdrop-blur-sm
                ${isRadar
                  ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50'
                  : 'bg-gradient-to-br from-white/70 to-stone-50/50 border border-stone-200'}
              `}
              style={{
                opacity: itemProgress,
                transform: `translateY(${(1 - itemProgress) * 20}px)`,
                boxShadow: isMain
                  ? `0 4px 20px ${accentColor}20, inset 0 1px 0 ${isRadar ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}`
                  : `0 4px 15px rgba(0,0,0,${isRadar ? '0.2' : '0.05'})`,
              }}
            >
              {/* Accent glow for main actor */}
              {isMain && (
                <div
                  className="absolute -top-10 -right-10 w-20 h-20 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
                    filter: 'blur(10px)',
                  }}
                />
              )}

              <div className="relative flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  {isMain && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: accentColor,
                        filter: 'blur(8px)',
                        opacity: 0.4 + pulse * 0.2,
                        transform: `scale(1.3)`,
                      }}
                    />
                  )}
                  <div
                    className={`
                      relative w-10 h-10 rounded-full flex items-center justify-center
                      ${isMain
                        ? (isRadar ? 'bg-cyan-500/30 border border-cyan-400/40' : 'bg-cyan-100 border border-cyan-200')
                        : (isRadar ? 'bg-slate-700/80' : 'bg-stone-100')}
                    `}
                  >
                    <PersonIcon size={18} color={isMain ? accentColor : (isRadar ? '#64748b' : '#78716c')} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`text-base font-semibold ${isRadar ? 'text-white' : 'text-stone-800'}`}>
                    {animateWords(actor.name, getActorDelay(i) + 5)}
                  </span>
                  <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                    {actor.role}
                  </p>
                </div>
              </div>

              {/* Connection badge */}
              <div
                className={`
                  mt-2 px-2 py-1 rounded-lg text-xs font-medium
                  ${isRadar ? 'bg-slate-700/80 text-slate-300' : 'bg-stone-100 text-stone-600'}
                `}
                style={{
                  opacity: spring({ frame: sceneFrame, fps, delay: getActorDelay(i) + 10, durationFrames: 15, easing: easeOutCubic }),
                }}
              >
                {actor.connection.length > 20 ? actor.connection.slice(0, 17) + '...' : actor.connection}
              </div>
            </div>
          );
        })}
      </div>

      {/* More indicator */}
      {actors.length > (isMobile ? 3 : 4) && (
        <div
          className="relative z-20 mt-4 text-center"
          style={{
            opacity: spring({ frame: sceneFrame, fps, delay: 55, durationFrames: 20, easing: easeOutCubic }),
          }}
        >
          <span
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-base
              ${isRadar ? 'bg-slate-800/60 text-slate-400 border border-slate-700/50' : 'bg-stone-100 text-stone-500 border border-stone-200'}
            `}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            +{actors.length - (isMobile ? 3 : 4)} more players in network
          </span>
        </div>
      )}

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 42 L 0 8 Q 0 0 8 0 L 42 0"
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute top-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 64 42 L 64 8 Q 64 0 56 0 L 22 0"
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 22 L 0 56 Q 0 64 8 64 L 42 64"
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 - 80 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 64 22 L 64 56 Q 64 64 56 64 L 22 64"
              fill="none"
              stroke={accentColor}
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
