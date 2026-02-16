'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';

export interface NetworkNode {
  id: string;
  label: string;
  type?: 'primary' | 'secondary' | 'highlight' | 'warning';
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  from: string;
  to: string;
  label?: string;
  type?: 'normal' | 'money' | 'suspicious' | 'hidden';
}

interface NetworkDiagramProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  frame: number;
  fps: number;
  isRadar: boolean;
  width: number;
  height: number;
  /** Animation style: 'radial' reveals from center, 'sequential' reveals one by one */
  revealStyle?: 'radial' | 'sequential';
  /** Accent color for highlights */
  accentColor?: string;
}

/**
 * Animated network diagram showing nodes and their connections.
 * Used for ActorNetwork and ShellCompanyWeb scenes.
 * Enhanced with curved edges, pulse animations, and data flow effects.
 */
export function NetworkDiagram({
  nodes,
  edges,
  frame,
  fps,
  isRadar,
  width,
  height,
  revealStyle = 'radial',
  accentColor = '#06b6d4',
}: NetworkDiagramProps) {
  // Calculate node positions if not provided (force-directed inspired layout)
  const positionedNodes = nodes.map((node, i) => {
    if (node.x !== undefined && node.y !== undefined) return node;

    // Primary node in center, others in orbital arrangement
    if (i === 0) {
      return { ...node, x: width / 2, y: height / 2 };
    }

    const orbitIndex = i - 1;
    const totalOrbits = nodes.length - 1;
    const angle = (orbitIndex / totalOrbits) * Math.PI * 2 - Math.PI / 2;
    const radius = Math.min(width, height) * 0.38;

    return {
      ...node,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
    };
  });

  // Get node position by id
  const getNodePos = (id: string) => {
    const node = positionedNodes.find(n => n.id === id);
    return node ? { x: node.x!, y: node.y! } : { x: width / 2, y: height / 2 };
  };

  // Node colors based on type - enhanced with gradients
  const getNodeColors = (type: NetworkNode['type'] = 'secondary') => {
    const colors = {
      primary: {
        fill: isRadar ? '#06b6d4' : '#3b82f6',
        stroke: isRadar ? '#22d3ee' : '#60a5fa',
        glow: isRadar ? '#06b6d4' : '#3b82f6',
        text: '#ffffff',
      },
      secondary: {
        fill: isRadar ? '#334155' : '#e7e5e4',
        stroke: isRadar ? '#475569' : '#d6d3d1',
        glow: 'transparent',
        text: isRadar ? '#e2e8f0' : '#57534e',
      },
      highlight: {
        fill: isRadar ? '#f59e0b' : '#fbbf24',
        stroke: isRadar ? '#fbbf24' : '#f59e0b',
        glow: isRadar ? '#f59e0b' : '#fbbf24',
        text: '#ffffff',
      },
      warning: {
        fill: isRadar ? '#ef4444' : '#f87171',
        stroke: isRadar ? '#f87171' : '#ef4444',
        glow: isRadar ? '#ef4444' : '#f87171',
        text: '#ffffff',
      },
    };
    return colors[type];
  };

  // Edge colors and styles based on type
  const getEdgeStyle = (type: NetworkEdge['type'] = 'normal') => ({
    normal: { color: isRadar ? '#475569' : '#d6d3d1', width: 2, glow: false },
    money: { color: '#22c55e', width: 3, glow: true },
    suspicious: { color: '#f59e0b', width: 2.5, glow: true },
    hidden: { color: isRadar ? '#1e293b' : '#f5f5f4', width: 1.5, glow: false },
  })[type];

  // Pulse animation for primary nodes
  const pulseScale = 1 + Math.sin((frame / fps) * Math.PI * 2) * 0.08;

  // Generate curved path between two points
  const getCurvedPath = (from: { x: number; y: number }, to: { x: number; y: number }, curvature = 0.2) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    // Perpendicular offset for curve
    const perpX = -dy * curvature;
    const perpY = dx * curvature;
    const ctrlX = midX + perpX;
    const ctrlY = midY + perpY;
    return `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Definitions for gradients and filters */}
      <defs>
        {/* Glow filter */}
        <filter id="networkGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stronger glow for primary nodes */}
        <filter id="primaryGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Edge gradient for money flows */}
        <linearGradient id="moneyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Background grid pattern for depth */}
      <g opacity={0.1}>
        {Array.from({ length: 8 }).map((_, i) => (
          <circle
            key={i}
            cx={width / 2}
            cy={height / 2}
            r={(i + 1) * (Math.min(width, height) / 16)}
            fill="none"
            stroke={isRadar ? '#475569' : '#a8a29e'}
            strokeWidth={0.5}
            strokeDasharray="4 8"
          />
        ))}
      </g>

      {/* Edges with curved paths */}
      <g>
        {edges.map((edge, i) => {
          const fromPos = getNodePos(edge.from);
          const toPos = getNodePos(edge.to);
          const delay = revealStyle === 'sequential' ? i * 4 : 5;
          const edgeProgress = spring({ frame, fps, delay, durationFrames: 24, easing: easeOutCubic });
          const style = getEdgeStyle(edge.type);

          // Calculate offset positions for node radii
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const nodeRadius = 32;
          const startX = fromPos.x + (dx / length) * nodeRadius;
          const startY = fromPos.y + (dy / length) * nodeRadius;
          const endX = toPos.x - (dx / length) * nodeRadius;
          const endY = toPos.y - (dy / length) * nodeRadius;

          // Curvature varies by edge index for visual interest
          const curvature = (i % 2 === 0 ? 1 : -1) * 0.15;
          const path = getCurvedPath(
            { x: startX, y: startY },
            { x: endX, y: endY },
            curvature
          );

          return (
            <g key={`${edge.from}-${edge.to}`}>
              {/* Edge glow for special types */}
              {style.glow && (
                <path
                  d={path}
                  fill="none"
                  stroke={style.color}
                  strokeWidth={style.width + 4}
                  strokeLinecap="round"
                  opacity={edgeProgress * 0.2}
                  style={{ filter: 'blur(6px)' }}
                  strokeDasharray={`${length * edgeProgress} ${length}`}
                />
              )}

              {/* Main edge path */}
              <path
                d={path}
                fill="none"
                stroke={style.color}
                strokeWidth={style.width}
                strokeLinecap="round"
                strokeDasharray={edge.type === 'hidden' ? '4 4' : `${length * edgeProgress} ${length}`}
                opacity={edge.type === 'hidden' ? edgeProgress * 0.4 : edgeProgress * 0.9}
              />

              {/* Animated flow dots for money edges */}
              {edge.type === 'money' && edgeProgress > 0.8 && (
                <>
                  {[0, 0.3, 0.6].map((offset, j) => {
                    const t = ((frame / fps * 0.5) + offset) % 1;
                    const dotProgress = t;
                    const dotX = startX + (endX - startX) * dotProgress;
                    const dotY = startY + (endY - startY) * dotProgress;
                    return (
                      <circle
                        key={j}
                        cx={dotX}
                        cy={dotY}
                        r={3}
                        fill="#22c55e"
                        opacity={Math.sin(dotProgress * Math.PI) * 0.8}
                      />
                    );
                  })}
                </>
              )}

              {/* Arrow head */}
              {edgeProgress > 0.6 && (
                <polygon
                  points={`0,-5 10,0 0,5`}
                  fill={style.color}
                  opacity={edgeProgress}
                  transform={`translate(${endX}, ${endY}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})`}
                />
              )}

              {/* Edge label with background */}
              {edge.label && edgeProgress > 0.75 && (
                <g
                  transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2 - 10})`}
                  opacity={(edgeProgress - 0.75) * 4}
                >
                  <rect
                    x={-45}
                    y={-10}
                    width={90}
                    height={20}
                    rx={4}
                    fill={isRadar ? '#1e293b' : '#ffffff'}
                    opacity={0.9}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[12px] font-medium`}
                    fill={isRadar ? '#94a3b8' : '#78716c'}
                  >
                    {edge.label.length > 12 ? edge.label.slice(0, 10) + '…' : edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {positionedNodes.map((node, i) => {
          const delay = revealStyle === 'sequential' ? i * 6 : i * 3;
          const nodeProgress = spring({ frame, fps, delay, durationFrames: 28, easing: easeOutQuart });
          const colors = getNodeColors(node.type);
          const isPrimary = node.type === 'primary';
          const isSpecial = node.type === 'primary' || node.type === 'highlight' || node.type === 'warning';
          const currentScale = isPrimary ? pulseScale : 1;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y}) scale(${nodeProgress * currentScale})`}
              opacity={nodeProgress}
            >
              {/* Outer pulse ring for primary nodes */}
              {isPrimary && (
                <>
                  <circle
                    r={48}
                    fill="none"
                    stroke={colors.glow}
                    strokeWidth={1}
                    opacity={0.3 * (1 + Math.sin((frame / fps) * Math.PI * 2))}
                  />
                  <circle
                    r={56}
                    fill="none"
                    stroke={colors.glow}
                    strokeWidth={0.5}
                    opacity={0.2 * (1 + Math.sin((frame / fps) * Math.PI * 2 + Math.PI))}
                  />
                </>
              )}

              {/* Glow effect for special nodes */}
              {isSpecial && (
                <circle
                  r={40}
                  fill={colors.glow}
                  opacity={0.3}
                  style={{ filter: 'blur(12px)' }}
                />
              )}

              {/* Outer ring */}
              <circle
                r={isPrimary ? 36 : 30}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={isPrimary ? 3 : 2}
                opacity={0.6}
              />

              {/* Node circle */}
              <circle
                r={isPrimary ? 30 : 26}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={2}
              />

              {/* Inner highlight */}
              <circle
                r={isPrimary ? 24 : 18}
                fill="none"
                stroke="white"
                strokeWidth={1}
                opacity={0.2}
              />

              {/* Node icon/initial */}
              <text
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-bold"
                fontSize={isPrimary ? 16 : 14}
                fill={colors.text}
              >
                {node.label.length > 6 ? node.label.slice(0, 5) + '…' : node.label}
              </text>

              {/* Full label below node */}
              <text
                y={isPrimary ? 48 : 42}
                textAnchor="middle"
                className="font-medium"
                fontSize={12}
                fill={isRadar ? '#94a3b8' : '#78716c'}
                opacity={nodeProgress}
              >
                {node.label.length > 12 ? node.label.slice(0, 10) + '…' : node.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
