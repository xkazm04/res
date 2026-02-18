import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

/**
 * POST /api/topics/[id]/complete-research
 * Marks a topic as completed after research finishes.
 * Called by the CLI prompt (curl) or the onComplete callback.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('research_topics')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_verdict', 'accepted');

    if (error) {
      console.error('Failed to complete research:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete research error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
