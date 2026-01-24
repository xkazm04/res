// ============================================
// Tech Market Analysis & Prediction Types
// For 2025 Research and 2026 Predictions
// ============================================

import type { ResearchFinding, ResearchSource, SourceType, SessionWithDetails } from './research';

// ============================================
// ENUMS
// ============================================

export type TechnologyDomain =
  | 'ai_ml'
  | 'cloud_infrastructure'
  | 'devops_platform'
  | 'software_development'
  | 'enterprise_stack'
  | 'security'
  | 'data_analytics';

export type PredictionTimeframe = 'Q1_2026' | 'Q2_2026' | 'Q3_2026' | 'Q4_2026';

export type QuarterLabel = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type ScenarioType = 'bull' | 'base' | 'bear';

export type AdoptionPhase =
  | 'innovators'       // 0-2.5%
  | 'early_adopters'   // 2.5-16%
  | 'early_majority'   // 16-50%
  | 'late_majority'    // 50-84%
  | 'laggards';        // 84-100%

export type RiskOpportunityType = 'risk' | 'opportunity';

export type MatrixQuadrant = 'act_now' | 'prepare' | 'monitor' | 'watch';

export type TrendDirection = 'accelerating' | 'stable' | 'decelerating';

export type ImpactLevel = 'high' | 'medium' | 'low';

export type TechPerspective = 'vc_startup' | 'developer_community';

export type TechFindingType =
  | 'product_launch'
  | 'funding_round'
  | 'adoption_trend'
  | 'market_metric'
  | 'acquisition'
  | 'prediction'
  | 'developer_sentiment'
  | 'open_source_event'
  | 'enterprise_adoption'
  | 'gap';

// ============================================
// TIMELINE EVENTS
// ============================================

export interface TechTimelineEvent {
  id: string;
  quarter: QuarterLabel;
  year: 2025 | 2026;
  title: string;
  description: string;
  domain: TechnologyDomain;
  isPrediction: boolean;
  confidenceScore: number;
  confidenceRange: {
    low: number;
    high: number;
  };
  impact: ImpactLevel;
  relatedTechnologies: string[];
  source?: string;
  findingId?: string;
}

// ============================================
// TECHNOLOGY ADOPTION CURVES
// ============================================

export interface TechnologyAdoption {
  id: string;
  name: string;
  domain: TechnologyDomain;
  currentPhase: AdoptionPhase;
  adoptionPercentage: number;
  curveData: AdoptionDataPoint[];
  projectedPeakYear: number;
  marketSize?: string;
  keyDrivers: string[];
  barriers: string[];
}

export interface AdoptionDataPoint {
  year: number;
  quarter: QuarterLabel;
  adoption: number;
  isPredicted: boolean;
}

export interface AdoptionCurveData {
  phase: AdoptionPhase;
  penetrationPercent: number;
  velocity: TrendDirection;
  timeToNextPhaseMonths: number;
}

// ============================================
// PREDICTION MATRIX (RISK/OPPORTUNITY)
// ============================================

export interface PredictionMatrixItem {
  id: string;
  title: string;
  description: string;
  domain: TechnologyDomain;
  type: RiskOpportunityType;
  impact: number;        // 0-100 (y-axis)
  probability: number;   // 0-100 (x-axis)
  quadrant: MatrixQuadrant;
  timeframe: string;
  mitigationActions?: string[];  // For risks
  captureActions?: string[];     // For opportunities
  relatedPredictionIds?: string[];
}

// ============================================
// SCENARIO ANALYSIS
// ============================================

export interface TechScenario {
  id: string;
  predictionId: string;
  predictionTitle: string;
  domain: TechnologyDomain;
  scenarios: {
    bull: ScenarioDetail;
    base: ScenarioDetail;
    bear: ScenarioDetail;
  };
}

export interface ScenarioDetail {
  probability: number;
  outcome: string;
  keyAssumptions: string[];
  implications: string[];
  timeframe: string;
}

