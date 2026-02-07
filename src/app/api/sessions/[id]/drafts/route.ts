import { NextRequest, NextResponse } from 'next/server';
import { getDraftsForSession, createDraft } from '@/src/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const drafts = await getDraftsForSession(sessionId);
    return NextResponse.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const body = await request.json();
    const { name, selection, enrichments, rewrites } = body;

    if (!selection) {
      return NextResponse.json({ error: 'selection is required' }, { status: 400 });
    }

    const draft = await createDraft(sessionId, {
      name,
      selection,
      enrichments,
      rewrites,
    });

    if (!draft) {
      return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
    }

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}
