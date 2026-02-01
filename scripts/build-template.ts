#!/usr/bin/env npx tsx
/**
 * CLI script for building template prompts
 *
 * Usage: npm run build:template -- <template_id> "<query>" [granularity]
 *
 * Examples:
 *   npm run build:template -- tech_market "AI chips market" deep
 *   npm run build:template -- due_diligence "Acme Corp investment"
 *   npm run build:template -- competitive "cloud storage providers" quick
 *
 * Arguments:
 *   template_id   Template to use (e.g., tech_market, due_diligence)
 *   query         Research query (quoted string)
 *   granularity   Optional: quick, standard, or deep (default: standard)
 *
 * Output:
 *   Generates a .md prompt file in .prompts/ directory
 */

import * as fs from 'fs';
import * as path from 'path';
import { getTemplate, getAvailableTemplates } from '../src/templates/configs';

// Inline the types to avoid import issues with execa transitive deps
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
// CONSTANTS
// ============================================

const AVAILABLE_TEMPLATES = [
  'tech_market',
  'financial',
  'competitive',
  'investigative',
  'due_diligence',
  'legal',
  'contract',
  'reputation',
  'purchase_decision',
  'understanding',
];

// ============================================
// SIMPLIFIED PROMPT COMPOSER (inline)
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
  return angles.map(angle => {
    const items = angle.items.map(item => `  - ${item}`).join('\n');
    return `**${angle.name}**\n${items}`;
  }).join('\n\n');
}

function buildFindingTypesSection(findingTypes: FindingTypeConfig[]): string {
  return findingTypes.map(ft => {
    return `**${ft.name}** (${ft.displayName})\n${ft.description}\nSchema hint: ${ft.extractedDataSchema}`;
  }).join('\n\n');
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
// MAIN
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  // Validate arguments
  if (args.length < 2) {
    console.error('Error: Missing required arguments.\n');
    printUsage();
    process.exit(1);
  }

  const templateId = args[0];
  const query = args[1];
  const granularityArg = args[2] || 'standard';

  // Validate granularity
  if (!isValidGranularity(granularityArg)) {
    console.error(`Error: Invalid granularity "${granularityArg}".`);
    console.error('Must be: quick, standard, or deep\n');
    process.exit(1);
  }
  const granularity = granularityArg;

  // Load template config from registry
  const config = getTemplate(templateId);
  if (!config) {
    console.error(`Error: Template "${templateId}" not found.\n`);
    console.error('Available templates:');
    for (const t of getAvailableTemplates()) {
      console.error(`  - ${t}`);
    }
    console.error('');
    console.error('Note: Templates must be migrated and registered in Phase 14.');
    process.exit(1);
  }

  // Build prompt
  console.log('='.repeat(60));
  console.log('TEMPLATE PROMPT BUILDER');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Template:    ${config.templateName} (${templateId})`);
  console.log(`Query:       ${query}`);
  console.log(`Granularity: ${granularity}`);
  console.log('');

  const granularityConfig = GRANULARITY_CONFIGS[granularity];

  console.log('Resource limits:');
  console.log(`  Max searches:   ${granularityConfig.maxSearches}`);
  console.log(`  Perspectives:   ${granularityConfig.perspectiveCount}`);
  console.log(`  Verification:   ${granularityConfig.verificationLevel}`);
  console.log(`  Max turns:      ${granularityConfig.maxTurns}`);
  console.log(`  Max budget:     $${granularityConfig.maxBudgetUsd.toFixed(2)}`);
  console.log('');

  // Build the prompt
  const promptContent = buildResearchPrompt(config, query, granularity);

  // Create output directory
  const outputDir = path.join(process.cwd(), '.prompts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename
  const sanitizedQuery = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${templateId}-${sanitizedQuery}-${timestamp}.md`;
  const promptPath = path.join(outputDir, filename);

  // Write prompt file
  fs.writeFileSync(promptPath, promptContent, 'utf-8');

  console.log('-'.repeat(60));
  console.log(`Prompt file: ${promptPath}`);
  console.log('-'.repeat(60));
  console.log('');
  console.log('Prompt preview (first 500 chars):');
  console.log('');
  console.log(promptContent.slice(0, 500));
  console.log('...');
  console.log('');
  console.log('-'.repeat(60));
  console.log(`Total length: ${promptContent.length} chars`);
  console.log('-'.repeat(60));
  console.log('');
  console.log('To execute this prompt with Claude CLI:');
  console.log('');
  console.log(`  claude -p --system-prompt-file "${promptPath}" \\`);
  console.log(`    --allowedTools "WebSearch,Read" \\`);
  console.log(`    --max-turns ${granularityConfig.maxTurns} \\`);
  console.log(`    --max-budget-usd ${granularityConfig.maxBudgetUsd.toFixed(2)}`);
  console.log('');
}

function printUsage(): void {
  console.log('Usage: npm run build:template -- <template_id> "<query>" [granularity]');
  console.log('');
  console.log('Arguments:');
  console.log('  template_id   Template to use (e.g., tech_market)');
  console.log('  query         Research query (quoted string)');
  console.log('  granularity   Optional: quick, standard, or deep (default: standard)');
  console.log('');
  console.log('Granularity levels:');
  console.log('  quick     - Fast overview: 4 searches, 2 perspectives, $1.00 budget');
  console.log('  standard  - Balanced:      8 searches, 4 perspectives, $3.00 budget');
  console.log('  deep      - Comprehensive: 12 searches, 6 perspectives, $5.00 budget');
  console.log('');
  console.log('Examples:');
  console.log('  npm run build:template -- tech_market "AI chips market" deep');
  console.log('  npm run build:template -- due_diligence "Acme Corp investment"');
  console.log('  npm run build:template -- competitive "cloud storage providers" quick');
  console.log('');
}

main().catch((error) => {
  console.error('Unexpected error:', error.message);
  process.exit(1);
});
