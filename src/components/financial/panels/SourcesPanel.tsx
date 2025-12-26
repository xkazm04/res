'use client';

import { useMemo, useState } from 'react';
import { useFinancialStore } from '@/src/stores/financialStore';
import { TerminalCard } from '@/src/components/ui/card';
import { SourceTypeBadge } from '@/src/components/ui/badge';
import { CredibilityScatter } from '../charts/CredibilityScatter';
import { Globe, ExternalLink, Filter, SortAsc, SortDesc, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { ResearchSource, SourceType } from '@/src/types/research';

type SortField = 'credibility' | 'citations' | 'date';
type SortDirection = 'asc' | 'desc';

export function SourcesPanel() {
  const {
    session,
    getFilteredSources,
    sourceTypeFilter,
    setSourceTypeFilter,
    credibilityThreshold,
    setCredibilityThreshold,
  } = useFinancialStore();

  const [sortField, setSortField] = useState<SortField>('credibility');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredSources = getFilteredSources();

  // Sort sources
  const sortedSources = useMemo(() => {
    return [...filteredSources].sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortField) {
        case 'credibility':
          aVal = a.credibility_score || 0;
          bVal = b.credibility_score || 0;
          break;
        case 'citations':
          aVal = a.citation_count || 0;
          bVal = b.citation_count || 0;
          break;
        case 'date':
          aVal = a.discovered_at ? new Date(a.discovered_at).getTime() : 0;
          bVal = b.discovered_at ? new Date(b.discovered_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [filteredSources, sortField, sortDirection]);

  // Source type counts
  const sourceTypeCounts = useMemo(() => {
    if (!session) return {};
    const counts: Record<string, number> = {};
    session.sources.forEach((s) => {
      const type = s.source_type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [session]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleTypeFilter = (type: string) => {
    if (sourceTypeFilter.includes(type)) {
      setSourceTypeFilter(sourceTypeFilter.filter((t) => t !== type));
    } else {
      setSourceTypeFilter([...sourceTypeFilter, type]);
    }
  };

  if (!session) return null;

  return (
    <div className="h-full p-4 grid grid-cols-4 gap-4">
      {/* Source credibility chart */}
      <TerminalCard className="col-span-2 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Source Credibility Matrix</span>
        </div>
        <div className="flex-1 min-h-0">
          <CredibilityScatter sources={session.sources} />
        </div>
      </TerminalCard>

      {/* Filters */}
      <TerminalCard className="col-span-2 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Filters</span>
        </div>

        <div className="space-y-4">
          {/* Source type filters */}
          <div>
            <div className="text-[10px] text-zinc-500 mb-2">Source Type</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(sourceTypeCounts).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded transition-colors',
                    sourceTypeFilter.includes(type)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  )}
                >
                  {type} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Credibility threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500">Min Credibility</span>
              <span className="text-xs text-zinc-300 font-mono">{(credibilityThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={credibilityThreshold * 100}
              onChange={(e) => setCredibilityThreshold(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Sort options */}
          <div>
            <div className="text-[10px] text-zinc-500 mb-2">Sort By</div>
            <div className="flex gap-1">
              <SortButton
                label="Credibility"
                active={sortField === 'credibility'}
                direction={sortField === 'credibility' ? sortDirection : undefined}
                onClick={() => toggleSort('credibility')}
              />
              <SortButton
                label="Citations"
                active={sortField === 'citations'}
                direction={sortField === 'citations' ? sortDirection : undefined}
                onClick={() => toggleSort('citations')}
              />
              <SortButton
                label="Date"
                active={sortField === 'date'}
                direction={sortField === 'date' ? sortDirection : undefined}
                onClick={() => toggleSort('date')}
              />
            </div>
          </div>
        </div>
      </TerminalCard>

      {/* Source list */}
      <TerminalCard className="col-span-4 p-4 flex flex-col max-h-[400px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Sources</span>
          </div>
          <span className="text-xs text-zinc-500">
            Showing {sortedSources.length} of {session.sources.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0a0a0a]">
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 px-2 text-zinc-500 font-medium">Source</th>
                <th className="text-left py-2 px-2 text-zinc-500 font-medium w-24">Type</th>
                <th className="text-right py-2 px-2 text-zinc-500 font-medium w-24">Credibility</th>
                <th className="text-right py-2 px-2 text-zinc-500 font-medium w-20">Citations</th>
                <th className="text-center py-2 px-2 text-zinc-500 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sortedSources.map((source) => (
                <SourceRow key={source.id} source={source} />
              ))}
            </tbody>
          </table>
        </div>
      </TerminalCard>
    </div>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction?: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors',
        active
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
      )}
    >
      {label}
      {active && direction && (
        direction === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />
      )}
    </button>
  );
}

function SourceRow({ source }: { source: ResearchSource }) {
  const credibility = source.credibility_score || 0;

  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
      <td className="py-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-500 shrink-0">
            {source.domain?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-zinc-300 truncate">{source.title || source.url}</div>
            <div className="text-[10px] text-zinc-500 truncate">{source.domain}</div>
          </div>
        </div>
      </td>
      <td className="py-2 px-2">
        <SourceTypeBadge type={source.source_type || 'unknown'} />
      </td>
      <td className="py-2 px-2 text-right">
        <span
          className={cn(
            'font-mono',
            credibility >= 0.7 ? 'text-emerald-400' :
              credibility >= 0.4 ? 'text-amber-400' : 'text-red-400'
          )}
        >
          {(credibility * 100).toFixed(0)}%
        </span>
      </td>
      <td className="py-2 px-2 text-right text-zinc-400 font-mono">
        {source.citation_count || 0}
      </td>
      <td className="py-2 px-2 text-center">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </td>
    </tr>
  );
}
