'use client';

import { type ReactNode, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { useSectionCollapse } from '@/src/hooks/useSectionCollapse';

interface CollapsibleSectionProps {
  /** Unique identifier for this section (used for localStorage persistence) */
  sectionId: string;
  /** Section title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional count badge */
  count?: number;
  /** Optional icon (emoji or ReactNode) */
  icon?: ReactNode;
  /** Children content to show when expanded */
  children: ReactNode;
  /** Default collapsed state (default: false = expanded) */
  defaultCollapsed?: boolean;
  /** Optional right-side header actions */
  headerActions?: ReactNode;
  /** Visual style variant */
  variant?: 'default' | 'card' | 'minimal';
  /** Optional className for outer container */
  className?: string;
}

/**
 * Collapsible section component with localStorage persistence.
 * Use within a SectionCollapseProvider for global expand/collapse controls.
 */
export function CollapsibleSection({
  sectionId,
  title,
  subtitle,
  count,
  icon,
  children,
  defaultCollapsed = false,
  headerActions,
  variant = 'default',
  className = '',
}: CollapsibleSectionProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const { isCollapsed, toggle } = useSectionCollapse(sectionId, defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);

  // Variant-specific styles
  const variantStyles = {
    default: {
      container: isRadar
        ? 'bg-slate-900/40 border border-cyan-500/10 rounded-xl'
        : 'bg-stone-50 border border-stone-200 rounded-xl',
      header: isRadar
        ? 'hover:bg-slate-800/50'
        : 'hover:bg-stone-100',
    },
    card: {
      container: isRadar
        ? 'bg-slate-900/60 border border-cyan-500/20 rounded-xl shadow-lg'
        : 'bg-white border border-stone-200 rounded-xl shadow-md',
      header: isRadar
        ? 'hover:bg-slate-800/30'
        : 'hover:bg-stone-50',
    },
    minimal: {
      container: 'border-b ' + (isRadar ? 'border-cyan-500/10' : 'border-stone-200'),
      header: isRadar
        ? 'hover:bg-slate-900/30'
        : 'hover:bg-stone-50',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className={`${currentVariant.container} ${className}`} data-testid={`collapsible-section-${sectionId}`}>
      {/* Header */}
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-3 p-4 transition-colors ${currentVariant.header} ${variant !== 'minimal' ? 'rounded-t-xl' : ''}`}
        aria-expanded={!isCollapsed}
        aria-controls={`section-content-${sectionId}`}
        data-testid={`collapsible-section-toggle-${sectionId}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Chevron indicator */}
          <motion.span
            animate={{ rotate: isCollapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
            className={`flex-shrink-0 ${styles.textMuted}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.span>

          {/* Icon */}
          {icon && (
            <span className="flex-shrink-0 text-lg">{icon}</span>
          )}

          {/* Title and subtitle */}
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-sm ${styles.text} truncate`}>{title}</h3>
              {count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isRadar ? 'bg-cyan-500/20 text-cyan-300' : 'bg-stone-200 text-stone-600'
                }`}>
                  {count}
                </span>
              )}
            </div>
            {subtitle && (
              <p className={`text-xs ${styles.textMuted} truncate`}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side: actions + collapse indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerActions && (
            <div onClick={e => e.stopPropagation()}>
              {headerActions}
            </div>
          )}
          <span className={`text-[10px] uppercase tracking-wider ${styles.textMuted}`}>
            {isCollapsed ? 'Show' : 'Hide'}
          </span>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            id={`section-content-${sectionId}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div ref={contentRef} className={`p-4 pt-0 ${variant === 'minimal' ? 'pb-4' : ''}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SectionGroupProps {
  /** Children sections */
  children: ReactNode;
  /** Optional className */
  className?: string;
}

/**
 * Container for grouping multiple collapsible sections with consistent spacing
 */
export function SectionGroup({ children, className = '' }: SectionGroupProps) {
  return (
    <div className={`space-y-4 ${className}`} data-testid="collapsible-section-group">
      {children}
    </div>
  );
}
