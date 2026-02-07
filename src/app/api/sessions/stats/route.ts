import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

// GET /api/sessions/stats - Get aggregated statistics
// Note: fetches all sessions but only selected columns (lightweight).
// For very large datasets, consider using a database view or materialized aggregates.
export async function GET() {
  try {
    const { data: sessions, error } = await supabaseServer
      .from('research_sessions')
      .select('template_type, status, claim_count, source_count');

    if (error) {
      console.error('[API] Error fetching session stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    const sessionsList = sessions || [];
    const totalSessions = sessionsList.length;

    // Single-pass aggregation for all statistics
    const activeStatuses = new Set(['active', 'searching', 'analyzing']);
    const byTemplate: Record<string, { count: number; findings: number; sources: number }> = {};
    const byStatus: Record<string, number> = {};
    let completedSessions = 0;
    let activeSessions = 0;
    let totalFindings = 0;
    let totalSources = 0;

    for (const session of sessionsList) {
      const template = session.template_type || 'unknown';
      const status = session.status || 'unknown';
      const claimCount = session.claim_count || 0;
      const sourceCount = session.source_count || 0;

      // Accumulate totals
      totalFindings += claimCount;
      totalSources += sourceCount;

      // Count by status
      if (status === 'completed') completedSessions++;
      else if (activeStatuses.has(status)) activeSessions++;
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Aggregate by template
      if (!byTemplate[template]) {
        byTemplate[template] = { count: 0, findings: 0, sources: 0 };
      }
      byTemplate[template].count++;
      byTemplate[template].findings += claimCount;
      byTemplate[template].sources += sourceCount;
    }

    return NextResponse.json({
      totals: {
        sessions: totalSessions,
        completed: completedSessions,
        active: activeSessions,
        findings: totalFindings,
        sources: totalSources,
      },
      byTemplate,
      byStatus,
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
