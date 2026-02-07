/**
 * Type Mapping Utilities
 *
 * Re-exports from the unified schema source of truth.
 * This file is kept for backwards compatibility with existing imports.
 *
 * @deprecated Import directly from '@/src/types/schema' instead.
 */

// Re-export everything from the unified schema source
export {
  // Schema type arrays
  SCHEMA_FINDING_TYPES,
  SCHEMA_PERSPECTIVE_TYPES,
  SCHEMA_TEMPORAL_CONTEXTS,

  // Type mappings
  FINDING_TYPE_MAP,
  PERSPECTIVE_TYPE_MAP,
  TEMPORAL_CONTEXT_MAP,

  // Validation sets
  VALID_FINDING_TYPES,
  VALID_PERSPECTIVE_TYPES,

  // Mapping functions
  mapFindingType,
  mapPerspectiveType,
  mapTemporalContext,
  isValidFindingType,
  isValidPerspectiveType,

  // Types
  type SchemaFindingType,
  type SchemaPerspectiveType,
  type SchemaTemporalContext,
} from '@/src/types/schema';
