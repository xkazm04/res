'use client';

/**
 * TabLens - A declarative abstraction for tab-based data views.
 *
 * Each tab is a "lens" that projects the same SessionWithDetails object
 * into a different view. This separates data shaping from presentation,
 * enables automatic change detection, and allows tabs to be composed,
 * extended, or reordered declaratively.
 *
 * @example
 * // Define a lens
 * const findingsLens = defineLens({
 *   id: 'findings',
 *   label: 'Findings',
 *   icon: DocumentIcon,
 *   extract: (session, filters) => ({
 *     findings: filterFindings(session.findings, filters),
 *     sources: session.sources,
 *   }),
 *   render: (props) => <FindingsView {...props} />,
 *   filters: ['type', 'confidence', 'search'],
 * });
 *
 * // Use via registry
 * <LensRenderer lensId="findings" session={session} filters={filters} />
 */

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
  type ComponentType,
  type FC,
} from 'react';
import type { SessionWithDetails } from '@/src/types/research';

// =============================================================================
// Types
// =============================================================================

/** Filter state passed to lenses */
export interface LensFilters {
  searchQuery: string;
  filterType: string;
  filterConfidence: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | undefined;
}

/** Available filter types a lens can request */
export type LensFilterType =
  | 'search'
  | 'type'
  | 'confidence'
  | 'credibility'
  | 'priority'
  | 'status'
  | 'date'
  | 'sort';

/** Statistics computed from session data */
export interface SessionStats {
  findings: number;
  sources: number;
  perspectives: number;
  contradictions: number;
  gaps: number;
  entities: number;
  avgConfidence: number;
  highConfidence: number;
  medConfidence: number;
  lowConfidence: number;
  redFlags: number;
  highCredSources: number;
}

/** Props passed to lens renderers */
export interface LensRenderProps<TExtracted = unknown> {
  /** Extracted/transformed data from the session */
  data: TExtracted;
  /** Current filter state */
  filters: LensFilters;
  /** Computed session statistics */
  stats: SessionStats;
  /** Whether data is currently loading/transforming */
  isLoading?: boolean;
  /** Callback to update a filter value */
  onFilterChange?: (key: string, value: string) => void;
}

/** Lens definition */
export interface LensDef<TExtracted = unknown> {
  /** Unique identifier for the lens */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: ComponentType<{ className?: string }>;
  /** Description for accessibility */
  description?: string;
  /** Order in tab bar (lower = earlier) */
  order?: number;
  /** Filter types this lens supports */
  filters?: LensFilterType[];
  /** Badge count extractor (for tab badge) */
  getBadgeCount?: (session: SessionWithDetails, stats: SessionStats) => number | null;
  /** Whether this lens should be hidden based on session state */
  isHidden?: (session: SessionWithDetails) => boolean;
  /** Data extraction/transformation function */
  extract: (session: SessionWithDetails, filters: LensFilters, stats: SessionStats) => TExtracted;
  /** Render component */
  render: FC<LensRenderProps<TExtracted>>;
  /** Optional: compute derived stats specific to this lens */
  computeStats?: (session: SessionWithDetails) => Partial<SessionStats>;
}

/** Type-safe lens definition helper */
export type Lens<TExtracted> = LensDef<TExtracted>;

/** Lens registry entry with render info */
export interface LensRegistryEntry {
  def: LensDef<unknown>;
  Component: FC<{ session: SessionWithDetails; filters: LensFilters; stats: SessionStats }>;
}

// =============================================================================
// Lens Definition Helper
// =============================================================================

/**
 * Define a type-safe lens.
 *
 * @example
 * const myLens = defineLens({
 *   id: 'custom',
 *   label: 'Custom View',
 *   icon: CustomIcon,
 *   extract: (session) => ({ items: session.findings }),
 *   render: ({ data }) => <CustomView items={data.items} />,
 * });
 */
export function defineLens<TExtracted>(def: LensDef<TExtracted>): Lens<TExtracted> {
  return def;
}

// =============================================================================
// Statistics Computation
// =============================================================================

/**
 * Compute aggregate statistics from session data.
 * These stats are passed to all lenses for consistent display.
 */
