import type { TemplateVideoConfig } from './types';

/**
 * Understanding/Context Template Video Config
 *
 * Focus: Official vs real narrative, causal chains, hidden context
 * Scene Flow: Hook -> Official Story -> Real Story -> Money -> Truth
 * Duration: 20 seconds (600 frames at 30fps)
 */
export const understandingConfig: TemplateVideoConfig = {
  templateType: 'understanding',
  name: 'Context Analysis',
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
        variant: 'understanding',
        mysteryReveal: true,
      },
    },
    {
      id: 'narratives',
      name: 'Narrative Comparison',
      component: 'NarrativeComparisonScene',
      startFrame: 90,
      endFrame: 270,
      props: {
        splitView: true,
        highlightDiscrepancies: true,
      },
    },
    {
      id: 'chain',
      name: 'Causal Chain',
      component: 'CausalChainScene',
      startFrame: 270,
      endFrame: 450,
      props: {
        animateArrows: true,
        showTimestamps: true,
      },
    },
    {
      id: 'verdict',
      name: 'The Truth',
      component: 'VerdictScene',
      startFrame: 450,
      endFrame: 600,
      props: {
        style: 'understanding',
        showTimeline: true,
      },
    },
  ],
  hooks: {
    openingPattern: "The official story started in March. The real story started in November...",
    closingPattern: 'Context matters. Follow for the real story.',
  },
  visuals: {
    accentColor: '#a855f7', // purple-500
    secondaryColor: '#7c3aed', // violet-600
    icon: '🧩',
  },
};
