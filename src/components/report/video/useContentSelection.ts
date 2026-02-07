'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { SessionWithDetails } from '@/src/types/research';

/** Video sections that content can be assigned to */
export type VideoSection = 'metrics' | 'charts' | 'insights' | 'summary';

export const VIDEO_SECTIONS: { key: VideoSection; label: string; icon: string; description: string }[] = [
  { key: 'metrics', label: 'Metrics', icon: 'bar-chart-3', description: 'Key numbers & statistics' },
  { key: 'charts', label: 'Charts', icon: 'trending-up', description: 'Data visualizations' },
  { key: 'insights', label: 'Insights', icon: 'lightbulb', description: 'Key findings & alerts' },
  { key: 'summary', label: 'Summary', icon: 'target', description: 'Verdict & conclusion' },
];

export interface VideoContentSelection {
  selectedFindings: string[];
  selectedPerspectives: string[];
  selectedContradictions: string[];
  selectedGaps: string[];
  selectedCausalChains: string[];
  /** Map of item ID to assigned video sections */
  sectionAssignments: Record<string, VideoSection[]>;
}

export interface SelectableItem {
  id: string;
  /** Short display title (~120 chars, for list rows) */
  title: string;
  /** Full content text (untruncated) */
  content: string;
  confidence: number;
  type: string;
  category: 'finding' | 'perspective' | 'contradiction' | 'gap' | 'causal_chain';
  /** Raw data for LLM context */
  rawData?: Record<string, unknown>;
}

export interface ContentSelectionState {
  selection: VideoContentSelection;
  availableItems: {
    findings: SelectableItem[];
    perspectives: SelectableItem[];
    analysis: SelectableItem[]; // contradictions + gaps + causal chains
  };
  counts: {
    findings: { selected: number; total: number };
    perspectives: { selected: number; total: number };
    analysis: { selected: number; total: number };
  };
  /** Count of items assigned to each video section */
  sectionCounts: Record<VideoSection, number>;
  toggleItem: (category: 'findings' | 'perspectives' | 'analysis', id: string) => void;
  selectAll: (category: 'findings' | 'perspectives' | 'analysis') => void;
  deselectAll: (category: 'findings' | 'perspectives' | 'analysis') => void;
  /** Toggle a video section assignment for an item */
  toggleSection: (itemId: string, section: VideoSection) => void;
  /** Get sections assigned to an item */
  getSections: (itemId: string) => VideoSection[];
  /** Assign all selected items to a section */
  assignAllToSection: (section: VideoSection) => void;
  /** Clear all section assignments */
  clearSectionAssignments: () => void;
  resetToDefaults: () => void;
  /** Directly set the entire selection (used by AI compose) */
  setSelection: (selection: VideoContentSelection) => void;
  /** AI enrichments keyed by item ID */
  enrichments: Map<string, Array<{ type: string; content: string; source?: string }>>;
  /** AI rewrites keyed by item ID */
  rewrites: Map<string, { original: string; optimized: string }>;
  setEnrichments: (enrichments: Array<{ itemId: string; type: string; content: string; source?: string }>) => void;
  setRewrites: (rewrites: Array<{ itemId: string; originalContent: string; optimizedContent: string }>) => void;
}

/**
 * Generates default selection based on content quality/importance
 * - Top 10 findings by confidence
 * - Top 3 perspectives by confidence
 * - First 2 contradictions, gaps, causal chains
 *
 * Also assigns default video sections:
 * - Findings with numbers -> metrics
 * - Findings with patterns/relationships -> charts
 * - Perspectives insights -> insights
 * - High-confidence items -> summary
 */