export function computeSessionStats(session: SessionWithDetails): SessionStats {
  const findings = session.findings || [];
  const sources = session.sources || [];
  const perspectives = session.perspectives || [];
  const contradictions = session.contradictions || [];
  const gaps = session.gaps || [];
  const entities = session.entities || [];

  // Confidence distribution
  const confidenceScores = findings.map((f) => f.confidence_score || 0);
  const avgConfidence =
    confidenceScores.length > 0
      ? Math.round(
          (confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) * 100
        )
      : 0;

  const highConfidence = findings.filter((f) => (f.confidence_score || 0) >= 0.8).length;
  const medConfidence = findings.filter((f) => {
    const c = f.confidence_score || 0;
    return c >= 0.5 && c < 0.8;
  }).length;
  const lowConfidence = findings.filter((f) => (f.confidence_score || 0) < 0.5).length;

  // Source credibility
  const highCredSources = sources.filter((s) => (s.credibility_score || 0) >= 0.8).length;

  // Red flags from perspectives
  const redFlags = perspectives.reduce((count, p) => count + (p.warnings?.length || 0), 0);

  return {
    findings: findings.length,
    sources: sources.length,
    perspectives: perspectives.length,
    contradictions: contradictions.length,
    gaps: gaps.length,
    entities: entities.length,
    avgConfidence,
    highConfidence,
    medConfidence,
    lowConfidence,
    redFlags,
    highCredSources,
  };
}

// =============================================================================
// Lens Registry
// =============================================================================

const lensRegistry = new Map<string, LensRegistryEntry>();

/**
 * Register a lens in the global registry.
 */
export function registerLens<TExtracted>(lens: Lens<TExtracted>): void {
  // Create a wrapper component that handles extraction and rendering
  const LensComponent: FC<{
    session: SessionWithDetails;
    filters: LensFilters;
    stats: SessionStats;
  }> = ({ session, filters, stats }) => {
    // Memoize extraction
    const data = useMemo(
      () => lens.extract(session, filters, stats),
      [session, filters, stats]
    );

    // Type assertion needed due to generic erasure
    const Renderer = lens.render as FC<LensRenderProps<TExtracted>>;

    return <Renderer data={data} filters={filters} stats={stats} />;
  };

  LensComponent.displayName = `Lens(${lens.id})`;

  lensRegistry.set(lens.id, {
    def: lens as LensDef<unknown>,
    Component: LensComponent,
  });
}

/**
 * Get a lens by ID.
 */
export function getLens(id: string): LensRegistryEntry | undefined {
  return lensRegistry.get(id);
}

/**
 * Get all registered lenses, sorted by order.
 */
export function getAllLenses(): LensRegistryEntry[] {
  return Array.from(lensRegistry.values()).sort(
    (a, b) => (a.def.order ?? 99) - (b.def.order ?? 99)
  );
}

/**
 * Get visible lenses for a session.
 */
export function getVisibleLenses(session: SessionWithDetails): LensRegistryEntry[] {
  return getAllLenses().filter((entry) => {
    if (entry.def.isHidden) {
      return !entry.def.isHidden(session);
    }
    return true;
  });
}

// =============================================================================
// Lens Context
// =============================================================================

interface LensContextValue {
  /** Current active lens ID */
  activeLensId: string;
  /** Set active lens */
  setActiveLens: (id: string) => void;
  /** Current session */
  session: SessionWithDetails | null;
  /** Current filter state */
  filters: LensFilters;
  /** Update a filter */
  setFilter: (key: string, value: string) => void;
  /** Computed stats */
  stats: SessionStats | null;
  /** All visible lenses */
  visibleLenses: LensRegistryEntry[];
}

const LensContext = createContext<LensContextValue | null>(null);

/**
 * Hook to access lens context.
 */
export function useLensContext(): LensContextValue {
  const ctx = useContext(LensContext);
  if (!ctx) {
    throw new Error('useLensContext must be used within LensProvider');
  }
  return ctx;
}

/**
 * Hook to get current active lens.
 */
export function useActiveLens(): LensRegistryEntry | null {
  const { activeLensId } = useLensContext();
  return getLens(activeLensId) || null;
}

// =============================================================================
// Lens Provider
// =============================================================================

