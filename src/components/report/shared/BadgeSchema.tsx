'use client';

/**
 * BadgeSchema - A Type System for Visual Domain Mappings
 *
 * This module provides a schema-driven approach to badge generation where
 * badges are defined declaratively and components are generated automatically.
 *
 * Key Insight: Badges are a type system mapping domain values to visual representations.
 *
 * @example
 * ```tsx
 * // Define a schema
 * const findingTypeSchema = defineBadgeSchema({
 *   domain: 'findingType',
 *   values: {
 *     fact: { color: 'indigo', label: 'Fact' },
 *     claim: { color: 'slate', label: 'Claim' },
 *   },
 * });
 *
 * // Generate a component
 * const FindingTypeBadge = createBadgeComponent(findingTypeSchema);
 *
 * // Use it
 * <FindingTypeBadge value="fact" />
 * ```
 */

import { type ReactNode, type ComponentType, useMemo } from 'react';
import { useThemedColors, type ThemeName } from './themeColors';

// =============================================================================
// Core Types
// =============================================================================

/**
 * Base color names available for badges.
 * These map to Tailwind color classes.
 */
export type BadgeColor =
  | 'slate' | 'gray'
  | 'red' | 'rose' | 'pink'
  | 'orange' | 'amber' | 'yellow'
  | 'lime' | 'green' | 'emerald' | 'teal'
  | 'cyan' | 'sky' | 'blue' | 'indigo'
  | 'violet' | 'purple' | 'fuchsia';

/**
 * Badge shape variants.
 */
export type BadgeShape = 'rounded' | 'pill' | 'square';

/**
 * Badge size variants.
 */
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Definition for a single badge value within a schema.
 */
export interface BadgeValueDef {
  /** Color for this value */
  color: BadgeColor;

  /** Display label (if different from value) */
  label?: string;

  /** Optional icon component */
  icon?: ReactNode;

  /** Optional description/tooltip */
  description?: string;
}

/**
 * Schema definition for a badge domain.
 */
export interface BadgeSchemaDef<T extends string = string> {
  /** Domain name (e.g., 'findingType', 'priority') */
  domain: string;

  /** Mapping of domain values to visual definitions */
  values: Record<T, BadgeValueDef>;

  /** Default value when input doesn't match */
  fallback?: BadgeValueDef;

  /** Badge shape (default: 'rounded') */
  shape?: BadgeShape;

  /** Badge size (default: 'sm') */
  size?: BadgeSize;

  /** Whether to uppercase the label (default: true) */
  uppercase?: boolean;

  /** Custom label transformer */
  labelTransform?: (value: string) => string;
}

/**
 * Resolved badge schema with all defaults applied.
 */
export interface BadgeSchema<T extends string = string> {
  domain: string;
  values: Record<T, Required<BadgeValueDef>>;
  fallback: Required<BadgeValueDef>;
  shape: BadgeShape;
  size: BadgeSize;
  uppercase: boolean;
  labelTransform: (value: string) => string;
}

/**
 * Props for a schema-generated badge component.
 */
export interface SchemaBadgeProps<T extends string = string> {
  /** The domain value to display */
  value: T;

  /** Override the display label */
  label?: string;

  /** Additional CSS classes */
  className?: string;

  /** Override shape for this instance */
  shape?: BadgeShape;

  /** Override size for this instance */
  size?: BadgeSize;
}

// =============================================================================
// Color Mappings
// =============================================================================

/**
 * Generate Tailwind classes for a color in light theme.
 */
function getColorClassesLight(color: BadgeColor): string {
  const map: Record<BadgeColor, string> = {
    slate: 'bg-slate-100 text-slate-700',
    gray: 'bg-gray-100 text-gray-700',
    red: 'bg-red-100 text-red-700',
    rose: 'bg-rose-100 text-rose-700',
    pink: 'bg-pink-100 text-pink-700',
    orange: 'bg-orange-100 text-orange-700',
    amber: 'bg-amber-100 text-amber-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    lime: 'bg-lime-100 text-lime-700',
    green: 'bg-green-100 text-green-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    teal: 'bg-teal-100 text-teal-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    sky: 'bg-sky-100 text-sky-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    violet: 'bg-violet-100 text-violet-700',
    purple: 'bg-purple-100 text-purple-700',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
  };
  return map[color];
}

/**
 * Generate Tailwind classes for a color in dark/radar theme.
 */
