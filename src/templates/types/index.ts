/**
 * Template Types
 *
 * Barrel export for all template-related types and schemas.
 */

// Template configuration types
export type {
  FindingTypeConfig,
  SearchAngle,
  VerificationLevel,
  VerificationConfig,
  TemplateConfig,
  TemplateConfigOverride,
  TemplateMetadata,
} from './config';

// ActorOutput schema and types
export {
  ActorOutputSchema,
  getActorOutputJsonSchema,
} from './output';

export type {
  ActorOutput,
  ActorFinding,
  ActorSource,
  ActorPerspective,
  ActorContradiction,
  ActorKnowledgeGap,
} from './output';

// Granularity configuration
export {
  GRANULARITY_CONFIGS,
  getGranularityConfig,
  isValidGranularity,
} from './granularity';

export type {
  Granularity,
  GranularityConfig,
} from './granularity';