interface LensProviderProps {
  /** Session data to project through lenses */
  session: SessionWithDetails;
  /** Initial active lens ID */
  initialLensId?: string;
  /** Initial filter state */
  initialFilters?: Partial<LensFilters>;
  /** Controlled active lens ID */
  activeLensId?: string;
  /** Controlled filter state */
  filters?: LensFilters;
  /** Callback when active lens changes */
  onActiveLensChange?: (id: string) => void;
  /** Callback when filters change */
  onFiltersChange?: (filters: LensFilters) => void;
  children: ReactNode;
}

const defaultFilters: LensFilters = {
  searchQuery: '',
  filterType: 'all',
  filterConfidence: 'all',
  sortBy: undefined,
  sortOrder: 'desc',
};

/**
 * Provider for lens-based tab system.
 */
export function LensProvider({
  session,
  initialLensId = 'overview',
  initialFilters = {},
  activeLensId: controlledLensId,
  filters: controlledFilters,
  onActiveLensChange,
  onFiltersChange,
  children,
}: LensProviderProps) {
  // Internal state (used when uncontrolled)
  const [internalLensId, setInternalLensId] = React.useState(initialLensId);
  const [internalFilters, setInternalFilters] = React.useState<LensFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  // Determine whether we're controlled
  const isControlled = controlledLensId !== undefined;
  const activeLensIdValue = isControlled ? controlledLensId : internalLensId;
  const filtersValue = controlledFilters ?? internalFilters;

  // Compute stats once
  const stats = useMemo(() => computeSessionStats(session), [session]);

  // Get visible lenses
  const visibleLenses = useMemo(() => getVisibleLenses(session), [session]);

  // Handlers
  const setActiveLens = useCallback(
    (id: string) => {
      if (isControlled) {
        onActiveLensChange?.(id);
      } else {
        setInternalLensId(id);
        onActiveLensChange?.(id);
      }
    },
    [isControlled, onActiveLensChange]
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      const newFilters = { ...filtersValue, [key]: value };
      if (controlledFilters) {
        onFiltersChange?.(newFilters);
      } else {
        setInternalFilters(newFilters);
        onFiltersChange?.(newFilters);
      }
    },
    [filtersValue, controlledFilters, onFiltersChange]
  );

  const contextValue: LensContextValue = useMemo(
    () => ({
      activeLensId: activeLensIdValue,
      setActiveLens,
      session,
      filters: filtersValue,
      setFilter,
      stats,
      visibleLenses,
    }),
    [activeLensIdValue, setActiveLens, session, filtersValue, setFilter, stats, visibleLenses]
  );

  return <LensContext.Provider value={contextValue}>{children}</LensContext.Provider>;
}

// Need React import for useState
import React from 'react';

// =============================================================================
// Lens Renderer Component
// =============================================================================

interface LensRendererProps {
  /** Lens ID to render (optional - uses context if not provided) */
  lensId?: string;
  /** Override session (optional - uses context if not provided) */
  session?: SessionWithDetails;
  /** Override filters (optional - uses context if not provided) */
  filters?: LensFilters;
  /** Override stats (optional - uses context if not provided) */
  stats?: SessionStats;
  /** Fallback content when lens not found */
  fallback?: ReactNode;
  /** ClassName for wrapper */
  className?: string;
}

/**
 * Renders the appropriate lens component.
 */
export function LensRenderer({
  lensId,
  session: sessionOverride,
  filters: filtersOverride,
  stats: statsOverride,
  fallback = null,
  className,
}: LensRendererProps) {
  const ctx = useContext(LensContext);

  // Resolve values from context or props
  const resolvedLensId = lensId ?? ctx?.activeLensId;
  const resolvedSession = sessionOverride ?? ctx?.session;
  const resolvedFilters = filtersOverride ?? ctx?.filters ?? defaultFilters;
  const resolvedStats = statsOverride ?? ctx?.stats;

  // Get lens entry
  const lensEntry = resolvedLensId ? getLens(resolvedLensId) : null;

  if (!lensEntry || !resolvedSession || !resolvedStats) {
    return <>{fallback}</>;
  }

  const { Component } = lensEntry;

  return (
    <div className={className}>
      <Component session={resolvedSession} filters={resolvedFilters} stats={resolvedStats} />
    </div>
  );
}

