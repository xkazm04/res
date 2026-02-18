'use client';

import { useState, useCallback } from 'react';
import { SOURCES } from '@/src/lib/sources';

const PROJECT_PATH = 'C:\\Users\\mkdol\\dolla\\res';

/**
 * Sources excluded from CLI discovery:
 * - twitter: X blocks crawlers, requires auth
 * - reddit: WebSearch cannot reliably surface Reddit news content
 */
const EXCLUDED_SLUGS = new Set(['twitter', 'reddit']);
const DISCOVERABLE_SOURCES = SOURCES.filter(s => !EXCLUDED_SLUGS.has(s.slug));

function buildDiscoveryPrompt(): string {
  const date = new Date().toISOString().split('T')[0];

  const sourcesSection = DISCOVERABLE_SOURCES.map((source, i) => {
    return `${i + 1}. **${source.name}** (\`${source.slug}\`) — ${source.searchPattern}`;
  }).join('\n');

  return `# Daily News Discovery Task

**Date**: ${date}

## Mission

Search ${DISCOVERABLE_SOURCES.length} major news sources for today's most newsworthy topics. Extract key stories and save them to the database via the local API.

## Sources

${sourcesSection}

## Search Strategy

IMPORTANT: The \`site:\` search operator works well for **TechCrunch, Bloomberg, and Al Jazeera** but often returns no results for **BBC, Reuters, NYT, Guardian, AP News**. Adapt your strategy:

**Tier 1 — site: operator works reliably:**
- \`site:techcrunch.com startup funding news ${date}\`
- \`site:bloomberg.com financial markets today\`
- \`site:aljazeera.com world news today\`

**Tier 2 — use source name + keywords instead:**
- \`BBC News breaking news today ${date}\`
- \`Reuters latest headlines ${date}\`
- \`New York Times news today ${date}\`
- \`Guardian newspaper world news ${date}\`
- \`AP News breaking news today ${date}\`

For each source, extract 3-5 high-quality topics. Focus on the last 48 hours. Prioritize:
- **Breaking**: Developing story, high urgency, within 24 hours
- **Trending**: Widely discussed, high engagement
- **Controversial**: Disputed claims, multiple perspectives, public debate

## Topic Fields

For each topic, extract:

| Field | Description | Required |
|-------|-------------|----------|
| \`sourceSlug\` | Source identifier (bbc, reuters, etc.) | Yes |
| \`title\` | Factual headline | Yes |
| \`description\` | 1-2 sentence summary | Yes |
| \`sourceUrl\` | Direct URL to article (only if found in results) | No |
| \`signals\` | Array: "breaking", "trending", "controversial" | No |
| \`claim\` | A specific, verifiable claim from the story | No |
| \`sourceBias\` | "left", "center-left", "center", "center-right", "right" | No |
| \`debunkable\` | 1-5: how easily the claim can be verified with public data | No |
| \`suggestedTemplate\` | One of: "debunk_claim", "actor_investigation", "event_timeline", "policy_analysis", "financial_investigation", "controversy_analysis" | No |
| \`researchQuery\` | A well-formed research query for deep investigation | No |

## Saving Topics

After discovering all topics, write the JSON payload to a temp file, then POST it:

\`\`\`bash
cat > /tmp/topics.json << 'TOPICS_EOF'
{"topics": [ ...all topics... ]}
TOPICS_EOF
curl -s -X POST http://localhost:3000/api/topics/create -H "Content-Type: application/json" -d @/tmp/topics.json
\`\`\`

## Execution Steps

1. **Search**: WebSearch each of the ${DISCOVERABLE_SOURCES.length} sources for current news
2. **Extract**: Identify newsworthy topics with research potential
3. **Enrich**: Extract verifiable claims, assess bias, score debunkability
4. **Save**: Write JSON to temp file, then curl POST to http://localhost:3000/api/topics/create
5. **Report**: Summarize topics saved per source

## User Preferences

If the file \`.claude/discovery-preferences.md\` exists in the project root, read it first. It contains learned user preferences from past accept/reject decisions. Use those preferences to **prioritize** (not filter) topics — still discover diverse news, but weight scoring toward what the user finds interesting.

## Quality Rules

- Only include stories you actually found in search results
- Do NOT fabricate URLs — only include URLs that appeared in results
- Skip old news — focus on last 48 hours
- Avoid duplicating the same story across sources
- Cover diverse categories: politics, tech, business, world events, science
- Prefer stories with strong research potential (verifiable claims, multiple angles)

Begin searching now.`;
}

export function useDiscovery() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [prompt, setPrompt] = useState('');

  const startDiscovery = useCallback(() => {
    const p = buildDiscoveryPrompt();
    setPrompt(p);
    setIsDiscovering(true);
    setIsTerminalOpen(true);
  }, []);

  const closeTerminal = useCallback(() => {
    setIsTerminalOpen(false);
    setIsDiscovering(false);
  }, []);

  const handleComplete = useCallback(() => {
    setIsDiscovering(false);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('[Discovery] Error:', error);
    setIsDiscovering(false);
  }, []);

  return {
    isTerminalOpen,
    isDiscovering,
    prompt,
    projectPath: PROJECT_PATH,
    startDiscovery,
    closeTerminal,
    handleComplete,
    handleError,
  };
}
