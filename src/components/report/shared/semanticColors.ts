/**
 * Semantic Color System
 *
 * This module defines what colors MEAN in the research context, rather than
 * what they ARE. Components consume semantic intents, not raw colors.
 *
 * Key Insight: Color is semantic, not decorative.
 * - "high confidence" → emerald (success)
 * - "low confidence" → red (danger)
 * - "contradiction" → rose (conflict)
 * - "gap" → violet (missing)
 *
 * This ensures consistent meaning across all components and enables
 * global color scheme customization without changing component code.
 */

import type { ThemeName } from './themeColors';

// =============================================================================
// Semantic Intent Types
// =============================================================================

/**
 * Research-specific semantic intents.
 * These define WHAT something means, not how it looks.
 */
export type SemanticIntent =
  // Confidence/Quality intents
  | 'highConfidence'      // Verified, high-quality data
  | 'mediumConfidence'    // Partially verified data
  | 'lowConfidence'       // Unverified, questionable data
  | 'highCredibility'     // Trusted source
  | 'mediumCredibility'   // Moderate trust
  | 'lowCredibility'      // Low trust source

  // Analysis intents
  | 'contradiction'       // Conflicting information
  | 'gap'                 // Missing information
  | 'pattern'             // Detected pattern
  | 'causalLink'          // Cause-effect relationship
  | 'correlation'         // Statistical relationship

  // Entity intents
  | 'person'              // Human entity
  | 'organization'        // Company/group
  | 'location'            // Place
  | 'event'               // Time-bound occurrence
  | 'concept'             // Abstract idea

  // Finding intents
  | 'fact'                // Verified fact
  | 'claim'               // Unverified assertion
  | 'evidence'            // Supporting data
  | 'hypothesis'          // Proposed explanation

  // Status intents
  | 'active'              // In progress
  | 'complete'            // Finished
  | 'paused'              // Halted
  | 'failed'              // Error state

  // Priority intents
  | 'urgent'              // High priority
  | 'normal'              // Standard priority
  | 'deferred'            // Low priority

  // Generic semantic intents
  | 'success'             // Positive outcome
  | 'warning'             // Caution
  | 'danger'              // Error/problem
  | 'info'                // Informational
  | 'neutral'             // Default/no semantic meaning
  | 'muted'               // De-emphasized
  | 'accent';             // Highlight/emphasis

/**
 * Output color specification with all variants needed for UI.
 */
export interface SemanticColorSpec {
  /** Background color class */
  bg: string;
  /** Text color class */
  text: string;
  /** Border color class */
  border: string;
  /** Icon/accent color class */
  accent: string;
  /** Ring/focus color class */
  ring: string;
  /** Gradient background class */
  gradient?: string;
}

// =============================================================================
// Semantic Color Palettes
// =============================================================================

/**
 * Color mapping for each semantic intent, per theme.
 * This is the single source of truth for what colors mean.
 */
