'use client';

import { useTechMarketStore } from '@/src/stores/techMarketStore';
import { cn } from '@/src/lib/utils';
import {
  Calendar,
  LineChart,
  Target,
  GitBranch,
  TrendingUp,
  LayoutGrid,
  Cpu,
  Cloud,
  Settings,
  Database,
  Shield,
  Code,
} from 'lucide-react';
import type { TechMarketView, TechnologyDomain } from '@/src/types/techMarket';
import { DOMAIN_LABELS } from '@/src/types/techMarket';

const viewTabs: { id: TechMarketView; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'matrix', label: 'Risk/Opportunity', icon: Target },
  { id: 'adoption', label: 'Adoption Curves', icon: LineChart },
  { id: 'scenarios', label: 'Scenarios', icon: GitBranch },
  { id: 'trends', label: '2025 Trends', icon: TrendingUp },
];

const domainFilters: { id: TechnologyDomain | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Domains', icon: LayoutGrid },
  { id: 'ai_ml', label: 'AI/ML', icon: Cpu },
  { id: 'software_development', label: 'Software Dev', icon: Code },
  { id: 'cloud_infrastructure', label: 'Cloud', icon: Cloud },
  { id: 'devops_platform', label: 'DevOps', icon: Settings },
  { id: 'enterprise_stack', label: 'Enterprise', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
];

export function TechMarketHeader() {
  const {
    session,
    activeView,
    setActiveView,
    activeDomain,
    setActiveDomain,
    timelineYear,
    setTimelineYear,
    showHighConfidenceOnly,
    toggleHighConfidenceOnly,
    getDomainSummary,
  } = useTechMarketStore();

  const summary = getDomainSummary();

  return (
    <header className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm sticky top-0 z-40">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-violet-500/20 rounded-lg">
            <Cpu className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm">
              Tech Market Analysis
            </h1>
            <p className="text-xs text-zinc-500">
              {session?.title || '2025-2026 Predictions'}
            </p>
          </div>
        </div>

        {/* Confidence Filter */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleHighConfidenceOnly}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              showHighConfidenceOnly
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'text-zinc-500 hover:text-zinc-300 border border-zinc-700'
            )}
          >
            High Confidence Only
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800/50 overflow-x-auto">
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeView === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Domain Filters & Year Filter */}
      <div className="flex items-center justify-between px-4 py-2 gap-4 overflow-x-auto">
        {/* Domain Chips */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {domainFilters.map((domain) => {
            const Icon = domain.icon;
            const count = domain.id === 'all'
              ? null
              : (summary[domain.id as TechnologyDomain]?.predictionCount || 0) +
                (summary[domain.id as TechnologyDomain]?.trendCount || 0);

            return (
              <button
                key={domain.id}
                onClick={() => setActiveDomain(domain.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-all whitespace-nowrap',
                  activeDomain === domain.id
                    ? 'border-violet-500 bg-violet-500/20 text-violet-400'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{domain.label}</span>
                {count !== null && count > 0 && (
                  <span className="px-1 py-0.5 bg-zinc-700/50 rounded text-[10px]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Year Filter - only show on timeline view */}
        {(activeView === 'timeline' || activeView === 'overview') && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {(['both', 2025, 2026] as const).map((year) => (
              <button
                key={year}
                onClick={() => setTimelineYear(year)}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  timelineYear === year
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {year === 'both' ? 'All Years' : year}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
