'use client';

/**
 * VideoAtmosphere — animated background layer for video scenes.
 *
 * Renders behind all scene content. Replaces the static radial gradient
 * in RemotionComposition with 5 animated layers: mesh gradient, parallax
 * particles, vignette, scanlines, and film grain.
 */

type Mood = 'neutral' | 'danger' | 'success' | 'dramatic';

interface VideoAtmosphereProps {
  frame: number;
  fps: number;
  accentColor: string;
  width: number;
  height: number;
  mood?: Mood;
}

// Mood-specific tuning
const MOOD_CONFIG: Record<Mood, {
  blobOpacity: number;
  blobSpeed: number;
  particleSpeed: number;
  vignetteStrength: number;
  secondaryColor: string;
}> = {
  neutral: { blobOpacity: 0.12, blobSpeed: 1, particleSpeed: 1, vignetteStrength: 0.35, secondaryColor: '#3b82f6' },
  danger: { blobOpacity: 0.18, blobSpeed: 1.5, particleSpeed: 1.8, vignetteStrength: 0.5, secondaryColor: '#ef4444' },
  success: { blobOpacity: 0.1, blobSpeed: 0.7, particleSpeed: 0.8, vignetteStrength: 0.25, secondaryColor: '#22c55e' },
  dramatic: { blobOpacity: 0.2, blobSpeed: 1.2, particleSpeed: 1.5, vignetteStrength: 0.45, secondaryColor: '#8b5cf6' },
};

// Deterministic pseudo-random for stable particle positions
function prand(i: number, seed: number = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function VideoAtmosphere({
  frame,
  fps,
  accentColor,
  width,
  height,
  mood = 'neutral',
}: VideoAtmosphereProps) {
  const time = frame / fps;
  const cfg = MOOD_CONFIG[mood];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Layer 1: Animated mesh gradient */}
      <MeshGradient
        time={time}
        accentColor={accentColor}
        secondaryColor={cfg.secondaryColor}
        opacity={cfg.blobOpacity}
        speed={cfg.blobSpeed}
        width={width}
        height={height}
      />

      {/* Layer 2: Parallax particle field */}
      <ParticleField
        time={time}
        accentColor={accentColor}
        speed={cfg.particleSpeed}
        width={width}
        height={height}
      />

      {/* Layer 3: Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
          opacity: cfg.vignetteStrength + Math.sin(time * 0.5) * 0.05,
        }}
      />

      {/* Layer 4: Scanline texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.015) 2px,
            rgba(255,255,255,0.015) 4px
          )`,
          opacity: 0.5,
        }}
      />

      {/* Layer 5: Film grain (SVG noise shifted per frame) */}
      <div
        className="absolute opacity-[0.03]"
        style={{
          inset: -20, // overflow to avoid edge seams when shifting
          transform: `translate(${Math.sin(frame * 3.7) * 10}px, ${Math.cos(frame * 2.3) * 10}px)`,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
    </div>
  );
}

// ============================================================================
// Mesh Gradient — 4 soft blobs that drift organically
// ============================================================================

function MeshGradient({ time, accentColor, secondaryColor, opacity, speed, width, height }: {
  time: number; accentColor: string; secondaryColor: string; opacity: number; speed: number;
  width: number; height: number;
}) {
  const blobs = [
    {
      cx: 30 + Math.sin(time * 0.3 * speed) * 20,
      cy: 35 + Math.cos(time * 0.2 * speed) * 15,
      rx: 35 + Math.sin(time * 0.4 * speed) * 10,
      ry: 30 + Math.cos(time * 0.35 * speed) * 8,
      color: accentColor,
      op: opacity,
    },
    {
      cx: 70 + Math.cos(time * 0.25 * speed) * 15,
      cy: 60 + Math.sin(time * 0.35 * speed) * 20,
      rx: 30 + Math.cos(time * 0.3 * speed) * 8,
      ry: 35 + Math.sin(time * 0.25 * speed) * 10,
      color: secondaryColor,
      op: opacity * 0.7,
    },
    {
      cx: 50 + Math.sin(time * 0.18 * speed + 2) * 25,
      cy: 25 + Math.cos(time * 0.28 * speed + 1) * 18,
      rx: 25 + Math.sin(time * 0.22 * speed) * 6,
      ry: 20 + Math.cos(time * 0.32 * speed) * 5,
      color: accentColor,
      op: opacity * 0.5,
    },
    {
      cx: 20 + Math.cos(time * 0.2 * speed + 3) * 10,
      cy: 75 + Math.sin(time * 0.15 * speed + 2) * 12,
      rx: 28 + Math.cos(time * 0.28 * speed) * 7,
      ry: 22 + Math.sin(time * 0.2 * speed) * 6,
      color: secondaryColor,
      op: opacity * 0.4,
    },
  ];

  return (
    <div className="absolute inset-0">
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.cx}%`,
            top: `${b.cy}%`,
            width: `${b.rx}%`,
            height: `${b.ry}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
            opacity: b.op,
            filter: 'blur(40px)',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Particle Field — 3 depth planes for parallax
// ============================================================================

// Pre-compute particle configs (stable across renders)
const FAR_PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  baseX: prand(i, 1) * 100,
  baseY: prand(i, 2) * 100,
  phase: prand(i, 3) * Math.PI * 2,
  wobbleAmp: 2 + prand(i, 4) * 3,
  size: 1 + prand(i, 5) * 1,
  baseOpacity: 0.1 + prand(i, 6) * 0.1,
}));

