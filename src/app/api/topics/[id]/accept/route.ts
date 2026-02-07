/**
 * POST /api/topics/[id]/accept
 *
 * Accept a topic for research:
 * 1. Create a Claude Code requirement file in .claude/commands/
 * 2. Delete the topic from the database
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';
import { createRequirementFromTopic } from '@/src/lib/claude/requirementGenerator';

// Project path - where .claude/commands/ will be created
const PROJECT_PATH = process.cwd();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });
  }

  try {
    // 1. Fetch the topic with all its data
    const { data: topic, error: fetchError } = await supabaseServer
      .from('research_topics')
      .select(`
        id,
        title,
        description,
        source_url,
        claim,
        research_query,
        suggested_template,
        source_bias,
        debunkable
      `)
      .eq('id', id)
      .single();

    if (fetchError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // 2. Create the requirement file
    const result = await createRequirementFromTopic(PROJECT_PATH, {
      id: topic.id,
      title: topic.title,
      description: topic.description || undefined,
      claim: topic.claim || undefined,
      researchQuery: topic.research_query || undefined,
      suggestedTemplate: topic.suggested_template || undefined,
      sourceBias: topic.source_bias || undefined,
      debunkable: topic.debunkable || undefined,
      sourceUrl: topic.source_url || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to create requirement: ${result.error}` },
        { status: 500 }
      );
    }

    // 3. Delete the topic from the database
    const { error: deleteError } = await supabaseServer
      .from('research_topics')
      .delete()
      .eq('id', id);

    if (deleteError) {
      // File was created but deletion failed - log but don't fail
      console.error('Failed to delete topic after creating requirement:', deleteError);
      return NextResponse.json({
        success: true,
        warning: 'Requirement created but topic deletion failed',
        fileName: result.fileName,
        filePath: result.filePath,
      });
    }

    return NextResponse.json({
      success: true,
      fileName: result.fileName,
      filePath: result.filePath,
    });
  } catch (error) {
    console.error('Accept topic error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
