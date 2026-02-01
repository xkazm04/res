'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { type AnalystPersona, type AnalystRole, analystPersonas, viewToRole } from './analystPersonas';

interface ViewHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional right-side content (e.g., toggle buttons, filters) */
  actions?: ReactNode;
  /** Optional count badge */
  count?: number;
  /** Analyst persona role - pass role name or true to auto-detect from title */
  persona?: AnalystRole | boolean;
}

/**
 * Standardized header component for all report views.
 * Provides consistent typography hierarchy across the application.
 * Optionally displays an analyst persona with their role and priorities.
 */
export function ViewHeader({ title, subtitle, actions, count, persona }: ViewHeaderProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const [showPersonaDetails, setShowPersonaDetails] = useState(false);

  // Resolve persona - auto-detect from title if true, or use provided role
  const resolvedPersona: AnalystPersona | null = persona
    ? typeof persona === 'boolean'
      ? analystPersonas[viewToRole[title.toLowerCase()] as AnalystRole] || null
      : analystPersonas[persona]
    : null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Persona icon/badge */}
          {resolvedPersona && (
            <button
              onClick={() => setShowPersonaDetails(!showPersonaDetails)}
              className={`group relative flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
                isRadar
                  ? `bg-gradient-to-r ${resolvedPersona.gradientRadar} border border-${resolvedPersona.accentColor}-500/30 hover:border-${resolvedPersona.accentColor}-400/50`
                  : `bg-gradient-to-r ${resolvedPersona.gradientSwiss} border border-stone-200 hover:border-stone-400`
              }`}
              title={`${resolvedPersona.title}: ${resolvedPersona.description}`}
            >
              <span className="text-lg">{resolvedPersona.icon}</span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                {resolvedPersona.title}
              </span>
              <svg
                className={`w-3 h-3 transition-transform ${showPersonaDetails ? 'rotate-180' : ''} ${styles.textMuted}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          <div>
            <h2 className={`text-lg font-semibold ${styles.text}`}>
              {title}
              {count !== undefined && (
                <span className={`ml-2 text-sm font-normal ${styles.textMuted}`}>
                  ({count})
                </span>
              )}
            </h2>
            {subtitle && (
              <p className={`text-sm mt-0.5 ${styles.textMuted}`}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Expandable persona details */}
      <AnimatePresence>
        {resolvedPersona && showPersonaDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`mt-3 p-3 rounded-lg ${
              isRadar
                ? `bg-gradient-to-r ${resolvedPersona.gradientRadar} border border-${resolvedPersona.accentColor}-500/20`
                : `bg-gradient-to-r ${resolvedPersona.gradientSwiss} border border-stone-200`
            }`}>
              <p className={`text-sm mb-3 ${styles.text}`}>{resolvedPersona.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priorities */}
                <div>
                  <h4 className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${styles.textMuted}`}>
                    Priorities
                  </h4>
                  <ul className="space-y-1">
                    {resolvedPersona.priorities.map((priority, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2 ${styles.text}`}>
                        <span className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-${resolvedPersona.accentColor}-500`} />
                        {priority}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Questions */}
                <div>
                  <h4 className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${styles.textMuted}`}>
                    Key Questions
                  </h4>
                  <ul className="space-y-1">
                    {resolvedPersona.keyQuestions.map((question, i) => (
                      <li key={i} className={`text-xs italic ${styles.textMuted}`}>
                        "{question}"
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional count badge */
  count?: number;
  /** Smaller than ViewHeader, used for subsections */
  size?: 'default' | 'small';
}

/**
 * Smaller header for subsections within views.
 */
export function SectionHeader({ title, count, size = 'default' }: SectionHeaderProps) {
  const styles = useThemeStyles();

  const sizeClasses = {
    default: 'text-base font-semibold mb-3',
    small: 'text-sm font-medium mb-2',
  };

  return (
    <h3 className={`${sizeClasses[size]} ${styles.text}`}>
      {title}
      {count !== undefined && (
        <span className={`ml-2 text-xs font-normal ${styles.textMuted}`}>
          ({count})
        </span>
      )}
    </h3>
  );
}
