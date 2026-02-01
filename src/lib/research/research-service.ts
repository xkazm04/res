/**
 * Research service that orchestrates deep research using Gemini with Google Search grounding.
 *
 * Features:
 * - Session persistence to Supabase for recovery
 * - Email notification on completion/failure
 * - Incremental progress tracking
 */

import { GeminiClient, Source, TokenUsage } from './gemini-client';
import { TEMPLATE_CONFIGS, TemplateType, generateSearchQueries, extractFindings } from './templates';
import { sendResearchCompletedEmail, sendResearchFailedEmail } from './email-service';
import {
  createActorSession,
  updateActorSession,
  saveActorFindings,
  saveActorSources,
  saveActorPerspectives,
  saveActorReport,
} from '@/src/lib/supabase';

export interface Finding {
  findingId: string;
  findingType: string;
  content: string;
  summary?: string;
  confidenceScore: number;
  temporalContext: string;
  extractedData?: Record<string, unknown>;
  supportingSources?: { url: string; title: string }[];
}

export interface Perspective {
  perspectiveType: string;
  analysisText: string;
  keyInsights: string[];
  recommendations: string[];
  warnings: string[];
  confidence: number;
}

export interface CostSummary {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  geminiCostUsd: number;
  openrouterCostUsd: number;
  totalCostUsd: number;
}

export interface ResearchResult {
  sessionId: string;
  query: string;
  template: string;
  status: 'completed' | 'partial' | 'failed';
  findings: Finding[];
  perspectives: Perspective[];
  sources: Source[];
  searchQueriesExecuted: string[];
  reportMarkdown?: string;
  costSummary: CostSummary;
  executionTimeSeconds: number;
  errors: string[];
  warnings: string[];
}

export class ResearchService {
  private client: GeminiClient;
  private totalTokens = 0;
  private inputTokens = 0;
  private outputTokens = 0;
  private totalCost = 0;

  constructor(apiKey: string) {
    this.client = new GeminiClient(apiKey);
  }

