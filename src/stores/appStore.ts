import { create } from 'zustand';
import type { ResearchSession, SessionWithDetails } from '@/src/types/research';
import { MOCK_SESSIONS, USE_MOCK_DATA } from '@/src/lib/mockData';
import {
  getSessionCache,
  type AggregatesData,
  type TemplateData,
  type TopicData,
  type SessionSummary,
} from '@/src/lib/sessionCache';
import { getSessionIndex } from '@/src/lib/sessionIndex';

// ============================================
// APP STATE - Unified store for Research Map
// ============================================

// Topic type with sessions for intermediate categorization
export interface TopicWithSessions {
  id: string;
  name: string;
  slug: string;
  description?: string;
  topic_type?: string;
  parent_id?: string;
  session_count: number;
  finding_count: number;
  entity_count: number;
  sessions: Array<{
    id: string;
    title: string;
    template_type: string;
    status: string;
    claim_count: number;
    source_count: number;
  }>;
  children?: TopicWithSessions[];
}

// Pagination state for infinite loading
interface PaginationState {
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
}

interface AppState {
  // Sessions data (for map visualization)
  sessions: ResearchSession[];
  sessionsLoading: boolean;
  sessionsError: string | null;

  // Aggregates for initial fast load
  aggregates: AggregatesData | null;
  aggregatesLoading: boolean;

  // Pagination state per context
  sessionsPagination: PaginationState;
  templatePagination: Record<string, PaginationState>;
  topicPagination: Record<string, PaginationState>;

  // Topics data (for intermediate categorization)
  topics: TopicWithSessions[];
  topicsLoading: boolean;
  topicsError: string | null;

  // Current selected session (for report modal)
  currentSession: SessionWithDetails | null;
  currentSessionLoading: boolean;
  currentSessionError: string | null;
  isReportModalOpen: boolean;

  // Map navigation state
  mapZoomPath: string[]; // Breadcrumb path: ['root', 'financial', 'topic-1']
  mapSelectedNode: string | null;

  // Actions - Basic
  fetchSessions: () => Promise<void>;
  fetchTopics: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  setMapZoomPath: (path: string[]) => void;
  setMapSelectedNode: (nodeId: string | null) => void;
  openReportModal: (sessionId: string) => Promise<void>;
  closeReportModal: () => void;
  clearCurrentSession: () => void;

  // Actions - Scalable Data Loading
  fetchAggregates: () => Promise<void>;
  fetchSessionsByTemplate: (template: string, loadMore?: boolean) => Promise<void>;
  fetchSessionsByTopic: (topicId: string, loadMore?: boolean) => Promise<void>;
  loadMoreSessions: () => Promise<void>;
  searchSessions: (query: string) => SessionSummary[];
  invalidateCache: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,

  aggregates: null,
  aggregatesLoading: false,

  sessionsPagination: { cursor: null, hasMore: true, loading: false },
  templatePagination: {},
  topicPagination: {},

  topics: [],
  topicsLoading: false,
  topicsError: null,

  currentSession: null,
  currentSessionLoading: false,
  currentSessionError: null,
  isReportModalOpen: false,

  mapZoomPath: ['root'],
  mapSelectedNode: null,

  // Fetch aggregates for fast initial map render
  fetchAggregates: async () => {
    const cache = getSessionCache();

    // Check cache first
    const cached = cache.getAggregates();
    if (cached) {
      set({ aggregates: cached, aggregatesLoading: false });
      return;
    }

    set({ aggregatesLoading: true });

    try {
      const response = await fetch('/api/sessions/aggregates');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AggregatesData = await response.json();
      cache.setAggregates(data);
      set({ aggregates: data, aggregatesLoading: false });
    } catch (error) {
      console.error('Error fetching aggregates:', error);
      set({ aggregatesLoading: false });
    }
  },

