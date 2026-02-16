/**
 * Filter Engine - Multi-faceted filtering for map visualizations
 *
 * Shared filtering used by both Radar and Swiss modes.
 * Delegates text search to SessionIndex, applies additional
 * filters (template, status, date, findings count) on top.
 */

import type { FilterCriteria } from './virtualDataManager';
import { getSessionIndex } from '@/src/lib/sessionIndex';
import type { SessionSummary } from '@/src/lib/sessionCache';

// ============================================================================
// Filter Result
// ============================================================================

export interface FilterResult {
  /** IDs of sessions that match all criteria */
  matchingIds: Set<string>;
  /** Session count per template type (among matching) */
  templateCounts: Map<string, number>;
  /** Total matching count */
  totalMatches: number;
  /** Whether any filter is active */
  isFiltered: boolean;
}

// ============================================================================
// Filter Engine
// ============================================================================

export class FilterEngine {
  private index = getSessionIndex();

  /**
   * Apply multi-faceted filtering and return matching session IDs.
   *
   * Filter pipeline:
   * 1. Start with all sessions (or text search results if query present)
   * 2. Intersect with template filter
   * 3. Intersect with status filter
   * 4. Intersect with date range filter
   * 5. Intersect with min findings filter
   */
  filter(criteria: FilterCriteria): FilterResult {
    const hasQuery = !!criteria.query?.trim();
    const hasTemplates = criteria.templates && criteria.templates.length > 0;
    const hasStatuses = criteria.statuses && criteria.statuses.length > 0;
    const hasDateRange = !!criteria.dateRange;
    const hasMinFindings = criteria.minFindings !== undefined && criteria.minFindings > 0;

    const isFiltered = hasQuery || hasTemplates || hasStatuses || hasDateRange || hasMinFindings;

    if (!isFiltered) {
      // No filters active — return all sessions
      const all = this.index.getAll();
      const matchingIds = new Set(all.map(s => s.id));
      const templateCounts = new Map<string, number>();
      for (const s of all) {
        const t = s.template_type || 'unknown';
        templateCounts.set(t, (templateCounts.get(t) || 0) + 1);
      }
      return {
        matchingIds,
        templateCounts,
        totalMatches: all.length,
        isFiltered: false,
      };
    }

    // Step 1: Start with text search or all sessions
    let candidates: SessionSummary[];
    if (hasQuery) {
      candidates = this.index.search(criteria.query!);
    } else {
      candidates = this.index.getAll();
    }

    // Step 2: Template filter
    if (hasTemplates) {
      const templateSet = new Set(criteria.templates);
      candidates = candidates.filter(s => templateSet.has(s.template_type));
    }

    // Step 3: Status filter
    if (hasStatuses) {
      const statusSet = new Set(criteria.statuses);
      candidates = candidates.filter(s => statusSet.has(s.status));
    }

    // Step 4: Date range filter
    if (hasDateRange) {
      const { from, to } = criteria.dateRange!;
      const fromTime = from.getTime();
      const toTime = to.getTime();
      candidates = candidates.filter(s => {
        const t = new Date(s.created_at).getTime();
        return t >= fromTime && t <= toTime;
      });
    }

    // Step 5: Min findings filter
    if (hasMinFindings) {
      const min = criteria.minFindings!;
      candidates = candidates.filter(s => s.claim_count >= min);
    }

    // Build result
    const matchingIds = new Set<string>();
    const templateCounts = new Map<string, number>();

    for (const s of candidates) {
      matchingIds.add(s.id);
      const t = s.template_type || 'unknown';
      templateCounts.set(t, (templateCounts.get(t) || 0) + 1);
    }

    return {
      matchingIds,
      templateCounts,
      totalMatches: candidates.length,
      isFiltered: true,
    };
  }

  /**
   * Quick check if a session matches a text query.
   * Used for highlighting in both modes.
   */
  matchesQuery(sessionId: string, query: string): boolean {
    if (!query.trim()) return true;
    const results = this.index.search(query);
    return results.some(s => s.id === sessionId);
  }

  /**
   * Get filter suggestions based on current data.
   * Returns available values for each filter dimension.
   */
  getFilterOptions(): {
    templates: string[];
    statuses: string[];
    findingsRange: { min: number; max: number };
    dateRange: { earliest: Date; latest: Date } | null;
  } {
    const stats = this.index.getStats();

    const templates = Object.keys(stats.templateCounts).sort();
    const statuses = Object.keys(stats.statusCounts).sort();

    // Calculate findings range from all sessions
    const all = this.index.getAll();
    let minFindings = Infinity;
    let maxFindings = 0;
    let earliest = Infinity;
    let latest = 0;

    for (const s of all) {
      if (s.claim_count < minFindings) minFindings = s.claim_count;
      if (s.claim_count > maxFindings) maxFindings = s.claim_count;
      const t = new Date(s.created_at).getTime();
      if (t < earliest) earliest = t;
      if (t > latest) latest = t;
    }

    return {
      templates,
      statuses,
      findingsRange: {
        min: minFindings === Infinity ? 0 : minFindings,
        max: maxFindings,
      },
      dateRange: all.length > 0
        ? { earliest: new Date(earliest), latest: new Date(latest) }
        : null,
    };
  }
}

// ============================================================================
// Singleton
// ============================================================================

let filterEngineInstance: FilterEngine | null = null;

export function getFilterEngine(): FilterEngine {
  if (!filterEngineInstance) {
    filterEngineInstance = new FilterEngine();
  }
  return filterEngineInstance;
}
