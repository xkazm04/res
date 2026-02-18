import { supabaseServer } from '@/src/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/topics/[id]/accept
 * Marks a topic as accepted by setting user_verdict='accepted'.
 * Topic remains in DB for Learn system to review.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from('research_topics')
      .update({
        user_verdict: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to accept topic:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accept topic error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
