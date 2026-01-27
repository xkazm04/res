'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/src/stores/appStore';
import { useSessions } from '@/src/hooks/useSessions';
import { useMapData } from '@/src/hooks/useMapData';
import { MapBreadcrumb } from './MapBreadcrumb';
import { MapLegend } from './MapLegend';
import { MapEmptyState, MapLoadingState, MapErrorState } from './MapEmptyState';

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

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <MapLoadingState />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <MapErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className={className}>
        <MapEmptyState onRefresh={refetch} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-headline text-2xl">Research Map</h1>
            <p className="text-secondary mt-0.5">
              {totalStats.totalSessions} sessions | {totalStats.totalFindings} findings | {totalStats.totalSources} sources
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <MapBreadcrumb
          path={mapZoomPath}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>

      {/* Canvas Map - placeholder for future implementation */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--warm-gray-50)]">
          <div className="text-center text-secondary">
            <p className="text-lg font-medium">Topic Map Coming Soon</p>
            <p className="text-sm mt-1">{sessions.length} sessions ready to visualize</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-[var(--border-color)] bg-white/80 backdrop-blur-sm">
        <MapLegend items={templateCounts} />
      </div>
    </div>
  );
}
