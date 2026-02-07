/**
 * Session Cache - LRU Cache Implementation
 *
 * Provides efficient caching for session data with automatic eviction
 * based on least recently used (LRU) policy and memory limits.
 */

import type { ResearchSession, SessionWithDetails } from '@/src/types/research';

// ============================================================================
// Memory Limits
// ============================================================================

export const MEMORY_LIMITS = {
  maxCachedSummaries: 2000,  // ~1MB for session summaries
  maxCachedDetails: 50,      // ~5MB for full session details
  maxMapNodes: 5000,         // ~1MB for map nodes
};

// ============================================================================
// LRU Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Update timestamp (move to end for LRU)
    entry.timestamp = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    // Delete if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  values(): V[] {
    const result: V[] = [];
    for (const entry of this.cache.values()) {
      result.push(entry.value);
    }
    return result;
  }

  entries(): [K, V][] {
    const result: [K, V][] = [];
    for (const [k, v] of this.cache.entries()) {
      result.push([k, v.value]);
    }
    return result;
  }

  /**
   * Evict a percentage of oldest entries
   */
  evict(percentage: number = 0.3): number {
    const count = Math.floor(this.cache.size * percentage);
    let evicted = 0;

    for (const key of this.cache.keys()) {
      if (evicted >= count) break;
      this.cache.delete(key);
      evicted++;
    }

    return evicted;
  }

  /**
   * Get all entries older than the given timestamp
   */
  getStaleEntries(maxAge: number): K[] {
    const cutoff = Date.now() - maxAge;
    const stale: K[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < cutoff) {
        stale.push(key);
      }
    }

    return stale;
  }
}

// ============================================================================
// Session Summary Cache
// ============================================================================

export interface SessionSummary {
  id: string;
  title: string;
  query: string;
  template_type: string;
  status: string;
  primary_topic_id?: string;
  claim_count: number;
  source_count: number;
  created_at: string;
}

export interface TemplateData {
  sessions: SessionSummary[];
  topics: TopicSummary[];
  cursor: string | null;
  hasMore: boolean;
  totalCount: number;
  fetchedAt: number;
}

export interface TopicSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  session_count: number;
}

export interface TopicData {
  sessions: SessionSummary[];
  cursor: string | null;
  hasMore: boolean;
  totalCount: number;
  fetchedAt: number;
}

// ============================================================================
// Aggregates Cache
// ============================================================================

export interface AggregatesData {
  totalCount: number;
  templateCounts: Record<string, number>;
  topicCounts: Record<string, { count: number; name: string }>;
  statusCounts: Record<string, number>;
  timestamp: number;
}

// ============================================================================
// Session Cache Class
// ============================================================================

export class SessionCache {
  // L1: Aggregates (always loaded, tiny)
  private aggregates: AggregatesData | null = null;
  private aggregatesMaxAge = 5 * 60 * 1000; // 5 minutes

  // L2: Template data (loaded on drill-down)
  private templateCache = new Map<string, TemplateData>();

  // L2.5: Topic data (loaded on drill-down into topic)
  private topicCache = new Map<string, TopicData>();

  // L3: Session details (LRU, max 50)
  private detailsCache = new LRUCache<string, SessionWithDetails>(
    MEMORY_LIMITS.maxCachedDetails
  );

  // ============================================================================
  // Aggregates (L1)
  // ============================================================================

  getAggregates(): AggregatesData | null {
    if (!this.aggregates) return null;

    // Check if stale
    if (Date.now() - this.aggregates.timestamp > this.aggregatesMaxAge) {
      return null; // Signal need for refresh
    }

    return this.aggregates;
  }

  setAggregates(data: AggregatesData): void {
    this.aggregates = data;
  }

  invalidateAggregates(): void {
    this.aggregates = null;
  }

  // ============================================================================
  // Template Data (L2)
  // ============================================================================

  getTemplateData(templateType: string): TemplateData | null {
    return this.templateCache.get(templateType) || null;
  }

  setTemplateData(templateType: string, data: TemplateData): void {
    this.templateCache.set(templateType, data);
  }

