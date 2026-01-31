import { supabaseServer } from '@/src/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/topics/[id]
 * Soft delete: updates topic status to 'deleted'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Soft delete: update status to 'deleted'
    const { error } = await supabaseServer
      .from('research_topics')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete topic:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete topic error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
