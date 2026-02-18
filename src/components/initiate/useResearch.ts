'use client';

import { useState, useCallback, useRef } from 'react';
import { getTemplate } from '@/src/templates/configs';
import { getTemplateForSource } from '@/src/lib/sources';
import { GRANULARITY_CONFIGS } from '@/src/templates/types/granularity';
import type { TemplateConfig } from '@/src/templates/types/config';
import type { Granularity } from '@/src/templates/types/granularity';

const PROJECT_PATH = 'C:\\Users\\mkdol\\dolla\\res';

export interface QueueTopic {
  id: string;
  title: string;
  suggestedTemplate: string | null;
  researchQuery: string | null;
  sourceSlug: string;
  status: string;
}

/**
 * Build a research prompt client-side from template config.
 * Mirrors PromptComposer.buildResearchPrompt() but without fs.readFileSync.
 */
function buildResearchPrompt(
  config: TemplateConfig,
  query: string,
  granularity: Granularity,
  topicId: string,
): string {
  const gc = GRANULARITY_CONFIGS[granularity];
  const perspectives = config.perspectives.slice(0, gc.perspectiveCount);

  const anglesSection = config.searchAngles
    .map((a) => `**${a.name}**\n${a.items.map((item) => `  - ${item}`).join('\n')}`)
    .join('\n\n');

  const findingTypesSection = config.findingTypes
    .map((ft) => `**${ft.name}** (${ft.displayName})\n${ft.description}\nSchema hint: ${ft.extractedDataSchema}`)
    .join('\n\n');

  const perspectivesSection = perspectives
    .map((p, i) => `${i + 1}. ${p}`)
    .join('\n');

  return `# Research Task: ${query}

**Template:** ${config.templateName}
**Granularity:** ${granularity}
**Max Searches:** ${gc.maxSearches}

---

## Phase 1: Query Generation

${config.searchIntro}

### Search Angles

${anglesSection}

### Depth Guidance

${config.searchDepthGuidance[granularity]}

---

## Phase 2: Web Search

Execute up to **${gc.maxSearches}** web searches.
Use the WebSearch tool to gather current information.
Search for relevant, recent, and authoritative sources.

---

## Phase 3: Credibility Assessment

Verification level: **${gc.verificationLevel}**
Assess source credibility and cross-reference claims.

---

## Phase 4: Finding Extraction

${config.extractionIntro}

### Finding Types

${findingTypesSection}

### Extraction Guidelines

${config.extractionGuidelines}

### Analysis Instruction

${config.analysisInstruction}

---

## Phase 5: Perspectives

Generate **${gc.perspectiveCount}** expert perspectives:

${perspectivesSection}

Analyze findings from each perspective.

---

## Phase 6: Intelligence Analysis

Synthesize findings into actionable intelligence. Identify cross-cutting patterns, contradictions, knowledge gaps, and meta-analysis insights.

---

## Phase 7: Save Results to Database

**CRITICAL**: After completing research, you MUST save your results to the database. Without this step, all research is lost.

Collect ALL your findings, sources, and perspectives into a JSON object matching this exact structure, then write it to a temp file and POST it:

\`\`\`json
{
  "query": "${query}",
  "template": "${config.templateId}",
  "status": "completed",
  "findings": [
    {
      "finding_type": "string (from template finding types above)",
      "content": "string (2-4 sentence finding)",
      "summary": "string (one-line summary)",
      "analysis": "string (expert commentary)",
      "confidence_score": 0.75,
      "temporal_context": "current|historical|predicted",
      "extracted_data": {},
      "supporting_sources": ["url1", "url2"]
    }
  ],
  "sources": [
    {
      "url": "string",
      "title": "string",
      "domain": "string",
      "credibility_score": 0.8,
      "credibility_label": "high|medium|low"
    }
  ],
  "perspectives": [
    {
      "perspective_type": "string (from perspectives list above)",
      "analysis_text": "string (200-400 words)",
      "key_insights": ["insight1", "insight2"],
      "recommendations": ["rec1"],
      "warnings": ["warning1"]
    }
  ],
  "contradictions": [
    {
      "claim_1": "string",
      "claim_2": "string",
      "source_1": "url",
      "source_2": "url",
      "significance": "string"
    }
  ],
  "knowledge_gaps": [
    {
      "gap_type": "temporal|actor|topic|evidence|geographic",
      "description": "string",
      "priority": "high|medium|low",
      "suggested_queries": ["query1"]
    }
  ],
  "search_queries_executed": ["query1", "query2"]
}
\`\`\`

### Save Rules
1. **findings**: Include ALL findings, ordered by confidence_score descending. Every finding must have at least one supporting_source URL.
2. **sources**: Include ALL sources consulted, even low-credibility ones.
3. **perspectives**: Include exactly ${gc.perspectiveCount} perspectives.
4. **contradictions**: Only include genuine contradictions (may be empty array).
5. **knowledge_gaps**: Include 2-5 most significant gaps.
6. Confidence scores should be calibrated — not all 0.9+.

### Save Command

**Step 1:** Use the **Write** tool to save the JSON to \`${PROJECT_PATH}\\\\tmp-save.json\`:

\`\`\`
Write tool → file_path: "${PROJECT_PATH}\\\\tmp-save.json", content: <your complete JSON>
\`\`\`

**Step 2:** Use the **Bash** tool to POST it:

\`\`\`bash
powershell -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/topics/${topicId}/save-research' -Method POST -ContentType 'application/json' -InFile '${PROJECT_PATH}\\\\tmp-save.json'"
\`\`\`

After the POST succeeds (returns \`success: True\`), provide a brief summary of your findings.`;
}

