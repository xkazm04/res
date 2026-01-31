import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

interface TopicStatusRow {
  id: string;
  status: string;
  updated_at: string;
  session_id: string | null;
}

interface TopicStatusResponse {
  id: string;
  status: string;
  updatedAt: string;
  sessionId?: string;
}

// GET /api/topics/status - Get status for active topics (for polling)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceSlug = searchParams.get('source');
    const activeOnly = searchParams.get('active') === 'true';

    // Build query
    let query = supabaseServer
      .from('research_topics')
      .select('id, status, updated_at, session_id');

    // Filter by source if provided
    if (sourceSlug) {
      // Look up source_id from slug
      const { data: source, error: sourceError } = await supabaseServer
        .from('data_sources')
        .select('id')
        .eq('slug', sourceSlug)
        .single();

      if (sourceError || !source) {
        // Return empty array if source not found (don't break polling)
        return NextResponse.json({ topics: [] });
      }

      query = query.eq('source_id', source.id);
    }

    // Filter to active statuses if requested
    if (activeOnly) {
      query = query.in('status', ['queued', 'researching']);
    }

    // Exclude deleted topics
    query = query.neq('status', 'deleted');

    const { data: topics, error } = await query;

    if (error) {
      console.error('[API] Error fetching topic statuses:', error);
      // Return empty array on error (don't break polling)
      return NextResponse.json({ topics: [] });
    }

    // Transform snake_case to camelCase at API boundary
    const response: TopicStatusResponse[] = (topics as TopicStatusRow[] || []).map((row) => ({
      id: row.id,
      status: row.status,
      updatedAt: row.updated_at,
      ...(row.session_id ? { sessionId: row.session_id } : {}),
    }));

    return NextResponse.json({ topics: response });
  } catch (error) {
    console.error('[API] Unexpected error in status endpoint:', error);
    // Return empty array on error (don't break polling)
    return NextResponse.json({ topics: [] });
  }
}
