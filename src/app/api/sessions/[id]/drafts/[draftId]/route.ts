import { NextRequest, NextResponse } from 'next/server';
import { getDraft, updateDraft, deleteDraft } from '@/src/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  const { draftId } = await params;

  try {
    const draft = await getDraft(draftId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  const { draftId } = await params;

  try {
    const body = await request.json();
    const { name, selection, enrichments, rewrites, scene_composition } = body;

    const draft = await updateDraft(draftId, {
      name,
      selection,
      enrichments,
      rewrites,
      scene_composition,
    });

    if (!draft) {
      return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  const { draftId } = await params;

  try {
    const success = await deleteDraft(draftId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}
