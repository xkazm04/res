/**
 * Comparison Service
 *
 * Fetches existing Gemini sessions from Supabase and compares
 * against Claude Code research output for quality validation.
 */

import { supabaseServer } from '../../lib/supabase-server';
import { calculateMetrics, compareMetrics, formatMetricsReport } from './metrics';
import type { ActorOutput } from '../types';
import type { ResearchMetrics, MetricComparison } from './metrics';

/**
 * Database session data from Supabase.
 */
export interface GeminiSession {
  id: string;
  query: string;
  template_type: string;
  created_at: string;
  findings: DatabaseFinding[];
  sources: DatabaseSource[];
  perspectives: DatabasePerspective[];
}

interface DatabaseFinding {
  finding_type: string;
  content: string;
  summary?: string;
  confidence_score?: number;
  temporal_context?: string;
  extracted_data?: Record<string, unknown>;
  supporting_sources?: string[];
}

interface DatabaseSource {
  url: string;
  title?: string;
  domain?: string;
  credibility_score?: number;
  credibility_factors?: {
    label?: string;
  };
}

interface DatabasePerspective {
  perspective_type: string;
  analysis_text?: string;
  key_insights?: string[];
  recommendations?: string[];
  warnings?: string[];
  specialized_data?: {
    original_perspective_type?: string;
  };
}

/**
 * Result of comparing Claude vs Gemini output.
 */
export interface ComparisonResult {
  query: string;
  templateId: string;
  geminiSessionId: string;
  geminiMetrics: ResearchMetrics;
  claudeMetrics: ResearchMetrics;
  comparison: MetricComparison[];
  report: string;
}

/**
 * Service for comparing Claude Code research against existing Gemini output.
 */
export class ComparisonService {
  /**
   * Fetch an existing Gemini session by query and template.
   * Gemini sessions are identified by workspace_id = 'apify'.
   */
  async findGeminiSession(query: string, templateId: string): Promise<GeminiSession | null> {
    // Find session with matching query and template
    const { data: sessions } = await supabaseServer
      .from('research_sessions')
      .select('id, query, template_type, created_at')
      .eq('template_type', templateId)
      .eq('workspace_id', 'apify')
      .eq('status', 'completed')
      .ilike('query', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!sessions?.length) {
      return null;
    }

    const session = sessions[0];

    // Fetch related data
    const [findingsResult, sourcesResult, perspectivesResult] = await Promise.all([
      supabaseServer.from('research_findings').select('*').eq('session_id', session.id),
      supabaseServer.from('research_sources').select('*').eq('session_id', session.id),
      supabaseServer.from('research_perspectives').select('*').eq('session_id', session.id),
    ]);

    return {
      id: session.id,
      query: session.query,
      template_type: session.template_type,
      created_at: session.created_at,
      findings: (findingsResult.data || []) as DatabaseFinding[],
      sources: (sourcesResult.data || []) as DatabaseSource[],
      perspectives: (perspectivesResult.data || []) as DatabasePerspective[],
    };
  }

  /**
   * Convert Gemini session data to ActorOutput format for comparison.
   */
  geminiToActorOutput(session: GeminiSession): ActorOutput {
    return {
      query: session.query,
      template: session.template_type,
      status: 'completed',
      findings: session.findings.map((f) => ({
        finding_type: f.finding_type,
        content: f.content,
        summary: f.summary,
        confidence_score: f.confidence_score ?? 0,
        temporal_context: f.temporal_context,
        extracted_data: f.extracted_data,
        supporting_sources: f.supporting_sources || [],
      })),
      sources: session.sources.map((s) => ({
        url: s.url,
        title: s.title,
        domain: s.domain,
        credibility_score: s.credibility_score,
        credibility_label: s.credibility_factors?.label as 'high' | 'medium' | 'low' | undefined,
      })),
      perspectives: session.perspectives.map((p) => ({
        perspective_type: p.specialized_data?.original_perspective_type || p.perspective_type,
        analysis_text: p.analysis_text || '',
        key_insights: p.key_insights,
        recommendations: p.recommendations,
        warnings: p.warnings,
      })),
      contradictions: [],
      knowledge_gaps: [],
      search_queries_executed: [],
    };
  }

