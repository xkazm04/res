import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

// DELETE /api/sessions/[id] - Delete a session and all related data
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Delete in dependency order: children first, then the session
    // Supabase cascading deletes handle most of this if FK ON DELETE CASCADE is set,
    // but we delete explicitly to be safe and return clear errors.
    const tables = [
      'causal_chains',
      'finding_relationships',
      'research_contradictions',
      'research_gaps',
      'research_perspectives',
      'research_findings',
      'research_sources',
      'research_queries',
    ];

    for (const table of tables) {
      const { error } = await supabaseServer.from(table).delete().eq('session_id', sessionId);
      if (error) {
        console.error(`[API] Error deleting from ${table}:`, error);
        // Continue - some tables may not have rows for this session
      }
    }

    // Delete the session itself
    const { error: sessionError } = await supabaseServer
      .from('research_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      console.error('[API] Error deleting session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to delete session', details: sessionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: sessionId });
  } catch (error) {
    console.error('[API] Unexpected error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/sessions/[id] - Get session with full details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch session and all related data in parallel
    const [
      sessionResult,
      findingsResult,
      sourcesResult,
      perspectivesResult,
      queriesResult,
      gapsResult,
      contradictionsResult,
      relationshipsResult,
      causalChainsResult,
    ] = await Promise.all([
      supabaseServer
        .from('research_sessions')
        .select('*')
        .eq('id', sessionId)
        .single(),
      supabaseServer
        .from('research_findings')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at'),
      supabaseServer
        .from('research_sources')
        .select('*')
        .eq('session_id', sessionId)
        .order('credibility_score', { ascending: false }),
      supabaseServer
        .from('research_perspectives')
        .select('*')
        .eq('session_id', sessionId),
      supabaseServer
        .from('research_queries')
        .select('*')
        .eq('session_id', sessionId)
        .order('query_round'),
      supabaseServer
        .from('research_gaps')
        .select('*')
        .eq('session_id', sessionId)
        .order('priority'),
      supabaseServer
        .from('research_contradictions')
        .select('*')
        .eq('session_id', sessionId),
      supabaseServer
        .from('finding_relationships')
        .select('*')
        .eq('session_id', sessionId),
      supabaseServer
        .from('causal_chains')
        .select('*')
        .eq('session_id', sessionId),
    ]);

    // Check for session not found
    if (sessionResult.error || !sessionResult.data) {
      if (sessionResult.error?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      console.error('[API] Error fetching session:', sessionResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      );
    }

    // Fetch topic if session has one
    let topic = null;
    if (sessionResult.data.primary_topic_id) {
      const { data: topicData } = await supabaseServer
        .from('knowledge_topics')
        .select('*')
        .eq('id', sessionResult.data.primary_topic_id)
        .maybeSingle();
      topic = topicData;
    }

    // Fetch knowledge claims linked to findings
    const promotedFindings = (findingsResult.data || []).filter(f => f.is_promoted && f.knowledge_claim_id);
    let knowledgeClaims: Record<string, unknown>[] = [];
    if (promotedFindings.length > 0) {
      const claimIds = promotedFindings.map(f => f.knowledge_claim_id);
      const { data: claimsData } = await supabaseServer
        .from('knowledge_claims')
        .select('*')
        .in('id', claimIds);
      knowledgeClaims = claimsData || [];
    }

    // Fetch entities linked to this session via claims
    let entities: Record<string, unknown>[] = [];
    if (knowledgeClaims.length > 0) {
      const claimIds = knowledgeClaims.map(c => c.id);
      const { data: claimEntities } = await supabaseServer
        .from('claim_entities')
        .select('entity_id')
        .in('claim_id', claimIds);

      if (claimEntities && claimEntities.length > 0) {
        const entityIds = [...new Set(claimEntities.map(ce => ce.entity_id))];
        const { data: entitiesData } = await supabaseServer
          .from('knowledge_entities')
          .select('*')
          .in('id', entityIds);
        entities = entitiesData || [];
      }
    }

    // Compute counts if not stored
    const claimCount = sessionResult.data.claim_count || findingsResult.data?.length || 0;
    const sourceCount = sessionResult.data.source_count || sourcesResult.data?.length || 0;

    // Build full session response with all available data
    const sessionWithDetails = {
      ...sessionResult.data,
      claim_count: claimCount,
      source_count: sourceCount,
      findings: findingsResult.data || [],
      sources: sourcesResult.data || [],
      perspectives: perspectivesResult.data || [],
      queries: queriesResult.data || [],
      gaps: gapsResult.data || [],
      contradictions: contradictionsResult.data || [],
      relationships: relationshipsResult.data || [],
      causal_chains: causalChainsResult.data || [],
      entities,
      topic,
      knowledge_claims: knowledgeClaims,
    };

    return NextResponse.json(sessionWithDetails);
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
