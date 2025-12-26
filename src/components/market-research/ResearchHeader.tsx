'use client';

import { useResearchStore } from '@/src/stores/researchStore';
import { StatusIndicator, ProgressBar } from '@/src/components/ui/progress';
import { RefreshCw, BarChart2, Target, TrendingUp, Users, Grid3X3 } from 'lucide-react';
import { formatRelativeTime } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';
import type { SessionWithDetails } from '@/src/types/research';

interface ResearchHeaderProps {
  session: SessionWithDetails | null;
  onRefresh: () => void;
}

export function ResearchHeader({ session, onRefresh }: ResearchHeaderProps) {
  const { activeView, setActiveView, competitors, swotItems, marketTrends, opportunities } = useResearchStore();

  if (!session) return null;

  const progress =
    session.status === 'completed' ? 100 :
      session.status === 'analyzing' ? 75 :
        session.status === 'searching' ? 40 : 20;

  const views = [
    { id: 'overview' as const, label: 'Overview', icon: Grid3X3 },
    { id: 'landscape' as const, label: 'Competitive Landscape', icon: Target },
    { id: 'swot' as const, label: 'SWOT Analysis', icon: BarChart2 },
    { id: 'trends' as const, label: 'Market Trends', icon: TrendingUp },
    { id: 'comparison' as const, label: 'Comparison', icon: Users },
    { id: 'recommendations' as const, label: 'Recommendations', icon: Target },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* Top bar */}
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{session.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">{session.query}</p>
          </div>
        </div>

        {/* Center - Key stats */}
        <div className="flex items-center gap-8">
          <StatBadge label="Competitors" value={competitors.length} color="blue" />
          <StatBadge label="SWOT Items" value={swotItems.length} color="emerald" />
          <StatBadge label="Trends" value={marketTrends.length} color="purple" />
          <StatBadge label="Opportunities" value={opportunities.length} color="amber" />
        </div>

        {/* Right - Status */}
        <div className="flex items-center gap-4">
          <StatusIndicator status={session.status} />
          {session.status !== 'completed' && (
            <div className="w-24">
              <ProgressBar value={progress} size="sm" variant="default" />
            </div>
          )}
          <span className="text-xs text-slate-500">{formatRelativeTime(session.updated_at)}</span>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="h-12 px-6 flex items-center gap-1">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                'flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors border-b-2',
                activeView === view.id
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className="text-center">
      <div className={cn('inline-flex px-3 py-1 rounded-full text-sm font-semibold', colorClasses[color])}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}
