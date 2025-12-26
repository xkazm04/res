'use client';

import { useResearchStore, MarketTrend } from '@/src/stores/researchStore';
import { ConsultingCard } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export function TrendsPanel() {
  const { marketTrends } = useResearchStore();

  const trendsByDirection = {
    up: marketTrends.filter((t) => t.direction === 'up'),
    down: marketTrends.filter((t) => t.direction === 'down'),
    stable: marketTrends.filter((t) => t.direction === 'stable'),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Market Trends</h2>
        <p className="text-sm text-slate-500 mt-1">
          Key market trends and their potential impact on strategy
        </p>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-3 gap-6">
        <TrendSummaryCard
          title="Growing Trends"
          count={trendsByDirection.up.length}
          icon={ArrowUpRight}
          color="emerald"
        />
        <TrendSummaryCard
          title="Declining Trends"
          count={trendsByDirection.down.length}
          icon={ArrowDownRight}
          color="red"
        />
        <TrendSummaryCard
          title="Stable Trends"
          count={trendsByDirection.stable.length}
          icon={ArrowRight}
          color="slate"
        />
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-2 gap-6">
        {marketTrends.map((trend) => (
          <TrendCard key={trend.id} trend={trend} />
        ))}
        {marketTrends.length === 0 && (
          <ConsultingCard className="col-span-2 p-8 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500">No market trends identified yet</p>
          </ConsultingCard>
        )}
      </div>
    </div>
  );
}

function TrendSummaryCard({
  title,
  count,
  icon: Icon,
  color,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  color: 'emerald' | 'red' | 'slate';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800',
    red: 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800',
    slate: 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700',
  };

  const iconClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    slate: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <ConsultingCard className={cn('p-6 border', colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{count}</p>
        </div>
        <Icon className={cn('w-8 h-8', iconClasses[color])} />
      </div>
    </ConsultingCard>
  );
}

function TrendCard({ trend }: { trend: MarketTrend }) {
  const DirectionIcon = trend.direction === 'up' ? TrendingUp :
    trend.direction === 'down' ? TrendingDown : Minus;

  const directionColors = {
    up: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
    down: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    stable: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700',
  };

  const impactColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };

  return (
    <ConsultingCard className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', directionColors[trend.direction])}>
            <DirectionIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{trend.name}</h3>
            <span className={cn('inline-block mt-1 px-2 py-0.5 text-[10px] rounded uppercase font-medium', impactColors[trend.impact])}>
              {trend.impact} impact
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {trend.description}
      </p>

      {trend.findingIds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">
            Based on {trend.findingIds.length} finding{trend.findingIds.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </ConsultingCard>
  );
}
