/**
 * Lens Definitions
 *
 * This module exports all lens definitions for the report tabs.
 * Each lens projects SessionWithDetails into a specific view.
 */

export { overviewLens } from './overviewLens';
export { findingsLens } from './findingsLens';
export { sourcesLens } from './sourcesLens';
export { entitiesLens } from './entitiesLens';
export { analysisLens } from './analysisLens';
export { perspectivesLens } from './perspectivesLens';

// Register all lenses on import
export { registerAllLenses } from './register';
