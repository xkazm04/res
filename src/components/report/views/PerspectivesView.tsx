'use client';

import type { ResearchPerspective } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { AnimatedProgressRing } from '../core/AnimatedNumber';
import { ViewHeader } from '../shared/ViewHeader';
import { EmptyState } from '../shared/EmptyState';
import { CollapsibleSection, SectionGroup } from '../shared/CollapsibleSection';

interface PerspectivesViewProps {
  perspectives: ResearchPerspective[];
}

function getPerspectiveIcon(type: string): string {
  const icons: Record<string, string> = {
    financial: '💰',
    technical: '⚙️',
    legal: '⚖️',
    market: '📊',
    risk: '⚠️',
    strategic: '🎯',
    competitive: '🏆',
    operational: '🔧',
    regulatory: '📋',
    default: '👁️',
  };
  return icons[type.toLowerCase()] || icons.default;
}


export function PerspectivesView({ perspectives }: PerspectivesViewProps) {
  if (perspectives.length === 0) {
    return (
      <EmptyState
        type="lightbulb"
        title="No perspectives available"
        description="Analysis viewpoints haven't been generated for this research yet."
      />
    );
  }

  return (
    <SectionGroup>
      <ViewHeader title="Perspectives" count={perspectives.length} subtitle="Multi-angle analysis viewpoints" persona="domain" />

      {/* Each perspective as a collapsible section */}
      {perspectives.map((perspective) => {
        const confidence = perspective.confidence || 0;
        const insights = perspective.key_insights || [];
        const warnings = perspective.warnings || [];
        const recommendations = perspective.recommendations || [];
        const totalItems = insights.length + warnings.length + recommendations.length;

        return (
          <CollapsibleSection
            key={perspective.id}
            sectionId={`perspective-${perspective.id}`}
            title={`${perspective.perspective_type.replace('_', ' ')} Analysis`}
            subtitle={`Confidence: ${Math.round(confidence * 100)}%`}
            icon={getPerspectiveIcon(perspective.perspective_type)}
            count={totalItems}
            variant="card"
          >
            <PerspectiveContent perspective={perspective} />
          </CollapsibleSection>
        );
      })}
    </SectionGroup>
  );
}

function PerspectiveContent({ perspective }: { perspective: ResearchPerspective }) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const confidence = perspective.confidence || 0;
  const insights = perspective.key_insights || [];
  const warnings = perspective.warnings || [];
  const recommendations = perspective.recommendations || [];

  return (
    <div className="space-y-4">
      {/* Confidence Ring */}
      <div className="flex items-center gap-3">
        <AnimatedProgressRing
          value={confidence * 100}
          size={48}
          strokeWidth={4}
          color={confidence >= 0.7 ? '#34d399' : confidence >= 0.5 ? '#fbbf24' : '#f87171'}
          bgColor={theme === 'radar' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
        />
        <span className={`text-sm ${styles.textMuted}`}>{Math.round(confidence * 100)}% confidence</span>
      </div>

      {/* Analysis Text */}
      {perspective.analysis_text && (
        <p className={`text-sm leading-relaxed ${styles.text}`}>{perspective.analysis_text}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insights */}
        {insights.length > 0 && (
          <div className={`p-3 rounded-lg ${theme === 'radar' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'radar' ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Insights ({insights.length})
            </h4>
            <ul className="space-y-2">
              {insights.slice(0, 4).map((ins, i) => (
                <li key={i} className={`text-xs ${theme === 'radar' ? 'text-emerald-200/80' : 'text-emerald-800'}`}>
                  • {ins}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className={`p-3 rounded-lg ${theme === 'radar' ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'radar' ? 'text-amber-400' : 'text-amber-700'}`}>
              Warnings ({warnings.length})
            </h4>
            <ul className="space-y-2">
              {warnings.slice(0, 4).map((w, i) => (
                <li key={i} className={`text-xs ${theme === 'radar' ? 'text-amber-200/80' : 'text-amber-800'}`}>
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className={`p-3 rounded-lg ${theme === 'radar' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'radar' ? 'text-blue-400' : 'text-blue-700'}`}>
              Actions ({recommendations.length})
            </h4>
            <ul className="space-y-2">
              {recommendations.slice(0, 4).map((rec, i) => (
                <li key={i} className={`text-xs ${theme === 'radar' ? 'text-blue-200/80' : 'text-blue-800'}`}>
                  {i + 1}. {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
