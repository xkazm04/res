'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme } from '../core/ThemeContext';
import type { SessionWithDetails } from '@/src/types/research';
import type { CustomTabComposition, DataSourceType } from '@/src/stores/customTabStore';
import {
  extractCustomTabData,
  computeCustomTabStats,
  DATA_SOURCE_LABELS,
  DATA_SOURCE_ICONS,
  DATA_SOURCE_COLORS,
  type ExtractedCustomTabData,
} from '@/src/lib/customTabComposition';
import { UniversalCard } from '../shared/UniversalCard';

// ============================================
// CUSTOM TAB VIEW
// ============================================

interface CustomTabViewProps {
  session: SessionWithDetails;
  composition: CustomTabComposition;
  onEditComposition?: () => void;
}

export function CustomTabView({ session, composition, onEditComposition }: CustomTabViewProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  // Extract data based on composition
  const extracted = useMemo(
    () => extractCustomTabData(session, composition),
    [session, composition]
  );

  const stats = useMemo(() => computeCustomTabStats(extracted), [extracted]);

  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState<Set<DataSourceType>>(
    new Set(composition.collapsedSections)
  );

  const toggleSection = useCallback((section: DataSourceType) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Determine layout classes
  const layoutClasses = useMemo(() => {
    switch (composition.layout) {
      case 'columns':
        return 'grid grid-cols-2 gap-6';
      case 'grid':
        return 'grid grid-cols-3 gap-4';
      case 'stacked':
      default:
        return 'space-y-6';
    }
  }, [composition.layout]);

  // Render sections in configured order
  const orderedSections = composition.sectionOrder.filter((s) =>
    extracted.enabledSections.includes(s)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {composition.icon && <span className="text-2xl">{composition.icon}</span>}
          <div>
            <h2 className={`text-lg font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {composition.name}
            </h2>
            {composition.description && (
              <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                {composition.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats summary */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              isRadar ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600'
            }`}
          >
            <span className="font-medium">{stats.filteredItems}</span>
            <span className={isRadar ? 'text-slate-500' : 'text-stone-400'}>items</span>
          </div>

          {onEditComposition && (
            <button
              onClick={onEditComposition}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isRadar
                  ? 'text-cyan-400 hover:bg-cyan-500/10'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
              data-testid="edit-composition-btn"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* No results message */}
      {stats.filteredItems === 0 && (
        <div
          className={`p-8 text-center rounded-lg border-2 border-dashed ${
            isRadar
              ? 'border-slate-700 bg-slate-800/30'
              : 'border-stone-200 bg-stone-50'
          }`}
        >
          <div className="text-4xl mb-3">🔍</div>
          <h3 className={`font-medium mb-1 ${isRadar ? 'text-white' : 'text-stone-900'}`}>
            No matching items
          </h3>
          <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
            Try adjusting your filters to see more results
          </p>
          {onEditComposition && (
            <button
              onClick={onEditComposition}
              className={`mt-4 px-4 py-2 text-sm rounded-lg ${
                isRadar
                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
              data-testid="edit-filters-btn"
            >
              Edit Filters
            </button>
          )}
        </div>
      )}

      {/* Content sections */}
      {stats.filteredItems > 0 && (
        <div className={layoutClasses}>
          {orderedSections.map((section) => (
            <DataSection
              key={section}
              section={section}
              data={extracted}
              isCollapsed={collapsedSections.has(section)}
              onToggle={() => toggleSection(section)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// DATA SECTION
// ============================================

interface DataSectionProps {
  section: DataSourceType;
  data: ExtractedCustomTabData;
  isCollapsed: boolean;
  onToggle: () => void;
}

function DataSection({ section, data, isCollapsed, onToggle }: DataSectionProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const items = getSectionItems(section, data);
  const count = items.length;

  if (count === 0) return null;

  return (
    <div
      className={`rounded-lg border ${
        isRadar ? 'border-slate-700 bg-slate-800/30' : 'border-stone-200 bg-white'
      }`}
    >
      {/* Section header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
          isRadar ? 'hover:bg-slate-700/30' : 'hover:bg-stone-50'
        }`}
        data-testid={`section-header-${section}`}
      >
        <span className="text-lg">{DATA_SOURCE_ICONS[section]}</span>
        <span className={`flex-1 font-medium ${isRadar ? 'text-white' : 'text-stone-900'}`}>
          {DATA_SOURCE_LABELS[section]}
        </span>
        <span
          className={`px-2 py-0.5 text-xs rounded-full ${
            isRadar ? 'bg-cyan-500/20 text-cyan-300' : 'bg-stone-100 text-stone-700'
          }`}
        >
          {count}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'} ${
            isRadar ? 'text-slate-400' : 'text-stone-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`px-4 pb-4 space-y-2 border-t ${
                isRadar ? 'border-slate-700' : 'border-stone-100'
              }`}
            >
              <div className="pt-3">
                {section === 'findings' &&
                  data.findings.map((item) => (
                    <FindingCard key={item.id} finding={item} />
                  ))}
                {section === 'entities' &&
                  data.entities.map((item) => (
                    <EntityCard key={item.id} entity={item} />
                  ))}
                {section === 'sources' &&
                  data.sources.map((item) => <SourceCard key={item.id} source={item} />)}
                {section === 'perspectives' &&
                  data.perspectives.map((item) => (
                    <PerspectiveCard key={item.id} perspective={item} />
                  ))}
                {section === 'contradictions' &&
                  data.contradictions.map((item) => (
                    <ContradictionCard key={item.id} contradiction={item} />
                  ))}
                {section === 'gaps' &&
                  data.gaps.map((item) => <GapCard key={item.id} gap={item} />)}
                {section === 'causalChains' &&
                  data.causalChains.map((item) => (
                    <CausalChainCard key={item.id} chain={item} />
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getSectionItems(section: DataSourceType, data: ExtractedCustomTabData): unknown[] {
  switch (section) {
    case 'findings':
      return data.findings;
    case 'entities':
      return data.entities;
    case 'sources':
      return data.sources;
    case 'perspectives':
      return data.perspectives;
    case 'contradictions':
      return data.contradictions;
    case 'gaps':
      return data.gaps;
    case 'causalChains':
      return data.causalChains;
    default:
      return [];
  }
}

// ============================================
// CARD COMPONENTS
// ============================================

import type {
  ResearchFinding,
  KnowledgeEntity,
  ResearchSource,
  ResearchPerspective,
  ResearchContradiction,
  ResearchGap,
  CausalChain,
} from '@/src/types/research';

function FindingCard({ finding }: { finding: ResearchFinding }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${
        isRadar ? 'bg-slate-900/50 border border-slate-700' : 'bg-stone-50 border border-stone-100'
      }`}
      data-testid={`finding-card-${finding.id}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            isRadar ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {finding.finding_type}
        </span>
        {finding.confidence_score !== undefined && (
          <ConfidenceBadge score={finding.confidence_score} />
        )}
        {finding.temporal_context && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              isRadar ? 'bg-slate-700 text-slate-400' : 'bg-stone-200 text-stone-500'
            }`}
          >
            {finding.temporal_context}
          </span>
        )}
      </div>
      <p className={`text-sm ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
        {finding.summary || finding.content}
      </p>
    </div>
  );
}

function EntityCard({ entity }: { entity: KnowledgeEntity }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${
        isRadar ? 'bg-slate-900/50 border border-slate-700' : 'bg-stone-50 border border-stone-100'
      }`}
      data-testid={`entity-card-${entity.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              isRadar ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}
          >
            {entity.entity_type}
          </span>
          <span className={`font-medium ${isRadar ? 'text-white' : 'text-stone-900'}`}>
            {entity.canonical_name}
          </span>
        </div>
        <span className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
          {entity.mention_count} mentions
        </span>
      </div>
      {entity.description && (
        <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-600'}`}>
          {entity.description}
        </p>
      )}
      {entity.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entity.aliases.slice(0, 3).map((alias, i) => (
            <span
              key={i}
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                isRadar ? 'bg-slate-700 text-slate-400' : 'bg-stone-200 text-stone-500'
              }`}
            >
              {alias}
            </span>
          ))}
          {entity.aliases.length > 3 && (
            <span className={`text-[10px] ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
              +{entity.aliases.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SourceCard({ source }: { source: ResearchSource }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${
        isRadar ? 'bg-slate-900/50 border border-slate-700' : 'bg-stone-50 border border-stone-100'
      }`}
      data-testid={`source-card-${source.id}`}
    >
      <div className="flex items-start gap-2 mb-2">
        {source.source_type && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              isRadar ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
            }`}
          >
            {source.source_type}
          </span>
        )}
        {source.credibility_score !== undefined && (
          <CredibilityBadge score={source.credibility_score} />
        )}
      </div>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-sm font-medium hover:underline ${
          isRadar ? 'text-cyan-400' : 'text-blue-600'
        }`}
      >
        {source.title || source.url}
      </a>
      {source.domain && (
        <p className={`text-xs mt-1 ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
          {source.domain}
        </p>
      )}
      {source.snippet && (
        <p className={`text-sm mt-2 line-clamp-2 ${isRadar ? 'text-slate-400' : 'text-stone-600'}`}>
          {source.snippet}
        </p>
      )}
    </div>
  );
}