  async executeResearch(
    query: string,
    templateType: TemplateType = 'investigative',
    granularity: string = 'standard',
    maxSearches: number = 5,
    generateReport: boolean = false,
    reportVariant: string = 'full_report',
    inputText?: string,
    options?: {
      userEmail?: string;
      persistToDb?: boolean;
      sendEmail?: boolean;
    }
  ): Promise<ResearchResult> {
    const startTime = Date.now();
    const sessionId = crypto.randomUUID();
    const errors: string[] = [];
    const warnings: string[] = [];

    const persistToDb = options?.persistToDb ?? true;
    const sendEmail = options?.sendEmail ?? !!options?.userEmail;
    const userEmail = options?.userEmail;

    this.resetTokenTracking();

    const templateConfig = TEMPLATE_CONFIGS[templateType];

    // Create session in database for persistence/recovery
    if (persistToDb) {
      try {
        await createActorSession({
          id: sessionId,
          query,
          template: templateType,
          status: 'running',
          granularity,
          max_searches: maxSearches,
          user_email: userEmail,
          progress_phase: 'initializing',
          progress_percent: 0,
        });
      } catch (e) {
        warnings.push('Session persistence unavailable - results will not be recoverable');
      }
    }

    try {
      // Phase 1: Generate search queries
      const searchQueries = await this.generateQueries(query, templateType, maxSearches, granularity);

      if (!searchQueries.length) {
        errors.push('Failed to generate search queries');
        return this.buildErrorResult(sessionId, query, templateType, errors, startTime);
      }

      // Phase 2: Execute grounded searches
      if (persistToDb) {
        await updateActorSession(sessionId, { progress_phase: 'searching', progress_percent: 20 });
      }
      const allSources: Source[] = [];
      const allContent: string[] = [];

      // Add input context if provided
      if (inputText) {
        allContent.push(`## Input Context\n\n${inputText}`);
      }

      for (let i = 0; i < searchQueries.length; i++) {
        const searchQuery = searchQueries[i];

        // Update progress during searches
        if (persistToDb && i % 2 === 0) {
          const searchProgress = 20 + Math.floor((i / searchQueries.length) * 30);
          await updateActorSession(sessionId, { progress_percent: searchProgress });
        }

        try {
          const result = await this.client.research(searchQuery);
          this.trackTokens(result.tokenUsage, result.costUsd);

          // Collect sources
          for (const source of result.sources) {
            // Deduplicate by URL
            if (!allSources.some(s => s.url === source.url)) {
              allSources.push(source);
            }
          }

          // Collect content
          if (result.text) {
            allContent.push(`## Search: ${searchQuery}\n\n${result.text}`);
          }
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          warnings.push(`Search failed for '${searchQuery.slice(0, 30)}...': ${errorMsg}`);
        }
      }

      // Phase 3: Assess source credibility
      const sourcesWithCredibility = allSources.map(s => ({
        ...s,
        credibilityScore: this.assessCredibility(s.domain),
        credibilityLabel: this.credibilityLabel(this.assessCredibility(s.domain)),
      }));

      // Phase 4: Extract findings
      if (persistToDb) {
        await updateActorSession(sessionId, { progress_phase: 'extracting_findings', progress_percent: 55 });
      }
      const synthesizedContent = allContent.join('\n\n---\n\n');
      const findings = await this.extractFindings(
        query,
        sourcesWithCredibility,
        synthesizedContent,
        templateType,
        granularity
      );

      // Add IDs and supporting sources
      findings.forEach((f, i) => {
        f.findingId = `f${i + 1}`;
        f.supportingSources = sourcesWithCredibility.slice(0, 3).map(s => ({
          url: s.url,
          title: s.title,
        }));
      });

      // Phase 5: Multi-perspective analysis
      if (persistToDb) {
        await updateActorSession(sessionId, { progress_phase: 'analyzing_perspectives', progress_percent: 70 });
      }
      const perspectives: Perspective[] = [];

      for (const perspectiveType of templateConfig.perspectives) {
        try {
          const analysis = await this.analyzePerspective(
            perspectiveType,
            findings,
            sourcesWithCredibility,
            query,
            templateConfig
          );
          perspectives.push(analysis);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          warnings.push(`Perspective analysis failed for '${perspectiveType}': ${errorMsg}`);
        }
      }

      // Phase 6: Generate report (optional)
      let reportMarkdown: string | undefined;
      if (generateReport) {
        if (persistToDb) {
          await updateActorSession(sessionId, { progress_phase: 'generating_report', progress_percent: 90 });
        }
        reportMarkdown = await this.generateReport(
          query,
          findings,
          perspectives,
          sourcesWithCredibility,
          reportVariant
        );
      }

      const executionTime = (Date.now() - startTime) / 1000;

      const result: ResearchResult = {
        sessionId,
        query,
        template: templateType,
        status: errors.length > 0 ? 'partial' : 'completed',
        findings,
        perspectives,
        sources: sourcesWithCredibility,
        searchQueriesExecuted: searchQueries,
        reportMarkdown,
        costSummary: {
          totalTokens: this.totalTokens,
          inputTokens: this.inputTokens,
          outputTokens: this.outputTokens,
          geminiCostUsd: this.totalCost,
          openrouterCostUsd: 0,
          totalCostUsd: this.totalCost,
        },
        executionTimeSeconds: Math.round(executionTime * 100) / 100,
        errors,
        warnings,
      };

      // Save results to database for recovery
      if (persistToDb) {
        try {
          await Promise.all([
            saveActorFindings(sessionId, findings.map(f => ({
              finding_id: f.findingId,
              finding_type: f.findingType,
              content: f.content,
              summary: f.summary,
              confidence_score: f.confidenceScore,
              temporal_context: f.temporalContext,
              extracted_data: f.extractedData,
            }))),
            saveActorSources(sessionId, sourcesWithCredibility.map(s => ({
              url: s.url,
              title: s.title,
              domain: s.domain,
              snippet: s.snippet,
              credibility_score: s.credibilityScore,
              credibility_label: s.credibilityLabel,
            }))),
            saveActorPerspectives(sessionId, perspectives.map(p => ({
              perspective_type: p.perspectiveType,
              analysis_text: p.analysisText,
              key_insights: p.keyInsights,
              recommendations: p.recommendations,
              warnings: p.warnings,
              confidence: p.confidence,
            }))),
          ]);

          await saveActorReport(sessionId, reportMarkdown || '', {
            total_tokens: this.totalTokens,
            total_cost_usd: this.totalCost,
          });
        } catch (e) {
          warnings.push('Failed to persist results - session may not be recoverable');
        }
      }

      // Send email notification if configured
      if (sendEmail && userEmail) {
        try {
          const emailResult = await sendResearchCompletedEmail(userEmail, {
            sessionId,
            query,
            template: templateType,
            findingsCount: findings.length,
            sourcesCount: sourcesWithCredibility.length,
            perspectivesCount: perspectives.length,
            executionTime,
            totalCost: this.totalCost,
            reportMarkdown,
          });
          if (!emailResult.success) {
            warnings.push(`Email notification failed: ${emailResult.error}`);
          }
        } catch (e) {
          warnings.push('Email notification failed');
        }
      }

      return result;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      errors.push(errorMsg);

      // Update session status to failed
      if (persistToDb) {
        await updateActorSession(sessionId, {
          status: 'failed',
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        });
      }

      // Send failure notification if email configured
      if (sendEmail && userEmail) {
        await sendResearchFailedEmail(userEmail, {
          sessionId,
          query,
          errorMessage: errorMsg,
        });
      }

      return this.buildErrorResult(sessionId, query, templateType, errors, startTime);
    }
  }

