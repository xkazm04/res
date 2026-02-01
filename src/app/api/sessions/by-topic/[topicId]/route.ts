import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

interface RouteParams {
  params: Promise<{ topicId: string }>;
}

/**
 * GET /api/sessions/by-topic/[topicId]
 *
 * Fetch sessions for a specific topic with pagination.
 *
 * Query parameters:
 * - cursor: Session ID to start after
 * - limit: Number of sessions (default: 50, max: 100)
 *
 * Response: {
 *   sessions: SessionSummary[],
 *   topic: TopicDetails,
 *   nextCursor: string | null,
 *   hasMore: boolean,
 *   totalCount: number
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { topicId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');

    // Parse and validate limit
    let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_PAGE_SIZE;
    if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    // Build sessions query - sessions where primary_topic_id matches OR topic is in topic_ids array
    let sessionsQuery = supabaseServer
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
        claim_count,
        source_count,
        created_at,
        updated_at,
        completed_at
      `)
      .or(`primary_topic_id.eq.${topicId},topic_ids.cs.{${topicId}}`)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    // Apply cursor pagination
    if (cursor) {
      const { data: cursorSession } = await supabaseServer
        .from('research_sessions')
        .select('created_at')
        .eq('id', cursor)
        .single();

      if (cursorSession) {
        sessionsQuery = sessionsQuery.lt('created_at', cursorSession.created_at);
      }
    }

    // Fetch sessions and topic details in parallel
    const [sessionsResult, topicResult, countResult] = await Promise.all([
      sessionsQuery,

      // Get topic details
      supabaseServer
        .from('knowledge_topics')
        .select(`
          id,
          name,
          slug,
          description,
          topic_type,
          parent_id,
          session_count,
          finding_count,
          entity_count
        `)
        .eq('id', topicId)
        .single(),

      // Get total count for this topic
      supabaseServer
        .from('research_sessions')
        .select('*', { count: 'exact', head: true })
        .or(`primary_topic_id.eq.${topicId},topic_ids.cs.{${topicId}}`),
    ]);

    if (sessionsResult.error) {
      console.error('[API] Error fetching sessions by topic:', sessionsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsResult.error.message },
        { status: 500 }
      );
    }

    const sessions = sessionsResult.data || [];
    const hasMore = sessions.length > limit;
    const resultSessions = hasMore ? sessions.slice(0, limit) : sessions;
    const nextCursor = hasMore && resultSessions.length
      ? resultSessions[resultSessions.length - 1].id
      : null;

    // Ensure counts default to 0
    const sessionsWithCounts = resultSessions.map(session => ({
      ...session,
      claim_count: session.claim_count ?? 0,
      source_count: session.source_count ?? 0,
    }));

    return NextResponse.json({
      sessions: sessionsWithCounts,
      topic: topicResult.data || null,
      nextCursor,
      hasMore,
      totalCount: countResult.count || 0,
    });
  } catch (error) {
    console.error('[API] Unexpected error in by-topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
