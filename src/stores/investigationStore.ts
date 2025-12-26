import { create } from 'zustand';
import type {
  SessionWithDetails,
  ResearchFinding,
  ResearchSource,
  ResearchPerspective,
  FindingRelationship,
  ResearchContradiction,
  ResearchGap,
  KnowledgeEntity,
} from '@/src/types/research';

interface CardPosition {
  id: string;
  x: number;
  y: number;
  pinned: boolean;
  rotation: number;
}

interface InvestigationState {
  // Session data
  session: SessionWithDetails | null;
  isLoading: boolean;
  error: string | null;

  // Card positions on the board
  cardPositions: Map<string, CardPosition>;

  // Selection state
  selectedFindingId: string | null;
  selectedEntityId: string | null;
  hoveredFindingId: string | null;

  // View state
  zoom: number;
  panOffset: { x: number; y: number };
  showTimeline: boolean;
  showEntities: boolean;
  showPerspectives: boolean;
  showContradictions: boolean;
  showGaps: boolean;

  // Filters
  findingTypeFilter: string[];
  dateRangeFilter: { start: string | null; end: string | null };
  perspectiveFilter: string[];

  // Connection thread colors
  threadColors: Record<string, string>;

  // Actions
  setSession: (session: SessionWithDetails) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Card actions
  setCardPosition: (id: string, x: number, y: number) => void;
  setCardPinned: (id: string, pinned: boolean) => void;
  setCardRotation: (id: string, rotation: number) => void;
  initializeCardPositions: (findings: ResearchFinding[]) => void;

  // Selection actions
  selectFinding: (id: string | null) => void;
  selectEntity: (id: string | null) => void;
  setHoveredFinding: (id: string | null) => void;

  // View actions
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  toggleTimeline: () => void;
  toggleEntities: () => void;
  togglePerspectives: () => void;
  toggleContradictions: () => void;
  toggleGaps: () => void;

  // Filter actions
  setFindingTypeFilter: (types: string[]) => void;
  setDateRangeFilter: (range: { start: string | null; end: string | null }) => void;
  setPerspectiveFilter: (perspectives: string[]) => void;
  clearFilters: () => void;

  // Computed getters
  getFilteredFindings: () => ResearchFinding[];
  getRelationshipsForFinding: (findingId: string) => FindingRelationship[];
  getContradictionsForFinding: (findingId: string) => ResearchContradiction[];
}

// Helper to generate initial card positions in a spiral layout
function generateSpiralPositions(count: number, centerX: number, centerY: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const spacing = 280;
  let angle = 0;
  let radius = 0;

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      positions.push({ x: centerX, y: centerY });
    } else {
      angle += 0.8;
      radius = spacing * Math.sqrt(i) * 0.5;
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  }
  return positions;
}

// Helper to generate slight random rotation
function randomRotation(): number {
  return (Math.random() - 0.5) * 6; // -3 to +3 degrees
}

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  // Initial state
  session: null,
  isLoading: true,
  error: null,
  cardPositions: new Map(),
  selectedFindingId: null,
  selectedEntityId: null,
  hoveredFindingId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showTimeline: true,
  showEntities: true,
  showPerspectives: false,
  showContradictions: true,
  showGaps: true,
  findingTypeFilter: [],
  dateRangeFilter: { start: null, end: null },
  perspectiveFilter: [],
  threadColors: {
    causes: '#ef4444',
    supports: '#22c55e',
    contradicts: '#f97316',
    expands: '#3b82f6',
    precedes: '#eab308',
    involves: '#8b5cf6',
  },

  // Session actions
  setSession: (session) => set({ session, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  // Card actions
  setCardPosition: (id, x, y) =>
    set((state) => {
      const newPositions = new Map(state.cardPositions);
      const existing = newPositions.get(id) || { id, x: 0, y: 0, pinned: false, rotation: 0 };
      newPositions.set(id, { ...existing, x, y });
      return { cardPositions: newPositions };
    }),

  setCardPinned: (id, pinned) =>
    set((state) => {
      const newPositions = new Map(state.cardPositions);
      const existing = newPositions.get(id);
      if (existing) {
        newPositions.set(id, { ...existing, pinned });
      }
      return { cardPositions: newPositions };
    }),

  setCardRotation: (id, rotation) =>
    set((state) => {
      const newPositions = new Map(state.cardPositions);
      const existing = newPositions.get(id);
      if (existing) {
        newPositions.set(id, { ...existing, rotation });
      }
      return { cardPositions: newPositions };
    }),

  initializeCardPositions: (findings) =>
    set(() => {
      const positions = generateSpiralPositions(findings.length, 600, 400);
      const newPositions = new Map<string, CardPosition>();
      findings.forEach((finding, index) => {
        newPositions.set(finding.id, {
          id: finding.id,
          x: positions[index]?.x || 600,
          y: positions[index]?.y || 400,
          pinned: false,
          rotation: randomRotation(),
        });
      });
      return { cardPositions: newPositions };
    }),

  // Selection actions
  selectFinding: (id) => set({ selectedFindingId: id }),
  selectEntity: (id) => set({ selectedEntityId: id }),
  setHoveredFinding: (id) => set({ hoveredFindingId: id }),

  // View actions
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  toggleTimeline: () => set((state) => ({ showTimeline: !state.showTimeline })),
  toggleEntities: () => set((state) => ({ showEntities: !state.showEntities })),
  togglePerspectives: () => set((state) => ({ showPerspectives: !state.showPerspectives })),
  toggleContradictions: () => set((state) => ({ showContradictions: !state.showContradictions })),
  toggleGaps: () => set((state) => ({ showGaps: !state.showGaps })),

  // Filter actions
  setFindingTypeFilter: (types) => set({ findingTypeFilter: types }),
  setDateRangeFilter: (range) => set({ dateRangeFilter: range }),
  setPerspectiveFilter: (perspectives) => set({ perspectiveFilter: perspectives }),
  clearFilters: () =>
    set({
      findingTypeFilter: [],
      dateRangeFilter: { start: null, end: null },
      perspectiveFilter: [],
    }),

  // Computed getters
  getFilteredFindings: () => {
    const state = get();
    if (!state.session) return [];

    let findings = state.session.findings;

    // Filter by type
    if (state.findingTypeFilter.length > 0) {
      findings = findings.filter((f) => state.findingTypeFilter.includes(f.finding_type));
    }

    // Filter by date range
    if (state.dateRangeFilter.start || state.dateRangeFilter.end) {
      findings = findings.filter((f) => {
        if (!f.event_date) return true;
        const date = new Date(f.event_date);
        if (state.dateRangeFilter.start && date < new Date(state.dateRangeFilter.start)) return false;
        if (state.dateRangeFilter.end && date > new Date(state.dateRangeFilter.end)) return false;
        return true;
      });
    }

    return findings;
  },

  getRelationshipsForFinding: (findingId) => {
    const state = get();
    if (!state.session) return [];
    return state.session.relationships.filter(
      (r) => r.source_finding_id === findingId || r.target_finding_id === findingId
    );
  },

  getContradictionsForFinding: (findingId) => {
    const state = get();
    if (!state.session) return [];
    return state.session.contradictions.filter(
      (c) => c.finding_id_1 === findingId || c.finding_id_2 === findingId
    );
  },
}));
