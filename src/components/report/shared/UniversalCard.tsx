'use client';

import { useState, forwardRef, type ReactNode, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemedColors, type AlertVariant } from './themeColors';
import { ChevronRightIcon } from './Icons';

/**
 * UniversalCard - A composable card component with pluggable slots
 *
 * Replaces: FindingCard, EntityCard, ContradictionCard, GapCard,
 * CausalChainCard, PerspectiveCard with a single flexible component.
 *
 * Features:
 * - Header with badges and metadata
 * - Expandable/collapsible body
 * - Optional sub-items list
 * - Theme-aware (swiss/radar)
 * - Keyboard navigation support
 * - Focus state handling
 */

// =============================================================================
// Types
// =============================================================================

export type CardVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export interface UniversalCardProps {
  /** Unique identifier for the card */
  id?: string;

  /** Card color variant */
  variant?: CardVariant;

  /** Custom background/border colors (overrides variant) */
  colorScheme?: {
    bg: string;
    border: string;
    headerBg?: string;
  };

  /** Whether the card is currently focused (for keyboard navigation) */
  isFocused?: boolean;

  /** Whether the card body is expanded */
  isExpanded?: boolean;

  /** Called when card focus changes */
  onFocus?: () => void;

  /** Called when expand/collapse is toggled */
  onToggleExpanded?: () => void;

  /** Disable expand/collapse functionality */
  disableExpand?: boolean;

  /** Start expanded by default (only used if isExpanded is not controlled) */
  defaultExpanded?: boolean;

  /** Header slot - primary content shown in collapsed state */
  header: ReactNode;

  /** Badges slot - displayed in header next to chevron */
  badges?: ReactNode;

  /** Actions slot - displayed at end of header row */
  actions?: ReactNode;

  /** Body slot - expandable content area */
  body?: ReactNode;

  /** Footer slot - always visible at bottom */
  footer?: ReactNode;

  /** Sub-items slot - list of child items */
  subItems?: ReactNode;

  /** Additional className for the container */
  className?: string;

  /** Whether to show chevron for expand/collapse */
  showChevron?: boolean;

  /** Click handler for the entire card */
  onClick?: (e: MouseEvent) => void;
}

// =============================================================================
// Variant Color Mappings
// =============================================================================

const variantColors: Record<
  CardVariant,
  { swiss: { bg: string; border: string; headerBg: string }; radar: { bg: string; border: string; headerBg: string } }
