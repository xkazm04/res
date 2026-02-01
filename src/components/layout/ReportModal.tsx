'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/src/stores/appStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { ReportView } from '@/src/components/report/ReportView';

export function ReportModal() {
  const { theme } = useThemeStore();
  const {
    currentSession,
    currentSessionLoading,
    currentSessionError,
    isReportModalOpen,
    closeReportModal,
    clearCurrentSession,
  } = useAppStore();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReportModalOpen) {
        closeReportModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isReportModalOpen, closeReportModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isReportModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isReportModalOpen]);

  if (!isReportModalOpen) return null;

  const isRadar = theme === 'radar';
  const bgClass = isRadar ? 'bg-slate-950/95' : 'bg-stone-100/95';
  const cardClass = isRadar ? 'bg-slate-900 border-cyan-500/20' : 'bg-white border-stone-200';
  const textClass = isRadar ? 'text-slate-100' : 'text-stone-800';
  const mutedClass = isRadar ? 'text-slate-400' : 'text-stone-600';

  // Loading state
  if (currentSessionLoading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${bgClass}`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl p-8 border ${cardClass}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 border-2 ${isRadar ? 'border-cyan-400 border-t-transparent' : 'border-stone-800 border-t-transparent'} rounded-full animate-spin`} />
              <div>
                <div className={`font-medium ${textClass}`}>Loading Intelligence</div>
                <div className={`text-sm ${mutedClass}`}>Retrieving research data...</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Error state
  if (currentSessionError) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${bgClass}`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl p-8 max-w-md border ${cardClass}`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full ${isRadar ? 'bg-rose-500/20' : 'bg-rose-100'} flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${isRadar ? 'text-rose-400' : 'text-rose-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${textClass}`}>Failed to Load</h3>
              <p className={`text-sm mb-4 ${mutedClass}`}>{currentSessionError}</p>
              <button
                onClick={() => { clearCurrentSession(); closeReportModal(); }}
                className={`px-4 py-2 rounded-lg transition-colors ${isRadar ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30' : 'bg-stone-800 text-white hover:bg-stone-700'}`}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!currentSession) return null;

  return (
    <ReportView
      session={currentSession}
      onClose={closeReportModal}
      theme={theme}
    />
  );
}
