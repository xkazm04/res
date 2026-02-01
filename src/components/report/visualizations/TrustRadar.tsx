'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';
import type { ResearchSource } from '@/src/types/research';

interface TrustRadarProps {
  sources: ResearchSource[];
}

interface DomainScore {
  domain: string;
  type: string;
  avgCredibility: number;
  count: number;
}

export function TrustRadar({ sources }: TrustRadarProps) {
  const { colors, headerClasses, cardClasses } = useVisualizationTheme();

  const domainScores = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number; type: string }>();
    sources.forEach(s => {
      const domain = s.domain || 'unknown';
      const existing = grouped.get(domain) || { total: 0, count: 0, type: s.source_type || 'web' };
      grouped.set(domain, {
        total: existing.total + (s.credibility_score || 0.5),
        count: existing.count + 1,
        type: existing.type
      });
    });

    const scores: DomainScore[] = [];
    grouped.forEach((v, k) => {
      scores.push({ domain: k, avgCredibility: v.total / v.count, count: v.count, type: v.type });
    });
    return scores.sort((a, b) => b.avgCredibility - a.avgCredibility).slice(0, 8);
  }, [sources]);

  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;
  const levels = [0.25, 0.5, 0.75, 1];

  // Calculate polygon points for sources
  const points = domainScores.map((d, i) => {
    const angle = (i / domainScores.length) * Math.PI * 2 - Math.PI / 2;
    const radius = maxRadius * d.avgCredibility;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      labelX: centerX + Math.cos(angle) * (maxRadius + 20),
      labelY: centerY + Math.sin(angle) * (maxRadius + 20),
      ...d
    };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className={`rounded-xl p-4 ${cardClasses}`}>
      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${headerClasses}`}>
        Domain Trust Radar
      </h4>

      <svg width={300} height={300} className="mx-auto">
        {/* Background levels */}
        {levels.map(level => (
          <polygon
            key={level}
            points={domainScores.map((_, i) => {
              const angle = (i / domainScores.length) * Math.PI * 2 - Math.PI / 2;
              const x = centerX + Math.cos(angle) * maxRadius * level;
              const y = centerY + Math.sin(angle) * maxRadius * level;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={colors.gridLine}
          />
        ))}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={centerX + Math.cos((i / points.length) * Math.PI * 2 - Math.PI / 2) * maxRadius}
            y2={centerY + Math.sin((i / points.length) * Math.PI * 2 - Math.PI / 2) * maxRadius}
            stroke={colors.axisLine}
          />
        ))}

        {/* Data polygon */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          d={polygonPath}
          fill={colors.primaryFill}
          stroke={colors.primary}
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            cx={p.x}
            cy={p.y}
            r={4 + p.count}
            fill={colors.primary}
          />
        ))}

        {/* Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px]"
            fill={colors.textSecondary}
          >
            {p.domain.slice(0, 12)}
          </text>
        ))}
      </svg>
    </div>
  );
}
