'use client';

import { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import type { SessionWithDetails } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { ThemedSection, ThemedBadge } from '../ThemedCards';
import { AnimatedNumber } from '../core/AnimatedNumber';
import { IntelDashboard } from '../features/IntelDashboard';
import { KeyPointsPanel } from '../features/KeyPointsPanel';
import { ViewHeader } from '../shared/ViewHeader';
import { ViewModeToggle, type ViewModeOption } from '../shared/ViewModeToggle';
import { CollapsibleSection, SectionGroup } from '../shared/CollapsibleSection';
import { ContentSelector } from '../video/ContentSelector';
import { useContentSelection } from '../video/useContentSelection';
import { transformSelectionToContent, type VideoOverviewContent } from '../video/contentTransformer';
import { useCuratedContent } from '../video/useCuratedContent';
import { AudioControls } from '../video/AudioControls';
import { useAudioNarration, type VoiceOption } from '../video/useAudioNarration';

// Lazy load heavy visualization components to reduce initial bundle size
const ConfidenceHeatmap = lazy(() => import('../visualizations/ConfidenceHeatmap').then(m => ({ default: m.ConfidenceHeatmap })));
const Timeline = lazy(() => import('../visualizations/Timeline').then(m => ({ default: m.Timeline })));
const VideoOverview = lazy(() => import('../video/VideoOverview').then(m => ({ default: m.VideoOverview })));

// Loading fallback for lazy-loaded components
function VisualizationSkeleton({ height = 'h-48' }: { height?: string }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  return (
    <div className={`${height} rounded-xl animate-pulse ${isRadar ? 'bg-slate-800/50' : 'bg-stone-100'}`}>
      <div className="h-full flex items-center justify-center">
        <div className={`w-6 h-6 rounded-full border-2 border-t-transparent animate-spin ${isRadar ? 'border-cyan-500/30' : 'border-stone-300'}`} />
      </div>
    </div>
  );
}

interface OverviewViewProps {
  session: SessionWithDetails;
  stats: {
    findings: number;
    sources: number;
    perspectives: number;
    avgConfidence: number;
    highConfidence: number;
    redFlags: number;
    gaps: number;
  };
}

type ViewMode = 'video' | 'static';

const viewModeOptions: ViewModeOption<ViewMode>[] = [
  {
    value: 'video',
    label: 'Video',
    icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
  },
  {
    value: 'static',
    label: 'Static',
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  },
];

export function OverviewView({ session, stats }: OverviewViewProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const findings = session.findings || [];
  const isRadar = theme === 'radar';
  const [viewMode, setViewMode] = useState<ViewMode>('video');

  // Content selection state for video cherry-picking
  const selectionState = useContentSelection(session);
  const [isRecreating, setIsRecreating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('professional');

  // LLM curation state
  const curation = useCuratedContent({
    session,
    selectionState,
    baseStats: stats,
  });

  // Audio narration state
  const narration = useAudioNarration({
    session,
    selection: selectionState.selection,
    voice: selectedVoice,
  });

  // Handle quick recreate (without LLM)
  const handleQuickRecreate = useCallback(() => {
    setIsRecreating(true);
    // Small delay for visual feedback
    setTimeout(() => {
      curation.quickTransform();
      setIsRecreating(false);
    }, 200);
  }, [curation]);

  // Handle LLM curation
  const handleCurateWithLLM = useCallback(async () => {
    await curation.curate();
  }, [curation]);

  // Use curated content if available
  const contentOverride = curation.curatedContent;

  // Calculate metrics for dashboard
  const coverage = Math.min(100, Math.round((stats.sources / Math.max(10, stats.findings * 2)) * 100));
  const reliability = Math.round((findings.filter(f => (f.confidence_score || 0) >= 0.7).length / Math.max(1, findings.length)) * 100);
  const completeness = Math.min(100, 100 - (stats.gaps * 10));

  const allWarnings = session.perspectives?.flatMap(p => p.warnings || []) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <ViewHeader
        title="Overview"
        persona="executive"
        actions={<ViewModeToggle options={viewModeOptions} value={viewMode} onChange={setViewMode} />}
      />

      {/* Video mode */}
      {viewMode === 'video' && (
        <>
          <Suspense fallback={<VisualizationSkeleton height="h-96" />}>
            <VideoOverview session={session} stats={stats} contentOverride={contentOverride || undefined} />
          </Suspense>

          {/* Content Selector below video */}
          <ContentSelector
            selectionState={selectionState}
            onRecreate={handleQuickRecreate}
            isRadar={isRadar}
            isRecreating={isRecreating}
            showCurationOption={true}
            onCurateWithLLM={handleCurateWithLLM}
            isCurating={curation.status === 'curating'}
          />

          {/* Curation error display */}
          {curation.error && (
            <div className={`p-3 rounded-lg text-sm ${isRadar ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border-l-2 border-rose-500'}`}>
              <span className="font-medium">Curation fallback: </span>
              {curation.error}
            </div>
          )}

          {/* Audio Narration Controls */}
          <AudioControls
            narration={narration}
            isRadar={isRadar}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
          />
        </>
      )}

      {/* Static mode */}
      {viewMode === 'static' && <StaticOverview session={session} stats={stats} coverage={coverage} reliability={reliability} completeness={completeness} allWarnings={allWarnings} />}
    </motion.div>
  );
}

function StaticOverview({ session, stats, coverage, reliability, completeness, allWarnings }: {
  session: SessionWithDetails;
  stats: OverviewViewProps['stats'];
  coverage: number;
  reliability: number;
  completeness: number;
  allWarnings: string[];
}) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const findings = session.findings || [];

  // Single memoized computation for all derived data, keyed by session.id for stability
  const { keyPoints, heatmapData, timelineEvents } = useMemo(() => {
    // Key points from perspectives and findings
    const points: Array<{ id: string; text: string; type: 'insight' | 'warning' | 'action' | 'fact'; confidence: number; sourceCount: number }> = [];
    session.perspectives?.forEach(p => {
      p.key_insights?.forEach((insight, i) => { points.push({ id: `insight-${p.id}-${i}`, text: insight, type: 'insight', confidence: p.confidence || 0.7, sourceCount: p.sources_cited?.length || 0 }); });
      p.warnings?.forEach((warning, i) => { points.push({ id: `warning-${p.id}-${i}`, text: warning, type: 'warning', confidence: 0.9, sourceCount: 1 }); });
      p.recommendations?.forEach((rec, i) => { points.push({ id: `action-${p.id}-${i}`, text: rec, type: 'action', confidence: 0.8, sourceCount: 1 }); });
    });
    findings.slice(0, 5).forEach(f => { points.push({ id: f.id, text: f.content.slice(0, 150), type: 'fact', confidence: f.confidence_score || 0.5, sourceCount: f.supporting_sources?.length || 0 }); });

    // Heatmap data from findings confidence
    const heatmap = findings.slice(0, 25).map(f => ({ id: f.id, label: f.content.slice(0, 40) + '...', value: f.confidence_score || 0.5 }));

    // Timeline events from dated findings
    const timeline = findings.filter(f => f.event_date).map(f => ({
      id: f.id,
      date: new Date(f.event_date!),
      label: f.content.slice(0, 50) + '...',
      type: (f.temporal_context === 'prediction' ? 'prediction' : f.finding_type === 'event' ? 'event' : 'finding') as 'finding' | 'event' | 'prediction',
      confidence: f.confidence_score,
    })).slice(0, 15);

    return {
      keyPoints: points.slice(0, 12),
      heatmapData: heatmap,
      timelineEvents: timeline,
    };
  }, [session.id, session.perspectives, findings]);

  return (
    <SectionGroup>
      {/* Intelligence Dashboard - always visible */}
      <IntelDashboard
        confidence={stats.avgConfidence}
        findings={{ label: 'Findings', value: stats.findings, sublabel: `${stats.highConfidence} verified` }}
        sources={{ label: 'Sources', value: stats.sources, sublabel: 'analyzed' }}
        coverage={coverage}
        reliability={reliability}
        completeness={completeness}
        alerts={stats.redFlags + allWarnings.length}
      />

      {/* Key Points & Confidence Distribution */}
      <CollapsibleSection
        sectionId="overview-key-points"
        title="Key Points & Confidence"
        subtitle="Critical insights and finding confidence distribution"
        icon="📊"
        count={keyPoints.length}
        variant="card"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KeyPointsPanel points={keyPoints} />
          {heatmapData.length > 0 && (
            <Suspense fallback={<VisualizationSkeleton />}>
              <ConfidenceHeatmap data={heatmapData} title="Finding Confidence Distribution" />
            </Suspense>
          )}
        </div>
      </CollapsibleSection>

      {/* Timeline */}
      {timelineEvents.length > 0 && (
        <CollapsibleSection
          sectionId="overview-timeline"
          title="Timeline"
          subtitle="Key events and findings over time"
          icon="📅"
          count={timelineEvents.length}
          variant="card"
        >
          <Suspense fallback={<VisualizationSkeleton height="h-32" />}>
            <Timeline events={timelineEvents} />
          </Suspense>
        </CollapsibleSection>
      )}

      {/* Critical Warnings */}
      {allWarnings.length > 0 && (
        <CollapsibleSection
          sectionId="overview-warnings"
          title="Critical Warnings"
          icon="⚠️"
          count={allWarnings.length}
          variant="card"
        >
          <ul className="space-y-2">
            {allWarnings.slice(0, 4).map((warning, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                className={`text-sm ${isRadar ? 'text-rose-300/80' : 'text-rose-800'}`}>• {warning}</motion.li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Research Gaps */}
      {stats.gaps > 0 && (
        <CollapsibleSection
          sectionId="overview-gaps"
          title="Research Gaps"
          subtitle="Areas requiring further investigation"
          icon="🔍"
          count={stats.gaps}
          variant="card"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.gaps?.slice(0, 4).map((gap, i) => (
              <motion.div key={gap.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.1 }}
                className={`p-3 rounded-lg ${isRadar ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border-l-2 border-violet-600'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ThemedBadge variant="warning">{gap.gap_type}</ThemedBadge>
                  <span className={`text-[10px] ${styles.textMuted}`}>{gap.priority}</span>
                </div>
                <p className={`text-sm ${isRadar ? 'text-violet-200/80' : 'text-stone-700'}`}>{gap.description}</p>
              </motion.div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </SectionGroup>
  );
}
