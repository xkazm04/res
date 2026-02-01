import type { TemplateVideoConfig } from './types';

/**
 * Due Diligence Template Video Config
 *
 * Focus: Red flags, leadership history, background verification
 * Scene Flow: Hook -> Red Flags -> Leadership -> History -> Verdict
 * Duration: 16 seconds (480 frames at 30fps)
 */
export const dueDiligenceConfig: TemplateVideoConfig = {
  templateType: 'due_diligence',
  name: 'Due Diligence Report',
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
        variant: 'due_diligence',
        warningFlash: true,
      },
    },
    {
      id: 'redflags',
      name: 'Red Flags',
      component: 'RedFlagCompilationScene',
      startFrame: 60,
      endFrame: 210,
      props: {
        stackAnimation: true,
        severitySort: true,
      },
    },
    {
      id: 'leadership',
      name: 'Leadership History',
      component: 'LeadershipHistoryScene',
      startFrame: 210,
      endFrame: 360,
      props: {
        showTimeline: true,
        highlightIssues: true,
      },
    },
    {
      id: 'verdict',
      name: 'Due Diligence Verdict',
      component: 'VerdictScene',
      startFrame: 360,
      endFrame: 480,
      props: {
        style: 'due_diligence',
        showRiskScore: true,
      },
    },
  ],
  hooks: {
    openingPattern: 'Impressive pitch deck. Concerning background...',
    closingPattern: 'Verify before you invest. Follow.',
  },
  visuals: {
    accentColor: '#f43f5e', // rose-500
    secondaryColor: '#e11d48', // rose-600
    icon: '🔎',
  },
};
