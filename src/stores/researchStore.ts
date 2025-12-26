import { create } from 'zustand';
import type {
  SessionWithDetails,
  ResearchFinding,
  ResearchSource,
  ResearchPerspective,
} from '@/src/types/research';

export interface Competitor {
  id: string;
  name: string;
  description?: string;
  position: {
    x: number; // Market presence (0-100)
    y: number; // Growth/Innovation (0-100)
  };
  quadrant: 'leader' | 'challenger' | 'niche' | 'laggard';
  strengths: string[];
  weaknesses: string[];
  findings: string[];
}

export interface SWOTItem {
  id: string;
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
  content: string;
  priority: 'high' | 'medium' | 'low';
  findingId?: string;
}

export interface MarketTrend {
  id: string;
  name: string;
  direction: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  description: string;
  findingIds: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  priority: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  findingIds: string[];
}

interface ResearchState {
  // Session data
  session: SessionWithDetails | null;
  isLoading: boolean;
  error: string | null;

  // View state
  activeView: 'overview' | 'landscape' | 'swot' | 'trends' | 'comparison' | 'recommendations';
  selectedCompetitorIds: string[];

  // Extracted data
  competitors: Competitor[];
  swotItems: SWOTItem[];
  marketTrends: MarketTrend[];
  opportunities: Opportunity[];

  // Actions
  setSession: (session: SessionWithDetails) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setActiveView: (view: ResearchState['activeView']) => void;
  toggleCompetitorSelection: (id: string) => void;
  clearCompetitorSelection: () => void;

  // Extraction
  extractCompetitors: () => void;
  extractSWOT: () => void;
  extractTrends: () => void;
  extractOpportunities: () => void;

  // SWOT actions
  addSWOTItem: (item: Omit<SWOTItem, 'id'>) => void;
  updateSWOTItem: (id: string, updates: Partial<SWOTItem>) => void;
  removeSWOTItem: (id: string) => void;
  moveSWOTItem: (id: string, newCategory: SWOTItem['category']) => void;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  session: null,
  isLoading: true,
  error: null,
  activeView: 'overview',
  selectedCompetitorIds: [],
  competitors: [],
  swotItems: [],
  marketTrends: [],
  opportunities: [],

