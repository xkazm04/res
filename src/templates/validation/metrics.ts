/**
 * Research Quality Metrics
 *
 * Utilities for calculating and comparing research quality metrics
 * between Claude Code and Gemini output.
 */

import type { ActorOutput } from '../types';

/**
 * Calculated metrics for a research session.
 */
export interface ResearchMetrics {
  findingCount: number;
  sourceCount: number;
  perspectiveCount: number;
  contradictionCount: number;
  knowledgeGapCount: number;
  avgConfidenceScore: number;
  uniqueFindingTypes: string[];
  uniquePerspectiveTypes: string[];
  highCredibilitySources: number;
  searchQueriesExecuted: number;
}

/**
 * Calculate metrics from ActorOutput.
 */
export function calculateMetrics(output: ActorOutput): ResearchMetrics {
  const findings = output.findings || [];
  const sources = output.sources || [];
  const perspectives = output.perspectives || [];
  const contradictions = output.contradictions || [];
  const knowledgeGaps = output.knowledge_gaps || [];

  const avgConfidence =
    findings.length > 0
      ? findings.reduce((sum, f) => sum + (f.confidence_score || 0), 0) / findings.length
      : 0;

  const highCredSources = sources.filter(
    (s) => s.credibility_label === 'high' || (s.credibility_score && s.credibility_score >= 0.7)
  ).length;

  return {
    findingCount: findings.length,
    sourceCount: sources.length,
    perspectiveCount: perspectives.length,
    contradictionCount: contradictions.length,
    knowledgeGapCount: knowledgeGaps.length,
    avgConfidenceScore: Math.round(avgConfidence * 100) / 100,
    uniqueFindingTypes: [...new Set(findings.map((f) => f.finding_type))],
    uniquePerspectiveTypes: [...new Set(perspectives.map((p) => p.perspective_type))],
    highCredibilitySources: highCredSources,
    searchQueriesExecuted: output.search_queries_executed?.length || 0,
  };
}

/**
 * Comparison result for a single metric.
 */
export interface MetricComparison {
  metric: string;
  gemini: number | string;
  claude: number | string;
  diff: string;
  winner: 'gemini' | 'claude' | 'tie';
}

/**
 * Compare metrics between Gemini and Claude outputs.
 */
export function compareMetrics(
  gemini: ResearchMetrics,
  claude: ResearchMetrics
): MetricComparison[] {
  const comparisons: MetricComparison[] = [];

  const numericMetrics: (keyof ResearchMetrics)[] = [
    'findingCount',
    'sourceCount',
    'perspectiveCount',
    'contradictionCount',
    'avgConfidenceScore',
    'highCredibilitySources',
  ];

  for (const metric of numericMetrics) {
    const g = gemini[metric] as number;
    const c = claude[metric] as number;
    const diff = c - g;

    comparisons.push({
      metric,
      gemini: g,
      claude: c,
      diff: diff > 0 ? `+${diff}` : String(diff),
      winner: diff > 0 ? 'claude' : diff < 0 ? 'gemini' : 'tie',
    });
  }

  return comparisons;
}

/**
 * Format metrics as human-readable report.
 */
export function formatMetricsReport(metrics: ResearchMetrics): string {
  return `
Findings:      ${metrics.findingCount} (${metrics.uniqueFindingTypes.join(', ') || 'none'})
Sources:       ${metrics.sourceCount} (${metrics.highCredibilitySources} high-credibility)
Perspectives:  ${metrics.perspectiveCount} (${metrics.uniquePerspectiveTypes.join(', ') || 'none'})
Contradictions: ${metrics.contradictionCount}
Knowledge Gaps: ${metrics.knowledgeGapCount}
Avg Confidence: ${metrics.avgConfidenceScore}
Searches:      ${metrics.searchQueriesExecuted}
`.trim();
}
