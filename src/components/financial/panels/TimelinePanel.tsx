'use client';

import { useMemo, useState } from 'react';
import { useFinancialStore } from '@/src/stores/financialStore';
import { TerminalCard } from '@/src/components/ui/card';
import { FindingTypeBadge } from '@/src/components/ui/badge';
import { FinancialTimeline } from '../charts/FinancialTimeline';
import { Calendar, ChevronDown, ChevronRight, Clock, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/src/lib/utils';
import type { ResearchFinding } from '@/src/types/research';

export function TimelinePanel() {
  const { session, getFilteredFindings, selectedFindingId, selectFinding } = useFinancialStore();

  const filteredFindings = getFilteredFindings();

  // Group findings by date
  const groupedFindings = useMemo(() => {
    const groups = new Map<string, ResearchFinding[]>();

    filteredFindings
      .filter((f) => f.event_date)
      .sort((a, b) => new Date(b.event_date!).getTime() - new Date(a.event_date!).getTime())
      .forEach((finding) => {
        const dateKey = format(parseISO(finding.event_date!), 'yyyy-MM-dd');
        if (!groups.has(dateKey)) {
          groups.set(dateKey, []);
        }
        groups.get(dateKey)!.push(finding);
      });

    return Array.from(groups.entries());
  }, [filteredFindings]);

  if (!session) return null;

  return (
    <div className="h-full p-4 grid grid-cols-3 gap-4">
      {/* Timeline chart */}
      <TerminalCard className="col-span-2 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Event Timeline</span>
        </div>
        <div className="h-48">
          <FinancialTimeline findings={session.findings} />
        </div>

        {/* Timeline list */}
        <div className="flex-1 mt-4 overflow-y-auto">
          <div className="space-y-3">
            {groupedFindings.map(([dateKey, findings]) => (
              <DateGroup
                key={dateKey}
                date={dateKey}
                findings={findings}
                selectedFindingId={selectedFindingId}
                onSelectFinding={selectFinding}
              />
            ))}
            {groupedFindings.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-8">
                No dated findings to display
              </div>
            )}
          </div>
        </div>
      </TerminalCard>

      {/* Finding detail */}
      <TerminalCard className="col-span-1 p-4 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Finding Detail</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedFindingId ? (
            <FindingDetail finding={filteredFindings.find((f) => f.id === selectedFindingId)} />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              Select a finding to view details
            </div>
          )}
        </div>
      </TerminalCard>
    </div>
  );
}

function DateGroup({
  date,
  findings,
  selectedFindingId,
  onSelectFinding,
}: {
  date: string;
  findings: ResearchFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-zinc-800 rounded">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        ) : (
          <ChevronRight className="w-3 h-3 text-zinc-500" />
        )}
        <Clock className="w-3 h-3 text-zinc-500" />
        <span className="text-xs text-zinc-300">{format(parseISO(date), 'MMMM d, yyyy')}</span>
        <span className="text-[10px] text-zinc-500 ml-auto">{findings.length} findings</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 space-y-1">
          {findings.map((finding) => (
            <button
              key={finding.id}
              onClick={() => onSelectFinding(finding.id)}
              className={cn(
                'w-full text-left px-2 py-1.5 rounded text-xs transition-colors',
                selectedFindingId === finding.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-zinc-800 text-zinc-400'
              )}
            >
              <div className="flex items-center gap-2">
                <FindingTypeBadge type={finding.finding_type} size="sm" />
                <span className="truncate flex-1">{finding.summary || finding.content}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FindingDetail({ finding }: { finding?: ResearchFinding }) {
  if (!finding) return null;

  return (
    <div className="space-y-4">
      <div>
        <FindingTypeBadge type={finding.finding_type} />
      </div>

      <div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Content</div>
        <p className="text-xs text-zinc-300 leading-relaxed">{finding.content}</p>
      </div>

      {finding.summary && (
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Summary</div>
          <p className="text-xs text-zinc-400">{finding.summary}</p>
        </div>
      )}

      {finding.event_date && (
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Date</div>
          <p className="text-xs text-zinc-300">{format(parseISO(finding.event_date), 'MMMM d, yyyy')}</p>
        </div>
      )}

      {finding.confidence_score !== undefined && (
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  finding.confidence_score >= 0.7 ? 'bg-emerald-500' :
                    finding.confidence_score >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${finding.confidence_score * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {(finding.confidence_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {finding.supporting_sources && finding.supporting_sources.length > 0 && (
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Sources</div>
          <p className="text-xs text-zinc-400">{finding.supporting_sources.length} supporting sources</p>
        </div>
      )}
    </div>
  );
}