function getDefaultSelection(session: SessionWithDetails): VideoContentSelection {
  const findings = session.findings || [];
  const perspectives = session.perspectives || [];
  const contradictions = session.contradictions || [];
  const gaps = session.gaps || [];
  const causalChains = session.causal_chains || [];

  // Sort findings by confidence and take top 10
  const sortedFindings = [...findings].sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
  const topFindings = sortedFindings.slice(0, 10).map(f => f.id);

  // Sort perspectives by confidence and take top 3
  const sortedPerspectives = [...perspectives].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const topPerspectives = sortedPerspectives.slice(0, 3).map(p => p.id);

  // Take first 2 of each analysis type
  const selectedContradictions = contradictions.slice(0, 2).map(c => c.id);
  const selectedGaps = gaps.slice(0, 2).map(g => g.id);
  const selectedCausalChains = causalChains.slice(0, 2).map(c => c.id);

  // Build default section assignments based on content type and characteristics
  const sectionAssignments: Record<string, VideoSection[]> = {};

  // Assign findings based on type
  sortedFindings.slice(0, 10).forEach((f, i) => {
    const sections: VideoSection[] = [];

    // Facts and events often have extractable metrics
    if (['fact', 'event', 'evidence'].includes(f.finding_type)) {
      sections.push('metrics');
    }
    // Patterns and relationships are good for charts
    if (['pattern', 'relationship', 'actor'].includes(f.finding_type)) {
      sections.push('charts');
    }
    // Top 3 go to insights
    if (i < 3) {
      sections.push('insights');
    }
    // Top 2 high-confidence go to summary
    if (i < 2 && (f.confidence_score || 0) >= 0.8) {
      sections.push('summary');
    }

    if (sections.length > 0) {
      sectionAssignments[f.id] = sections;
    }
  });

  // Assign perspectives to insights
  sortedPerspectives.slice(0, 3).forEach(p => {
    sectionAssignments[p.id] = ['insights'];
    // High-confidence perspectives also go to summary
    if ((p.confidence || 0) >= 0.8) {
      sectionAssignments[p.id].push('summary');
    }
  });

  // Contradictions are insightful
  selectedContradictions.forEach(id => {
    sectionAssignments[id] = ['insights'];
  });

  // Gaps indicate areas needing attention
  selectedGaps.forEach(id => {
    sectionAssignments[id] = ['insights'];
  });

  // Causal chains are good for charts (flow visualization)
  selectedCausalChains.forEach(id => {
    sectionAssignments[id] = ['charts'];
  });

  return {
    selectedFindings: topFindings,
    selectedPerspectives: topPerspectives,
    selectedContradictions,
    selectedGaps,
    selectedCausalChains,
    sectionAssignments,
  };
}

/**
 * Transform session data into selectable items for the UI
 * Includes rawData for LLM context during curation
 */
function buildSelectableItems(session: SessionWithDetails): {
  findings: SelectableItem[];
  perspectives: SelectableItem[];
  analysis: SelectableItem[];
} {
  const findings = (session.findings || []).map(f => ({
    id: f.id,
    title: f.summary || (f.content.length > 120 ? f.content.slice(0, 120) + '...' : f.content),
    content: f.content,
    confidence: Math.round((f.confidence_score || 0.5) * 100),
    type: f.finding_type,
    category: 'finding' as const,
    rawData: {
      fullContent: f.content,
      summary: f.summary,
      temporalContext: f.temporal_context,
      eventDate: f.event_date,
      extractedData: f.extracted_data,
      supportingSources: f.supporting_sources,
    },
  }));

  const perspectives = (session.perspectives || []).map(p => {
    const insight = p.key_insights?.[0] || p.analysis_text;
    return {
      id: p.id,
      title: insight.length > 120 ? insight.slice(0, 120) + '...' : insight,
      content: p.analysis_text,
      confidence: Math.round((p.confidence || 0.7) * 100),
      type: p.perspective_type,
      category: 'perspective' as const,
      rawData: {
        analysisText: p.analysis_text,
        keyInsights: p.key_insights,
        recommendations: p.recommendations,
        warnings: p.warnings,
        specializedData: p.specialized_data,
      },
    };
  });

  const contradictions: SelectableItem[] = (session.contradictions || []).map(c => ({
    id: c.id,
    title: `${c.claim_1.slice(0, 55)} vs ${c.claim_2.slice(0, 55)}`,
    content: `${c.claim_1}\n\nvs\n\n${c.claim_2}`,
    confidence: 90,
    type: 'contradiction',
    category: 'contradiction' as const,
    rawData: {
      claim1: c.claim_1,
      claim2: c.claim_2,
      source1: c.source_1,
      source2: c.source_2,
      significance: c.significance,
      resolutionHint: c.resolution_hint,
    },
  }));

  const gaps: SelectableItem[] = (session.gaps || []).map(g => ({
    id: g.id,
    title: g.description.length > 120 ? g.description.slice(0, 120) + '...' : g.description,
    content: g.description,
    confidence: g.priority === 'high' ? 85 : g.priority === 'medium' ? 70 : 55,
    type: g.gap_type,
    category: 'gap' as const,
    rawData: {
      fullDescription: g.description,
      priority: g.priority,
      suggestedQueries: g.suggested_queries,
      gapStart: g.gap_start,
      gapEnd: g.gap_end,
      missingActor: g.missing_actor,
    },
  }));

  const causalChains: SelectableItem[] = (session.causal_chains || []).map(c => {
    const joined = c.descriptions.join(' -> ');
    return {
      id: c.id,
      title: joined.length > 120 ? joined.slice(0, 120) + '...' : joined,
      content: c.descriptions.join(' -> '),
      confidence: 80,
      type: 'causal',
      category: 'causal_chain' as const,
      rawData: {
        findingIds: c.finding_ids,
        descriptions: c.descriptions,
      },
    };
  });

  return {
    findings: findings.sort((a, b) => b.confidence - a.confidence),
    perspectives: perspectives.sort((a, b) => b.confidence - a.confidence),
    analysis: [...contradictions, ...gaps, ...causalChains].sort((a, b) => b.confidence - a.confidence),
  };
}