export const semanticColorPalettes: Record<ThemeName, Record<SemanticIntent, SemanticColorSpec>> = {
  swiss: {
    // Confidence intents
    highConfidence: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      accent: 'text-emerald-500',
      ring: 'ring-emerald-200',
      gradient: 'from-emerald-50 to-green-50',
    },
    mediumConfidence: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      accent: 'text-amber-500',
      ring: 'ring-amber-200',
      gradient: 'from-amber-50 to-orange-50',
    },
    lowConfidence: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      accent: 'text-red-500',
      ring: 'ring-red-200',
      gradient: 'from-red-50 to-rose-50',
    },
    highCredibility: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      accent: 'text-emerald-500',
      ring: 'ring-emerald-200',
    },
    mediumCredibility: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      accent: 'text-amber-500',
      ring: 'ring-amber-200',
    },
    lowCredibility: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      accent: 'text-red-500',
      ring: 'ring-red-200',
    },

    // Analysis intents
    contradiction: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      border: 'border-rose-200',
      accent: 'text-rose-500',
      ring: 'ring-rose-200',
      gradient: 'from-rose-50 to-red-50',
    },
    gap: {
      bg: 'bg-violet-100',
      text: 'text-violet-700',
      border: 'border-violet-200',
      accent: 'text-violet-500',
      ring: 'ring-violet-200',
      gradient: 'from-violet-50 to-purple-50',
    },
    pattern: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      accent: 'text-cyan-500',
      ring: 'ring-cyan-200',
    },
    causalLink: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      accent: 'text-blue-500',
      ring: 'ring-blue-200',
      gradient: 'from-blue-50 to-indigo-50',
    },
    correlation: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      accent: 'text-indigo-500',
      ring: 'ring-indigo-200',
    },

    // Entity intents
    person: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      border: 'border-rose-200',
      accent: 'text-rose-500',
      ring: 'ring-rose-200',
      gradient: 'from-rose-500 to-pink-600',
    },
    organization: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      accent: 'text-blue-500',
      ring: 'ring-blue-200',
      gradient: 'from-blue-500 to-indigo-600',
    },
    location: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      accent: 'text-emerald-500',
      ring: 'ring-emerald-200',
      gradient: 'from-emerald-500 to-teal-600',
    },
    event: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      accent: 'text-amber-500',
      ring: 'ring-amber-200',
      gradient: 'from-amber-500 to-orange-600',
    },
    concept: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      accent: 'text-purple-500',
      ring: 'ring-purple-200',
    },

    // Finding intents
    fact: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      accent: 'text-indigo-500',
      ring: 'ring-indigo-200',
    },
    claim: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      accent: 'text-slate-500',
      ring: 'ring-slate-200',
    },
    evidence: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      accent: 'text-green-500',
      ring: 'ring-green-200',
    },
    hypothesis: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      accent: 'text-purple-500',
      ring: 'ring-purple-200',
    },

    // Status intents
    active: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      accent: 'text-blue-500',
      ring: 'ring-blue-200',
    },
    complete: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      accent: 'text-emerald-500',
      ring: 'ring-emerald-200',
    },
    paused: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      accent: 'text-slate-400',
      ring: 'ring-slate-200',
    },
    failed: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      accent: 'text-red-500',
      ring: 'ring-red-200',
    },

    // Priority intents
    urgent: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      accent: 'text-red-500',
      ring: 'ring-red-200',
    },
    normal: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      accent: 'text-amber-500',
      ring: 'ring-amber-200',
    },
    deferred: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      accent: 'text-slate-400',
      ring: 'ring-slate-200',
    },

    // Generic intents
    success: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      accent: 'text-emerald-500',
      ring: 'ring-emerald-200',
      gradient: 'from-emerald-50 to-green-50',
    },
    warning: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      accent: 'text-amber-500',
      ring: 'ring-amber-200',
      gradient: 'from-amber-50 to-orange-50',
    },
    danger: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      accent: 'text-red-500',
      ring: 'ring-red-200',
      gradient: 'from-red-50 to-rose-50',
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      accent: 'text-blue-500',
      ring: 'ring-blue-200',
      gradient: 'from-blue-50 to-indigo-50',
    },
    neutral: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      accent: 'text-slate-500',
      ring: 'ring-slate-200',
    },
    muted: {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      border: 'border-slate-100',
      accent: 'text-slate-400',
      ring: 'ring-slate-100',
    },
    accent: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      accent: 'text-indigo-500',
      ring: 'ring-indigo-200',
    },
  },

  radar: {
    // Confidence intents (dark theme)
    highConfidence: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      accent: 'text-emerald-400',
      ring: 'ring-emerald-500/30',
      gradient: 'from-emerald-500/10 to-green-500/10',
    },
    mediumConfidence: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
      ring: 'ring-amber-500/30',
      gradient: 'from-amber-500/10 to-orange-500/10',
    },
    lowConfidence: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      accent: 'text-red-400',
      ring: 'ring-red-500/30',
      gradient: 'from-red-500/10 to-rose-500/10',
    },
    highCredibility: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      accent: 'text-emerald-400',
      ring: 'ring-emerald-500/30',
    },
    mediumCredibility: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
      ring: 'ring-amber-500/30',
    },
    lowCredibility: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      accent: 'text-red-400',
      ring: 'ring-red-500/30',
    },

    // Analysis intents (dark theme)
    contradiction: {
      bg: 'bg-rose-500/20',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      accent: 'text-rose-400',
      ring: 'ring-rose-500/30',
      gradient: 'from-rose-500/10 to-red-500/10',
    },
    gap: {
      bg: 'bg-violet-500/20',
      text: 'text-violet-400',
      border: 'border-violet-500/30',
      accent: 'text-violet-400',
      ring: 'ring-violet-500/30',
      gradient: 'from-violet-500/10 to-purple-500/10',
    },
    pattern: {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      accent: 'text-cyan-400',
      ring: 'ring-cyan-500/30',
    },
    causalLink: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      accent: 'text-blue-400',
      ring: 'ring-blue-500/30',
      gradient: 'from-blue-500/10 to-indigo-500/10',
    },
    correlation: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      accent: 'text-indigo-400',
      ring: 'ring-indigo-500/30',
    },

    // Entity intents (dark theme)
    person: {
      bg: 'bg-rose-500/20',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      accent: 'text-rose-400',
      ring: 'ring-rose-500/30',
      gradient: 'from-rose-500 to-pink-600',
    },
    organization: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      accent: 'text-blue-400',
      ring: 'ring-blue-500/30',
      gradient: 'from-blue-500 to-indigo-600',
    },
    location: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      accent: 'text-emerald-400',
      ring: 'ring-emerald-500/30',
      gradient: 'from-emerald-500 to-teal-600',
    },
    event: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
      ring: 'ring-amber-500/30',
      gradient: 'from-amber-500 to-orange-600',
    },
    concept: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      accent: 'text-purple-400',
      ring: 'ring-purple-500/30',
    },

    // Finding intents (dark theme)
    fact: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      accent: 'text-indigo-400',
      ring: 'ring-indigo-500/30',
    },
    claim: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      accent: 'text-slate-400',
      ring: 'ring-slate-500/30',
    },
    evidence: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      accent: 'text-green-400',
      ring: 'ring-green-500/30',
    },
    hypothesis: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      accent: 'text-purple-400',
      ring: 'ring-purple-500/30',
    },

    // Status intents (dark theme)
    active: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      accent: 'text-blue-400',
      ring: 'ring-blue-500/30',
    },
    complete: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      accent: 'text-emerald-400',
      ring: 'ring-emerald-500/30',
    },
    paused: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      accent: 'text-slate-500',
      ring: 'ring-slate-500/30',
    },
    failed: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      accent: 'text-red-400',
      ring: 'ring-red-500/30',
    },

    // Priority intents (dark theme)
    urgent: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      accent: 'text-red-400',
      ring: 'ring-red-500/30',
    },
    normal: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
      ring: 'ring-amber-500/30',
    },
    deferred: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      accent: 'text-slate-500',
      ring: 'ring-slate-500/30',
    },

    // Generic intents (dark theme)
    success: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      accent: 'text-emerald-400',
      ring: 'ring-emerald-500/30',
      gradient: 'from-emerald-500/10 to-green-500/10',
    },
    warning: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
      ring: 'ring-amber-500/30',
      gradient: 'from-amber-500/10 to-orange-500/10',
    },
    danger: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      accent: 'text-red-400',
      ring: 'ring-red-500/30',
      gradient: 'from-red-500/10 to-rose-500/10',
    },
    info: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      accent: 'text-blue-400',
      ring: 'ring-blue-500/30',
      gradient: 'from-blue-500/10 to-indigo-500/10',
    },
    neutral: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      accent: 'text-slate-400',
      ring: 'ring-slate-500/30',
    },
    muted: {
      bg: 'bg-slate-800',
      text: 'text-slate-500',
      border: 'border-slate-700',
      accent: 'text-slate-600',
      ring: 'ring-slate-700',
    },
    accent: {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      accent: 'text-cyan-400',
      ring: 'ring-cyan-500/30',
    },
  },
};

