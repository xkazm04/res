'use client';

import { useResearchStore } from '@/src/stores/researchStore';
import { ConsultingCard } from '@/src/components/ui/card';
import { FindingTypeBadge } from '@/src/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, Users, BarChart2, Lightbulb, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function OverviewPanel() {
  const { session, competitors, swotItems, marketTrends, opportunities, setActiveView } = useResearchStore();

  if (!session) return null;

  const strengths = swotItems.filter((i) => i.category === 'strength').length;
  const weaknesses = swotItems.filter((i) => i.category === 'weakness').length;
  const opportunitiesCount = swotItems.filter((i) => i.category === 'opportunity').length;
  const threats = swotItems.filter((i) => i.category === 'threat').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Executive Summary */}
      <ConsultingCard className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Executive Summary</h2>
        <div className="grid grid-cols-4 gap-6">
          <SummaryCard
            title="Competitive Landscape"
            value={competitors.length}
            subtitle="identified competitors"
            icon={Target}
            color="blue"
            onClick={() => setActiveView('landscape')}
          />
          <SummaryCard
            title="Market Position"
            value={`${strengths}S / ${weaknesses}W`}
            subtitle="SWOT factors"
            icon={BarChart2}
            color="emerald"
            onClick={() => setActiveView('swot')}
          />
          <SummaryCard
            title="Market Trends"
            value={marketTrends.length}
            subtitle="active trends"
            icon={TrendingUp}
            color="purple"
            onClick={() => setActiveView('trends')}
          />
          <SummaryCard
            title="Opportunities"
            value={opportunities.length}
            subtitle="identified gaps"
            icon={Lightbulb}
            color="amber"
            onClick={() => setActiveView('recommendations')}
          />
        </div>
      </ConsultingCard>

      <div className="grid grid-cols-2 gap-6">
        {/* SWOT Summary */}
        <ConsultingCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">SWOT Overview</h3>
            <button
              onClick={() => setActiveView('swot')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Analysis <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SWOTQuadrant
              label="Strengths"
              count={strengths}
              color="emerald"
              items={swotItems.filter((i) => i.category === 'strength').slice(0, 2)}
            />
            <SWOTQuadrant
              label="Weaknesses"
              count={weaknesses}
              color="red"
              items={swotItems.filter((i) => i.category === 'weakness').slice(0, 2)}
            />
            <SWOTQuadrant
              label="Opportunities"
              count={opportunitiesCount}
              color="blue"
              items={swotItems.filter((i) => i.category === 'opportunity').slice(0, 2)}
            />
            <SWOTQuadrant
              label="Threats"
              count={threats}
              color="amber"
              items={swotItems.filter((i) => i.category === 'threat').slice(0, 2)}
            />
          </div>
        </ConsultingCard>

        {/* Top Trends */}
        <ConsultingCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Key Market Trends</h3>
            <button
              onClick={() => setActiveView('trends')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {marketTrends.slice(0, 4).map((trend) => (
              <TrendItem key={trend.id} trend={trend} />
            ))}
            {marketTrends.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No trends identified</p>
            )}
          </div>
        </ConsultingCard>
      </div>

      {/* Key Findings */}
      <ConsultingCard className="p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Key Research Findings</h3>
        <div className="grid grid-cols-3 gap-4">
          {session.findings.slice(0, 6).map((finding) => (
            <div
              key={finding.id}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <FindingTypeBadge type={finding.finding_type} size="sm" />
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                {finding.summary || finding.content}
              </p>
              {finding.confidence_score && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        finding.confidence_score >= 0.7 ? 'bg-emerald-500' :
                          finding.confidence_score >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${finding.confidence_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(finding.confidence_score * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ConsultingCard>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
  onClick: () => void;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

function SWOTQuadrant({
  label,
  count,
  color,
  items,
}: {
  label: string;
  count: number;
  color: 'emerald' | 'red' | 'blue' | 'amber';
  items: { content: string }[];
}) {
  const colorClasses = {
    emerald: 'border-l-emerald-500',
    red: 'border-l-red-500',
    blue: 'border-l-blue-500',
    amber: 'border-l-amber-500',
  };

  return (
    <div className={cn('p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4', colorClasses[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">{label}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">{count}</span>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <p key={i} className="text-xs text-slate-500 line-clamp-1">• {item.content}</p>
        ))}
      </div>
    </div>
  );
}

function TrendItem({ trend }: { trend: { name: string; direction: 'up' | 'down' | 'stable'; impact: string; description: string } }) {
  const TrendIcon = trend.direction === 'up' ? TrendingUp :
    trend.direction === 'down' ? TrendingDown : Minus;
  const iconColor = trend.direction === 'up' ? 'text-emerald-500' :
    trend.direction === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <TrendIcon className={cn('w-5 h-5 mt-0.5', iconColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{trend.name}</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded uppercase font-medium',
              trend.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                trend.impact === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            )}
          >
            {trend.impact}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{trend.description}</p>
      </div>
    </div>
  );
}
