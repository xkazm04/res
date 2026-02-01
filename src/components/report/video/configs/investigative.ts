import type { TemplateVideoConfig } from './types';

/**
 * Investigative Template Video Config
 *
 * Focus: Hidden insights, follow the money, pattern recognition
 * Scene Flow: Hook -> Actors -> Money -> Patterns -> Verdict
 * Duration: 20 seconds (600 frames at 30fps)
 */
export const investigativeConfig: TemplateVideoConfig = {
  templateType: 'investigative',
  name: 'Investigative Report',
  fps: 30,
  totalFrames: 600,
  durationSeconds: 20,
  scenes: [
    {
      id: 'hook',
      name: 'Opening Hook',
      component: 'HookScene',
      startFrame: 0,
      endFrame: 90,
      props: {
        variant: 'investigative',
        dramaticPause: true,
      },
    },
    {
      id: 'actors',
      name: 'Actor Network',
      component: 'ActorNetworkScene',
      startFrame: 90,
      endFrame: 210,
      props: {
        highlightConnections: true,
        revealSequence: 'radial',
      },
    },
    {
      id: 'money',
      name: 'Money Trail',
      component: 'MoneyTrailScene',
      startFrame: 210,
      endFrame: 420,
      props: {
        animateFlows: true,
        showAmounts: true,
      },
    },
    {
      id: 'verdict',
      name: 'Final Verdict',
      component: 'VerdictScene',
      startFrame: 420,
      endFrame: 600,
      props: {
        style: 'investigative',
        showCTA: true,
      },
    },
  ],
  hooks: {
    openingPattern: "What they don't want you to know...",
    closingPattern: 'Follow for more investigations',
  },
  visuals: {
    accentColor: '#ef4444', // red-500
    secondaryColor: '#f97316', // orange-500
    icon: '🔍',
  },
};
