'use client';

import { useMemo } from 'react';
import { useFinancialStore } from '@/src/stores/financialStore';
import { TerminalCard } from '@/src/components/ui/card';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/src/lib/utils';
import { Users, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

export function StakeholderPanel() {
  const { session, stakeholders, selectedEntityId, selectEntity } = useFinancialStore();

  if (!session) return null;

  // Transform stakeholders for treemap
  const treemapData = useMemo(() => {
    if (stakeholders.length === 0) return [];

    return stakeholders.map((s, i) => ({
      name: s.name,
      size: Math.max(10, s.impact * 100),
      benefit: s.benefit,
      description: s.description,
    }));
  }, [stakeholders]);

  return (
    <div className="h-full p-4 grid grid-cols-3 gap-4">
      {/* Treemap visualization */}
      <TerminalCard className="col-span-2 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Stakeholder Impact (Cui Bono)
          </span>
        </div>
        <div className="flex-1 min-h-0">
          {treemapData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#18181b"
                fill="#10b981"
                content={<CustomTreemapContent />}
              >
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                  formatter={(value, name, props) => {
                    if (value === undefined) return ['', ''];
                    const payload = (props as any)?.payload;
                    return [
                      `Impact: ${payload?.size?.toFixed(0) ?? 0}%`,
                      payload?.name ?? '',
                    ];
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No stakeholder data available</p>
              </div>
            </div>
          )}
        </div>
      </TerminalCard>

      {/* Stakeholder list */}
      <TerminalCard className="col-span-1 p-4 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Stakeholder List</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {stakeholders.map((stakeholder, index) => (
            <StakeholderCard
              key={stakeholder.name}
              stakeholder={stakeholder}
              rank={index + 1}
              isSelected={selectedEntityId === stakeholder.name}
              onSelect={() => selectEntity(selectedEntityId === stakeholder.name ? null : stakeholder.name)}
            />
          ))}
          {stakeholders.length === 0 && (
            <div className="text-xs text-zinc-600 text-center py-4">
              No stakeholders identified
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="pt-3 mt-3 border-t border-zinc-800">
          <div className="text-[10px] text-zinc-500 mb-2">Benefit Type</div>
          <div className="flex gap-4 text-[10px]">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-zinc-400">Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-zinc-400">Negative</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-zinc-500" />
              <span className="text-zinc-400">Neutral</span>
            </div>
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}

function StakeholderCard({
  stakeholder,
  rank,
  isSelected,
  onSelect,
}: {
  stakeholder: {
    name: string;
    benefit: 'positive' | 'negative' | 'neutral';
    impact: number;
    description?: string;
  };
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const BenefitIcon = stakeholder.benefit === 'positive' ? TrendingUp :
    stakeholder.benefit === 'negative' ? TrendingDown : Minus;
  const benefitColor = stakeholder.benefit === 'positive' ? 'text-emerald-500' :
    stakeholder.benefit === 'negative' ? 'text-red-500' : 'text-zinc-500';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-2 rounded border transition-colors',
        isSelected
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs text-zinc-500 font-mono w-4">{rank}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-200 truncate">{stakeholder.name}</span>
            <BenefitIcon className={cn('w-3 h-3 shrink-0', benefitColor)} />
          </div>
          {stakeholder.description && (
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{stakeholder.description}</p>
          )}
          <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${stakeholder.impact * 100}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function CustomTreemapContent(props: any) {
  const { x, y, width, height, name, benefit } = props;

  if (width < 40 || height < 30) return null;

  const fillColor = benefit === 'positive' ? '#10b981' :
    benefit === 'negative' ? '#ef4444' : '#71717a';

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        fillOpacity={0.6}
        stroke="#18181b"
        strokeWidth={2}
        rx={4}
      />
      {width > 60 && height > 40 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white text-[10px] font-medium"
        >
          {name.length > 15 ? name.slice(0, 15) + '...' : name}
        </text>
      )}
    </g>
  );
}
