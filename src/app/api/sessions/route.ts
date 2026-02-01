import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/sessions - List research sessions with cursor pagination
 *
 * Query parameters:
 * - cursor: Session ID to start after (for pagination)
 * - limit: Number of sessions to return (default: 50, max: 100)
 * - template: Filter by template type
 * - status: Filter by status
 *
 * Response: {
 *   sessions: SessionSummary[],
 *   nextCursor: string | null,
 *   prevCursor: string | null,
 *   hasMore: boolean,
 *   totalCount: number (only on first page)
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const templateFilter = searchParams.get('template');
    const statusFilter = searchParams.get('status');

    // Parse and validate limit
    let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_PAGE_SIZE;
    if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    // Build query
    let query = supabaseServer
      .from('research_sessions')
      .select(`
        id,
        workspace_id,
        title,
        query,
        template_type,
        status,
        primary_topic_id,
        topic_ids,
        parameters,
        claim_count,
        source_count,
        created_at,
        updated_at,
        completed_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check for more

    // Apply filters
    if (templateFilter) {
      query = query.eq('template_type', templateFilter);
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Apply cursor pagination
    if (cursor) {
      // Fetch the cursor session's created_at for comparison
      const { data: cursorSession } = await supabaseServer
        .from('research_sessions')
        .select('created_at')
        .eq('id', cursor)
        .single();

      if (cursorSession) {
        query = query.lt('created_at', cursorSession.created_at);
      }
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('[API] Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: error.message },
        { status: 500 }
      );
    }

    // Check if there are more results
    const hasMore = (sessions?.length || 0) > limit;
    const resultSessions = hasMore ? sessions?.slice(0, limit) : sessions;

    // Determine cursors
    const nextCursor = hasMore && resultSessions?.length
      ? resultSessions[resultSessions.length - 1].id
      : null;
    const prevCursor = cursor || null;

    // Get total count only on first page (no cursor)
    let totalCount: number | undefined;
    if (!cursor) {
      let countQuery = supabaseServer
        .from('research_sessions')
        .select('*', { count: 'exact', head: true });

      if (templateFilter) {
        countQuery = countQuery.eq('template_type', templateFilter);
      }
      if (statusFilter) {
        countQuery = countQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;
      totalCount = count || 0;
    }

    // Ensure counts default to 0 (no N+1 queries - rely on DB defaults)
    const sessionsWithCounts = (resultSessions || []).map(session => ({
      ...session,
      claim_count: session.claim_count ?? 0,
      source_count: session.source_count ?? 0,
    }));

    return NextResponse.json({
      sessions: sessionsWithCounts,
      nextCursor,
      prevCursor,
      hasMore,
      ...(totalCount !== undefined && { totalCount }),
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
