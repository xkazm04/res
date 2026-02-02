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

/**
 * Try to read a section file, returning empty string if not found.
 */
function tryReadSection(relativePath: string): string {
  const sectionsDir = path.join(process.cwd(), 'src/templates/sections');
  const fullPath = path.join(sectionsDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  return fs.readFileSync(fullPath, 'utf-8');
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

  // Read section files
  const webSearchSection = tryReadSection('phases/web-search.md') || 'Search for relevant, recent, and authoritative sources.';
  const credibilitySection = tryReadSection('phases/credibility.md') || 'Assess source credibility and cross-reference claims.';
  const perspectivesPhaseSection = tryReadSection('phases/perspectives.md') || 'Analyze findings from each perspective.';
  const intelligenceSection = tryReadSection('phases/intelligence.md') || 'Synthesize findings into actionable intelligence.';
  const metaAnalysisSection = tryReadSection('phases/meta-analysis.md');
  const outputFormatSection = tryReadSection('common/output-format.md');

  const sections = [
    `# Research Task: ${query}`,
    '',
    `**Template:** ${config.templateName}`,
    `**Granularity:** ${granularity}`,
    `**Max Searches:** ${granularityConfig.maxSearches}`,
    '',
    '---',
    '',
    // Phase 1: Query Generation (inline, no section file - template-specific)
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
    // Phase 2: Web Search - use section file (includes its own header)
    webSearchSection || '## Phase 2: Web Search\n\nSearch for relevant, recent, and authoritative sources.',
    '',
    `**Resource limit:** Execute up to **${granularityConfig.maxSearches}** web searches.`,
    '',
    '---',
    '',
    // Phase 3: Credibility - use section file (includes its own header)
    credibilitySection || '## Phase 3: Credibility Assessment\n\nAssess source credibility and cross-reference claims.',
    '',
    `**Verification level:** ${granularityConfig.verificationLevel}`,
    '',
    '---',
    '',
    // Phase 4: Finding Extraction (inline, template-specific)
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
    // Phase 5: Perspectives - use section file (includes its own header)
    perspectivesPhaseSection || '## Phase 5: Perspective Analysis\n\nAnalyze findings from each perspective.',
    '',
    `**Generate ${granularityConfig.perspectiveCount} expert perspectives:**`,
    '',
    perspectivesSection,
    '',
    '---',
    '',
    // Phase 6: Intelligence - use section file (includes its own header)
    intelligenceSection || '## Phase 6: Intelligence Analysis\n\nSynthesize findings into actionable intelligence.',
    '',
    '---',
    '',
  ];

  // Add Phase 7 meta-analysis if section exists
  if (metaAnalysisSection) {
    sections.push(metaAnalysisSection);
    sections.push('');
    sections.push('---');
    sections.push('');
  }

  // Add output format
  if (outputFormatSection) {
    sections.push(outputFormatSection);
  } else {
    sections.push('## Output Format');
    sections.push('');
    sections.push('Return a JSON object with the following structure:');
    sections.push('');
    sections.push('```json');
    sections.push('{');
    sections.push('  "query": "original query",');
    sections.push(`  "template": "${config.templateId}",`);
    sections.push('  "status": "completed",');
    sections.push('  "findings": [...],');
    sections.push('  "sources": [...],');
    sections.push('  "perspectives": [...],');
    sections.push('  "contradictions": [],');
    sections.push('  "knowledge_gaps": [],');
    sections.push('  "search_queries_executed": []');
    sections.push('}');
    sections.push('```');
    sections.push('');
    sections.push('Ensure all findings include supporting sources and confidence scores.');
  }

  return sections.join('\n');
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
