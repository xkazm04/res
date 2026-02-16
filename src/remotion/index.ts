/**
 * Remotion Utilities
 *
 * This file exports Remotion utilities for video composition.
 * Used by the /maker page for preview.
 *
 * Note: For Lambda rendering, use src/remotion/entry.tsx directly.
 * The entry component is NOT re-exported here to avoid server-side React context issues.
 */

export {
  COMPOSITION_IDS,
  DIMENSIONS,
  TEMPLATE_TYPES,
  getCompositionId,
  getCompositionMetadata,
  getAllCompositionMetadata,
  getTemplateVideoConfig,
} from './Root';
