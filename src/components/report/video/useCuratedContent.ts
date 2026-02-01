'use client';

import { useState, useCallback } from 'react';
import type { SessionWithDetails } from '@/src/types/research';
import type { VideoContentSelection, ContentSelectionState } from './useContentSelection';
import type { VideoOverviewContent, CuratedVideoContent, CurationRequest } from './contentTransformer';
import { buildCurationRequest, transformCuratedToContent, transformSelectionToContent } from './contentTransformer';

export type CurationStatus = 'idle' | 'curating' | 'success' | 'error';

export interface UseCuratedContentReturn {
  status: CurationStatus;
  curatedContent: VideoOverviewContent | null;
  error: string | null;
  /** Curate content using LLM */
  curate: () => Promise<void>;
  /** Quick transform without LLM */
  quickTransform: () => void;
  /** Reset to initial state */
  reset: () => void;
}

interface UseCuratedContentOptions {
  session: SessionWithDetails;
  selectionState: ContentSelectionState;
  baseStats: VideoOverviewContent['stats'];
}

export function useCuratedContent({
  session,
  selectionState,
  baseStats,
}: UseCuratedContentOptions): UseCuratedContentReturn {
  const [status, setStatus] = useState<CurationStatus>('idle');
  const [curatedContent, setCuratedContent] = useState<VideoOverviewContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quick transform without LLM (existing behavior)
  const quickTransform = useCallback(() => {
    const content = transformSelectionToContent(session, selectionState.selection);
    setCuratedContent(content);
    setStatus('success');
    setError(null);
  }, [session, selectionState.selection]);

  // Curate content using LLM
  const curate = useCallback(async () => {
    try {
      setStatus('curating');
      setError(null);

      // Build the curation request
      const request = buildCurationRequest(
        session,
        selectionState.selection,
        selectionState.availableItems
      );

      // Check if there are items with section assignments
      if (request.items.length === 0) {
        // Fall back to quick transform if no section assignments
        quickTransform();
        return;
      }

      // Call the curation API
      const response = await fetch('/api/video/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Curation failed: ${response.status}`);
      }

      const curated: CuratedVideoContent = await response.json();

      // Transform curated content to VideoOverviewContent
      const content = transformCuratedToContent(curated, baseStats);
      setCuratedContent(content);
      setStatus('success');
    } catch (err) {
      console.error('[Curate] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');

      // Fall back to quick transform on error
      quickTransform();
    }
  }, [session, selectionState, baseStats, quickTransform]);

  // Reset state
  const reset = useCallback(() => {
    setStatus('idle');
    setCuratedContent(null);
    setError(null);
  }, []);

  return {
    status,
    curatedContent,
    error,
    curate,
    quickTransform,
    reset,
  };
}
