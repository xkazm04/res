import { create } from 'zustand';
import type { ResearchSession, SessionWithDetails } from '@/src/types/research';
import { getAllSessions, getSessionWithDetails } from '@/src/lib/supabase';
import { MOCK_SESSIONS, USE_MOCK_DATA } from '@/src/lib/mockData';

// ============================================
// APP STATE - Unified store for Research Map
// ============================================

interface AppState {
  // Sessions data (for map visualization)
  sessions: ResearchSession[];
  sessionsLoading: boolean;
  sessionsError: string | null;

  // Current selected session (for report modal)
  currentSession: SessionWithDetails | null;
  currentSessionLoading: boolean;
  currentSessionError: string | null;
  isReportModalOpen: boolean;

  // Map navigation state
  mapZoomPath: string[]; // Breadcrumb path: ['root', 'financial', 'topic-1']
  mapSelectedNode: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  setMapZoomPath: (path: string[]) => void;
  setMapSelectedNode: (nodeId: string | null) => void;
  openReportModal: (sessionId: string) => Promise<void>;
  closeReportModal: () => void;
  clearCurrentSession: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,

  currentSession: null,
  currentSessionLoading: false,
  currentSessionError: null,
  isReportModalOpen: false,

  mapZoomPath: ['root'],
  mapSelectedNode: null,

  // Fetch all sessions for the map
  fetchSessions: async () => {
    set({ sessionsLoading: true, sessionsError: null });

    try {
      // Use mock data if explicitly enabled
      if (USE_MOCK_DATA) {
        set({ sessions: MOCK_SESSIONS, sessionsLoading: false });
        return;
      }

      const sessions = await getAllSessions();

      // Fall back to mock data if no real sessions
      if (sessions.length === 0) {
        console.log('No real sessions found, using mock data for demo');
        set({ sessions: MOCK_SESSIONS, sessionsLoading: false });
        return;
      }

      set({ sessions, sessionsLoading: false });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Fall back to mock data on error for demo purposes
      console.log('Database error, using mock data for demo');
      set({ sessions: MOCK_SESSIONS, sessionsLoading: false });
    }
  },

  // Fetch a single session with full details
  fetchSession: async (id: string) => {
    set({ currentSessionLoading: true, currentSessionError: null });

    try {
      const session = await getSessionWithDetails(id);
      if (session) {
        set({ currentSession: session, currentSessionLoading: false });
      } else {
        set({
          currentSessionError: 'Session not found',
          currentSessionLoading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      set({
        currentSessionError: error instanceof Error ? error.message : 'Failed to fetch session',
        currentSessionLoading: false,
      });
    }
  },

  // Map navigation
  setMapZoomPath: (path: string[]) => {
    set({ mapZoomPath: path });
  },

  setMapSelectedNode: (nodeId: string | null) => {
    set({ mapSelectedNode: nodeId });
  },

  // Report modal
  openReportModal: async (sessionId: string) => {
    set({ isReportModalOpen: true, currentSessionLoading: true });
    await get().fetchSession(sessionId);
  },

  closeReportModal: () => {
    set({ isReportModalOpen: false });
  },

  clearCurrentSession: () => {
    set({
      currentSession: null,
      currentSessionError: null,
      isReportModalOpen: false,
    });
  },
}));

// ============================================
// DERIVED DATA HELPERS
// ============================================

// Group sessions by template type
export function groupSessionsByTemplate(sessions: ResearchSession[]): Record<string, ResearchSession[]> {
  return sessions.reduce((acc, session) => {
    const template = session.template_type || 'unknown';
    if (!acc[template]) {
      acc[template] = [];
    }
    acc[template].push(session);
    return acc;
  }, {} as Record<string, ResearchSession[]>);
}

// Get template display name
export function getTemplateDisplayName(template: string): string {
  const displayNames: Record<string, string> = {
    investigative: 'Investigative',
    financial: 'Financial',
    competitive: 'Competitive',
    tech_market: 'Tech Market',
    legal: 'Legal',
    due_diligence: 'Due Diligence',
    contract: 'Contract',
    purchase_decision: 'Purchase Decision',
    reputation: 'Reputation',
    understanding: 'Understanding',
  };
  return displayNames[template] || template.replace(/_/g, ' ');
}

// Get template color
export function getTemplateColor(template: string): string {
  const colors: Record<string, string> = {
    investigative: '#E03131',
    financial: '#228BE6',
    competitive: '#7950F2',
    tech_market: '#2F9E44',
    legal: '#1864AB',
    due_diligence: '#F59F00',
    contract: '#862E9C',
    purchase_decision: '#E8590C',
    reputation: '#C2255C',
    understanding: '#0B7285',
  };
  return colors[template] || '#8A8987';
}

// Extract topic from query (simple heuristic)
export function extractTopicFromQuery(query: string): string {
  // Remove common research prefixes
  const cleaned = query
    .replace(/^(research|analyze|investigate|understand|compare)\s+/i, '')
    .replace(/\s+(market|analysis|report|overview)$/i, '');

  // Truncate to reasonable length
  if (cleaned.length > 50) {
    return cleaned.substring(0, 47) + '...';
  }
  return cleaned;
}

// Calculate statistics for sessions
export function calculateSessionStats(sessions: ResearchSession[]) {
  const totalSessions = sessions.length;
  const totalFindings = sessions.reduce((sum, s) => sum + (s.claim_count || 0), 0);
  const totalSources = sessions.reduce((sum, s) => sum + (s.source_count || 0), 0);
  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  const byTemplate = groupSessionsByTemplate(sessions);
  const templateCounts = Object.entries(byTemplate).map(([template, items]) => ({
    template,
    count: items.length,
    color: getTemplateColor(template),
  }));

  return {
    totalSessions,
    totalFindings,
    totalSources,
    completedSessions,
    templateCounts,
  };
}
