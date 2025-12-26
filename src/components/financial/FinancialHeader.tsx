'use client';

import { useFinancialStore } from '@/src/stores/financialStore';
import { StatusIndicator, ProgressRing } from '@/src/components/ui/progress';
import { RefreshCw, Clock, TrendingUp, TrendingDown, BarChart2 } from '@/src/components/ui/icons';
import { formatRelativeTime } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';
import type { SessionWithDetails } from '@/src/types/research';

interface FinancialHeaderProps {
  session: SessionWithDetails | null;
  onRefresh: () => void;
}

export function FinancialHeader({ session, onRefresh }: FinancialHeaderProps) {
  const { activeTab, setActiveTab } = useFinancialStore();

  if (!session) return null;

  const progress =
    session.status === 'completed' ? 100 :
      session.status === 'analyzing' ? 75 :
        session.status === 'searching' ? 40 : 20;

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'flows' as const, label: 'Money Flows' },
    { id: 'stakeholders' as const, label: 'Stakeholders' },
    { id: 'timeline' as const, label: 'Timeline' },
    { id: 'sources' as const, label: 'Sources' },
  ];

  return (
    <header className="bg-[#111111] border-b border-zinc-800">
      {/* Top bar */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-zinc-800/50">
        {/* Left - Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-sm">FINANCIAL ANALYSIS</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-sm text-zinc-400 truncate max-w-[300px]">{session.title}</span>
        </div>

        {/* Center - Stats */}
        <div className="flex items-center gap-6">
          <StatBlock label="FINDINGS" value={session.findings.length} trend="neutral" />
          <StatBlock label="SOURCES" value={session.sources.length} trend="neutral" />
          <StatBlock
            label="CREDIBLE"
            value={session.sources.filter((s) => (s.credibility_score || 0) >= 0.7).length}
            trend="up"
          />
          <StatBlock label="PERSPECTIVES" value={session.perspectives.length} trend="neutral" />
        </div>

        {/* Right - Status and controls */}
        <div className="flex items-center gap-4">
          <StatusIndicator status={session.status} />
          {session.status !== 'completed' && (
            <ProgressRing value={progress} size={28} strokeWidth={2} variant="success" />
          )}
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(session.updated_at)}</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="h-10 px-4 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 h-full text-xs font-medium transition-colors border-b-2',
              activeTab === tab.id
                ? 'text-emerald-400 border-emerald-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function StatBlock({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className="text-[10px] text-zinc-500">{label}</div>
        <div className="text-sm font-bold tabular-nums">{value}</div>
      </div>
      {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
      {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
    </div>
  );
}
