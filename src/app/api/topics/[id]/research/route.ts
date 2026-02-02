/**
 * Research Initiation API Route
 *
 * POST /api/topics/[id]/research
 * Initiates deep research on a discovered topic using Claude Code.
 * Returns 202 Accepted with session ID.
 * Enforces idempotency via topic status check.
 *
 * Note: Current implementation is synchronous - waits for research to complete.
 * For production, this should dispatch to an async job queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';
import { getTemplateForSource } from '@/src/lib/sources';
import type { Granularity } from '@/src/templates/types/granularity';

// Status values that allow research initiation
const RESEARCHABLE_STATUSES = ['new', 'failed'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: topicId } = await params;

  // 1. Fetch topic with source info
  const { data: topic, error: topicError } = await supabaseServer
    .from('research_topics')
    .select(`
      id,
      title,
      status,
      session_id,
      source_id,
      data_sources!inner (
        slug
      )
    `)
    .eq('id', topicId)
    .single();

  if (topicError || !topic) {
    return NextResponse.json(
      { error: 'Topic not found' },
      { status: 404 }
    );
  }

  // 2. Idempotency check - reject if not in researchable state
  if (!RESEARCHABLE_STATUSES.includes(topic.status)) {
    return NextResponse.json(
      {
        error: 'Research already in progress or completed',
        status: topic.status,
        session_id: topic.session_id,
      },
      { status: 409 }
    );
  }

  // 3. Generate session ID
  const sessionId = crypto.randomUUID();

  // 4. Get template based on source
  // Supabase returns joined FK data as an object for .single() queries
  const dataSource = topic.data_sources as unknown as { slug: string };
  const sourceSlug = dataSource.slug;
  const template = getTemplateForSource(sourceSlug);

  // 5. Update topic status to queued atomically
  const { error: updateError } = await supabaseServer
    .from('research_topics')
    .update({
      status: 'queued',
      session_id: sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', topicId)
    .eq('status', topic.status); // Conditional update for race prevention

  if (updateError) {
    console.error('Failed to update topic status:', updateError);
    return NextResponse.json(
      { error: 'Failed to initiate research' },
      { status: 500 }
    );
  }

  // 6. Dispatch research using Claude Code system
  // Note: This is synchronous for simplicity. Production should use async job queue.
  try {
    // Update status to researching
    await supabaseServer
      .from('research_topics')
      .update({ status: 'researching', updated_at: new Date().toISOString() })
      .eq('id', topicId);

    // Import dynamically to avoid loading Claude runner at startup
    const { ResearchOrchestrator } = await import(
      '@/src/templates/builder/ResearchOrchestrator'
    );
    const orchestrator = new ResearchOrchestrator();

    const result = await orchestrator.execute({
      templateId: template,
      query: topic.title,
      granularity: 'standard' as Granularity,
      saveToDb: true,
      verbose: false,
    });

    // Update topic with result
    await supabaseServer
      .from('research_topics')
      .update({
        status: result.success ? 'completed' : 'failed',
        session_id: result.sessionId || sessionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', topicId);
  } catch (err) {
    console.error('[Research] Execution error:', err);
    // Mark as failed
    await supabaseServer
      .from('research_topics')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', topicId);
  }

  // 7. Return 202 Accepted
  return NextResponse.json(
    {
      session_id: sessionId,
      status: 'queued',
      template,
      message: 'Research initiated',
    },
    { status: 202 }
  );
}
