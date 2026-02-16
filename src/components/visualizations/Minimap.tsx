'use client';

/**
 * Minimap - Enhanced overview with drill-down state, fog of war, and loading indicators
 *
 * Shows an overview of all nodes with:
 * - Viewport rectangle (smooth animation)
 * - Drill-down state highlighting
 * - Fog of war on unvisited regions
 * - Loading shimmer on regions being fetched
 */

import { useRef, useEffect, useCallback, memo, useState } from 'react';
import type { StrategicMapNode, ViewState, NodeHierarchy, DrillDownState } from '@/src/lib/strategicMap/types';

interface MinimapProps {
  hierarchy: NodeHierarchy | null;
  view: ViewState;
  canvasWidth: number;
  canvasHeight: number;
  onNavigate: (offsetX: number, offsetY: number) => void;
  /** Current drill-down state */
  drillState?: DrillDownState;
  /** Templates that have been visited */
  visitedTemplates?: Set<string>;
  /** Templates currently loading data */
  loadingTemplates?: Set<string>;
}

const MINIMAP_SIZE = 140;
const PADDING = 10;

export const Minimap = memo(function Minimap({
  hierarchy,
  view,
  canvasWidth,
  canvasHeight,
  onNavigate,
  drillState,
  visitedTemplates,
  loadingTemplates,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const animFrameRef = useRef<number>(0);

  // Smooth viewport animation state
  const [smoothView, setSmoothView] = useState(view);

  // Animate viewport rectangle smoothly
  useEffect(() => {
    const target = view;
    let current = { ...smoothView };

    const animate = () => {
      const dx = target.offsetX - current.offsetX;
      const dy = target.offsetY - current.offsetY;
      const ds = target.scale - current.scale;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(ds) < 0.001) {
        setSmoothView(target);
        return;
      }

      current = {
        offsetX: current.offsetX + dx * 0.2,
        offsetY: current.offsetY + dy * 0.2,
        scale: current.scale + ds * 0.2,
      };
      setSmoothView({ ...current });
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [view.offsetX, view.offsetY, view.scale]); // eslint-disable-line react-hooks/exhaustive-deps

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
      (MINIMAP_SIZE - PADDING * 2) / contentHeight,
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

    const timestamp = performance.now();

    // Clear with dark background
    ctx.fillStyle = '#0A0A0C';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Subtle border
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, MINIMAP_SIZE - 1, MINIMAP_SIZE - 1);

    if (hierarchy.allNodes.length === 0) return;

    const { scale, offsetX, offsetY } = getMinimapTransform();

    // Determine focused template for drill highlighting
    const focusedTemplateId = drillState?.focusedTemplateId;

    // Draw nodes with drill-down awareness
    const nodesToDraw = hierarchy.allNodes.filter(
      (n) => n.type === 'cluster' || n.type === 'template',
    );

    for (const node of nodesToDraw) {
      const x = offsetX + node.x * scale;
      const y = offsetY + node.y * scale;
      const r = Math.max(2, node.radius * scale * 0.5);

      // Fog of war: unvisited templates are dimmed
      const isVisited = !visitedTemplates || visitedTemplates.has(node.templateType || node.id);
      const isFocused = focusedTemplateId && (node.id === focusedTemplateId || node.templateType === focusedTemplateId);
      const isLoading = loadingTemplates?.has(node.templateType || node.id);

      let alpha = '88';
      if (isFocused) {
        alpha = 'FF';
      } else if (focusedTemplateId) {
        // When drilled in, dim non-focused templates
        alpha = '25';
      } else if (!isVisited) {
        alpha = '30'; // Fog of war
      }

      // Draw node
      ctx.fillStyle = node.color + alpha;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Focused template gets a bright ring
      if (isFocused) {
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Loading shimmer effect
      if (isLoading) {
        const shimmerPhase = (timestamp * 0.003 + x * 0.01) % 1;
        const shimmerAlpha = 0.3 + 0.3 * Math.sin(shimmerPhase * Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${shimmerAlpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw child nodes when drilled in (topics/sessions as tiny dots)
    if (focusedTemplateId) {
      const childNodes = hierarchy.allNodes.filter(
        (n) =>
          (n.type === 'thematic_group' || n.type === 'topic') &&
          n.templateType === focusedTemplateId,
      );

      for (const node of childNodes) {
        const x = offsetX + node.x * scale;
        const y = offsetY + node.y * scale;
        const r = Math.max(1, node.radius * scale * 0.3);

        ctx.fillStyle = node.color + '66';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw viewport rectangle (smooth animated)
    const viewportWidth = canvasWidth / smoothView.scale;
    const viewportHeight = canvasHeight / smoothView.scale;
    const viewportX = -smoothView.offsetX / smoothView.scale - viewportWidth / 2;
    const viewportY = -smoothView.offsetY / smoothView.scale - viewportHeight / 2;

    const rectX = offsetX + viewportX * scale;
    const rectY = offsetY + viewportY * scale;
    const rectW = viewportWidth * scale;
    const rectH = viewportHeight * scale;

    // Viewport fill
    ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
    ctx.fillRect(rectX, rectY, rectW, rectH);

    // Viewport border (solid, no dash)
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rectX, rectY, rectW, rectH);

    // Corner marks for viewport
    const cornerSize = 4;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22D3EE';

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(rectX, rectY + cornerSize);
    ctx.lineTo(rectX, rectY);
    ctx.lineTo(rectX + cornerSize, rectY);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(rectX + rectW - cornerSize, rectY);
    ctx.lineTo(rectX + rectW, rectY);
    ctx.lineTo(rectX + rectW, rectY + cornerSize);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(rectX, rectY + rectH - cornerSize);
    ctx.lineTo(rectX, rectY + rectH);
    ctx.lineTo(rectX + cornerSize, rectY + rectH);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(rectX + rectW - cornerSize, rectY + rectH);
    ctx.lineTo(rectX + rectW, rectY + rectH);
    ctx.lineTo(rectX + rectW, rectY + rectH - cornerSize);
    ctx.stroke();
  }, [
    hierarchy,
    smoothView,
    canvasWidth,
    canvasHeight,
    getMinimapTransform,
    drillState,
    visitedTemplates,
    loadingTemplates,
  ]);

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
    [hierarchy, view.scale, onNavigate, getMinimapTransform],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      handleMinimapInteraction(e);
    },
    [handleMinimapInteraction],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) {
        handleMinimapInteraction(e);
      }
    },
    [handleMinimapInteraction],
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
    <div className="bg-[#0A0A0C]/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-[#27272A] transition-all duration-200 hover:border-[#3F3F46] hover:shadow-xl">
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
      {/* Drill state label */}
      {drillState && drillState.level !== 'overview' && (
        <div className="px-2 py-0.5 text-[8px] uppercase tracking-widest text-gray-500 border-t border-[#27272A] bg-[#0A0A0C]">
          {drillState.breadcrumbs[drillState.breadcrumbs.length - 1]?.label || 'Focused'}
        </div>
      )}
    </div>
  );
});
