/**
 * Template Builder Module
 *
 * Exports classes for prompt composition and Claude CLI execution.
 */

// PromptComposer: Assembles prompts from sections and configs
export { PromptComposer } from './PromptComposer';
export type { ResearchParams } from './PromptComposer';

// ClaudeRunner: Executes Claude CLI with prompts
export { ClaudeRunner } from './ClaudeRunner';
export type { RunOptions, RunResult } from './ClaudeRunner';

// TemplateBuilder: Orchestrates prompt generation and execution
export { TemplateBuilder } from './TemplateBuilder';
export type { BuildResult, TemplateBuilderOptions } from './TemplateBuilder';

// ResearchOrchestrator: Full flow with persistence
export { ResearchOrchestrator } from './ResearchOrchestrator';
export type { ResearchOptions, ResearchResult } from './ResearchOrchestrator';