  setSession: (session) => {
    set({ session, isLoading: false });
    // Extract derived data
    get().extractCompetitors();
    get().extractSWOT();
    get().extractTrends();
    get().extractOpportunities();
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  setActiveView: (activeView) => set({ activeView }),
  toggleCompetitorSelection: (id) =>
    set((state) => ({
      selectedCompetitorIds: state.selectedCompetitorIds.includes(id)
        ? state.selectedCompetitorIds.filter((cid) => cid !== id)
        : [...state.selectedCompetitorIds, id],
    })),
  clearCompetitorSelection: () => set({ selectedCompetitorIds: [] }),

  extractCompetitors: () => {
    const state = get();
    if (!state.session) return;

    // Extract competitors from actor findings
    const actorFindings = state.session.findings.filter((f) => f.finding_type === 'actor');
    const competitors: Competitor[] = [];

    actorFindings.forEach((finding, index) => {
      const name = finding.summary || finding.content.split('.')[0];

      // Determine quadrant based on position in list and confidence
      const confidence = finding.confidence_score || 0.5;
      const x = 30 + (confidence * 60) + (Math.random() * 20 - 10);
      const y = 30 + (confidence * 60) + (Math.random() * 20 - 10);

      const quadrant: Competitor['quadrant'] =
        x >= 50 && y >= 50 ? 'leader' :
          x >= 50 && y < 50 ? 'challenger' :
            x < 50 && y >= 50 ? 'niche' : 'laggard';

      competitors.push({
        id: finding.id,
        name: name.slice(0, 50),
        description: finding.content.slice(0, 200),
        position: { x, y },
        quadrant,
        strengths: [],
        weaknesses: [],
        findings: [finding.id],
      });
    });

    set({ competitors: competitors.slice(0, 10) }); // Limit to 10 competitors
  },

  extractSWOT: () => {
    const state = get();
    if (!state.session) return;

    const swotItems: SWOTItem[] = [];

    // Extract from patterns (opportunities/threats)
    state.session.findings
      .filter((f) => f.finding_type === 'pattern')
      .forEach((finding, index) => {
        const isPositive = finding.content.toLowerCase().includes('opportunity') ||
          finding.content.toLowerCase().includes('growth') ||
          finding.content.toLowerCase().includes('advantage');

        swotItems.push({
          id: finding.id,
          category: isPositive ? 'opportunity' : 'threat',
          content: finding.summary || finding.content.slice(0, 150),
          priority: finding.confidence_score && finding.confidence_score >= 0.7 ? 'high' :
            finding.confidence_score && finding.confidence_score >= 0.4 ? 'medium' : 'low',
          findingId: finding.id,
        });
      });

    // Extract from facts (strengths/weaknesses)
    state.session.findings
      .filter((f) => f.finding_type === 'fact' || f.finding_type === 'evidence')
      .slice(0, 10)
      .forEach((finding, index) => {
        const isStrength = finding.content.toLowerCase().includes('advantage') ||
          finding.content.toLowerCase().includes('leading') ||
          finding.content.toLowerCase().includes('strong');

        swotItems.push({
          id: finding.id,
          category: isStrength ? 'strength' : 'weakness',
          content: finding.summary || finding.content.slice(0, 150),
          priority: 'medium',
          findingId: finding.id,
        });
      });

    set({ swotItems: swotItems.slice(0, 20) });
  },

  extractTrends: () => {
    const state = get();
    if (!state.session) return;

    const trends: MarketTrend[] = [];

    // Extract trends from pattern findings
    state.session.findings
      .filter((f) => f.finding_type === 'pattern')
      .forEach((finding) => {
        const direction: MarketTrend['direction'] =
          finding.content.toLowerCase().includes('increasing') ||
            finding.content.toLowerCase().includes('growing') ? 'up' :
            finding.content.toLowerCase().includes('declining') ||
              finding.content.toLowerCase().includes('decreasing') ? 'down' : 'stable';

        trends.push({
          id: finding.id,
          name: finding.summary || finding.content.split('.')[0].slice(0, 50),
          direction,
          impact: finding.confidence_score && finding.confidence_score >= 0.7 ? 'high' :
            finding.confidence_score && finding.confidence_score >= 0.4 ? 'medium' : 'low',
          description: finding.content.slice(0, 200),
          findingIds: [finding.id],
        });
      });

    set({ marketTrends: trends.slice(0, 8) });
  },

  extractOpportunities: () => {
    const state = get();
    if (!state.session) return;

    const opportunities: Opportunity[] = [];

    // Extract from gaps
    state.session.gaps.forEach((gap, index) => {
      opportunities.push({
        id: gap.id,
        title: `Gap: ${gap.description.slice(0, 50)}`,
        description: gap.description,
        priority: gap.priority === 'high' ? 1 : gap.priority === 'medium' ? 2 : 3,
        effort: 'medium',
        impact: gap.priority === 'high' ? 'high' : gap.priority === 'medium' ? 'medium' : 'low',
        findingIds: gap.related_finding_ids || [],
      });
    });

    // Also check for opportunities in perspectives
    const economicPerspective = state.session.perspectives.find(
      (p) => p.perspective_type === 'economic'
    );
    if (economicPerspective?.recommendations) {
      economicPerspective.recommendations.forEach((rec, index) => {
        opportunities.push({
          id: `rec-${index}`,
          title: rec.slice(0, 50),
          description: rec,
          priority: index + 1,
          effort: 'medium',
          impact: 'medium',
          findingIds: [],
        });
      });
    }

    set({ opportunities: opportunities.slice(0, 10) });
  },

  addSWOTItem: (item) =>
    set((state) => ({
      swotItems: [...state.swotItems, { ...item, id: `swot-${Date.now()}` }],
    })),

  updateSWOTItem: (id, updates) =>
    set((state) => ({
      swotItems: state.swotItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeSWOTItem: (id) =>
    set((state) => ({
      swotItems: state.swotItems.filter((item) => item.id !== id),
    })),

  moveSWOTItem: (id, newCategory) =>
    set((state) => ({
      swotItems: state.swotItems.map((item) =>
        item.id === id ? { ...item, category: newCategory } : item
      ),
    })),
}));
