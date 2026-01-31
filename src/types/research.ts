// ============================================
// Research Intelligence System Types
// Matching Supabase schema from backend
// ============================================

// ============================================
// ENUMS
// ============================================

export type SessionStatus = 'active' | 'searching' | 'analyzing' | 'completed' | 'paused' | 'failed';

export type FindingType = 'fact' | 'claim' | 'event' | 'actor' | 'relationship' | 'pattern' | 'gap' | 'evidence';

export type ClaimType = 'fact' | 'event' | 'relationship' | 'pattern' | 'prediction' | 'actor' | 'evidence' | 'gap';

export type EntityType = 'person' | 'organization' | 'location' | 'product' | 'concept' | 'event';

export type RelationshipType =
  | 'causes'
  | 'supports'
  | 'contradicts'
  | 'expands'
  | 'supersedes'
  | 'related_to'
  | 'part_of'
  | 'precedes'
  | 'follows'
  | 'enables'
  | 'prevents'
  | 'involves';

export type PerspectiveType =
  | 'historical'
  | 'political'
  | 'economic'
  | 'psychological'
  | 'military'
  | 'social'
  | 'technological'
  | 'financial'
  | 'journalist'
  | 'conspirator'
  | 'network';

export type SourceType = 'news' | 'academic' | 'government' | 'corporate' | 'blog' | 'social' | 'wiki' | 'unknown';

export type VerificationStatus = 'unverified' | 'corroborated' | 'disputed' | 'verified' | 'retracted';

export type TemporalContext = 'historical' | 'current' | 'ongoing' | 'predicted' | 'past' | 'present' | 'prediction';

export type DecompositionStrategy = 'temporal' | 'thematic' | 'actor' | 'hybrid' | 'none';

export type CompositionRole = 'background' | 'primary' | 'synthesis' | 'equal';

export type GapType = 'temporal' | 'actor' | 'topic' | 'evidence' | 'geographic';

export type GapPriority = 'high' | 'medium' | 'low';

export type TopicType = 'domain' | 'event' | 'entity' | 'concept' | 'region' | 'timeperiod';

export type EntityRole = 'subject' | 'object' | 'actor' | 'target' | 'location' | 'mentioned' | 'source' | 'beneficiary';

// ============================================
// CORE ENTITIES
// ============================================

