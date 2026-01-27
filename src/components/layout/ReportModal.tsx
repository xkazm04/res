'use client';

import { useEffect, useCallback } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/src/stores/appStore';
import { SwissIconButton } from '@/src/components/swiss';
import { LoadingProgress } from '@/src/components/swiss/SwissProgress';

export function ReportModal() {
  const {
    currentSession,
    currentSessionLoading,
    currentSessionError,
    isReportModalOpen,
    closeReportModal,
  } = useAppStore();

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeReportModal();
    }
  }, [closeReportModal]);

  useEffect(() => {
    if (isReportModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isReportModalOpen, handleEscape]);

  if (!isReportModalOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="modal-overlay animate-fade-in"
        onClick={closeReportModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="modal-content animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
          <SwissIconButton
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={closeReportModal}
            aria-label="Close report"
            variant="ghost"
          />
          <span className="text-sm text-[var(--warm-gray-500)]">Back to map</span>

          <div className="ml-auto">
            <SwissIconButton
              icon={<X className="w-5 h-5" />}
              onClick={closeReportModal}
              aria-label="Close"
              variant="ghost"
            />
          </div>
        </div>

        {/* Loading state */}
        {currentSessionLoading && (
          <div className="p-8">
            <LoadingProgress className="mb-4" />
            <div className="text-center">
              <p className="text-secondary">Loading research report...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {currentSessionError && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--red-light)] flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-[var(--red-primary)]" />
            </div>
            <h3 className="text-headline text-lg mb-2">Failed to Load Report</h3>
            <p className="text-secondary">{currentSessionError}</p>
          </div>
        )}

        {/* Report content */}
        {currentSession && !currentSessionLoading && (
          <div className="p-8 text-center text-secondary">
            <p>Research detail view coming soon</p>
            <p className="text-sm mt-2">Session: {currentSession.id}</p>
          </div>
        )}
      </div>
    </>
  );
}
