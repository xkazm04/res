import { supabaseServer } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/topics/unreviewed
 * Returns all topics with a user_verdict that haven't been reviewed
 * by the Learn system yet. Used by the Learn CLI to fetch data.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('research_topics')
      .select(`
        id, title, description, status, user_verdict,
        discovered_at, updated_at, signals,
        research_query, suggested_template,
        claim, source_bias, debunkable,
        source_id
      `)
      .not('user_verdict', 'is', null)
      .is('reviewed_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch unreviewed topics:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Also fetch source slugs for context
    const sourceIds = [...new Set((data || []).map(t => t.source_id).filter(Boolean))];
    let sourceMap: Record<string, string> = {};

    if (sourceIds.length > 0) {
      const { data: sources } = await supabaseServer
        .from('data_sources')
        .select('id, slug, name')
        .in('id', sourceIds);

      if (sources) {
        sourceMap = Object.fromEntries(sources.map(s => [s.id, s.slug]));
      }
    }

    const topics = (data || []).map(t => ({
      ...t,
      source_slug: sourceMap[t.source_id] || 'unknown',
    }));

    return NextResponse.json({ topics, total: topics.length });
  } catch (error) {
    console.error('Unreviewed topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
