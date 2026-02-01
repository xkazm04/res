import { createClient } from '@supabase/supabase-js';
import type {
  ResearchSession,
  ResearchFinding,
  ResearchSource,
  ResearchPerspective,
  QueryDecomposition,
  SubQuery,
  FindingRelationship,
  ResearchContradiction,
  ResearchGap,
  CausalChain,
  FindingPerspective,
  KnowledgeEntity,
  ClaimRelationship,
  SessionWithDetails,
} from '@/src/types/research';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// SESSION QUERIES
// ============================================

// Get all sessions (lightweight, for map visualization)
export async function getAllSessions(): Promise<ResearchSession[]> {
  const { data, error } = await supabase
    .from('research_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all sessions:', error);
    return [];
  }
  return data || [];
}

// Get session counts by template type
export async function getSessionCountsByTemplate(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('research_sessions')
    .select('template_type');

  if (error) {
    console.error('Error fetching session counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach((s) => {
    counts[s.template_type] = (counts[s.template_type] || 0) + 1;
  });
  return counts;
}

export async function getSession(sessionId: string): Promise<ResearchSession | null> {
  const { data, error } = await supabase
    .from('research_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  return data;
}

export async function getSessionWithDetails(sessionId: string): Promise<SessionWithDetails | null> {
  const [
    sessionResult,
    findingsResult,
    sourcesResult,
    perspectivesResult,
    decompositionResult,
    relationshipsResult,
    contradictionsResult,
    gapsResult,
    chainsResult,
  ] = await Promise.all([
    supabase.from('research_sessions').select('*').eq('id', sessionId).single(),
    supabase.from('research_findings').select('*').eq('session_id', sessionId).order('created_at'),
    supabase.from('research_sources').select('*').eq('session_id', sessionId),
    supabase.from('research_perspectives').select('*').eq('session_id', sessionId),
    supabase.from('query_decompositions').select('*').eq('session_id', sessionId).single(),
    supabase.from('finding_relationships').select('*').eq('session_id', sessionId),
    supabase.from('research_contradictions').select('*').eq('session_id', sessionId),
    supabase.from('research_gaps').select('*').eq('session_id', sessionId).order('priority'),
    supabase.from('causal_chains').select('*').eq('session_id', sessionId),
  ]);

  if (sessionResult.error) {
    console.error('Error fetching session:', sessionResult.error);
    return null;
  }

  let decomposition: (QueryDecomposition & { sub_queries: SubQuery[] }) | undefined;
  if (decompositionResult.data) {
    const { data: subQueries } = await supabase
      .from('sub_queries')
      .select('*')
      .eq('decomposition_id', decompositionResult.data.id)
      .order('batch_order');
    decomposition = {
      ...decompositionResult.data,
      sub_queries: subQueries || [],
    };
  }

  return {
    ...sessionResult.data,
    findings: findingsResult.data || [],
    sources: sourcesResult.data || [],
    perspectives: perspectivesResult.data || [],
    decomposition,
    relationships: relationshipsResult.data || [],
    contradictions: contradictionsResult.data || [],
    gaps: gapsResult.data || [],
    causal_chains: chainsResult.data || [],
  };
}

// ============================================
// FINDINGS QUERIES
// ============================================

export async function getFindings(sessionId: string): Promise<ResearchFinding[]> {
  const { data, error } = await supabase
    .from('research_findings')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at');

  if (error) {
    console.error('Error fetching findings:', error);
    return [];
  }
  return data || [];
}

export async function getFindingWithRelationships(findingId: string) {
  const [findingResult, relationshipsResult, perspectivesResult] = await Promise.all([
    supabase.from('research_findings').select('*').eq('id', findingId).single(),
    supabase
      .from('finding_relationships')
      .select('*')
      .or(`source_finding_id.eq.${findingId},target_finding_id.eq.${findingId}`),
    supabase.from('finding_perspectives').select('*').eq('finding_id', findingId),
  ]);

  return {
    finding: findingResult.data,
    relationships: relationshipsResult.data || [],
    perspectives: perspectivesResult.data || [],
  };
}

// ============================================
// SOURCES QUERIES
// ============================================

export async function getSources(sessionId: string): Promise<ResearchSource[]> {
  const { data, error } = await supabase
    .from('research_sources')
    .select('*')
    .eq('session_id', sessionId)
    .order('credibility_score', { ascending: false });

  if (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
  return data || [];
}

// ============================================
// PERSPECTIVES QUERIES
// ============================================

export async function getPerspectives(sessionId: string): Promise<ResearchPerspective[]> {
  const { data, error } = await supabase
    .from('research_perspectives')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching perspectives:', error);
    return [];
  }
  return data || [];
}

export async function getFindingPerspectives(findingId: string): Promise<FindingPerspective[]> {
  const { data, error } = await supabase
    .from('finding_perspectives')
    .select('*')
    .eq('finding_id', findingId);

  if (error) {
    console.error('Error fetching finding perspectives:', error);
    return [];
  }
  return data || [];
}

// ============================================
// RELATIONSHIPS QUERIES
// ============================================

export async function getRelationships(sessionId: string): Promise<FindingRelationship[]> {
  const { data, error } = await supabase
    .from('finding_relationships')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching relationships:', error);
    return [];
  }
  return data || [];
}