  private async generateQueries(
    query: string,
    templateType: TemplateType,
    maxSearches: number,
    granularity: string
  ): Promise<string[]> {
    const prompt = generateSearchQueries(query, templateType, maxSearches, granularity);

    const { data } = await this.client.generateJson<string[]>(prompt);
    this.trackJsonTokens();

    if (Array.isArray(data)) {
      return data.slice(0, maxSearches);
    }

    // Fallback: generate basic queries
    return [
      `${query} latest news analysis`,
      `${query} key facts timeline`,
      `${query} expert analysis 2024`,
    ].slice(0, maxSearches);
  }

  private async extractFindings(
    query: string,
    sources: Source[],
    synthesizedContent: string,
    templateType: TemplateType,
    granularity: string
  ): Promise<Finding[]> {
    const prompt = extractFindings(query, sources, synthesizedContent, templateType, granularity);

    const { data } = await this.client.generateJson<Array<{
      finding_type?: string;
      content?: string;
      summary?: string;
      confidence_score?: number;
      temporal_context?: string;
      extracted_data?: Record<string, unknown>;
    }>>(prompt);

    this.trackJsonTokens();

    if (!Array.isArray(data)) return [];

    return data.map(f => ({
      findingId: '',
      findingType: f.finding_type || 'fact',
      content: f.content || '',
      summary: f.summary,
      confidenceScore: f.confidence_score || 0.5,
      temporalContext: f.temporal_context || 'present',
      extractedData: f.extracted_data,
    }));
  }

  private async analyzePerspective(
    perspectiveType: string,
    findings: Finding[],
    sources: Source[],
    query: string,
    templateConfig: typeof TEMPLATE_CONFIGS[TemplateType]
  ): Promise<Perspective> {
    const perspectivePrompt = templateConfig.perspectivePrompts[perspectiveType] || '';

    const findingsContext = findings.slice(0, 15).map(f =>
      `- [${f.findingType.toUpperCase()}] ${f.summary || f.content.slice(0, 200)}`
    ).join('\n');

    const sourcesContext = sources.slice(0, 10).map(s =>
      `- ${s.title} (${s.domain})`
    ).join('\n');

    const prompt = `
${perspectivePrompt}

RESEARCH QUERY: ${query}

KEY FINDINGS:
${findingsContext}

SOURCES CONSULTED:
${sourcesContext}

Provide your analysis as JSON:
{
  "analysis_text": "Your detailed expert analysis (2-3 paragraphs)",
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "warnings": ["Warning or risk 1"],
  "confidence": 0.0-1.0
}
`;

    const { data } = await this.client.generateJson<{
      analysis_text?: string;
      key_insights?: string[];
      recommendations?: string[];
      warnings?: string[];
      confidence?: number;
    }>(prompt);

    this.trackJsonTokens();

    return {
      perspectiveType,
      analysisText: data?.analysis_text || `Analysis from ${perspectiveType} perspective.`,
      keyInsights: data?.key_insights || [],
      recommendations: data?.recommendations || [],
      warnings: data?.warnings || [],
      confidence: data?.confidence || 0.7,
    };
  }