// =============================================================================
// Intent Resolution Functions
// =============================================================================

/**
 * Get the semantic color spec for an intent.
 */
export function getSemanticColor(intent: SemanticIntent, theme: ThemeName): SemanticColorSpec {
  return semanticColorPalettes[theme][intent];
}

/**
 * Resolve a confidence score to a semantic intent.
 * @param score - Score as 0-1 decimal or 0-100 percentage
 */
export function scoreToConfidenceIntent(score: number): SemanticIntent {
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= 80) return 'highConfidence';
  if (pct >= 50) return 'mediumConfidence';
  return 'lowConfidence';
}

/**
 * Resolve a credibility score to a semantic intent.
 * @param score - Score as 0-1 decimal or 0-100 percentage
 */
export function scoreToCredibilityIntent(score: number): SemanticIntent {
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= 80) return 'highCredibility';
  if (pct >= 50) return 'mediumCredibility';
  return 'lowCredibility';
}

/**
 * Resolve a priority string to a semantic intent.
 */
export function priorityToIntent(priority: string): SemanticIntent {
  const normalized = priority.toLowerCase();
  if (normalized === 'high' || normalized === 'urgent' || normalized === 'critical') return 'urgent';
  if (normalized === 'low' || normalized === 'deferred') return 'deferred';
  return 'normal';
}