function getColorClassesDark(color: BadgeColor): string {
  const map: Record<BadgeColor, string> = {
    slate: 'bg-slate-500/20 text-slate-400',
    gray: 'bg-gray-500/20 text-gray-400',
    red: 'bg-red-500/20 text-red-400',
    rose: 'bg-rose-500/20 text-rose-400',
    pink: 'bg-pink-500/20 text-pink-400',
    orange: 'bg-orange-500/20 text-orange-400',
    amber: 'bg-amber-500/20 text-amber-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    lime: 'bg-lime-500/20 text-lime-400',
    green: 'bg-green-500/20 text-green-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    teal: 'bg-teal-500/20 text-teal-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    sky: 'bg-sky-500/20 text-sky-400',
    blue: 'bg-blue-500/20 text-blue-400',
    indigo: 'bg-indigo-500/20 text-indigo-400',
    violet: 'bg-violet-500/20 text-violet-400',
    purple: 'bg-purple-500/20 text-purple-400',
    fuchsia: 'bg-fuchsia-500/20 text-fuchsia-400',
  };
  return map[color];
}

/**
 * Get color classes for a badge based on theme.
 */
export function getBadgeColorClasses(color: BadgeColor, theme: ThemeName): string {
  return theme === 'radar' ? getColorClassesDark(color) : getColorClassesLight(color);
}

// =============================================================================
// Size & Shape Classes
// =============================================================================

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[9px]',
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const shapeClasses: Record<BadgeShape, string> = {
  rounded: 'rounded',
  pill: 'rounded-full',
  square: 'rounded-sm',
};

// =============================================================================
// Schema Definition & Resolution
// =============================================================================

const defaultLabelTransform = (value: string) => value.replace(/_/g, ' ');

const defaultFallback: Required<BadgeValueDef> = {
  color: 'slate',
  label: '',
  icon: null,
  description: '',
};

/**
 * Define a badge schema with type safety.
 *
 * @example
 * ```tsx
 * const statusSchema = defineBadgeSchema({
 *   domain: 'status',
 *   values: {
 *     active: { color: 'blue', label: 'Active' },
 *     completed: { color: 'emerald', label: 'Done' },
 *   },
 * });
 * ```
 */
export function defineBadgeSchema<T extends string>(
  def: BadgeSchemaDef<T>
): BadgeSchema<T> {
  // Resolve all value definitions with defaults
  const resolvedValues = {} as Record<T, Required<BadgeValueDef>>;

  for (const [key, valueDef] of Object.entries(def.values) as [T, BadgeValueDef][]) {
    resolvedValues[key] = {
      color: valueDef.color,
      label: valueDef.label ?? key,
      icon: valueDef.icon ?? null,
      description: valueDef.description ?? '',
    };
  }

  return {
    domain: def.domain,
    values: resolvedValues,
    fallback: def.fallback
      ? { ...defaultFallback, ...def.fallback, label: def.fallback.label ?? 'Unknown' }
      : { ...defaultFallback, label: 'Unknown' },
    shape: def.shape ?? 'rounded',
    size: def.size ?? 'sm',
    uppercase: def.uppercase ?? true,
    labelTransform: def.labelTransform ?? defaultLabelTransform,
  };
}

// =============================================================================
// Badge Component Generator
// =============================================================================

/**
 * Create a badge component from a schema.
 *
 * @example
 * ```tsx
 * const StatusBadge = createBadgeComponent(statusSchema);
 *
 * // Use it
 * <StatusBadge value="active" />
 * <StatusBadge value="completed" size="lg" />
 * ```
 */
export function createBadgeComponent<T extends string>(
  schema: BadgeSchema<T>
): ComponentType<SchemaBadgeProps<T>> {
  function SchemaBadge({
    value,
    label: labelOverride,
    className = '',
    shape: shapeOverride,
    size: sizeOverride,
  }: SchemaBadgeProps<T>) {
    const { isRadar } = useThemedColors();
    const theme: ThemeName = isRadar ? 'radar' : 'swiss';

    // Get value definition or fallback
    const valueDef = schema.values[value] ?? schema.fallback;

    // Resolve display label
    const displayLabel = labelOverride ?? valueDef.label ?? schema.labelTransform(value);

    // Resolve shape and size
    const shape = shapeOverride ?? schema.shape;
    const size = sizeOverride ?? schema.size;

    // Build class string
    const colorClass = getBadgeColorClasses(valueDef.color, theme);
    const classes = [
      'inline-flex items-center gap-1 font-semibold',
      colorClass,
      sizeClasses[size],
      shapeClasses[shape],
      schema.uppercase ? 'uppercase' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <span className={classes} title={valueDef.description || undefined}>
        {valueDef.icon}
        {displayLabel}
      </span>
    );
  }

  // Set display name for debugging
  SchemaBadge.displayName = `${schema.domain}Badge`;

  return SchemaBadge;
}

