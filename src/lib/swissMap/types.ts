/**
 * Swiss Map Types
 *
 * Type definitions for the infinite Swiss-style map with
 * keyboard navigation and semantic zoom.
 */

// ============================================================================
// View State
// ============================================================================

export interface SwissViewState {
  /** Pan offset X in pixels */
  offsetX: number;
  /** Pan offset Y in pixels */
  offsetY: number;
  /** Zoom scale (1.0 = 100%) */
  scale: number;
  /** Animation targets */
  targetOffsetX?: number;
  targetOffsetY?: number;
  targetScale?: number;
}

// ============================================================================
// Zoom Levels
// ============================================================================

export type SwissZoomLevel = 'macro' | 'normal' | 'detail';

export interface SwissZoomConfig {
  level: SwissZoomLevel;
  minScale: number;
  maxScale: number;
  showStats: boolean;
  showDescriptions: boolean;
  cardSize: 'compact' | 'normal' | 'expanded';
}

export const SWISS_ZOOM_LEVELS: SwissZoomConfig[] = [
  {
    level: 'macro',
    minScale: 0.3,
    maxScale: 0.7,
    showStats: false,
    showDescriptions: false,
    cardSize: 'compact',
  },
  {
    level: 'normal',
    minScale: 0.7,
    maxScale: 1.3,
    showStats: true,
    showDescriptions: false,
    cardSize: 'normal',
  },
  {
    level: 'detail',
    minScale: 1.3,
    maxScale: 2.5,
    showStats: true,
    showDescriptions: true,
    cardSize: 'expanded',
  },
];

// ============================================================================
// Interaction State
// ============================================================================

export interface SwissInteractionState {
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  lastMouseX: number;
  lastMouseY: number;
  velocityX: number;
  velocityY: number;
}

// ============================================================================
// Configuration
// ============================================================================

export interface SwissMapConfig {
  /** Respect prefers-reduced-motion */
  reducedMotion: boolean;
  /** Animation duration in ms */
  animationDuration: number;
  /** Minimum zoom scale */
  minScale: number;
  /** Maximum zoom scale */
  maxScale: number;
  /** Zoom speed factor */
  zoomSpeed: number;
  /** Pan speed for keyboard */
  panSpeed: number;
  /** Pan inertia factor (0-1) */
  panInertia: number;
}

export const DEFAULT_SWISS_CONFIG: SwissMapConfig = {
  reducedMotion: false,
  animationDuration: 200,
  minScale: 0.3,
  maxScale: 2.5,
  zoomSpeed: 1.15,
  panSpeed: 30,
  panInertia: 0.85,
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getSwissZoomLevel(scale: number): SwissZoomConfig {
  for (const config of SWISS_ZOOM_LEVELS) {
    if (scale >= config.minScale && scale < config.maxScale) {
      return config;
    }
  }
  // Default to last level if scale exceeds all
  return SWISS_ZOOM_LEVELS[SWISS_ZOOM_LEVELS.length - 1];
}

export function getSwissZoomLevelName(scale: number): string {
  const config = getSwissZoomLevel(scale);
  switch (config.level) {
    case 'macro':
      return 'Overview';
    case 'normal':
      return 'Standard';
    case 'detail':
      return 'Detail';
    default:
      return 'Standard';
  }
}
