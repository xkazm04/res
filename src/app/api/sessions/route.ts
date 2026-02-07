import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// ============================================================================
// Total Count Cache
// ============================================================================

interface CountCacheEntry {
  count: number;
  timestamp: number;
}

// Simple in-memory cache for total counts
// Key format: "template:status" where empty values are "_"
const countCache = new Map<string, CountCacheEntry>();
const COUNT_CACHE_TTL = 60 * 1000; // 60 seconds

function getCountCacheKey(template: string | null, status: string | null): string {
  return `${template || '_'}:${status || '_'}`;
}

function getCachedCount(template: string | null, status: string | null): number | null {
  const key = getCountCacheKey(template, status);
  const entry = countCache.get(key);

  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > COUNT_CACHE_TTL) {
    countCache.delete(key);
    return null;
  }

  return entry.count;
}

function setCachedCount(template: string | null, status: string | null, count: number): void {
  const key = getCountCacheKey(template, status);
  countCache.set(key, { count, timestamp: Date.now() });

  // Limit cache size (FIFO eviction - oldest insertion order, not LRU)
  if (countCache.size > 100) {
    const oldest = countCache.keys().next().value;
    if (oldest) countCache.delete(oldest);
  }
}

/**
 * GET /api/sessions - List research sessions with keyset pagination
 *
 * Query parameters:
 * - lastCreatedAt: ISO timestamp to paginate after (keyset pagination)
 * - lastId: Session ID for tie-breaking when timestamps match
 * - cursor: (deprecated) Session ID - falls back to DB lookup if lastCreatedAt not provided
 * - limit: Number of sessions to return (default: 50, max: 100)
 * - template: Filter by template type
 * - status: Filter by status
 *
 * Response: {
 *   sessions: SessionSummary[],
 *   nextCursor: { id: string, createdAt: string } | null,
 *   hasMore: boolean,
 *   totalCount: number (cached, refreshes every 60s)
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Keyset pagination params (preferred)
    const lastCreatedAt = searchParams.get('lastCreatedAt');
    const lastId = searchParams.get('lastId');

    // Legacy cursor param (deprecated, requires extra DB lookup)
    const legacyCursor = searchParams.get('cursor');

    const limitParam = searchParams.get('limit');
    const templateFilter = searchParams.get('template');
    const statusFilter = searchParams.get('status');

    // Parse and validate limit
    let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_PAGE_SIZE;
    if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    // Determine if this is a paginated request
    const isPaginated = !!(lastCreatedAt || legacyCursor);

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
      .order('id', { ascending: false }) // Secondary sort for tie-breaking
      .limit(limit + 1); // Fetch one extra to check for more

    // Apply filters
    if (templateFilter) {
      query = query.eq('template_type', templateFilter);
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Apply keyset pagination - no extra DB lookup needed!
    if (lastCreatedAt) {
      // Use composite keyset: (created_at, id) for stable pagination
      // This handles the case where multiple sessions have the same created_at
      if (lastId) {
        // Use OR condition: created_at < lastCreatedAt OR (created_at = lastCreatedAt AND id < lastId)
        query = query.or(`created_at.lt.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.lt.${lastId})`);
      } else {
        query = query.lt('created_at', lastCreatedAt);
      }
    } else if (legacyCursor) {
      // Fallback: Legacy cursor support (requires extra DB lookup)
      // This maintains backward compatibility but is slower
      const { data: cursorSession } = await supabaseServer
        .from('research_sessions')
        .select('created_at')
        .eq('id', legacyCursor)
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

    // Build next cursor with both id and createdAt for keyset pagination
    const lastSession = resultSessions?.length ? resultSessions[resultSessions.length - 1] : null;
    const nextCursor = hasMore && lastSession
      ? { id: lastSession.id, createdAt: lastSession.created_at }
      : null;

    // Get total count from cache or DB
    let totalCount = getCachedCount(templateFilter, statusFilter);

    if (totalCount === null) {
      // Cache miss - fetch from DB
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
      setCachedCount(templateFilter, statusFilter, totalCount);
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
      hasMore,
      totalCount,
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
