import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

// GET /api/sessions/stats - Get aggregated statistics
export async function GET() {
  try {
    // Get all sessions for stats
    const { data: sessions, error } = await supabaseServer
      .from('research_sessions')
      .select('id, template_type, status, claim_count, source_count');

    if (error) {
      console.error('[API] Error fetching session stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    const sessionsList = sessions || [];

    // Calculate totals
    const totalSessions = sessionsList.length;
    const completedSessions = sessionsList.filter(s => s.status === 'completed').length;
    const activeSessions = sessionsList.filter(s => ['active', 'searching', 'analyzing'].includes(s.status)).length;

    // Sum up counts (fetching real counts for null values would be expensive, skip for stats)
    const totalFindings = sessionsList.reduce((sum, s) => sum + (s.claim_count || 0), 0);
    const totalSources = sessionsList.reduce((sum, s) => sum + (s.source_count || 0), 0);

    // Group by template
    const byTemplate: Record<string, { count: number; findings: number; sources: number }> = {};
    sessionsList.forEach(session => {
      const template = session.template_type || 'unknown';
      if (!byTemplate[template]) {
        byTemplate[template] = { count: 0, findings: 0, sources: 0 };
      }
      byTemplate[template].count += 1;
      byTemplate[template].findings += session.claim_count || 0;
      byTemplate[template].sources += session.source_count || 0;
    });

    // Group by status
    const byStatus: Record<string, number> = {};
    sessionsList.forEach(session => {
      const status = session.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

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
