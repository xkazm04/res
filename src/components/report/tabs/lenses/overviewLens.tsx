'use client';

import type { SessionWithDetails, ResearchGap } from '@/src/types/research';
import {
  defineLens,
  type LensFilters,
  type SessionStats,
  type LensRenderProps,
} from '../TabLens';
import { QuickStatCard } from '../../shared/Cards';
import { ThemedSection } from '../../ThemedCards';
import { ProgressBar, ConfidenceDistribution } from '../../shared/ProgressBar';
import { DocumentIcon, LinkIcon, UsersIcon, AlertIcon, TargetIcon } from '../../shared/Icons';

// =============================================================================
// Extracted Data Type
// =============================================================================

interface OverviewData {
  allInsights: string[];
  allWarnings: string[];
  allRecommendations: string[];
  gaps: ResearchGap[];
}

// =============================================================================
// Lens Definition
// =============================================================================

export const overviewLens = defineLens<OverviewData>({
  id: 'overview',
  label: 'Overview',
  icon: TargetIcon,
  description: 'Quick summary of research findings, confidence, and key insights',
  order: 0,
  filters: [],

  getBadgeCount: () => null, // Overview doesn't show badge

  extract: (session: SessionWithDetails): OverviewData => {
    const perspectives = session.perspectives || [];

    return {
      allInsights: perspectives.flatMap((p) => p.key_insights || []),
      allWarnings: perspectives.flatMap((p) => p.warnings || []),
      allRecommendations: perspectives.flatMap((p) => p.recommendations || []),
      gaps: session.gaps || [],
    };
  },

  render: OverviewLensView,
});

// =============================================================================
// View Component
// =============================================================================

function OverviewLensView({ data, stats }: LensRenderProps<OverviewData>) {
  const { allInsights, allWarnings, allRecommendations, gaps } = data;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <QuickStatCard
          label="Findings"
          value={stats.findings}
          subtext={`${stats.highConfidence} high confidence`}
          icon={<DocumentIcon />}
          color="blue"
        >
          <ConfidenceDistribution
            high={stats.highConfidence}
            medium={stats.medConfidence}
            low={stats.lowConfidence}
          />
        </QuickStatCard>
        <QuickStatCard
          label="Avg Confidence"
          value={`${stats.avgConfidence}%`}
          icon={<TargetIcon />}
          color={stats.avgConfidence >= 80 ? 'emerald' : stats.avgConfidence >= 50 ? 'amber' : 'red'}
        >
          <ProgressBar value={stats.avgConfidence} color="auto" size="sm" />
        </QuickStatCard>
        <QuickStatCard
          label="Sources"
          value={stats.sources}
          subtext={`${stats.highCredSources} high credibility`}
          icon={<LinkIcon />}
          color="emerald"
        />
        <QuickStatCard
          label="Perspectives"
          value={stats.perspectives}
          icon={<UsersIcon />}
          color="slate"
        />
        <QuickStatCard
          label="Red Flags"
          value={stats.redFlags}
          subtext={stats.redFlags > 0 ? 'Review needed' : 'Clear'}
          icon={<AlertIcon />}
          color={stats.redFlags > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Warnings Banner */}
      {allWarnings.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
            <span className="w-4 h-4">
              <AlertIcon />
            </span>
            Warnings ({allWarnings.length})
          </div>
          <ul className="space-y-1">
            {allWarnings.slice(0, 4).map((w, i) => (
              <li
                key={i}
                className="text-sm text-amber-800 pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-amber-400"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Insights */}
      {allInsights.length > 0 && (
        <ThemedSection title="Key Insights" count={allInsights.length}>
          <ul className="space-y-2">
            {allInsights.slice(0, 6).map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700 pl-3 border-l-2 border-emerald-400 py-1"
              >
                {insight}
              </li>
            ))}
          </ul>
        </ThemedSection>
      )}

      {/* Recommendations */}
      {allRecommendations.length > 0 && (
        <ThemedSection title="Recommended Actions" count={allRecommendations.length}>
          <div className="space-y-2">
            {allRecommendations.slice(0, 5).map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-2 bg-blue-50 rounded-lg">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{rec}</span>
              </div>
            ))}
          </div>
        </ThemedSection>
      )}

      {/* Gaps */}
      {gaps.length > 0 && (
        <ThemedSection title="Research Gaps" count={gaps.length}>
          <div className="space-y-2">
            {gaps.slice(0, 3).map((gap, i) => (
              <div key={i} className="p-3 bg-violet-50 border-l-3 border-violet-500 rounded-r-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-violet-600 uppercase px-1.5 py-0.5 bg-violet-100 rounded">
                    {gap.gap_type}
                  </span>
                  <span className="text-[10px] text-violet-500">{gap.priority} priority</span>
                </div>
                <p className="text-sm text-slate-700">{gap.description}</p>
              </div>
            ))}
          </div>
        </ThemedSection>
      )}
    </div>
  );
}
