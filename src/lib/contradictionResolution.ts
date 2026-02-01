/**
 * Contradiction Resolution Library
 *
 * Contains logic for:
 * - Severity classification
 * - Confidence impact simulation
 * - Resolution strategies
 * - Evidence linking
 */

import type {
  ResearchContradiction,
  ResearchFinding,
  ResearchSource,
  VerificationStatus,
} from '@/src/types/research';

// ============================================================================
// Types
// ============================================================================

export type ResolutionStatus = 'unresolved' | 'investigating' | 'resolved' | 'dismissed';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type ResolutionStrategyType =
  | 'accept_claim_1'
  | 'accept_claim_2'
  | 'synthesize'
  | 'contextual'
  | 'temporal'
  | 'scope_limitation'
  | 'requires_more_research'
  | 'dismiss';

export interface ContradictionWithContext extends ResearchContradiction {
  finding_1?: ResearchFinding;
  finding_2?: ResearchFinding;
  source_1_details?: ResearchSource;
  source_2_details?: ResearchSource;
}

export interface SeverityAnalysis {
  level: SeverityLevel;
  score: number; // 0-100
  factors: SeverityFactor[];
  reasoning: string;
}

export interface SeverityFactor {
  name: string;
  impact: 'increases' | 'decreases' | 'neutral';
  weight: number;
  description: string;
}

export interface ResolutionStrategy {
  id: string;
  type: ResolutionStrategyType;
  title: string;
  description: string;
  rationale: string;
  confidence: number; // How confident we are in this strategy
  prefersClaim?: 1 | 2;
  requiredActions?: string[];
  evidenceGaps?: string[];
}

export interface ConfidenceImpact {
  claimId: string;
  originalConfidence: number;
  newConfidence: number;
  delta: number;
  affectedFindings: string[];
  propagationPath: string[];
}

export interface Resolution {
  id: string;
  contradictionId: string;
  status: ResolutionStatus;
  selectedStrategy?: ResolutionStrategyType;
  customResolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  votes?: ResolutionVote[];
  confidenceImpacts?: ConfidenceImpact[];
}

export interface ResolutionVote {
  id: string;
  userId: string;
  userName?: string;
  strategy: ResolutionStrategyType;
  confidence: number;
  reasoning?: string;
  votedAt: string;
}

export interface ResolutionHistory {
  contradictionId: string;
  events: ResolutionEvent[];
}

export interface ResolutionEvent {
  id: string;
  type: 'status_change' | 'vote' | 'note' | 'strategy_selected' | 'evidence_added';
  timestamp: string;
  userId?: string;
  userName?: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
}

// ============================================================================
// Severity Classification
// ============================================================================

/**
 * Calculate severity of a contradiction based on multiple factors
 */
