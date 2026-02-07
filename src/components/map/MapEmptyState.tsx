'use client';

import { FolderSearch, RefreshCw } from 'lucide-react';
import { SwissButton } from '@/src/components/swiss';

interface MapEmptyStateProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function MapEmptyState({ onRefresh, isLoading }: MapEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 hover:scale-105">
        <FolderSearch className="w-8 h-8 text-[var(--text-muted)] transition-colors duration-200" />
      </div>
      <h3 className="text-headline text-lg mb-2 tracking-tight">No Research Sessions</h3>
      <p className="text-secondary max-w-sm mb-6 leading-relaxed">
        Start by running a research query to see your sessions visualized here.
        Each research session will appear as a card in the map.
      </p>
      {onRefresh && (
        <SwissButton
          variant="secondary"
          onClick={onRefresh}
          loading={isLoading}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </SwissButton>
      )}
    </div>
  );
}

// Loading state
export function MapLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-in fade-in duration-300">
      <div className="w-12 h-12 border-4 border-[var(--bg-secondary)] border-t-[var(--accent-info)] rounded-full animate-spin mb-4 shadow-md" />
      <p className="text-secondary animate-pulse">Loading research sessions...</p>
    </div>
  );
}

// Error state
interface MapErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function MapErrorState({ error, onRetry }: MapErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-[var(--red-light)] flex items-center justify-center mb-4 shadow-md animate-in zoom-in duration-200">
        <span className="text-2xl font-semibold text-[var(--red-text)]">!</span>
      </div>
      <h3 className="text-headline text-lg mb-2 tracking-tight">Failed to Load</h3>
      <p className="text-secondary max-w-sm mb-6 leading-relaxed">{error}</p>
      {onRetry && (
        <SwissButton variant="secondary" onClick={onRetry}>
          Try Again
        </SwissButton>
      )}
    </div>
  );
}
