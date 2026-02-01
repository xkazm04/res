'use client';

import { useRef, useCallback } from 'react';
import type { SessionWithDetails, ResearchFinding, ResearchSource, KnowledgeEntity } from '@/src/types/research';

type TabId = 'overview' | 'findings' | 'sources' | 'perspectives' | 'analysis' | 'entities';

/**
 * Cache for pre-computed tab data to make tab switches feel instant.
 * Stores processed data structures that would otherwise be computed on tab switch.
 */
interface TabDataCache {
  // Findings tab
  sourceMap?: Map<string, ResearchSource>;
  sortedFindings?: ResearchFinding[];

  // Sources tab
  sortedSources?: ResearchSource[];

  // Entities tab
  entityGroups?: Map<string, KnowledgeEntity[]>;

  // Analysis tab
  analysisData?: {
    contradictions: unknown[];
    gaps: unknown[];
    causalChains: unknown[];
  };

  // Perspectives tab
  perspectiveData?: unknown[];
}

/**
 * Hook to prefetch and pre-process tab data on hover.
 * This warms up expensive computations before the user clicks,
 * making tab transitions feel instant.
 *
 * @param session - The current session with all details
 * @returns Object with prefetch function and cached data
 */
export function usePrefetchTabData(session: SessionWithDetails | null) {
  const cacheRef = useRef<TabDataCache>({});
  const prefetchedRef = useRef<Set<TabId>>(new Set());

  /**
   * Prefetch data for a specific tab.
   * Called on mouseEnter of tab buttons.
   */
  const prefetchTab = useCallback((tabId: TabId) => {
    if (!session || prefetchedRef.current.has(tabId)) {
      return;
    }

    // Mark as prefetched to avoid redundant work
    prefetchedRef.current.add(tabId);

    // Use requestIdleCallback or setTimeout to avoid blocking the main thread
    const prefetch = () => {
      switch (tabId) {
        case 'findings': {
          // Pre-compute the source map that FindingsView needs
          if (!cacheRef.current.sourceMap && session.sources) {
            cacheRef.current.sourceMap = new Map(
              session.sources.map(s => [s.id, s])
            );
          }

          // Pre-sort findings by confidence (default sort)
          if (!cacheRef.current.sortedFindings && session.findings) {
            cacheRef.current.sortedFindings = [...session.findings].sort(
              (a, b) => (b.confidence_score || 0) - (a.confidence_score || 0)
            );
          }
          break;
        }

        case 'sources': {
          // Pre-sort sources by credibility (common initial state)
          if (!cacheRef.current.sortedSources && session.sources) {
            cacheRef.current.sortedSources = [...session.sources].sort(
              (a, b) => (b.credibility_score || 0) - (a.credibility_score || 0)
            );
          }
          break;
        }

        case 'entities': {
          // Pre-group entities by type
          if (!cacheRef.current.entityGroups && session.entities) {
            const groups = new Map<string, typeof session.entities>();
            session.entities.forEach(entity => {
              const type = entity.entity_type || 'unknown';
              if (!groups.has(type)) {
                groups.set(type, []);
              }
              groups.get(type)!.push(entity);
            });
            cacheRef.current.entityGroups = groups;
          }
          break;
        }

        case 'analysis': {
          // Pre-package analysis data
          if (!cacheRef.current.analysisData) {
            cacheRef.current.analysisData = {
              contradictions: session.contradictions || [],
              gaps: session.gaps || [],
              causalChains: session.causal_chains || [],
            };
          }
          break;
        }

        case 'perspectives': {
          // Pre-process perspectives
          if (!cacheRef.current.perspectiveData && session.perspectives) {
            cacheRef.current.perspectiveData = session.perspectives;
          }
          break;
        }

        case 'overview':
          // Overview is typically the starting tab and doesn't need prefetch
          break;
      }
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(prefetch, { timeout: 100 });
    } else {
      setTimeout(prefetch, 0);
    }
  }, [session]);

  /**
   * Get cached data for a tab (if available).
   * Views can use this to skip their own computation.
   */
  const getCachedData = useCallback((tabId: TabId) => {
    switch (tabId) {
      case 'findings':
        return {
          sourceMap: cacheRef.current.sourceMap,
          sortedFindings: cacheRef.current.sortedFindings,
        };
      case 'sources':
        return {
          sortedSources: cacheRef.current.sortedSources,
        };
      case 'entities':
        return {
          entityGroups: cacheRef.current.entityGroups,
        };
      case 'analysis':
        return cacheRef.current.analysisData;
      case 'perspectives':
        return {
          perspectives: cacheRef.current.perspectiveData,
        };
      default:
        return null;
    }
  }, []);

  /**
   * Clear the cache (e.g., when session changes).
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    prefetchedRef.current.clear();
  }, []);

  return {
    prefetchTab,
    getCachedData,
    clearCache,
  };
}

/**
 * Context for sharing prefetch functionality across components.
 * This allows the sidebar to trigger prefetches that benefit the views.
 */
export type PrefetchTabFn = (tabId: TabId) => void;