export function calculateSeverity(
  contradiction: ContradictionWithContext,
  relatedFindings: ResearchFinding[] = []
): SeverityAnalysis {
  const factors: SeverityFactor[] = [];
  let totalScore = 50; // Start at medium

  // Factor 1: Source credibility difference
  const cred1 = contradiction.source_1_details?.credibility_score ?? 0.5;
  const cred2 = contradiction.source_2_details?.credibility_score ?? 0.5;
  const credDiff = Math.abs(cred1 - cred2);

  if (credDiff < 0.2) {
    factors.push({
      name: 'Source Credibility Parity',
      impact: 'increases',
      weight: 15,
      description: 'Both sources have similar credibility, making resolution harder',
    });
    totalScore += 15;
  } else if (credDiff > 0.5) {
    factors.push({
      name: 'Clear Credibility Gap',
      impact: 'decreases',
      weight: 10,
      description: 'Large credibility difference suggests a clear resolution path',
    });
    totalScore -= 10;
  }

  // Factor 2: Claim confidence scores
  const conf1 = contradiction.finding_1?.confidence_score ?? 0.5;
  const conf2 = contradiction.finding_2?.confidence_score ?? 0.5;
  const avgConf = (conf1 + conf2) / 2;

  if (avgConf > 0.7) {
    factors.push({
      name: 'High Confidence Claims',
      impact: 'increases',
      weight: 20,
      description: 'Both claims have high confidence, making this a significant conflict',
    });
    totalScore += 20;
  } else if (avgConf < 0.4) {
    factors.push({
      name: 'Low Confidence Claims',
      impact: 'decreases',
      weight: 15,
      description: 'Low confidence suggests these claims may need more verification',
    });
    totalScore -= 15;
  }

  // Factor 3: Number of dependent findings
  const claim1Refs = relatedFindings.filter(
    (f) => f.related_findings?.includes(contradiction.finding_id_1 ?? '')
  ).length;
  const claim2Refs = relatedFindings.filter(
    (f) => f.related_findings?.includes(contradiction.finding_id_2 ?? '')
  ).length;
  const totalRefs = claim1Refs + claim2Refs;

  if (totalRefs > 5) {
    factors.push({
      name: 'Highly Referenced',
      impact: 'increases',
      weight: 15,
      description: `${totalRefs} other findings depend on these claims`,
    });
    totalScore += 15;
  }

  // Factor 4: Significance indicator from original analysis
  if (contradiction.significance) {
    const sigLower = contradiction.significance.toLowerCase();
    if (sigLower.includes('critical') || sigLower.includes('fundamental')) {
      factors.push({
        name: 'Marked as Critical',
        impact: 'increases',
        weight: 20,
        description: 'This contradiction was flagged as critical by the analysis',
      });
      totalScore += 20;
    } else if (sigLower.includes('minor') || sigLower.includes('peripheral')) {
      factors.push({
        name: 'Marked as Minor',
        impact: 'decreases',
        weight: 15,
        description: 'This contradiction was flagged as minor',
      });
      totalScore -= 15;
    }
  }

  // Factor 5: Source type mismatch
  const sourceType1 = contradiction.source_1_details?.source_type;
  const sourceType2 = contradiction.source_2_details?.source_type;

  if (sourceType1 && sourceType2 && sourceType1 !== sourceType2) {
    const authoritative = ['academic', 'government'];
    const hasAuthoritative =
      authoritative.includes(sourceType1) || authoritative.includes(sourceType2);

    if (hasAuthoritative) {
      factors.push({
        name: 'Source Type Conflict',
        impact: 'neutral',
        weight: 5,
        description: 'One source is more authoritative, which may guide resolution',
      });
    }
  }

  // Clamp score
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine level
  let level: SeverityLevel;
  if (totalScore >= 75) level = 'critical';
  else if (totalScore >= 55) level = 'high';
  else if (totalScore >= 35) level = 'medium';
  else level = 'low';

  // Generate reasoning
  const reasoning = generateSeverityReasoning(level, factors);

  return {
    level,
    score: totalScore,
    factors,
    reasoning,
  };
}

function generateSeverityReasoning(level: SeverityLevel, factors: SeverityFactor[]): string {
  const increasing = factors.filter((f) => f.impact === 'increases');
  const decreasing = factors.filter((f) => f.impact === 'decreases');

  let reasoning = `This contradiction is classified as ${level} severity. `;

  if (increasing.length > 0) {
    reasoning += `Key concerns: ${increasing.map((f) => f.name.toLowerCase()).join(', ')}. `;
  }

  if (decreasing.length > 0) {
    reasoning += `Mitigating factors: ${decreasing.map((f) => f.name.toLowerCase()).join(', ')}.`;
  }

  return reasoning;
}

// ============================================================================
// Resolution Strategies
// ============================================================================

/**
 * Generate resolution strategy suggestions based on contradiction analysis
 */
