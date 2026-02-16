'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/src/stores/appStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useSessions } from '@/src/hooks/useSessions';
import { MapEmptyState, MapLoadingState, MapErrorState } from './MapEmptyState';
import { ThemeSwitcher } from '@/src/components/swiss/ThemeSwitcher';
import { RadarView, SwissView, SwissMapView, StrategicMapView } from '@/src/components/visualizations';
import { FilterPanel, type SortOption } from './FilterPanel';
import { LoadingProgress } from './LoadingProgress';
import type { FilterCriteria } from '@/src/lib/mapData';
import type { ResearchSession } from '@/src/types/research';

interface ResearchMapProps {
  className?: string;
}

export function ResearchMap({ className }: ResearchMapProps) {
  const { sessions, isLoading, error, refetch } = useSessions();
  const { openReportModal } = useAppStore();
  const theme = useThemeStore((s) => s.theme);

  // Filter state
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});
  const [sort, setSort] = useState<SortOption>('newest');

  const isRadar = theme === 'radar';

  // Extract unique template types from sessions
  const templates = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      if (s.template_type) set.add(s.template_type);
    }
    return Array.from(set).sort();
  }, [sessions]);

  // Apply filters to sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Template filter
    if (filterCriteria.templates && filterCriteria.templates.length > 0) {
      const allowed = new Set(filterCriteria.templates);
      result = result.filter((s) => allowed.has(s.template_type));
    }

    // Status filter
    if (filterCriteria.statuses && filterCriteria.statuses.length > 0) {
      const allowed = new Set(filterCriteria.statuses);
      result = result.filter((s) => allowed.has(s.status));
    }

    // Date range filter
    if (filterCriteria.dateRange) {
      const { from, to } = filterCriteria.dateRange;
      result = result.filter((s) => {
        const d = new Date(s.created_at);
        return d >= from && d <= to;
      });
    }

    // Min findings filter (uses claim_count on ResearchSession)
    if (filterCriteria.minFindings && filterCriteria.minFindings > 0) {
      result = result.filter(
        (s) => (s.claim_count ?? 0) >= filterCriteria.minFindings!,
      );
    }

    // Sort
    switch (sort) {
      case 'newest':
        result = [...result].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case 'oldest':
        result = [...result].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case 'most-findings':
        result = [...result].sort(
          (a, b) => (b.claim_count ?? 0) - (a.claim_count ?? 0),
        );
        break;
      case 'alphabetical':
        result = [...result].sort((a, b) =>
          (a.query || '').localeCompare(b.query || ''),
        );
        break;
    }

    return result;
  }, [sessions, filterCriteria, sort]);

  const handleSessionSelect = useCallback(
    (session: ResearchSession) => {
      openReportModal(session.id);
    },
    [openReportModal],
  );

  // Keyboard shortcuts: Ctrl+1 = Radar, Ctrl+2 = Swiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        useThemeStore.getState().setTheme('radar');
      } else if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        useThemeStore.getState().setTheme('swiss');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render the appropriate visualization based on theme
  const renderVisualization = () => {
    switch (theme) {
      case 'radar':
        return (
          <StrategicMapView
            sessions={filteredSessions}
            onSessionSelect={handleSessionSelect}
          />
        );
      case 'swiss':
      default:
        return (
          <SwissMapView
            sessions={filteredSessions}
            onSessionSelect={handleSessionSelect}
          />
        );
    }
  };

  // Loading state
  if (isLoading && sessions.length === 0) {
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
      {/* Loading progress bar (top) */}
      <LoadingProgress
        isLoading={isLoading}
        loadedCount={sessions.length}
        isRadar={isRadar}
      />

      {/* Top bar: Filter + Theme switcher */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="flex items-stretch">
          {/* Filter panel fills available width */}
          <div className="flex-1 min-w-0">
            <FilterPanel
              templates={templates}
              criteria={filterCriteria}
              sort={sort}
              matchCount={filteredSessions.length}
              totalCount={sessions.length}
              onChange={setFilterCriteria}
              onSortChange={setSort}
              isRadar={isRadar}
            />
          </div>

          {/* Theme Switcher */}
          <div
            className={`flex items-center px-3 border-b ${
              isRadar
                ? 'bg-slate-900/90 border-slate-700'
                : 'bg-white/95 border-gray-200'
            } backdrop-blur-sm`}
          >
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Visualization fills entire space with theme crossfade */}
      <div
        key={theme}
        className="w-full h-full"
        style={{ animation: 'fade-in 300ms ease-out' }}
      >
        {renderVisualization()}
      </div>
    </div>
  );
}
