'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/src/stores/appStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useSessions } from '@/src/hooks/useSessions';
import { MapEmptyState, MapLoadingState, MapErrorState } from './MapEmptyState';
import { ThemeSwitcher } from '@/src/components/swiss/ThemeSwitcher';
import { RadarView, SwissView, SwissMapView, StrategicMapView } from '@/src/components/visualizations';
import type { ResearchSession } from '@/src/types/research';

interface ResearchMapProps {
  className?: string;
}

export function ResearchMap({ className }: ResearchMapProps) {
  const { sessions, isLoading, error, refetch } = useSessions();
  const { openReportModal } = useAppStore();
  const theme = useThemeStore((s) => s.theme);

  const handleSessionSelect = useCallback((session: ResearchSession) => {
    openReportModal(session.id);
  }, [openReportModal]);

  // Render the appropriate visualization based on theme
  const renderVisualization = () => {
    switch (theme) {
      case 'radar':
        // Use StrategicMapView for radar theme (Total War-style strategic map)
        return <StrategicMapView sessions={sessions} onSessionSelect={handleSessionSelect} />;
      case 'swiss':
      default:
        // Use SwissMapView for Swiss theme (infinite map with keyboard navigation)
        return <SwissMapView sessions={sessions} onSessionSelect={handleSessionSelect} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
          <MapLoadingState />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
          <MapErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className={className}>
        <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
          <MapEmptyState onRefresh={refetch} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {/* Theme Switcher - floating */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      {/* Visualization fills entire space */}
      <div className="w-full h-full">
        {renderVisualization()}
      </div>
    </div>
  );
}
