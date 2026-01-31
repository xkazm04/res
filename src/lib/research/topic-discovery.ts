/**
 * Topic Discovery Service
 *
 * LLM-powered discovery of newsworthy topics from configured sources
 * using Google Search grounding with URL validation.
 */

import type { TopicSignal } from '@/src/types/research';
import type { GeminiClient } from './gemini-client';
import { SOURCES } from '@/src/lib/sources';
import {
  buildDiscoveryPrompt,
  DISCOVERY_SYSTEM_PROMPT,
} from './discovery-prompts';

/**
 * A discovered topic with validated URL
 */
export interface DiscoveredTopic {
  title: string;
  description: string;
  sourceUrl: string;
  signals: TopicSignal[];
}

/**
 * Raw topic from LLM response before validation
 */
interface RawTopic {
  title: string;
  description: string;
  url: string;
  signals: string[];
}

/**
 * Expected domains for each source - used for URL validation
 */
const EXPECTED_DOMAINS: Record<string, string[]> = {
  bbc: ['bbc.com', 'bbc.co.uk'],
  twitter: ['twitter.com', 'x.com'],
  reuters: ['reuters.com'],
  techcrunch: ['techcrunch.com'],
  bloomberg: ['bloomberg.com'],
  nyt: ['nytimes.com'],
  guardian: ['theguardian.com'],
  'ap-news': ['apnews.com'],
  'al-jazeera': ['aljazeera.com'],
  reddit: ['reddit.com'],
};

/**
 * Valid signal values
 */
const VALID_SIGNALS: TopicSignal[] = ['breaking', 'trending', 'controversial'];

/**
 * Validate a URL by making a HEAD request
 *
 * @param url - URL to validate
 * @param timeoutMs - Timeout in milliseconds (default 5000)
 * @returns true if URL is accessible (status 200-399)
 */
async function validateUrl(
  url: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

/**
 * Check if URL domain matches expected source domains
 *
 * @param url - URL to check
 * @param sourceSlug - Source slug to match against
 * @returns true if URL domain matches expected domains for source
 */
function checkDomainMatch(url: string, sourceSlug: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const allowed = EXPECTED_DOMAINS[sourceSlug] || [];
    return allowed.some((domain) => hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Filter signals to only valid values
 *
 * @param signals - Array of signal strings from LLM
 * @returns Array of valid TopicSignal values
 */
function filterValidSignals(signals: string[]): TopicSignal[] {
  return signals.filter((s): s is TopicSignal =>
    VALID_SIGNALS.includes(s as TopicSignal)
  );
}

/**
 * Validate topics from LLM response
 *
 * @param topics - Raw topics from LLM
 * @param sourceSlug - Source slug for domain validation
 * @returns Array of validated DiscoveredTopic objects
 */
async function validateTopics(
  topics: RawTopic[],
  sourceSlug: string
): Promise<DiscoveredTopic[]> {
  const validationResults = await Promise.all(
    topics.map(async (topic) => {
      const isUrlValid = await validateUrl(topic.url);
      const domainMatches = checkDomainMatch(topic.url, sourceSlug);

      return {
        topic,
        isValid: isUrlValid && domainMatches,
      };
    })
  );

  return validationResults
    .filter((result) => result.isValid)
    .map((result) => ({
      title: result.topic.title,
      description: result.topic.description,
      sourceUrl: result.topic.url,
      signals: filterValidSignals(result.topic.signals),
    }));
}

/**
 * Parse JSON response from LLM, handling code blocks and various formats
 *
 * @param text - Raw text response from LLM
 * @returns Parsed array of topics or empty array
 */
function parseJsonResponse(text: string): RawTopic[] {
  try {
    // Try direct parse first
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : parsed.topics || [];
  } catch {
    // Try extracting from code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        return Array.isArray(parsed) ? parsed : parsed.topics || [];
      } catch {
        // Continue to fallback
      }
    }

    // Fallback: try finding JSON array or object
    const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : parsed.topics || [];
      } catch {
        // JSON parsing failed
      }
    }

    return [];
  }
}

/**
 * Discover newsworthy topics from a source using LLM with Google Search grounding
 *
 * @param sourceSlug - The slug of the source to discover topics from
 * @param client - Configured GeminiClient instance
 * @returns Array of discovered and validated topics
 * @throws Error if source is not found
 */
export async function discoverTopics(
  sourceSlug: string,
  client: GeminiClient
): Promise<DiscoveredTopic[]> {
  // Get source from registry
  const source = SOURCES.find((s) => s.slug === sourceSlug);
  if (!source) {
    throw new Error(`Unknown source: ${sourceSlug}`);
  }

  // Build prompt with source-specific instructions
  const prompt = buildDiscoveryPrompt(source);

  // Call LLM with Google Search grounding
  const response = await client.research(prompt, DISCOVERY_SYSTEM_PROMPT);

  // Parse JSON response
  const rawTopics = parseJsonResponse(response.text);

  if (rawTopics.length === 0) {
    return [];
  }

  // Validate URLs and domain matching
  const validatedTopics = await validateTopics(rawTopics, sourceSlug);

  return validatedTopics;
}