function PerspectiveCard({ perspective }: { perspective: ResearchPerspective }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${
        isRadar ? 'bg-slate-900/50 border border-slate-700' : 'bg-stone-50 border border-stone-100'
      }`}
      data-testid={`perspective-card-${perspective.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            isRadar ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {perspective.perspective_type}
        </span>
      </div>
      <p className={`text-sm ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
        {perspective.analysis_text}
      </p>
      {perspective.warnings && perspective.warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {perspective.warnings.slice(0, 2).map((warning, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded ${
                isRadar ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
              }`}
            >
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}
      {perspective.key_insights && perspective.key_insights.length > 0 && (
        <div className="mt-2 space-y-1">
          {perspective.key_insights.slice(0, 2).map((insight, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded ${
                isRadar ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'
              }`}
            >
              💡 {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContradictionCard({ contradiction }: { contradiction: ResearchContradiction }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${
        isRadar
          ? 'bg-rose-500/5 border border-rose-500/20'
          : 'bg-rose-50 border border-rose-100'
      }`}
      data-testid={`contradiction-card-${contradiction.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">⚡</span>
        <span className={`text-xs font-medium ${isRadar ? 'text-rose-300' : 'text-rose-700'}`}>
          Contradiction
        </span>
      </div>
      <div className="space-y-2">
        <div className={`text-sm ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
          <strong>Claim 1:</strong> {contradiction.claim_1}
        </div>
        <div className={`text-sm ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
          <strong>Claim 2:</strong> {contradiction.claim_2}
        </div>
      </div>
      {contradiction.significance && (
        <p className={`text-xs mt-2 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
          {contradiction.significance}
        </p>
      )}
    </div>
  );
}

function GapCard({ gap }: { gap: ResearchGap }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const priorityColors = {
    high: isRadar ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700',
    medium: isRadar ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700',
    low: isRadar ? 'bg-slate-700 text-slate-300' : 'bg-stone-200 text-stone-600',
  };

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${
        isRadar
          ? 'bg-orange-500/5 border border-orange-500/20'
          : 'bg-orange-50 border border-orange-100'
      }`}
      data-testid={`gap-card-${gap.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[gap.priority]}`}
        >
          {gap.priority} priority
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            isRadar ? 'bg-slate-700 text-slate-400' : 'bg-stone-200 text-stone-500'
          }`}
        >
          {gap.gap_type}
        </span>
      </div>
      <p className={`text-sm ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
        {gap.description}
      </p>
      {gap.suggested_queries && gap.suggested_queries.length > 0 && (
        <div className="mt-2">
          <p className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            Suggested queries:
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {gap.suggested_queries.slice(0, 2).map((query, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded ${
                  isRadar ? 'bg-slate-700 text-slate-300' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {query}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CausalChainCard({ chain }: { chain: CausalChain }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${
        isRadar
          ? 'bg-cyan-500/5 border border-cyan-500/20'
          : 'bg-cyan-50 border border-cyan-100'
      }`}
      data-testid={`chain-card-${chain.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🔄</span>
        <span className={`text-xs font-medium ${isRadar ? 'text-cyan-300' : 'text-cyan-700'}`}>
          Causal Chain ({chain.finding_ids?.length || 0} steps)
        </span>
      </div>
      <div className="space-y-1">
        {chain.descriptions?.map((desc, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                isRadar ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
              }`}
            >
              {i + 1}
            </span>
            <p className={`text-sm ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// BADGE COMPONENTS
// ============================================

function ConfidenceBadge({ score }: { score: number }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const percentage = Math.round(score * 100);
  const colorClass =
    percentage >= 80
      ? isRadar
        ? 'bg-emerald-500/20 text-emerald-300'
        : 'bg-emerald-100 text-emerald-700'
      : percentage >= 50
        ? isRadar
          ? 'bg-amber-500/20 text-amber-300'
          : 'bg-amber-100 text-amber-700'
        : isRadar
          ? 'bg-rose-500/20 text-rose-300'
          : 'bg-rose-100 text-rose-700';

  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorClass}`}>{percentage}%</span>;
}

function CredibilityBadge({ score }: { score: number }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const percentage = Math.round(score * 100);
  const colorClass =
    percentage >= 80
      ? isRadar
        ? 'bg-emerald-500/20 text-emerald-300'
        : 'bg-emerald-100 text-emerald-700'
      : percentage >= 50
        ? isRadar
          ? 'bg-amber-500/20 text-amber-300'
          : 'bg-amber-100 text-amber-700'
        : isRadar
          ? 'bg-rose-500/20 text-rose-300'
          : 'bg-rose-100 text-rose-700';

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorClass}`}>
      {percentage}% credibility
    </span>
  );
}

export default CustomTabView;
