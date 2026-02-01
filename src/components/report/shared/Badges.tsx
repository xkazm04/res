'use client';

/**
 * Badge Components for Report Display
 *
 * This module provides badge components that map domain values to visual representations.
 * All badges now use the schema-driven BadgeSchema system under the hood.
 *
 * For new badge types, prefer using the schema system directly:
 * @see BadgeSchema.tsx for defineBadgeSchema and createBadgeComponent
 */

import {
  SchemaTypeBadge,
  SchemaSourceTypeBadge,
  SchemaPriorityBadge,
  SchemaStatusBadge,
  SchemaScoreBadge,
  type SchemaBadgeProps,
  type ScoreBadgeSchemaProps,
} from './BadgeSchema';

// =============================================================================
// Legacy-Compatible Badge Components
// These maintain the original API while using the schema system internally
// =============================================================================

/**
 * Badge for finding types (fact, claim, event, etc.)
 */
export function TypeBadge({ type }: { type: string }) {
  return <SchemaTypeBadge value={type as never} />;
}

/**
 * Badge for source types (news, academic, government, etc.)
 */
export function SourceTypeBadge({ type }: { type: string }) {
  return <SchemaSourceTypeBadge value={type as never} />;
}

/**
 * Unified score badge component for confidence and credibility scores.
 * @param score - Score as 0-1 decimal
 * @param variant - 'confidence' uses slate for low, 'credibility' uses red for low
 * @param label - Optional label to display instead of percentage
 */
export function ScoreBadge({
  score,
  variant = 'confidence',
  label,
}: {
  score: number;
  variant?: 'confidence' | 'credibility';
  label?: string;
}) {
  return <SchemaScoreBadge score={score} variant={variant} label={label} />;
}

/**
 * Badge for confidence scores (high=emerald, medium=amber, low=slate)
 */
export function ConfidenceBadge({ score }: { score: number }) {
  return <SchemaScoreBadge score={score} variant="confidence" />;
}

/**
 * Badge for credibility scores (high=emerald, medium=amber, low=red)
 */
export function CredibilityBadge({ score }: { score: number }) {
  return <SchemaScoreBadge score={score} variant="credibility" />;
}

/**
 * Badge for priority levels (high, medium, low)
 */
export function PriorityBadge({ priority }: { priority: string }) {
  return <SchemaPriorityBadge value={priority as never} />;
}

/**
 * Badge for status values (active, completed, failed, etc.)
 */
export function StatusBadge({ status }: { status: string }) {
  return <SchemaStatusBadge value={status as never} />;
}

// =============================================================================
// Re-export Schema System for Direct Access
// =============================================================================

export {
  // Schema definition utilities
  defineBadgeSchema,
  createBadgeComponent,
  useBadgeStyles,
  getBadgeColorClasses,

  // Pre-defined schemas
  findingTypeSchema,
  sourceTypeSchema,
  prioritySchema,
  statusSchema,
  entityTypeSchema,
  confidenceLevelSchema,

  // Schema-generated components
  SchemaTypeBadge,
  SchemaSourceTypeBadge,
  SchemaPriorityBadge,
  SchemaStatusBadge,
  SchemaEntityTypeBadge,
  SchemaConfidenceLevelBadge,
  SchemaScoreBadge,

  // Universal badge
  UniversalBadge,

  // Registry
  badgeSchemaRegistry,
  getSchemaByDomain,
  registerBadgeSchema,

  // Types
  type BadgeColor,
  type BadgeShape,
  type BadgeSize,
  type BadgeValueDef,
  type BadgeSchemaDef,
  type BadgeSchema,
  type SchemaBadgeProps,
  type ScoreBadgeSchemaProps,
} from './BadgeSchema';
