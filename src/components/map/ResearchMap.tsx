'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
      {/* Loading progress bar — absolute, rendered above everything */}
      <LoadingProgress
        isLoading={isLoading}
        loadedCount={sessions.length}
        isRadar={isRadar}
      />

      {/* ── Page header — normal flow so canvas starts BELOW it ─────────── */}
      <div
        className={`flex items-stretch flex-none z-20 border-b ${
          isRadar
            ? 'bg-[#0e0e10]/95 border-[#27272A] backdrop-blur-sm'
            : 'bg-white/95 border-gray-200 backdrop-blur-sm'
        }`}
      >
        {/* Navigation links */}
        <nav
          className={`flex items-center gap-0.5 px-2 border-r ${
            isRadar ? 'border-[#27272A]' : 'border-gray-200'
          }`}
        >
          <Link
            href="/initiate"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              isRadar
                ? 'text-[#71717A] hover:text-[#E8E8E8] hover:bg-[#1A1A1E]'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            Initiate
          </Link>
          <Link
            href="/maker"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              isRadar
                ? 'text-[#71717A] hover:text-[#E8E8E8] hover:bg-[#1A1A1E]'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Maker
          </Link>
        </nav>

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
            embedded={true}
          />
        </div>

        {/* Theme Switcher */}
        <div
          className={`flex items-center px-3 border-l ${
            isRadar ? 'border-[#27272A]' : 'border-gray-200'
          }`}
        >
          <ThemeSwitcher />
        </div>
      </div>
      {/* ────────────────────────────────────────────────────────────────── */}

      {/* Visualization occupies remaining height (flex-1) */}
      <div
        key={theme}
        className="flex-1 min-h-0 relative"
        style={{ animation: 'fade-in 300ms ease-out' }}
      >
        {renderVisualization()}
      </div>
    </div>
  );
}