// =============================================================================
// Hook for Dynamic Badge Rendering
// =============================================================================

/**
 * Hook to get badge styles for a schema value.
 * Useful when you need direct access to styles without rendering.
 *
 * @example
 * ```tsx
 * function CustomBadge({ type }) {
 *   const styles = useBadgeStyles(findingTypeSchema, type);
 *   return <div className={styles.classes}>{styles.label}</div>;
 * }
 * ```
 */
export function useBadgeStyles<T extends string>(
  schema: BadgeSchema<T>,
  value: T
) {
  const { isRadar } = useThemedColors();
  const theme: ThemeName = isRadar ? 'radar' : 'swiss';

  return useMemo(() => {
    const valueDef = schema.values[value] ?? schema.fallback;
    const colorClass = getBadgeColorClasses(valueDef.color, theme);

    return {
      color: valueDef.color,
      colorClasses: colorClass,
      label: valueDef.label ?? schema.labelTransform(value),
      icon: valueDef.icon,
      description: valueDef.description,
      classes: [
        'inline-flex items-center gap-1 font-semibold',
        colorClass,
        sizeClasses[schema.size],
        shapeClasses[schema.shape],
        schema.uppercase ? 'uppercase' : '',
      ].filter(Boolean).join(' '),
    };
  }, [schema, value, theme]);
}

// =============================================================================
// Pre-defined Schemas
// =============================================================================

/**
 * Finding type badge schema.
 */
export const findingTypeSchema = defineBadgeSchema({
  domain: 'findingType',
  values: {
    fact: { color: 'indigo', label: 'Fact' },
    claim: { color: 'slate', label: 'Claim' },
    event: { color: 'emerald', label: 'Event' },
    actor: { color: 'rose', label: 'Actor' },
    relationship: { color: 'amber', label: 'Relationship' },
    pattern: { color: 'cyan', label: 'Pattern' },
    gap: { color: 'violet', label: 'Gap' },
    evidence: { color: 'green', label: 'Evidence' },
  },
  fallback: { color: 'slate', label: 'Unknown' },
});

/**
 * Source type badge schema.
 */
export const sourceTypeSchema = defineBadgeSchema({
  domain: 'sourceType',
  values: {
    news: { color: 'blue', label: 'News' },
    academic: { color: 'purple', label: 'Academic' },
    government: { color: 'green', label: 'Government' },
    corporate: { color: 'slate', label: 'Corporate' },
    blog: { color: 'orange', label: 'Blog' },
    social: { color: 'pink', label: 'Social' },
    wiki: { color: 'cyan', label: 'Wiki' },
  },
  fallback: { color: 'slate', label: 'Unknown' },
});

/**
 * Priority badge schema.
 */
export const prioritySchema = defineBadgeSchema({
  domain: 'priority',
  values: {
    high: { color: 'red', label: 'High' },
    medium: { color: 'amber', label: 'Medium' },
    low: { color: 'slate', label: 'Low' },
    critical: { color: 'rose', label: 'Critical' },
    urgent: { color: 'red', label: 'Urgent' },
  },
  fallback: { color: 'slate', label: 'Normal' },
});

/**
 * Status badge schema.
 */
export const statusSchema = defineBadgeSchema({
  domain: 'status',
  values: {
    active: { color: 'blue', label: 'Active' },
    completed: { color: 'emerald', label: 'Completed' },
    searching: { color: 'amber', label: 'Searching' },
    analyzing: { color: 'purple', label: 'Analyzing' },
    paused: { color: 'slate', label: 'Paused' },
    failed: { color: 'red', label: 'Failed' },
    pending: { color: 'slate', label: 'Pending' },
  },
  fallback: { color: 'slate', label: 'Unknown' },
});

/**
 * Entity type badge schema.
 */
export const entityTypeSchema = defineBadgeSchema({
  domain: 'entityType',
  values: {
    person: { color: 'rose', label: 'Person' },
    organization: { color: 'blue', label: 'Organization' },
    location: { color: 'emerald', label: 'Location' },
    event: { color: 'amber', label: 'Event' },
    concept: { color: 'purple', label: 'Concept' },
    other: { color: 'slate', label: 'Other' },
  },
  fallback: { color: 'slate', label: 'Entity' },
});

/**
 * Confidence level badge schema (for discrete levels, not scores).
 */
