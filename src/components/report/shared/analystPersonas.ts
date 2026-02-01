/**
 * Analyst Personas - Each view represents a distinct intelligence analyst role
 *
 * These personas define the lens through which data is viewed and prioritized.
 * They guide UX decisions about what to show first and how to present information.
 */

export type AnalystRole =
  | 'executive'      // OverviewView - Executive Summary Analyst
  | 'evidence'       // FindingsView - Evidence Analyst
  | 'source'         // SourcesView - Source Evaluator
  | 'contradiction'  // AnalysisView - Contradiction Detector
  | 'network'        // EntitiesView - Network Mapper
  | 'domain';        // PerspectivesView - Domain Expert

export interface AnalystPersona {
  /** Unique role identifier */
  role: AnalystRole;
  /** Display name for the persona */
  title: string;
  /** Short description of what this analyst does */
  description: string;
  /** Icon/emoji representing the role */
  icon: string;
  /** What this analyst prioritizes when viewing data */
  priorities: string[];
  /** Key questions this analyst seeks to answer */
  keyQuestions: string[];
  /** Gradient colors for theming (radar theme) */
  gradientRadar: string;
  /** Gradient colors for theming (swiss theme) */
  gradientSwiss: string;
  /** Accent color for highlights */
  accentColor: string;
}

/**
 * Complete persona definitions for each analyst role
 */
export const analystPersonas: Record<AnalystRole, AnalystPersona> = {
  executive: {
    role: 'executive',
    title: 'Executive Analyst',
    description: 'Synthesizes findings into actionable intelligence summaries',
    icon: '🎯',
    priorities: [
      'Key takeaways and recommendations',
      'Risk assessment at a glance',
      'Confidence-weighted conclusions',
      'Critical warnings and red flags',
    ],
    keyQuestions: [
      'What do I need to know right now?',
      'What are the biggest risks?',
      'How confident should I be in these findings?',
      'What actions should I take?',
    ],
    gradientRadar: 'from-cyan-500/20 to-blue-500/20',
    gradientSwiss: 'from-stone-100 to-stone-200',
    accentColor: 'cyan',
  },

  evidence: {
    role: 'evidence',
    title: 'Evidence Analyst',
    description: 'Examines and validates individual findings with rigor',
    icon: '🔍',
    priorities: [
      'Confidence scores and verification status',
      'Supporting source chains',
      'Temporal context and event dates',
      'Cross-reference validation',
    ],
    keyQuestions: [
      'How reliable is this finding?',
      'What sources support this claim?',
      'When did this information emerge?',
      'Are there contradicting findings?',
    ],
    gradientRadar: 'from-emerald-500/20 to-teal-500/20',
    gradientSwiss: 'from-emerald-50 to-teal-50',
    accentColor: 'emerald',
  },

  source: {
    role: 'source',
    title: 'Source Evaluator',
    description: 'Assesses credibility and trustworthiness of information sources',
    icon: '📡',
    priorities: [
      'Credibility scores and trust metrics',
      'Source type diversity',
      'Publication dates and freshness',
      'Domain authority indicators',
    ],
    keyQuestions: [
      'Can I trust this source?',
      'How recent is this information?',
      'What is the source bias?',
      'Are sources corroborating each other?',
    ],
    gradientRadar: 'from-violet-500/20 to-purple-500/20',
    gradientSwiss: 'from-violet-50 to-purple-50',
    accentColor: 'violet',
  },

  contradiction: {
    role: 'contradiction',
    title: 'Contradiction Detector',
    description: 'Identifies conflicts, gaps, and inconsistencies in the data',
    icon: '⚡',
    priorities: [
      'Conflicting claims and contradictions',
      'Research gaps and blind spots',
      'Logical inconsistencies',
      'Unverified assumptions',
    ],
    keyQuestions: [
      'Where do sources disagree?',
      'What information is missing?',
      'Are there logical flaws?',
      'What needs further investigation?',
    ],
    gradientRadar: 'from-amber-500/20 to-orange-500/20',
    gradientSwiss: 'from-amber-50 to-orange-50',
    accentColor: 'amber',
  },

  network: {
    role: 'network',
    title: 'Network Mapper',
    description: 'Maps relationships between people, organizations, and events',
    icon: '🕸️',
    priorities: [
      'Entity connections and relationships',
      'Key players and influencers',
      'Organizational structures',
      'Event timelines and patterns',
    ],
    keyQuestions: [
      'Who are the key players?',
      'How are entities connected?',
      'What patterns emerge from relationships?',
      'Who influences whom?',
    ],
    gradientRadar: 'from-rose-500/20 to-pink-500/20',
    gradientSwiss: 'from-rose-50 to-pink-50',
    accentColor: 'rose',
  },

  domain: {
    role: 'domain',
    title: 'Domain Expert',
    description: 'Provides specialized perspective and contextual interpretation',
    icon: '🧠',
    priorities: [
      'Expert insights and interpretations',
      'Industry-specific context',
      'Strategic recommendations',
      'Future projections and scenarios',
    ],
    keyQuestions: [
      'What does this mean in context?',
      'What are the industry implications?',
      'What should we do next?',
      'What scenarios should we prepare for?',
    ],
    gradientRadar: 'from-indigo-500/20 to-blue-500/20',
    gradientSwiss: 'from-indigo-50 to-blue-50',
    accentColor: 'indigo',
  },
};

/**
 * Get persona by role
 */
export function getPersona(role: AnalystRole): AnalystPersona {
  return analystPersonas[role];
}

/**
 * Map view names to analyst roles
 */
export const viewToRole: Record<string, AnalystRole> = {
  overview: 'executive',
  findings: 'evidence',
  sources: 'source',
  analysis: 'contradiction',
  entities: 'network',
  perspectives: 'domain',
};

/**
 * Get persona for a view name
 */
export function getPersonaForView(viewName: string): AnalystPersona | null {
  const role = viewToRole[viewName];
  return role ? analystPersonas[role] : null;
}
