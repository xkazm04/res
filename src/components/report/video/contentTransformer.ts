import type { SessionWithDetails, ResearchFinding, ResearchPerspective } from '@/src/types/research';
import type { VideoContentSelection, VideoSection, SelectableItem } from './useContentSelection';

/**
 * Transformed content structure used by VideoOverview
 */
export interface VideoOverviewContent {
  // Chart data
  chartData: {
    barData: Array<{ label: string; value: number }>;
    lineData: number[];
    pieData: Array<{ label: string; value: number; color: string }>;
  };
  // Content data for insights scene
  contentData: {
    insights: string[];
    warnings: string[];
  };
  // Stats override
  stats: {
    findings: number;
    sources: number;
    perspectives: number;
    avgConfidence: number;
    highConfidence: number;
    redFlags: number;
    gaps: number;
  };
  // Metrics override (for curated content)
  metrics?: Array<{
    label: string;
    value: number;
    suffix?: string;
    color: string;
  }>;
  // Summary override (for curated content)
  summary?: {
    headline: string;
    verdict: string;
    confidenceScore: number;
    recommendation: string;
  };
}

/**
 * LLM-curated content from the curation API
 */
export interface CuratedVideoContent {
  metrics: Array<{
    label: string;
    value: number;
    suffix?: string;
    color: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
    sourceItemId?: string;
  }>;
  charts: {
    barData: Array<{ label: string; value: number }>;
    lineData: number[];
    pieData: Array<{ label: string; value: number; color: string }>;
    chartNarrative?: string;
  };
  insights: {
    keyFindings: string[];
    warnings: string[];
  };
  summary: {
    headline: string;
    verdict: string;
    confidenceScore: number;
    recommendation: string;
  };
}

/**
 * Request payload for curation API
 */
export interface CurationRequest {
  query: string;
  templateType: string;
  items: Array<{
    id: string;
    content: string;
    type: string;
    category: 'finding' | 'perspective' | 'contradiction' | 'gap' | 'causal_chain';
    confidence: number;
    targetSections: VideoSection[];
    rawData?: Record<string, unknown>;
  }>;
}

const PIE_COLORS = ['#ef4444', '#f59e0b', '#22d3ee', '#a78bfa', '#34d399'];

/**
 * Build a curation request from session and selection state
 */
export function buildCurationRequest(
  session: SessionWithDetails,
  selection: VideoContentSelection,
  availableItems: {
    findings: SelectableItem[];
    perspectives: SelectableItem[];
    analysis: SelectableItem[];
  }
): CurationRequest {
  // Gather all selected items with their section assignments
  const items: CurationRequest['items'] = [];

  // Add selected findings
  availableItems.findings
    .filter(f => selection.selectedFindings.includes(f.id))
    .forEach(f => {
      const targetSections = selection.sectionAssignments[f.id] || [];
      if (targetSections.length > 0) {
        items.push({
          id: f.id,
          content: f.content,
          type: f.type,
          category: f.category,
          confidence: f.confidence,
          targetSections,
          rawData: f.rawData,
        });
      }
    });

  // Add selected perspectives
  availableItems.perspectives
    .filter(p => selection.selectedPerspectives.includes(p.id))
    .forEach(p => {
      const targetSections = selection.sectionAssignments[p.id] || [];
      if (targetSections.length > 0) {
        items.push({
          id: p.id,
          content: p.content,
          type: p.type,
          category: p.category,
          confidence: p.confidence,
          targetSections,
          rawData: p.rawData,
        });
      }
    });

  // Add selected analysis items
  const selectedAnalysisIds = [
    ...selection.selectedContradictions,
    ...selection.selectedGaps,
    ...selection.selectedCausalChains,
  ];
  availableItems.analysis
    .filter(a => selectedAnalysisIds.includes(a.id))
    .forEach(a => {
      const targetSections = selection.sectionAssignments[a.id] || [];
      if (targetSections.length > 0) {
        items.push({
          id: a.id,
          content: a.content,
          type: a.type,
          category: a.category,
          confidence: a.confidence,
          targetSections,
          rawData: a.rawData,
        });
      }
    });

  return {
    query: session.query || 'Research Analysis',
    templateType: session.template_type || 'analysis',
    items,
  };
}

/**
 * Transform curated content from LLM to VideoOverviewContent format
 */
export function transformCuratedToContent(
  curated: CuratedVideoContent,
  originalStats: VideoOverviewContent['stats']
): VideoOverviewContent {
  return {
    chartData: {
      barData: curated.charts.barData,
      lineData: curated.charts.lineData,
      pieData: curated.charts.pieData,
    },
    contentData: {
      insights: curated.insights.keyFindings,
      warnings: curated.insights.warnings,
    },
    stats: {
      ...originalStats,
      avgConfidence: curated.summary.confidenceScore,
    },
    metrics: curated.metrics.slice(0, 4).map(m => ({
      label: m.label,
      value: m.value,
      suffix: m.suffix,
      color: m.color,
    })),
    summary: curated.summary,
  };
}

