/**
 * Actor Run API Route
 *
 * POST /api/actor/run
 * Executes research using Claude Code system.
 * Replaces the old Gemini-based implementation.
 *
 * This is a synchronous API - it waits for research to complete.
 * For production, consider using the topics API with async job queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResearchOrchestrator } from '@/src/templates/builder/ResearchOrchestrator';
import type { Granularity } from '@/src/templates/types/granularity';

interface ActorInput {
  query: string;
  template: string;
  granularity?: string;
  max_searches?: number;
  persist_to_db?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const input: ActorInput = await request.json();

    if (!input.query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const orchestrator = new ResearchOrchestrator();

    const result = await orchestrator.execute({
      templateId: input.template || 'investigative',
      query: input.query,
      granularity: (input.granularity as Granularity) || 'standard',
      saveToDb: input.persist_to_db ?? true,
      verbose: false,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Research failed' },
        { status: 500 }
      );
    }

    // Return in expected output format
    return NextResponse.json({
      session_id: result.sessionId,
      query: result.output?.query,
      template: result.output?.template,
      status: result.output?.status,
      findings: result.output?.findings || [],
      perspectives: result.output?.perspectives || [],
      sources: result.output?.sources || [],
      meta_analysis: result.output?.meta_analysis,
      search_queries_executed: result.output?.search_queries_executed || [],
    });
  } catch (error) {
    console.error('[Research] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
