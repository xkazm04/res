'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { ResearchSession } from '@/src/types/research';
import {
  useAppStore,
  getTemplateColor,
  getTemplateDisplayName,
  groupSessionsByTemplate,
  getTopicsForTemplate,
  type TopicWithSessions,
} from '@/src/stores/appStore';
import { circularLayout, evenAngles, type LayoutDimensions } from '@/src/lib/layout';

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
  type: 'template' | 'topic';
  parentTemplate?: string;
  topic?: TopicWithSessions;
  orbitRadius?: number;
  orbitAngle?: number;
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
  const [focusedTemplate, setFocusedTemplate] = useState<string | null>(null);
  const [focusedTopic, setFocusedTopic] = useState<TopicWithSessions | null>(null);
  const { topics, fetchTopics } = useAppStore();

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const [view, setView] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Generate nodes from sessions grouped by template, with topic subnodes
  // Uses shared circular layout utilities for positioning
  useEffect(() => {
    const grouped = groupSessionsByTemplate(sessions);
    const templates = Object.keys(grouped);
    const nodes: Node[] = [];

    // Layout parameters
    const clusterRadius = focusedTemplate ? 100 : 300;
    const orbitRadius = 180;

    // Use shared circular layout for template positions
    const templateLayoutNodes = templates.map((template, i) => ({
      id: template,
      x: 0,
      y: 0,
      value: grouped[template].length,
    }));

    // Calculate angles for templates using shared utility
    const templateAngles = evenAngles(templates.length, -Math.PI / 2);

    templates.forEach((template, i) => {
      const isFocused = focusedTemplate === template;
      const angle = templateAngles[i];
      const cx = isFocused ? 0 : Math.cos(angle) * clusterRadius;
      const cy = isFocused ? 0 : Math.sin(angle) * clusterRadius;

      const templateSessions = grouped[template];
      const radius = isFocused ? 60 : Math.max(40, Math.min(80, 20 + templateSessions.length * 8));

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
        type: 'template',
      });

      // Add topic nodes if this template is focused
      if (isFocused) {
        const templateTopics = getTopicsForTemplate(template, topics);

        // Calculate angles for topics using shared utility
        const topicAngles = evenAngles(templateTopics.length, -Math.PI / 2);

        templateTopics.forEach((topic, tidx) => {
          const topicAngle = topicAngles[tidx];
          const topicSessions = topic.sessions?.filter(s => s.template_type === template) || [];
          const topicRadius = Math.max(20, Math.min(40, 15 + topicSessions.length * 4));

          nodes.push({
            id: `topic-${topic.id}`,
            x: cx + Math.cos(topicAngle) * orbitRadius,
            y: cy + Math.sin(topicAngle) * orbitRadius,
            radius: topicRadius,
            color: getTemplateColor(template),
            label: topic.name,
            sessions: sessions.filter(s => topicSessions.some(ts => ts.id === s.id)),
            template,
            pulsePhase: Math.random() * Math.PI * 2,
            type: 'topic',
            parentTemplate: template,
            topic,
            orbitRadius,
            orbitAngle: topicAngle,
          });
        });
      }
    });

    nodesRef.current = nodes;
  }, [sessions, topics, focusedTemplate]);

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

      // Draw connections between template nodes only
      const nodes = nodesRef.current;
      const templateNodes = nodes.filter(n => n.type === 'template');
      const topicNodes = nodes.filter(n => n.type === 'topic');

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
      ctx.lineWidth = 1;

      for (let i = 0; i < templateNodes.length; i++) {
        for (let j = i + 1; j < templateNodes.length; j++) {
          const n1 = templateNodes[i];
          const n2 = templateNodes[j];
          // Dim connections when focused
          const opacity = focusedTemplate ? 0.03 : 0.1;
          ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;

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

      // Draw orbit ring for focused template
      if (focusedTemplate) {
        const focusedNode = templateNodes.find(n => n.template === focusedTemplate);
        if (focusedNode) {
          const fx = centerX + focusedNode.x * view.scale;
          const fy = centerY + focusedNode.y * view.scale;
          const orbitR = 180 * view.scale;

          // Draw orbit ring
          ctx.strokeStyle = focusedNode.color + '30';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 10]);
          ctx.beginPath();
          ctx.arc(fx, fy, orbitR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw connections from center to topics
          topicNodes.forEach(topic => {
            const tx = centerX + topic.x * view.scale;
            const ty = centerY + topic.y * view.scale;

            ctx.strokeStyle = topic.color + '40';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(tx, ty);
            ctx.stroke();
          });
        }
      }

      // Draw nodes (templates first, then topics on top)
      [...templateNodes, ...topicNodes].forEach((node) => {
        const x = centerX + node.x * view.scale;
        const y = centerY + node.y * view.scale;
        const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.15 + 1;
        const r = node.radius * view.scale * pulse;

        // Determine opacity based on focus state
        const isFocused = !focusedTemplate || node.template === focusedTemplate;
        const opacity = isFocused ? 1 : 0.2;

        // Outer glow
        const glowGradient = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2);
        glowGradient.addColorStop(0, node.color + (isFocused ? '40' : '10'));
        glowGradient.addColorStop(0.5, node.color + (isFocused ? '15' : '05'));
        glowGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        innerGradient.addColorStop(0, node.color + (isFocused ? 'CC' : '44'));
        innerGradient.addColorStop(0.7, node.color + (isFocused ? '88' : '22'));
        innerGradient.addColorStop(1, node.color + (isFocused ? '44' : '11'));

        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = node.color + (isFocused ? 'FF' : '44');
        ctx.lineWidth = node.type === 'topic' ? 1.5 : 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Label (only if focused or no focus)
        if (isFocused) {
          ctx.fillStyle = '#E8E8E8';
          ctx.font = `${Math.max(10, (node.type === 'topic' ? 12 : 14) * view.scale)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, x, y - r - 15 * view.scale);

          // Count
          ctx.fillStyle = '#A1A1AA';
          ctx.font = `${Math.max(9, (node.type === 'topic' ? 10 : 12) * view.scale)}px Inter, system-ui, sans-serif`;
          ctx.fillText(`${node.sessions.length}`, x, y + r + 12 * view.scale);
        }
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
  }, [view, sessions, focusedTemplate, topics]);

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
    if (!hoveredNode) {
      // Click on empty space - unfocus
      if (focusedTemplate) {
        setFocusedTemplate(null);
        setFocusedTopic(null);
      }
      return;
    }

    if (hoveredNode.type === 'template') {
      if (focusedTemplate === hoveredNode.template) {
        // Already focused, unfocus
        setFocusedTemplate(null);
        setFocusedTopic(null);
      } else {
        // Focus on this template
        setFocusedTemplate(hoveredNode.template);
        setFocusedTopic(null);
      }
    } else if (hoveredNode.type === 'topic') {
      if (hoveredNode.sessions.length === 1 && onSessionSelect) {
        // Single session - select it directly
        onSessionSelect(hoveredNode.sessions[0]);
      } else if (hoveredNode.topic) {
        // Show topic sessions in panel
        setFocusedTopic(hoveredNode.topic);
      }
    }
  }, [hoveredNode, onSessionSelect, focusedTemplate]);

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
            <span className="text-[#71717A] text-xs uppercase">
              {hoveredNode.type}
            </span>
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
          <div className="mt-2 text-xs text-[#22D3EE]">
            {hoveredNode.type === 'template'
              ? focusedTemplate === hoveredNode.template
                ? 'Click to unfocus'
                : 'Click to see topics'
              : hoveredNode.sessions.length === 1
                ? 'Click to open report'
                : 'Click to see sessions'}
          </div>
        </div>
      )}

      {/* Focused topic sessions panel */}
      {focusedTopic && (
        <div className="absolute top-4 left-4 bg-[#1A1A1E]/95 backdrop-blur-sm border border-[#22D3EE]/30 rounded-lg p-4 max-w-xs shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#E8E8E8] font-medium">{focusedTopic.name}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFocusedTopic(null);
              }}
              className="text-[#71717A] hover:text-[#22D3EE] text-xs"
            >
              Close
            </button>
          </div>
          {focusedTopic.description && (
            <p className="text-xs text-[#A1A1AA] mb-3">{focusedTopic.description}</p>
          )}
          <div className="space-y-1 max-h-48 overflow-auto">
            {sessions
              .filter(s => focusedTopic.sessions?.some(ts => ts.id === s.id))
              .map(s => (
                <button
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionSelect?.(s);
                  }}
                  className="w-full text-left text-sm text-[#A1A1AA] hover:text-[#22D3EE] truncate transition-colors"
                >
                  {s.title}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-[#71717A] text-xs">
        Drag to pan • Scroll to zoom • Click nodes to {focusedTemplate ? 'drill down' : 'focus'}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 text-[#71717A] text-xs font-mono">
        {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}