/**
 * Resolve a status string to a semantic intent.
 */
export function statusToIntent(status: string): SemanticIntent {
  const normalized = status.toLowerCase();
  if (normalized === 'completed' || normalized === 'complete' || normalized === 'done') return 'complete';
  if (normalized === 'active' || normalized === 'searching' || normalized === 'analyzing') return 'active';
  if (normalized === 'paused' || normalized === 'pending') return 'paused';
  if (normalized === 'failed' || normalized === 'error') return 'failed';
  return 'neutral';
}

/**
 * Resolve a finding type to a semantic intent.
 */
export function findingTypeToIntent(type: string): SemanticIntent {
  const normalized = type.toLowerCase();
  if (normalized === 'fact') return 'fact';
  if (normalized === 'claim') return 'claim';
  if (normalized === 'evidence') return 'evidence';
  if (normalized === 'gap') return 'gap';
  if (normalized === 'pattern') return 'pattern';
  if (normalized === 'event') return 'event';
  if (normalized === 'actor' || normalized === 'person') return 'person';
  if (normalized === 'relationship') return 'causalLink';
  return 'neutral';
}

/**
 * Resolve an entity type to a semantic intent.
 */
export function entityTypeToIntent(type: string): SemanticIntent {
  const normalized = type.toLowerCase();
  if (normalized === 'person') return 'person';
  if (normalized === 'organization' || normalized === 'org' || normalized === 'company') return 'organization';
  if (normalized === 'location' || normalized === 'place') return 'location';
  if (normalized === 'event') return 'event';
  return 'concept';
}

// =============================================================================
// Convenience Getters
// =============================================================================

/**
 * Get badge classes for a semantic intent.
 * Returns combined bg + text classes for badge styling.
 */
export function getSemanticBadgeClasses(intent: SemanticIntent, theme: ThemeName): string {
  const spec = getSemanticColor(intent, theme);
  return `${spec.bg} ${spec.text}`;
}

/**
 * Get card classes for a semantic intent.
 * Returns combined bg + border + text classes for card styling.
 */
export function getSemanticCardClasses(intent: SemanticIntent, theme: ThemeName): string {
  const spec = getSemanticColor(intent, theme);
  return `${spec.bg} ${spec.border} ${spec.text}`;
}

/**
 * Get alert classes for a semantic intent.
 * Returns gradient bg + border + text classes for alert styling.
 */
export function getSemanticAlertClasses(intent: SemanticIntent, theme: ThemeName): string {
  const spec = getSemanticColor(intent, theme);
  const bg = spec.gradient ? `bg-gradient-to-br ${spec.gradient}` : spec.bg;
  return `${bg} ${spec.border} ${spec.text}`;
}

// =============================================================================
// Legacy Mapping (for backwards compatibility)
// =============================================================================

/**
 * Map old color props (success/warning/danger/default) to semantic intents.
 */
export function legacyColorToIntent(color: string): SemanticIntent {
  switch (color) {
    case 'success':
    case 'emerald':
    case 'green':
      return 'success';
    case 'warning':
    case 'amber':
    case 'orange':
      return 'warning';
    case 'danger':
    case 'error':
    case 'red':
    case 'rose':
      return 'danger';
    case 'info':
    case 'blue':
    case 'indigo':
      return 'info';
    case 'violet':
    case 'purple':
      return 'gap';
    default:
      return 'neutral';
  }
}
