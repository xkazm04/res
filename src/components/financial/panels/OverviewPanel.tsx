'use client';

import { useMemo } from 'react';
import { useFinancialStore } from '@/src/stores/financialStore';
import { TerminalCard } from '@/src/components/ui/card';
import { FindingTypeBadge, SourceTypeBadge } from '@/src/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, FileText, Target } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { FinancialTimeline } from '../charts/FinancialTimeline';
import { CredibilityScatter } from '../charts/CredibilityScatter';

export function OverviewPanel() {
  const { session, stakeholders, moneyFlows, getFinancialPerspective } = useFinancialStore();

  const financialPerspective = getFinancialPerspective();

  const stats = useMemo(() => {
    if (!session) return null;

    const findings = session.findings;
    const sources = session.sources;

    return {
      totalFindings: findings.length,
      factCount: findings.filter((f) => f.finding_type === 'fact').length,
      claimCount: findings.filter((f) => f.finding_type === 'claim').length,
      eventCount: findings.filter((f) => f.finding_type === 'event').length,
      patternCount: findings.filter((f) => f.finding_type === 'pattern').length,
      gapCount: findings.filter((f) => f.finding_type === 'gap').length,
      totalSources: sources.length,
      credibleSources: sources.filter((s) => (s.credibility_score || 0) >= 0.7).length,
      avgCredibility: sources.length > 0
        ? sources.reduce((sum, s) => sum + (s.credibility_score || 0), 0) / sources.length
        : 0,
      contradictions: session.contradictions.length,
      perspectives: session.perspectives.length,
    };
  }, [session]);

  if (!session || !stats) return null;

  return (
    <div className="h-full p-4 grid grid-cols-4 grid-rows-3 gap-4">
      {/* Key Metrics Row */}
      <TerminalCard className="col-span-1 p-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Findings</div>
        <div className="text-3xl font-bold text-emerald-400 tabular-nums">{stats.totalFindings}</div>
        <div className="mt-3 space-y-1">
          <MetricRow label="Facts" value={stats.factCount} color="text-blue-400" />
          <MetricRow label="Claims" value={stats.claimCount} color="text-purple-400" />
          <MetricRow label="Events" value={stats.eventCount} color="text-amber-400" />
          <MetricRow label="Patterns" value={stats.patternCount} color="text-indigo-400" />
          <MetricRow label="Gaps" value={stats.gapCount} color="text-zinc-400" />
        </div>
      </TerminalCard>

      <TerminalCard className="col-span-1 p-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Sources</div>
        <div className="text-3xl font-bold text-blue-400 tabular-nums">{stats.totalSources}</div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Credible (&gt;70%)</span>
            <span className="text-sm text-emerald-400 font-mono">{stats.credibleSources}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Avg. Credibility</span>
            <span className={cn(
              "text-sm font-mono",
              stats.avgCredibility >= 0.7 ? "text-emerald-400" :
                stats.avgCredibility >= 0.4 ? "text-amber-400" : "text-red-400"
            )}>
              {(stats.avgCredibility * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </TerminalCard>

      <TerminalCard className="col-span-1 p-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Stakeholders</div>
        <div className="text-3xl font-bold text-amber-400 tabular-nums">{stakeholders.length}</div>
        <div className="mt-3">
          {stakeholders.slice(0, 3).map((s, i) => (
            <div key={s.name} className="flex items-center gap-2 text-xs text-zinc-400 py-1">
              <span className="text-emerald-500">{i + 1}.</span>
              <span className="truncate">{s.name}</span>
            </div>
          ))}
          {stakeholders.length > 3 && (
            <div className="text-[10px] text-zinc-600 mt-1">+{stakeholders.length - 3} more</div>
          )}
        </div>
      </TerminalCard>

      <TerminalCard className="col-span-1 p-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Money Flows</div>
        <div className="text-3xl font-bold text-rose-400 tabular-nums">{moneyFlows.links.length}</div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Entities</span>
            <span className="text-sm text-zinc-300 font-mono">{moneyFlows.nodes.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Conflicts</span>
            <span className={cn(
              "text-sm font-mono",
              stats.contradictions > 0 ? "text-orange-400" : "text-zinc-500"
            )}>
              {stats.contradictions}
            </span>
          </div>
        </div>
      </TerminalCard>

      {/* Timeline Chart */}
      <TerminalCard className="col-span-2 row-span-2 p-4 flex flex-col">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Event Timeline</div>
        <div className="flex-1 min-h-0">
          <FinancialTimeline findings={session.findings} />
        </div>
      </TerminalCard>

      {/* Credibility Matrix */}
      <TerminalCard className="col-span-2 row-span-2 p-4 flex flex-col">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Source Credibility Matrix</div>
        <div className="flex-1 min-h-0">
          <CredibilityScatter sources={session.sources} />
        </div>
      </TerminalCard>

      {/* Financial Perspective Summary */}
      <TerminalCard className="col-span-4 p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Financial Analysis Summary</span>
        </div>
        {financialPerspective ? (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Key Insights</div>
              <ul className="space-y-1">
                {financialPerspective.key_insights?.slice(0, 3).map((insight, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Who Benefits (Cui Bono)</div>
              <div className="flex flex-wrap gap-1">
                {stakeholders.slice(0, 5).map((s) => (
                  <span key={s.name} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Warnings</div>
              <ul className="space-y-1">
                {financialPerspective.warnings?.slice(0, 2).map((warning, i) => (
                  <li key={i} className="text-xs text-orange-400 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 text-center py-4">
            Financial perspective analysis not available
          </div>
        )}
      </TerminalCard>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={cn("text-sm font-mono", color)}>{value}</span>
    </div>
  );
}
