import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/** Video sections for content assignment */
type VideoSection = 'metrics' | 'charts' | 'insights' | 'summary';

/** Input item with section assignments */
interface CurationItem {
  id: string;
  content: string;
  type: string;
  category: 'finding' | 'perspective' | 'contradiction' | 'gap' | 'causal_chain';
  confidence: number;
  targetSections: VideoSection[];
  rawData?: Record<string, unknown>;
}

interface CurationRequest {
  query: string;
  templateType: string;
  items: CurationItem[];
}

/** Curated output for video generation */
interface CuratedVideoContent {
  metrics: Array<{
    label: string;
    value: number;
    suffix?: string;
    color: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
    sourceItemId?: string;
  }>;
  charts: {
    barData: Array<{ label: string; value: number }>;
    lineData: number[];
    pieData: Array<{ label: string; value: number; color: string }>;
    chartNarrative?: string;
  };
  insights: {
    keyFindings: string[];
    warnings: string[];
  };
  summary: {
    headline: string;
    verdict: string;
    confidenceScore: number;
    recommendation: string;
  };
}

const CURATION_PROMPT = `You are a video content curator for research intelligence reports. Your task is to transform raw research findings into compelling, visually-focused video content.

## Research Context
- **Topic**: {query}
- **Template**: {templateType}

## Input Items (with section assignments)
{itemsJson}

## Your Task
Analyze the input items and generate content optimized for each video section they're assigned to.

### Section Requirements:

**METRICS** (4 key numbers that grab attention)
- Extract or derive numerical values from the content
- Create compelling labels (2-5 words)
- Assign colors by sentiment: cyan=neutral, emerald=positive, amber=caution, rose=negative, violet=special
- Values should be integers (percentages use suffix: "%")
- If content doesn't have explicit numbers, derive meaningful metrics (count of entities, confidence %, time periods, etc.)

**CHARTS** (data visualization categories)
- barData: 3-5 categories with values (distribution/comparison)
- lineData: 6-10 values showing a trend (0-100 scale)
- pieData: 3-4 segments with percentages and hex colors
- chartNarrative: 1 sentence explaining what the charts reveal

**INSIGHTS** (key takeaways and alerts)
- keyFindings: 2-3 punchy, memorable statements (under 80 chars each)
- warnings: 1-2 critical alerts or red flags (if applicable)

**SUMMARY** (final verdict)
- headline: Attention-grabbing 5-8 word headline
- verdict: 1-2 sentence assessment
- confidenceScore: Overall confidence 0-100
- recommendation: Clear action item

## Output Format
Return ONLY valid JSON matching this structure:
{
  "metrics": [
    { "label": "string", "value": number, "suffix": "optional", "color": "cyan|emerald|amber|rose|violet", "sourceItemId": "optional" }
  ],
  "charts": {
    "barData": [{ "label": "string", "value": number }],
    "lineData": [numbers],
    "pieData": [{ "label": "string", "value": number, "color": "#hex" }],
    "chartNarrative": "string"
  },
  "insights": {
    "keyFindings": ["string"],
    "warnings": ["string"]
  },
  "summary": {
    "headline": "string",
    "verdict": "string",
    "confidenceScore": number,
    "recommendation": "string"
  }
}

IMPORTANT:
- Make metrics impactful and memorable
- Ensure chart data tells a coherent story
- Keep insights punchy and quotable
- Summary should feel like a news anchor's closing statement
- Use the raw data when available for accurate extraction
- Only include warnings if genuinely warranted`;

function buildPrompt(request: CurationRequest): string {
  // Group items by their target sections for context
  const itemsBySection: Record<VideoSection, CurationItem[]> = {
    metrics: [],
    charts: [],
    insights: [],
    summary: [],
  };

  request.items.forEach(item => {
    item.targetSections.forEach(section => {
      itemsBySection[section].push(item);
    });
  });

  // Format items with their section assignments
  const itemsJson = JSON.stringify(
    request.items.map(item => ({
      id: item.id,
      type: item.type,
      category: item.category,
      confidence: item.confidence,
      content: item.content,
      targetSections: item.targetSections,
      rawData: item.rawData,
    })),
    null,
    2
  );

  return CURATION_PROMPT
    .replace('{query}', request.query)
    .replace('{templateType}', request.templateType)
    .replace('{itemsJson}', itemsJson);
}

export async function POST(request: NextRequest) {
  try {
    const body: CurationRequest = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided for curation' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const prompt = buildPrompt(body);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Parse and validate response
    let curatedContent: CuratedVideoContent;
    try {
      curatedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[Curate] Failed to parse LLM response:', text);
      return NextResponse.json(
        { error: 'Failed to parse curation response' },
        { status: 500 }
      );
    }

    // Validate and fill defaults
    curatedContent = {
      metrics: curatedContent.metrics || [],
      charts: {
        barData: curatedContent.charts?.barData || [],
        lineData: curatedContent.charts?.lineData || [50],
        pieData: curatedContent.charts?.pieData || [],
        chartNarrative: curatedContent.charts?.chartNarrative,
      },
      insights: {
        keyFindings: curatedContent.insights?.keyFindings || [],
        warnings: curatedContent.insights?.warnings || [],
      },
      summary: {
        headline: curatedContent.summary?.headline || 'Analysis Complete',
        verdict: curatedContent.summary?.verdict || 'Review the findings for details.',
        confidenceScore: curatedContent.summary?.confidenceScore || 70,
        recommendation: curatedContent.summary?.recommendation || 'Further investigation recommended.',
      },
    };

    // Ensure we have 4 metrics (pad if needed)
    while (curatedContent.metrics.length < 4) {
      curatedContent.metrics.push({
        label: 'Data Point',
        value: Math.round(Math.random() * 100),
        color: 'cyan',
      });
    }

    return NextResponse.json(curatedContent);
  } catch (error) {
    console.error('[Curate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
