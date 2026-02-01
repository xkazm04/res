import type { TemplateVideoConfig } from './types';

/**
 * Competitive Analysis Template Video Config
 *
 * Focus: Market positioning, hidden battlefronts, strategic insights
 * Scene Flow: Hook -> Landscape -> Battle -> Winner/Loser -> Outlook
 * Duration: 18 seconds (540 frames at 30fps)
 */
export const competitiveConfig: TemplateVideoConfig = {
  templateType: 'competitive',
  name: 'Competitive Analysis',
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
        variant: 'competitive',
        battleTheme: true,
      },
    },
    {
      id: 'landscape',
      name: 'Market Landscape',
      component: 'CompetitiveLandscapeScene',
      startFrame: 75,
      endFrame: 210,
      props: {
        showPositioning: true,
        animateQuadrants: true,
      },
    },
    {
      id: 'battle',
      name: 'The Battle',
      component: 'BattleMapScene',
      startFrame: 210,
      endFrame: 390,
      props: {
        headToHead: true,
        showStrengths: true,
        showWeaknesses: true,
      },
    },
    {
      id: 'verdict',
      name: 'Market Outlook',
      component: 'VerdictScene',
      startFrame: 390,
      endFrame: 540,
      props: {
        style: 'competitive',
        showWinner: true,
      },
    },
  ],
  hooks: {
    openingPattern: 'The battle for dominance has a hidden front...',
    closingPattern: 'Who will win? Follow for updates.',
  },
  visuals: {
    accentColor: '#8b5cf6', // violet-500
    secondaryColor: '#6366f1', // indigo-500
    icon: '⚔️',
  },
};
