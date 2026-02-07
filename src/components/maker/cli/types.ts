import type { VideoSection, VideoContentSelection } from '@/src/components/report/video/useContentSelection';

export interface LogEntry {
  id: string;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system' | 'error';
  content: string;
  timestamp: number;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  model?: string;
}

export interface ExecutionInfo {
  sessionId?: string;
  model?: string;
  tools?: string[];
  version?: string;
}

export interface ExecutionResult {
  sessionId?: string;
  usage?: { inputTokens: number; outputTokens: number };
  durationMs?: number;
  totalCostUsd?: number;
  isError?: boolean;
}

export interface CLISSEEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface Enrichment {
  itemId: string;
  type: 'stat' | 'quote' | 'fact';
  content: string;
  source?: string;
}

export interface Rewrite {
  itemId: string;
  originalContent: string;
  optimizedContent: string;
}

export interface AIComposeResult {
  selection: {
    selectedFindings: string[];
    selectedPerspectives: string[];
    selectedContradictions: string[];
    selectedGaps: string[];
    selectedCausalChains: string[];
    sectionAssignments: Record<string, VideoSection[]>;
  };
  enrichments?: Enrichment[];
  rewrites?: Rewrite[];
}
