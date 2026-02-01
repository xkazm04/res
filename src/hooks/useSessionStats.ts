'use client';

import { useMemo } from 'react';
import type { SessionWithDetails } from '@/src/types/research';

export interface SessionStats {
  findings: number;
  sources: number;
  perspectives: number;
  contradictions: number;
  gaps: number;
  avgConfidence: number;
  /** Findings with confidence >= 0.8 */
  highConfidence: number;
  /** Findings with confidence >= 0.5 and < 0.8 */
  medConfidence: number;
  /** Findings with confidence < 0.5 */
  lowConfidence: number;
  redFlags: number;
  entities: number;
}

/**
 * Memoizes session stats based on stable primitives (session.id and array lengths)
 * instead of the entire session object reference.
 *
 * This prevents recalculation on every tab change since the dependency array
 * only changes when actual data changes, not when the session object reference changes.
 */
export function useSessionStats(session: SessionWithDetails): SessionStats {
  const findings = session.findings || [];
  const sources = session.sources || [];
  const perspectives = session.perspectives || [];
  const contradictions = session.contradictions || [];
  const gaps = session.gaps || [];
  const entities = session.entities || [];

  // Memoize based on session.id and array lengths - stable primitives
  // These only change when actual data changes, not on every render
  return useMemo(() => {
    const avgConfidence = findings.length > 0
      ? Math.round(findings.reduce((sum, f) => sum + (f.confidence_score || 0), 0) / findings.length * 100)
      : 0;

    // Calculate confidence distribution in one pass
    let highConfidence = 0;
    let medConfidence = 0;
    let lowConfidence = 0;
    let redFlags = 0;

    for (const f of findings) {
      const conf = f.confidence_score || 0;
      if (conf >= 0.8) highConfidence++;
      else if (conf >= 0.5) medConfidence++;
      else lowConfidence++;

      if (f.finding_type === 'gap' || f.content.toLowerCase().includes('risk')) {
        redFlags++;
      }
    }

    return {
      findings: findings.length,
      sources: sources.length,
      perspectives: perspectives.length,
      contradictions: contradictions.length,
      gaps: gaps.length,
      avgConfidence,
      highConfidence,
      medConfidence,
      lowConfidence,
      redFlags,
      entities: entities.length,
    };
  }, [
    session.id,
    findings.length,
    sources.length,
    perspectives.length,
    contradictions.length,
    gaps.length,
    entities.length,
    // Include findings array reference only for the content-dependent calculations
    // This is still more stable than depending on the entire session object
    findings,
  ]);
}
