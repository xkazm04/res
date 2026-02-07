import { NextRequest, NextResponse } from 'next/server';
import {
  startExecution,
  abortExecution,
  getExecution,
} from '@/src/lib/claude-terminal/cli-service';

interface QueryRequestBody {
  projectPath: string;
  prompt: string;
  resumeSessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QueryRequestBody;
    const { projectPath, prompt, resumeSessionId } = body;

    if (!projectPath) {
      return NextResponse.json({ error: 'Project path is required' }, { status: 400 });
    }
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const executionId = startExecution(projectPath, prompt, resumeSessionId);

    return NextResponse.json({
      success: true,
      executionId,
      streamUrl: `/api/claude-terminal/stream?executionId=${executionId}`,
    });
  } catch (error) {
    console.error('Claude Terminal query error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start execution' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json({ error: 'Execution ID is required' }, { status: 400 });
    }

    const execution = getExecution(executionId);
    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    const aborted = abortExecution(executionId);
    return NextResponse.json({
      success: aborted,
      message: aborted ? 'Execution aborted' : 'Failed to abort execution',
    });
  } catch (error) {
    console.error('Claude Terminal abort error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to abort execution' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json({ error: 'Execution ID is required' }, { status: 400 });
    }

    const execution = getExecution(executionId);
    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      execution: {
        id: execution.id,
        projectPath: execution.projectPath,
        status: execution.status,
        sessionId: execution.sessionId,
        startTime: execution.startTime,
        endTime: execution.endTime,
        eventCount: execution.events.length,
      },
    });
  } catch (error) {
    console.error('Claude Terminal status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get execution status' },
      { status: 500 },
    );
  }
}
