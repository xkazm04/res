'use client';

import type { BaseSceneProps } from '@/src/components/report/video/configs';
import type { TemplateType, VideoContent } from '@/src/lib/videoShowcaseMockData';
import type { ComposedScene } from './cli/types';
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
  StockFootageScene,
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

  // Stock Footage Scene (Pexels)
  StockFootageScene: ({ baseProps, accentColor }) => (
    <StockFootageScene {...baseProps} videoUrl="" accentColor={accentColor} />
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

/**
 * Registry mapping component names to renderers that pull data from ComposedScene.data
 * instead of global VideoContent. Same components, different data source.
 */
type ComposedSceneRenderer = (
  data: Record<string, unknown>,
  baseProps: BaseSceneProps,
  accentColor: string,
  variant?: string,
) => React.ReactNode;

const composedSceneRegistry: Record<string, ComposedSceneRenderer> = {
  HookScene: (data, baseProps, accentColor, variant) => (
    <HookScene
      {...baseProps}
      hook={(data.hook as string) || ''}
      title={(data.title as string) || ''}
      templateType={(data.templateType as TemplateType) || 'investigative'}
      accentColor={accentColor}
      icon={(data.icon as string) || '🔍'}
      variant={variant as 'centered' | 'editorial' | 'cinematic'}
    />
  ),

  VerdictScene: (data, baseProps, accentColor, variant) => {
    // Normalize warnings: AI outputs [{item: "..."}] per catalog schema, component expects string[]
    const rawWarnings = (data.warnings as Array<string | { item: string }>) || [];
    const warnings = rawWarnings.map(w => typeof w === 'string' ? w : w.item);
    return (
      <VerdictScene
        {...baseProps}
        verdict={(data.verdict as string) || ''}
        verdictType={(data.verdictType as 'positive' | 'negative' | 'caution' | 'mixed') || 'caution'}
        accentColor={accentColor}
        warnings={warnings}
        cta={(data.cta as string) || ''}
        variant={variant as 'standard' | 'fullscreen' | 'minimal'}
      />
    );
  },

  ActorNetworkScene: (data, baseProps, accentColor) => (
    <ActorNetworkScene
      {...baseProps}
      actors={(data.actors as Array<{ name: string; role: string; connection: string }>) || []}
      accentColor={accentColor}
    />
  ),

  MoneyTrailScene: (data, baseProps, accentColor) => (
    <MoneyTrailScene
      {...baseProps}
      flows={(data.flows as Array<{ from: string; to: string; amount: string; why: string }>) || []}
      accentColor={accentColor}
    />
  ),

  PatternRevealScene: (data, baseProps, accentColor, variant) => (
    <PatternRevealScene
      {...baseProps}
      patterns={(data.patterns as Array<{ pattern: string; evidence: string; implication: string }>) || []}
      accentColor={accentColor}
      variant={variant as 'cards' | 'timeline'}
    />
  ),

  BullBearScene: (data, baseProps, accentColor, variant) => (
    <BullBearScene
      {...baseProps}
      bullCase={(data.bullCase as string[]) || []}
      bearCase={(data.bearCase as string[]) || []}
      accentColor={accentColor}
      variant={variant as 'split' | 'stacked' | 'minimal'}
    />
  ),

  RiskMeterScene: (data, baseProps, accentColor) => (
    <RiskMeterScene
      {...baseProps}
      riskScore={(data.riskScore as number) || 50}
      riskFactors={(data.riskFactors as Array<{ label: string; value: number; type?: 'positive' | 'negative' | 'neutral' }>) || []}
      accentColor={accentColor}
    />
  ),

  CompetitiveLandscapeScene: (data, baseProps, accentColor) => (
    <CompetitiveLandscapeScene
      {...baseProps}
      competitors={(data.competitors as Array<{ name: string; position: 'leader' | 'challenger' | 'niche' | 'emerging'; strength: number; description?: string }>) || []}
      marketName={data.marketName as string}
      accentColor={accentColor}
    />
  ),

  BattleMapScene: (data, baseProps, accentColor) => (
    <BattleMapScene
      {...baseProps}
      competitor1={(data.competitor1 as { name: string; scores: Record<string, number> }) || { name: 'A', scores: {} }}
      competitor2={(data.competitor2 as { name: string; scores: Record<string, number> }) || { name: 'B', scores: {} }}
      dimensions={(data.dimensions as string[]) || []}
      accentColor={accentColor}
    />
  ),

  RulingImpactScene: (data, baseProps, accentColor) => (
    <RulingImpactScene
      {...baseProps}
      ruling={(data.ruling as string) || ''}
      impacts={(data.impacts as Array<{ area: string; impact: string; severity: 'high' | 'medium' | 'low' }>) || []}
      jurisdiction={data.jurisdiction as string}
      accentColor={accentColor}
    />
  ),

  AtRiskScene: (data, baseProps, accentColor) => (
    <AtRiskScene
      {...baseProps}
      entities={(data.entities as Array<{ name: string; type: string; riskLevel: 'critical' | 'high' | 'moderate' | 'low'; reason: string }>) || []}
      accentColor={accentColor}
    />
  ),

  HypeVsRealityScene: (data, baseProps, accentColor) => (
    <HypeVsRealityScene
      {...baseProps}
      items={(data.items as Array<{ claim: string; hypeScore: number; realityScore: number }>) || []}
      accentColor={accentColor}
    />
  ),

  AdoptionCurveScene: (data, baseProps, accentColor) => (
    <AdoptionCurveScene
      {...baseProps}
      technology={(data.technology as string) || ''}
      currentPosition={(data.currentPosition as number) || 25}
      phase={(data.phase as 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards') || 'early_adopters'}
      growthRate={(data.growthRate as number) || 15}
      timeToMainstream={data.timeToMainstream as string}
      accentColor={accentColor}
    />
  ),

  PriceComparisonScene: (data, baseProps, accentColor) => (
    <PriceComparisonScene
      {...baseProps}
      items={(data.items as Array<{ item: string; contractPrice: number; marketPrice: number }>) || []}
      contractName={data.contractName as string}
      accentColor={accentColor}
    />
  ),

  ShellCompanyWebScene: (data, baseProps, accentColor) => (
    <ShellCompanyWebScene
      {...baseProps}
      entities={(data.entities as Array<{ name: string; type: 'company' | 'person' | 'offshore' | 'unknown'; suspicious?: boolean }>) || []}
      connections={(data.connections as Array<{ from: string; to: string; relationship: string; hidden?: boolean }>) || []}
      accentColor={accentColor}
    />
  ),

  CorruptionFlagsScene: (data, baseProps, accentColor) => (
    <CorruptionFlagsScene
      {...baseProps}
      flags={(data.flags as Array<{ flag: string; evidence: string; severity: 'critical' | 'high' | 'medium' | 'low' }>) || []}
      accentColor={accentColor}
    />
  ),

  NarrativeComparisonScene: (data, baseProps, accentColor) => (
    <NarrativeComparisonScene
      {...baseProps}
      officialNarrative={(data.officialNarrative as string[]) || []}
      realStory={(data.realStory as string[]) || []}
      discrepancies={data.discrepancies as string[]}
      accentColor={accentColor}
    />
  ),

  CausalChainScene: (data, baseProps, accentColor) => (
    <CausalChainScene
      {...baseProps}
      events={(data.events as Array<{ event: string; date?: string; impact: string; type: 'cause' | 'effect' | 'hidden' }>) || []}
      accentColor={accentColor}
    />
  ),

  RedFlagCompilationScene: (data, baseProps, accentColor) => (
    <RedFlagCompilationScene
      {...baseProps}
      flags={(data.flags as Array<{ flag: string; severity: 'critical' | 'high' | 'medium' | 'low'; evidence?: string }>) || []}
      accentColor={accentColor}
    />
  ),

  LeadershipHistoryScene: (data, baseProps, accentColor) => (
    <LeadershipHistoryScene
      {...baseProps}
      leaders={(data.leaders as Array<{ name: string; role: string; previousCompanies: string[]; issues?: string[]; yearsExperience?: number }>) || []}
      accentColor={accentColor}
    />
  ),

  // Stock Footage Scene (Pexels)
  StockFootageScene: (data, baseProps, accentColor) => (
    <StockFootageScene
      {...baseProps}
      videoUrl={(data.videoUrl as string) || ''}
      overlayText={data.overlayText as string}
      overlayPosition={(data.overlayPosition as 'center' | 'bottom') || 'bottom'}
      accentColor={accentColor}
    />
  ),
};

/**
 * Render a composed scene using per-scene data from the AI composition.
 */
export function renderComposedScene(
  composedScene: ComposedScene,
  baseProps: BaseSceneProps,
  accentColor: string,
): React.ReactNode {
  const renderer = composedSceneRegistry[composedScene.component];

  if (renderer) {
    return renderer(composedScene.data, baseProps, accentColor, composedScene.variant);
  }

  // Fallback for unknown composed scenes
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-slate-400">
      <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm">{composedScene.component}</div>
      <p className="mt-2 text-xs opacity-50">Scene not available</p>
    </div>
  );
}
