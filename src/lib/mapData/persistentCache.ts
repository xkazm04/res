/**
 * Persistent Cache - IndexedDB-backed session cache
 *
 * Wraps the in-memory SessionCache with IndexedDB persistence so data
 * survives page reloads. On page load, hydrates from IndexedDB first
 * (instant) then refreshes from API in the background.
 *
 * Schema:
 * - Store "sessions": session summaries keyed by ID
 * - Store "meta": aggregates, timestamps, cursor positions
 */

import type { SessionSummary, AggregatesData } from '@/src/lib/sessionCache';

// ============================================================================
// Constants
// ============================================================================

const DB_NAME = 'research-map-cache';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_META = 'meta';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// IndexedDB Helpers
// ============================================================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        store.createIndex('template_type', 'template_type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Persistent Cache
// ============================================================================

export class PersistentCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB connection. Safe to call multiple times.
   */
  async init(): Promise<void> {
    if (this.db) return;

    if (!this.initPromise) {
      this.initPromise = openDB()
        .then(db => { this.db = db; })
        .catch(err => {
          console.warn('PersistentCache: IndexedDB unavailable:', err.message);
          this.db = null;
        });
    }

    return this.initPromise;
  }

  /**
   * Check if cache is available
   */
  get isAvailable(): boolean {
    return this.db !== null;
  }

  // ============================================================================
  // Session Operations
  // ============================================================================

  /**
   * Store sessions in IndexedDB (bulk put)
   */
  async putSessions(sessions: SessionSummary[]): Promise<void> {
    if (!this.db || sessions.length === 0) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);

      for (const session of sessions) {
        store.put(session);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Load all cached sessions
   */
  async getAllSessions(): Promise<SessionSummary[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load sessions by template type using index
   */
  async getSessionsByTemplate(templateType: string): Promise<SessionSummary[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const index = store.index('template_type');
      const request = index.getAll(templateType);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get total count without loading all data
   */
  async getSessionCount(): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // Meta Operations
  // ============================================================================

  /**
   * Store aggregates data
   */
  async putAggregates(aggregates: AggregatesData): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_META, 'readwrite');
      const store = tx.objectStore(STORE_META);
      store.put({ key: 'aggregates', data: aggregates, timestamp: Date.now() });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Load aggregates data (returns null if stale or missing)
   */
  async getAggregates(): Promise<AggregatesData | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const request = store.get('aggregates');

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        // Check freshness
        if (Date.now() - result.timestamp > MAX_AGE_MS) {
          resolve(null); // Stale
          return;
        }
        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store last sync timestamp
   */
  async setLastSync(timestamp: number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_META, 'readwrite');
      const store = tx.objectStore(STORE_META);
      store.put({ key: 'lastSync', timestamp });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<number | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const request = store.get('lastSync');

      request.onsuccess = () => {
        resolve(request.result?.timestamp ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if cached data is fresh enough
   */
  async isFresh(): Promise<boolean> {
    const lastSync = await this.getLastSync();
    if (!lastSync) return false;
    return Date.now() - lastSync < MAX_AGE_MS;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_SESSIONS, STORE_META], 'readwrite');
      tx.objectStore(STORE_SESSIONS).clear();
      tx.objectStore(STORE_META).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Close the database connection
   */
  dispose(): void {
    this.db?.close();
    this.db = null;
    this.initPromise = null;
  }
}

// ============================================================================
// Singleton
// ============================================================================

let persistentCacheInstance: PersistentCache | null = null;

export function getPersistentCache(): PersistentCache {
  if (!persistentCacheInstance) {
    persistentCacheInstance = new PersistentCache();
  }
  return persistentCacheInstance;
}
