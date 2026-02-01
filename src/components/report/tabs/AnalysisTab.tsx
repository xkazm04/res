'use client';

import type { ResearchContradiction, ResearchGap, CausalChain } from '@/src/types/research';
import { ThemedSection } from '../ThemedCards';
import { EmptyState } from '../shared/EmptyState';
import { PriorityBadge } from '../shared/Badges';
import { AlertIcon, TargetIcon, ArrowRightIcon } from '../shared/Icons';
import { UniversalCard, CardConflictDisplay, CardChainDisplay } from '../shared/UniversalCard';
import { useThemedColors } from '../shared/themeColors';

interface AnalysisTabProps {
  contradictions: ResearchContradiction[];
  gaps: ResearchGap[];
  causalChains: CausalChain[];
}

export function AnalysisTab({ contradictions, gaps, causalChains }: AnalysisTabProps) {
  const hasContent = contradictions.length > 0 || gaps.length > 0 || causalChains.length > 0;

  if (!hasContent) {
    return <EmptyState type="chain" title="No analysis data available" />;
  }

  return (
    <div className="space-y-4">
      {/* Contradictions */}
      {contradictions.length > 0 && (
        <ThemedSection title="Contradictions" count={contradictions.length} collapsible defaultExpanded>
          <div className="space-y-3">
            {contradictions.map((c) => (
              <ContradictionCard key={c.id} contradiction={c} />
            ))}
          </div>
        </ThemedSection>
      )}

      {/* Research Gaps */}
      {gaps.length > 0 && (
        <ThemedSection title="Research Gaps" count={gaps.length} collapsible defaultExpanded>
          <div className="space-y-3">
            {gaps.map((g) => (
              <GapCard key={g.id} gap={g} />
            ))}
          </div>
        </ThemedSection>
      )}

      {/* Causal Chains */}
      {causalChains.length > 0 && (
        <ThemedSection title="Causal Chains" count={causalChains.length} collapsible defaultExpanded>
          <div className="space-y-3">
            {causalChains.map((chain) => (
              <CausalChainCard key={chain.id} chain={chain} />
            ))}
          </div>
        </ThemedSection>
      )}
    </div>
  );
}

function ContradictionCard({ contradiction }: { contradiction: ResearchContradiction }) {
  const { isRadar } = useThemedColors();

  return (
    <UniversalCard
      variant="danger"
      disableExpand
      showChevron={false}
      header={
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 ${isRadar ? 'text-red-400' : 'text-red-600'}`}><AlertIcon /></span>
          <span className={`text-xs font-semibold uppercase ${isRadar ? 'text-red-400' : 'text-red-700'}`}>
            Contradiction
          </span>
          {contradiction.significance && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isRadar ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
              {contradiction.significance}
            </span>
          )}
        </div>
      }
      footer={
        <>
          <CardConflictDisplay
            claimA={contradiction.claim_1}
            claimASource={contradiction.source_1}
            claimB={contradiction.claim_2}
            claimBSource={contradiction.source_2}
            className="mb-3"
          />
          {contradiction.resolution_hint && (
            <div className={`text-xs p-2 rounded border ${isRadar ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}>
              <span className="font-medium">Resolution hint:</span> {contradiction.resolution_hint}
            </div>
          )}
        </>
      }
    />
  );
}

function GapCard({ gap }: { gap: ResearchGap }) {
  const suggestedQueries = gap.suggested_queries || [];
  const { isRadar } = useThemedColors();

  return (
    <UniversalCard
      disableExpand
      showChevron={false}
      colorScheme={{
        bg: isRadar ? 'bg-violet-500/10' : 'bg-violet-50',
        border: isRadar ? 'border-violet-500/30' : 'border-violet-200',
      }}
      header={
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 ${isRadar ? 'text-violet-400' : 'text-violet-600'}`}><TargetIcon /></span>
          <span className={`text-xs font-semibold uppercase ${isRadar ? 'text-violet-400' : 'text-violet-700'}`}>
            {gap.gap_type} Gap
          </span>
        </div>
      }
      actions={<PriorityBadge priority={gap.priority} />}
      footer={
        <>
          <p className={`text-sm mb-3 ${isRadar ? 'text-slate-300' : 'text-slate-700'}`}>{gap.description}</p>

          {suggestedQueries.length > 0 && (
            <div className={`p-2 rounded border ${isRadar ? 'bg-slate-800 border-violet-500/30' : 'bg-white border-violet-100'}`}>
              <div className={`text-[10px] font-medium mb-1 ${isRadar ? 'text-violet-400' : 'text-violet-600'}`}>
                Suggested Queries
              </div>
              <ul className="space-y-1">
                {suggestedQueries.slice(0, 3).map((query, i) => (
                  <li key={i} className={`text-xs flex items-center gap-1 ${isRadar ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className={`w-3 h-3 ${isRadar ? 'text-violet-500' : 'text-violet-400'}`}><ArrowRightIcon /></span>
                    {query}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      }
    />
  );
}

function CausalChainCard({ chain }: { chain: CausalChain }) {
  const descriptions = chain.descriptions || [];
  const { isRadar } = useThemedColors();

  return (
    <UniversalCard
      variant="info"
      disableExpand
      showChevron={false}
      header={
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase ${isRadar ? 'text-blue-400' : 'text-blue-700'}`}>
            Causal Chain
          </span>
          <span className={`text-[10px] ${isRadar ? 'text-blue-500' : 'text-blue-500'}`}>
            {descriptions.length} step{descriptions.length !== 1 ? 's' : ''}
          </span>
        </div>
      }
      footer={<CardChainDisplay steps={descriptions} />}
    />
  );
}