const EMPTY_SELECTION: VideoContentSelection = {
  selectedFindings: [],
  selectedPerspectives: [],
  selectedContradictions: [],
  selectedGaps: [],
  selectedCausalChains: [],
  sectionAssignments: {},
};

const EMPTY_ITEMS = { findings: [] as SelectableItem[], perspectives: [] as SelectableItem[], analysis: [] as SelectableItem[] };

export function useContentSelection(session: SessionWithDetails | null): ContentSelectionState {
  const defaultSelection = useMemo(() => session ? getDefaultSelection(session) : EMPTY_SELECTION, [session]);
  const [selection, setSelection] = useState<VideoContentSelection>(defaultSelection);
  const [enrichments, setEnrichmentsMap] = useState<Map<string, Array<{ type: string; content: string; source?: string }>>>(new Map());
  const [rewrites, setRewritesMap] = useState<Map<string, { original: string; optimized: string }>>(new Map());

  const availableItems = useMemo(() => session ? buildSelectableItems(session) : EMPTY_ITEMS, [session]);

  // Reset when session changes (since hook is now lifted to page level)
  const prevSessionId = useRef(session?.id);
  useEffect(() => {
    if (session?.id !== prevSessionId.current) {
      prevSessionId.current = session?.id;
      setSelection(defaultSelection);
      setEnrichmentsMap(new Map());
      setRewritesMap(new Map());
    }
  }, [session?.id, defaultSelection]);

  const counts = useMemo(() => {
    const analysisSelected = [
      ...selection.selectedContradictions,
      ...selection.selectedGaps,
      ...selection.selectedCausalChains,
    ];

    return {
      findings: { selected: selection.selectedFindings.length, total: availableItems.findings.length },
      perspectives: { selected: selection.selectedPerspectives.length, total: availableItems.perspectives.length },
      analysis: { selected: analysisSelected.length, total: availableItems.analysis.length },
    };
  }, [selection, availableItems]);

  // Count items assigned to each video section
  const sectionCounts = useMemo(() => {
    const counts: Record<VideoSection, number> = {
      metrics: 0,
      charts: 0,
      insights: 0,
      summary: 0,
    };

    Object.values(selection.sectionAssignments).forEach(sections => {
      sections.forEach(section => {
        counts[section]++;
      });
    });

    return counts;
  }, [selection.sectionAssignments]);

  const toggleItem = useCallback((category: 'findings' | 'perspectives' | 'analysis', id: string) => {
    setSelection(prev => {
      if (category === 'findings') {
        const isSelected = prev.selectedFindings.includes(id);
        return {
          ...prev,
          selectedFindings: isSelected
            ? prev.selectedFindings.filter(fid => fid !== id)
            : [...prev.selectedFindings, id],
        };
      }
      if (category === 'perspectives') {
        const isSelected = prev.selectedPerspectives.includes(id);
        return {
          ...prev,
          selectedPerspectives: isSelected
            ? prev.selectedPerspectives.filter(pid => pid !== id)
            : [...prev.selectedPerspectives, id],
        };
      }
      // Analysis: need to find which sub-category it belongs to
      const item = availableItems.analysis.find(a => a.id === id);
      if (!item) return prev;

      if (item.category === 'contradiction') {
        const isSelected = prev.selectedContradictions.includes(id);
        return {
          ...prev,
          selectedContradictions: isSelected
            ? prev.selectedContradictions.filter(cid => cid !== id)
            : [...prev.selectedContradictions, id],
        };
      }
      if (item.category === 'gap') {
        const isSelected = prev.selectedGaps.includes(id);
        return {
          ...prev,
          selectedGaps: isSelected
            ? prev.selectedGaps.filter(gid => gid !== id)
            : [...prev.selectedGaps, id],
        };
      }
      if (item.category === 'causal_chain') {
        const isSelected = prev.selectedCausalChains.includes(id);
        return {
          ...prev,
          selectedCausalChains: isSelected
            ? prev.selectedCausalChains.filter(cid => cid !== id)
            : [...prev.selectedCausalChains, id],
        };
      }
      return prev;
    });
  }, [availableItems.analysis]);

  const selectAll = useCallback((category: 'findings' | 'perspectives' | 'analysis') => {
    setSelection(prev => {
      if (category === 'findings') {
        return { ...prev, selectedFindings: availableItems.findings.map(f => f.id) };
      }
      if (category === 'perspectives') {
        return { ...prev, selectedPerspectives: availableItems.perspectives.map(p => p.id) };
      }
      // Analysis: select all
      const contradictions = availableItems.analysis.filter(a => a.category === 'contradiction').map(a => a.id);
      const gaps = availableItems.analysis.filter(a => a.category === 'gap').map(a => a.id);
      const causalChains = availableItems.analysis.filter(a => a.category === 'causal_chain').map(a => a.id);
      return {
        ...prev,
        selectedContradictions: contradictions,
        selectedGaps: gaps,
        selectedCausalChains: causalChains,
      };
    });
  }, [availableItems]);

  const deselectAll = useCallback((category: 'findings' | 'perspectives' | 'analysis') => {
    setSelection(prev => {
      if (category === 'findings') {
        return { ...prev, selectedFindings: [] };
      }
      if (category === 'perspectives') {
        return { ...prev, selectedPerspectives: [] };
      }
      return {
        ...prev,
        selectedContradictions: [],
        selectedGaps: [],
        selectedCausalChains: [],
      };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setSelection(defaultSelection);
  }, [defaultSelection]);

  // Toggle a video section assignment for an item
  const toggleSection = useCallback((itemId: string, section: VideoSection) => {
    setSelection(prev => {
      const currentSections = prev.sectionAssignments[itemId] || [];
      const hasSection = currentSections.includes(section);

      const newSections = hasSection
        ? currentSections.filter(s => s !== section)
        : [...currentSections, section];

      return {
        ...prev,
        sectionAssignments: {
          ...prev.sectionAssignments,
          [itemId]: newSections,
        },
      };
    });
  }, []);

  // Get sections assigned to an item
  const getSections = useCallback((itemId: string): VideoSection[] => {
    return selection.sectionAssignments[itemId] || [];
  }, [selection.sectionAssignments]);

  // Assign all selected items to a section
  const assignAllToSection = useCallback((section: VideoSection) => {
    setSelection(prev => {
      const allSelectedIds = [
        ...prev.selectedFindings,
        ...prev.selectedPerspectives,
        ...prev.selectedContradictions,
        ...prev.selectedGaps,
        ...prev.selectedCausalChains,
      ];

      const newAssignments = { ...prev.sectionAssignments };
      allSelectedIds.forEach(id => {
        const current = newAssignments[id] || [];
        if (!current.includes(section)) {
          newAssignments[id] = [...current, section];
        }
      });

      return {
        ...prev,
        sectionAssignments: newAssignments,
      };
    });
  }, []);

  // Clear all section assignments
  const clearSectionAssignments = useCallback(() => {
    setSelection(prev => ({
      ...prev,
      sectionAssignments: {},
    }));
  }, []);

  // Set enrichments from AI compose result
  const setEnrichments = useCallback((items: Array<{ itemId: string; type: string; content: string; source?: string }>) => {
    const map = new Map<string, Array<{ type: string; content: string; source?: string }>>();
    for (const item of items) {
      const existing = map.get(item.itemId) || [];
      existing.push({ type: item.type, content: item.content, source: item.source });
      map.set(item.itemId, existing);
    }
    setEnrichmentsMap(map);
  }, []);

  // Set rewrites from AI compose result
  const setRewrites = useCallback((items: Array<{ itemId: string; originalContent: string; optimizedContent: string }>) => {
    const map = new Map<string, { original: string; optimized: string }>();
    for (const item of items) {
      map.set(item.itemId, { original: item.originalContent, optimized: item.optimizedContent });
    }
    setRewritesMap(map);
  }, []);

  return {
    selection,
    availableItems,
    counts,
    sectionCounts,
    toggleItem,
    selectAll,
    deselectAll,
    toggleSection,
    getSections,
    assignAllToSection,
    clearSectionAssignments,
    resetToDefaults,
    setSelection,
    enrichments,
    rewrites,
    setEnrichments,
    setRewrites,
  };
}
