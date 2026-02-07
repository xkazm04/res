import { useMemo, useRef, useCallback } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Compares two arrays for shallow equality by checking each element identity.
 */
function areArraysEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Returns a stable array reference - only returns a new reference if
 * the array contents have actually changed.
 */
function useStableArray<T>(array: T[]): T[] {
  const ref = useRef<T[]>(array);

  if (!areArraysEqual(ref.current, array)) {
    ref.current = array;
  }

  return ref.current;
}

interface UseFilteredDataOptions<T> {
  /** The data array to filter */
  data: T[];
  /** Search query string (will be debounced) */
  searchQuery: string;
  /** Debounce delay in ms (default: 150) */
  debounceMs?: number;
  /** Filter function that receives each item and the debounced search query */
  filterFn: (item: T, debouncedQuery: string) => boolean;
}

interface UseFilteredDataResult<T> {
  /** The filtered data array */
  filteredData: T[];
  /** The debounced search query that was used for filtering */
  debouncedQuery: string;
  /** Whether the query is still being debounced (user is typing) */
  isDebouncing: boolean;
}

/**
 * Filters data with debounced search and stable array references.
 *
 * This hook solves two performance problems:
 * 1. Debounces search input to prevent filtering on every keystroke
 * 2. Stabilizes the data array reference to prevent re-filtering when
 *    parent re-renders with the same underlying data
 *
 * @example
 * ```tsx
 * const { filteredData, debouncedQuery } = useFilteredData({
 *   data: findings,
 *   searchQuery,
 *   filterFn: (finding, query) => {
 *     if (query && !finding.content.toLowerCase().includes(query.toLowerCase())) {
 *       return false;
 *     }
 *     // Additional filter logic...
 *     return true;
 *   }
 * });
 * ```
 */
export function useFilteredData<T>({
  data,
  searchQuery,
  debounceMs = 150,
  filterFn,
}: UseFilteredDataOptions<T>): UseFilteredDataResult<T> {
  // Debounce the search query
  const debouncedQuery = useDebouncedValue(searchQuery, debounceMs);

  // Stabilize the data array reference
  const stableData = useStableArray(data);

  // Stabilize filterFn via ref to prevent recomputation when callers pass inline arrows
  const filterFnRef = useRef(filterFn);
  filterFnRef.current = filterFn;
  const stableFilterFn = useCallback(
    (item: T, query: string) => filterFnRef.current(item, query),
    []
  );

  // Filter using stable references
  const filteredData = useMemo(() => {
    return stableData.filter((item) => stableFilterFn(item, debouncedQuery));
  }, [stableData, debouncedQuery, stableFilterFn]);

  return {
    filteredData,
    debouncedQuery,
    isDebouncing: searchQuery !== debouncedQuery,
  };
}

// =============================================================================
// Single-Pass Categorization Utilities
// =============================================================================

/**
 * Categorizes items into buckets in a single pass through the array.
 * This is more efficient than calling filter() multiple times.
 *
 * @example
 * ```tsx
 * // Instead of:
 * const high = items.filter(x => x.score >= 0.8);
 * const med = items.filter(x => x.score >= 0.5 && x.score < 0.8);
 * const low = items.filter(x => x.score < 0.5);
 *
 * // Use:
 * const { high, medium, low } = categorizeItems(items, {
 *   high: (x) => x.score >= 0.8,
 *   medium: (x) => x.score >= 0.5 && x.score < 0.8,
 *   low: (x) => x.score < 0.5,
 * });
 * ```
 */
export function categorizeItems<T, K extends string>(
  items: T[],
  categories: Record<K, (item: T) => boolean>
): Record<K, T[]> {
  const keys = Object.keys(categories) as K[];
  const result = {} as Record<K, T[]>;

  // Initialize empty arrays for each category
  for (const key of keys) {
    result[key] = [];
  }

  // Single pass through items
  for (const item of items) {
    for (const key of keys) {
      if (categories[key](item)) {
        result[key].push(item);
        break; // Item goes to first matching category only
      }
    }
  }

  return result;
}

/**
 * Categorizes items into buckets in a single pass, allowing items
 * to appear in multiple categories.
 */
export function categorizeItemsMulti<T, K extends string>(
  items: T[],
  categories: Record<K, (item: T) => boolean>
): Record<K, T[]> {
  const keys = Object.keys(categories) as K[];
  const result = {} as Record<K, T[]>;

  // Initialize empty arrays for each category
  for (const key of keys) {
    result[key] = [];
  }

  // Single pass through items
  for (const item of items) {
    for (const key of keys) {
      if (categories[key](item)) {
        result[key].push(item);
      }
    }
  }

  return result;
}

/**
 * Groups items by a key function in a single pass.
 * Similar to lodash's groupBy but with better typing.
 *
 * @example
 * ```tsx
 * const byType = groupBy(entities, e => e.entity_type || 'other');
 * // Returns: { person: [...], organization: [...], ... }
 * ```
 */
export function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}

/**
 * React hook that categorizes items with memoization.
 * Only recomputes when items or categories change.
 *
 * @example
 * ```tsx
 * const categories = useMemo(() => ({
 *   high: (s: Source) => (s.credibility_score || 0) >= 0.8,
 *   medium: (s: Source) => {
 *     const c = s.credibility_score || 0;
 *     return c >= 0.5 && c < 0.8;
 *   },
 *   low: (s: Source) => (s.credibility_score || 0) < 0.5,
 * }), []);
 *
 * const { high, medium, low } = useCategorizedData(filteredSources, categories);
 * ```
 */
export function useCategorizedData<T, K extends string>(
  items: T[],
  categories: Record<K, (item: T) => boolean>
): Record<K, T[]> {
  return useMemo(
    () => categorizeItems(items, categories),
    [items, categories]
  );
}

/**
 * Categorizes by credibility/confidence score into high/medium/low buckets.
 * This is a common pattern extracted for reuse.
 */
export interface CredibilityBuckets<T> {
  high: T[];
  medium: T[];
  low: T[];
}

export function categorizeByCredibility<T>(
  items: T[],
  getScore: (item: T) => number,
  thresholds: { high: number; medium: number } = { high: 0.8, medium: 0.5 }
): CredibilityBuckets<T> {
  const result: CredibilityBuckets<T> = { high: [], medium: [], low: [] };

  for (const item of items) {
    const score = getScore(item);
    if (score >= thresholds.high) {
      result.high.push(item);
    } else if (score >= thresholds.medium) {
      result.medium.push(item);
    } else {
      result.low.push(item);
    }
  }

  return result;
}

/**
 * React hook for credibility bucketing with memoization.
 */
const DEFAULT_THRESHOLDS = { high: 0.8, medium: 0.5 };

export function useCredibilityBuckets<T>(
  items: T[],
  getScore: (item: T) => number,
  thresholds: { high: number; medium: number } = DEFAULT_THRESHOLDS
): CredibilityBuckets<T> {
  // Stabilize getScore via ref so callers can pass inline arrows
  const getScoreRef = useRef(getScore);
  getScoreRef.current = getScore;
  const stableGetScore = useCallback((item: T) => getScoreRef.current(item), []);

  return useMemo(
    () => categorizeByCredibility(items, stableGetScore, thresholds),
    [items, stableGetScore, thresholds]
  );
}