export const confidenceLevelSchema = defineBadgeSchema({
  domain: 'confidenceLevel',
  shape: 'pill',
  values: {
    high: { color: 'emerald', label: 'High' },
    medium: { color: 'amber', label: 'Medium' },
    low: { color: 'red', label: 'Low' },
  },
  fallback: { color: 'slate', label: 'Unknown' },
});

// =============================================================================
// Generated Components
// =============================================================================

/**
 * Schema-driven TypeBadge component.
 */
export const SchemaTypeBadge = createBadgeComponent(findingTypeSchema);

/**
 * Schema-driven SourceTypeBadge component.
 */
export const SchemaSourceTypeBadge = createBadgeComponent(sourceTypeSchema);

/**
 * Schema-driven PriorityBadge component.
 */
export const SchemaPriorityBadge = createBadgeComponent(prioritySchema);

/**
 * Schema-driven StatusBadge component.
 */
export const SchemaStatusBadge = createBadgeComponent(statusSchema);

/**
 * Schema-driven EntityTypeBadge component.
 */
export const SchemaEntityTypeBadge = createBadgeComponent(entityTypeSchema);

/**
 * Schema-driven ConfidenceLevelBadge component.
 */
export const SchemaConfidenceLevelBadge = createBadgeComponent(confidenceLevelSchema);

// =============================================================================
// Score Badge (Special Case - Requires Numeric Input)
// =============================================================================

/**
 * Score badge props for numeric scores.
 */
export interface ScoreBadgeSchemaProps {
  /** Score as 0-1 decimal or 0-100 percentage */
  score: number;

  /** Display variant affecting low score color */
  variant?: 'confidence' | 'credibility';

  /** Override the display label */
  label?: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Schema-driven score badge for confidence/credibility scores.
 */
export function SchemaScoreBadge({
  score,
  variant = 'confidence',
  label,
  className = '',
}: ScoreBadgeSchemaProps) {
  const { isRadar } = useThemedColors();
  const theme: ThemeName = isRadar ? 'radar' : 'swiss';

  // Normalize score to percentage
  const pct = score <= 1 ? score * 100 : score;

  // Determine color based on score and variant
  let color: BadgeColor;
  if (pct >= 80) {
    color = 'emerald';
  } else if (pct >= 50) {
    color = 'amber';
  } else {
    color = variant === 'credibility' ? 'red' : 'slate';
  }

  const colorClass = getBadgeColorClasses(color, theme);
  const displayLabel = label ?? `${Math.round(pct)}%`;

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
}

// =============================================================================
// Registry for Dynamic Schema Lookup
// =============================================================================

/**
 * Registry of all defined badge schemas.
 * Enables dynamic schema lookup by domain name.
 */
export const badgeSchemaRegistry: Record<string, BadgeSchema<string>> = {
  findingType: findingTypeSchema,
  sourceType: sourceTypeSchema,
  priority: prioritySchema,
  status: statusSchema,
  entityType: entityTypeSchema,
  confidenceLevel: confidenceLevelSchema,
};

/**
 * Get a schema by domain name.
 */
export function getSchemaByDomain(domain: string): BadgeSchema<string> | undefined {
  return badgeSchemaRegistry[domain];
}

/**
 * Register a custom schema.
 */
export function registerBadgeSchema<T extends string>(schema: BadgeSchema<T>): void {
  badgeSchemaRegistry[schema.domain] = schema as BadgeSchema<string>;
}

// =============================================================================
// Universal Badge Component
// =============================================================================

/**
 * Universal badge that can render any registered schema.
 */
export interface UniversalBadgeProps {
  /** Schema domain name */
  domain: string;

  /** Value to display */
  value: string;

  /** Override label */
  label?: string;

  /** Additional classes */
  className?: string;
}

/**
 * Universal badge component that looks up schema by domain.
 */
export function UniversalBadge({
  domain,
  value,
  label,
  className = '',
}: UniversalBadgeProps) {
  const { isRadar } = useThemedColors();
  const theme: ThemeName = isRadar ? 'radar' : 'swiss';

  const schema = badgeSchemaRegistry[domain];
  if (!schema) {
    // Fallback for unknown domain
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 ${className}`}>
        {label ?? value}
      </span>
    );
  }

  const valueDef = schema.values[value] ?? schema.fallback;
  const displayLabel = label ?? valueDef.label ?? schema.labelTransform(value);
  const colorClass = getBadgeColorClasses(valueDef.color, theme);

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${colorClass} ${sizeClasses[schema.size]} ${shapeClasses[schema.shape]} ${schema.uppercase ? 'uppercase' : ''} ${className}`}
      title={valueDef.description || undefined}
    >
      {valueDef.icon}
      {displayLabel}
    </span>
  );
}