export function generateResolutionStrategies(
  contradiction: ContradictionWithContext,
  severity: SeverityAnalysis
): ResolutionStrategy[] {
  const strategies: ResolutionStrategy[] = [];
  const cred1 = contradiction.source_1_details?.credibility_score ?? 0.5;
  const cred2 = contradiction.source_2_details?.credibility_score ?? 0.5;
  const conf1 = contradiction.finding_1?.confidence_score ?? 0.5;
  const conf2 = contradiction.finding_2?.confidence_score ?? 0.5;

  // Strategy 1: Accept higher credibility source
  if (Math.abs(cred1 - cred2) > 0.2) {
    const prefersClaim = cred1 > cred2 ? 1 : 2;
    const higherSource = prefersClaim === 1 ? contradiction.source_1 : contradiction.source_2;

    strategies.push({
      id: 'accept_higher_cred',
      type: prefersClaim === 1 ? 'accept_claim_1' : 'accept_claim_2',
      title: `Accept Claim ${prefersClaim} (Higher Source Credibility)`,
      description: `Source "${higherSource}" has significantly higher credibility (${Math.round((prefersClaim === 1 ? cred1 : cred2) * 100)}% vs ${Math.round((prefersClaim === 1 ? cred2 : cred1) * 100)}%)`,
      rationale:
        'When source credibility differs significantly, the more credible source typically provides more reliable information.',
      confidence: 0.7 + Math.abs(cred1 - cred2) * 0.3,
      prefersClaim,
      requiredActions: [
        `Document decision to favor ${higherSource}`,
        'Note lower-credibility source for potential future verification',
      ],
    });
  }

  // Strategy 2: Accept higher confidence claim
  if (Math.abs(conf1 - conf2) > 0.15) {
    const prefersClaim = conf1 > conf2 ? 1 : 2;

    strategies.push({
      id: 'accept_higher_conf',
      type: prefersClaim === 1 ? 'accept_claim_1' : 'accept_claim_2',
      title: `Accept Claim ${prefersClaim} (Higher Confidence)`,
      description: `Claim ${prefersClaim} has higher confidence score (${Math.round((prefersClaim === 1 ? conf1 : conf2) * 100)}% vs ${Math.round((prefersClaim === 1 ? conf2 : conf1) * 100)}%)`,
      rationale:
        'The confidence score reflects how well-supported each claim is by evidence.',
      confidence: 0.6 + Math.abs(conf1 - conf2) * 0.4,
      prefersClaim,
    });
  }

  // Strategy 3: Synthesize (both partially true)
  strategies.push({
    id: 'synthesize',
    type: 'synthesize',
    title: 'Synthesize Both Claims',
    description:
      'Both claims may contain partial truths that can be reconciled',
    rationale:
      'Contradictions often arise from different perspectives on the same phenomenon. A nuanced view may incorporate elements of both.',
    confidence: 0.5,
    requiredActions: [
      'Identify the specific point of disagreement',
      'Look for common ground between claims',
      'Draft a synthesized statement that honors both perspectives',
    ],
  });

  // Strategy 4: Contextual (different contexts)
  strategies.push({
    id: 'contextual',
    type: 'contextual',
    title: 'Different Contexts',
    description: 'The claims may be true in different contexts or circumstances',
    rationale:
      'What appears contradictory may actually be context-dependent. Both claims could be valid within their specific contexts.',
    confidence: 0.45,
    requiredActions: [
      'Identify the context for each claim',
      'Document when each claim applies',
      'Clarify scope limitations',
    ],
  });

  // Strategy 5: Temporal (different time periods)
  const hasTimeRefs =
    contradiction.finding_1?.temporal_context ||
    contradiction.finding_2?.temporal_context ||
    contradiction.finding_1?.event_date ||
    contradiction.finding_2?.event_date;

  if (hasTimeRefs) {
    strategies.push({
      id: 'temporal',
      type: 'temporal',
      title: 'Temporal Resolution',
      description:
        'The contradiction may be due to changes over time',
      rationale:
        'Situations evolve. A claim that was true at one point may no longer be accurate, or vice versa.',
      confidence: 0.55,
      requiredActions: [
        'Verify the time periods for each claim',
        'Determine if circumstances changed',
        'Document the temporal scope of each claim',
      ],
    });
  }

  // Strategy 6: Scope limitation
  strategies.push({
    id: 'scope_limit',
    type: 'scope_limitation',
    title: 'Apply Scope Limitations',
    description: 'Limit the scope of one or both claims to remove the contradiction',
    rationale:
      'Broad claims often conflict when applied universally. Adding appropriate caveats can resolve apparent contradictions.',
    confidence: 0.4,
    requiredActions: [
      'Identify overly broad language in each claim',
      'Add qualifiers or limitations',
      'Document the refined scope',
    ],
  });

  // Strategy 7: Requires more research
  if (severity.level === 'critical' || severity.level === 'high') {
    strategies.push({
      id: 'more_research',
      type: 'requires_more_research',
      title: 'Requires Additional Research',
      description:
        'The available evidence is insufficient to resolve this high-severity contradiction',
      rationale:
        'Given the importance of this contradiction, making an uninformed decision could be worse than acknowledging uncertainty.',
      confidence: 0.6,
      requiredActions: [
        'Identify specific gaps in evidence',
        'Draft targeted research queries',
        'Flag for follow-up investigation',
      ],
      evidenceGaps: ['Additional primary sources needed', 'Expert verification recommended'],
    });
  }

  // Strategy 8: Dismiss (if clearly minor)
  if (severity.level === 'low') {
    strategies.push({
      id: 'dismiss',
      type: 'dismiss',
      title: 'Dismiss as Non-Material',
      description:
        'This contradiction does not materially impact the research conclusions',
      rationale:
        'Not all contradictions require resolution. Minor discrepancies can be acknowledged without affecting overall findings.',
      confidence: 0.5,
      requiredActions: ['Document the contradiction for completeness', 'Note reason for dismissal'],
    });
  }

  // Sort by confidence
  strategies.sort((a, b) => b.confidence - a.confidence);

  return strategies;
}

