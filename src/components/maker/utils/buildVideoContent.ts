import type { VideoContent } from '@/src/lib/videoShowcaseMockData';
import type { SessionWithDetails } from '@/src/types/research';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';

/**
 * Builds video content from session data.
 * Converts research session findings into video-ready content.
 */
export function buildVideoContent(session: SessionWithDetails): VideoContent {
  const findings = session.findings || [];
  const perspectives = session.perspectives || [];

  // Extract key narratives from high-confidence findings
  const keyNarratives = findings
    .filter((f) => f.confidence_score && f.confidence_score > 0.7)
    .slice(0, 5)
    .map((f) => f.summary || f.content.slice(0, 100));

  // Extract warnings from perspectives
  const warnings = perspectives.flatMap((p) => p.warnings || []).slice(0, 3);

  // Extract patterns
  const patterns = findings
    .filter((f) => f.finding_type === 'pattern')
    .slice(0, 3)
    .map((f) => ({
      pattern: f.summary || f.content.slice(0, 50),
      evidence: f.content.slice(0, 100),
      implication: 'Further investigation needed',
    }));

  // Extract red flags
  const redFlags = perspectives
    .flatMap((p) => p.warnings || [])
    .slice(0, 5)
    .map((w) => ({
      flag: w,
      severity: 'medium' as const,
      evidence: 'From analysis',
    }));

  return {
    hook: session.query || session.title,
    title: session.title,
    subtitle: session.query || '',
    keyNarratives: keyNarratives.length > 0 ? keyNarratives : ['Research findings available'],
    warnings: warnings.length > 0 ? warnings : [],
    verdict: perspectives[0]?.analysis_text?.slice(0, 200) || 'Analysis complete',
    verdictType: 'mixed',
    patterns,
    redFlags,
  };
}

/**
 * Builds video content from draft selection state.
 * Uses selected items, rewrites, and enrichments to create curated video content.
 */
export function buildVideoContentFromDraft(
  session: SessionWithDetails,
  selectionState: ContentSelectionState
): VideoContent {
  const { selection, rewrites } = selectionState;

  // Filter to selected items only
  const selectedFindings = (session.findings || [])
    .filter(f => selection.selectedFindings.includes(f.id));
  const selectedPerspectives = (session.perspectives || [])
    .filter(p => selection.selectedPerspectives.includes(p.id));

  // Key narratives: use rewrite if available, else original
  const keyNarratives = selectedFindings
    .slice(0, 5)
    .map(f => {
      const rw = rewrites.get(f.id);
      return rw ? rw.optimized : (f.summary || f.content.slice(0, 100));
    });

  // Warnings from selected perspectives only
  const warnings = selectedPerspectives
    .flatMap(p => p.warnings || [])
    .slice(0, 3);

  // Patterns from selected findings only
  const patterns = selectedFindings
    .filter(f => f.finding_type === 'pattern')
    .slice(0, 3)
    .map(f => {
      const rw = rewrites.get(f.id);
      return {
        pattern: rw ? rw.optimized : (f.summary || f.content.slice(0, 50)),
        evidence: f.content.slice(0, 100),
        implication: 'Further investigation needed',
      };
    });

  // Red flags from selected perspectives only
  const redFlags = selectedPerspectives
    .flatMap(p => p.warnings || [])
    .slice(0, 5)
    .map(w => ({
      flag: w,
      severity: 'medium' as const,
      evidence: 'From analysis',
    }));

  // Verdict from first selected perspective
  const verdict = selectedPerspectives[0]?.analysis_text?.slice(0, 200) || 'Analysis complete';

  return {
    hook: session.query || session.title,
    title: session.title,
    subtitle: session.query || '',
    keyNarratives: keyNarratives.length > 0 ? keyNarratives : ['Research findings available'],
    warnings,
    verdict,
    verdictType: 'mixed',
    patterns,
    redFlags,
  };
}

/**
 * Check if selection state has any meaningful selection
 */
export function hasSelection(selectionState: ContentSelectionState): boolean {
  const { selection } = selectionState;
  return (
    selection.selectedFindings.length > 0 ||
    selection.selectedPerspectives.length > 0 ||
    selection.selectedContradictions.length > 0 ||
    selection.selectedGaps.length > 0 ||
    selection.selectedCausalChains.length > 0
  );
}
