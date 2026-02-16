import type { SessionWithDetails } from '@/src/types/research';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';
import { buildCatalogForPrompt } from './sceneCatalog';

export interface ComposeOptions {
  enableResearch?: boolean;
  enableRewriting?: boolean;
  enableComposition?: boolean;
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
Analyze all available content and select the most compelling items for a short video:
- Select max 4 findings (only the highest-impact, highest-confidence ones)
- Select max 4 perspectives (most insightful, complementary viewpoints)
- Select max 2 analysis items (contradictions add drama, causal chains show depth)
- Assign each selected item to appropriate video sections (items can appear in multiple sections)
- Keep it tight — fewer items with higher impact is better than many weak ones
- PREFER items with quantitative data (percentages, dollar amounts, dates, counts)
- When selecting findings, prioritize those with hard numbers over qualitative statements
- For scene data: lead with the most striking statistic or number
- Convert qualitative statements to quantitative where possible (e.g., "significant growth" -> "47% growth")
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

  if (options.enableComposition) {
    prompt += `
## Phase ${phaseNum()}: Video Scene Composition
Compose the actual video scene sequence using these available scene components:

${buildCatalogForPrompt()}

### STORYTELLING FIRST — Scenes Serve the Story

You are NOT listing findings. You are telling ONE story.

Before choosing any scenes, mentally write the story in plain English:
1. What is the single most surprising or important thing the research uncovered?
2. What's the cause behind it? What chain of events or structure created this situation?
3. What's the proof? What specific evidence makes this undeniable?
4. What should the viewer take away?

The narration across ALL scenes must read as a single flowing monologue — as if one person is explaining something fascinating to a friend. Every sentence must connect to the one before it through causality ("because", "which led to", "that's why", "and here's the proof"), contrast ("but", "what they don't show you"), or escalation ("and it gets worse", "that's just the surface").

DO NOT write scene narrations independently. Write the FULL narration as one continuous script first, THEN split it across scenes. Each scene's narration is a segment of one story, not a standalone caption.

### Narrative Arc — 5 Beats

Every video follows a question-driven storytelling arc. The viewer stays because they want the answer. Each scene must declare its narrative \`beat\`.

**Beat 1: "question"** — The hook (1 scene, 3-5s)
  Pose ONE provocative question that the entire video will answer. Frame the topic as a mystery, paradox, or something counter-intuitive. This is the single thread the viewer follows.
  Typical scene: HookScene (variant "cinematic" or "editorial").
  Narration example: "Why are billionaires buying soccer clubs that lose money every single year?"

**Beat 2: "context"** — Set the stage (1-2 scenes, 5-10s)
  Ground the viewer: what is happening, how big it is. Lead with the most striking number.
  The narration should flow FROM the question: "Here's what's going on..." / "The numbers are staggering..."
  Typical scenes: StockFootageScene (establishing shot), MetricsScene, CompetitiveLandscapeScene, AdoptionCurveScene.
  Narration example: "In the last three years, celebrity-owned clubs crossed four point two billion in total valuation. And almost none of them turn a profit."

**Beat 3: "mechanism"** — The explanation (2-3 scenes, 10-15s)
  This is the core — the "here's what's actually going on" reveal. Connect findings causally.
  Structure: surface explanation → deeper explanation → the real structure.
  Each scene builds on the previous: "That's because..." / "And the way they do it..." / "Follow the money and you'll find..."
  Typical scenes: MoneyTrailScene, ActorNetworkScene, CausalChainScene, ShellCompanyWebScene, BullBearScene, PriceComparisonScene, NarrativeComparisonScene.

**Beat 4: "evidence"** — The proof (1-3 scenes, 8-12s)
  Back up the mechanism with hard evidence. Connect to what you just explained.
  Narration should feel like: "And here's the proof..." / "The numbers confirm this..." / "Look at the pattern..."
  Typical scenes: PatternRevealScene, RedFlagCompilationScene, RiskMeterScene, HypeVsRealityScene, CorruptionFlagsScene, AtRiskScene, RulingImpactScene, BattleMapScene.

**Beat 5: "verdict"** — The answer (1 scene, 4-6s)
  Circle back to beat 1's question and deliver a clear answer. The viewer should feel the loop close.
  Narration: Answer the question directly, then one forward-looking takeaway.
  Typical scene: VerdictScene.

### Narration as One Script

CRITICAL: Write the narration as ONE continuous monologue, then assign segments to scenes.

Bad (disconnected findings):
  Scene 1: "Revenue grew 47% last year."
  Scene 2: "Three executives resigned in Q3."
  Scene 3: "The company faces two patent lawsuits."

Good (one connected story):
  Scene 1: "Revenue grew 47% last year. Sounds impressive, right?"
  Scene 2: "But here's what the headline doesn't tell you. Three executives who built that growth resigned within the same quarter."
  Scene 3: "Why? Because two patent lawsuits threaten to destroy the very technology that drove those numbers."

The test: read ALL scene narrations back-to-back. If it sounds like a list of bullet points, rewrite it. It should sound like one person telling one story.

### Causal Connection Patterns
Use these narrative connectors between scenes:
- **Cause → Effect**: "That's because..." / "Which led to..." / "The result?"
- **Surface → Depth**: "But that's just the surface." / "What they don't show you is..." / "Dig deeper and..."
- **Escalation**: "And it gets worse." / "But that's not even the biggest problem." / "Here's where it really falls apart."
- **Evidence bridge**: "And the proof is right in the filings." / "The numbers tell the real story." / "Don't take my word for it — look at the data."
- **Resolution**: "So what does this all mean?" / "That's why..." / "The answer?"

### Arc Integrity Rules
- Beat 1's question MUST be directly answered by beat 5's verdict — this is the narrative loop
- Beats must appear in order: question → context → mechanism → evidence → verdict
- Mechanism (beat 3) carries the most weight — this is the educational core
- Every scene must have a \`beat\` field
- Total duration: 40-60 seconds across all scenes
- Use 6-10 scenes total
- EVERY finding referenced must connect to the story's central question — drop findings that don't fit rather than including disconnected facts

### General Composition Rules
- Populate each scene's \`data\` field with REAL content extracted from the research findings
- Respect ALL maxLength and maxItems constraints in the schema
- Each scene needs a unique \`sceneId\` (e.g., "hook-1", "context-metrics-1", "mech-trail-1", "evidence-patterns-1", "verdict-1")
- Pick scenes that BEST match the research data — you can mix scenes from ANY category

### Stock Footage (Optional)
StockFootageScene can add real video clips from Pexels:
- Best for beat 2 (context) as an establishing shot, or as a breather between data-heavy mechanism scenes
- pexelsQuery: specific visual keywords (e.g. "corporate office meeting" not "business")
- Max 2 stock footage scenes per video
- overlayText is optional — use for establishing context (e.g. "Wall Street, 2024")

### Scene Styling (per scene, all optional)

**transition** — { enter, exit }. Values: "flash-cut" | "wipe-right" | "wipe-left" | "zoom-through" | "slide-up" | "fade"
  Tips: zoom-through for question beat, wipe-right for mechanism reveals, slide-up for evidence data, fade for verdict.

**pacing** — "fast" | "normal" | "slow" | "dramatic"
  Tips: "dramatic" for question + verdict, "normal" for context, "fast" for evidence, "slow" for key mechanism reveals.

**mood** — "neutral" | "danger" | "success" | "dramatic"
  Tips: "dramatic" for question, "neutral" for context, mood-match mechanism/evidence to content tone, "success"/"danger" for verdict.

**variant** — Layout variant (supported scenes only).
  HookScene: "centered" | "editorial" | "cinematic"
  VerdictScene: "standard" | "fullscreen" | "minimal"
  BullBearScene: "split" | "stacked" | "minimal"
  PatternRevealScene: "cards" | "timeline"

### Per-Scene Narration Word Limits
TOTAL narration across ALL scenes: 150-250 words (40-60 seconds at speaking pace).
- **1-2 sentences per scene** (max 30 words per scene narration)
- Use present tense, active voice, conversational tone
- Numbers spoken naturally ("four point two billion" not "$4.2B")
- NO academic language, NO "furthermore/moreover", NO filler phrases
- Think: a sharp analyst walking a friend through something fascinating over coffee
`;
  }

