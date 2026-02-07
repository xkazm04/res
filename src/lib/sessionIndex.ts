/**
 * Session Index - Fast Lookups with Full-Text Search
 *
 * Provides efficient indexing for session data with:
 * - O(1) lookups by ID, template, topic
 * - Full-text search via MiniSearch
 * - Incremental updates
 */

import MiniSearch, { type SearchResult } from 'minisearch';
import type { SessionSummary } from './sessionCache';

// ============================================================================
// Session Index Class
// ============================================================================

export class SessionIndex {
  // Primary index by ID
  private byId = new Map<string, SessionSummary>();

  // Secondary indexes
  private byTemplate = new Map<string, Set<string>>();
  private byTopic = new Map<string, Set<string>>();
  private byStatus = new Map<string, Set<string>>();

  // Full-text search
  private searchIndex: MiniSearch<SessionSummary>;

  constructor() {
    this.searchIndex = new MiniSearch({
      fields: ['title', 'query'],
      storeFields: ['id', 'title', 'query', 'template_type', 'status'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 2, query: 1 },
      },
    });
  }

  // ============================================================================
  // Add/Update Sessions
  // ============================================================================

  /**
   * Add multiple sessions to the index
   */
  addSessions(sessions: SessionSummary[]): void {
    const newSessions: SessionSummary[] = [];

    for (const session of sessions) {
      // Skip if already indexed
      if (this.byId.has(session.id)) {
        continue;
      }

      this.byId.set(session.id, session);

      // Template index
      const template = session.template_type || 'unknown';
      if (!this.byTemplate.has(template)) {
        this.byTemplate.set(template, new Set());
      }
      this.byTemplate.get(template)!.add(session.id);

      // Topic index
      if (session.primary_topic_id) {
        if (!this.byTopic.has(session.primary_topic_id)) {
          this.byTopic.set(session.primary_topic_id, new Set());
        }
        this.byTopic.get(session.primary_topic_id)!.add(session.id);
      }

      // Status index
      const status = session.status || 'unknown';
      if (!this.byStatus.has(status)) {
        this.byStatus.set(status, new Set());
      }
      this.byStatus.get(status)!.add(session.id);

      newSessions.push(session);
    }

    // Add to search index in bulk
    if (newSessions.length > 0) {
      this.searchIndex.addAll(newSessions);
    }
  }

  /**
   * Update a single session
   */
  updateSession(session: SessionSummary): void {
    const existing = this.byId.get(session.id);

    if (existing) {
      // Remove from old indexes
      this.removeFromSecondaryIndexes(existing);

      // Remove from search index
      this.searchIndex.discard(session.id);
    }

    // Add updated session
    this.addSessions([session]);
  }

  /**
   * Remove a session from the index
   */
  removeSession(sessionId: string): boolean {
    const session = this.byId.get(sessionId);
    if (!session) return false;

    this.byId.delete(sessionId);
    this.removeFromSecondaryIndexes(session);
    this.searchIndex.discard(sessionId);

    return true;
  }

  private removeFromSecondaryIndexes(session: SessionSummary): void {
    // Template index
    const template = session.template_type || 'unknown';
    this.byTemplate.get(template)?.delete(session.id);

    // Topic index
    if (session.primary_topic_id) {
      this.byTopic.get(session.primary_topic_id)?.delete(session.id);
    }

    // Status index
    const status = session.status || 'unknown';
    this.byStatus.get(status)?.delete(session.id);
  }

  // ============================================================================
  // Lookups
  // ============================================================================

  /**
   * Get session by ID
   */
  getById(id: string): SessionSummary | undefined {
    return this.byId.get(id);
  }

  /**
   * Get all sessions for a template - optimized single-pass iteration
   */
  getByTemplate(template: string): SessionSummary[] {
    const ids = this.byTemplate.get(template);
    if (!ids || ids.size === 0) return [];
    const result: SessionSummary[] = [];
    for (const id of ids) {
      const session = this.byId.get(id);
      if (session) result.push(session);
    }
    return result;
  }

  /**
   * Get all sessions for a topic - optimized single-pass iteration
   */
  getByTopic(topicId: string): SessionSummary[] {
    const ids = this.byTopic.get(topicId);
    if (!ids || ids.size === 0) return [];
    const result: SessionSummary[] = [];
    for (const id of ids) {
      const session = this.byId.get(id);
      if (session) result.push(session);
    }
    return result;
  }

  /**
   * Get all sessions by status - optimized single-pass iteration
   */
  getByStatus(status: string): SessionSummary[] {
    const ids = this.byStatus.get(status);
    if (!ids || ids.size === 0) return [];
    const result: SessionSummary[] = [];
    for (const id of ids) {
      const session = this.byId.get(id);
      if (session) result.push(session);
    }
    return result;
  }

  /**
   * Get all sessions
   */
  getAll(): SessionSummary[] {
    return Array.from(this.byId.values());
  }

  // ============================================================================
  // Search
  // ============================================================================

  /**
   * Full-text search across sessions
   */
  search(query: string, options?: {
    template?: string;
    status?: string;
    limit?: number;
  }): SessionSummary[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.searchIndex.search(query, {
      prefix: true,
      fuzzy: 0.2,
    });

    let sessions = results
      .map((r: SearchResult) => this.byId.get(r.id))
      .filter((s): s is SessionSummary => s !== undefined);

    // Apply filters
    if (options?.template) {
      sessions = sessions.filter(s => s.template_type === options.template);
    }
    if (options?.status) {
      sessions = sessions.filter(s => s.status === options.status);
    }

    // Apply limit
    if (options?.limit) {
      sessions = sessions.slice(0, options.limit);
    }

    return sessions;
  }

  /**
   * Auto-suggest search terms
   */
  suggest(query: string, limit: number = 5): string[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.searchIndex.autoSuggest(query, {
      prefix: true,
      fuzzy: 0.1,
    });

    return results.slice(0, limit).map(r => r.suggestion);
  }

  // ============================================================================
  // Stats
  // ============================================================================

  /**
   * Get index statistics
   */
  getStats(): {
    totalSessions: number;
    templateCounts: Record<string, number>;
    topicCounts: Record<string, number>;
    statusCounts: Record<string, number>;
  } {
    const templateCounts: Record<string, number> = {};
    for (const [template, ids] of this.byTemplate.entries()) {
      templateCounts[template] = ids.size;
    }

    const topicCounts: Record<string, number> = {};
    for (const [topic, ids] of this.byTopic.entries()) {
      topicCounts[topic] = ids.size;
    }

    const statusCounts: Record<string, number> = {};
    for (const [status, ids] of this.byStatus.entries()) {
      statusCounts[status] = ids.size;
    }

    return {
      totalSessions: this.byId.size,
      templateCounts,
      topicCounts,
      statusCounts,
    };
  }

  /**
   * Check if index has any data
   */
  isEmpty(): boolean {
    return this.byId.size === 0;
  }

  /**
   * Get the number of indexed sessions
   */
  get size(): number {
    return this.byId.size;
  }

  // ============================================================================
  // Clear
  // ============================================================================

  /**
   * Clear all indexes
   */
  clear(): void {
    this.byId.clear();
    this.byTemplate.clear();
    this.byTopic.clear();
    this.byStatus.clear();

    // Recreate search index (no clear method)
    this.searchIndex = new MiniSearch({
      fields: ['title', 'query'],
      storeFields: ['id', 'title', 'query', 'template_type', 'status'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 2, query: 1 },
      },
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let sessionIndexInstance: SessionIndex | null = null;

export function getSessionIndex(): SessionIndex {
  if (!sessionIndexInstance) {
    sessionIndexInstance = new SessionIndex();
  }
  return sessionIndexInstance;
}
