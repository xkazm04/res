'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ResearchSource, SourceType } from '@/src/types/research';

interface CredibilityScatterProps {
  sources: ResearchSource[];
}

interface ScatterPoint {
  x: number; // Citation count
  y: number; // Credibility score
  z: number; // Size (based on citation count)
  name: string;
  type: SourceType;
  domain: string;
}

const sourceTypeColors: Record<SourceType, string> = {
  news: '#3b82f6',
  academic: '#8b5cf6',
  government: '#10b981',
  corporate: '#f59e0b',
  blog: '#f43f5e',
  social: '#06b6d4',
  wiki: '#6b7280',
  unknown: '#52525b',
};

export function CredibilityScatter({ sources }: CredibilityScatterProps) {
  const data = useMemo((): ScatterPoint[] => {
    return sources
      .filter((s) => s.credibility_score !== undefined && s.credibility_score !== null)
      .map((source) => ({
        x: source.citation_count || 0,
        y: (source.credibility_score || 0) * 100,
        z: Math.max(10, Math.sqrt(source.citation_count || 1) * 10),
        name: source.title || source.domain || 'Unknown',
        type: source.source_type || 'unknown',
        domain: source.domain || 'unknown',
      }));
  }, [sources]);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        No source data available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveContainer width="100%" height="85%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <XAxis
            type="number"
            dataKey="x"
            name="Citations"
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={{ stroke: '#27272a' }}
            label={{ value: 'Citations', position: 'bottom', fill: '#52525b', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Credibility"
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={false}
            label={{ value: 'Credibility %', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 10 }}
          />
          <ZAxis type="number" dataKey="z" range={[20, 200]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '4px',
              fontSize: '11px',
            }}
            formatter={(value, name) => {
              if (value === undefined) return ['', name];
              if (name === 'Credibility') return [`${Number(value).toFixed(1)}%`, name];
              return [value, name];
            }}
            labelFormatter={(label) => data.find((d) => d.x === label)?.name || ''}
          />
          <Scatter data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={sourceTypeColors[entry.type]} fillOpacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {Object.entries(sourceTypeColors).map(([type, color]) => {
          const count = data.filter((d) => d.type === type).length;
          if (count === 0) return null;
          return (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-zinc-500 capitalize">{type}</span>
              <span className="text-[10px] text-zinc-600">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