  private async generateReport(
    query: string,
    findings: Finding[],
    perspectives: Perspective[],
    sources: Source[],
    variant: string
  ): Promise<string> {
    const findingsText = findings.map(f =>
      `### ${f.summary || 'Finding'}\n- **Type**: ${f.findingType}\n- **Confidence**: ${(f.confidenceScore * 100).toFixed(0)}%\n\n${f.content}`
    ).join('\n\n');

    const perspectivesText = perspectives.map(p =>
      `### ${p.perspectiveType} Perspective\n${p.analysisText}\n\n**Key Insights:**\n${p.keyInsights.map(i => `- ${i}`).join('\n')}`
    ).join('\n\n');

    const sourcesText = sources.slice(0, 20).map(s =>
      `- [${s.title}](${s.url}) - ${s.domain}`
    ).join('\n');

    const title = variant === 'executive_summary'
      ? `Executive Summary: ${query}`
      : variant === 'investment_thesis'
      ? `Investment Thesis: ${query}`
      : `Research Report: ${query}`;

    return `# ${title}

**Generated:** ${new Date().toISOString()}

---

## Executive Summary

This report presents findings from comprehensive research on: "${query}"

## Key Findings

${findingsText}

## Expert Perspectives

${perspectivesText}

## Sources

${sourcesText}

---

*Generated by Deep Research Actor with Gemini + Google Search grounding*
`;
  }

  private assessCredibility(domain: string): number {
    const d = domain.toLowerCase();

    // High credibility
    if (['gov', 'edu', 'reuters', 'ap', 'bbc', 'nytimes', 'wsj', 'ft.com', 'bloomberg', 'sec.gov'].some(h => d.includes(h))) {
      return 0.85;
    }

    // Medium-high credibility
    if (['forbes', 'businessinsider', 'cnbc', 'marketwatch', 'yahoo', 'cnn', 'washingtonpost'].some(h => d.includes(h))) {
      return 0.70;
    }

    return 0.55;
  }

  private credibilityLabel(score: number): string {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  private resetTokenTracking() {
    this.totalTokens = 0;
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.totalCost = 0;
  }

  private trackTokens(usage: TokenUsage | null, cost: number | null) {
    if (usage) {
      this.totalTokens += usage.totalTokens;
      this.inputTokens += usage.inputTokens;
      this.outputTokens += usage.outputTokens;
    }
    if (cost) {
      this.totalCost += cost;
    }
  }

  private trackJsonTokens() {
    // Estimate for JSON generation (no search tool)
    this.totalTokens += 500;
    this.inputTokens += 300;
    this.outputTokens += 200;
    this.totalCost += 0.0001;
  }

  private buildErrorResult(
    sessionId: string,
    query: string,
    template: string,
    errors: string[],
    startTime: number
  ): ResearchResult {
    return {
      sessionId,
      query,
      template,
      status: 'failed',
      findings: [],
      perspectives: [],
      sources: [],
      searchQueriesExecuted: [],
      costSummary: {
        totalTokens: this.totalTokens,
        inputTokens: this.inputTokens,
        outputTokens: this.outputTokens,
        geminiCostUsd: this.totalCost,
        openrouterCostUsd: 0,
        totalCostUsd: this.totalCost,
      },
      executionTimeSeconds: (Date.now() - startTime) / 1000,
      errors,
      warnings: [],
    };
  }
}
