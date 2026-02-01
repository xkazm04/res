'use client';

import { useMemo } from 'react';
import type { ResearchSource } from '@/src/types/research';
import {
  defineLens,
  matchesConfidenceLensFilter,
  type LensFilters,
  type LensRenderProps,
} from '../TabLens';
import { ThemedSection } from '../../ThemedCards';
import { EmptyState } from '../../shared/EmptyState';
import { SourceTypeBadge } from '../../shared/Badges';
import { ProgressBar } from '../../shared/ProgressBar';
import { LinkIcon } from '../../shared/Icons';

// =============================================================================
// Extracted Data Type
// =============================================================================

interface SourcesData {
  filteredSources: ResearchSource[];
  highCred: ResearchSource[];
  medCred: ResearchSource[];
  lowCred: ResearchSource[];
  totalCount: number;
}

// =============================================================================
// Lens Definition
// =============================================================================

export const sourcesLens = defineLens<SourcesData>({
  id: 'sources',
  label: 'Sources',
  icon: LinkIcon,
  description: 'Research sources with credibility scores',
  order: 2,
  filters: ['search', 'confidence'],

  getBadgeCount: (session, stats) => stats.sources,

  extract: (session, filters): SourcesData => {
    const sources = session.sources || [];

    // Apply filters
    const filteredSources = sources.filter((s) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = s.title?.toLowerCase().includes(query);
        const matchesDomain = s.domain?.toLowerCase().includes(query);
        const matchesSnippet = s.snippet?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDomain && !matchesSnippet) return false;
      }

      // Confidence/credibility filter
      if (!matchesConfidenceLensFilter(s.credibility_score || 0, filters.filterConfidence)) {
        return false;
      }

      return true;
    });

    // Group by credibility
    const highCred = filteredSources.filter((s) => (s.credibility_score || 0) >= 0.8);
    const medCred = filteredSources.filter((s) => {
      const c = s.credibility_score || 0;
      return c >= 0.5 && c < 0.8;
    });
    const lowCred = filteredSources.filter((s) => (s.credibility_score || 0) < 0.5);

    return {
      filteredSources,
      highCred,
      medCred,
      lowCred,
      totalCount: sources.length,
    };
  },

  render: SourcesLensView,
});

// =============================================================================
// View Component
// =============================================================================

function SourcesLensView({ data }: LensRenderProps<SourcesData>) {
  const { filteredSources, highCred, medCred, lowCred } = data;

  if (filteredSources.length === 0) {
    return <EmptyState type="search" title="No sources match your filters" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200">
        <div className="flex-1">
          <div className="text-xs text-slate-500 mb-1">Credibility Distribution</div>
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-200">
            <div
              className="bg-emerald-500"
              style={{ width: `${(highCred.length / filteredSources.length) * 100}%` }}
            />
            <div
              className="bg-amber-500"
              style={{ width: `${(medCred.length / filteredSources.length) * 100}%` }}
            />
            <div
              className="bg-red-500"
              style={{ width: `${(lowCred.length / filteredSources.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            High: {highCred.length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Medium: {medCred.length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Low: {lowCred.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <ThemedSection title="Sources" count={filteredSources.length}>
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase">
                  Source
                </th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase w-20">
                  Type
                </th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase w-28">
                  Credibility
                </th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase w-24">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((source) => (
                <SourceRow key={source.id} source={source} />
              ))}
            </tbody>
          </table>
        </div>
      </ThemedSection>
    </div>
  );
}

// =============================================================================
// Source Row Sub-Component
// =============================================================================

function SourceRow({ source }: { source: ResearchSource }) {
  const cred = source.credibility_score || 0;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:underline line-clamp-1"
        >
          {source.title || source.domain || 'Untitled'}
        </a>
        <div className="text-xs text-slate-400 truncate max-w-md">{source.domain}</div>
        {source.snippet && (
          <div className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
            &ldquo;{source.snippet}&rdquo;
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <SourceTypeBadge type={source.source_type || 'unknown'} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar value={cred * 100} size="sm" />
          <span className="text-xs font-medium text-slate-600 w-8">{Math.round(cred * 100)}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {source.content_date ? new Date(source.content_date).toLocaleDateString() : '—'}
      </td>
    </tr>
  );
}
