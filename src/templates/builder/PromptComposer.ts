/**
 * PromptComposer
 *
 * Assembles complete research prompts from template configurations
 * and static section files. Handles placeholder interpolation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TemplateConfig, Granularity, GRANULARITY_CONFIGS } from '../types';

// ============================================
// INTERFACES
// ============================================

/**
 * Parameters for building a research prompt.
 */
export interface ResearchParams {
  /** The research query/question */
  query: string;

  /** Research depth level */
  granularity: Granularity;

  /** Override default perspectives (optional) */
  perspectives?: string[];
}

// ============================================
// PROMPT COMPOSER CLASS
// ============================================

/**
 * Composes research prompts from template configs and section files.
 *
 * @example
 * ```typescript
 * const composer = new PromptComposer();
 * const prompt = composer.buildResearchPrompt(techMarketConfig, {
 *   query: 'AI chips market',
 *   granularity: 'standard',
 * });
 * ```
 */
export class PromptComposer {
  private sectionsDir: string;

  /**
   * Create a new PromptComposer.
   *
   * @param sectionsDir - Path to sections directory (default: src/templates/sections)
   */
  constructor(sectionsDir?: string) {
    this.sectionsDir = sectionsDir || path.join(process.cwd(), 'src/templates/sections');
  }

  // ----------------------------------------
  // PRIVATE: Section Reading
  // ----------------------------------------

