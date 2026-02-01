'use client';

/**
 * GraphMinimap
 *
 * Overview navigation panel showing the entire graph with a viewport indicator.
 * Allows clicking to pan and dragging the viewport.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { GraphNode, GraphEdge } from '@/src/lib/graphAlgorithms';
import { cn } from '@/src/lib/utils';

interface GraphMinimapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewState: { zoom: number; panX: number; panY: number };
  containerWidth: number;
  containerHeight: number;
  onViewChange: (viewState: { zoom: number; panX: number; panY: number }) => void;
  width?: number;
  height?: number;
}

export function GraphMinimap({
  nodes,
  edges,
  viewState,
  containerWidth,
  containerHeight,
  onViewChange,
  width = 150,
  height = 100,
}: GraphMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();
  const [isDragging, setIsDragging] = useState(false);

  // Calculate bounds and scale
  const bounds = (() => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: containerWidth, minY: 0, maxY: containerHeight };
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });

    // Add padding
    const padding = 50;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    };
  })();

  const graphWidth = bounds.maxX - bounds.minX || containerWidth;
  const graphHeight = bounds.maxY - bounds.minY || containerHeight;
  const scale = Math.min(width / graphWidth, height / graphHeight);

  // Transform graph coordinates to minimap coordinates
  const toMinimap = useCallback(
    (x: number, y: number) => ({
      x: (x - bounds.minX) * scale,
      y: (y - bounds.minY) * scale,
    }),
    [bounds, scale]
  );

  // Calculate viewport rectangle
  const viewport = (() => {
    const topLeft = {
      x: -viewState.panX / viewState.zoom,
      y: -viewState.panY / viewState.zoom,
    };
    const bottomRight = {
      x: topLeft.x + containerWidth / viewState.zoom,
      y: topLeft.y + containerHeight / viewState.zoom,
    };

    const mmTopLeft = toMinimap(topLeft.x, topLeft.y);
    const mmBottomRight = toMinimap(bottomRight.x, bottomRight.y);

    return {
      x: mmTopLeft.x,
      y: mmTopLeft.y,
      width: mmBottomRight.x - mmTopLeft.x,
      height: mmBottomRight.y - mmTopLeft.y,
    };
  })();

  // Render minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = isRadar ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    ctx.strokeStyle = isRadar ? 'rgba(34, 211, 238, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const p1 = toMinimap(source.x, source.y);
      const p2 = toMinimap(target.x, target.y);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw nodes
    ctx.fillStyle = isRadar ? colors.primary : colors.primary;

    nodes.forEach((node) => {
      const p = toMinimap(node.x, node.y);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, (node.radius ?? 4) * scale * 0.3), 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw viewport
    ctx.strokeStyle = isRadar ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(viewport.x, viewport.y, viewport.width, viewport.height);

    ctx.fillStyle = isRadar ? 'rgba(34, 211, 238, 0.1)' : 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);
  }, [nodes, edges, width, height, viewport, scale, toMinimap, isRadar, colors]);

  // Handle click to pan
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert click to graph coordinates
      const graphX = clickX / scale + bounds.minX;
      const graphY = clickY / scale + bounds.minY;

      // Center the view on this point
      const newPanX = -graphX * viewState.zoom + containerWidth / 2;
      const newPanY = -graphY * viewState.zoom + containerHeight / 2;

      onViewChange({
        ...viewState,
        panX: newPanX,
        panY: newPanY,
      });
    },
    [scale, bounds, viewState, containerWidth, containerHeight, onViewChange]
  );

  // Handle drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const graphX = clickX / scale + bounds.minX;
      const graphY = clickY / scale + bounds.minY;

      const newPanX = -graphX * viewState.zoom + containerWidth / 2;
      const newPanY = -graphY * viewState.zoom + containerHeight / 2;

      onViewChange({
        ...viewState,
        panX: newPanX,
        panY: newPanY,
      });
    },
    [isDragging, scale, bounds, viewState, containerWidth, containerHeight, onViewChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'absolute bottom-3 right-3 rounded-lg overflow-hidden cursor-pointer',
        surfaceClasses,
        'border',
        isRadar ? 'border-cyan-500/20' : 'border-stone-200'
      )}
      style={{ width, height }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  );
}
