/**
 * Gemini client with Google Search grounding using Genkit.
 *
 * Uses @genkit-ai/googleai for Gemini models with built-in
 * web search grounding capabilities.
 */

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export interface Source {
  url: string;
  title: string;
  domain: string;
  snippet: string;
  sourceType: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ResearchResponse {
  text: string;
  sources: Source[];
  searchQueries: string[];
  tokenUsage: TokenUsage | null;
  costUsd: number | null;
}

const COST_RATES: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
};

export class GeminiClient {
  private ai: ReturnType<typeof genkit>;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash') {
    this.modelName = modelName;

    // Initialize Genkit with Google AI plugin
    this.ai = genkit({
      plugins: [
        googleAI({ apiKey }),
      ],
    });
  }

  async research(query: string, systemPrompt?: string): Promise<ResearchResponse> {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${query}` : query;

    const response = await this.ai.generate({
      model: googleAI.model(this.modelName),
      prompt: fullPrompt,
      config: {
        googleSearchRetrieval: true,
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    const text = response.text;

    // Extract sources from grounding metadata
    const sources: Source[] = [];
    const searchQueries: string[] = [];

    // Access grounding metadata from custom response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customResponse = response.custom as any;
    const groundingMetadata = customResponse?.candidates?.[0]?.groundingMetadata;

    if (groundingMetadata) {
      // Extract search queries
      if (groundingMetadata.webSearchQueries) {
        searchQueries.push(...groundingMetadata.webSearchQueries);
      }

      // Extract grounding chunks (sources)
      if (groundingMetadata.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web) {
            const url = chunk.web.uri || '';
            const title = chunk.web.title || '';
            let domain = '';

            try {
              domain = new URL(url).hostname;
            } catch {
              domain = title;
            }

            sources.push({
              url,
              title,
              domain,
              snippet: '',
              sourceType: 'web',
            });
          }
        }
      }
    }

    // Get token usage from response metadata
    const usageMetadata = customResponse?.usageMetadata;
    const tokenUsage: TokenUsage | null = usageMetadata ? {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : null;

    // Calculate cost
    const costUsd = this.estimateCost(tokenUsage);

    return {
      text,
      sources,
      searchQueries,
      tokenUsage,
      costUsd,
    };
  }

  async generateJson<T>(prompt: string, systemPrompt?: string): Promise<{ data: T | null; response: ResearchResponse }> {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const response = await this.ai.generate({
      model: googleAI.model(this.modelName),
      prompt: fullPrompt,
      config: {
        temperature: 0.3,
      },
      output: {
        format: 'json',
      },
    });

    const text = response.text;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customResponse = response.custom as any;
    const usageMetadata = customResponse?.usageMetadata;
    const tokenUsage: TokenUsage | null = usageMetadata ? {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : null;

    // Parse JSON
    let data: T | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Try extracting from code blocks
      const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (match) {
        try {
          data = JSON.parse(match[1]);
        } catch {
          // Fallback: try finding JSON array or object
          const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
          if (jsonMatch) {
            try {
              data = JSON.parse(jsonMatch[0]);
            } catch {
              console.warn('Failed to parse JSON from response');
            }
          }
        }
      }
    }

    return {
      data,
      response: {
        text,
        sources: [],
        searchQueries: [],
        tokenUsage,
        costUsd: this.estimateCost(tokenUsage),
      },
    };
  }

  private estimateCost(tokenUsage: TokenUsage | null): number | null {
    if (!tokenUsage) return null;

    const rates = COST_RATES[this.modelName] || { input: 0.075, output: 0.30 };
    const inputCost = (tokenUsage.inputTokens / 1_000_000) * rates.input;
    const outputCost = (tokenUsage.outputTokens / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }
}