export async function getContradictions(sessionId: string): Promise<ResearchContradiction[]> {
  const { data, error } = await supabase
    .from('research_contradictions')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching contradictions:', error);
    return [];
  }
  return data || [];
}

export async function getCausalChains(sessionId: string): Promise<CausalChain[]> {
  const { data, error } = await supabase
    .from('causal_chains')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching causal chains:', error);
    return [];
  }
  return data || [];
}

// ============================================
// GAPS QUERIES
// ============================================

export async function getGaps(sessionId: string): Promise<ResearchGap[]> {
  const { data, error } = await supabase
    .from('research_gaps')
    .select('*')
    .eq('session_id', sessionId)
    .order('priority');

  if (error) {
    console.error('Error fetching gaps:', error);
    return [];
  }
  return data || [];
}

// ============================================
// ENTITIES QUERIES
// ============================================

export async function getEntitiesForSession(sessionId: string): Promise<KnowledgeEntity[]> {
  // Get all findings for session, then get linked entities
  const { data: findings } = await supabase
    .from('research_findings')
    .select('knowledge_claim_id')
    .eq('session_id', sessionId)
    .not('knowledge_claim_id', 'is', null);

  if (!findings || findings.length === 0) return [];

  const claimIds = findings.map((f) => f.knowledge_claim_id).filter(Boolean);

  const { data: claimEntities } = await supabase
    .from('claim_entities')
    .select('entity_id')
    .in('claim_id', claimIds);

  if (!claimEntities || claimEntities.length === 0) return [];

  const entityIds = [...new Set(claimEntities.map((ce) => ce.entity_id))];

  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('*')
    .in('id', entityIds);

  if (error) {
    console.error('Error fetching entities:', error);
    return [];
  }
  return entities || [];
}

// ============================================
// CLAIM RELATIONSHIPS QUERIES
// ============================================

export async function getClaimRelationships(claimIds: string[]): Promise<ClaimRelationship[]> {
  if (claimIds.length === 0) return [];

  const { data, error } = await supabase
    .from('claim_relationships')
    .select('*')
    .or(`source_claim_id.in.(${claimIds.join(',')}),target_claim_id.in.(${claimIds.join(',')})`);

  if (error) {
    console.error('Error fetching claim relationships:', error);
    return [];
  }
  return data || [];
}

// ============================================
// DECOMPOSITION QUERIES
// ============================================

export async function getDecomposition(sessionId: string): Promise<QueryDecomposition | null> {
  const { data, error } = await supabase
    .from('query_decompositions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching decomposition:', error);
    return null;
  }
  return data;
}

export async function getSubQueries(decompositionId: string): Promise<SubQuery[]> {
  const { data, error } = await supabase
    .from('sub_queries')
    .select('*')
    .eq('decomposition_id', decompositionId)
    .order('batch_order');

  if (error) {
    console.error('Error fetching sub-queries:', error);
    return [];
  }
  return data || [];
}

// ============================================
// WRITE OPERATIONS - Research Persistence
// Uses existing research_sessions, research_findings,
// research_sources, research_perspectives tables
// ============================================

