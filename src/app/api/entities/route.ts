import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

// GET /api/entities - List entities with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabaseServer
      .from('knowledge_entities')
      .select('*', { count: 'exact' })
      .order('mention_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('entity_type', type);
    }

    const { data: entities, error, count } = await query;

    if (error) {
      console.error('[API] Error fetching entities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch entities', details: error.message },
        { status: 500 }
      );
    }

    // Group by type for stats
    const byType: Record<string, number> = {};
    entities?.forEach(entity => {
      const entityType = entity.entity_type || 'unknown';
      byType[entityType] = (byType[entityType] || 0) + 1;
    });

    return NextResponse.json({
      entities: entities || [],
      count: count || 0,
      byType,
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
