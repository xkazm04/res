'use client';

import { spring, easeOutCubic, easeOutQuart, easeInOutCubic } from '../useVideoPlayback';

export interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  type?: 'source' | 'destination' | 'intermediary';
}

export interface FlowConnection {
  from: string;
  to: string;
  amount?: string;
  label?: string;
  type?: 'normal' | 'large' | 'suspicious';
}

interface FlowVisualizationProps {
  nodes: FlowNode[];
  flows: FlowConnection[];
  frame: number;
  fps: number;
  isRadar: boolean;
  width: number;
  height: number;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Whether to animate the flow particles */
  animateParticles?: boolean;
  /** Accent color */
  accentColor?: string;
}

/**
 * Animated flow visualization showing money/data movement between entities.
 * Used for MoneyTrail and CausalChain scenes.
 */
export function FlowVisualization({
  nodes,
  flows,
  frame,
  fps,
  isRadar,
  width,
  height,
  direction = 'horizontal',
  animateParticles = true,
  accentColor = '#22c55e',
}: FlowVisualizationProps) {
  const isHorizontal = direction === 'horizontal';
  const padding = 50;
  const nodeWidth = isHorizontal ? 110 : 130;
  const nodeHeight = isHorizontal ? 65 : 55;

  // Position nodes in a line
  const positionedNodes = nodes.map((node, i) => {
    const totalNodes = nodes.length;
    const spacing = isHorizontal
      ? (width - padding * 2 - nodeWidth) / Math.max(1, totalNodes - 1)
      : (height - padding * 2 - nodeHeight) / Math.max(1, totalNodes - 1);

    return {
      ...node,
      x: isHorizontal ? padding + i * spacing : width / 2 - nodeWidth / 2,
      y: isHorizontal ? height / 2 - nodeHeight / 2 : padding + i * spacing,
    };
  });

  const getNodeById = (id: string) => positionedNodes.find(n => n.id === id);

  const getNodeColors = (type: FlowNode['type'] = 'intermediary') => {
    const colors = {
      source: {
        bg: isRadar ? 'bg-emerald-500/20' : 'bg-emerald-100',
        border: isRadar ? 'border-emerald-500' : 'border-emerald-400',
        text: isRadar ? 'text-emerald-400' : 'text-emerald-700',
      },
      destination: {
        bg: isRadar ? 'bg-red-500/20' : 'bg-red-100',
        border: isRadar ? 'border-red-500' : 'border-red-400',
        text: isRadar ? 'text-red-400' : 'text-red-700',
      },
      intermediary: {
        bg: isRadar ? 'bg-slate-800' : 'bg-stone-100',
        border: isRadar ? 'border-slate-600' : 'border-stone-300',
        text: isRadar ? 'text-slate-200' : 'text-stone-700',
      },
    };
    return colors[type];
  };

  const getFlowColor = (type: FlowConnection['type'] = 'normal') => {
    const colors = {
      normal: accentColor,
      large: '#22c55e',
      suspicious: '#f59e0b',
    };
    return colors[type];
  };

  return (
    <div className="relative" style={{ width, height }}>
      {/* Flow lines (SVG layer) */}
      <svg className="absolute inset-0" width={width} height={height}>
        <defs>
          {/* Gradient for flow lines */}
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="50%" stopColor={accentColor} stopOpacity="1" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {flows.map((flow, i) => {
          const fromNode = getNodeById(flow.from);
          const toNode = getNodeById(flow.to);
          if (!fromNode || !toNode) return null;

          const delay = 10 + i * 8;
          const lineProgress = spring({ frame, fps, delay, durationFrames: 25, easing: easeInOutCubic });

          // Calculate start and end points
          const startX = isHorizontal ? fromNode.x + nodeWidth : fromNode.x + nodeWidth / 2;
          const startY = isHorizontal ? fromNode.y + nodeHeight / 2 : fromNode.y + nodeHeight;
          const endX = isHorizontal ? toNode.x : toNode.x + nodeWidth / 2;
          const endY = isHorizontal ? toNode.y + nodeHeight / 2 : toNode.y;

          // Animated end position
          const currentEndX = startX + (endX - startX) * lineProgress;
          const currentEndY = startY + (endY - startY) * lineProgress;

          // Particle animation
          const particleOffset = animateParticles ? (frame * 2) % 100 : 50;

          return (
            <g key={`${flow.from}-${flow.to}`}>
              {/* Base line */}
              <line
                x1={startX}
                y1={startY}
                x2={currentEndX}
                y2={currentEndY}
                stroke={getFlowColor(flow.type)}
                strokeWidth={flow.type === 'large' ? 4 : 2}
                opacity={lineProgress * 0.6}
              />

              {/* Animated particle */}
              {animateParticles && lineProgress > 0.5 && (
                <circle
                  cx={startX + (endX - startX) * (particleOffset / 100)}
                  cy={startY + (endY - startY) * (particleOffset / 100)}
                  r={flow.type === 'large' ? 5 : 3}
                  fill={getFlowColor(flow.type)}
                  opacity={0.8}
                >
                  <animate
                    attributeName="opacity"
                    values="0.8;0.4;0.8"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Arrow head */}
              {lineProgress > 0.8 && (
                <polygon
                  points={isHorizontal ? '-6,-4 0,0 -6,4' : '-4,-6 0,0 4,-6'}
                  fill={getFlowColor(flow.type)}
                  transform={`translate(${currentEndX}, ${currentEndY})`}
                  opacity={lineProgress}
                />
              )}

              {/* Amount label */}
              {flow.amount && lineProgress > 0.6 && (
                <g>
                  <rect
                    x={(startX + endX) / 2 - 40}
                    y={(startY + endY) / 2 - 12}
                    width={80}
                    height={24}
                    rx={4}
                    fill={isRadar ? '#1e293b' : '#fafaf9'}
                    stroke={getFlowColor(flow.type)}
                    strokeWidth={1}
                    opacity={(lineProgress - 0.6) * 2.5}
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 + 4}
                    textAnchor="middle"
                    className="text-[13px] font-bold"
                    fill={getFlowColor(flow.type)}
                    opacity={(lineProgress - 0.6) * 2.5}
                  >
                    {flow.amount}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes (HTML layer for better text rendering) */}
      {positionedNodes.map((node, i) => {
        const delay = i * 5;
        const nodeProgress = spring({ frame, fps, delay, durationFrames: 22, easing: easeOutQuart });
        const colors = getNodeColors(node.type);

        return (
          <div
            key={node.id}
            className={`absolute rounded-lg border-2 flex flex-col items-center justify-center ${colors.bg} ${colors.border}`}
            style={{
              left: node.x,
              top: node.y,
              width: nodeWidth,
              height: nodeHeight,
              opacity: nodeProgress,
              transform: `scale(${0.8 + nodeProgress * 0.2})`,
            }}
          >
            <span className={`text-sm font-semibold ${colors.text} truncate max-w-[100px]`}>
              {node.label}
            </span>
            {node.sublabel && (
              <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'} truncate max-w-[100px]`}>
                {node.sublabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