  /**
   * Read a section file and return its content.
   *
   * @param relativePath - Path relative to sections directory
   * @returns File content as string
   * @throws Error if file not found
   */
  private readSection(relativePath: string): string {
    const fullPath = path.join(this.sectionsDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Section file not found: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * Try to read a section file, returning empty string if not found.
   * Used for optional sections.
   *
   * @param relativePath - Path relative to sections directory
   * @returns File content or empty string
   */
  private tryReadSection(relativePath: string): string {
    const fullPath = path.join(this.sectionsDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      return '';
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  // ----------------------------------------
  // PRIVATE: Section Building
  // ----------------------------------------

  /**
   * Build the search angles section from config.
   *
   * @param angles - Template search angles
   * @returns Formatted markdown string
   */
  private buildAnglesSection(angles: TemplateConfig['searchAngles']): string {
    return angles.map(angle => {
      const items = angle.items.map(item => `  - ${item}`).join('\n');
      return `**${angle.name}**\n${items}`;
    }).join('\n\n');
  }

  /**
   * Build the finding types section from config.
   *
   * @param findingTypes - Template finding types
   * @returns Formatted markdown string
   */
  private buildFindingTypesSection(findingTypes: TemplateConfig['findingTypes']): string {
    return findingTypes.map(ft => {
      return `**${ft.name}** (${ft.displayName})\n${ft.description}\nSchema hint: ${ft.extractedDataSchema}`;
    }).join('\n\n');
  }

  /**
   * Build the perspectives section.
   *
   * @param perspectives - List of perspective names
   * @returns Numbered list as markdown string
   */
  private buildPerspectivesSection(perspectives: string[]): string {
    return perspectives.map((p, i) => `${i + 1}. ${p}`).join('\n');
  }

  // ----------------------------------------
  // PRIVATE: Interpolation
  // ----------------------------------------

  /**
   * Interpolate placeholders in content with values.
   * Replaces {{key}} with corresponding value.
   *
   * @param content - Template content with placeholders
   * @param values - Key-value map for replacements
   * @returns Interpolated content
   */
  private interpolate(content: string, values: Record<string, string | number>): string {
    let result = content;
    for (const [key, value] of Object.entries(values)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, String(value));
    }
    return result;
  }

  // ----------------------------------------
  // PUBLIC: Prompt Building
  // ----------------------------------------

  /**
   * Build complete research prompt from config and params.
   *
   * Assembles sections from src/templates/sections/ and interpolates
   * template-specific values. Returns a complete markdown prompt
   * ready for Claude CLI execution.
   *
   * @param config - Template configuration
   * @param params - Research parameters (query, granularity)
   * @returns Complete research prompt as markdown string
   */
  buildResearchPrompt(config: TemplateConfig, params: ResearchParams): string {
    const granularityConfig = GRANULARITY_CONFIGS[params.granularity];
    const perspectives = params.perspectives || config.perspectives.slice(0, granularityConfig.perspectiveCount);

    // Build dynamic sections from config
    const anglesSection = this.buildAnglesSection(config.searchAngles);
    const findingTypesSection = this.buildFindingTypesSection(config.findingTypes);
    const perspectivesSection = this.buildPerspectivesSection(perspectives);

    // Interpolation values
    const values: Record<string, string | number> = {
      query: params.query,
      templateId: config.templateId,
      templateName: config.templateName,
      granularity: params.granularity,
      maxSearches: granularityConfig.maxSearches,
      perspectiveCount: granularityConfig.perspectiveCount,
      verificationLevel: granularityConfig.verificationLevel,
      searchAngles: anglesSection,
      searchDepthGuidance: config.searchDepthGuidance[params.granularity],
      extractionIntro: config.extractionIntro,
      findingTypes: findingTypesSection,
      extractionGuidelines: config.extractionGuidelines,
      analysisInstruction: config.analysisInstruction,
      perspectives: perspectivesSection,
    };

    // Assemble prompt from sections
    // Note: Section files are created in Phase 13-02
    // For now, build inline prompt structure
    const sections = [
      `# Research Task: ${params.query}`,
      '',
      `**Template:** ${config.templateName}`,
      `**Granularity:** ${params.granularity}`,
      `**Max Searches:** ${granularityConfig.maxSearches}`,
      '',
      '---',
      '',
      '## Phase 1: Query Generation',
      '',
      config.searchIntro,
      '',
      '### Search Angles',
      '',
      anglesSection,
      '',
      `### Depth Guidance`,
      '',
      config.searchDepthGuidance[params.granularity],
      '',
      '---',
      '',
      '## Phase 2: Web Search',
      '',
      `Execute up to **${granularityConfig.maxSearches}** web searches.`,
      'Use the WebSearch tool to gather current information.',
      '',
      this.tryReadSection('phases/web-search.md') || 'Search for relevant, recent, and authoritative sources.',
      '',
      '---',
      '',
      '## Phase 3: Credibility Assessment',
      '',
      `Verification level: **${granularityConfig.verificationLevel}**`,
      '',
      this.tryReadSection('phases/credibility.md') || 'Assess source credibility and cross-reference claims.',
      '',
      '---',
      '',
      '## Phase 4: Finding Extraction',
      '',
      config.extractionIntro,
      '',
      '### Finding Types',
      '',
      findingTypesSection,
      '',
      '### Extraction Guidelines',
      '',
      config.extractionGuidelines,
      '',
      '### Analysis Instruction',
      '',
      config.analysisInstruction,
      '',
      '---',
      '',
      '## Phase 5: Perspectives',
      '',
      `Generate **${granularityConfig.perspectiveCount}** expert perspectives:`,
      '',
      perspectivesSection,
      '',
      this.tryReadSection('phases/perspectives.md') || 'Analyze findings from each perspective.',
      '',
      '---',
      '',
      '## Phase 6: Intelligence Analysis',
      '',
      this.tryReadSection('phases/intelligence.md') || 'Synthesize findings into actionable intelligence.',
      '',
      '---',
      '',
      '## Output Format',
      '',
      this.tryReadSection('common/output-format.md') || this.buildDefaultOutputFormat(config.templateId),
    ];

    return sections.join('\n');
  }

  /**
   * Build default output format section if no section file exists.
   *
   * @param templateId - Template identifier
   * @returns Output format instructions
   */
  private buildDefaultOutputFormat(templateId: string): string {
    return `Return a JSON object with the following structure:

\`\`\`json
{
  "query": "original query",
  "template": "${templateId}",
  "status": "completed",
  "findings": [
    {
      "finding_type": "type",
      "content": "finding content",
      "confidence_score": 0.85,
      "temporal_context": "current",
      "extracted_data": {},
      "supporting_sources": []
    }
  ],
  "sources": [
    {
      "url": "https://...",
      "title": "Source Title",
      "domain": "example.com",
      "credibility_score": 0.9,
      "credibility_label": "high"
    }
  ],
  "perspectives": [
    {
      "perspective_type": "expert_type",
      "analysis_text": "analysis",
      "key_insights": [],
      "recommendations": [],
      "warnings": []
    }
  ],
  "contradictions": [],
  "knowledge_gaps": [],
  "search_queries_executed": []
}
\`\`\`

Ensure all findings include supporting sources and confidence scores.`;
  }
}
