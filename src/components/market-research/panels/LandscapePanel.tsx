'use client';

import { useMemo } from 'react';
import { useResearchStore, Competitor } from '@/src/stores/researchStore';
import { ConsultingCard } from '@/src/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceArea, ReferenceLine } from 'recharts';
import { cn } from '@/src/lib/utils';
import { Target, CheckCircle2 } from 'lucide-react';

export function LandscapePanel() {
  const { session, competitors, selectedCompetitorIds, toggleCompetitorSelection, clearCompetitorSelection } = useResearchStore();

  if (!session) return null;

  // Group competitors by quadrant
  const quadrantCounts = useMemo(() => {
    return {
      leader: competitors.filter((c) => c.quadrant === 'leader').length,
      challenger: competitors.filter((c) => c.quadrant === 'challenger').length,
      niche: competitors.filter((c) => c.quadrant === 'niche').length,
      laggard: competitors.filter((c) => c.quadrant === 'laggard').length,
    };
  }, [competitors]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Competitive Landscape</h2>
          <p className="text-sm text-slate-500 mt-1">
            2x2 matrix positioning competitors by market presence and innovation
          </p>
        </div>
        {selectedCompetitorIds.length > 0 && (
          <button
            onClick={clearCompetitorSelection}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Clear Selection ({selectedCompetitorIds.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Landscape Chart */}
        <ConsultingCard className="col-span-2 p-6">
          <div className="h-[500px]">
            <CompetitiveLandscapeMap
              competitors={competitors}
              selectedIds={selectedCompetitorIds}
              onSelect={toggleCompetitorSelection}
            />
          </div>

          {/* Quadrant Legend */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <QuadrantLegend label="Leaders" count={quadrantCounts.leader} color="emerald" position="Top-Right" />
            <QuadrantLegend label="Challengers" count={quadrantCounts.challenger} color="blue" position="Top-Left" />
            <QuadrantLegend label="Niche Players" count={quadrantCounts.niche} color="purple" position="Bottom-Right" />
            <QuadrantLegend label="Laggards" count={quadrantCounts.laggard} color="slate" position="Bottom-Left" />
          </div>
        </ConsultingCard>

        {/* Competitor List */}
        <ConsultingCard className="col-span-1 p-6 max-h-[600px] overflow-hidden flex flex-col">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Competitors</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {competitors.map((competitor) => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                isSelected={selectedCompetitorIds.includes(competitor.id)}
                onSelect={() => toggleCompetitorSelection(competitor.id)}
              />
            ))}
            {competitors.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No competitors identified</p>
            )}
          </div>
        </ConsultingCard>
      </div>
    </div>
  );
}

interface CompetitiveLandscapeMapProps {
  competitors: Competitor[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

function CompetitiveLandscapeMap({ competitors, selectedIds, onSelect }: CompetitiveLandscapeMapProps) {
  const data = competitors.map((c) => ({
    x: c.position.x,
    y: c.position.y,
    z: 200,
    name: c.name,
    id: c.id,
    quadrant: c.quadrant,
  }));

  const quadrantColors: Record<string, string> = {
    leader: '#10b981',
    challenger: '#3b82f6',
    niche: '#8b5cf6',
    laggard: '#64748b',
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
        {/* Quadrant backgrounds */}
        <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="#10b981" fillOpacity={0.1} />
        <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill="#3b82f6" fillOpacity={0.1} />
        <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill="#8b5cf6" fillOpacity={0.1} />
        <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill="#64748b" fillOpacity={0.1} />

        {/* Center lines */}
        <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="3 3" />
        <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" />

        <XAxis
          type="number"
          dataKey="x"
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          label={{ value: 'Market Presence →', position: 'bottom', fill: '#64748b', fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          label={{ value: 'Innovation & Growth →', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
        />
        <ZAxis type="number" dataKey="z" range={[100, 300]} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value, name, props) => {
            if (value === undefined) return ['', ''];
            const payload = (props as any)?.payload;
            return [payload?.name ?? '', ''];
          }}
          labelFormatter={() => ''}
        />
        <Scatter data={data}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={quadrantColors[entry.quadrant]}
              fillOpacity={selectedIds.includes(entry.id) ? 1 : 0.7}
              stroke={selectedIds.includes(entry.id) ? '#1e40af' : 'transparent'}
              strokeWidth={3}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(entry.id)}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function QuadrantLegend({
  label,
  count,
  color,
  position,
}: {
  label: string;
  count: number;
  color: 'emerald' | 'blue' | 'purple' | 'slate';
  position: string;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-500',
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
      <div className={cn('w-3 h-3 rounded-sm', colorClasses[color])} />
      <div className="flex-1">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</div>
        <div className="text-[10px] text-slate-500">{position}</div>
      </div>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{count}</span>
    </div>
  );
}

function CompetitorCard({
  competitor,
  isSelected,
  onSelect,
}: {
  competitor: Competitor;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const quadrantColors: Record<string, string> = {
    leader: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    challenger: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    niche: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    laggard: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-colors',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {competitor.name}
            </span>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
          </div>
          <span className={cn('inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded capitalize', quadrantColors[competitor.quadrant])}>
            {competitor.quadrant}
          </span>
        </div>
        <Target className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
      {competitor.description && (
        <p className="mt-2 text-xs text-slate-500 line-clamp-2">{competitor.description}</p>
      )}
    </button>
  );
}
