/**
 * useContradictionExplorer Hook
 *
 * Provides state management and business logic for the contradiction explorer.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  ResearchContradiction,
  ResearchFinding,
  ResearchSource,
} from '@/src/types/research';
import {
  type ContradictionWithContext,
  type SeverityAnalysis,
  type ResolutionStrategy,
  type Resolution,
  type ResolutionStatus,
  type ConfidenceImpact,
  type ResolutionVote,
  type ResolutionHistory,
  type ResolutionStrategyType,
  calculateSeverity,
  generateResolutionStrategies,
  simulateConfidenceImpact,
  saveResolution,
  loadResolutions,
  getResolution,
  addResolutionVote,
  getVotingSummary,
  addHistoryEvent,
  getResolutionHistory,
} from '@/src/lib/contradictionResolution';

// ============================================================================
// Types
// ============================================================================

export type SortOption = 'severity' | 'date' | 'status';
export type FilterStatus = 'all' | ResolutionStatus;

export interface UseContradictionExplorerOptions {
  contradictions: ResearchContradiction[];
  findings: ResearchFinding[];
  sources: ResearchSource[];
  onResolutionChange?: (resolution: Resolution) => void;
}

export interface UseContradictionExplorerReturn {
  // Data
  enrichedContradictions: EnrichedContradiction[];
  selectedContradiction: EnrichedContradiction | null;
  strategies: ResolutionStrategy[];
  confidenceImpacts: Map<string, ConfidenceImpact[]>;

  // Selection
  selectContradiction: (id: string | null) => void;
  selectedId: string | null;

  // Filtering & Sorting
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Resolution actions
  updateStatus: (contradictionId: string, status: ResolutionStatus) => void;
  selectStrategy: (contradictionId: string, strategy: ResolutionStrategyType) => void;
  addNote: (contradictionId: string, note: string) => void;
  submitVote: (
    contradictionId: string,
    strategy: ResolutionStrategyType,
    confidence: number,
    reasoning?: string
  ) => void;
  finalizeResolution: (contradictionId: string, customResolution?: string) => void;

  // Simulation
  simulateStrategy: (strategy: ResolutionStrategy) => ConfidenceImpact[];

  // History
  getHistory: (contradictionId: string) => ResolutionHistory | null;

  // Stats
  stats: {
    total: number;
    unresolved: number;
    investigating: number;
    resolved: number;
    dismissed: number;
    criticalCount: number;
    highCount: number;
  };

  // Loading
  isLoading: boolean;
}

export interface EnrichedContradiction extends ContradictionWithContext {
  severity: SeverityAnalysis;
  resolution: Resolution | null;
  strategies: ResolutionStrategy[];
  votingSummary: Map<ResolutionStrategyType, { count: number; avgConfidence: number }>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useContradictionExplorer(
  options: UseContradictionExplorerOptions
): UseContradictionExplorerReturn {
  const { contradictions, findings, sources, onResolutionChange } = options;

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('severity');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create lookup maps
  const findingMap = useMemo(
    () => new Map(findings.map((f) => [f.id, f])),
    [findings]
  );

  const sourceMap = useMemo(
    () => new Map(sources.map((s) => [s.id, s])),
    [sources]
  );

  // Load resolutions from localStorage on mount
  useEffect(() => {
    setResolutions(loadResolutions());
    setIsLoading(false);
  }, []);

  // Enrich contradictions with context
  const enrichedContradictions = useMemo((): EnrichedContradiction[] => {
    return contradictions.map((c) => {
      // Get related findings
      const finding1 = c.finding_id_1 ? findingMap.get(c.finding_id_1) : undefined;
      const finding2 = c.finding_id_2 ? findingMap.get(c.finding_id_2) : undefined;

      // Get sources - try to match by URL or source ID
      let source1: ResearchSource | undefined;
      let source2: ResearchSource | undefined;

      if (c.source_1) {
        source1 =
          sourceMap.get(c.source_1) ??
          sources.find((s) => s.url === c.source_1 || s.domain === c.source_1);
      }
      if (c.source_2) {
        source2 =
          sourceMap.get(c.source_2) ??
          sources.find((s) => s.url === c.source_2 || s.domain === c.source_2);
      }

      // Build enriched contradiction
      const enriched: ContradictionWithContext = {
        ...c,
        finding_1: finding1,
        finding_2: finding2,
        source_1_details: source1,
        source_2_details: source2,
      };

      // Calculate severity
      const severity = calculateSeverity(enriched, findings);

      // Get resolution
      const resolution = resolutions.find((r) => r.contradictionId === c.id) ?? null;

      // Generate strategies
      const strategies = generateResolutionStrategies(enriched, severity);

      // Get voting summary
      const votingSummary = resolution
        ? getVotingSummary(resolution)
        : new Map<ResolutionStrategyType, { count: number; avgConfidence: number }>();

      return {
        ...enriched,
        severity,
        resolution,
        strategies,
        votingSummary,
      };
    });
  }, [contradictions, findings, sources, findingMap, sourceMap, resolutions]);

  // Filter and sort
  const filteredContradictions = useMemo(() => {
    let result = [...enrichedContradictions];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter((c) => {
        const status = c.resolution?.status ?? 'unresolved';
        return status === filterStatus;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.claim_1?.toLowerCase().includes(query) ||
          c.claim_2?.toLowerCase().includes(query) ||
          c.significance?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return b.severity.score - a.severity.score;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'status': {
          const statusOrder: Record<ResolutionStatus, number> = {
            unresolved: 0,
            investigating: 1,
            resolved: 2,
            dismissed: 3,
          };
          const statusA = a.resolution?.status ?? 'unresolved';
          const statusB = b.resolution?.status ?? 'unresolved';
          return statusOrder[statusA] - statusOrder[statusB];
        }
        default:
          return 0;
      }
    });

    return result;
  }, [enrichedContradictions, filterStatus, sortBy, searchQuery]);

  // Selected contradiction
  const selectedContradiction = useMemo(
    () => enrichedContradictions.find((c) => c.id === selectedId) ?? null,
    [enrichedContradictions, selectedId]
  );

  // Strategies for selected contradiction
  const strategies = useMemo(
    () => selectedContradiction?.strategies ?? [],
    [selectedContradiction]
  );

  // Confidence impacts cache
  const confidenceImpacts = useMemo(() => {
    const map = new Map<string, ConfidenceImpact[]>();

    if (selectedContradiction) {
      selectedContradiction.strategies.forEach((strategy) => {
        const impacts = simulateConfidenceImpact(
          selectedContradiction,
          strategy,
          findings
        );
        map.set(strategy.id, impacts);
      });
    }

    return map;
  }, [selectedContradiction, findings]);

  // Stats
  const stats = useMemo(() => {
    let unresolved = 0;
    let investigating = 0;
    let resolved = 0;
    let dismissed = 0;
    let criticalCount = 0;
    let highCount = 0;

    enrichedContradictions.forEach((c) => {
      const status = c.resolution?.status ?? 'unresolved';
      switch (status) {
        case 'unresolved':
          unresolved++;
          break;
        case 'investigating':
          investigating++;
          break;
        case 'resolved':
          resolved++;
          break;
        case 'dismissed':
          dismissed++;
          break;
      }

      if (c.severity.level === 'critical') criticalCount++;
      if (c.severity.level === 'high') highCount++;
    });

    return {
      total: enrichedContradictions.length,
      unresolved,
      investigating,
      resolved,
      dismissed,
      criticalCount,
      highCount,
    };
  }, [enrichedContradictions]);

  // Actions
  const selectContradiction = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const updateResolution = useCallback(
    (contradictionId: string, updates: Partial<Resolution>) => {
      setResolutions((prev) => {
        const existing = prev.find((r) => r.contradictionId === contradictionId);
        const updated: Resolution = existing
          ? { ...existing, ...updates }
          : {
              id: `res-${Date.now()}`,
              contradictionId,
              status: 'unresolved',
              ...updates,
            };

        saveResolution(updated);
        onResolutionChange?.(updated);

        return existing
          ? prev.map((r) => (r.contradictionId === contradictionId ? updated : r))
          : [...prev, updated];
      });
    },
    [onResolutionChange]
  );

  const updateStatus = useCallback(
    (contradictionId: string, status: ResolutionStatus) => {
      const existing = resolutions.find((r) => r.contradictionId === contradictionId);
      const previousStatus = existing?.status ?? 'unresolved';

      updateResolution(contradictionId, { status });

      addHistoryEvent(contradictionId, {
        type: 'status_change',
        previousValue: previousStatus,
        newValue: status,
      });
    },
    [resolutions, updateResolution]
  );

  const selectStrategy = useCallback(
    (contradictionId: string, strategy: ResolutionStrategyType) => {
      updateResolution(contradictionId, {
        selectedStrategy: strategy,
        status: 'investigating',
      });

      addHistoryEvent(contradictionId, {
        type: 'strategy_selected',
        newValue: strategy,
      });
    },
    [updateResolution]
  );

  const addNote = useCallback(
    (contradictionId: string, note: string) => {
      const existing = resolutions.find((r) => r.contradictionId === contradictionId);
      const existingNotes = existing?.notes ?? '';
      const newNotes = existingNotes
        ? `${existingNotes}\n\n---\n\n${note}`
        : note;

      updateResolution(contradictionId, { notes: newNotes });

      addHistoryEvent(contradictionId, {
        type: 'note',
        details: note,
      });
    },
    [resolutions, updateResolution]
  );

  const submitVote = useCallback(
    (
      contradictionId: string,
      strategy: ResolutionStrategyType,
      confidence: number,
      reasoning?: string
    ) => {
      const vote: Omit<ResolutionVote, 'id'> = {
        userId: 'current-user', // Would come from auth in real app
        userName: 'You',
        strategy,
        confidence,
        reasoning,
        votedAt: new Date().toISOString(),
      };

      const updated = addResolutionVote(contradictionId, vote);
      setResolutions((prev) => {
        const idx = prev.findIndex((r) => r.contradictionId === contradictionId);
        return idx >= 0
          ? prev.map((r, i) => (i === idx ? updated : r))
          : [...prev, updated];
      });

      addHistoryEvent(contradictionId, {
        type: 'vote',
        newValue: strategy,
        details: `Voted for ${strategy} with ${Math.round(confidence * 100)}% confidence`,
      });
    },
    []
  );

  const finalizeResolution = useCallback(
    (contradictionId: string, customResolution?: string) => {
      updateResolution(contradictionId, {
        status: 'resolved',
        customResolution,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'current-user',
      });

      addHistoryEvent(contradictionId, {
        type: 'status_change',
        previousValue: 'investigating',
        newValue: 'resolved',
        details: customResolution,
      });
    },
    [updateResolution]
  );

  const simulateStrategy = useCallback(
    (strategy: ResolutionStrategy): ConfidenceImpact[] => {
      if (!selectedContradiction) return [];
      return simulateConfidenceImpact(selectedContradiction, strategy, findings);
    },
    [selectedContradiction, findings]
  );

  const getHistory = useCallback(
    (contradictionId: string): ResolutionHistory | null => {
      return getResolutionHistory(contradictionId);
    },
    []
  );

  return {
    // Data
    enrichedContradictions: filteredContradictions,
    selectedContradiction,
    strategies,
    confidenceImpacts,

    // Selection
    selectContradiction,
    selectedId,

    // Filtering & Sorting
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,

    // Resolution actions
    updateStatus,
    selectStrategy,
    addNote,
    submitVote,
    finalizeResolution,

    // Simulation
    simulateStrategy,

    // History
    getHistory,

    // Stats
    stats,

    // Loading
    isLoading,
  };
}
