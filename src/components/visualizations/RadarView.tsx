'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ResearchSession } from '@/src/types/research';
import { getTemplateColor, getTemplateDisplayName, groupSessionsByTemplate } from '@/src/stores/appStore';

interface RadarViewProps {
  sessions: ResearchSession[];
  onSessionSelect?: (session: ResearchSession) => void;
}

interface Node {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
  sessions: ResearchSession[];
  template: string;
  pulsePhase: number;
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export function RadarView({ sessions, onSessionSelect }: RadarViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [view, setView] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Generate nodes from sessions grouped by template
  useEffect(() => {
    const grouped = groupSessionsByTemplate(sessions);
    const templates = Object.keys(grouped);
    const nodes: Node[] = [];

    // Arrange template clusters in a circle
    const clusterRadius = 300;
    templates.forEach((template, i) => {
      const angle = (i / templates.length) * Math.PI * 2 - Math.PI / 2;
      const cx = Math.cos(angle) * clusterRadius;
      const cy = Math.sin(angle) * clusterRadius;

      const templateSessions = grouped[template];
      const radius = Math.max(40, Math.min(80, 20 + templateSessions.length * 8));

      nodes.push({
        id: template,
        x: cx,
        y: cy,
        radius,
        color: getTemplateColor(template),
        label: getTemplateDisplayName(template),
        sessions: templateSessions,
        template,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    });

    nodesRef.current = nodes;
  }, [sessions]);

  // Canvas rendering with animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;

      // Clear with dark background
      ctx.fillStyle = '#0A0A0B';
      ctx.fillRect(0, 0, width, height);

      // Draw radar sweep effect
      const sweepAngle = (time * 0.5) % (Math.PI * 2);
      const centerX = width / 2 + view.offsetX;
      const centerY = height / 2 + view.offsetY;

      // Subtle grid
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 100 * view.scale;
      const startX = (view.offsetX % gridSize) - gridSize;
      const startY = (view.offsetY % gridSize) - gridSize;

      for (let x = startX; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = startY; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw radar circles
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)';
      for (let r = 100; r < 800; r += 150) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * view.scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw sweep (using radial gradient as fallback since conic gradient has limited support)
      const sweepX = centerX + Math.cos(sweepAngle) * 300 * view.scale;
      const sweepY = centerY + Math.sin(sweepAngle) * 300 * view.scale;
      const sweepGradient = ctx.createRadialGradient(
        sweepX, sweepY, 0,
        sweepX, sweepY, 400 * view.scale
      );
      sweepGradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
      sweepGradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.05)');
      sweepGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 600 * view.scale, 0, Math.PI * 2);
      ctx.fill();

      // Draw connections between nodes
      const nodes = nodesRef.current;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const x1 = centerX + n1.x * view.scale;
          const y1 = centerY + n1.y * view.scale;
          const x2 = centerX + n2.x * view.scale;
          const y2 = centerY + n2.y * view.scale;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        const x = centerX + node.x * view.scale;
        const y = centerY + node.y * view.scale;
        const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.15 + 1;
        const r = node.radius * view.scale * pulse;

        // Outer glow
        const glowGradient = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2);
        glowGradient.addColorStop(0, node.color + '40');
        glowGradient.addColorStop(0.5, node.color + '15');
        glowGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        innerGradient.addColorStop(0, node.color + 'CC');
        innerGradient.addColorStop(0.7, node.color + '88');
        innerGradient.addColorStop(1, node.color + '44');

        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#E8E8E8';
        ctx.font = `${Math.max(12, 14 * view.scale)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, x, y - r - 15 * view.scale);

        // Count
        ctx.fillStyle = '#A1A1AA';
        ctx.font = `${Math.max(10, 12 * view.scale)}px Inter, system-ui, sans-serif`;
        ctx.fillText(`${node.sessions.length} sessions`, x, y + r + 15 * view.scale);
      });

      time += 0.016;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [view, sessions]);

  // Mouse handlers for pan/zoom
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setView(v => ({
        ...v,
        offsetX: v.offsetX + dx,
        offsetY: v.offsetY + dy,
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }

    // Check hover
    const nodes = nodesRef.current;
    const centerX = rect.width / 2 + view.offsetX;
    const centerY = rect.height / 2 + view.offsetY;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: Node | null = null;
    for (const node of nodes) {
      const x = centerX + node.x * view.scale;
      const y = centerY + node.y * view.scale;
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < node.radius * view.scale * 1.5) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  }, [view]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView(v => ({
      ...v,
      scale: Math.max(0.3, Math.min(3, v.scale * delta)),
    }));
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode && hoveredNode.sessions.length === 1 && onSessionSelect) {
      onSessionSelect(hoveredNode.sessions[0]);
    }
  }, [hoveredNode, onSessionSelect]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-10 bg-[#1A1A1E] border border-[#22D3EE]/30 rounded-lg p-3 shadow-lg shadow-[#22D3EE]/10"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            maxWidth: 280,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: hoveredNode.color, boxShadow: `0 0 8px ${hoveredNode.color}` }}
            />
            <span className="text-[#E8E8E8] font-medium">{hoveredNode.label}</span>
          </div>
          <div className="text-[#A1A1AA] text-sm">
            {hoveredNode.sessions.length} research sessions
          </div>
          <div className="mt-2 text-xs text-[#71717A]">
            {hoveredNode.sessions.slice(0, 3).map(s => (
              <div key={s.id} className="truncate">{s.title}</div>
            ))}
            {hoveredNode.sessions.length > 3 && (
              <div>+{hoveredNode.sessions.length - 3} more...</div>
            )}
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-[#71717A] text-xs">
        Drag to pan • Scroll to zoom
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 text-[#71717A] text-xs font-mono">
        {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}
