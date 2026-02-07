import type { SessionWithDetails } from '@/src/types/research';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';

export interface ComposeOptions {
  enableResearch?: boolean;
  enableRewriting?: boolean;
}

export function buildComposePrompt(
  session: SessionWithDetails,
  availableItems: ContentSelectionState['availableItems'],
  options: ComposeOptions = {},
): string {
  const itemsPayload = {
    findings: availableItems.findings.map(f => ({
      id: f.id,
      title: f.title,
      content: f.content,
      type: f.type,
      confidence: f.confidence,
    })),
    perspectives: availableItems.perspectives.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      type: p.type,
      confidence: p.confidence,
    })),
    analysis: availableItems.analysis.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      category: a.category,
      confidence: a.confidence,
    })),
  };

  let prompt = `You are an expert video content curator and producer for research intelligence videos.

## Research Context
Topic: ${session.query || 'Research Analysis'}
Template: ${session.template_type || 'investigative'}

## Available Content (${availableItems.findings.length} findings, ${availableItems.perspectives.length} perspectives, ${availableItems.analysis.length} analysis items)

${JSON.stringify(itemsPayload, null, 2)}

## Video Sections
Each selected item should be assigned to one or more video sections:
- **metrics**: Key numbers, statistics, quantitative data points
- **charts**: Patterns, relationships, trends suitable for data visualization
- **insights**: Key findings, perspectives, alerts, contradictions
- **summary**: Most important verdict, conclusion, high-confidence items

## Phase 1: Content Selection & Assignment
Analyze all available content and select the most compelling items for a research video:
- Select 8-12 findings (prioritize high confidence, diverse types, narrative flow)
- Select 2-4 perspectives (most insightful, complementary viewpoints)
- Select relevant analysis items (contradictions add drama, gaps show thoroughness, causal chains show depth)
- Assign each selected item to appropriate video sections (items can appear in multiple sections)
- Ensure each section has at least 2-3 items for balanced content
`;

  if (options.enableResearch) {
    prompt += `
## Phase 2: Research Augmentation
After selecting content, use WebSearch to find supplementary data:
- Search for hard statistics and metrics related to the top 3-5 findings
- Find recent data points, numbers, dates, or quotes that strengthen the narrative
- Each enrichment should cite its source URL
- Only include enrichments that add concrete value (specific numbers, dates, or expert quotes)
`;
  }

  if (options.enableRewriting) {
    prompt += `
## Phase 3: Content Optimization for Video
Rewrite selected items to be more compelling in video format:
- Shorten to 1-2 punchy sentences maximum
- Lead with the most striking detail or number
- Use active voice and present tense where possible
- Add narrative hooks where appropriate ("What most analysts miss...", "The data reveals...")
- Make statistics prominent and visual-friendly
`;
  }

  prompt += `
## Output Format
Return ONLY a valid JSON object (no markdown, no explanation):
{
  "selection": {
    "selectedFindings": ["finding-id-1", "finding-id-2"],
    "selectedPerspectives": ["perspective-id-1"],
    "selectedContradictions": ["contradiction-id-1"],
    "selectedGaps": ["gap-id-1"],
    "selectedCausalChains": ["chain-id-1"],
    "sectionAssignments": {
      "finding-id-1": ["metrics", "insights"],
      "finding-id-2": ["charts"],
      "perspective-id-1": ["insights", "summary"]
    }
  }${options.enableResearch ? `,
  "enrichments": [
    { "itemId": "finding-id-1", "type": "stat", "content": "According to X, the figure reached Y in 2024", "source": "https://..." }
  ]` : ''}${options.enableRewriting ? `,
  "rewrites": [
    { "itemId": "finding-id-1", "originalContent": "...", "optimizedContent": "..." }
  ]` : ''}
}

IMPORTANT: Use only IDs from the available content above. Do not invent IDs.`;

  return prompt;
}
