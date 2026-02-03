/**
 * News Feed Prompt Generation API Route
 *
 * POST /api/topics/prompt
 * Generates a Claude Code prompt for discovering topics from all 10 news sources.
 * Returns the prompt text that Vibeman will pass to Claude Code CLI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SOURCES } from '@/src/lib/sources';

interface PromptRequest {
  period: string;
}

interface PromptResponse {
  prompt: string;
  config: {
    period: string;
    sources: string[];
    date: string;
  };
}

/**
 * Generate the Claude Code prompt for news feed discovery
 */
function generateNewsFeedPrompt(period: string, date: string): string {
  // Build sources section
  const sourcesSection = SOURCES.map((source, index) => {
    return `${index + 1}. **${source.name}** (\`${source.slug}\`)
   - Search: \`${source.searchPattern}\``;
  }).join('\n\n');

  return `# News Feed Discovery Task

**Period**: ${period}
**Date**: ${date}

## Your Mission

Search 10 major news sources for newsworthy topics from ${period}. Extract key stories and save them to the research system via API.

## Sources to Search

${sourcesSection}

## How to Search

For each source:
1. Use WebSearch with the source's search pattern + relevant keywords
2. Focus on news from ${period}
3. Look for stories that are breaking, trending, or controversial
4. Extract 3-5 high-quality topics per source

Example search queries:
- \`site:bbc.com/news breaking news ${date}\`
- \`site:reuters.com latest headlines today\`
- \`site:techcrunch.com startup funding news\`

## Topic Requirements

For each newsworthy story, extract:

| Field | Description | Required |
|-------|-------------|----------|
| \`sourceSlug\` | Source identifier (bbc, reuters, etc.) | Yes |
| \`title\` | Headline - concise, factual | Yes |
| \`description\` | 1-2 sentence summary of the story | No |
| \`sourceUrl\` | Direct URL to the article | No |
| \`signals\` | Array of classification tags | No |

## Signal Classification

Classify each topic with relevant signals:

- **\`breaking\`**: Developing story, high urgency, happened within 24 hours
- **\`trending\`**: High engagement, widely discussed on social media
- **\`controversial\`**: Disputed claims, multiple perspectives, public debate

A topic can have multiple signals or none.

## Output Format

After discovering topics, you MUST call the API to save them.

Use the Bash tool to make this API call:

\`\`\`bash
curl -X POST http://localhost:3001/api/topics/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "topics": [
      {
        "sourceSlug": "bbc",
        "title": "Example headline here",
        "description": "Brief summary of the story",
        "sourceUrl": "https://bbc.com/news/article-123",
        "signals": ["breaking", "trending"]
      },
      {
        "sourceSlug": "reuters",
        "title": "Another headline",
        "description": "Another summary",
        "sourceUrl": "https://reuters.com/article/456",
        "signals": ["controversial"]
      }
    ]
  }'
\`\`\`

## Execution Steps

1. **Search Phase**: Use WebSearch for each of the 10 sources
2. **Extract Phase**: Parse results and identify newsworthy topics
3. **Validate Phase**: Ensure each topic has at least a title and sourceSlug
4. **Save Phase**: Call the API with all discovered topics in a single request
5. **Report Phase**: Summarize what was saved (e.g., "Saved 35 topics from 10 sources")

## Quality Guidelines

- **Accuracy**: Only include stories you found in search results
- **Relevance**: Focus on ${period} - skip old news
- **Diversity**: Cover different types of news (politics, tech, business, world events)
- **No Duplicates**: Don't repeat the same story from multiple sources
- **Real URLs**: Only include URLs that appeared in search results

## Example Output

After completing searches, your final action should be the curl command above with all discovered topics, followed by a summary like:

"Successfully saved 42 topics:
- Twitter: 4 topics
- BBC: 5 topics
- Reuters: 4 topics
- TechCrunch: 5 topics
- Bloomberg: 4 topics
- NYT: 5 topics
- Guardian: 4 topics
- AP News: 4 topics
- Al Jazeera: 4 topics
- Reddit: 3 topics"

Now begin searching each source for newsworthy topics from ${period}.`;
}

export async function POST(request: NextRequest) {
  // Parse request body
  let body: PromptRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { period } = body;

  // Validate period
  if (!period?.trim()) {
    return NextResponse.json(
      { error: 'Missing required field: period' },
      { status: 400 }
    );
  }

  // Get current date for context
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Generate prompt
  const prompt = generateNewsFeedPrompt(period.trim(), date);

  const response: PromptResponse = {
    prompt,
    config: {
      period: period.trim(),
      sources: SOURCES.map((s) => s.slug),
      date,
    },
  };

  return NextResponse.json(response);
}
