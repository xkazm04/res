'use client';

import { FolderSearch, RefreshCw } from 'lucide-react';
import { SwissButton } from '@/src/components/swiss';

interface MapEmptyStateProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function MapEmptyState({ onRefresh, isLoading }: MapEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
        <FolderSearch className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
      <h3 className="text-headline text-lg mb-2">No Research Sessions</h3>
      <p className="text-secondary max-w-sm mb-6">
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
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="w-12 h-12 border-4 border-[var(--bg-secondary)] border-t-[var(--accent-info)] rounded-full animate-spin mb-4" />
      <p className="text-secondary">Loading research sessions...</p>
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
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
      <div className="w-16 h-16 rounded-full bg-[var(--red-light)] flex items-center justify-center mb-4">
        <span className="text-2xl">!</span>
      </div>
      <h3 className="text-headline text-lg mb-2">Failed to Load</h3>
      <p className="text-secondary max-w-sm mb-6">{error}</p>
      {onRetry && (
        <SwissButton variant="secondary" onClick={onRetry}>
          Try Again
        </SwissButton>
      )}
    </div>
  );
}