  // Fetch all sessions for the map via API route (with pagination)
  fetchSessions: async () => {
    const { sessionsPagination } = get();
    if (sessionsPagination.loading) return;

    set({
      sessionsLoading: true,
      sessionsError: null,
      sessionsPagination: { ...sessionsPagination, loading: true },
    });

    try {
      // Use mock data if explicitly enabled
      if (USE_MOCK_DATA) {
        set({
          sessions: MOCK_SESSIONS,
          sessionsLoading: false,
          sessionsPagination: { cursor: null, hasMore: false, loading: false },
        });
        return;
      }

      const response = await fetch('/api/sessions?limit=50');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const sessions: ResearchSession[] = data.sessions || [];

      // Fall back to mock data if no real sessions
      if (sessions.length === 0) {
        console.log('No real sessions found, using mock data for demo');
        set({
          sessions: MOCK_SESSIONS,
          sessionsLoading: false,
          sessionsPagination: { cursor: null, hasMore: false, loading: false },
        });
        return;
      }

      // Add to session index for search
      const index = getSessionIndex();
      index.addSessions(sessions.map(s => ({
        id: s.id,
        title: s.title,
        query: s.query,
        template_type: s.template_type,
        status: s.status,
        primary_topic_id: s.primary_topic_id,
        claim_count: s.claim_count,
        source_count: s.source_count,
        created_at: s.created_at,
      })));

      set({
        sessions,
        sessionsLoading: false,
        sessionsPagination: {
          cursor: data.nextCursor,
          hasMore: data.hasMore,
          loading: false,
        },
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Fall back to mock data on error for demo purposes
      console.log('Database error, using mock data for demo');
      set({
        sessions: MOCK_SESSIONS,
        sessionsLoading: false,
        sessionsPagination: { cursor: null, hasMore: false, loading: false },
      });
    }
  },

  // Load more sessions (pagination)
  loadMoreSessions: async () => {
    const { sessions, sessionsPagination } = get();
    if (!sessionsPagination.hasMore || sessionsPagination.loading) return;

    set({ sessionsPagination: { ...sessionsPagination, loading: true } });

    try {
      const url = sessionsPagination.cursor
        ? `/api/sessions?cursor=${sessionsPagination.cursor}&limit=50`
        : '/api/sessions?limit=50';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newSessions: ResearchSession[] = data.sessions || [];

      // Add to session index
      const index = getSessionIndex();
      index.addSessions(newSessions.map(s => ({
        id: s.id,
        title: s.title,
        query: s.query,
        template_type: s.template_type,
        status: s.status,
        primary_topic_id: s.primary_topic_id,
        claim_count: s.claim_count,
        source_count: s.source_count,
        created_at: s.created_at,
      })));

      set({
        sessions: [...sessions, ...newSessions],
        sessionsPagination: {
          cursor: data.nextCursor,
          hasMore: data.hasMore,
          loading: false,
        },
      });
    } catch (error) {
      console.error('Error loading more sessions:', error);
      set({ sessionsPagination: { ...sessionsPagination, loading: false } });
    }
  },

  // Fetch sessions by template (for drill-down)
  fetchSessionsByTemplate: async (template: string, loadMore = false) => {
    const cache = getSessionCache();
    const { templatePagination } = get();

    // Check cache first (if not loading more)
    if (!loadMore) {
      const cached = cache.getTemplateData(template);
      if (cached) {
        // Add to index if not already
        const index = getSessionIndex();
        index.addSessions(cached.sessions);
        return;
      }
    }

    const pagination = templatePagination[template] || { cursor: null, hasMore: true, loading: false };
    if (pagination.loading || (!loadMore && cache.hasTemplateData(template))) return;

    set({
      templatePagination: {
        ...templatePagination,
        [template]: { ...pagination, loading: true },
      },
    });

    try {
      const cursor = loadMore ? pagination.cursor : null;
      const url = cursor
        ? `/api/sessions/by-template/${template}?cursor=${cursor}&limit=50`
        : `/api/sessions/by-template/${template}?limit=50`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add to index
      const index = getSessionIndex();
      index.addSessions(data.sessions);

      if (loadMore) {
        cache.appendTemplateData(template, data.sessions, data.nextCursor, data.hasMore);
      } else {
        cache.setTemplateData(template, {
          sessions: data.sessions,
          topics: data.topics || [],
          cursor: data.nextCursor,
          hasMore: data.hasMore,
          totalCount: data.totalCount,
          fetchedAt: Date.now(),
        });
      }

      set({
        templatePagination: {
          ...templatePagination,
          [template]: {
            cursor: data.nextCursor,
            hasMore: data.hasMore,
            loading: false,
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching sessions for template ${template}:`, error);
      set({
        templatePagination: {
          ...templatePagination,
          [template]: { ...pagination, loading: false },
        },
      });
    }
  },

  // Fetch sessions by topic (for drill-down)
  fetchSessionsByTopic: async (topicId: string, loadMore = false) => {
    const cache = getSessionCache();
    const { topicPagination } = get();

    // Check cache first (if not loading more)
    if (!loadMore) {
      const cached = cache.getTopicData(topicId);
      if (cached) {
        const index = getSessionIndex();
        index.addSessions(cached.sessions);
        return;
      }
    }

    const pagination = topicPagination[topicId] || { cursor: null, hasMore: true, loading: false };
    if (pagination.loading || (!loadMore && cache.hasTopicData(topicId))) return;

    set({
      topicPagination: {
        ...topicPagination,
        [topicId]: { ...pagination, loading: true },
      },
    });

    try {
      const cursor = loadMore ? pagination.cursor : null;
      const url = cursor
        ? `/api/sessions/by-topic/${topicId}?cursor=${cursor}&limit=50`
        : `/api/sessions/by-topic/${topicId}?limit=50`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add to index
      const index = getSessionIndex();
      index.addSessions(data.sessions);

      if (loadMore) {
        cache.appendTopicData(topicId, data.sessions, data.nextCursor, data.hasMore);
      } else {
        cache.setTopicData(topicId, {
          sessions: data.sessions,
          cursor: data.nextCursor,
          hasMore: data.hasMore,
          totalCount: data.totalCount,
          fetchedAt: Date.now(),
        });
      }

      set({
        topicPagination: {
          ...topicPagination,
          [topicId]: {
            cursor: data.nextCursor,
            hasMore: data.hasMore,
            loading: false,
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching sessions for topic ${topicId}:`, error);
      set({
        topicPagination: {
          ...topicPagination,
          [topicId]: { ...pagination, loading: false },
        },
      });
    }
  },

  // Search sessions using the index
  searchSessions: (query: string): SessionSummary[] => {
    const index = getSessionIndex();
    return index.search(query, { limit: 50 });
  },

  // Invalidate all caches
  invalidateCache: () => {
    const cache = getSessionCache();
    cache.clearAll();

    const index = getSessionIndex();
    index.clear();

    set({
      aggregates: null,
      sessionsPagination: { cursor: null, hasMore: true, loading: false },
      templatePagination: {},
      topicPagination: {},
    });
  },

  // Fetch all topics for intermediate categorization
  fetchTopics: async () => {
    set({ topicsLoading: true, topicsError: null });

    try {
      const response = await fetch('/api/topics');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const topics: TopicWithSessions[] = data.topics || [];

      set({ topics, topicsLoading: false });
    } catch (error) {
      console.error('Error fetching topics:', error);
      set({
        topicsError: error instanceof Error ? error.message : 'Failed to fetch topics',
        topicsLoading: false,
        topics: [],
      });
    }
  },

  // Fetch a single session with full details via API route
  fetchSession: async (id: string) => {
    set({ currentSessionLoading: true, currentSessionError: null });

    try {
      const response = await fetch(`/api/sessions/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          set({
            currentSessionError: 'Session not found',
            currentSessionLoading: false,
          });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const session: SessionWithDetails = await response.json();
      set({ currentSession: session, currentSessionLoading: false });
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

// ============================================
// TOPIC-BASED GROUPING HELPERS
// ============================================

// Group sessions by topic within a template
export function groupSessionsByTopic(
  sessions: ResearchSession[],
  topics: TopicWithSessions[]
): Record<string, { topic: TopicWithSessions; sessions: ResearchSession[] }> {
  const result: Record<string, { topic: TopicWithSessions; sessions: ResearchSession[] }> = {};

  // Create a map of session_id to topic
  const sessionToTopic = new Map<string, TopicWithSessions>();
  topics.forEach(topic => {
    topic.sessions?.forEach(s => {
      sessionToTopic.set(s.id, topic);
    });
  });

  // Group sessions
  sessions.forEach(session => {
    const topic = sessionToTopic.get(session.id);
    if (topic) {
      if (!result[topic.id]) {
        result[topic.id] = { topic, sessions: [] };
      }
      result[topic.id].sessions.push(session);
    }
  });

  return result;
}

// Get topics that belong to a specific template
export function getTopicsForTemplate(
  template: string,
  topics: TopicWithSessions[]
): TopicWithSessions[] {
  return topics.filter(topic =>
    topic.sessions?.some(s => s.template_type === template)
  );
}

// Get sessions without a topic (uncategorized)
export function getUncategorizedSessions(
  sessions: ResearchSession[],
  topics: TopicWithSessions[]
): ResearchSession[] {
  const categorizedIds = new Set<string>();
  topics.forEach(topic => {
    topic.sessions?.forEach(s => categorizedIds.add(s.id));
  });

  return sessions.filter(s => !categorizedIds.has(s.id));
}

// Get finding type counts for display
export function getFindingTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    fact: 'check-circle',
    claim: 'message-circle',
    event: 'calendar',
    actor: 'user',
    relationship: 'link',
    pattern: 'trending-up',
    gap: 'alert-circle',
    evidence: 'file-text',
  };
  return icons[type] || 'circle';
}

export function getFindingTypeColor(type: string): string {
  const colors: Record<string, string> = {
    fact: '#2563EB',
    claim: '#7C3AED',
    event: '#059669',
    actor: '#DC2626',
    relationship: '#D97706',
    pattern: '#0891B2',
    gap: '#6B7280',
    evidence: '#16A34A',
  };
  return colors[type] || '#6B7280';
}
