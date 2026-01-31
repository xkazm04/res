/**
 * Discovery API Route
 *
 * POST /api/topics/discover
 * Discovers newsworthy topics from a source using LLM with Google Search grounding.
 * Implements rate limiting and persists discovered topics to Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Semaphore } from 'es-toolkit';
import { discoverTopics } from '@/src/lib/research/topic-discovery';
import { GeminiClient } from '@/src/lib/research/gemini-client';
import { supabaseServer } from '@/src/lib/supabase-server';
import { isValidSourceSlug } from '@/src/lib/sources';

// Rate limit: max 3 concurrent discovery requests
const discoverySemaphore = new Semaphore(3);
let activeRequests = 0;
const MAX_CONCURRENT = 3;

export async function POST(request: NextRequest) {
  // Parse request body
  let body: { sourceSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { sourceSlug } = body;

  // Validate sourceSlug is present
  if (!sourceSlug) {
    return NextResponse.json(
      { error: 'Missing required field: sourceSlug' },
      { status: 400 }
    );
  }

  // Validate sourceSlug is a known source
  if (!isValidSourceSlug(sourceSlug)) {
    return NextResponse.json(
      { error: `Invalid source slug: ${sourceSlug}` },
      { status: 400 }
    );
  }

  // Check rate limit with fast-fail (non-blocking check)
  if (activeRequests >= MAX_CONCURRENT) {
    return NextResponse.json(
      { error: 'Too many discovery requests. Please try again.' },
      { status: 429 }
    );
  }

  // Acquire semaphore and increment counter
  activeRequests++;
  await discoverySemaphore.acquire();

  try {
    // Create GeminiClient with gemini-2.5-flash (not deprecated 2.0)
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    const client = new GeminiClient(apiKey, 'gemini-2.5-flash');

    // Discover topics using LLM
    const topics = await discoverTopics(sourceSlug, client);

    // If no topics found, return empty result
    if (topics.length === 0) {
      return NextResponse.json({
        topics: [],
        count: 0,
        message: 'No new topics discovered',
      });
    }

    // Get source ID from database
    const { data: source, error: sourceError } = await supabaseServer
      .from('data_sources')
      .select('id')
      .eq('slug', sourceSlug)
      .single();

    if (sourceError || !source) {
      console.error('Source not found in database:', sourceSlug, sourceError);
      return NextResponse.json(
        { error: `Source not found: ${sourceSlug}` },
        { status: 404 }
      );
    }

    // Prepare topics for insertion
    const now = new Date().toISOString();
    const topicsToInsert = topics.map((topic) => ({
      source_id: source.id,
      title: topic.title,
      description: topic.description,
      source_url: topic.sourceUrl,
      signals: topic.signals,
      status: 'new',
      discovered_at: now,
      updated_at: now,
    }));

    // Insert discovered topics into database
    const { data: insertedTopics, error: insertError } = await supabaseServer
      .from('research_topics')
      .insert(topicsToInsert)
      .select();

    if (insertError) {
      console.error('Failed to insert topics:', insertError);
      return NextResponse.json(
        { error: 'Failed to save discovered topics' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      topics: insertedTopics,
      count: insertedTopics?.length ?? 0,
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json(
      { error: 'Discovery failed. Please try again.' },
      { status: 500 }
    );
  } finally {
    // Always release semaphore and decrement counter
    discoverySemaphore.release();
    activeRequests--;
  }
}