export async function createActorSession(
  session: {
    id: string;
    query: string;
    template: string;
    status: string;
    granularity: string;
    max_searches: number;
    user_email?: string;
    progress_phase?: string;
    progress_percent?: number;
  }
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('research_sessions')
    .insert({
      id: session.id,
      title: `Research: ${session.query.slice(0, 50)}...`,
      query: session.query,
      template_type: session.template,
      status: session.status === 'running' ? 'searching' : session.status,
      parameters: {
        granularity: session.granularity,
        max_searches: session.max_searches,
        user_email: session.user_email,
        progress_phase: session.progress_phase,
        progress_percent: session.progress_percent,
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating research session:', error);
    return null;
  }
  return data;
}

export async function updateActorSession(
  sessionId: string,
  updates: {
    status?: string;
    progress_phase?: string;
    progress_percent?: number;
    error_message?: string;
    completed_at?: string;
  }
): Promise<boolean> {
  // Map status to existing schema values
  const statusMap: Record<string, string> = {
    running: 'searching',
    completed: 'completed',
    failed: 'failed',
  };

  const updateData: Record<string, unknown> = {};

  if (updates.status) {
    updateData.status = statusMap[updates.status] || updates.status;
  }

  if (updates.completed_at) {
    updateData.completed_at = updates.completed_at;
  }

  // Store progress info in parameters JSONB
  if (updates.progress_phase || updates.progress_percent !== undefined || updates.error_message) {
    // First get current parameters
    const { data: current } = await supabase
      .from('research_sessions')
      .select('parameters')
      .eq('id', sessionId)
      .single();

    const currentParams = (current?.parameters as Record<string, unknown>) || {};
    updateData.parameters = {
      ...currentParams,
      ...(updates.progress_phase && { progress_phase: updates.progress_phase }),
      ...(updates.progress_percent !== undefined && { progress_percent: updates.progress_percent }),
      ...(updates.error_message && { error_message: updates.error_message }),
    };
  }

  const { error } = await supabase
    .from('research_sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating research session:', error);
    return false;
  }
  return true;
}

export async function saveActorFindings(
  sessionId: string,
  findings: Array<{
    finding_id: string;
    finding_type: string;
    content: string;
    summary?: string;
    confidence_score: number;
    temporal_context: string;
    extracted_data?: Record<string, unknown>;
  }>
): Promise<boolean> {
  if (findings.length === 0) return true;

  const { error } = await supabase
    .from('research_findings')
    .insert(findings.map(f => ({
      session_id: sessionId,
      finding_type: f.finding_type,
      content: f.content,
      summary: f.summary,
      confidence_score: f.confidence_score,
      temporal_context: f.temporal_context,
      extracted_data: f.extracted_data,
    })));

  if (error) {
    console.error('Error saving research findings:', error);
    return false;
  }
  return true;
}

export async function saveActorSources(
  sessionId: string,
  sources: Array<{
    url: string;
    title: string;
    domain: string;
    snippet?: string;
    credibility_score?: number;
    credibility_label?: string;
  }>
): Promise<boolean> {
  if (sources.length === 0) return true;

  // Generate URL hash for deduplication
  const hashUrl = (url: string) => {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  };

  const { error } = await supabase
    .from('research_sources')
    .insert(sources.map(s => ({
      session_id: sessionId,
      url: s.url,
      url_hash: hashUrl(s.url),
      title: s.title,
      domain: s.domain,
      snippet: s.snippet,
      credibility_score: s.credibility_score,
      credibility_factors: s.credibility_label ? { label: s.credibility_label } : null,
    })));

  if (error) {
    console.error('Error saving research sources:', error);
    return false;
  }
  return true;
}

export async function saveActorPerspectives(
  sessionId: string,
  perspectives: Array<{
    perspective_type: string;
    analysis_text: string;
    key_insights: string[];
    recommendations: string[];
    warnings: string[];
    confidence: number;
  }>
): Promise<boolean> {
  if (perspectives.length === 0) return true;

  // Map custom perspective types to schema-allowed values
  const perspectiveTypeMap: Record<string, string> = {
    forensic_financial: 'financial',
    power_network: 'network',
    psychological_behavioral: 'psychological',
    legal_liability: 'political',
    geopolitical_strategic: 'political',
    institutional_investor: 'financial',
    short_seller: 'financial',
    quantitative_risk: 'financial',
    activist_investor: 'financial',
    macro_strategist: 'economic',
    strategy_consultant: 'economic',
    industry_insider: 'economic',
    litigation_strategist: 'political',
    regulatory_expert: 'political',
  };

  const { error } = await supabase
    .from('research_perspectives')
    .insert(perspectives.map(p => ({
      session_id: sessionId,
      perspective_type: perspectiveTypeMap[p.perspective_type] || 'economic',
      analysis_text: p.analysis_text,
      key_insights: p.key_insights,
      recommendations: p.recommendations,
      warnings: p.warnings,
      confidence: p.confidence,
      specialized_data: {
        original_type: p.perspective_type,
      },
    })));

  if (error) {
    console.error('Error saving research perspectives:', error);
    return false;
  }
  return true;
}

export async function saveActorReport(
  sessionId: string,
  reportMarkdown: string,
  costSummary: {
    total_tokens: number;
    total_cost_usd: number;
  }
): Promise<boolean> {
  // Get current parameters and update with report info
  const { data: current } = await supabase
    .from('research_sessions')
    .select('parameters')
    .eq('id', sessionId)
    .single();

  const currentParams = (current?.parameters as Record<string, unknown>) || {};

  const { error } = await supabase
    .from('research_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      parameters: {
        ...currentParams,
        report_markdown: reportMarkdown,
        total_tokens: costSummary.total_tokens,
        total_cost_usd: costSummary.total_cost_usd,
      },
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error saving research report:', error);
    return false;
  }
  return true;
}

// ============================================
// TOPIC QUERIES (for intermediate categorization)
// ============================================

export interface TopicGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  topic_type?: string;
  parent_id?: string;
  session_count: number;
  finding_count: number;
  entity_count: number;
  sessions?: Array<{
    id: string;
    template_type: string;
    status: string;
  }>;
}

