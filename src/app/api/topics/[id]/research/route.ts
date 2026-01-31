/**
 * Research Initiation API Route
 *
 * POST /api/topics/[id]/research
 * Initiates deep research on a discovered topic.
 * Returns 202 Accepted with session ID immediately.
 * Enforces idempotency via topic status check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';
import { getTemplateForSource } from '@/src/lib/sources';

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

  // 5. Update topic status atomically
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

  // 6. Return 202 Accepted immediately
  // Note: Actual research dispatch will be added in Phase 12
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
