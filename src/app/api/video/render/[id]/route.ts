import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';
import { getRenderProgress, cleanupRenderTracking } from '@/src/lib/remotion-render';

/**
 * GET /api/video/render/[id]
 *
 * Get render status and progress
 *
 * Query params:
 * - refresh: If 'true', fetch fresh progress from in-memory tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: renderId } = await params;

  if (!renderId) {
    return NextResponse.json({ error: 'Render ID is required' }, { status: 400 });
  }

  try {
    // Fetch render from database
    const { data: render, error } = await supabaseServer
      .from('video_renders')
      .select('*')
      .eq('id', renderId)
      .single();

    if (error || !render) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Render not found' }, { status: 404 });
      }
      console.error('[API] Error fetching render:', error);
      return NextResponse.json(
        { error: 'Failed to fetch render' },
        { status: 500 }
      );
    }

    // Check if we should refresh from in-memory progress
    const { searchParams } = new URL(request.url);
    const shouldRefresh = searchParams.get('refresh') === 'true';

    // For active renders, check in-memory progress
    if (
      shouldRefresh &&
      ['pending', 'rendering', 'encoding'].includes(render.status)
    ) {
      const progress = getRenderProgress(renderId);

      if (progress) {
        // Update database with fresh progress
        const updates: Record<string, unknown> = {
          status: progress.status,
          progress_percent: progress.progress_percent,
        };

        // If complete or failed, the background task will update the DB
        // We just return the current progress here
        if (progress.status !== render.status || progress.progress_percent !== render.progress_percent) {
          const { data: updatedRender, error: updateError } = await supabaseServer
            .from('video_renders')
            .update(updates)
            .eq('id', renderId)
            .select()
            .single();

          if (!updateError && updatedRender) {
            return NextResponse.json({
              render: updatedRender,
              progress: {
                progress_percent: progress.progress_percent,
              },
            });
          }
        }

        return NextResponse.json({
          render: {
            ...render,
            status: progress.status,
            progress_percent: progress.progress_percent,
          },
          progress: {
            progress_percent: progress.progress_percent,
          },
        });
      }
    }

    // Clean up tracking for completed renders
    if (['complete', 'failed'].includes(render.status)) {
      cleanupRenderTracking(renderId);
    }

    return NextResponse.json({ render });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/video/render/[id]
 *
 * Delete a render record and optionally the output file
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: renderId } = await params;

  if (!renderId) {
    return NextResponse.json({ error: 'Render ID is required' }, { status: 400 });
  }

  try {
    const { data: render, error: fetchError } = await supabaseServer
      .from('video_renders')
      .select('id, status, s3_output_key')
      .eq('id', renderId)
      .single();

    if (fetchError || !render) {
      return NextResponse.json({ error: 'Render not found' }, { status: 404 });
    }

    // Clean up in-memory tracking
    cleanupRenderTracking(renderId);

    // Note: We don't delete the file here - let cleanup job handle old files
    // This prevents accidental deletion of videos users might want

    // Delete the database record
    const { error: deleteError } = await supabaseServer
      .from('video_renders')
      .delete()
      .eq('id', renderId);

    if (deleteError) {
      console.error('[API] Error deleting render:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete render' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: renderId });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
