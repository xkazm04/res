/**
 * Template-Specific Video Scenes
 *
 * Each scene is designed for specific template types and uses
 * the animated primitives for consistent, reusable visualizations.
 */

// Shared Scene Primitives
export {
  SceneHeader,
  SceneContainer,
  BackgroundOrb,
  pulse,
  getColorClasses,
  type SceneProps,
  type MetricColor,
} from './primitives';

// Core Scenes (from decomposed Scenes.tsx)
export { TitleScene } from './TitleScene';
export { MetricsScene } from './MetricsScene';
export { ChartsScene } from './ChartsScene';
export { InsightsScene } from './InsightsScene';
export { SummaryScene } from './SummaryScene';

// Universal Scenes (used by all templates)
export { HookScene } from './HookScene';
export { VerdictScene } from './VerdictScene';

// Investigative Template Scenes
export { ActorNetworkScene } from './ActorNetworkScene';
export { MoneyTrailScene } from './MoneyTrailScene';
export { PatternRevealScene } from './PatternRevealScene';

// Financial Template Scenes
export { BullBearScene } from './BullBearScene';
export { RiskMeterScene } from './RiskMeterScene';

// Competitive Template Scenes
export { CompetitiveLandscapeScene } from './CompetitiveLandscapeScene';
export { BattleMapScene } from './BattleMapScene';

// Legal Template Scenes
export { RulingImpactScene } from './RulingImpactScene';
export { AtRiskScene } from './AtRiskScene';

// Tech Market Template Scenes
export { HypeVsRealityScene } from './HypeVsRealityScene';
export { AdoptionCurveScene } from './AdoptionCurveScene';

// Contract Template Scenes
export { PriceComparisonScene } from './PriceComparisonScene';
export { ShellCompanyWebScene } from './ShellCompanyWebScene';
export { CorruptionFlagsScene } from './CorruptionFlagsScene';

// Understanding Template Scenes
export { NarrativeComparisonScene } from './NarrativeComparisonScene';
export { CausalChainScene } from './CausalChainScene';

// Due Diligence Template Scenes
export { RedFlagCompilationScene } from './RedFlagCompilationScene';
export { LeadershipHistoryScene } from './LeadershipHistoryScene';

// Stock Footage Scene (uses Remotion <Video> — requires Player context)
export { StockFootageScene } from './StockFootageScene';
