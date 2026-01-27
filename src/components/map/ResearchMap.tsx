'use client';

import { useCallback } from 'react';
import { useAppStore, getTemplateDisplayName, getTemplateColor } from '@/src/stores/appStore';
import { useSessions } from '@/src/hooks/useSessions';
import { useMapData } from '@/src/hooks/useMapData';
import { MapBreadcrumb } from './MapBreadcrumb';
import { MapLegend } from './MapLegend';
import { MapEmptyState, MapLoadingState, MapErrorState } from './MapEmptyState';
import { ThemeSwitcher } from '@/src/components/swiss/ThemeSwitcher';
import type { ResearchSession } from '@/src/types/research';

interface ResearchMapProps {
  className?: string;
}

export function ResearchMap({ className }: ResearchMapProps) {
  const { sessions, isLoading, error, refetch } = useSessions();
  const { templateCounts, totalStats } = useMapData(sessions);

  const { mapZoomPath, setMapZoomPath } = useAppStore();

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((path: string[]) => {
    setMapZoomPath(path);
  }, [setMapZoomPath]);

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return <MapLoadingState />;
    }

    if (error) {
      return <MapErrorState error={error} onRetry={refetch} />;
    }

    if (sessions.length === 0) {
      return <MapEmptyState onRefresh={refetch} isLoading={isLoading} />;
    }

    return (
      <>
        {/* Session Cards Grid */}
        <div className="flex-1 overflow-auto bg-[var(--bg-secondary)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-[var(--border-default)] bg-[var(--bg-elevated)]/80 backdrop-blur-sm">
          <MapLegend items={templateCounts} />
        </div>
      </>
    );
  };

  return (
    <div className={className}>
      {/* Header - always visible */}
      <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-headline text-2xl">Research Map</h1>
            <p className="text-secondary mt-0.5">
              {!isLoading && !error && sessions.length > 0
                ? `${totalStats.totalSessions} sessions | ${totalStats.totalFindings} findings | ${totalStats.totalSources} sources`
                : 'AI-powered research visualization'}
            </p>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Breadcrumb - only when we have sessions */}
        {!isLoading && !error && sessions.length > 0 && (
          <MapBreadcrumb
            path={mapZoomPath}
            onNavigate={handleBreadcrumbNavigate}
          />
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
}

// Session Card Component
function SessionCard({ session }: { session: ResearchSession }) {
  const templateColor = getTemplateColor(session.template_type);
  const templateName = getTemplateDisplayName(session.template_type);
  const formattedDate = new Date(session.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="card card-interactive group cursor-pointer">
      {/* Template color indicator */}
      <div
        className="h-1 rounded-t-lg"
        style={{ backgroundColor: templateColor }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="badge text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${templateColor}20`,
              color: templateColor,
            }}
          >
            {templateName}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{formattedDate}</span>
        </div>

        {/* Title */}
        <h3 className="text-headline text-sm font-semibold mb-1 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
          {session.title}
        </h3>

        {/* Query preview */}
        <p className="text-secondary text-xs line-clamp-2 mb-3">
          {session.query}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {session.claim_count} findings
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {session.source_count} sources
          </span>
        </div>
      </div>
    </div>
  );
}
