'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SessionWithDetails, ComposedScene } from '@/src/types/research';
import type { ContentSelectionState } from '@/src/components/report/video/useContentSelection';
import type { AIComposeResult, WordTimestamp } from './types';
import { buildComposePrompt, type ComposeOptions } from './buildComposePrompt';
import { validateComposition } from './validateComposition';
import { resolveStockFootage } from './resolveStockFootage';
import { adjustNarrationDurations } from './adjustNarrationDurations';
import { scaleToAudioDuration } from './scaleToAudioDuration';

interface UseAIComposeOptions {
  session: SessionWithDetails;
  selectionState: ContentSelectionState;
  onComposition?: (scenes: ComposedScene[] | null) => void;
  onKeywords?: (keywords: string[]) => void;
  onAudio?: (audioData: string | null, audioDuration: number | null) => void;
}

export function useAICompose({ session, selectionState, onComposition, onKeywords, onAudio }: UseAIComposeOptions) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [composeOptions] = useState<ComposeOptions>({
    enableResearch: true,
    enableRewriting: true,
    enableComposition: true,
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

  const handleResult = useCallback(async (result: AIComposeResult) => {
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

    // Apply keywords if present
    if (result.keywords?.length && onKeywords) {
      onKeywords(result.keywords);
    }

    // Validate and apply scene composition if present
    if (result.sceneComposition?.length && onComposition) {
      const validation = validateComposition(result.sceneComposition);
      if (validation.valid) {
        // Adjust scene durations to fit narration, then resolve stock footage
        const narrationAdjusted = adjustNarrationDurations(validation.sanitized);
        const resolved = await resolveStockFootage(narrationAdjusted);

        // Auto-generate audio narration and scale scenes to match
        const narrationTexts = resolved
          .filter(s => s.narration)
          .map(s => s.narration!);

        if (narrationTexts.length > 0) {
          try {
            const fullText = narrationTexts.join(' ... ');
            const audioRes = await fetch('/api/audio/narration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: fullText }),
            });
            if (audioRes.ok) {
              const audioResult = await audioRes.json();
              const actualDuration: number = audioResult.duration;

              // Scale scene durations to match actual audio
              const scaled = scaleToAudioDuration(resolved, actualDuration);

              // Split global word timestamps back to per-scene arrays
              const withTimestamps = splitWordTimestampsToScenes(
                scaled,
                audioResult.wordTimestamps || [],
              );
              onComposition(withTimestamps);

              // Pass audio data to parent
              if (onAudio) {
                onAudio(audioResult.audioData, actualDuration);
              }
            } else {
              // Audio generation failed — use scenes without scaling
              console.warn('[compose] Audio generation failed, using estimated durations');
              onComposition(resolved);
            }
          } catch (err) {
            console.warn('[compose] Audio generation error:', err);
            onComposition(resolved);
          }
        } else {
          onComposition(resolved);
        }

        if (validation.warnings.length) {
          console.warn('Scene composition warnings:', validation.warnings);
        }
      } else {
        console.error('Scene composition validation failed:', validation.errors);
        setLastError(`Composition invalid: ${validation.errors[0]}`);
      }
    }
  }, [selectionState, onComposition, onKeywords, onAudio]);

  const handleError = useCallback((error: string) => {
    setIsComposing(false);
    setLastError(error);
  }, []);

  return {
    isComposing,
    isTerminalOpen,
    composeOptions,
    projectPath,
    prompt,
    lastError,
    startCompose,
    closeTerminal,
    handleResult,
    handleError,
  };
}

/**
 * Split global word timestamps from the combined narration audio
 * back into per-scene arrays with scene-relative timing.
 *
 * Matches words sequentially to each scene's narration text.
 * Timestamps are converted from global audio time to scene-relative time.
 */
function splitWordTimestampsToScenes(
  scenes: ComposedScene[],
  globalTimestamps: WordTimestamp[],
): ComposedScene[] {
  if (!globalTimestamps.length) return scenes;

  let tsIdx = 0;

  return scenes.map(scene => {
    if (!scene.narration) return scene;

    const sceneWords = scene.narration.split(/\s+/).filter(Boolean);
    const sceneTimestamps: WordTimestamp[] = [];

    // Find the audio offset where this scene's narration starts
    const sceneAudioStart = tsIdx < globalTimestamps.length
      ? globalTimestamps[tsIdx].start
      : 0;

    // Consume matching words from the global timestamp stream
    for (let i = 0; i < sceneWords.length && tsIdx < globalTimestamps.length; i++) {
      const ts = globalTimestamps[tsIdx];
      // Convert to scene-relative time
      sceneTimestamps.push({
        word: ts.word,
        start: ts.start - sceneAudioStart,
        end: ts.end - sceneAudioStart,
      });
      tsIdx++;
    }

    // Skip separator words ("...") between scenes
    while (tsIdx < globalTimestamps.length && globalTimestamps[tsIdx].word === '...') {
      tsIdx++;
    }

    return { ...scene, narrationTimestamps: sceneTimestamps };
  });
}