// ============================================================================
// Confidence Impact Simulation
// ============================================================================

/**
 * Simulate the impact of resolving a contradiction on overall confidence
 */
export function simulateConfidenceImpact(
  contradiction: ContradictionWithContext,
  strategy: ResolutionStrategy,
  allFindings: ResearchFinding[]
): ConfidenceImpact[] {
  const impacts: ConfidenceImpact[] = [];

  // Get the claims involved
  const claim1 = contradiction.finding_1;
  const claim2 = contradiction.finding_2;

  if (!claim1 && !claim2) return impacts;

  // Determine what happens to each claim
  let claim1Impact = 0;
  let claim2Impact = 0;

  switch (strategy.type) {
    case 'accept_claim_1':
      claim1Impact = 0.1; // Slight boost
      claim2Impact = -0.3; // Significant reduction
      break;
    case 'accept_claim_2':
      claim1Impact = -0.3;
      claim2Impact = 0.1;
      break;
    case 'synthesize':
      claim1Impact = -0.05;
      claim2Impact = -0.05;
      break;
    case 'contextual':
    case 'temporal':
    case 'scope_limitation':
      claim1Impact = 0;
      claim2Impact = 0;
      break;
    case 'requires_more_research':
      claim1Impact = -0.1;
      claim2Impact = -0.1;
      break;
    case 'dismiss':
      claim1Impact = 0;
      claim2Impact = 0;
      break;
  }

  // Calculate impact on claim 1
  if (claim1) {
    const originalConf = claim1.confidence_score ?? 0.5;
    const newConf = Math.max(0, Math.min(1, originalConf + claim1Impact));

    // Find affected findings (those that reference this claim)
    const affected = allFindings
      .filter((f) => f.related_findings?.includes(claim1.id))
      .map((f) => f.id);

    impacts.push({
      claimId: claim1.id,
      originalConfidence: originalConf,
      newConfidence: newConf,
      delta: newConf - originalConf,
      affectedFindings: affected,
      propagationPath: [claim1.id, ...affected.slice(0, 3)],
    });
  }

  // Calculate impact on claim 2
  if (claim2) {
    const originalConf = claim2.confidence_score ?? 0.5;
    const newConf = Math.max(0, Math.min(1, originalConf + claim2Impact));

    const affected = allFindings
      .filter((f) => f.related_findings?.includes(claim2.id))
      .map((f) => f.id);

    impacts.push({
      claimId: claim2.id,
      originalConfidence: originalConf,
      newConfidence: newConf,
      delta: newConf - originalConf,
      affectedFindings: affected,
      propagationPath: [claim2.id, ...affected.slice(0, 3)],
    });
  }

  return impacts;
}

// ============================================================================
// Resolution Management
// ============================================================================