const MID_PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  baseX: prand(i, 10) * 100,
  baseY: prand(i, 11) * 100,
  phase: prand(i, 12) * Math.PI * 2,
  wobbleAmp: 3 + prand(i, 13) * 4,
  size: 2 + prand(i, 14) * 1,
  baseOpacity: 0.15 + prand(i, 15) * 0.15,
}));

const NEAR_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  baseX: prand(i, 20) * 100,
  baseY: prand(i, 21) * 100,
  phase: prand(i, 22) * Math.PI * 2,
  wobbleAmp: 5 + prand(i, 23) * 5,
  size: 3 + prand(i, 24) * 2,
  baseOpacity: 0.2 + prand(i, 25) * 0.2,
}));

function ParticleField({ time, accentColor, speed, width, height }: {
  time: number; accentColor: string; speed: number; width: number; height: number;
}) {
  return (
    <div className="absolute inset-0">
      {/* Far plane — slow, tiny */}
      {FAR_PARTICLES.map((p, i) => {
        const x = p.baseX + Math.sin(time * 0.05 * speed + p.phase) * p.wobbleAmp;
        const y = p.baseY + Math.cos(time * 0.04 * speed + p.phase * 1.3) * p.wobbleAmp;
        const opacity = p.baseOpacity + Math.sin(time * 0.8 + p.phase) * 0.05;

        return (
          <div
            key={`f${i}`}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: accentColor,
              opacity,
            }}
          />
        );
      })}

      {/* Mid plane — medium speed */}
      {MID_PARTICLES.map((p, i) => {
        const x = p.baseX + Math.sin(time * 0.15 * speed + p.phase) * p.wobbleAmp;
        const y = p.baseY + Math.cos(time * 0.12 * speed + p.phase * 0.8) * p.wobbleAmp;
        const opacity = p.baseOpacity + Math.sin(time * 1.2 + p.phase) * 0.08;

        return (
          <div
            key={`m${i}`}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: accentColor,
              opacity,
            }}
          />
        );
      })}

      {/* Near plane — faster, glowing */}
      {NEAR_PARTICLES.map((p, i) => {
        const x = p.baseX + Math.sin(time * 0.3 * speed + p.phase) * p.wobbleAmp;
        const y = p.baseY + Math.cos(time * 0.25 * speed + p.phase * 1.1) * p.wobbleAmp;
        const opacity = p.baseOpacity + Math.sin(time * 1.5 + p.phase) * 0.1;

        return (
          <div
            key={`n${i}`}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: accentColor,
              opacity,
              boxShadow: `0 0 ${p.size * 3}px ${accentColor}`,
            }}
          />
        );
      })}
    </div>
  );
}
