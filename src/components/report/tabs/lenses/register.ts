/**
 * Lens Registration
 *
 * This module registers all lens definitions in the global registry.
 * Import this module once in your app to make all lenses available.
 */

import { registerLens } from '../TabLens';
import { overviewLens } from './overviewLens';
import { findingsLens } from './findingsLens';
import { sourcesLens } from './sourcesLens';
import { entitiesLens } from './entitiesLens';
import { analysisLens } from './analysisLens';
import { perspectivesLens } from './perspectivesLens';

let registered = false;

/**
 * Register all lenses in the global registry.
 * Safe to call multiple times - will only register once.
 */
export function registerAllLenses(): void {
  if (registered) return;

  registerLens(overviewLens);
  registerLens(findingsLens);
  registerLens(sourcesLens);
  registerLens(entitiesLens);
  registerLens(analysisLens);
  registerLens(perspectivesLens);

  registered = true;
}

// Auto-register on import
registerAllLenses();
