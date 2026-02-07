'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SessionWithDetails } from '@/src/types/research';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';
import type { AIComposeResult } from './types';
import { buildComposePrompt, type ComposeOptions } from './buildComposePrompt';

interface UseAIComposeOptions {
  session: SessionWithDetails;
  selectionState: ContentSelectionState;
}

export function useAICompose({ session, selectionState }: UseAIComposeOptions) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [composeOptions, setComposeOptions] = useState<ComposeOptions>({
    enableResearch: false,
    enableRewriting: false,
  });
  const [lastError, setLastError] = useState<string | null>(null);

  // Project path for Claude CLI (use cwd)
  const projectPath = useMemo(() => {
    if (typeof window !== 'undefined') {
      // In browser, we'll use a placeholder that the API route resolves
      return process.env.NEXT_PUBLIC_PROJECT_PATH || 'C:\\Users\\mkdol\\dolla\\res';
    }
    return process.cwd();
  }, []);

  // Build prompt from session data
  const prompt = useMemo(() => {
    if (!isTerminalOpen) return '';
    return buildComposePrompt(session, selectionState.availableItems, composeOptions);
  }, [session, selectionState.availableItems, composeOptions, isTerminalOpen]);

  const startCompose = useCallback(() => {
    setIsComposing(true);
    setLastError(null);
    setIsTerminalOpen(true);
  }, []);

  const closeTerminal = useCallback(() => {
    setIsTerminalOpen(false);
    setIsComposing(false);
  }, []);

  const handleResult = useCallback((result: AIComposeResult) => {
    setIsComposing(false);

    // Apply selection to the hook state
    selectionState.setSelection({
      selectedFindings: result.selection.selectedFindings,
      selectedPerspectives: result.selection.selectedPerspectives,
      selectedContradictions: result.selection.selectedContradictions,
      selectedGaps: result.selection.selectedGaps,
      selectedCausalChains: result.selection.selectedCausalChains,
      sectionAssignments: result.selection.sectionAssignments,
    });

    // Apply enrichments and rewrites if present
    if (result.enrichments?.length) {
      selectionState.setEnrichments(result.enrichments);
    }
    if (result.rewrites?.length) {
      selectionState.setRewrites(result.rewrites);
    }
  }, [selectionState]);

  const handleError = useCallback((error: string) => {
    setIsComposing(false);
    setLastError(error);
  }, []);

  return {
    isComposing,
    isTerminalOpen,
    composeOptions,
    setComposeOptions,
    projectPath,
    prompt,
    lastError,
    startCompose,
    closeTerminal,
    handleResult,
    handleError,
  };
}
