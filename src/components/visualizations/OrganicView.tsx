'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ResearchSession } from '@/src/types/research';
import { getTemplateColor, getTemplateDisplayName, groupSessionsByTemplate } from '@/src/stores/appStore';

interface OrganicViewProps {
  sessions: ResearchSession[];
  onSessionSelect?: (session: ResearchSession) => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  sessions: ResearchSession[];
  template: string;
  targetX: number;
  targetY: number;
  breathPhase: number;
  connections: string[];
}

export function OrganicView({ sessions, onSessionSelect }: OrganicViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [hoveredParticle, setHoveredParticle] = useState<Particle | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [focusedTemplate, setFocusedTemplate] = useState<string | null>(null);
  const timeRef = useRef<number>(0);

  // Initialize particles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const grouped = groupSessionsByTemplate(sessions);
    const templates = Object.keys(grouped);
    const particles: Particle[] = [];

    // Create particles for each template cluster
    templates.forEach((template, i) => {
      const angle = (i / templates.length) * Math.PI * 2;
      const distance = 180;
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;

      const templateSessions = grouped[template];
      const radius = Math.max(35, Math.min(70, 25 + templateSessions.length * 6));

      // Main cluster particle
      particles.push({
        id: template,
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0,
        radius,
        color: getTemplateColor(template),
        label: getTemplateDisplayName(template),
        sessions: templateSessions,
        template,
        targetX,
        targetY,
        breathPhase: Math.random() * Math.PI * 2,
        connections: templates.filter(t => t !== template).slice(0, 2),
      });
    });

    particlesRef.current = particles;
  }, [sessions]);

  // Physics simulation and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const simulate = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const time = timeRef.current;

      // Soft gradient background
      const bgGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height)
      );
      bgGradient.addColorStop(0, '#FAF8F5');
      bgGradient.addColorStop(1, '#F0ECE6');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle organic pattern
      ctx.strokeStyle = 'rgba(196, 190, 180, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const offset = time * 10 + i * 50;
        ctx.beginPath();
        ctx.arc(
          width / 2 + Math.sin(time * 0.3 + i) * 50,
          height / 2 + Math.cos(time * 0.2 + i) * 50,
          150 + i * 40 + Math.sin(time + i) * 10,
          0, Math.PI * 2
        );
        ctx.stroke();
      }

      const particles = particlesRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      // Physics update
      particles.forEach(p => {
        // Gentle attraction to target position
        const targetForce = 0.02;
        const tx = focusedTemplate === p.template ? centerX : p.targetX;
        const ty = focusedTemplate === p.template ? centerY : p.targetY;

        p.vx += (tx - p.x) * targetForce;
        p.vy += (ty - p.y) * targetForce;

        // Repulsion from other particles
        particles.forEach(other => {
          if (other.id === p.id) return;
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = p.radius + other.radius + 30;

          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) / dist * 0.05;
            p.vx += dx * force;
            p.vy += dy * force;
          }
        });

        // Mouse interaction - gentle attraction to mouse
        const mx = mousePos.x;
        const my = mousePos.y;
        const mdx = mx - p.x;
        const mdy = my - p.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 200 && mDist > 0) {
          const mForce = 0.001 * (200 - mDist) / 200;
          p.vx += mdx * mForce;
          p.vy += mdy * mForce;
        }

        // Apply velocity with damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Soft boundary
        const margin = 100;
        if (p.x < margin) p.vx += 0.5;
        if (p.x > width - margin) p.vx -= 0.5;
        if (p.y < margin) p.vy += 0.5;
        if (p.y > height - margin) p.vy -= 0.5;
      });

      // Draw connections as organic curves
      particles.forEach(p => {
        p.connections.forEach(connId => {
          const other = particles.find(pp => pp.id === connId);
          if (!other) return;

          const midX = (p.x + other.x) / 2 + Math.sin(time + p.breathPhase) * 20;
          const midY = (p.y + other.y) / 2 + Math.cos(time + p.breathPhase) * 20;

          ctx.strokeStyle = `rgba(101, 163, 13, ${focusedTemplate ? 0.05 : 0.15})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(midX, midY, other.x, other.y);
          ctx.stroke();
        });
      });

      // Draw particles
      particles.forEach(p => {
        const breath = Math.sin(time * 1.5 + p.breathPhase) * 0.08 + 1;
        const r = p.radius * breath;
        const isFocused = !focusedTemplate || focusedTemplate === p.template;
        const opacity = isFocused ? 1 : 0.3;

        // Soft shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${0.08 * opacity})`;
        ctx.beginPath();
        ctx.ellipse(p.x + 4, p.y + 6, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main circle with gradient
        const gradient = ctx.createRadialGradient(
          p.x - r * 0.3, p.y - r * 0.3, 0,
          p.x, p.y, r
        );
        gradient.addColorStop(0, adjustColor(p.color, 40, opacity));
        gradient.addColorStop(0.7, adjustColor(p.color, 0, opacity));
        gradient.addColorStop(1, adjustColor(p.color, -20, opacity));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Subtle highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * opacity})`;
        ctx.beginPath();
        ctx.ellipse(p.x - r * 0.3, p.y - r * 0.3, r * 0.4, r * 0.25, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        if (isFocused) {
          ctx.fillStyle = '#2D2A26';
          ctx.font = '500 14px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.label, p.x, p.y - r - 18);

          ctx.fillStyle = '#8C867E';
          ctx.font = '12px Inter, system-ui, sans-serif';
          ctx.fillText(`${p.sessions.length}`, p.x, p.y);
        }
      });

      timeRef.current += 0.016;
      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sessions, mousePos, focusedTemplate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Check hover
    const particles = particlesRef.current;
    let found: Particle | null = null;
    for (const p of particles) {
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist < p.radius * 1.2) {
        found = p;
        break;
      }
    }
    setHoveredParticle(found);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredParticle) {
      if (focusedTemplate === hoveredParticle.template) {
        // If already focused on this template and there's one session, select it
        if (hoveredParticle.sessions.length === 1 && onSessionSelect) {
          onSessionSelect(hoveredParticle.sessions[0]);
        } else {
          setFocusedTemplate(null);
        }
      } else {
        setFocusedTemplate(hoveredParticle.template);
      }
    } else if (focusedTemplate) {
      setFocusedTemplate(null);
    }
  }, [hoveredParticle, focusedTemplate, onSessionSelect]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-pointer"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Tooltip */}
      {hoveredParticle && (
        <div
          className="absolute pointer-events-none z-10 bg-[#FAF8F5] border border-[#C4BEB4] rounded-2xl p-4 shadow-lg"
          style={{
            left: mousePos.x + 20,
            top: mousePos.y + 20,
            maxWidth: 280,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: hoveredParticle.color }}
            />
            <span className="text-[#2D2A26] font-medium">{hoveredParticle.label}</span>
          </div>
          <div className="text-[#5C5651] text-sm">
            {hoveredParticle.sessions.length} research sessions
          </div>
          <div className="mt-3 space-y-1">
            {hoveredParticle.sessions.slice(0, 3).map(s => (
              <div key={s.id} className="text-xs text-[#8C867E] truncate flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#65A30D]" />
                {s.title}
              </div>
            ))}
            {hoveredParticle.sessions.length > 3 && (
              <div className="text-xs text-[#8C867E]">
                +{hoveredParticle.sessions.length - 3} more
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-[#65A30D]">
            Click to {focusedTemplate === hoveredParticle.template ? 'unfocus' : 'focus'}
          </div>
        </div>
      )}

      {/* Focused template details */}
      {focusedTemplate && (
        <div className="absolute top-4 left-4 bg-[#FAF8F5]/90 backdrop-blur-sm border border-[#C4BEB4] rounded-2xl p-4 max-w-xs">
          <h3 className="text-[#2D2A26] font-medium mb-2">
            {getTemplateDisplayName(focusedTemplate)}
          </h3>
          <div className="space-y-1 max-h-48 overflow-auto">
            {particlesRef.current
              .find(p => p.template === focusedTemplate)
              ?.sessions.map(s => (
                <button
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionSelect?.(s);
                  }}
                  className="w-full text-left text-sm text-[#5C5651] hover:text-[#65A30D] truncate transition-colors"
                >
                  {s.title}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-4 left-4 text-[#8C867E] text-xs">
        Click nodes to focus • Move mouse to attract
      </div>
    </div>
  );
}

// Helper to adjust color brightness
function adjustColor(hex: string, amount: number, opacity: number = 1): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));

  if (opacity < 1) {
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