// =============================================================================
// Tab Bar Component
// =============================================================================

interface LensTabBarProps {
  /** ClassName for wrapper */
  className?: string;
  /** Tab variant */
  variant?: 'default' | 'pills' | 'underline';
}

/**
 * Renders a tab bar for switching between lenses.
 */
export function LensTabBar({ className = '', variant = 'default' }: LensTabBarProps) {
  const { activeLensId, setActiveLens, visibleLenses, session, stats } = useLensContext();

  const variantStyles = {
    default: {
      container: 'flex gap-1 p-1 bg-slate-100 rounded-lg',
      tab: 'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
      active: 'bg-white text-slate-900 shadow-sm',
      inactive: 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
    },
    pills: {
      container: 'flex gap-2',
      tab: 'px-4 py-2 text-sm font-medium rounded-full transition-colors',
      active: 'bg-slate-900 text-white',
      inactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    },
    underline: {
      container: 'flex gap-4 border-b border-slate-200',
      tab: 'px-2 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors',
      active: 'border-slate-900 text-slate-900',
      inactive: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${styles.container} ${className}`} role="tablist">
      {visibleLenses.map((entry) => {
        const { def } = entry;
        const isActive = activeLensId === def.id;
        const Icon = def.icon;
        const badgeCount = session && stats ? def.getBadgeCount?.(session, stats) ?? null : null;

        return (
          <button
            key={def.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${def.id}`}
            onClick={() => setActiveLens(def.id)}
            className={`${styles.tab} ${isActive ? styles.active : styles.inactive}`}
          >
            <span className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span>{def.label}</span>
              {badgeCount !== null && badgeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-slate-200 text-slate-700">
                  {badgeCount}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Utility: Change Detection Hook
// =============================================================================

/**
 * Hook that detects changes in extracted data.
 * Useful for animating data changes.
 */
export function useLensDataChanges<T>(
  extractor: (session: SessionWithDetails, stats: SessionStats) => T,
  compare?: (prev: T, next: T) => boolean
): {
  data: T | null;
  hasChanged: boolean;
  previousData: T | null;
} {
  const { session, stats } = useLensContext();
  const [previousData, setPreviousData] = React.useState<T | null>(null);
  const [hasChanged, setHasChanged] = React.useState(false);

  const data = useMemo(() => {
    if (!session || !stats) return null;
    return extractor(session, stats);
  }, [session, stats, extractor]);

  React.useEffect(() => {
    if (data === null) return;

    if (previousData !== null) {
      const changed = compare
        ? !compare(previousData, data)
        : JSON.stringify(previousData) !== JSON.stringify(data);

      if (changed) {
        setHasChanged(true);
        const timer = setTimeout(() => setHasChanged(false), 300);
        return () => clearTimeout(timer);
      }
    }

    setPreviousData(data);
  }, [data, previousData, compare]);

  return { data, hasChanged, previousData };
}

// =============================================================================
// Utility: Filter Helpers
// =============================================================================

/**
 * Check if a confidence score matches a filter.
 */
export function matchesConfidenceLensFilter(
  score: number,
  filter: string
): boolean {
  if (filter === 'all') return true;
  if (filter === 'high') return score >= 0.8;
  if (filter === 'medium') return score >= 0.5 && score < 0.8;
  if (filter === 'low') return score < 0.5;
  return true;
}

/**
 * Apply common filters to a list of items.
 */
export function applyLensFilters<T extends { confidence_score?: number }>(
  items: T[],
  filters: LensFilters,
  options: {
    searchFields?: (item: T) => string[];
    typeField?: keyof T;
  } = {}
): T[] {
  return items.filter((item) => {
    // Search filter
    if (filters.searchQuery && options.searchFields) {
      const query = filters.searchQuery.toLowerCase();
      const fields = options.searchFields(item);
      if (!fields.some((f) => f.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Type filter
    if (filters.filterType !== 'all' && options.typeField) {
      if (item[options.typeField] !== filters.filterType) {
        return false;
      }
    }

    // Confidence filter
    if (!matchesConfidenceLensFilter(item.confidence_score || 0, filters.filterConfidence)) {
      return false;
    }

    return true;
  });
}

// =============================================================================
// Exports
// =============================================================================

export type { LensFilterType as FilterType };