const STORAGE_KEY = 'contradiction_resolutions';

/**
 * Save a resolution to localStorage
 */
export function saveResolution(resolution: Resolution): void {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(STORAGE_KEY);
  const resolutions: Resolution[] = stored ? JSON.parse(stored) : [];

  const existingIndex = resolutions.findIndex(
    (r) => r.contradictionId === resolution.contradictionId
  );

  if (existingIndex >= 0) {
    resolutions[existingIndex] = resolution;
  } else {
    resolutions.push(resolution);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(resolutions));
}

/**
 * Load all resolutions from localStorage
 */
export function loadResolutions(): Resolution[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get resolution for a specific contradiction
 */
export function getResolution(contradictionId: string): Resolution | null {
  const resolutions = loadResolutions();
  return resolutions.find((r) => r.contradictionId === contradictionId) ?? null;
}

/**
 * Add a vote to a resolution
 */
export function addResolutionVote(
  contradictionId: string,
  vote: Omit<ResolutionVote, 'id'>
): Resolution {
  let resolution = getResolution(contradictionId);

  if (!resolution) {
    resolution = {
      id: `res-${Date.now()}`,
      contradictionId,
      status: 'investigating',
      votes: [],
    };
  }

  const newVote: ResolutionVote = {
    ...vote,
    id: `vote-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  resolution.votes = [...(resolution.votes ?? []), newVote];
  saveResolution(resolution);

  return resolution;
}

/**
 * Get voting summary for a resolution
 */
export function getVotingSummary(
  resolution: Resolution
): Map<ResolutionStrategyType, { count: number; avgConfidence: number }> {
  const summary = new Map<ResolutionStrategyType, { count: number; totalConf: number }>();

  (resolution.votes ?? []).forEach((vote) => {
    const existing = summary.get(vote.strategy) ?? { count: 0, totalConf: 0 };
    summary.set(vote.strategy, {
      count: existing.count + 1,
      totalConf: existing.totalConf + vote.confidence,
    });
  });

  const result = new Map<ResolutionStrategyType, { count: number; avgConfidence: number }>();
  summary.forEach((value, key) => {
    result.set(key, {
      count: value.count,
      avgConfidence: value.count > 0 ? value.totalConf / value.count : 0,
    });
  });

  return result;
}

// ============================================================================
// Resolution History
// ============================================================================

const HISTORY_KEY = 'contradiction_history';

/**
 * Add an event to resolution history
 */
export function addHistoryEvent(
  contradictionId: string,
  event: Omit<ResolutionEvent, 'id' | 'timestamp'>
): void {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(HISTORY_KEY);
  const histories: ResolutionHistory[] = stored ? JSON.parse(stored) : [];

  let history = histories.find((h) => h.contradictionId === contradictionId);

  if (!history) {
    history = { contradictionId, events: [] };
    histories.push(history);
  }

  history.events.push({
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  });

  localStorage.setItem(HISTORY_KEY, JSON.stringify(histories));
}

/**
 * Get history for a contradiction
 */
export function getResolutionHistory(contradictionId: string): ResolutionHistory | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(HISTORY_KEY);
  const histories: ResolutionHistory[] = stored ? JSON.parse(stored) : [];

  return histories.find((h) => h.contradictionId === contradictionId) ?? null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the severity color for UI
 */
export function getSeverityColor(level: SeverityLevel): string {
  switch (level) {
    case 'critical':
      return '#ef4444'; // red-500
    case 'high':
      return '#f97316'; // orange-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#22c55e'; // green-500
  }
}

/**
 * Get strategy icon
 */
export function getStrategyIcon(type: ResolutionStrategyType): string {
  switch (type) {
    case 'accept_claim_1':
    case 'accept_claim_2':
      return '✓';
    case 'synthesize':
      return '∪';
    case 'contextual':
      return '◐';
    case 'temporal':
      return '⏱';
    case 'scope_limitation':
      return '⊂';
    case 'requires_more_research':
      return '?';
    case 'dismiss':
      return '×';
  }
}

/**
 * Format confidence delta for display
 */
export function formatConfidenceDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${Math.round(delta * 100)}%`;
}
