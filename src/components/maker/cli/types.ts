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

export type TransitionType = 'flash-cut' | 'wipe-right' | 'wipe-left' | 'zoom-through' | 'slide-up' | 'fade';
export type Pacing = 'fast' | 'normal' | 'slow' | 'dramatic';
export type Mood = 'neutral' | 'danger' | 'success' | 'dramatic';
export type NarrativeBeat = 'question' | 'context' | 'mechanism' | 'evidence' | 'verdict';

export interface WordTimestamp {
  word: string;
  start: number; // seconds relative to scene audio start
  end: number;   // seconds relative to scene audio start
}

export interface ComposedScene {
  sceneId: string;
  component: string;
  durationSeconds: number;
  data: Record<string, unknown>;
  narration?: string;  // Voiceover text for this scene
  narrationTimestamps?: WordTimestamp[];  // Per-word timing from ElevenLabs
  beat?: NarrativeBeat;  // Narrative arc position
  transition?: { enter?: TransitionType; exit?: TransitionType };
  pacing?: Pacing;
  mood?: Mood;
  variant?: string;
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
  sceneComposition?: ComposedScene[];
  keywords?: string[];
}