export async function getTopicsWithSessionCounts(): Promise<TopicGroup[]> {
  // Get topics with their linked sessions
  const { data: topics, error } = await supabase
    .from('knowledge_topics')
    .select('*')
    .order('session_count', { ascending: false });

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  // For each topic, get linked sessions
  const topicsWithSessions = await Promise.all(
    (topics || []).map(async (topic) => {
      const { data: sessionLinks } = await supabase
        .from('session_topics')
        .select('session_id')
        .eq('topic_id', topic.id);

      let sessions: Array<{ id: string; template_type: string; status: string }> = [];
      if (sessionLinks && sessionLinks.length > 0) {
        const sessionIds = sessionLinks.map((l) => l.session_id);
        const { data: sessionsData } = await supabase
          .from('research_sessions')
          .select('id, template_type, status')
          .in('id', sessionIds);
        sessions = sessionsData || [];
      }

      return {
        ...topic,
        sessions,
        session_count: sessions.length || topic.session_count || 0,
      } as TopicGroup;
    })
  );

  return topicsWithSessions.filter((t) => t.session_count > 0);
}

export async function getTopicHierarchy(): Promise<TopicGroup[]> {
  const { data, error } = await supabase
    .from('knowledge_topics')
    .select('*')
    .order('path');

  if (error) {
    console.error('Error fetching topic hierarchy:', error);
    return [];
  }
  return (data || []) as TopicGroup[];
}

// ============================================
// ENTITY QUERIES (for intermediate categorization)
// ============================================

export interface EntityGroup {
  id: string;
  canonical_name: string;
  entity_type: string;
  aliases: string[];
  description?: string;
  mention_count: number;
  claim_count: number;
  session_ids: string[];
}

export async function getEntitiesWithSessions(): Promise<EntityGroup[]> {
  // Get entities with high mention counts
  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('*')
    .order('mention_count', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching entities:', error);
    return [];
  }

  // For each entity, find linked sessions via claims
  const entitiesWithSessions = await Promise.all(
    (entities || []).map(async (entity) => {
      // Get claims linked to this entity
      const { data: claimEntities } = await supabase
        .from('claim_entities')
        .select('claim_id')
        .eq('entity_id', entity.id);

      if (!claimEntities || claimEntities.length === 0) {
        return { ...entity, session_ids: [] } as EntityGroup;
      }

      const claimIds = claimEntities.map((ce) => ce.claim_id);

      // Get sessions that originated these claims
      const { data: claims } = await supabase
        .from('knowledge_claims')
        .select('origin_session_id')
        .in('id', claimIds)
        .not('origin_session_id', 'is', null);

      const sessionIds = [...new Set((claims || []).map((c) => c.origin_session_id).filter(Boolean))];

      return {
        ...entity,
        session_ids: sessionIds,
      } as EntityGroup;
    })
  );

  return entitiesWithSessions.filter((e) => e.session_ids.length > 0);
}

export async function getEntitiesByType(entityType: string): Promise<EntityGroup[]> {
  const { data, error } = await supabase
    .from('knowledge_entities')
    .select('*')
    .eq('entity_type', entityType)
    .order('mention_count', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching entities by type:', error);
    return [];
  }
  return (data || []) as EntityGroup[];
}

// ============================================
// FINDING TYPE AGGREGATION
// ============================================

export interface FindingTypeCount {
  finding_type: string;
  count: number;
  avg_confidence: number;
}

export async function getFindingTypeCounts(sessionId?: string): Promise<FindingTypeCount[]> {
  let query = supabase
    .from('research_findings')
    .select('finding_type, confidence_score');

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching finding types:', error);
    return [];
  }

  // Aggregate by finding_type
  const typeMap = new Map<string, { count: number; totalConfidence: number }>();
  (data || []).forEach((f) => {
    const current = typeMap.get(f.finding_type) || { count: 0, totalConfidence: 0 };
    typeMap.set(f.finding_type, {
      count: current.count + 1,
      totalConfidence: current.totalConfidence + (f.confidence_score || 0),
    });
  });

  return Array.from(typeMap.entries()).map(([type, stats]) => ({
    finding_type: type,
    count: stats.count,
    avg_confidence: stats.count > 0 ? stats.totalConfidence / stats.count : 0,
  }));
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToSession(
  sessionId: string,
  onUpdate: (session: ResearchSession) => void
) {
  return supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'research_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new as ResearchSession);
      }
    )
    .subscribe();
}

export function subscribeToFindings(
  sessionId: string,
  onInsert: (finding: ResearchFinding) => void
) {
  return supabase
    .channel(`findings:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'research_findings',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onInsert(payload.new as ResearchFinding);
      }
    )
    .subscribe();
}
