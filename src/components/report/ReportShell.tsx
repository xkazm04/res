'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode, useId } from 'react';
import { useReportTheme, useThemeStyles } from './core/ThemeContext';
import { useFocusTrap } from '@/src/hooks/useFocusTrap';
import { useShell, type ShellRequirements } from '@/src/lib/shell';

interface ReportShellProps {
  children: ReactNode;
  onClose: () => void;
  /** ID for aria-labelledby reference (optional) */
  titleId?: string;
}

/**
 * Default shell requirements for report viewing.
 * Content can override these by using the useShell hook.
 */
export const REPORT_SHELL_REQUIREMENTS: ShellRequirements = {
  backdrop: { enabled: true, blur: 8, opacity: 0.5, closeOnClick: true },
  animation: 'scale',
  keyboard: { escapeToClose: true, focusTrap: true, autoFocus: true },
  scroll: { lockBody: true },
  size: { width: 'full', height: 'full', padding: 'none' },
  theme: { radius: '2xl', shadow: 'xl', border: true },
  role: 'dialog',
  zIndex: 'modal',
  ariaLabel: 'Research Intelligence Report',
};

export function ReportShell({ children, onClose, titleId }: ReportShellProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const generatedTitleId = useId();
  const dialogTitleId = titleId || `report-dialog-${generatedTitleId}`;

  // Use shell protocol - content can update requirements dynamically
  // This enables the same ReportShell to be rendered in different containers
  useShell({
    requirements: REPORT_SHELL_REQUIREMENTS,
    onClose,
  });

  // Focus trap for accessibility - contains tab navigation within modal
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ enabled: true });

  // Note: Escape key handling is centralized in ReportModal.tsx to avoid duplicate listeners

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex"
        role="presentation"
      >
        {/* Backdrop - staged cinematic reveal: fade → blur → content */}
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{
            opacity: 1,
            backdropFilter: 'blur(8px)',
          }}
          transition={{
            opacity: { duration: 0.15, ease: 'easeOut' },
            backdropFilter: { duration: 0.2, delay: 0.15, ease: 'easeOut' },
          }}
          className={`absolute inset-0 ${theme === 'radar' ? 'bg-black/50' : 'bg-stone-900/50'}`}
          style={{ WebkitBackdropFilter: 'blur(8px)' }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Dialog content with focus trap and ARIA attributes - scales in after backdrop blur */}
        <motion.div
          ref={focusTrapRef}
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            damping: 28,
            stiffness: 350,
            delay: 0.35, // Wait for backdrop fade (150ms) + blur (200ms)
          }}
          className={`relative z-10 flex flex-1 m-4 rounded-2xl overflow-hidden ${styles.bgCard} ${styles.border} border`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          tabIndex={-1}
        >
          {/* Hidden title for screen readers only when no visible title ID is provided */}
          {!titleId && <span id={dialogTitleId} className="sr-only">Research Intelligence Report</span>}
          {theme === 'radar' && <RadarAmbience />}
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Ambient effects for Radar theme
function RadarAmbience() {
  return (
    <>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0.3 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-500/30 rounded-br-2xl pointer-events-none" />
    </>
  );
}
