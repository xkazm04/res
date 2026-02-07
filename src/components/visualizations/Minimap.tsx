'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import type { StrategicMapNode, ViewState, NodeHierarchy } from '@/src/lib/strategicMap/types';

interface MinimapProps {
  hierarchy: NodeHierarchy | null;
  view: ViewState;
  canvasWidth: number;
  canvasHeight: number;
  onNavigate: (offsetX: number, offsetY: number) => void;
}

const MINIMAP_SIZE = 120;
const PADDING = 10;

/**
 * Minimap overlay for the strategic map
 * Shows an overview of all nodes with a viewport rectangle
 */
export const Minimap = memo(function Minimap({
  hierarchy,
  view,
  canvasWidth,
  canvasHeight,
  onNavigate,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Calculate minimap transform
  const getMinimapTransform = useCallback(() => {
    if (!hierarchy || hierarchy.allNodes.length === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0 };
    }

    const { bounds } = hierarchy;
    const contentWidth = bounds.width + PADDING * 2;
    const contentHeight = bounds.height + PADDING * 2;

    const scale = Math.min(
      (MINIMAP_SIZE - PADDING * 2) / contentWidth,
      (MINIMAP_SIZE - PADDING * 2) / contentHeight
    );

    const offsetX = MINIMAP_SIZE / 2 - (bounds.minX + bounds.width / 2) * scale;
    const offsetY = MINIMAP_SIZE / 2 - (bounds.minY + bounds.height / 2) * scale;

    return { scale, offsetX, offsetY };
  }, [hierarchy]);

  // Render minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hierarchy) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_SIZE * dpr;
    canvas.height = MINIMAP_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#0F0F11';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Border
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, MINIMAP_SIZE - 1, MINIMAP_SIZE - 1);

    if (hierarchy.allNodes.length === 0) return;

    const { scale, offsetX, offsetY } = getMinimapTransform();

    // Draw nodes (only templates and clusters for simplicity)
    const nodesToDraw = hierarchy.allNodes.filter(
      n => n.type === 'cluster' || n.type === 'template'
    );

    for (const node of nodesToDraw) {
      const x = offsetX + node.x * scale;
      const y = offsetY + node.y * scale;
      const r = Math.max(2, node.radius * scale * 0.5);

      ctx.fillStyle = node.color + '88';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw viewport rectangle
    const viewportWidth = canvasWidth / view.scale;
    const viewportHeight = canvasHeight / view.scale;
    const viewportX = -view.offsetX / view.scale - viewportWidth / 2;
    const viewportY = -view.offsetY / view.scale - viewportHeight / 2;

    const rectX = offsetX + viewportX * scale;
    const rectY = offsetY + viewportY * scale;
    const rectW = viewportWidth * scale;
    const rectH = viewportHeight * scale;

    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(rectX, rectY, rectW, rectH);
    ctx.setLineDash([]);

    // Fill with semi-transparent
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.fillRect(rectX, rectY, rectW, rectH);
  }, [hierarchy, view, canvasWidth, canvasHeight, getMinimapTransform]);

  // Handle click/drag on minimap
  const handleMinimapInteraction = useCallback(
    (e: React.MouseEvent) => {
      if (!hierarchy || hierarchy.allNodes.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { scale, offsetX, offsetY } = getMinimapTransform();

      // Convert minimap coords to world coords
      const worldX = (x - offsetX) / scale;
      const worldY = (y - offsetY) / scale;

      // Calculate new view offset to center on this point
      const newOffsetX = -worldX * view.scale;
      const newOffsetY = -worldY * view.scale;

      onNavigate(newOffsetX, newOffsetY);
    },
    [hierarchy, view.scale, onNavigate, getMinimapTransform]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      handleMinimapInteraction(e);
    },
    [handleMinimapInteraction]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) {
        handleMinimapInteraction(e);
      }
    },
    [handleMinimapInteraction]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!hierarchy || hierarchy.allNodes.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0F0F11]/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-[#27272A] transition-all duration-200 hover:border-[#3F3F46] hover:shadow-xl">
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
        className="cursor-crosshair transition-opacity duration-150 hover:opacity-100 opacity-90"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
});
