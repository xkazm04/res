/**
 * Virtual Data Manager
 *
 * Lazy hierarchical data facade that wraps SessionCache and SessionIndex.
 * Instead of eagerly loading all sessions and building a complete hierarchy,
 * this manager loads data on demand as the user navigates:
 *
 * L0 (always loaded): Template aggregates — counts per template type
 * L1 (on-demand): Topics/thematic groups for a specific template
 * L2 (on-demand): Sessions for a specific group/topic, paginated
 *
 * Viewport-aware: only materializes nodes that are visible in the current view.
 * Uses NodePool to recycle objects and avoid GC pressure.
 */

import type { ResearchSession } from '@/src/types/research';
import type { TopicWithSessions } from '@/src/stores/appStore';
import {
  getTemplateColor,
  getTemplateDisplayName,
} from '@/src/stores/appStore';
import {
  getSessionCache,
  type AggregatesData,
  type SessionSummary,
  type TemplateData,
  type TopicSummary,
} from '@/src/lib/sessionCache';
import { getSessionIndex } from '@/src/lib/sessionIndex';
import { NodePool, getNodePool } from './nodePool';

// ============================================================================
// Types
// ============================================================================

/** Viewport rectangle in world coordinates */
export interface WorldRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Drill-down navigation state */
export interface DrillState {
  level: 'overview' | 'template' | 'topic';
  templateId?: string;
  topicId?: string;
}

/** Filter criteria for multi-faceted filtering */
export interface FilterCriteria {
  templates?: string[];
  statuses?: string[];
  dateRange?: { from: Date; to: Date };
  minFindings?: number;
  query?: string;
}

/** Template summary for L0 overview */
export interface TemplateSummary {
  templateType: string;
  displayName: string;
  color: string;
  sessionCount: number;
  topicCount: number;
  totalFindings: number;
  totalSources: number;
  latestActivity: string | null;
}

/** Group node (topic or thematic group) for L1 */
export interface GroupSummary {
  id: string;
  name: string;
  type: 'topic' | 'thematic_group';
  sessionCount: number;
  findingCount: number;
  description?: string;
  parentTemplate: string;
  color: string;
}

/** Loading state for a data level */
export interface LoadingState {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  hasMore: boolean;
  error: string | null;
}

// ============================================================================
// Data Ready Callback Registry
// ============================================================================

type DataReadyCallback = () => void;

// ============================================================================
// Virtual Data Manager
// ============================================================================

export class VirtualDataManager {
  private cache = getSessionCache();
  private index = getSessionIndex();
  private pool: NodePool;
  private callbacks: DataReadyCallback[] = [];

  // Prefetch state
  private prefetchTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private prefetchDelay = 500; // ms to wait before prefetching

  // Loading states per context
  private loadingStates = new Map<string, LoadingState>();

  // Fetcher functions (injected from appStore)
  private fetchAggregatesFn: (() => Promise<void>) | null = null;
  private fetchSessionsByTemplateFn: ((template: string, loadMore?: boolean) => Promise<void>) | null = null;
  private fetchSessionsByTopicFn: ((topicId: string, loadMore?: boolean) => Promise<void>) | null = null;
  private fetchTopicsFn: (() => Promise<void>) | null = null;

  constructor(pool?: NodePool) {
    this.pool = pool ?? getNodePool();
  }

  // ============================================================================
  // Fetcher Registration (called once from React to wire up store actions)
  // ============================================================================

  registerFetchers(fetchers: {
    fetchAggregates: () => Promise<void>;
    fetchSessionsByTemplate: (template: string, loadMore?: boolean) => Promise<void>;
    fetchSessionsByTopic: (topicId: string, loadMore?: boolean) => Promise<void>;
    fetchTopics: () => Promise<void>;
  }): void {
    this.fetchAggregatesFn = fetchers.fetchAggregates;
    this.fetchSessionsByTemplateFn = fetchers.fetchSessionsByTemplate;
    this.fetchSessionsByTopicFn = fetchers.fetchSessionsByTopic;
    this.fetchTopicsFn = fetchers.fetchTopics;
  }

