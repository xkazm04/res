'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import { useFinancialStore } from '@/src/stores/financialStore';
import { format, parseISO, startOfMonth } from 'date-fns';
import type { ResearchFinding } from '@/src/types/research';

interface FinancialTimelineProps {
  findings: ResearchFinding[];
}

interface TimelineDataPoint {
  date: string;
  month: string;
  count: number;
  findings: ResearchFinding[];
}

export function FinancialTimeline({ findings }: FinancialTimelineProps) {
  const { setBrushedTimeRange } = useFinancialStore();

  const data = useMemo(() => {
    // Group findings by month
    const monthMap = new Map<string, ResearchFinding[]>();

    findings
      .filter((f) => f.event_date)
      .forEach((finding) => {
        const date = parseISO(finding.event_date!);
        const monthKey = format(startOfMonth(date), 'yyyy-MM');

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, []);
        }
        monthMap.get(monthKey)!.push(finding);
      });

    // Convert to array and sort
    const result: TimelineDataPoint[] = Array.from(monthMap.entries())
      .map(([monthKey, monthFindings]) => ({
        date: monthKey,
        month: format(parseISO(monthKey + '-01'), 'MMM yyyy'),
        count: monthFindings.length,
        findings: monthFindings,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }, [findings]);

  const handleBrushChange = (brushData: { startIndex?: number; endIndex?: number }) => {
    if (brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const startDate = data[brushData.startIndex]?.date;
      const endDate = data[brushData.endIndex]?.date;

      if (startDate && endDate) {
        setBrushedTimeRange({
          start: parseISO(startDate + '-01'),
          end: parseISO(endDate + '-28'),
        });
      }
    } else {
      setBrushedTimeRange({ start: null, end: null });
    }
  };

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        No dated findings to display
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorFindings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={{ stroke: '#27272a' }}
          tickLine={{ stroke: '#27272a' }}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={{ stroke: '#27272a' }}
          tickLine={false}
          domain={[0, maxCount + 1]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '4px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#10b981' }}
          formatter={(value) => value !== undefined ? [`${value} findings`, 'Count'] : ['', 'Count']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorFindings)"
          dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: '#10b981' }}
        />
        {data.length > 5 && (
          <Brush
            dataKey="month"
            height={24}
            stroke="#27272a"
            fill="#0a0a0a"
            onChange={handleBrushChange}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
