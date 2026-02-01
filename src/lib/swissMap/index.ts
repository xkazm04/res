/**
 * Swiss Map Module
 *
 * Infinite Swiss-style map with keyboard navigation,
 * semantic zoom, and space-efficient design.
 */

export type {
  SwissViewState,
  SwissZoomLevel,
  SwissZoomConfig,
  SwissInteractionState,
  SwissMapConfig,
} from './types';

export {
  SWISS_ZOOM_LEVELS,
  DEFAULT_SWISS_CONFIG,
  getSwissZoomLevel,
  getSwissZoomLevelName,
} from './types';

export {
  SwissInteractionManager,
  type SwissInteractionCallbacks,
} from './interactions';