  // Build output format
  const compositionExample = options.enableComposition ? `,
  "sceneComposition": [
    { "sceneId": "hook-1", "component": "HookScene", "durationSeconds": 4, "beat": "question", "data": { "hook": "Why Buy Soccer Clubs at a Loss?", "title": "Celebrity Ownership Investigation" }, "transition": { "enter": "zoom-through" }, "pacing": "dramatic", "mood": "dramatic", "variant": "cinematic", "narration": "Why are billionaires paying hundreds of millions for soccer clubs that lose money every single year?" },
    { "sceneId": "ctx-footage-1", "component": "StockFootageScene", "durationSeconds": 4, "beat": "context", "data": { "pexelsQuery": "soccer stadium aerial crowd", "overlayText": "$4.2B in Celebrity-Owned Clubs" }, "narration": "In the last three years, celebrity-owned clubs crossed four point two billion in total valuation." },
    { "sceneId": "ctx-metrics-1", "component": "MetricsScene", "durationSeconds": 5, "beat": "context", "data": { "metrics": [{ "label": "Clubs Acquired", "value": "23" }, { "label": "Total Value", "value": "$4.2B" }], "title": "The Phenomenon" }, "narration": "Twenty-three clubs changed hands. Most were bought above market price." },
    { "sceneId": "mech-trail-1", "component": "MoneyTrailScene", "durationSeconds": 6, "beat": "mechanism", "data": { "flows": [{ "from": "Holding Co", "to": "Club LLC", "amount": "$180M", "why": "Image rights transfer" }], "title": "Money Flow" }, "transition": { "enter": "wipe-right" }, "mood": "danger", "narration": "The money doesn't flow through the front door. Image rights, licensing deals, and offshore holding companies move the real value." },
    { "sceneId": "mech-shell-1", "component": "ShellCompanyWebScene", "durationSeconds": 6, "beat": "mechanism", "data": { "entities": [{ "name": "StarCo Ltd", "type": "offshore", "suspicious": true }, { "name": "Club FC", "type": "company", "suspicious": false }], "connections": [{ "from": "StarCo Ltd", "to": "Club FC", "relationship": "Owns 80%", "hidden": true }] }, "narration": "Behind nearly every deal sits a web of entities designed to separate the celebrity's name from the financial structure." },
    { "sceneId": "ev-patterns-1", "component": "PatternRevealScene", "durationSeconds": 5, "beat": "evidence", "data": { "patterns": [{ "pattern": "Loss Harvesting", "evidence": "17 of 23 clubs report losses", "implication": "Offsets taxable income" }] }, "transition": { "enter": "slide-up" }, "pacing": "fast", "narration": "Seventeen of twenty-three clubs report consistent operating losses. Every single loss offsets taxable income elsewhere." },
    { "sceneId": "ev-risk-1", "component": "RiskMeterScene", "durationSeconds": 5, "beat": "evidence", "data": { "riskScore": 72, "riskFactors": [{ "label": "Tax Exposure", "value": 85, "type": "negative" }, { "label": "Regulatory Risk", "value": 60, "type": "negative" }] }, "narration": "The tax exposure alone scores eighty-five out of a hundred. Regulators are starting to notice." },
    { "sceneId": "verdict-1", "component": "VerdictScene", "durationSeconds": 5, "beat": "verdict", "data": { "verdict": "It was never about the sport", "verdictType": "negative", "warnings": ["Tax optimization vehicle", "Regulatory crackdown likely"] }, "transition": { "exit": "fade" }, "pacing": "dramatic", "mood": "danger", "narration": "It was never about the beautiful game. These clubs are tax optimization vehicles wrapped in stadium lights. And regulators are catching on." }
  ],
  "keywords": ["soccer clubs", "celebrity ownership", "tax optimization", "shell companies", "sports finance", "investigation"]` : '';

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
  ]` : ''}${compositionExample}
}

IMPORTANT: Use only IDs from the available content above. Do not invent IDs.${options.enableComposition ? `
IMPORTANT: For sceneComposition, respect ALL maxLength and maxItems constraints. Use real data from the research findings, not placeholders.
IMPORTANT: Include a "beat" field on EVERY scene — one of "question", "context", "mechanism", "evidence", "verdict". Beats must appear in this order.
IMPORTANT: Beat 1's question must be directly answered by beat 5's verdict. This is the narrative loop.
IMPORTANT: Include a "narration" field for EVERY scene — 1-2 sentences (max 30 words). Total narration: 150-250 words.
IMPORTANT: Include a "keywords" array — 5-8 hashtag keywords for social media distribution.` : ''}`;

  return prompt;

  // Helper to track phase numbers
  function phaseNum() {
    let n = 1; // Phase 1 is always Content Selection
    if (options.enableResearch) n++;
    if (options.enableRewriting) n++;
    return n + 1;
  }
}
