'use client';

import type { BaseSceneProps } from '@/src/components/report/video/configs';
import type { TemplateType, VideoContent } from '@/src/lib/videoShowcaseMockData';
import {
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
} from '@/src/components/report/video/scenes/index';

interface SceneContext {
  baseProps: BaseSceneProps;
  videoContent: VideoContent;
  templateType: TemplateType;
  accentColor: string;
  config: {
    visuals: { icon: string };
    hooks: { closingPattern: string };
  };
}

type SceneRenderer = (ctx: SceneContext) => React.ReactNode;

/**
 * Scene registry maps component names to render functions.
 * This replaces the large switch statement with a clean lookup.
 */
export const sceneRegistry: Record<string, SceneRenderer> = {
  // Universal Scenes
  HookScene: ({ baseProps, videoContent, templateType, accentColor, config }) => (
    <HookScene
      {...baseProps}
      hook={videoContent.hook}
      title={videoContent.title}
      templateType={templateType}
      accentColor={accentColor}
      icon={config.visuals.icon}
    />
  ),

  VerdictScene: ({ baseProps, videoContent, accentColor, config }) => (
    <VerdictScene
      {...baseProps}
      verdict={videoContent.verdict}
      verdictType={videoContent.verdictType}
      accentColor={accentColor}
      warnings={videoContent.warnings}
      cta={config.hooks.closingPattern}
    />
  ),

  // Investigative Scenes
  ActorNetworkScene: ({ baseProps, videoContent, accentColor }) => (
    <ActorNetworkScene {...baseProps} actors={videoContent.actors || []} accentColor={accentColor} />
  ),

  MoneyTrailScene: ({ baseProps, videoContent, accentColor }) => (
    <MoneyTrailScene {...baseProps} flows={videoContent.moneyFlows || []} accentColor={accentColor} />
  ),

  PatternRevealScene: ({ baseProps, videoContent, accentColor }) => (
    <PatternRevealScene {...baseProps} patterns={videoContent.patterns || []} accentColor={accentColor} />
  ),

  // Financial Scenes
  BullBearScene: ({ baseProps, videoContent, accentColor }) => (
    <BullBearScene
      {...baseProps}
      bullCase={videoContent.bullCase || videoContent.keyNarratives.slice(0, 3)}
      bearCase={videoContent.bearCase || videoContent.warnings}
      accentColor={accentColor}
    />
  ),

  RiskMeterScene: ({ baseProps, videoContent, accentColor }) => (
    <RiskMeterScene
      {...baseProps}
      riskScore={videoContent.riskScore || 50}
      riskFactors={videoContent.riskFactors || []}
      accentColor={accentColor}
    />
  ),

  // Competitive Scenes
  CompetitiveLandscapeScene: ({ baseProps, videoContent, accentColor }) => (
    <CompetitiveLandscapeScene
      {...baseProps}
      competitors={videoContent.competitors || []}
      marketName={videoContent.marketName}
      accentColor={accentColor}
    />
  ),

  BattleMapScene: ({ baseProps, videoContent, accentColor }) => (
    <BattleMapScene
      {...baseProps}
      competitor1={videoContent.competitor1 || { name: 'Company A', scores: {} }}
      competitor2={videoContent.competitor2 || { name: 'Company B', scores: {} }}
      dimensions={videoContent.comparisonDimensions || ['Feature', 'Price', 'Support']}
      accentColor={accentColor}
    />
  ),

  // Legal Scenes
  RulingImpactScene: ({ baseProps, videoContent, accentColor }) => (
    <RulingImpactScene
      {...baseProps}
      ruling={videoContent.ruling || videoContent.keyNarratives[0] || ''}
      impacts={videoContent.impacts || []}
      jurisdiction={videoContent.jurisdiction}
      accentColor={accentColor}
    />
  ),

  AtRiskScene: ({ baseProps, videoContent, accentColor }) => (
    <AtRiskScene {...baseProps} entities={videoContent.atRiskEntities || []} accentColor={accentColor} />
  ),

  // Tech Market Scenes
  HypeVsRealityScene: ({ baseProps, videoContent, accentColor }) => (
    <HypeVsRealityScene {...baseProps} items={videoContent.hypeRealityItems || []} accentColor={accentColor} />
  ),

  AdoptionCurveScene: ({ baseProps, videoContent, accentColor }) => (
    <AdoptionCurveScene
      {...baseProps}
      technology={videoContent.title}
      currentPosition={videoContent.adoptionPosition || 25}
      phase={videoContent.adoptionPhase || 'early_adopters'}
      growthRate={videoContent.growthRate || 15}
      timeToMainstream={videoContent.timeToMainstream}
      accentColor={accentColor}
    />
  ),

  // Contract Scenes
  PriceComparisonScene: ({ baseProps, videoContent, accentColor }) => (
    <PriceComparisonScene
      {...baseProps}
      items={videoContent.priceItems || []}
      contractName={videoContent.contractName}
      accentColor={accentColor}
    />
  ),

  ShellCompanyWebScene: ({ baseProps, videoContent, accentColor }) => (
    <ShellCompanyWebScene
      {...baseProps}
      entities={videoContent.shellEntities || []}
      connections={videoContent.shellConnections || []}
      accentColor={accentColor}
    />
  ),

  CorruptionFlagsScene: ({ baseProps, videoContent, accentColor }) => (
    <CorruptionFlagsScene
      {...baseProps}
      flags={videoContent.corruptionFlags || videoContent.redFlags || []}
      accentColor={accentColor}
    />
  ),

  // Understanding Scenes
  NarrativeComparisonScene: ({ baseProps, videoContent, accentColor }) => (
    <NarrativeComparisonScene
      {...baseProps}
      officialNarrative={videoContent.officialNarrative || videoContent.keyNarratives}
      realStory={videoContent.realStory || []}
      discrepancies={videoContent.discrepancies}
      accentColor={accentColor}
    />
  ),

  CausalChainScene: ({ baseProps, videoContent, accentColor }) => (
    <CausalChainScene {...baseProps} events={videoContent.causalEvents || []} accentColor={accentColor} />
  ),

  // Due Diligence Scenes
  RedFlagCompilationScene: ({ baseProps, videoContent, accentColor }) => (
    <RedFlagCompilationScene {...baseProps} flags={videoContent.redFlags || []} accentColor={accentColor} />
  ),

  LeadershipHistoryScene: ({ baseProps, videoContent, accentColor }) => (
    <LeadershipHistoryScene {...baseProps} leaders={videoContent.leaders || []} accentColor={accentColor} />
  ),
};

/**
 * Render a scene by component name with fallback for unknown scenes.
 */
export function renderScene(componentName: string, ctx: SceneContext): React.ReactNode {
  const renderer = sceneRegistry[componentName];

  if (renderer) {
    return renderer(ctx);
  }

  // Fallback for unknown scenes
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-slate-400">
      <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm">{componentName}</div>
      <p className="mt-2 text-xs opacity-50">Scene not registered</p>
    </div>
  );
}
