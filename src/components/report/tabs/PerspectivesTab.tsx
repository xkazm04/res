'use client';

import { useState } from 'react';
import type { ResearchPerspective } from '@/src/types/research';
import { ThemedSection } from '../ThemedCards';
import { EmptyState } from '../shared/EmptyState';
import { ConfidenceBadge } from '../shared/Badges';
import { ProgressBar } from '../shared/ProgressBar';
import { CheckCircleIcon, AlertIcon, TargetIcon } from '../shared/Icons';
import { UniversalCard, CardInsightsList } from '../shared/UniversalCard';
import { useThemedColors } from '../shared/themeColors';

interface PerspectivesTabProps {
  perspectives: ResearchPerspective[];
}

const perspectiveColors: Record<string, { bg: string; border: string; icon: string }> = {
  financial: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
  investigative: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600' },
  strategic: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  competitive: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
  technical: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600' },
  legal: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600' },
  default: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600' },
};

export function PerspectivesTab({ perspectives }: PerspectivesTabProps) {
  if (perspectives.length === 0) {
    return <EmptyState type="lightbulb" title="No perspectives available" />;
  }

  return (
    <div className="space-y-4">
      {/* Comparison Grid */}
      {perspectives.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {perspectives.map((p) => (
            <ComparisonCard key={p.id} perspective={p} />
          ))}
        </div>
      )}

      {/* Detailed Cards */}
      <ThemedSection title="Detailed Analysis" count={perspectives.length}>
        <div className="space-y-3">
          {perspectives.map((p) => (
            <PerspectiveCard key={p.id} perspective={p} />
          ))}
        </div>
      </ThemedSection>
    </div>
  );
}

function ComparisonCard({ perspective }: { perspective: ResearchPerspective }) {
  const colors = perspectiveColors[perspective.perspective_type] || perspectiveColors.default;
  const insights = perspective.key_insights || [];
  const warnings = perspective.warnings || [];
  const confidence = perspective.confidence || 0;
  const { isRadar } = useThemedColors();

  return (
    <UniversalCard
      disableExpand
      showChevron={false}
      colorScheme={{
        bg: isRadar ? colors.bg.replace('bg-', 'bg-').replace('-50', '-500/10') : colors.bg,
        border: isRadar ? colors.border.replace('border-', 'border-').replace('-200', '-500/30') : colors.border,
      }}
      header={
        <span className={`text-sm font-semibold capitalize ${isRadar ? colors.icon.replace('-600', '-400') : colors.icon}`}>
          {perspective.perspective_type.replace('_', ' ')}
        </span>
      }
      actions={<ConfidenceBadge score={confidence} />}
      footer={
        <div className={`flex items-center gap-4 text-xs ${isRadar ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="flex items-center gap-1">
            <span className={`w-3 h-3 ${isRadar ? 'text-emerald-400' : 'text-emerald-500'}`}><CheckCircleIcon /></span>
            {insights.length} insights
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-3 h-3 ${isRadar ? 'text-amber-400' : 'text-amber-500'}`}><AlertIcon /></span>
            {warnings.length} warnings
          </span>
        </div>
      }
    />
  );
}

function PerspectiveCard({ perspective }: { perspective: ResearchPerspective }) {
  const [expanded, setExpanded] = useState(true);
  const colors = perspectiveColors[perspective.perspective_type] || perspectiveColors.default;
  const insights = perspective.key_insights || [];
  const warnings = perspective.warnings || [];
  const recommendations = perspective.recommendations || [];
  const confidence = perspective.confidence || 0;
  const { isRadar } = useThemedColors();

  return (
    <UniversalCard
      isExpanded={expanded}
      onToggleExpanded={() => setExpanded(!expanded)}
      colorScheme={{
        bg: isRadar ? 'bg-slate-900/60' : 'bg-white',
        border: isRadar ? 'border-slate-700' : 'border-slate-200',
        headerBg: isRadar ? colors.bg.replace('-50', '-500/20') : colors.bg,
      }}
      header={
        <span className={`font-semibold capitalize ${isRadar ? colors.icon.replace('-600', '-400') : colors.icon}`}>
          {perspective.perspective_type.replace('_', ' ')} Perspective
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <ProgressBar value={confidence * 100} size="sm" />
          <span className={`text-xs w-8 ${isRadar ? 'text-slate-400' : 'text-slate-600'}`}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
      }
      body={
        <div className="space-y-4">
          {/* Analysis */}
          {perspective.analysis_text && (
            <p className={`text-sm leading-relaxed ${isRadar ? 'text-slate-300' : 'text-slate-700'}`}>
              {perspective.analysis_text}
            </p>
          )}

          {/* Grid of insights/warnings/recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.length > 0 && (
              <CardInsightsList
                title="Key Insights"
                items={insights}
                icon={<CheckCircleIcon />}
                variant="success"
              />
            )}
            {warnings.length > 0 && (
              <CardInsightsList
                title="Warnings"
                items={warnings}
                icon={<AlertIcon />}
                variant="warning"
              />
            )}
            {recommendations.length > 0 && (
              <CardInsightsList
                title="Actions"
                items={recommendations}
                icon={<TargetIcon />}
                variant="info"
              />
            )}
          </div>
        </div>
      }
    />
  );
}
