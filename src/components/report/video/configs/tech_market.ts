import type { TemplateVideoConfig } from './types';

/**
 * Tech Market Analysis Template Video Config
 *
 * Focus: Hype vs reality, adoption curves, opportunity analysis
 * Scene Flow: Hook -> Hype -> Reality -> Trends -> Opportunity
 * Duration: 18 seconds (540 frames at 30fps)
 */
export const techMarketConfig: TemplateVideoConfig = {
  templateType: 'tech_market',
  name: 'Tech Market Analysis',
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
        variant: 'tech',
        glitchEffect: true,
      },
    },
    {
      id: 'hype-reality',
      name: 'Hype vs Reality',
      component: 'HypeVsRealityScene',
      startFrame: 75,
      endFrame: 240,
      props: {
        showBars: true,
        animateContrast: true,
      },
    },
    {
      id: 'adoption',
      name: 'Adoption Curve',
      component: 'AdoptionCurveScene',
      startFrame: 240,
      endFrame: 390,
      props: {
        showPosition: true,
        predictTrajectory: true,
      },
    },
    {
      id: 'verdict',
      name: 'Opportunity Analysis',
      component: 'VerdictScene',
      startFrame: 390,
      endFrame: 540,
      props: {
        style: 'tech',
        showWindow: true,
      },
    },
  ],
  hooks: {
    openingPattern: 'The hype says revolution. Developers say...',
    closingPattern: 'Tech insights weekly. Follow.',
  },
  visuals: {
    accentColor: '#06b6d4', // cyan-500
    secondaryColor: '#0891b2', // cyan-600
    icon: '🚀',
  },
};