export interface ScenarioVariant {
  scenarioType: ScenarioType;
  probability: number;
  description: string;
  keyDrivers: string[];
  triggerConditions: string[];
  impactAssessment: ImpactAssessment;
}

export interface ImpactAssessment {
  marketImpact: ImpactLevel;
  developerImpact: ImpactLevel;
  enterpriseImpact: ImpactLevel;
  timelineShiftMonths: number;
  confidenceModifier: number;
}

// ============================================
// 2025 TRENDS
// ============================================

export interface TechTrend2025 {
  id: string;
  name: string;
  domain: TechnologyDomain;
  direction: TrendDirection;
  momentum: number;        // 0-100
  description: string;
  keyPlayers: string[];
  enterpriseRelevance: ImpactLevel;
  signals: string[];
  findingIds?: string[];
}

export interface TrendEvidence {
  findingId: string;
  evidenceType: 'funding' | 'product_launch' | 'adoption_metric' |
                'market_data' | 'expert_opinion' | 'regulatory';
  eventDate: string;
  description: string;
  impactScore: number;
}

// ============================================
// TECHNOLOGY PREDICTION (CORE ENTITY)
// ============================================

export interface TechnologyPrediction {
  id: string;
  sessionId: string;

  // Core prediction data
  title: string;
  description: string;
  technologyDomain: TechnologyDomain;

  // Timeline placement
  timeframe: PredictionTimeframe;
  expectedDate?: string;

  // Confidence scoring
  confidenceScore: number;
  evidenceStrength: EvidenceStrength;

  // Scenario variants
  scenarios: ScenarioVariant[];

  // Supporting evidence
  supportingFindings: string[];
  evidenceSources: EvidenceSource[];

  // Adoption curve
  currentAdoptionPhase: AdoptionPhase;
  predictedAdoptionPhase: AdoptionPhase;
  adoptionVelocity: TrendDirection;

  // Classification
  riskOpportunityClassification: RiskOpportunityClassification[];

