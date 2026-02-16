'use client';

/**
 * useVirtualMapData Hook
 *
 * React hook wrapping VirtualDataManager for viewport-aware, lazy-loading
 * map data. Returns only the nodes needed for the current view.
 *
 * Used by both Radar (StrategicMapView) and Swiss (SwissMapView) modes.
 */

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useAppStore } from '@/src/stores/appStore';
import {
  getVirtualDataManager,
  type DrillState,
  type FilterCriteria,
  type TemplateSummary,
  type GroupSummary,
  type LoadingState,
} from '@/src/lib/mapData';
import { getFilterEngine, type FilterResult } from '@/src/lib/mapData/filterEngine';
import type { ResearchSession } from '@/src/types/research';

// ============================================================================
// Types
// ============================================================================

export interface VirtualMapDataResult {
  // L0: Template overview
  templateSummaries: TemplateSummary[];

  // L1: Groups for current template
  groups: GroupSummary[];

  // L2: Sessions for current group
  sessions: ResearchSession[];

  // Filter state
  filterResult: FilterResult | null;

  // Loading
  isLoading: boolean;
  loadingState: LoadingState;

  // Stats
  totalSessions: number;
  totalFindings: number;
  totalSources: number;
  templateCount: number;
  completedCount: number;

  // Actions
  prefetch: (templateType: string) => void;
  applyFilter: (criteria: FilterCriteria) => void;
  clearFilter: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useVirtualMapData(
  drillState: DrillState,
  filterCriteria?: FilterCriteria,
): VirtualMapDataResult {
  const sessions = useAppStore(s => s.sessions);
  const topics = useAppStore(s => s.topics);
  const sessionsLoading = useAppStore(s => s.sessionsLoading);
  const topicsLoading = useAppStore(s => s.topicsLoading);
  const fetchSessions = useAppStore(s => s.fetchSessions);
  const fetchTopics = useAppStore(s => s.fetchTopics);
  const fetchAggregates = useAppStore(s => s.fetchAggregates);
  const fetchSessionsByTemplate = useAppStore(s => s.fetchSessionsByTemplate);
  const fetchSessionsByTopic = useAppStore(s => s.fetchSessionsByTopic);

  const [dataVersion, setDataVersion] = useState(0);
  const [activeCriteria, setActiveCriteria] = useState<FilterCriteria | undefined>(filterCriteria);

  const managerRef = useRef(getVirtualDataManager());
  const filterEngineRef = useRef(getFilterEngine());
  const registeredRef = useRef(false);

  // Register fetchers once
  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    managerRef.current.registerFetchers({
      fetchAggregates,
      fetchSessionsByTemplate,
      fetchSessionsByTopic,
      fetchTopics,
    });
  }, [fetchAggregates, fetchSessionsByTemplate, fetchSessionsByTopic, fetchTopics]);

  // Listen for data-ready signals from the manager
  useEffect(() => {
    const unsub = managerRef.current.onDataReady(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (sessions.length === 0 && !sessionsLoading) {
      fetchSessions();
    }
    if (topics.length === 0 && !topicsLoading) {
      fetchTopics();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // L0: Template summaries
  const templateSummaries = useMemo(() => {
    return managerRef.current.getTemplateSummaries(sessions, topics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, topics, dataVersion]);

  // L1: Groups for current template
  const groups = useMemo(() => {
    if (drillState.level === 'overview' || !drillState.templateId) return [];
    return managerRef.current.getTemplateChildren(drillState.templateId, sessions, topics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillState.level, drillState.templateId, sessions, topics, dataVersion]);

  // L2: Sessions for current group
  const groupSessions = useMemo(() => {
    if (drillState.level !== 'topic' || !drillState.topicId || !drillState.templateId) return [];
    return managerRef.current.getGroupSessions(
      drillState.topicId,
      drillState.templateId,
      sessions,
      topics,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillState.level, drillState.topicId, drillState.templateId, sessions, topics, dataVersion]);

  // Filter result
  const filterResult = useMemo(() => {
    if (!activeCriteria) return null;
    return filterEngineRef.current.filter(activeCriteria);
  }, [activeCriteria]);

  // Stats
  const stats = useMemo(() => {
    return managerRef.current.getStats(sessions);
  }, [sessions]);

  // Loading state
  const loadingState = useMemo(() => {
    const contextKey = drillState.level === 'overview'
      ? 'overview'
      : drillState.level === 'template'
        ? `template:${drillState.templateId}`
        : `topic:${drillState.topicId}`;
    return managerRef.current.getLoadingState(contextKey);
  }, [drillState, dataVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = sessionsLoading || topicsLoading || loadingState.isLoading;

  // Actions
  const prefetch = useCallback((templateType: string) => {
    managerRef.current.prefetch(templateType);
  }, []);

  const applyFilter = useCallback((criteria: FilterCriteria) => {
    setActiveCriteria(criteria);
  }, []);

  const clearFilter = useCallback(() => {
    setActiveCriteria(undefined);
  }, []);

  return {
    templateSummaries,
    groups,
    sessions: groupSessions,
    filterResult,
    isLoading,
    loadingState,
    totalSessions: stats.totalSessions,
    totalFindings: stats.totalFindings,
    totalSources: stats.totalSources,
    templateCount: stats.templateCount,
    completedCount: stats.completedCount,
    prefetch,
    applyFilter,
    clearFilter,
  };
}
