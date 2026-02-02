#!/usr/bin/env npx tsx
/**
 * Research Execution CLI
 *
 * Runs template-based research with optional Supabase persistence.
 * Uses standalone implementation to avoid execa ESM issues with Node.js 24.
 *
 * Usage:
 *   npm run research:execute -- <template_id> "<query>" [granularity] [--no-db]
 *
 * Examples:
 *   npm run research:execute -- tech_market "AI chip market trends"
 *   npm run research:execute -- financial "NVIDIA stock analysis" deep
 *   npm run research:execute -- investigative "Company X fraud" standard --no-db
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { getTemplate, getAvailableTemplates } from '../src/templates/configs';

// ============================================
// INLINE TYPES (avoid execa transitive deps)
// ============================================

type Granularity = 'quick' | 'standard' | 'deep';

interface GranularityConfig {
  maxSearches: number;
  perspectiveCount: number;
  verificationLevel: 'light' | 'standard' | 'thorough';
  maxTurns: number;
  maxBudgetUsd: number;
}

const GRANULARITY_CONFIGS: Record<Granularity, GranularityConfig> = {
  quick: {
    maxSearches: 4,
    perspectiveCount: 2,
    verificationLevel: 'light',
    maxTurns: 15,
    maxBudgetUsd: 1.0,
  },
  standard: {
    maxSearches: 8,
    perspectiveCount: 4,
    verificationLevel: 'standard',
    maxTurns: 30,
    maxBudgetUsd: 3.0,
  },
  deep: {
    maxSearches: 12,
    perspectiveCount: 6,
    verificationLevel: 'thorough',
    maxTurns: 50,
    maxBudgetUsd: 5.0,
  },
};

function isValidGranularity(value: string): value is Granularity {
  return value === 'quick' || value === 'standard' || value === 'deep';
}

// ============================================
// INLINE PROMPT BUILDER (from build-template.ts)
// ============================================

interface SearchAngle {
  name: string;
  items: string[];
}

interface FindingTypeConfig {
  name: string;
  displayName: string;
  description: string;
  extractedDataSchema: string;
}

interface TemplateConfig {
  templateId: string;
  templateName: string;
  searchIntro: string;
  searchAngles: SearchAngle[];
  searchDepthGuidance: Record<'quick' | 'standard' | 'deep', string>;
  extractionIntro: string;
  findingTypes: FindingTypeConfig[];
  extractionGuidelines: string;
  analysisInstruction: string;
  perspectives: string[];
}

function buildAnglesSection(angles: SearchAngle[]): string {
  return angles
    .map((angle) => {
      const items = angle.items.map((item) => `  - ${item}`).join('\n');
      return `**${angle.name}**\n${items}`;
    })
    .join('\n\n');
}

function buildFindingTypesSection(findingTypes: FindingTypeConfig[]): string {
  return findingTypes
    .map((ft) => {
      return `**${ft.name}** (${ft.displayName})\n${ft.description}\nSchema hint: ${ft.extractedDataSchema}`;
    })
    .join('\n\n');
}

function buildPerspectivesSection(perspectives: string[]): string {
  return perspectives.map((p, i) => `${i + 1}. ${p}`).join('\n');
}

function buildResearchPrompt(
  config: TemplateConfig,
  query: string,
  granularity: Granularity
): string {
  const granularityConfig = GRANULARITY_CONFIGS[granularity];
  const perspectives = config.perspectives.slice(0, granularityConfig.perspectiveCount);
  const anglesSection = buildAnglesSection(config.searchAngles);
  const findingTypesSection = buildFindingTypesSection(config.findingTypes);
  const perspectivesSection = buildPerspectivesSection(perspectives);

  return [
    `# Research Task: ${query}`,
    '',
    `**Template:** ${config.templateName}`,
    `**Granularity:** ${granularity}`,
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
    '### Depth Guidance',
    '',
    config.searchDepthGuidance[granularity],
    '',
    '---',
    '',
    '## Phase 2: Web Search',
    '',
    `Execute up to **${granularityConfig.maxSearches}** web searches.`,
    'Use the WebSearch tool to gather current information.',
    '',
    '---',
    '',
    '## Phase 3: Credibility Assessment',
    '',
    `Verification level: **${granularityConfig.verificationLevel}**`,
    '',
    'Assess source credibility and cross-reference claims.',
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
    '---',
    '',
    '## Phase 6: Intelligence Analysis',
    '',
    'Synthesize findings into actionable intelligence.',
    '',
    '---',
    '',
    '## Output Format',
    '',
    `Return a JSON object with the following structure:`,
    '',
    '```json',
    '{',
    '  "query": "original query",',
    `  "template": "${config.templateId}",`,
    '  "status": "completed",',
    '  "findings": [...],',
    '  "sources": [...],',
    '  "perspectives": [...],',
    '  "contradictions": [],',
    '  "knowledge_gaps": [],',
    '  "search_queries_executed": []',
    '}',
    '```',
    '',
    'Ensure all findings include supporting sources and confidence scores.',
  ].join('\n');
}

// ============================================
// CLAUDE CLI EXECUTION (using child_process instead of execa)
// ============================================

interface ClaudeResult {
  success: boolean;
  output?: unknown;
  error?: string;
  rawOutput?: string;
}

async function runClaude(
  promptPath: string,
  options: {
    maxTurns: number;
    maxBudgetUsd: number;
    timeout: number;
  }
): Promise<ClaudeResult> {
  return new Promise((resolve) => {
    const args = [
      '-p',
      '--output-format',
      'json',
      '--allowedTools',
      'WebSearch,Read',
      '--max-turns',
      String(options.maxTurns),
      '--max-budget-usd',
      String(options.maxBudgetUsd),
      '--system-prompt-file',
      promptPath,
    ];

    console.log(`[Claude] Running: claude ${args.join(' ')}`);

    const child = spawn('claude', args, {
      shell: true,
      timeout: options.timeout,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code: number | null) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
          rawOutput: stdout,
        });
        return;
      }

      try {
        const response = JSON.parse(stdout);
        const output =
          response.structured_output || response.result || response;
        resolve({
          success: true,
          output,
          rawOutput: stdout,
        });
      } catch (parseError) {
        resolve({
          success: false,
          error: `Failed to parse JSON output: ${(parseError as Error).message}`,
          rawOutput: stdout,
        });
      }
    });

    child.on('error', (err: Error) => {
      resolve({
        success: false,
        error: err.message,
      });
    });
  });
}

// ============================================
// SUPABASE PERSISTENCE (lazy import)
// ============================================

// Persistence is loaded dynamically only when saveToDb=true
// to avoid import issues when not using database
async function createPersistence(workspaceId: string) {
  // Dynamic import to avoid loading supabase when --no-db
  const { SupabasePersistence } = await import('../src/templates/persistence');
  return new SupabasePersistence({ workspaceId });
}

// ============================================
// CLI IMPLEMENTATION
// ============================================

async function main() {
  const args = process.argv.slice(2);

  // Show usage if not enough arguments
  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(args.length < 2 ? 1 : 0);
  }

  // Parse arguments
  const templateId = args[0];
  const query = args[1];
  const granularityArg = args.find((a) => ['quick', 'standard', 'deep'].includes(a));
  const granularity: Granularity = isValidGranularity(granularityArg || '')
    ? granularityArg
    : 'standard';
  const saveToDb = !args.includes('--no-db');

  // Validate template ID
  const availableTemplates = getAvailableTemplates();
  if (!availableTemplates.includes(templateId)) {
    console.error(`Error: Unknown template "${templateId}"`);
    console.error(`Available templates: ${availableTemplates.join(', ')}`);
    process.exit(1);
  }

  // Get template config
  const config = getTemplate(templateId);
  if (!config) {
    console.error(`Error: Template "${templateId}" not found in registry.`);
    process.exit(1);
  }

  const granularityConfig = GRANULARITY_CONFIGS[granularity];

  // Display execution header
  console.log('');
  console.log('='.repeat(60));
  console.log('RESEARCH EXECUTION');
  console.log('='.repeat(60));
  console.log(`Template:    ${templateId}`);
  console.log(`Query:       ${query}`);
  console.log(`Granularity: ${granularity}`);
  console.log(`Persist:     ${saveToDb ? 'Yes (Supabase)' : 'No (--no-db)'}`);
  console.log('='.repeat(60));
  console.log('');

  let sessionId: string | null = null;
  let persistence: Awaited<ReturnType<typeof createPersistence>> | null = null;

  const startTime = Date.now();

  try {
    // 1. Create session if saving to DB
    if (saveToDb) {
      persistence = await createPersistence('claude-code');
      const session = await persistence.createSession({
        query,
        templateType: templateId,
        granularity,
        maxSearches: granularityConfig.maxSearches,
      });
      sessionId = session.sessionId;
      console.log(`[Session] Created: ${sessionId}`);
    }

    // 2. Build prompt
    const outputDir = path.join(process.cwd(), '.prompts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const sanitizedQuery = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${templateId}-${sanitizedQuery}-${timestamp}.md`;
    const promptPath = path.join(outputDir, filename);

    const promptContent = buildResearchPrompt(config as unknown as TemplateConfig, query, granularity);
    fs.writeFileSync(promptPath, promptContent, 'utf-8');

    console.log(`[Prompt] Generated: ${promptPath}`);

    // 3. Update status to searching
    if (persistence && sessionId) {
      await persistence.updateStatus(sessionId, 'searching');
      console.log(`[Status] searching`);
    }

    // 4. Execute research
    console.log(`[Research] Executing Claude Code...`);

    const result = await runClaude(promptPath, {
      maxTurns: granularityConfig.maxTurns,
      maxBudgetUsd: granularityConfig.maxBudgetUsd,
      timeout: 300000, // 5 minutes
    });

    if (!result.success) {
      throw new Error(result.error || 'Research execution failed');
    }

    // 5. Persist results
    if (persistence && sessionId) {
      console.log(`[Status] analyzing`);
      await persistence.updateStatus(sessionId, 'analyzing');

      // Cast output to ActorOutput for persistence
      const output = result.output as {
        findings?: unknown[];
        sources?: unknown[];
        perspectives?: unknown[];
      };

      await persistence.persistResearch(sessionId, output as never);

      console.log(`[Status] completed`);
      console.log(
        `[Results] ${output.findings?.length || 0} findings, ${output.sources?.length || 0} sources`
      );
    }

    // Display results
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const output = result.output as {
      findings?: unknown[];
      sources?: unknown[];
      perspectives?: unknown[];
      contradictions?: unknown[];
      knowledge_gaps?: unknown[];
    };

    console.log('');
    console.log('='.repeat(60));
    console.log('RESEARCH COMPLETE');
    console.log('='.repeat(60));
    console.log(`Session ID:   ${sessionId || 'N/A (--no-db)'}`);
    console.log(`Prompt:       ${promptPath}`);
    console.log(`Duration:     ${duration}s`);
    console.log('');
    console.log('Results:');
    console.log(`  Findings:     ${output?.findings?.length || 0}`);
    console.log(`  Sources:      ${output?.sources?.length || 0}`);
    console.log(`  Perspectives: ${output?.perspectives?.length || 0}`);

    if (output?.contradictions?.length) {
      console.log(`  Contradictions: ${output.contradictions.length}`);
    }
    if (output?.knowledge_gaps?.length) {
      console.log(`  Knowledge Gaps: ${output.knowledge_gaps.length}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update session to failed status
    if (persistence && sessionId) {
      try {
        await persistence.failSession(sessionId, errorMessage);
      } catch {
        // Ignore errors from failSession
      }
      console.log(`[Status] failed: ${errorMessage}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('='.repeat(60));
    console.log('RESEARCH FAILED');
    console.log('='.repeat(60));
    console.log(`Error:    ${errorMessage}`);
    console.log(`Duration: ${duration}s`);
    if (sessionId) {
      console.log(`Session:  ${sessionId} (marked as failed)`);
    }
    process.exit(1);
  }
}

function showUsage() {
  const templates = getAvailableTemplates();

  console.log('');
  console.log('Usage: npm run research:execute -- <template_id> "<query>" [granularity] [--no-db]');
  console.log('');
  console.log('Arguments:');
  console.log('  template_id   Template to use for research');
  console.log('  query         Research query (use quotes for multi-word queries)');
  console.log('  granularity   Optional: quick, standard (default), deep');
  console.log('  --no-db       Skip database persistence');
  console.log('');
  console.log('Available templates:');
  templates.forEach((t) => console.log(`  - ${t}`));
  console.log('');
  console.log('Granularity levels:');
  console.log('  quick     4 searches, $1 budget, 15 turns (fast overview)');
  console.log('  standard  8 searches, $3 budget, 30 turns (balanced)');
  console.log('  deep      12 searches, $5 budget, 50 turns (comprehensive)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run research:execute -- tech_market "AI chip market trends"');
  console.log('  npm run research:execute -- financial "NVIDIA stock analysis" deep');
  console.log('  npm run research:execute -- investigative "Company X fraud" --no-db');
  console.log('');
}

// Run CLI
main().catch((err) => {
  console.error('');
  console.error('Fatal error:', err);
  process.exit(1);
});
