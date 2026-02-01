import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

// GET /api/claims - List knowledge claims with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topic_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabaseServer
      .from('knowledge_claims')
      .select('*', { count: 'exact' })
      .eq('is_current', true)
      .order('confidence_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    if (type) {
      query = query.eq('claim_type', type);
    }

    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data: claims, error, count } = await query;

    if (error) {
      console.error('[API] Error fetching claims:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claims', details: error.message },
        { status: 500 }
      );
    }

    // Get related entities for claims
    const claimIds = claims?.map(c => c.id) || [];
    let claimEntities: Record<string, unknown>[] = [];

    if (claimIds.length > 0) {
      const { data: entityLinks } = await supabaseServer
        .from('claim_entities')
        .select(`
          claim_id,
          role,
          entity:knowledge_entities(id, canonical_name, entity_type)
        `)
        .in('claim_id', claimIds);
      claimEntities = entityLinks || [];
    }

    // Group entities by claim
    const entitiesByClaim: Record<string, typeof claimEntities> = {};
    claimEntities.forEach(link => {
      const claimId = link.claim_id as string;
      if (!entitiesByClaim[claimId]) {
        entitiesByClaim[claimId] = [];
      }
      entitiesByClaim[claimId].push(link);
    });

    // Enrich claims with entities
    const enrichedClaims = claims?.map(claim => ({
      ...claim,
      entities: entitiesByClaim[claim.id] || [],
    }));

    return NextResponse.json({
      claims: enrichedClaims || [],
      count: count || 0,
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
