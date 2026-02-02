/**
 * Deep Research library exports.
 *
 * Note: research-service.ts has been replaced by src/templates/builder/ResearchOrchestrator.ts
 * The GeminiClient remains for topic-discovery.ts functionality.
 */

export { GeminiClient } from './gemini-client';
export type { Source, TokenUsage, ResearchResponse } from './gemini-client';

export { TEMPLATE_CONFIGS } from './templates';
export type { TemplateType, TemplateConfig } from './templates';

export {
  sendResearchCompletedEmail,
  sendResearchFailedEmail,
  isEmailConfigured,
} from './email-service';
export type { ResearchEmailData } from './email-service';

export { buildDiscoveryPrompt, DISCOVERY_SYSTEM_PROMPT, SOURCE_PROMPTS } from './discovery-prompts';