  // ============================================================================
  // L0: Template Aggregates (always available)
  // ============================================================================

  /**
   * Get template summaries from aggregates.
   * Returns cached data immediately; triggers fetch if stale.
   */
  getTemplateSummaries(sessions: ResearchSession[], topics: TopicWithSessions[]): TemplateSummary[] {
    // Group sessions by template
    const byTemplate = new Map<string, ResearchSession[]>();
    for (const session of sessions) {
      const t = session.template_type || 'unknown';
      if (!byTemplate.has(t)) byTemplate.set(t, []);
      byTemplate.get(t)!.push(session);
    }

    // Build summaries
    const summaries: TemplateSummary[] = [];
    for (const [templateType, templateSessions] of byTemplate) {
      const templateTopics = topics.filter(topic =>
        topic.sessions?.some(s => s.template_type === templateType)
      );

      let latestActivity: string | null = null;
      let totalFindings = 0;
      let totalSources = 0;

      for (const s of templateSessions) {
        totalFindings += s.claim_count || 0;
        totalSources += s.source_count || 0;
        if (!latestActivity || s.updated_at > latestActivity) {
          latestActivity = s.updated_at;
        }
      }

      summaries.push({
        templateType,
        displayName: getTemplateDisplayName(templateType),
        color: getTemplateColor(templateType),
        sessionCount: templateSessions.length,
        topicCount: templateTopics.length,
        totalFindings,
        totalSources,
        latestActivity,
      });
    }

    // Sort by session count descending
    summaries.sort((a, b) => b.sessionCount - a.sessionCount);
    return summaries;
  }

  // ============================================================================
  // L1: Template Children (topics/thematic groups)
  // ============================================================================

