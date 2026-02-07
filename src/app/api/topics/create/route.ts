/**
 * Bulk Topic Creation API Route
 *
 * POST /api/topics/create
 * Accepts topics directly from Claude Code CLI and saves to Supabase.
 * Bypasses Gemini LLM discovery - used for external topic injection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';
import { isValidSourceSlug, type SourceSlug } from '@/src/lib/sources';
import type { TopicSignal, SourceBias, SuggestedTemplate } from '@/src/types/research';

const VALID_SIGNALS: TopicSignal[] = ['breaking', 'trending', 'controversial'];
const VALID_BIASES: SourceBias[] = ['left', 'center-left', 'center', 'center-right', 'right'];
const VALID_TEMPLATES: SuggestedTemplate[] = [
  'debunk_claim',
  'actor_investigation',
  'event_timeline',
  'policy_analysis',
  'financial_investigation',
  'controversy_analysis',
];

interface TopicInput {
  sourceSlug: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  signals?: string[];
  /** Generated research query for direct use in research templates */
  researchQuery?: string;
  /** Recommended research template */
  suggestedTemplate?: string;
  /** Verifiable claim extracted from the story */
  claim?: string;
  /** Source bias indicator */
  sourceBias?: string;
  /** Debunkability score 1-5 */
  debunkable?: number;
}

interface CreateTopicsRequest {
  topics: TopicInput[];
}

export async function POST(request: NextRequest) {
  // Parse request body
  let body: CreateTopicsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { topics } = body;

  // Validate topics array
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json(
      { error: 'Missing or empty topics array' },
      { status: 400 }
    );
  }

  // Validate each topic and collect unique source slugs
  const errors: Array<{ index: number; error: string }> = [];
  const sourceSlugSet = new Set<SourceSlug>();

  topics.forEach((topic, index) => {
    if (!topic.title?.trim()) {
      errors.push({ index, error: 'Missing required field: title' });
      return;
    }
    if (!topic.sourceSlug) {
      errors.push({ index, error: 'Missing required field: sourceSlug' });
      return;
    }
    if (!isValidSourceSlug(topic.sourceSlug)) {
      errors.push({ index, error: `Invalid source slug: ${topic.sourceSlug}` });
      return;
    }
    sourceSlugSet.add(topic.sourceSlug as SourceSlug);
  });

  // If all topics have validation errors, fail fast
  if (errors.length === topics.length) {
    return NextResponse.json(
      { error: 'All topics failed validation', errors },
      { status: 400 }
    );
  }

  try {
    // Fetch source IDs for all unique slugs
    const sourceSlugs = Array.from(sourceSlugSet);
    const { data: sources, error: sourcesError } = await supabaseServer
      .from('data_sources')
      .select('id, slug')
      .in('slug', sourceSlugs);

    if (sourcesError) {
      console.error('[Topics/Create] Failed to fetch sources:', sourcesError);
      return NextResponse.json(
        { error: 'Failed to fetch source data' },
        { status: 500 }
      );
    }

    // Build slug -> id map
    const sourceIdMap = new Map<string, string>();
    sources?.forEach((source) => {
      sourceIdMap.set(source.slug, source.id);
    });

    // Prepare valid topics for insertion
    const now = new Date().toISOString();
    const topicsToInsert: Array<{
      source_id: string;
      title: string;
      description: string | null;
      source_url: string | null;
      signals: TopicSignal[];
      research_query: string | null;
      suggested_template: string | null;
      claim: string | null;
      source_bias: string | null;
      debunkable: number | null;
      status: string;
      discovered_at: string;
      updated_at: string;
    }> = [];

    topics.forEach((topic, index) => {
      // Skip topics that failed validation
      if (errors.some((e) => e.index === index)) {
        return;
      }

      const sourceId = sourceIdMap.get(topic.sourceSlug);
      if (!sourceId) {
        errors.push({ index, error: `Source not found in database: ${topic.sourceSlug}` });
        return;
      }

      // Filter signals to valid values only
      const validSignals = (topic.signals || []).filter(
        (s): s is TopicSignal => VALID_SIGNALS.includes(s as TopicSignal)
      );

      // Validate and filter optional fields
      const validBias = topic.sourceBias && VALID_BIASES.includes(topic.sourceBias as SourceBias)
        ? topic.sourceBias
        : null;
      const validTemplate = topic.suggestedTemplate && VALID_TEMPLATES.includes(topic.suggestedTemplate as SuggestedTemplate)
        ? topic.suggestedTemplate
        : null;
      const validDebunkable = topic.debunkable && topic.debunkable >= 1 && topic.debunkable <= 5
        ? topic.debunkable
        : null;

      topicsToInsert.push({
        source_id: sourceId,
        title: topic.title.trim(),
        description: topic.description?.trim() || null,
        source_url: topic.sourceUrl?.trim() || null,
        signals: validSignals,
        research_query: topic.researchQuery?.trim() || null,
        suggested_template: validTemplate,
        claim: topic.claim?.trim() || null,
        source_bias: validBias,
        debunkable: validDebunkable,
        status: 'new',
        discovered_at: now,
        updated_at: now,
      });
    });

    // Insert topics
    if (topicsToInsert.length === 0) {
      return NextResponse.json({
        created: 0,
        topics: [],
        errors: errors.length > 0 ? errors : undefined,
        message: 'No valid topics to insert',
      });
    }

    const { data: insertedTopics, error: insertError } = await supabaseServer
      .from('research_topics')
      .insert(topicsToInsert)
      .select();

    if (insertError) {
      console.error('[Topics/Create] Failed to insert topics:', insertError);
      return NextResponse.json(
        { error: 'Failed to save topics', details: insertError.message },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      created: insertedTopics?.length ?? 0,
      topics: insertedTopics ?? [],
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Topics/Create] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
