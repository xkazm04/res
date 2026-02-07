'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { VideoDraft } from '@/src/types/research';
import type { ContentSelectionState, VideoContentSelection } from '@/src/components/report/video/useContentSelection';

export type DraftMode = 'original' | 'draft';

export interface VideoDraftState {
  draft: VideoDraft | null;
  mode: DraftMode;
  hasDraft: boolean;
  isSaving: boolean;
  isLoading: boolean;
  switchToOriginal: () => void;
  switchToDraft: () => void;
  autoSave: () => Promise<void>;
}

export function useVideoDrafts(
  sessionId: string | null,
  selectionState: ContentSelectionState | null
): VideoDraftState {
  const [draft, setDraft] = useState<VideoDraft | null>(null);
  const [mode, setMode] = useState<DraftMode>('original');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Snapshot of original selection to restore when switching back
  const originalSelectionRef = useRef<VideoContentSelection | null>(null);

  // Capture original selection on first render / session change
  useEffect(() => {
    if (selectionState) {
      originalSelectionRef.current = { ...selectionState.selection };
    }
  }, [sessionId]); // only on session change, not every selection change

  // Load the single draft (latest) when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setDraft(null);
      setMode('original');
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/drafts`);
        if (res.ok && !cancelled) {
          const data: VideoDraft[] = await res.json();
          // Take the latest draft (sorted by updated_at DESC from API)
          setDraft(data.length > 0 ? data[0] : null);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId]);

  // Reset mode on session change
  useEffect(() => {
    setMode('original');
  }, [sessionId]);

  const switchToOriginal = useCallback(() => {
    if (!selectionState) return;
    setMode('original');
    // Restore original defaults
    selectionState.resetToDefaults();
    selectionState.setEnrichments([]);
    selectionState.setRewrites([]);
  }, [selectionState]);

  const switchToDraft = useCallback(() => {
    if (!selectionState || !draft) return;

    // Capture current original selection before switching
    if (mode === 'original') {
      originalSelectionRef.current = { ...selectionState.selection };
    }

    setMode('draft');
    // Apply saved draft to selection state
    selectionState.setSelection(draft.selection as unknown as VideoContentSelection);
    selectionState.setEnrichments(draft.enrichments);
    selectionState.setRewrites(draft.rewrites);
  }, [selectionState, draft, mode]);

  const buildDraftPayload = useCallback(() => {
    if (!selectionState) return null;

    const enrichments: VideoDraft['enrichments'] = [];
    selectionState.enrichments.forEach((items, itemId) => {
      items.forEach(item => {
        enrichments.push({ itemId, type: item.type, content: item.content, source: item.source });
      });
    });

    const rewrites: VideoDraft['rewrites'] = [];
    selectionState.rewrites.forEach((rw, itemId) => {
      rewrites.push({ itemId, originalContent: rw.original, optimizedContent: rw.optimized });
    });

    return {
      selection: selectionState.selection,
      enrichments,
      rewrites,
    };
  }, [selectionState]);

  const autoSave = useCallback(async () => {
    if (!sessionId || !selectionState) return;

    const payload = buildDraftPayload();
    if (!payload) return;

    setIsSaving(true);
    try {
      if (draft) {
        // Overwrite existing draft
        const res = await fetch(`/api/sessions/${sessionId}/drafts/${draft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setDraft(updated);
        }
      } else {
        // Create the single draft
        const res = await fetch(`/api/sessions/${sessionId}/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, name: 'AI Compose' }),
        });
        if (res.ok) {
          const created = await res.json();
          setDraft(created);
        }
      }
      // Auto-switch to draft mode after save
      setMode('draft');
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, selectionState, draft, buildDraftPayload]);

  return {
    draft,
    mode,
    hasDraft: draft !== null,
    isSaving,
    isLoading,
    switchToOriginal,
    switchToDraft,
    autoSave,
  };
}
