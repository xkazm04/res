import type { TemplateVideoConfig } from './types';

/**
 * Financial Analysis Template Video Config
 *
 * Focus: Bull vs bear perspectives, hidden risks, actionable insights
 * Scene Flow: Hook -> Bull Case -> Bear Case -> Risks -> Decision
 * Duration: 18 seconds (540 frames at 30fps)
 */
export const financialConfig: TemplateVideoConfig = {
  templateType: 'financial',
  name: 'Financial Analysis',
  fps: 30,
  totalFrames: 540,
  durationSeconds: 18,
  scenes: [
    {
      id: 'hook',
      name: 'Opening Hook',
      component: 'HookScene',
      startFrame: 0,
      endFrame: 75,
      props: {
        variant: 'financial',
        showTicker: true,
      },
    },
    {
      id: 'bullbear',
      name: 'Bull vs Bear',
      component: 'BullBearScene',
      startFrame: 75,
      endFrame: 270,
      props: {
        splitScreen: true,
        animateArguments: true,
      },
    },
    {
      id: 'risks',
      name: 'Risk Assessment',
      component: 'RiskMeterScene',
      startFrame: 270,
      endFrame: 420,
      props: {
        gaugeStyle: 'dramatic',
        listFactors: true,
      },
    },
    {
      id: 'verdict',
      name: 'Investment Verdict',
      component: 'VerdictScene',
      startFrame: 420,
      endFrame: 540,
      props: {
        style: 'financial',
        showPriceTarget: true,
      },
    },
  ],
  hooks: {
    openingPattern: "Wall Street is bullish. Here's what they're missing...",
    closingPattern: 'NFA. Do your own research.',
  },
  visuals: {
    accentColor: '#22c55e', // green-500
    secondaryColor: '#14b8a6', // teal-500
    icon: '📊',
  },
};