/**
 * Check if selection has any section assignments
 */
export function hasAnySectionAssignments(selection: VideoContentSelection): boolean {
  return Object.values(selection.sectionAssignments).some(sections => sections.length > 0);
}

/**
 * Transform selected content into VideoOverviewContent format
 */
export function transformSelectionToContent(
  session: SessionWithDetails,
  selection: VideoContentSelection
): VideoOverviewContent {
  const allFindings = session.findings || [];
  const allPerspectives = session.perspectives || [];
  const allSources = session.sources || [];

  // Filter to selected items
  const selectedFindings = allFindings.filter(f => selection.selectedFindings.includes(f.id));
  const selectedPerspectives = allPerspectives.filter(p => selection.selectedPerspectives.includes(p.id));

  // Build chart data from selected findings
  const findingCounts: Record<string, number> = {};
  selectedFindings.forEach(f => {
    findingCounts[f.finding_type] = (findingCounts[f.finding_type] || 0) + 1;
  });

  // Source distribution from sources associated with selected findings
  const selectedSourceIds = new Set<string>();
  selectedFindings.forEach(f => {
    f.supporting_sources?.forEach(sid => selectedSourceIds.add(sid));
  });
  const selectedSources = allSources.filter(s => selectedSourceIds.has(s.id));

  const sourceCounts: Record<string, number> = {};
  selectedSources.forEach(s => {
    sourceCounts[s.source_type || 'web'] = (sourceCounts[s.source_type || 'web'] || 0) + 1;
  });

  // Line chart: confidence scores of selected findings
  const lineData = selectedFindings.slice(0, 10).map(f => (f.confidence_score || 0.5) * 100);
  if (lineData.length === 0) lineData.push(50); // Fallback

  // Insights and warnings from selected perspectives
  const insights: string[] = [];
  const warnings: string[] = [];
  selectedPerspectives.forEach(p => {
    p.key_insights?.slice(0, 2).forEach(i => insights.push(i));
    p.warnings?.slice(0, 1).forEach(w => warnings.push(w));
  });

  // Calculate stats from selected content
  const avgConfidence = selectedFindings.length > 0
    ? Math.round((selectedFindings.reduce((sum, f) => sum + (f.confidence_score || 0.5), 0) / selectedFindings.length) * 100)
    : 50;
  const highConfidence = selectedFindings.filter(f => (f.confidence_score || 0) >= 0.8).length;

  // Count red flags from selected perspectives
  const redFlags = selectedPerspectives.reduce((count, p) => count + (p.warnings?.length || 0), 0);

  // Count selected gaps
  const selectedGapsCount = selection.selectedGaps.length;

  return {
    chartData: {
      barData: Object.entries(findingCounts)
        .slice(0, 5)
        .map(([label, value]) => ({ label: label.slice(0, 4), value })),
      lineData,
      pieData: Object.entries(sourceCounts)
        .slice(0, 4)
        .map(([label, value], i) => ({ label, value, color: PIE_COLORS[i] })),
    },
    contentData: {
      insights: insights.slice(0, 3),
      warnings: warnings.slice(0, 2),
    },
    stats: {
      findings: selectedFindings.length,
      sources: selectedSources.length,
      perspectives: selectedPerspectives.length,
      avgConfidence,
      highConfidence,
      redFlags,
      gaps: selectedGapsCount,
    },
  };
}

/**
 * Generate a narration script based on selected content
 */
export function generateNarrationPrompt(
  session: SessionWithDetails,
  selection: VideoContentSelection,
  content: VideoOverviewContent
): string {
  const selectedFindings = (session.findings || [])
    .filter(f => selection.selectedFindings.includes(f.id))
    .slice(0, 5);

  const selectedPerspectives = (session.perspectives || [])
    .filter(p => selection.selectedPerspectives.includes(p.id))
    .slice(0, 3);

  const findingsText = selectedFindings
    .map(f => `- ${f.content.slice(0, 80)}... (${Math.round((f.confidence_score || 0.5) * 100)}% confidence)`)
    .join('\n');

  const perspectivesText = selectedPerspectives
    .map(p => `- ${p.perspective_type}: ${p.key_insights?.[0]?.slice(0, 80) || 'Analysis available'}`)
    .join('\n');

  return `Generate a 40-50 word narration script for a 15-second research video.

Topic: ${session.query}
Template: ${session.template_type}

Key Findings (${content.stats.findings} total, ${content.stats.avgConfidence}% avg confidence):
${findingsText || 'No findings selected'}

Key Perspectives:
${perspectivesText || 'No perspectives selected'}

Requirements:
- Opening hook (attention-grabbing)
- 1-2 key findings (most important)
- Closing verdict/recommendation
- Conversational, engaging tone
- Exactly 40-50 words for 15 second duration

Output format: JSON { "text": "...", "wordCount": N, "estimatedDuration": N }`;
}