export interface ResearchSession {
  id: string;
  user_id?: string;
  workspace_id: string;
  title: string;
  query: string;
  template_type: string;
  status: SessionStatus;
  primary_topic_id?: string;
  topic_ids: string[];
  parameters: Record<string, unknown>;
  claim_count: number;
  source_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ResearchFinding {
  id: string;
  session_id: string;
  finding_type: FindingType;
  content: string;
  summary?: string;
  perspective?: string;
  confidence_score?: number;
  supporting_sources: string[];
  temporal_context?: TemporalContext;
  event_date?: string;
  date_range_start?: string;
  date_range_end?: string;
  related_findings: string[];
  contradicts: string[];
  knowledge_claim_id?: string;
  is_promoted: boolean;
  promotion_type?: string;
  sub_query_id?: string;
  decomposition_context?: string;
  extracted_data?: Record<string, unknown>;
  created_at: string;
}

export interface ResearchSource {
  id: string;
  query_id?: string;
  session_id?: string;
  is_global: boolean;
  url: string;
  url_hash: string;
  title?: string;
  domain?: string;
  snippet?: string;
  full_content?: string;
  credibility_score?: number;
  credibility_factors?: Record<string, unknown>;
  source_type?: SourceType;
  discovered_at: string;
  content_date?: string;
  last_verified_at?: string;
  citation_count: number;
}

export interface ResearchPerspective {
  id: string;
  session_id: string;
  perspective_type: PerspectiveType;
  analysis_text: string;
  key_insights: string[];
  confidence?: number;
  findings_analyzed: string[];
  sources_cited: string[];
  recommendations: string[];
  warnings: string[];
  specialized_data?: PerspectiveSpecializedData;
  created_at: string;
}

// ============================================
// KNOWLEDGE GRAPH
// ============================================

export interface KnowledgeTopic {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  topic_type?: TopicType;
  icon?: string;
  color?: string;
  finding_count: number;
  entity_count: number;
  session_count: number;
  last_activity_at?: string;
  path: string[];
  depth: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntity {
  id: string;
  canonical_name: string;
  entity_type: EntityType;
  aliases: string[];
  name_hash: string;
  description?: string;
  profile_data: Record<string, unknown>;
  image_url?: string;
  external_ids: Record<string, string>;
  mention_count: number;
  claim_count: number;
  is_verified: boolean;
  verified_by_user_id?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeClaim {
  id: string;
  claim_type: ClaimType;
  content: string;
  summary?: string;
  content_hash: string;
  topic_id?: string;
  tags: string[];
  confidence_score: number;
  verification_status: VerificationStatus;
  corroboration_count: number;
  temporal_context?: TemporalContext;
  event_date?: string;
  date_range_start?: string;
  date_range_end?: string;
  visibility: 'public' | 'workspace' | 'private';
  created_by_user_id?: string;
  workspace_id: string;
  version: number;
  superseded_by?: string;
  is_current: boolean;
  origin_session_id?: string;
  extracted_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClaimRelationship {
  id: string;
  source_claim_id: string;
  target_claim_id: string;
  relationship_type: RelationshipType;
  strength: number;
  description?: string;
  bidirectional: boolean;
  created_by_session_id?: string;
  created_by_user_id?: string;
  created_at: string;
}

export interface ClaimEntity {
  id: string;
  claim_id: string;
  entity_id: string;
  role?: EntityRole;
  context_snippet?: string;
  sentiment?: number;
  created_at: string;
}

// ============================================
// RESEARCH ENHANCEMENTS
// ============================================

export interface QueryDecomposition {
  id: string;
  session_id?: string;
  original_query: string;
  decomposition_strategy: DecompositionStrategy;
  needs_decomposition: boolean;
  detected_themes: string[];
  detected_actors: string[];
  date_range_years?: number;
  decomposition_reasoning?: string;
  created_at: string;
}

export interface SubQuery {
  id: string;
  decomposition_id?: string;
  sub_query_id: string;
  query_text: string;
  batch_order: number;
  depends_on: string[];
  focus_theme?: string;
  focus_actors: string[];
  composition_role?: CompositionRole;
  date_start?: string;
  date_end?: string;
  executed_at?: string;
  result_finding_count?: number;
  result_source_count?: number;
  created_at: string;
}

export interface FindingRelationship {
  id: string;
  session_id?: string;
  source_finding_id?: string;
  target_finding_id?: string;
  relationship_type: RelationshipType;
  strength: number;
  description?: string;
  created_at: string;
}

export interface ResearchContradiction {
  id: string;
  session_id?: string;
  finding_id_1?: string;
  finding_id_2?: string;
  claim_1: string;
  claim_2: string;
  source_1?: string;
  source_2?: string;
  significance?: string;
  resolution_hint?: string;
  created_at: string;
}

export interface ResearchGap {
  id: string;
  session_id?: string;
  gap_type: GapType;
  description: string;
  priority: GapPriority;
  suggested_queries: string[];
  related_finding_ids: string[];
  gap_start?: string;
  gap_end?: string;
  missing_actor?: string;
  created_at: string;
}

export interface CausalChain {
  id: string;
  session_id?: string;
  finding_ids: string[];
  descriptions: string[];
  created_at: string;
}

export interface FindingPerspective {
  id: string;
  session_id?: string;
  finding_id?: string;
  perspective_type: PerspectiveType;
  analysis_data: PerspectiveAnalysisData;
  created_at: string;
}

// ============================================
// SPECIALIZED DATA STRUCTURES
// ============================================

export interface PerspectiveSpecializedData {
  // Metadata
  original_type?: string;
  // Historical
  parallels?: string[];
  patterns?: string[];
  consequences?: string[];
  // Financial
  cui_bono?: string[];
  mechanisms?: string[];
  flows?: MoneyFlow[];
  sanctions?: string[];
  // Journalist
  contradictions?: string[];
  propaganda?: string[];
  questions?: string[];
  // Conspirator
  theory?: string;
  probability?: number;
  evidence?: string[];
  // Network
  relationships?: ActorRelationship[];
  intermediaries?: string[];
  network_patterns?: string[];
}

export interface PerspectiveAnalysisData {
  // Historical
  historical_context?: string;
  precedents?: string[];
  patterns?: string[];
  key_insight?: string;
  // Financial
  economic_context?: string;
  beneficiaries?: string[];
  follow_the_money?: string;
  // Journalist
  source_assessment?: string;
  red_flags?: string[];
  questions?: string[];
  // Conspirator
  alternative_explanation?: string;
  probability?: number;
  supporting_evidence?: string[];
  // Network
  actor_role?: string;
  connections?: string[];
  power_dynamics?: string;
}

export interface MoneyFlow {
  from: string;
  to: string;
  amount?: number;
  currency?: string;
  description?: string;
  date?: string;
}

export interface ActorRelationship {
  source: string;
  target: string;
  type: string;
  strength?: number;
  description?: string;
}

// ============================================
// QUERIES & SOURCES
// ============================================

export interface ResearchQuery {
  id: string;
  session_id: string;
  query_text: string;
  query_purpose?: string;
  query_round: number;
  executed_at: string;
  execution_time_ms?: number;
  result_count: number;
  model_used: string;
  grounding_metadata?: Record<string, unknown>;
}

export interface ClaimSource {
  id: string;
  claim_id: string;
  source_type: 'web' | 'document' | 'claim' | 'user_input' | 'inference';
  web_source_id?: string;
  source_claim_id?: string;
  document_id?: string;
  document_path?: string;
  excerpt?: string;
  page_number?: number;
  timestamp_in_source?: string;
  support_strength: number;
  created_at: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface TimelineEvent {
  id: string;
  date: string;
  summary: string;
  findingId: string;
  findingType: FindingType;
  confidence?: number;
}

export interface GraphNode {
  id: string;
  type: 'finding' | 'entity' | 'source';
  label: string;
  data: ResearchFinding | KnowledgeEntity | ResearchSource;
  x?: number;
  y?: number;
  pinned?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  strength: number;
  label?: string;
}

export interface ResearchProgress {
  status: SessionStatus;
  currentPhase: string;
  progress: number;
  message: string;
  findingsCount: number;
  sourcesCount: number;
  startedAt: string;
  estimatedCompletion?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SessionWithDetails extends ResearchSession {
  findings: ResearchFinding[];
  sources: ResearchSource[];
  perspectives: ResearchPerspective[];
  queries?: ResearchQuery[];
  decomposition?: QueryDecomposition & { sub_queries: SubQuery[] };
  relationships: FindingRelationship[];
  contradictions: ResearchContradiction[];
  gaps: ResearchGap[];
  causal_chains: CausalChain[];
  entities?: KnowledgeEntity[];
  topic?: KnowledgeTopic;
  knowledge_claims?: KnowledgeClaim[];
}

// ============================================
// GROUPING & NAVIGATION TYPES
// ============================================

export interface TopicGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  topic_type?: TopicType;
  parent_id?: string;
  session_count: number;
  finding_count: number;
  entity_count: number;
  sessions?: Array<{
    id: string;
    template_type: string;
    status: SessionStatus;
  }>;
  children?: TopicGroup[];
}

export interface EntityGroup {
  id: string;
  canonical_name: string;
  entity_type: EntityType;
  aliases: string[];
  description?: string;
  mention_count: number;
  claim_count: number;
  session_ids: string[];
}

export interface FindingTypeCount {
  finding_type: FindingType;
  count: number;
  avg_confidence: number;
}

export interface TemplateGrouping {
  template_type: string;
  sessions: ResearchSession[];
  total_findings: number;
  total_sources: number;
  topics: TopicGroup[];
}

export interface FindingWithContext extends ResearchFinding {
  sources: ResearchSource[];
  relationships: FindingRelationship[];
  perspectives: FindingPerspective[];
  entities: KnowledgeEntity[];
}

// ============================================
// DATA SOURCES & RESEARCH TOPICS (Phase 08)
// ============================================

export interface DataSource {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  searchPattern?: string;
  active: boolean;
  createdAt: string;
}

export type TopicStatus = 'new' | 'queued' | 'researching' | 'completed' | 'failed' | 'deleted';

export type TopicSignal = 'breaking' | 'trending' | 'controversial';

export interface ResearchTopic {
  id: string;
  sourceId: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  status: TopicStatus;
  sessionId?: string;
  signals: TopicSignal[];
  discoveredAt: string;
  updatedAt: string;
}