  /**
   * Compare Claude output against existing Gemini session.
   *
   * @param claudeOutput - Output from Claude Code research
   * @param geminiSessionId - Optional specific session ID to compare against
   */
  async compare(claudeOutput: ActorOutput, geminiSessionId?: string): Promise<ComparisonResult> {
    let geminiSession: GeminiSession | null = null;

    if (geminiSessionId) {
      // Fetch specific session
      const { data: sessions } = await supabaseServer
        .from('research_sessions')
        .select('id, query, template_type, created_at')
        .eq('id', geminiSessionId)
        .limit(1);

      if (sessions?.length) {
        const s = sessions[0];
        const [findingsResult, sourcesResult, perspectivesResult] = await Promise.all([
          supabaseServer.from('research_findings').select('*').eq('session_id', s.id),
          supabaseServer.from('research_sources').select('*').eq('session_id', s.id),
          supabaseServer.from('research_perspectives').select('*').eq('session_id', s.id),
        ]);
        geminiSession = {
          id: s.id,
          query: s.query,
          template_type: s.template_type,
          created_at: s.created_at,
          findings: (findingsResult.data || []) as DatabaseFinding[],
          sources: (sourcesResult.data || []) as DatabaseSource[],
          perspectives: (perspectivesResult.data || []) as DatabasePerspective[],
        };
      }
    } else {
      // Find matching session by query
      geminiSession = await this.findGeminiSession(claudeOutput.query, claudeOutput.template);
    }

    if (!geminiSession) {
      throw new Error(
        `No Gemini session found for query: "${claudeOutput.query}" template: ${claudeOutput.template}`
      );
    }

    const geminiOutput = this.geminiToActorOutput(geminiSession);
    const geminiMetrics = calculateMetrics(geminiOutput);
    const claudeMetrics = calculateMetrics(claudeOutput);
    const comparison = compareMetrics(geminiMetrics, claudeMetrics);

    const report = this.generateReport(
      claudeOutput.query,
      claudeOutput.template,
      geminiSession.id,
      geminiMetrics,
      claudeMetrics,
      comparison
    );

    return {
      query: claudeOutput.query,
      templateId: claudeOutput.template,
      geminiSessionId: geminiSession.id,
      geminiMetrics,
      claudeMetrics,
      comparison,
      report,
    };
  }

  /**
   * Generate human-readable comparison report.
   */
  private generateReport(
    query: string,
    templateId: string,
    geminiSessionId: string,
    geminiMetrics: ResearchMetrics,
    claudeMetrics: ResearchMetrics,
    comparison: MetricComparison[]
  ): string {
    const lines = [
      '='.repeat(70),
      'QUALITY COMPARISON REPORT',
      '='.repeat(70),
      '',
      `Query:    ${query}`,
      `Template: ${templateId}`,
      `Gemini Session: ${geminiSessionId}`,
      '',
      '-'.repeat(70),
      'GEMINI (Existing)',
      '-'.repeat(70),
      formatMetricsReport(geminiMetrics),
      '',
      '-'.repeat(70),
      'CLAUDE CODE (New)',
      '-'.repeat(70),
      formatMetricsReport(claudeMetrics),
      '',
      '-'.repeat(70),
      'COMPARISON',
      '-'.repeat(70),
      '',
      'Metric               Gemini    Claude    Diff      Winner',
      '-'.repeat(60),
    ];

    for (const c of comparison) {
      const metric = c.metric.padEnd(20);
      const gemini = String(c.gemini).padEnd(10);
      const claude = String(c.claude).padEnd(10);
      const diff = c.diff.padEnd(10);
      lines.push(`${metric}${gemini}${claude}${diff}${c.winner}`);
    }

    lines.push('');
    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}
