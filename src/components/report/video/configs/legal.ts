import type { TemplateVideoConfig } from './types';

/**
 * Legal Analysis Template Video Config
 *
 * Focus: Ruling implications, precedent analysis, who's at risk
 * Scene Flow: Hook -> Ruling -> Precedent -> At Risk -> Implications
 * Duration: 16 seconds (480 frames at 30fps)
 */
export const legalConfig: TemplateVideoConfig = {
  templateType: 'legal',
  name: 'Legal Analysis',
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
        variant: 'legal',
        gavelEffect: true,
      },
    },
    {
      id: 'ruling',
      name: 'The Ruling',
      component: 'RulingImpactScene',
      startFrame: 60,
      endFrame: 180,
      props: {
        showCascade: true,
        highlightKey: true,
      },
    },
    {
      id: 'atrisk',
      name: 'Who Is At Risk',
      component: 'AtRiskScene',
      startFrame: 180,
      endFrame: 330,
      props: {
        showCategories: true,
        riskLevels: true,
      },
    },
    {
      id: 'verdict',
      name: 'Legal Implications',
      component: 'VerdictScene',
      startFrame: 330,
      endFrame: 480,
      props: {
        style: 'legal',
        showTimeline: true,
      },
    },
  ],
  hooks: {
    openingPattern: 'This ruling changes everything...',
    closingPattern: 'Stay informed. Follow for legal analysis.',
  },
  visuals: {
    accentColor: '#0ea5e9', // sky-500
    secondaryColor: '#3b82f6', // blue-500
    icon: '⚖️',
  },
};