> = {
  default: {
    swiss: { bg: 'bg-white', border: 'border-slate-200', headerBg: 'bg-slate-50/50 hover:bg-slate-50' },
    radar: { bg: 'bg-slate-900/60', border: 'border-slate-700', headerBg: 'bg-slate-800/50 hover:bg-slate-800' },
  },
  info: {
    swiss: { bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-100/50 hover:bg-blue-100' },
    radar: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', headerBg: 'bg-blue-500/20 hover:bg-blue-500/30' },
  },
  success: {
    swiss: { bg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-emerald-100/50 hover:bg-emerald-100' },
    radar: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', headerBg: 'bg-emerald-500/20 hover:bg-emerald-500/30' },
  },
  warning: {
    swiss: { bg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-amber-100/50 hover:bg-amber-100' },
    radar: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', headerBg: 'bg-amber-500/20 hover:bg-amber-500/30' },
  },
  danger: {
    swiss: { bg: 'bg-red-50', border: 'border-red-200', headerBg: 'bg-red-100/50 hover:bg-red-100' },
    radar: { bg: 'bg-red-500/10', border: 'border-red-500/30', headerBg: 'bg-red-500/20 hover:bg-red-500/30' },
  },
};

// Focus ring colors by variant
const focusRingColors: Record<CardVariant, string> = {
  default: 'ring-blue-100 border-blue-400',
  info: 'ring-blue-200 border-blue-400',
  success: 'ring-emerald-200 border-emerald-400',
  warning: 'ring-amber-200 border-amber-400',
  danger: 'ring-red-200 border-red-400',
};

// =============================================================================
// Component
// =============================================================================

export const UniversalCard = forwardRef<HTMLDivElement, UniversalCardProps>(function UniversalCard(
  {
    id,
    variant = 'default',
    colorScheme,
    isFocused = false,
    isExpanded: controlledExpanded,
    onFocus,
    onToggleExpanded,
    disableExpand = false,
    defaultExpanded = false,
    header,
    badges,
    actions,
    body,
    footer,
    subItems,
    className = '',
    showChevron = true,
    onClick,
  },
  ref
) {
  const { isRadar } = useThemedColors();

  // Internal expanded state (used when not controlled)
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  // Get colors from variant or custom colorScheme
  const colors = colorScheme || variantColors[variant][isRadar ? 'radar' : 'swiss'];

  const handleToggleExpand = (e: MouseEvent) => {
    e.stopPropagation();
    if (disableExpand) return;

    if (isControlled && onToggleExpanded) {
      onToggleExpanded();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const handleCardClick = (e: MouseEvent) => {
    onFocus?.();
    onClick?.(e);
  };

  const hasExpandableContent = body || subItems;
  const canExpand = !disableExpand && hasExpandableContent;

  return (
    <div
      ref={ref}
      id={id}
      className={`
        border rounded-lg overflow-hidden transition-all
        ${colors.bg} ${colors.border}
        ${isFocused ? `ring-2 shadow-sm ${focusRingColors[variant]}` : ''}
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Header Row */}
      <div
        className={`
          flex items-center gap-3 px-4 py-3 transition-colors
          ${canExpand ? 'cursor-pointer' : ''}
          ${colors.headerBg || ''}
        `}
        onClick={canExpand ? handleToggleExpand : undefined}
      >
        {/* Chevron (expand indicator) */}
        {showChevron && canExpand && (
          <span
            className={`
              w-5 h-5 flex-shrink-0 transition-transform
              ${isFocused ? (isRadar ? 'text-blue-400' : 'text-blue-500') : (isRadar ? 'text-slate-400' : 'text-slate-400')}
              ${expanded ? 'rotate-90' : ''}
            `}
          >
            <ChevronRightIcon />
          </span>
        )}

        {/* Badges */}
        {badges && <div className="flex items-center gap-2 flex-shrink-0">{badges}</div>}

        {/* Header content */}
        <div className="flex-1 min-w-0">{header}</div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      {/* Expandable Body */}
      <AnimatePresence initial={false}>
        {expanded && hasExpandableContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Body Content */}
            {body && (
              <div className={`px-4 py-3 border-t ${isRadar ? 'border-slate-700' : 'border-slate-100'}`}>
                {body}
              </div>
            )}

            {/* Sub-items */}
            {subItems && (
              <div className={`px-4 py-2 border-t ${isRadar ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                {subItems}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer (always visible) */}
      {footer && (
        <div className={`px-4 py-2 border-t ${isRadar ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
          {footer}
        </div>
      )}
    </div>
  );
});

// =============================================================================
// Preset Variants for Common Card Types
// =============================================================================

/**
 * Pre-configured card for findings with appropriate styling
 */
export function FindingCardWrapper({
  children,
  ...props
}: Omit<UniversalCardProps, 'variant'> & { children?: ReactNode }) {
  return <UniversalCard variant="default" {...props} />;
}

/**
 * Pre-configured card for contradictions (danger variant)
 */
export function ContradictionCardWrapper(props: Omit<UniversalCardProps, 'variant'>) {
  return <UniversalCard variant="danger" {...props} />;
}

/**
 * Pre-configured card for research gaps (info variant)
 */
export function GapCardWrapper(props: Omit<UniversalCardProps, 'variant'>) {
  return (
    <UniversalCard
      variant="default"
      colorScheme={{
        bg: props.colorScheme?.bg || 'bg-violet-50',
        border: props.colorScheme?.border || 'border-violet-200',
        headerBg: 'bg-violet-100/50 hover:bg-violet-100',
      }}
      {...props}
    />
  );
}

/**
 * Pre-configured card for causal chains (info variant)
 */
export function CausalChainCardWrapper(props: Omit<UniversalCardProps, 'variant'>) {
  return <UniversalCard variant="info" {...props} />;
}

/**
 * Pre-configured card for entities
 */
export function EntityCardWrapper(props: Omit<UniversalCardProps, 'variant'>) {
  return <UniversalCard variant="default" disableExpand showChevron={false} {...props} />;
}

/**
 * Pre-configured card for perspectives with custom color scheme support
 */
export function PerspectiveCardWrapper({
  perspectiveType,
  ...props
}: Omit<UniversalCardProps, 'variant' | 'colorScheme'> & { perspectiveType: string }) {
  const colorMap: Record<string, { bg: string; border: string; headerBg: string }> = {
    financial: { bg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-emerald-100/50' },
    investigative: { bg: 'bg-rose-50', border: 'border-rose-200', headerBg: 'bg-rose-100/50' },
    strategic: { bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-100/50' },
    competitive: { bg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-amber-100/50' },
    technical: { bg: 'bg-indigo-50', border: 'border-indigo-200', headerBg: 'bg-indigo-100/50' },
    legal: { bg: 'bg-slate-50', border: 'border-slate-200', headerBg: 'bg-slate-100/50' },
  };

  const colors = colorMap[perspectiveType] || colorMap.legal;

  return <UniversalCard variant="default" colorScheme={colors} {...props} />;
}

// =============================================================================
// Sub-components for common patterns
// =============================================================================

/**
 * Badge row component for displaying multiple badges in header
 */
export function CardBadgeRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center gap-2 ${className}`}>{children}</div>;
}

/**
 * Meta row for displaying metadata (timestamps, counts, etc.)
 */
export function CardMetaRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { isRadar } = useThemedColors();
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${isRadar ? 'text-slate-400' : 'text-slate-500'} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Extracted data panel (for findings with structured data)
 */
export function CardDataPanel({
  title,
  children,
  variant = 'info',
  className = '',
}: {
  title: string;
  children: ReactNode;
  variant?: 'info' | 'warning' | 'success';
  className?: string;
}) {
  const { isRadar } = useThemedColors();

  const colors = {
    info: isRadar ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600',
    warning: isRadar ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-600',
    success: isRadar ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600',
  };

  return (
    <div className={`border rounded-md p-3 ${colors[variant]} ${className}`}>
      <div className="text-[10px] font-semibold uppercase mb-2">{title}</div>
      {children}
    </div>
  );
}

/**
 * Sources panel (for findings with supporting sources)
 */
export function CardSourcesPanel({
  title = 'Sources',
  count,
  children,
  className = '',
}: {
  title?: string;
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  const { isRadar } = useThemedColors();

  return (
    <div
      className={`
        rounded-md p-3 border-l-3
        ${isRadar ? 'bg-slate-800 border-blue-500' : 'bg-slate-50 border-blue-400'}
        ${className}
      `}
    >
      <div className={`text-[10px] font-semibold uppercase mb-2 flex items-center gap-1 ${isRadar ? 'text-blue-400' : 'text-blue-600'}`}>
        {title}
        {count !== undefined && ` (${count})`}
      </div>
      {children}
    </div>
  );
}

/**
 * Conflict display for contradictions (Claim A vs Claim B)
 */
export function CardConflictDisplay({
  claimA,
  claimASource,
  claimB,
  claimBSource,
  className = '',
}: {
  claimA: string;
  claimASource?: string;
  claimB: string;
  claimBSource?: string;
  className?: string;
}) {
  const { isRadar } = useThemedColors();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`p-2 rounded border ${isRadar ? 'bg-slate-800 border-red-500/30' : 'bg-white border-red-100'}`}>
        <div className={`text-[10px] mb-1 ${isRadar ? 'text-red-400' : 'text-red-500'}`}>Claim A</div>
        <p className={`text-sm ${isRadar ? 'text-slate-200' : 'text-slate-700'}`}>{claimA}</p>
        {claimASource && <p className={`text-[10px] mt-1 ${isRadar ? 'text-slate-500' : 'text-slate-500'}`}>Source: {claimASource}</p>}
      </div>

      <div className={`flex justify-center text-xs ${isRadar ? 'text-red-400' : 'text-red-400'}`}>VS</div>

      <div className={`p-2 rounded border ${isRadar ? 'bg-slate-800 border-red-500/30' : 'bg-white border-red-100'}`}>
        <div className={`text-[10px] mb-1 ${isRadar ? 'text-red-400' : 'text-red-500'}`}>Claim B</div>
        <p className={`text-sm ${isRadar ? 'text-slate-200' : 'text-slate-700'}`}>{claimB}</p>
        {claimBSource && <p className={`text-[10px] mt-1 ${isRadar ? 'text-slate-500' : 'text-slate-500'}`}>Source: {claimBSource}</p>}
      </div>
    </div>
  );
}

/**
 * Horizontal chain visualization for causal chains
 */
export function CardChainDisplay({
  steps,
  className = '',
}: {
  steps: string[];
  className?: string;
}) {
  const { isRadar } = useThemedColors();

  if (steps.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Connecting line */}
      {steps.length > 1 && (
        <div className={`absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 ${isRadar ? 'bg-blue-500/30' : 'bg-blue-300'}`} />
      )}

      {/* Steps */}
      <div className="relative z-10 flex flex-wrap items-center gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full ring-2 ${isRadar ? 'bg-blue-400 ring-blue-500/30' : 'bg-blue-500 ring-blue-100'}`} />
              <div
                className={`
                  px-2 py-1 rounded border text-xs shadow-sm
                  ${isRadar ? 'bg-slate-800 border-blue-500/30 text-slate-200' : 'bg-white border-blue-200 text-slate-700'}
                `}
              >
                {step}
              </div>
            </div>

            {/* Arrow between steps */}
            {i < steps.length - 1 && (
              <div className="flex items-center">
                <div className={`w-6 h-0.5 ${isRadar ? 'bg-blue-500/30' : 'bg-blue-300'}`} />
                <div
                  className={`
                    w-0 h-0
                    border-t-[4px] border-t-transparent
                    border-b-[4px] border-b-transparent
                    border-l-[6px] ${isRadar ? 'border-l-blue-500' : 'border-l-blue-400'}
                  `}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Insights/Warnings/Recommendations list for perspectives
 */
export function CardInsightsList({
  title,
  items,
  icon,
  variant = 'default',
  maxItems = 4,
  className = '',
}: {
  title: string;
  items: string[];
  icon?: ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'default';
  maxItems?: number;
  className?: string;
}) {
  const { isRadar } = useThemedColors();

  const colors = {
    success: {
      title: isRadar ? 'text-emerald-400' : 'text-emerald-600',
      border: isRadar ? 'border-emerald-500' : 'border-emerald-300',
      bg: '',
    },
    warning: {
      title: isRadar ? 'text-amber-400' : 'text-amber-600',
      border: '',
      bg: isRadar ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-800',
    },
    info: {
      title: isRadar ? 'text-blue-400' : 'text-blue-600',
      border: '',
      bg: isRadar ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-slate-700',
    },
    default: {
      title: isRadar ? 'text-slate-400' : 'text-slate-600',
      border: isRadar ? 'border-slate-600' : 'border-slate-300',
      bg: '',
    },
  };

  const style = colors[variant];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`text-[10px] font-semibold uppercase flex items-center gap-1 ${style.title}`}>
        {icon && <span className="w-3 h-3">{icon}</span>}
        {title}
      </div>
      {items.slice(0, maxItems).map((item, i) => (
        <div
          key={i}
          className={`
            text-xs py-1
            ${style.border ? `pl-3 border-l-2 ${style.border}` : ''}
            ${style.bg ? `rounded px-2 ${style.bg}` : (isRadar ? 'text-slate-300' : 'text-slate-700')}
          `}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
