import { supabaseServer } from '@/src/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/topics/[id]
 * Marks topic as rejected by setting user_verdict='rejected'.
 * Topic stays in DB for the Learn system to analyze preferences.
 */
export async function DELETE(
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
        user_verdict: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to reject topic:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject topic error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
