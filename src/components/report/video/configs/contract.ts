import type { TemplateVideoConfig } from './types';

/**
 * Contract Analysis Template Video Config
 *
 * Focus: Price comparison, shell company detection, corruption flags
 * Scene Flow: Hook -> Deal -> Comparison -> Red Flags -> Verdict
 * Duration: 16 seconds (480 frames at 30fps)
 */
export const contractConfig: TemplateVideoConfig = {
  templateType: 'contract',
  name: 'Contract Analysis',
  fps: 30,
  totalFrames: 480,
  durationSeconds: 16,
  scenes: [
    {
      id: 'hook',
      name: 'Opening Hook',
      component: 'HookScene',
      startFrame: 0,
      endFrame: 60,
      props: {
        variant: 'contract',
        moneyReveal: true,
      },
    },
    {
      id: 'comparison',
      name: 'Price Comparison',
      component: 'PriceComparisonScene',
      startFrame: 60,
      endFrame: 180,
      props: {
        showMarketRate: true,
        highlightDifference: true,
      },
    },
    {
      id: 'shell',
      name: 'Shell Company Web',
      component: 'ShellCompanyWebScene',
      startFrame: 180,
      endFrame: 300,
      props: {
        animateConnections: true,
        revealOwnership: true,
      },
    },
    {
      id: 'flags',
      name: 'Corruption Flags',
      component: 'CorruptionFlagsScene',
      startFrame: 300,
      endFrame: 390,
      props: {
        stackAnimation: true,
        severityColors: true,
      },
    },
    {
      id: 'verdict',
      name: 'Final Assessment',
      component: 'VerdictScene',
      startFrame: 390,
      endFrame: 480,
      props: {
        style: 'contract',
        showSavings: true,
      },
    },
  ],
  hooks: {
    openingPattern: 'Your tax dollars: overcharged by how much?',
    closingPattern: 'Accountability matters. Follow.',
  },
  visuals: {
    accentColor: '#f59e0b', // amber-500
    secondaryColor: '#d97706', // amber-600
    icon: '📋',
  },
};