export function useResearch() {
  const [queue, setQueue] = useState<QueueTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isResearching, setIsResearching] = useState(false);

  // Track session ID for resume support
  const sessionIdRef = useRef<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/topics/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data.topics || []);
      }
    } catch (err) {
      console.error('[Research] Failed to fetch queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    await fetchQueue();
  }, [fetchQueue]);

  const startResearch = useCallback((topicId: string) => {
    const topic = queue.find((t) => t.id === topicId);
    if (!topic) return;

    // Determine template
    const templateId = topic.suggestedTemplate || getTemplateForSource(topic.sourceSlug);
    const config = getTemplate(templateId);
    if (!config) {
      console.error(`[Research] Template not found: ${templateId}`);
      return;
    }

    // Build research prompt
    const query = topic.researchQuery || topic.title;
    const researchPrompt = buildResearchPrompt(config, query, 'standard', topicId);

    setActiveTopicId(topicId);
    setPrompt(researchPrompt);
    setIsResearching(true);
    setIsTerminalOpen(true);
    sessionIdRef.current = null;
  }, [queue]);

  const closeTerminal = useCallback(() => {
    setIsTerminalOpen(false);
    setIsResearching(false);
    setActiveTopicId(null);
    sessionIdRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
    setIsResearching(false);
    // save-research endpoint handles both DB persistence and topic completion.
    // If CLI didn't call save-research, mark topic completed as fallback.
    if (activeTopicId) {
      fetch(`/api/topics/${activeTopicId}/complete-research`, { method: 'POST' }).catch(() => {});
    }
  }, [activeTopicId]);

  const handleError = useCallback((error: string) => {
    console.error('[Research] Error:', error);
    setIsResearching(false);
  }, []);

  const setSessionId = useCallback((sid: string) => {
    sessionIdRef.current = sid;
  }, []);

  return {
    queue,
    isLoading,
    activeTopicId,
    isTerminalOpen,
    isResearching,
    prompt,
    projectPath: PROJECT_PATH,
    sessionIdRef,
    fetchQueue,
    refreshQueue,
    startResearch,
    closeTerminal,
    handleComplete,
    handleError,
    setSessionId,
  };
}
