/**
 * Custom Tab Composition - Data Extraction Engine
 *
 * This module provides functions to extract and filter data from a SessionWithDetails
 * based on a CustomTabComposition configuration.
 */

import type {
  SessionWithDetails,
  ResearchFinding,
  KnowledgeEntity,
  ResearchSource,
  ResearchPerspective,
  ResearchContradiction,
  ResearchGap,
  CausalChain,
} from '@/src/types/research';

import type {
  CustomTabComposition,
  FindingsConfig,
  EntitiesConfig,
  SourcesConfig,
  PerspectivesConfig,
  ContradictionsConfig,
  GapsConfig,
  CausalChainsConfig,
  TextFilter,
  ConfidenceFilter,
  CredibilityFilter,
  DataSourceType,
} from '@/src/stores/customTabStore';

// ============================================
// EXTRACTED DATA TYPES
// ============================================

export interface ExtractedCustomTabData {
  findings: ResearchFinding[];
  entities: KnowledgeEntity[];
  sources: ResearchSource[];
  perspectives: ResearchPerspective[];
  contradictions: ResearchContradiction[];
  gaps: ResearchGap[];
  causalChains: CausalChain[];

  // Counts (pre-filter for comparison)
  totalCounts: {
    findings: number;
    entities: number;
    sources: number;
    perspectives: number;
    contradictions: number;
    gaps: number;
    causalChains: number;
  };

  // Enabled sections
  enabledSections: DataSourceType[];
}

// ============================================
// TEXT FILTER HELPERS
// ============================================

function matchesTextFilter(text: string, filter: TextFilter): boolean {
  if (!filter.enabled || !filter.query.trim()) return true;

  const query = filter.query.trim();
  const normalizedText = text.toLowerCase();

  switch (filter.matchType) {
    case 'exact':
      return normalizedText === query.toLowerCase();
    case 'regex':
      try {
        // Limit regex length to prevent ReDoS attacks
        if (query.length > 200) return normalizedText.includes(query.toLowerCase());
        const regex = new RegExp(query, 'i');
        return regex.test(text);
      } catch {
        // Invalid regex, fall back to contains
        return normalizedText.includes(query.toLowerCase());
      }
    case 'contains':
    default:
      return normalizedText.includes(query.toLowerCase());
  }
}

function matchesAnyField(fields: (string | undefined)[], filter: TextFilter): boolean {
  if (!filter.enabled || !filter.query.trim()) return true;
  return fields.some(field => field && matchesTextFilter(field, filter));
}

// ============================================
// NUMERIC FILTER HELPERS
// ============================================

function matchesConfidence(score: number | undefined, filter: ConfidenceFilter): boolean {
  if (!filter.enabled) return true;
  const normalized = (score ?? 0) * 100; // Scores are 0-1, convert to 0-100
  return normalized >= filter.min && normalized <= filter.max;
}

function matchesCredibility(score: number | undefined, filter: CredibilityFilter): boolean {
  if (!filter.enabled) return true;
  const normalized = (score ?? 0) * 100;
  return normalized >= filter.min && normalized <= filter.max;
}

// ============================================
// DATA EXTRACTORS
// ============================================

