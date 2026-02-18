import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';
import { SupabasePersistence } from '@/src/templates/persistence/SupabasePersistence';
import { ActorOutputSchema } from '@/src/templates/types/output';

/**
 * POST /api/topics/[id]/save-research
 *
 * Accepts ActorOutput JSON from the CLI terminal, creates a research session,
 * persists findings/sources/perspectives via SupabasePersistence, and marks
 * the topic as completed with the linked session ID.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params;

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    // 1. Parse and validate body
    const body = await request.json();
    const parsed = ActorOutputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid research output', details: parsed.error.issues.slice(0, 5) },
        { status: 400 }
      );
    }

    const output = parsed.data;

    // 2. Fetch topic for context
    const { data: topic, error: topicError } = await supabaseServer
      .from('research_topics')
      .select('id, title, suggested_template, user_verdict')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // 3. Create session and persist research
    const persistence = new SupabasePersistence();

    const { sessionId } = await persistence.createSession({
      query: output.query,
      templateType: output.template,
      granularity: 'standard',
      maxSearches: 8,
    });

    await persistence.persistResearch(sessionId, output);

    // 4. Mark topic as completed with session link
    await supabaseServer
      .from('research_topics')
      .update({
        status: 'completed',
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', topicId);

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('[save-research] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
