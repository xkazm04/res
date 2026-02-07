import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';
import {
  getCompositionMetadata,
  estimateRenderDuration,
  registerRender,
} from '@/src/lib/remotion-render';
import type { VideoRenderRequest } from '@/src/types/research';
import type { TemplateType } from '@/src/lib/videoShowcaseMockData';

/**
 * POST /api/video/render
 *
 * Create a video render job for client-side rendering
 *
 * Request body:
 * {
 *   session_id: string,
 *   template_type: string,
 *   format: '16:9' | '9:16',
 *   selected_findings?: string[],
 *   selected_sources?: string[],
 *   selected_perspectives?: string[]
 * }
 *
 * Response:
 * {
 *   render: VideoRender
 * }
 *
 * Note: Actual rendering happens client-side using MediaRecorder.
 * This endpoint creates the tracking record.
 */
export async function POST(request: NextRequest) {
  try {
    const body: VideoRenderRequest = await request.json();
    const {
      session_id,
      template_type,
      format,
    } = body;

    // Validate required fields
    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }
    if (!template_type) {
      return NextResponse.json({ error: 'template_type is required' }, { status: 400 });
    }
    if (!format || !['16:9', '9:16'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be "16:9" or "9:16"' },
        { status: 400 }
      );
    }

    // Verify session exists
    const { data: session, error: sessionError } = await supabaseServer
      .from('research_sessions')
      .select('id, template_type, status')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check for existing pending/rendering job for this session
    const { data: existingRender } = await supabaseServer
      .from('video_renders')
      .select('id, status')
      .eq('session_id', session_id)
      .eq('format', format)
      .in('status', ['pending', 'rendering', 'encoding'])
      .maybeSingle();

    if (existingRender) {
      return NextResponse.json(
        {
          error: 'A render is already in progress for this session and format',
          existing_render_id: existingRender.id,
        },
        { status: 409 }
      );
    }

    // Get composition metadata for duration estimate
    const metadata = getCompositionMetadata(
      template_type as TemplateType,
      format === '9:16' ? 'mobile' : 'standard'
    );
    const estimatedDuration = Math.round(metadata.durationInFrames / metadata.fps);
    const estimatedRenderTime = estimateRenderDuration(estimatedDuration);

    // Create render record
    const { data: render, error: insertError } = await supabaseServer
      .from('video_renders')
      .insert({
        session_id,
        template_type,
        format,
        status: 'pending',
        progress_percent: 0,
        estimated_duration_seconds: estimatedRenderTime,
      })
      .select()
      .single();

    if (insertError || !render) {
      console.error('[API] Error creating render record:', insertError);
      return NextResponse.json(
        { error: 'Failed to create render record' },
        { status: 500 }
      );
    }

    // Register for in-memory tracking
    registerRender(render.id);

    return NextResponse.json({
      render,
      metadata: {
        durationInFrames: metadata.durationInFrames,
        fps: metadata.fps,
        width: metadata.width,
        height: metadata.height,
      },
      message: 'Render job created. Use client-side rendering.',
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video/render
 *
 * List renders for a session
 *
 * Query params:
 * - session_id: Filter by session (required)
 * - status: Filter by status (optional)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const status = searchParams.get('status');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
  }

  try {
    let query = supabaseServer
      .from('video_renders')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: renders, error } = await query;

    if (error) {
      console.error('[API] Error fetching renders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch renders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ renders: renders || [] });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/video/render
 *
 * Update render status (for client-side progress reporting)
 *
 * Request body:
 * {
 *   render_id: string,
 *   status?: VideoRenderStatus,
 *   progress_percent?: number,
 *   signed_url?: string,  // Data URL or blob URL for download
 *   error_message?: string
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      render_id,
      status,
      progress_percent,
      signed_url,
      error_message,
    } = body;

    if (!render_id) {
      return NextResponse.json({ error: 'render_id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (status) {
      updates.status = status;
      if (status === 'rendering') {
        updates.started_at = new Date().toISOString();
      }
      if (status === 'complete') {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (typeof progress_percent === 'number') {
      updates.progress_percent = Math.min(100, Math.max(0, progress_percent));
    }

    if (signed_url) {
      updates.signed_url = signed_url;
    }

    if (error_message) {
      updates.error_message = error_message;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data: render, error } = await supabaseServer
      .from('video_renders')
      .update(updates)
      .eq('id', render_id)
      .select()
      .single();

    if (error || !render) {
      console.error('[API] Error updating render:', error);
      return NextResponse.json(
        { error: 'Failed to update render' },
        { status: 500 }
      );
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
