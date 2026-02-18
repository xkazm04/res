import { supabaseServer } from '@/src/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/topics/mark-reviewed
 * Marks topics as reviewed by the Learn system.
 * Body: { topicIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicIds } = body;

    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      return NextResponse.json(
        { error: 'topicIds array is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from('research_topics')
      .update({ reviewed_at: new Date().toISOString() })
      .in('id', topicIds);

    if (error) {
      console.error('Failed to mark topics as reviewed:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: topicIds.length });
  } catch (error) {
    console.error('Mark reviewed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