function extractFindings(
  findings: ResearchFinding[],
  config: FindingsConfig
): ResearchFinding[] {
  if (!config.enabled) return [];

  let filtered = [...findings];

  // Filter by type
  if (config.types.length > 0) {
    filtered = filtered.filter(f => config.types.includes(f.finding_type));
  }

  // Filter by confidence
  filtered = filtered.filter(f => matchesConfidence(f.confidence_score, config.confidence));

  // Filter by temporal context
  if (config.temporalContext.length > 0) {
    filtered = filtered.filter(f =>
      f.temporal_context && config.temporalContext.includes(f.temporal_context)
    );
  }

  // Filter by text
  filtered = filtered.filter(f =>
    matchesAnyField([f.content, f.summary, f.perspective], config.textFilter)
  );

  // Apply limit
  if (config.limit && config.limit > 0) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function extractEntities(
  entities: KnowledgeEntity[],
  config: EntitiesConfig
): KnowledgeEntity[] {
  if (!config.enabled) return [];

  let filtered = [...entities];

  // Filter by type
  if (config.types.length > 0) {
    filtered = filtered.filter(e => config.types.includes(e.entity_type));
  }

  // Filter by minimum mentions
  if (config.minMentions && config.minMentions > 0) {
    filtered = filtered.filter(e => e.mention_count >= (config.minMentions || 0));
  }

  // Filter by roles (search in profile_data or description)
  if (config.roles.length > 0) {
    filtered = filtered.filter(e => {
      const profileStr = JSON.stringify(e.profile_data || {}).toLowerCase();
      const descStr = (e.description || '').toLowerCase();
      return config.roles.some(role =>
        profileStr.includes(role.toLowerCase()) || descStr.includes(role.toLowerCase())
      );
    });
  }

  // Filter by text
  filtered = filtered.filter(e =>
    matchesAnyField([e.canonical_name, e.description, ...e.aliases], config.textFilter)
  );

  // Apply limit
  if (config.limit && config.limit > 0) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function extractSources(
  sources: ResearchSource[],
  config: SourcesConfig
): ResearchSource[] {
  if (!config.enabled) return [];

  let filtered = [...sources];

  // Filter by type
  if (config.types.length > 0) {
    filtered = filtered.filter(s => s.source_type && config.types.includes(s.source_type));
  }

  // Filter by credibility
  filtered = filtered.filter(s => matchesCredibility(s.credibility_score, config.credibility));

  // Filter by text
  filtered = filtered.filter(s =>
    matchesAnyField([s.title, s.url, s.domain, s.snippet], config.textFilter)
  );

  // Apply limit
  if (config.limit && config.limit > 0) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function extractPerspectives(
  perspectives: ResearchPerspective[],
  config: PerspectivesConfig
): ResearchPerspective[] {
  if (!config.enabled) return [];

  let filtered = [...perspectives];

  // Filter by type
  if (config.types.length > 0) {
    filtered = filtered.filter(p => config.types.includes(p.perspective_type));
  }

  // Filter by content type preferences
  filtered = filtered.filter(p => {
    // If we don't want warnings and this perspective only has warnings, exclude it
    const hasWarnings = (p.warnings?.length || 0) > 0;
    const hasInsights = (p.key_insights?.length || 0) > 0;
    const hasRecommendations = (p.recommendations?.length || 0) > 0;

    // Include if at least one desired content type is present
    return (
      (config.includeWarnings && hasWarnings) ||
      (config.includeInsights && hasInsights) ||
      (config.includeRecommendations && hasRecommendations) ||
      // Always include if it has analysis text and no specific filters
      (p.analysis_text && !hasWarnings && !hasInsights && !hasRecommendations)
    );
  });

  // Filter by text
  filtered = filtered.filter(p =>
    matchesAnyField(
      [p.analysis_text, ...(p.key_insights || []), ...(p.warnings || []), ...(p.recommendations || [])],
      config.textFilter
    )
  );

  // Apply limit
  if (config.limit && config.limit > 0) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function extractContradictions(
  contradictions: ResearchContradiction[],
  config: ContradictionsConfig
): ResearchContradiction[] {
  if (!config.enabled) return [];

  let filtered = [...contradictions];

  // Filter by significance (if provided)
  if (config.minSignificance && config.minSignificance > 0) {
    filtered = filtered.filter(c => {
      // significance is typically a text description, so we check if it exists
      return c.significance !== undefined && c.significance !== null;
    });
  }

  // Filter by text
  filtered = filtered.filter(c =>
    matchesAnyField([c.claim_1, c.claim_2, c.significance, c.resolution_hint], config.textFilter)
  );

  // Apply limit
  if (config.limit && config.limit > 0) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function extractGaps(
  gaps: ResearchGap[],
  config: GapsConfig
): ResearchGap[] {
  if (!config.enabled) return [];

  let filtered = [...gaps];

  // Filter by priority
  if (config.priorities.length > 0) {
    filtered = filtered.filter(g => config.priorities.includes(g.priority));
  }

  // Filter by type
  if (config.types.length > 0) {
    filtered = filtered.filter(g => config.types.includes(g.gap_type));
  }

  // Filter by text
  filtered = filtered.filter(g =>
    matchesAnyField([g.description, ...(g.suggested_queries || []), g.missing_actor], config.textFilter)
  );

  // Apply limit
  if (config.limit && config.limit > 0) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function extractCausalChains(
  chains: CausalChain[],
  config: CausalChainsConfig
): CausalChain[] {
  if (!config.enabled) return [];

  let filtered = [...chains];

  // Filter by minimum length
  if (config.minLength && config.minLength > 0) {
    filtered = filtered.filter(c => (c.finding_ids?.length || 0) >= (config.minLength || 0));
  }

  // Filter by text
  filtered = filtered.filter(c =>
    matchesAnyField(c.descriptions || [], config.textFilter)
  );

  // Apply limit
  if (config.limit && config.limit > 0) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

export function extractCustomTabData(
  session: SessionWithDetails,
  composition: CustomTabComposition
): ExtractedCustomTabData {
  const findings = session.findings || [];
  const entities = session.entities || [];
  const sources = session.sources || [];
  const perspectives = session.perspectives || [];
  const contradictions = session.contradictions || [];
  const gaps = session.gaps || [];
  const causalChains = session.causal_chains || [];

  const totalCounts = {
    findings: findings.length,
    entities: entities.length,
    sources: sources.length,
    perspectives: perspectives.length,
    contradictions: contradictions.length,
    gaps: gaps.length,
    causalChains: causalChains.length,
  };

  const enabledSections: DataSourceType[] = [];
  if (composition.findings.enabled) enabledSections.push('findings');
  if (composition.entities.enabled) enabledSections.push('entities');
  if (composition.sources.enabled) enabledSections.push('sources');
  if (composition.perspectives.enabled) enabledSections.push('perspectives');
  if (composition.contradictions.enabled) enabledSections.push('contradictions');
  if (composition.gaps.enabled) enabledSections.push('gaps');
  if (composition.causalChains.enabled) enabledSections.push('causalChains');

  return {
    findings: extractFindings(findings, composition.findings),
    entities: extractEntities(entities, composition.entities),
    sources: extractSources(sources, composition.sources),
    perspectives: extractPerspectives(perspectives, composition.perspectives),
    contradictions: extractContradictions(contradictions, composition.contradictions),
    gaps: extractGaps(gaps, composition.gaps),
    causalChains: extractCausalChains(causalChains, composition.causalChains),
    totalCounts,
    enabledSections,
  };
}

// ============================================
// STATS COMPUTATION
// ============================================

export interface CustomTabStats {
  totalItems: number;
  filteredItems: number;
  filterRate: number; // 0-1 representing how much was filtered
  sectionStats: {
    [K in DataSourceType]: {
      total: number;
      filtered: number;
      enabled: boolean;
    };
  };
}

export function computeCustomTabStats(
  extracted: ExtractedCustomTabData
): CustomTabStats {
  const sectionStats: CustomTabStats['sectionStats'] = {
    findings: {
      total: extracted.totalCounts.findings,
      filtered: extracted.findings.length,
      enabled: extracted.enabledSections.includes('findings'),
    },
    entities: {
      total: extracted.totalCounts.entities,
      filtered: extracted.entities.length,
      enabled: extracted.enabledSections.includes('entities'),
    },
    sources: {
      total: extracted.totalCounts.sources,
      filtered: extracted.sources.length,
      enabled: extracted.enabledSections.includes('sources'),
    },
    perspectives: {
      total: extracted.totalCounts.perspectives,
      filtered: extracted.perspectives.length,
      enabled: extracted.enabledSections.includes('perspectives'),
    },
    contradictions: {
      total: extracted.totalCounts.contradictions,
      filtered: extracted.contradictions.length,
      enabled: extracted.enabledSections.includes('contradictions'),
    },
    gaps: {
      total: extracted.totalCounts.gaps,
      filtered: extracted.gaps.length,
      enabled: extracted.enabledSections.includes('gaps'),
    },
    causalChains: {
      total: extracted.totalCounts.causalChains,
      filtered: extracted.causalChains.length,
      enabled: extracted.enabledSections.includes('causalChains'),
    },
  };

  const totalItems = Object.values(extracted.totalCounts).reduce((a, b) => a + b, 0);
  const filteredItems =
    extracted.findings.length +
    extracted.entities.length +
    extracted.sources.length +
    extracted.perspectives.length +
    extracted.contradictions.length +
    extracted.gaps.length +
    extracted.causalChains.length;

  const filterRate = totalItems > 0 ? 1 - filteredItems / totalItems : 0;

  return {
    totalItems,
    filteredItems,
    filterRate,
    sectionStats,
  };
}

// ============================================
// HELPERS FOR UI
// ============================================

export const DATA_SOURCE_LABELS: Record<DataSourceType, string> = {
  findings: 'Findings',
  entities: 'Entities',
  sources: 'Sources',
  perspectives: 'Perspectives',
  contradictions: 'Contradictions',
  gaps: 'Gaps',
  causalChains: 'Causal Chains',
};

export const DATA_SOURCE_ICONS: Record<DataSourceType, string> = {
  findings: '📋',
  entities: '👤',
  sources: '🔗',
  perspectives: '🔍',
  contradictions: '⚡',
  gaps: '❓',
  causalChains: '🔄',
};

export const DATA_SOURCE_COLORS: Record<DataSourceType, string> = {
  findings: 'bg-blue-500',
  entities: 'bg-purple-500',
  sources: 'bg-green-500',
  perspectives: 'bg-amber-500',
  contradictions: 'bg-red-500',
  gaps: 'bg-orange-500',
  causalChains: 'bg-cyan-500',
};