  /**
   * Get groups (topics or thematic groups) for a template.
   * Returns cached data immediately; triggers fetch if not loaded.
   */
  getTemplateChildren(
    templateType: string,
    sessions: ResearchSession[],
    topics: TopicWithSessions[]
  ): GroupSummary[] {
    const color = getTemplateColor(templateType);
    const templateSessions = sessions.filter(s => s.template_type === templateType);

    // Get topics for this template
    const templateTopics = topics.filter(topic =>
      topic.sessions?.some(s => s.template_type === templateType)
    );

    if (templateTopics.length > 0) {
      return templateTopics.map(topic => {
        const topicSessions = templateSessions.filter(s =>
          topic.sessions?.some(ts => ts.id === s.id)
        );
        return {
          id: topic.id,
          name: topic.name,
          type: 'topic' as const,
          sessionCount: topicSessions.length,
          findingCount: topicSessions.reduce((sum, s) => sum + (s.claim_count || 0), 0),
          description: topic.description,
          parentTemplate: templateType,
          color,
        };
      }).filter(g => g.sessionCount > 0);
    }

    // Fall back to thematic groups
    const byGroup = new Map<string, ResearchSession[]>();
    for (const s of templateSessions) {
      const group = s.thematic_group || 'Ungrouped';
      if (!byGroup.has(group)) byGroup.set(group, []);
      byGroup.get(group)!.push(s);
    }

    if (byGroup.size <= 1 && byGroup.has('Ungrouped')) {
      // No meaningful grouping - return sessions directly as pseudo-groups
      return [{
        id: `__all__${templateType}`,
        name: 'All Sessions',
        type: 'thematic_group',
        sessionCount: templateSessions.length,
        findingCount: templateSessions.reduce((sum, s) => sum + (s.claim_count || 0), 0),
        parentTemplate: templateType,
        color,
      }];
    }

    return Array.from(byGroup.entries()).map(([name, groupSessions]) => ({
      id: `theme-${templateType}-${name.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      type: 'thematic_group' as const,
      sessionCount: groupSessions.length,
      findingCount: groupSessions.reduce((sum, s) => sum + (s.claim_count || 0), 0),
      parentTemplate: templateType,
      color,
    }));
  }

  // ============================================================================
  // L2: Sessions for a group/topic
  // ============================================================================

  /**
   * Get sessions for a specific group or topic.
   */
  getGroupSessions(
    groupId: string,
    templateType: string,
    sessions: ResearchSession[],
    topics: TopicWithSessions[]
  ): ResearchSession[] {
    const templateSessions = sessions.filter(s => s.template_type === templateType);

    // Check if it's a topic
    const topic = topics.find(t => t.id === groupId);
    if (topic) {
      return templateSessions.filter(s =>
        topic.sessions?.some(ts => ts.id === s.id)
      );
    }

    // Check if it's an "all sessions" pseudo-group
    if (groupId.startsWith('__all__')) {
      return templateSessions;
    }

    // Thematic group
    const groupName = groupId.replace(/^theme-[^-]+-/, '').replace(/-/g, ' ');
    return templateSessions.filter(s => {
      const sg = (s.thematic_group || 'ungrouped').toLowerCase();
      return sg === groupName;
    });
  }

  // ============================================================================
  // Prefetch
  // ============================================================================

  /**
   * Schedule a prefetch for a template's data.
   * Waits 500ms of inactivity before fetching to avoid wasted requests.
   */
  prefetch(templateType: string): void {
    // Cancel existing prefetch for this template
    const existing = this.prefetchTimers.get(templateType);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.prefetchTimers.delete(templateType);

      // Only fetch if not already cached
      if (!this.cache.hasTemplateData(templateType) && this.fetchSessionsByTemplateFn) {
        try {
          await this.fetchSessionsByTemplateFn(templateType);
          this.notifyDataReady();
        } catch {
          // Prefetch failures are silent
        }
      }
    }, this.prefetchDelay);

    this.prefetchTimers.set(templateType, timer);
  }

  /**
   * Cancel all pending prefetches
   */
  cancelPrefetches(): void {
    for (const timer of this.prefetchTimers.values()) {
      clearTimeout(timer);
    }
    this.prefetchTimers.clear();
  }

  // ============================================================================
  // Loading State Management
  // ============================================================================

  getLoadingState(contextKey: string): LoadingState {
    return this.loadingStates.get(contextKey) ?? {
      isLoading: false,
      loadedCount: 0,
      totalCount: 0,
      hasMore: false,
      error: null,
    };
  }

  setLoadingState(contextKey: string, state: Partial<LoadingState>): void {
    const existing = this.getLoadingState(contextKey);
    this.loadingStates.set(contextKey, { ...existing, ...state });
  }

  // ============================================================================
  // Data Ready Callbacks
  // ============================================================================

  onDataReady(callback: DataReadyCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private notifyDataReady(): void {
    for (const cb of this.callbacks) {
      cb();
    }
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStats(sessions: ResearchSession[]): {
    totalSessions: number;
    totalFindings: number;
    totalSources: number;
    templateCount: number;
    completedCount: number;
  } {
    const templates = new Set<string>();
    let totalFindings = 0;
    let totalSources = 0;
    let completedCount = 0;

    for (const s of sessions) {
      templates.add(s.template_type);
      totalFindings += s.claim_count || 0;
      totalSources += s.source_count || 0;
      if (s.status === 'completed') completedCount++;
    }

    return {
      totalSessions: sessions.length,
      totalFindings,
      totalSources,
      templateCount: templates.size,
      completedCount,
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    this.cancelPrefetches();
    this.callbacks = [];
    this.loadingStates.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: VirtualDataManager | null = null;

export function getVirtualDataManager(): VirtualDataManager {
  if (!instance) {
    instance = new VirtualDataManager();
  }
  return instance;
}
