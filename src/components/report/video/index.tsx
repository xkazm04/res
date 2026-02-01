// Core playback system
export { useVideoPlayback, interpolate, spring, easeOutCubic, easeOutQuart, easeInOutCubic, easeOutExpo, linear } from './useVideoPlayback';

// Animated chart components
export { AnimatedBarChart, AnimatedLineChart, AnimatedPieChart, AnimatedCounter } from './AnimatedCharts';

// Scene components (decomposed from Scenes.tsx)
export { TitleScene, MetricsScene, ChartsScene, InsightsScene, SummaryScene } from './scenes/index';

// Scene primitives for building custom scenes
export {
  SceneHeader,
  SceneContainer,
  BackgroundOrb,
  pulse,
  getColorClasses,
  type SceneProps,
  type MetricColor,
} from './scenes/index';

// Transition effects
export { Crossfade, Slide, Scale, Stagger, CountUp, Reveal, Pulse } from './Transitions';

// Main components
export { VideoControls } from './VideoControls';
export { VideoOverview } from './VideoOverview';
export { TemplateVideoPlayer } from './TemplateVideoPlayer';
export { ContentSelector } from './ContentSelector';
export { AudioControls } from './AudioControls';

// Content selection & transformation
export { useContentSelection, VIDEO_SECTIONS } from './useContentSelection';
export { useAudioNarration } from './useAudioNarration';
export { useCuratedContent } from './useCuratedContent';
export {
  transformSelectionToContent,
  generateNarrationPrompt,
  buildCurationRequest,
  transformCuratedToContent,
  hasAnySectionAssignments,
} from './contentTransformer';

export type { VideoContentSelection, SelectableItem, ContentSelectionState, VideoSection } from './useContentSelection';
export type { VideoOverviewContent, CuratedVideoContent, CurationRequest } from './contentTransformer';
export type { NarrationStatus, NarrationScript, AudioNarrationState, UseAudioNarrationReturn, VoiceOption } from './useAudioNarration';
export type { CurationStatus, UseCuratedContentReturn } from './useCuratedContent';

// Template Video Config System
export {
  TEMPLATE_VIDEO_CONFIGS,
  getTemplateConfig,
  getAvailableTemplates,
  getSceneAtFrame,
  getTemplateScenes,
  getTemplateVisuals,
  getSceneProgress,
  isFrameInScene,
  getCurrentScene,
} from './configs';

// Animated Primitives
export {
  NetworkDiagram,
  FlowVisualization,
  ComparisonBars,
  GaugeMeter,
  AlertStack,
  SplitScreen,
  SplitContentItem,
  VerdictBadge,
  VerdictIndicator,
} from './primitives';

export type {
  NetworkNode,
  NetworkEdge,
  FlowNode,
  FlowConnection,
  ComparisonItem,
  GaugeFactor,
  AlertItem,
  VerdictType,
} from './primitives';

// Template-Specific Scenes
export {
  HookScene,
  VerdictScene,
  ActorNetworkScene,
  MoneyTrailScene,
  PatternRevealScene,
  BullBearScene,
  RiskMeterScene,
  CompetitiveLandscapeScene,
  BattleMapScene,
  RulingImpactScene,
  AtRiskScene,
  HypeVsRealityScene,
  AdoptionCurveScene,
  PriceComparisonScene,
  ShellCompanyWebScene,
  CorruptionFlagsScene,
  NarrativeComparisonScene,
  CausalChainScene,
  RedFlagCompilationScene,
  LeadershipHistoryScene,
} from './scenes/index';

// Types
export type { VideoFormat } from './VideoOverview';
export type { VideoFormat as TemplateVideoFormat, VideoTheme } from './TemplateVideoPlayer';
export type {
  TemplateVideoConfig,
  SceneDefinition,
  SceneComponentType,
  BaseSceneProps,
  HookPatterns,
  VisualConfig,
} from './configs/types';
