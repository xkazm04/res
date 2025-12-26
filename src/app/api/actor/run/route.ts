import { NextRequest, NextResponse } from 'next/server';
import { ResearchService, Finding, Perspective } from '@/src/lib/research/research-service';
import type { TemplateType } from '@/src/lib/research/templates';
import type { Source } from '@/src/lib/research/gemini-client';

interface ActorInput {
  query: string;
  template: string;
  granularity: string;
  max_searches: number;
  generate_report: boolean;
  report_variant: string;
  input_text?: string;
  perspectives?: string[];
  user_email?: string;
  persist_to_db?: boolean;
  send_email_on_complete?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const input: ActorInput = await request.json();

    // Validate required fields
    if (!input.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // API key from environment variable
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured in environment' },
        { status: 500 }
      );
    }

    console.log(`[Research] Starting research for: ${input.query.slice(0, 50)}...`);
    console.log(`[Research] Template: ${input.template}, Granularity: ${input.granularity}, Max searches: ${input.max_searches}`);

    // Initialize research service
    const researchService = new ResearchService(googleApiKey);

    // Execute research with persistence and email options
    const result = await researchService.executeResearch(
      input.query,
      input.template as TemplateType,
      input.granularity,
      input.max_searches,
      input.generate_report,
      input.report_variant,
      input.input_text,
      {
        userEmail: input.user_email,
        persistToDb: input.persist_to_db ?? true,
        sendEmail: input.send_email_on_complete ?? !!input.user_email,
      }
    );

    console.log(`[Research] Completed: ${result.findings.length} findings, ${result.sources.length} sources, ${result.perspectives.length} perspectives`);
    console.log(`[Research] Status: ${result.status}, Tokens: ${result.costSummary.totalTokens}, Cost: $${result.costSummary.totalCostUsd.toFixed(4)}`);

    // Transform to match expected output format
    const output = {
      session_id: result.sessionId,
      query: result.query,
      template: result.template,
      status: result.status,
      findings: result.findings.map((f: Finding) => ({
        finding_id: f.findingId,
        finding_type: f.findingType,
        content: f.content,
        summary: f.summary,
        confidence_score: f.confidenceScore,
        temporal_context: f.temporalContext,
        extracted_data: f.extractedData,
        supporting_sources: f.supportingSources,
      })),
      perspectives: result.perspectives.map((p: Perspective) => ({
        perspective_type: p.perspectiveType,
        analysis_text: p.analysisText,
        key_insights: p.keyInsights,
        recommendations: p.recommendations,
        warnings: p.warnings,
        confidence: p.confidence,
      })),
      sources: result.sources.map((s: Source & { credibilityScore?: number; credibilityLabel?: string }) => ({
        url: s.url,
        title: s.title,
        domain: s.domain,
        snippet: s.snippet,
        source_type: s.sourceType,
        credibility_score: s.credibilityScore,
        credibility_label: s.credibilityLabel,
      })),
      search_queries_executed: result.searchQueriesExecuted,
      report_markdown: result.reportMarkdown,
      cost_summary: {
        total_tokens: result.costSummary.totalTokens,
        input_tokens: result.costSummary.inputTokens,
        output_tokens: result.costSummary.outputTokens,
        gemini_cost_usd: result.costSummary.geminiCostUsd,
        openrouter_cost_usd: result.costSummary.openrouterCostUsd,
        total_cost_usd: result.costSummary.totalCostUsd,
      },
      execution_time_seconds: result.executionTimeSeconds,
      errors: result.errors,
      warnings: result.warnings,
    };

    return NextResponse.json(output);
  } catch (error) {
    console.error('[Research] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