  appendTemplateData(templateType: string, newSessions: SessionSummary[], cursor: string | null, hasMore: boolean): void {
    const existing = this.templateCache.get(templateType);
    if (existing) {
      // Use push with apply for efficient array extension (avoids creating intermediate array)
      existing.sessions.push(...newSessions);
      existing.cursor = cursor;
      existing.hasMore = hasMore;
    }
  }

  hasTemplateData(templateType: string): boolean {
    return this.templateCache.has(templateType);
  }

  invalidateTemplateData(templateType?: string): void {
    if (templateType) {
      this.templateCache.delete(templateType);
    } else {
      this.templateCache.clear();
    }
  }

  // ============================================================================
  // Topic Data (L2.5)
  // ============================================================================

  getTopicData(topicId: string): TopicData | null {
    return this.topicCache.get(topicId) || null;
  }

  setTopicData(topicId: string, data: TopicData): void {
    this.topicCache.set(topicId, data);
  }

  appendTopicData(topicId: string, newSessions: SessionSummary[], cursor: string | null, hasMore: boolean): void {
    const existing = this.topicCache.get(topicId);
    if (existing) {
      // Use push with spread for efficient array extension (avoids creating intermediate array)
      existing.sessions.push(...newSessions);
      existing.cursor = cursor;
      existing.hasMore = hasMore;
    }
  }

  hasTopicData(topicId: string): boolean {
    return this.topicCache.has(topicId);
  }

  invalidateTopicData(topicId?: string): void {
    if (topicId) {
      this.topicCache.delete(topicId);
    } else {
      this.topicCache.clear();
    }
  }

  // ============================================================================
  // Session Details (L3)
  // ============================================================================

  getSessionDetails(sessionId: string): SessionWithDetails | undefined {
    return this.detailsCache.get(sessionId);
  }

  setSessionDetails(session: SessionWithDetails): void {
    this.detailsCache.set(session.id, session);
  }

  hasSessionDetails(sessionId: string): boolean {
    return this.detailsCache.has(sessionId);
  }

  invalidateSessionDetails(sessionId?: string): void {
    if (sessionId) {
      this.detailsCache.delete(sessionId);
    } else {
      this.detailsCache.clear();
    }
  }

  // ============================================================================
  // Memory Management
  // ============================================================================

  /**
   * Get current memory usage estimates
   */
  getMemoryStats(): {
    aggregates: boolean;
    templateCount: number;
    topicCount: number;
    detailsCount: number;
    estimatedSizeKB: number;
  } {
    // Rough size estimates
    const templateSize = this.templateCache.size * 50; // ~50KB per template
    const topicSize = this.topicCache.size * 20; // ~20KB per topic
    const detailsSize = this.detailsCache.size * 100; // ~100KB per session details

    return {
      aggregates: this.aggregates !== null,
      templateCount: this.templateCache.size,
      topicCount: this.topicCache.size,
      detailsCount: this.detailsCache.size,
      estimatedSizeKB: templateSize + topicSize + detailsSize,
    };
  }

  /**
   * Evict caches based on memory pressure
   */
  evictIfNeeded(): void {
    const stats = this.getMemoryStats();

    // If estimated size exceeds 50MB, start evicting
    if (stats.estimatedSizeKB > 50000) {
      // Evict 30% of details cache
      this.detailsCache.evict(0.3);

      // Clear older template caches (keep 5 most recent)
      if (this.templateCache.size > 5) {
        const entries = Array.from(this.templateCache.entries())
          .sort((a, b) => b[1].fetchedAt - a[1].fetchedAt);

        for (let i = 5; i < entries.length; i++) {
          this.templateCache.delete(entries[i][0]);
        }
      }

      // Clear older topic caches (keep 10 most recent)
      if (this.topicCache.size > 10) {
        const entries = Array.from(this.topicCache.entries())
          .sort((a, b) => b[1].fetchedAt - a[1].fetchedAt);

        for (let i = 10; i < entries.length; i++) {
          this.topicCache.delete(entries[i][0]);
        }
      }
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.aggregates = null;
    this.templateCache.clear();
    this.topicCache.clear();
    this.detailsCache.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let sessionCacheInstance: SessionCache | null = null;

export function getSessionCache(): SessionCache {
  if (!sessionCacheInstance) {
    sessionCacheInstance = new SessionCache();
  }
  return sessionCacheInstance;
}