  // Perspectives
  perspectiveAnalyses: PredictionPerspectiveAnalysis[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceStrength {
  sourceCount: number;
  sourceDiversityScore: number;
  recencyScore: number;
  corroborationLevel: 'strong' | 'moderate' | 'weak';
  contradictingEvidenceCount: number;
  overallScore: number;
}

export interface EvidenceSource {
  findingId: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceType: SourceType;
  credibilityScore: number;
  relevanceScore: number;
  excerpt: string;
  eventDate?: string;
}

export interface RiskOpportunityClassification {
  type: RiskOpportunityType;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number;
  description: string;
  mitigationOrCaptureStrategy: string;
  affectedStakeholders: string[];
}

export interface PredictionPerspectiveAnalysis {
  perspective: TechPerspective;
  analysisText: string;
  keyImplications: string[];
  recommendedActions: string[];
  investmentThesis?: string;    // For VC perspective
  adoptionBlockers?: string[];  // For developer perspective
  confidence: number;
}

// ============================================
// TECH MARKET SESSION
// ============================================

export interface TechMarketSession {
  id: string;
  researchSessionId?: string;
  title: string;
  focusDomains: TechnologyDomain[];
  targetYear: number;
  status: 'pending' | 'researching' | 'analyzing' | 'completed' | 'failed';

  // Results
  predictions: TechnologyPrediction[];
  trends: TechTrend2025[];
  timelineEvents: TechTimelineEvent[];
  adoptionCurves: TechnologyAdoption[];
  matrixItems: PredictionMatrixItem[];
  scenarios: TechScenario[];

  // Cost tracking
  totalTokens: number;
  totalCostUsd: number;

  createdAt: string;
  completedAt?: string;
}

// ============================================
// STORE STATE TYPES
// ============================================

export type TechMarketView =
  | 'overview'
  | 'timeline'
  | 'adoption'
  | 'matrix'
  | 'scenarios'
  | 'trends';

export interface TechMarketState {
  // Session data
  session: SessionWithDetails | null;
  techSession: TechMarketSession | null;
  isLoading: boolean;
  error: string | null;

  // View state
  activeView: TechMarketView;
  activeDomain: TechnologyDomain | 'all';
  selectedScenarioType: ScenarioType;
  timelineYear: 2025 | 2026 | 'both';
  confidenceThreshold: number;
  showHighConfidenceOnly: boolean;

  // Extracted/derived data
  timelineEvents: TechTimelineEvent[];
  adoptionCurves: TechnologyAdoption[];
  matrixItems: PredictionMatrixItem[];
  scenarios: TechScenario[];
  trends2025: TechTrend2025[];

  // Actions
  setSession: (session: SessionWithDetails) => void;
  setTechSession: (session: TechMarketSession) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveView: (view: TechMarketView) => void;
  setActiveDomain: (domain: TechnologyDomain | 'all') => void;
  setSelectedScenarioType: (type: ScenarioType) => void;
  setTimelineYear: (year: 2025 | 2026 | 'both') => void;
  setConfidenceThreshold: (threshold: number) => void;
  toggleHighConfidenceOnly: () => void;

  // Extraction methods
  extractTimelineEvents: () => void;
  extractAdoptionCurves: () => void;
  extractMatrixItems: () => void;
  extractScenarios: () => void;
  extractTrends: () => void;

  // Computed getters
  getFilteredTimelineEvents: () => TechTimelineEvent[];
  getFilteredMatrixItems: () => PredictionMatrixItem[];
  getDomainSummary: () => Record<TechnologyDomain, DomainSummary>;
}

export interface DomainSummary {
  riskCount: number;
  opportunityCount: number;
  predictionCount: number;
  trendCount: number;
}

// ============================================
// API TYPES
// ============================================

export interface PredictionGenerateInput {
  focusDomains: TechnologyDomain[];
  maxPredictionsPerDomain: number;
  perspectives: TechPerspective[];
  researchDepth: 'quick' | 'standard' | 'deep';
}

export interface PredictionGenerateOutput {
  sessionId: string;
  predictions: TechnologyPrediction[];
  trends: TechTrend2025[];
  researchFindingsCount: number;
  costSummary: {
    totalTokens: number;
    totalCostUsd: number;
  };
  executionTimeSeconds: number;
}

// ============================================
// HELPER CONSTANTS
// ============================================

export const DOMAIN_LABELS: Record<TechnologyDomain, string> = {
  ai_ml: 'AI/ML',
  cloud_infrastructure: 'Cloud Infrastructure',
  devops_platform: 'DevOps & Platform',
  software_development: 'Software Development',
  enterprise_stack: 'Enterprise Stack',
  security: 'Security',
  data_analytics: 'Data Analytics',
};

export const DOMAIN_COLORS: Record<TechnologyDomain, string> = {
  ai_ml: 'violet',
  cloud_infrastructure: 'blue',
  devops_platform: 'emerald',
  software_development: 'amber',
  enterprise_stack: 'slate',
  security: 'red',
  data_analytics: 'cyan',
};

export const PHASE_THRESHOLDS: Record<AdoptionPhase, { min: number; max: number }> = {
  innovators: { min: 0, max: 2.5 },
  early_adopters: { min: 2.5, max: 16 },
  early_majority: { min: 16, max: 50 },
  late_majority: { min: 50, max: 84 },
  laggards: { min: 84, max: 100 },
};

export const QUADRANT_CONFIG: Record<MatrixQuadrant, {
  label: string;
  color: string;
  description: string;
}> = {
  act_now: {
    label: 'Act Now',
    color: 'emerald',
    description: 'High impact, high probability - prioritize immediately',
  },
  prepare: {
    label: 'Prepare',
    color: 'amber',
    description: 'High impact, lower probability - develop contingency plans',
  },
  monitor: {
    label: 'Monitor',
    color: 'blue',
    description: 'Lower impact, high probability - track and manage',
  },
  watch: {
    label: 'Watch',
    color: 'slate',
    description: 'Lower impact, lower probability - periodic review',
  },
};
