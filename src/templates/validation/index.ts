/**
 * Validation Module
 *
 * Tools for comparing Claude Code research quality against
 * existing Gemini output stored in Supabase.
 */

export { ComparisonService, type ComparisonResult, type GeminiSession } from './ComparisonService';
export {
  calculateMetrics,
  compareMetrics,
  formatMetricsReport,
  type ResearchMetrics,
  type MetricComparison,
} from './metrics';
export { ValidationTracker, type ValidationRecord, type ValidationProgress } from './ValidationTracker';
