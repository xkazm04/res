import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

/**
 * GET /api/sessions/aggregates
 *
 * Returns lightweight aggregate counts for initial map rendering.
 * This endpoint is optimized for speed - it only returns counts,
 * not individual session data.
 *
 * Response: {
 *   totalCount: number,
 *   templateCounts: Record<string, number>,
 *   topicCounts: Record<string, { count: number, name: string }>,
 *   statusCounts: Record<string, number>
 * }
 */
export async function GET() {
  try {
    // Fetch all counts in parallel for maximum efficiency
    const [
      totalResult,
      templateResult,
      topicResult,
      statusResult,
    ] = await Promise.all([
      // Total count
      supabaseServer
        .from('research_sessions')
        .select('*', { count: 'exact', head: true }),

      // Count by template type using raw SQL for aggregation
      supabaseServer
        .from('research_sessions')
        .select('template_type'),

      // Count by topic - requires join with topics table
      supabaseServer
        .from('research_sessions')
        .select('primary_topic_id, knowledge_topics!research_sessions_primary_topic_id_fkey(name)')
        .not('primary_topic_id', 'is', null),

      // Count by status
      supabaseServer
        .from('research_sessions')
        .select('status'),
    ]);

    // Handle errors
    if (totalResult.error) {
      console.error('[API] Error fetching total count:', totalResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch session aggregates', details: totalResult.error.message },
        { status: 500 }
      );
    }

    // Aggregate template counts
    const templateCounts: Record<string, number> = {};
    if (templateResult.data) {
      for (const row of templateResult.data) {
        const template = row.template_type || 'unknown';
        templateCounts[template] = (templateCounts[template] || 0) + 1;
      }
    }

    // Aggregate topic counts with names
    const topicCounts: Record<string, { count: number; name: string }> = {};
    if (topicResult.data) {
      for (const row of topicResult.data) {
        if (row.primary_topic_id) {
          const topicId = row.primary_topic_id;
          const topicName = (row.knowledge_topics as { name?: string } | null)?.name || 'Unknown';
          if (!topicCounts[topicId]) {
            topicCounts[topicId] = { count: 0, name: topicName };
          }
          topicCounts[topicId].count++;
        }
      }
    }

    // Aggregate status counts
    const statusCounts: Record<string, number> = {};
    if (statusResult.data) {
      for (const row of statusResult.data) {
        const status = row.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    }

    return NextResponse.json({
      totalCount: totalResult.count || 0,
      templateCounts,
      topicCounts,
      statusCounts,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Unexpected error in aggregates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
