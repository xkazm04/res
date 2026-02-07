/**
 * Requirement Generator for Claude Code
 *
 * Creates .claude/commands/*.md files from research topics
 * using the proper template system (PromptComposer + TemplateConfig).
 */

import { mkdir, writeFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import { PromptComposer, ResearchParams } from '@/src/templates/builder/PromptComposer';
import { getTemplate, templates } from '@/src/templates/configs';
import { TemplateConfig, Granularity } from '@/src/templates/types';

// ============================================
// TEMPLATE MAPPING
// ============================================

/**
 * Map topic suggestedTemplate values to actual TemplateConfig IDs.
 * Topics use simplified template names that map to full research templates.
 */
const TEMPLATE_MAPPING: Record<string, string> = {
  // Claim verification maps to investigative template (has narrative analysis)
  debunk_claim: 'investigative',

  // Actor investigation maps to investigative template (has actor/relationship types)
  actor_investigation: 'investigative',

  // Event timeline maps to investigative template (has timeline search angle)
  event_timeline: 'investigative',

  // Policy analysis maps to legal template (has policy/regulatory focus)
  policy_analysis: 'legal',

  // Financial investigation maps to financial template
  financial_investigation: 'financial',

  // Controversy analysis maps to investigative (has narrative_frame, coverage_asymmetry)
  controversy_analysis: 'investigative',

  // Reputation investigation
  reputation_investigation: 'reputation',

  // Due diligence
  due_diligence: 'due_diligence',

  // Tech market analysis
  tech_analysis: 'tech_market',

  // Competitive analysis
  competitive_analysis: 'competitive',
};

/**
 * Get the appropriate TemplateConfig for a topic's suggested template.
 * Falls back to 'investigative' if no mapping exists.
 */
function getTemplateForTopic(suggestedTemplate?: string): TemplateConfig {
  if (!suggestedTemplate) {
    // Default to investigative for general research
    return templates.investigative;
  }

  const templateId = TEMPLATE_MAPPING[suggestedTemplate];
  if (templateId) {
    const template = getTemplate(templateId);
    if (template) return template;
  }

  // Fall back to investigative template
  return templates.investigative;
}

// ============================================
// GRANULARITY DETERMINATION
// ============================================

/**
 * Determine research granularity based on topic metadata.
 * Higher debunkability = easier verification = can use quicker research.
 * Controversial topics or low debunkability = need deeper research.
 */
function determineGranularity(topic: TopicData): Granularity {
  // If debunkability is provided, use it to guide granularity
  if (topic.debunkable !== undefined) {
    if (topic.debunkable >= 4) {
      // Easy to verify - standard depth is sufficient
      return 'standard';
    } else if (topic.debunkable <= 2) {
      // Difficult to verify - need deep research
      return 'deep';
    }
  }

  // Investigative templates default to deep for thorough analysis
  if (topic.suggestedTemplate === 'debunk_claim' ||
      topic.suggestedTemplate === 'actor_investigation' ||
      topic.suggestedTemplate === 'controversy_analysis') {
    return 'deep';
  }

  // Default to standard for most cases
  return 'standard';
}

// ============================================
// TOPIC DATA INTERFACE
// ============================================

interface TopicData {
  id: string;
  title: string;
  description?: string;
  claim?: string;
  researchQuery?: string;
  suggestedTemplate?: string;
  sourceBias?: string;
  debunkable?: number;
  sourceUrl?: string;
}

// ============================================
// BIAS CONTEXT
// ============================================

/**
 * Generate bias context note for the research prompt.
 */
function getBiasContext(sourceBias?: string): string | null {
  if (!sourceBias) return null;

  const biasNotes: Record<string, string> = {
    left: 'Source leans left politically - seek center/right perspectives for balance.',
    'center-left': 'Source leans center-left - seek center-right perspectives for balance.',
    center: 'Source is politically centrist - good baseline, verify with other sources.',
    'center-right': 'Source leans center-right - seek center-left perspectives for balance.',
    right: 'Source leans right politically - seek center/left perspectives for balance.',
  };

  return biasNotes[sourceBias] || null;
}

// ============================================
// FILENAME GENERATION
// ============================================

/**
 * Generate a sanitized filename from topic title.
 */
function generateFilename(title: string): string {
  const timestamp = Date.now();
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  return `research-${sanitized}-${timestamp}.md`;
}

// ============================================
// CONTENT BUILDING
// ============================================

/**
 * Build the complete requirement file content.
 * Uses PromptComposer to generate the research prompt from the proper template.
 */
function buildRequirementContent(topic: TopicData): string {
  const composer = new PromptComposer();
  const template = getTemplateForTopic(topic.suggestedTemplate);
  const granularity = determineGranularity(topic);

  // Build the research query from topic data
  // Priority: researchQuery > claim (quoted) > title
  let query: string;
  if (topic.researchQuery) {
    query = topic.researchQuery;
  } else if (topic.claim) {
    query = `Verify claim: "${topic.claim}"`;
  } else {
    query = topic.title;
  }

  // Build research params
  const params: ResearchParams = {
    query,
    granularity,
  };

  // Generate the main research prompt using PromptComposer
  const researchPrompt = composer.buildResearchPrompt(template, params);

  // Build the complete file with topic-specific header and context
  const sections: string[] = [];

  // Topic metadata header
  sections.push(`<!-- Topic ID: ${topic.id} -->`);
  sections.push(`<!-- Template: ${topic.suggestedTemplate || 'investigative'} → ${template.templateId} -->`);
  sections.push(`<!-- Granularity: ${granularity} -->`);
  sections.push('');

  // If there's a specific claim to investigate, highlight it
  if (topic.claim) {
    sections.push('## Original Claim');
    sections.push('');
    sections.push(`> "${topic.claim}"`);
    sections.push('');
  }

  // Context/description if available
  if (topic.description && topic.description !== topic.claim) {
    sections.push('## Context');
    sections.push('');
    sections.push(topic.description);
    sections.push('');
  }

  // Source URL if available
  if (topic.sourceUrl) {
    sections.push('## Original Source');
    sections.push('');
    sections.push(`[${topic.sourceUrl}](${topic.sourceUrl})`);
    sections.push('');
  }

  // Bias context note
  const biasNote = getBiasContext(topic.sourceBias);
  if (biasNote) {
    sections.push('## Source Bias Note');
    sections.push('');
    sections.push(`⚠️ ${biasNote}`);
    sections.push('');
  }

  // Verification difficulty guidance
  if (topic.debunkable !== undefined) {
    sections.push('## Verification Assessment');
    sections.push('');
    if (topic.debunkable >= 4) {
      sections.push(`**Difficulty: ${topic.debunkable}/5 (Straightforward)**`);
      sections.push('This claim should be relatively easy to verify with public data and official sources.');
    } else if (topic.debunkable === 3) {
      sections.push(`**Difficulty: ${topic.debunkable}/5 (Moderate)**`);
      sections.push('Verification may require multiple source types and careful cross-referencing.');
    } else {
      sections.push(`**Difficulty: ${topic.debunkable}/5 (Challenging)**`);
      sections.push('This will be difficult to verify. Be rigorous about source quality and acknowledge uncertainty.');
    }
    sections.push('');
  }

  sections.push('---');
  sections.push('');

  // The main research prompt from PromptComposer
  sections.push(researchPrompt);

  return sections.join('\n');
}

// ============================================
// MAIN EXPORT
// ============================================

/**
 * Create a Claude Code requirement file from a topic.
 * Uses the proper template system for consistent research methodology.
 */
export async function createRequirementFromTopic(
  projectPath: string,
  topic: TopicData
): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> {
  try {
    // Ensure .claude/commands directory exists
    const commandsDir = join(projectPath, '.claude', 'commands');

    try {
      await access(commandsDir);
    } catch {
      await mkdir(commandsDir, { recursive: true });
    }

    // Generate filename and content
    const fileName = generateFilename(topic.title);
    const filePath = join(commandsDir, fileName);

    // Validate resolved path stays within expected directory
    const resolvedPath = resolve(filePath);
    const resolvedDir = resolve(commandsDir);
    if (!resolvedPath.startsWith(resolvedDir)) {
      return { success: false, error: 'Invalid file path' };
    }

    const content = buildRequirementContent(topic);

    // Write file
    await writeFile(filePath, content, 'utf-8');

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
