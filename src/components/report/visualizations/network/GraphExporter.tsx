'use client';

/**
 * GraphExporter
 *
 * Export the graph visualization as:
 * - PNG image
 * - SVG vector
 * - JSON data
 */

import { useState, useCallback, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { GraphNode, GraphEdge } from '@/src/lib/graphAlgorithms';
import { cn } from '@/src/lib/utils';
import { Download, Image, FileJson, X, Check } from 'lucide-react';

interface GraphExporterProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  graphData: { nodes: GraphNode[]; edges: GraphEdge[] };
}

export function GraphExporter({ canvasRef, graphData }: GraphExporterProps) {
  const { colors, isRadar, surfaceClasses, tooltipClasses } = useVisualizationTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Export as PNG
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `graph-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  }, [canvasRef]);

  // Export as JSON
  const exportJSON = useCallback(() => {
    try {
      const data = {
        nodes: graphData.nodes.map((n) => ({
          id: n.id,
          label: n.label,
          type: n.type,
          x: n.x,
          y: n.y,
          data: n.data,
        })),
        edges: graphData.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          weight: e.weight,
          data: e.data,
        })),
        metadata: {
          exportedAt: new Date().toISOString(),
          nodeCount: graphData.nodes.length,
          edgeCount: graphData.edges.length,
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `graph-${Date.now()}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  }, [graphData]);

  // Export as SVG (simplified - just the nodes and basic edges)
  const exportSVG = useCallback(() => {
    try {
      const { nodes, edges } = graphData;

      // Calculate bounds
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

      const padding = 50;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;
      const offsetX = -minX + padding;
      const offsetY = -minY + padding;

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Generate SVG content
      const edgeLines = edges
        .map((e) => {
          const source = nodeMap.get(e.source);
          const target = nodeMap.get(e.target);
          if (!source || !target) return '';
          return `<line x1="${source.x + offsetX}" y1="${source.y + offsetY}" x2="${target.x + offsetX}" y2="${target.y + offsetY}" stroke="${isRadar ? '#22d3ee' : '#3b82f6'}" stroke-opacity="0.3" stroke-width="1"/>`;
        })
        .join('\n');

      const nodeCircles = nodes
        .map((n) => {
          const r = n.radius ?? 8;
          return `<circle cx="${n.x + offsetX}" cy="${n.y + offsetY}" r="${r}" fill="${isRadar ? '#22d3ee' : '#3b82f6'}"/>`;
        })
        .join('\n');

      const nodeLabels = nodes
        .map((n) => {
          const label = n.label ?? n.id;
          return `<text x="${n.x + offsetX}" y="${n.y + offsetY + (n.radius ?? 8) + 14}" text-anchor="middle" font-size="10" fill="${isRadar ? '#94a3b8' : '#78716c'}">${label}</text>`;
        })
        .join('\n');

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${isRadar ? '#0f172a' : '#ffffff'}"/>
  <g id="edges">
    ${edgeLines}
  </g>
  <g id="nodes">
    ${nodeCircles}
  </g>
  <g id="labels">
    ${nodeLabels}
  </g>
</svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `graph-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  }, [graphData, isRadar]);

  return (
    <div className="absolute top-3 right-14">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          surfaceClasses,
          showMenu && 'bg-white/10'
        )}
        title="Export"
      >
        {exportStatus === 'success' ? (
          <Check size={16} style={{ color: colors.success }} />
        ) : (
          <Download size={16} style={{ color: colors.textSecondary }} />
        )}
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className={cn('absolute top-full right-0 mt-1 w-40 rounded-lg overflow-hidden', tooltipClasses)}
          >
            <button
              onClick={() => {
                exportPNG();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
              style={{ color: colors.textPrimary }}
            >
              <Image size={14} style={{ color: colors.textSecondary }} />
              Export PNG
            </button>
            <button
              onClick={() => {
                exportSVG();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
              style={{ color: colors.textPrimary }}
            >
              <Image size={14} style={{ color: colors.textSecondary }} />
              Export SVG
            </button>
            <button
              onClick={() => {
                exportJSON();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
              style={{ color: colors.textPrimary }}
            >
              <FileJson size={14} style={{ color: colors.textSecondary }} />
              Export JSON
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
