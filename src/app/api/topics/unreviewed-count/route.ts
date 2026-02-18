import { supabaseServer } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/topics/unreviewed-count
 * Returns count of topics that have a user_verdict but haven't been
 * reviewed by the Learn system yet (reviewed_at IS NULL).
 */
export async function GET() {
  try {
    const { count, error } = await supabaseServer
      .from('research_topics')
      .select('id', { count: 'exact', head: true })
      .not('user_verdict', 'is', null)
      .is('reviewed_at', null);

    if (error) {
      console.error('Failed to get unreviewed count:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    console.error('Unreviewed count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
