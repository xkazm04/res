import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

/**
 * GET /api/topics/queue
 * Fetch accepted topics that are ready for research (new or failed).
 * Returns compact payload for the research queue sidebar.
 */
export async function GET() {
  try {
    const { data: topics, error } = await supabaseServer
      .from('research_topics')
      .select(`
        id,
        title,
        suggested_template,
        research_query,
        status,
        data_sources!inner ( slug )
      `)
      .eq('user_verdict', 'accepted')
      .in('status', ['new', 'failed'])
      .order('discovered_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch queue:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (topics || []).map((t) => {
      const ds = t.data_sources as unknown as { slug: string };
      return {
        id: t.id,
        title: t.title,
        suggestedTemplate: t.suggested_template,
        researchQuery: t.research_query,
        sourceSlug: ds.slug,
        status: t.status,
      };
    });

    return NextResponse.json({ topics: mapped });
  } catch (error) {
    console.error('Queue fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
