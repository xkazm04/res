'use client';

import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { ChevronDown, ChevronRight, AlertTriangle, Lightbulb, Target } from '@/src/components/ui/icons';
import type { ResearchPerspective, PerspectiveType } from '@/src/types/research';

// ============================================================================
// BRUTALIST DESIGN SYSTEM
// ============================================================================
const BRUTALIST = {
  border: '3px solid black',
  borderLight: '2px solid black',
  shadow: '6px 6px 0 black',
  shadowSm: '4px 4px 0 black',
  font: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
} as const;

interface PerspectivePanelProps {
  perspectives: ResearchPerspective[];
  className?: string;
}

const perspectiveLabels: Record<PerspectiveType, string> = {
  historical: 'HISTORICAL',
  political: 'POLITICAL',
  economic: 'ECONOMIC',
  psychological: 'PSYCHOLOGICAL',
  military: 'MILITARY',
  social: 'SOCIAL',
  technological: 'TECHNOLOGICAL',
  financial: 'FINANCIAL',
  journalist: 'JOURNALIST',
  conspirator: 'CONSPIRATOR',
  network: 'NETWORK',
};

export function PerspectivePanel({ perspectives, className }: PerspectivePanelProps) {
  const [expandedPerspective, setExpandedPerspective] = useState<string | null>(
    perspectives[0]?.id || null
  );

  if (perspectives.length === 0) {
    return (
      <aside
        className={cn('bg-white flex items-center justify-center', className)}
        style={{
          borderLeft: BRUTALIST.border,
          fontFamily: BRUTALIST.font,
        }}
      >
        <p className="text-sm text-gray-500 uppercase tracking-widest">No perspectives available</p>
      </aside>
    );
  }

  return (
    <aside
      className={cn('bg-white flex flex-col', className)}
      style={{
        borderLeft: BRUTALIST.border,
        fontFamily: BRUTALIST.font,
      }}
    >
      {/* Header */}
      <div className="p-3 bg-black text-white">
        <h2 className="text-sm font-bold uppercase tracking-widest">Expert Perspectives</h2>
        <p className="text-[10px] uppercase tracking-widest opacity-60 mt-0.5">
          {perspectives.length} analytical viewpoints
        </p>
      </div>

      {/* Perspectives list */}
      <div className="flex-1 overflow-y-auto">
        {perspectives.map((perspective) => (
          <PerspectiveItem
            key={perspective.id}
            perspective={perspective}
            isExpanded={expandedPerspective === perspective.id}
            onToggle={() =>
              setExpandedPerspective(expandedPerspective === perspective.id ? null : perspective.id)
            }
          />
        ))}
      </div>
    </aside>
  );
}

interface PerspectiveItemProps {
  perspective: ResearchPerspective;
  isExpanded: boolean;
  onToggle: () => void;
}

function PerspectiveItem({ perspective, isExpanded, onToggle }: PerspectiveItemProps) {
  const label = perspectiveLabels[perspective.perspective_type] || perspective.perspective_type.toUpperCase();

  return (
    <div style={{ borderBottom: BRUTALIST.borderLight }}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-100 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="text-xs font-bold uppercase tracking-widest flex-1">
          {label}
        </span>
        {perspective.confidence && (
          <span
            className="text-[10px] font-bold bg-gray-200 px-1.5 py-0.5"
            style={{ border: '1px solid black' }}
          >
            {Math.round(perspective.confidence * 100)}%
          </span>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Analysis text */}
          <div
            className="text-xs leading-relaxed p-2 bg-gray-50"
            style={{ border: BRUTALIST.borderLight }}
          >
            {perspective.analysis_text.length > 300
              ? perspective.analysis_text.slice(0, 300) + '...'
              : perspective.analysis_text}
          </div>

          {/* Key insights */}
          {perspective.key_insights && perspective.key_insights.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                <Lightbulb className="w-3 h-3" />
                KEY INSIGHTS
              </div>
              <ul className="space-y-1">
                {perspective.key_insights.slice(0, 3).map((insight, i) => (
                  <li
                    key={i}
                    className="text-[11px] pl-3"
                    style={{ borderLeft: BRUTALIST.borderLight }}
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {perspective.warnings && perspective.warnings.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                WARNINGS
              </div>
              <ul className="space-y-1">
                {perspective.warnings.slice(0, 2).map((warning, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-amber-800 pl-3 bg-amber-50"
                    style={{ borderLeft: '2px solid #f59e0b' }}
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {perspective.recommendations && perspective.recommendations.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700">
                <Target className="w-3 h-3" />
                RECOMMENDATIONS
              </div>
              <ul className="space-y-1">
                {perspective.recommendations.slice(0, 2).map((rec, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-green-800 pl-3 bg-green-50"
                    style={{ borderLeft: '2px solid #22c55e' }}
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specialized data preview */}
          {perspective.specialized_data && (
            <SpecializedDataPreview
              type={perspective.perspective_type}
              data={perspective.specialized_data}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SpecializedDataPreview({
  type,
  data,
}: {
  type: PerspectiveType;
  data: Record<string, unknown> | object;
}) {
  const d = data as Record<string, unknown>;
  switch (type) {
    case 'financial':
      return (
        <div
          className="p-2 bg-gray-100 space-y-1"
          style={{ border: BRUTALIST.borderLight }}
        >
          {Array.isArray(d.cui_bono) && d.cui_bono.length > 0 ? (
            <div className="text-[10px]">
              <span className="font-bold uppercase">Who benefits:</span>{' '}
              <span>{(d.cui_bono as string[]).join(', ')}</span>
            </div>
          ) : null}
          {Array.isArray(d.flows) && d.flows.length > 0 ? (
            <div className="text-[10px] text-gray-600">
              {d.flows.length} money flows identified
            </div>
          ) : null}
        </div>
      );

    case 'conspirator':
      return (
        <div
          className="p-2 bg-purple-50 space-y-1"
          style={{ border: '2px solid #8b5cf6' }}
        >
          {d.theory ? (
            <div className="text-[10px] italic">
              &quot;{String(d.theory).slice(0, 100)}...&quot;
            </div>
          ) : null}
          {d.probability !== undefined ? (
            <div className="text-[10px]">
              <span className="font-bold uppercase">Plausibility:</span>{' '}
              <span>{Math.round(Number(d.probability) * 100)}%</span>
            </div>
          ) : null}
        </div>
      );

    case 'network':
      return (
        <div
          className="p-2 bg-indigo-50 space-y-1"
          style={{ border: '2px solid #6366f1' }}
        >
          {Array.isArray(d.relationships) && d.relationships.length > 0 ? (
            <div className="text-[10px] text-gray-600">
              {d.relationships.length} relationships mapped
            </div>
          ) : null}
          {Array.isArray(d.intermediaries) && d.intermediaries.length > 0 ? (
            <div className="text-[10px]">
              <span className="font-bold uppercase">Key intermediaries:</span>{' '}
              <span>{(d.intermediaries as string[]).join(', ')}</span>
            </div>
          ) : null}
        </div>
      );

    default:
      return null;
  }
}
