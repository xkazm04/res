import { create } from 'zustand';
import type {
  SessionWithDetails,
  ResearchFinding,
  ResearchSource,
  ResearchPerspective,
  KnowledgeEntity,
} from '@/src/types/research';

export interface MoneyFlowNode {
  id: string;
  name: string;
  type: 'source' | 'intermediary' | 'destination';
  value?: number;
}

export interface MoneyFlowLink {
  source: string;
  target: string;
  value: number;
  description?: string;
}

export interface StakeholderData {
  name: string;
  benefit: 'positive' | 'negative' | 'neutral';
  impact: number;
  category: string;
  description?: string;
}

interface FinancialState {
  // Session data
  session: SessionWithDetails | null;
  isLoading: boolean;
  error: string | null;

  // View state
  activeTab: 'overview' | 'flows' | 'stakeholders' | 'timeline' | 'sources';
  selectedEntityId: string | null;
  selectedFindingId: string | null;
  timelineRange: { start: Date | null; end: Date | null };

  // Filters
  sourceTypeFilter: string[];
  credibilityThreshold: number;
  findingTypeFilter: string[];

  // Cross-filter state (for linked brushing)
  brushedTimeRange: { start: Date | null; end: Date | null };
  highlightedEntities: string[];

  // Derived data
  moneyFlows: { nodes: MoneyFlowNode[]; links: MoneyFlowLink[] };
  stakeholders: StakeholderData[];

  // Actions
  setSession: (session: SessionWithDetails) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setActiveTab: (tab: FinancialState['activeTab']) => void;
  selectEntity: (id: string | null) => void;
  selectFinding: (id: string | null) => void;

  setSourceTypeFilter: (types: string[]) => void;
  setCredibilityThreshold: (threshold: number) => void;
  setFindingTypeFilter: (types: string[]) => void;

  setBrushedTimeRange: (range: { start: Date | null; end: Date | null }) => void;
  setHighlightedEntities: (entities: string[]) => void;

  // Computed
  getFilteredFindings: () => ResearchFinding[];
  getFilteredSources: () => ResearchSource[];
  getFinancialPerspective: () => ResearchPerspective | undefined;
  extractMoneyFlows: () => void;
  extractStakeholders: () => void;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  session: null,
  isLoading: true,
  error: null,
  activeTab: 'overview',
  selectedEntityId: null,
  selectedFindingId: null,
  timelineRange: { start: null, end: null },
  sourceTypeFilter: [],
  credibilityThreshold: 0,
  findingTypeFilter: [],
  brushedTimeRange: { start: null, end: null },
  highlightedEntities: [],
  moneyFlows: { nodes: [], links: [] },
  stakeholders: [],

  setSession: (session) => {
    set({ session, isLoading: false });
    // Extract derived data
    get().extractMoneyFlows();
    get().extractStakeholders();
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  setActiveTab: (activeTab) => set({ activeTab }),
  selectEntity: (id) => set({ selectedEntityId: id }),
  selectFinding: (id) => set({ selectedFindingId: id }),

  setSourceTypeFilter: (types) => set({ sourceTypeFilter: types }),
  setCredibilityThreshold: (threshold) => set({ credibilityThreshold: threshold }),
  setFindingTypeFilter: (types) => set({ findingTypeFilter: types }),

  setBrushedTimeRange: (range) => set({ brushedTimeRange: range }),
  setHighlightedEntities: (entities) => set({ highlightedEntities: entities }),

  getFilteredFindings: () => {
    const state = get();
    if (!state.session) return [];

    let findings = state.session.findings;

    if (state.findingTypeFilter.length > 0) {
      findings = findings.filter((f) => state.findingTypeFilter.includes(f.finding_type));
    }

    if (state.brushedTimeRange.start || state.brushedTimeRange.end) {
      findings = findings.filter((f) => {
        if (!f.event_date) return true;
        const date = new Date(f.event_date);
        if (state.brushedTimeRange.start && date < state.brushedTimeRange.start) return false;
        if (state.brushedTimeRange.end && date > state.brushedTimeRange.end) return false;
        return true;
      });
    }

    return findings;
  },

  getFilteredSources: () => {
    const state = get();
    if (!state.session) return [];

    let sources = state.session.sources;

    if (state.sourceTypeFilter.length > 0) {
      sources = sources.filter((s) => s.source_type && state.sourceTypeFilter.includes(s.source_type));
    }

    if (state.credibilityThreshold > 0) {
      sources = sources.filter((s) => (s.credibility_score || 0) >= state.credibilityThreshold);
    }

    return sources;
  },

  getFinancialPerspective: () => {
    const state = get();
    if (!state.session) return undefined;
    return state.session.perspectives.find((p) => p.perspective_type === 'financial');
  },

  extractMoneyFlows: () => {
    const state = get();
    if (!state.session) return;

    const financialPerspective = state.session.perspectives.find(
      (p) => p.perspective_type === 'financial'
    );

    if (!financialPerspective?.specialized_data) {
      set({ moneyFlows: { nodes: [], links: [] } });
      return;
    }

    const data = financialPerspective.specialized_data as Record<string, unknown>;
    const flows = (data.flows as Array<{
      from: string;
      to: string;
      amount?: number;
      description?: string;
    }>) || [];

    // Build nodes and links from flows
    const nodesMap = new Map<string, MoneyFlowNode>();
    const links: MoneyFlowLink[] = [];

    flows.forEach((flow, index) => {
      // Add source node
      if (!nodesMap.has(flow.from)) {
        nodesMap.set(flow.from, {
          id: flow.from,
          name: flow.from,
          type: 'source',
        });
      }

      // Add target node
      if (!nodesMap.has(flow.to)) {
        nodesMap.set(flow.to, {
          id: flow.to,
          name: flow.to,
          type: 'destination',
        });
      }

      // Add link
      links.push({
        source: flow.from,
        target: flow.to,
        value: flow.amount || 1,
        description: flow.description,
      });
    });

    set({
      moneyFlows: {
        nodes: Array.from(nodesMap.values()),
        links,
      },
    });
  },

  extractStakeholders: () => {
    const state = get();
    if (!state.session) return;

    const financialPerspective = state.session.perspectives.find(
      (p) => p.perspective_type === 'financial'
    );

    if (!financialPerspective?.specialized_data) {
      set({ stakeholders: [] });
      return;
    }

    const data = financialPerspective.specialized_data as Record<string, unknown>;
    const cuiBono = (data.cui_bono as string[]) || [];

    // Transform cui_bono into stakeholder data
    const stakeholders: StakeholderData[] = cuiBono.map((name, index) => ({
      name,
      benefit: 'positive' as const,
      impact: 1 - index * 0.1, // Decrease impact based on order
      category: 'beneficiary',
      description: `Identified as a potential beneficiary`,
    }));

    set({ stakeholders });
  },
}));
