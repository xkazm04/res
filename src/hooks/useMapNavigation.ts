/**
 * useMapNavigation Hook
 *
 * Manages browser history integration for the Strategic Map drill-down navigation.
 * Enables browser back/forward button support for SPA navigation.
 *
 * Hash format:
 * - #map=overview (default)
 * - #map=template:investigative
 * - #map=topic:topicId:templateId
 */

import { useEffect, useCallback, useRef } from 'react';
import type { DrillDownState, DrillLevel } from '@/src/lib/strategicMap';

interface MapNavigationState {
  level: DrillLevel;
  templateId: string | null;
  topicId: string | null;
}

interface UseMapNavigationOptions {
  /** Current drill state from FocusController */
  drillState: DrillDownState;
  /** Callback to navigate to a specific state */
  onNavigate: (state: MapNavigationState) => void;
  /** Whether to use hash-based URLs (default: true) */
  useHash?: boolean;
}

/**
 * Parse the hash to extract map navigation state
 */
function parseHash(hash: string): MapNavigationState | null {
  // Remove the leading '#' if present
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;

  // Check if it's a map hash
  if (!cleanHash.startsWith('map=')) {
    return null;
  }

  const value = cleanHash.slice(4); // Remove 'map='
  const parts = value.split(':');

  if (parts[0] === 'overview' || parts.length === 1 && !parts[0]) {
    return { level: 'overview', templateId: null, topicId: null };
  }

  if (parts[0] === 'template' && parts[1]) {
    return { level: 'template', templateId: parts[1], topicId: null };
  }

  if (parts[0] === 'topic' && parts[1] && parts[2]) {
    return { level: 'topic', templateId: parts[2], topicId: parts[1] };
  }

  return null;
}

/**
 * Serialize map navigation state to hash
 */
function serializeToHash(state: MapNavigationState): string {
  if (state.level === 'overview') {
    return '#map=overview';
  }

  if (state.level === 'template' && state.templateId) {
    return `#map=template:${encodeURIComponent(state.templateId)}`;
  }

  if (state.level === 'topic' && state.topicId && state.templateId) {
    return `#map=topic:${encodeURIComponent(state.topicId)}:${encodeURIComponent(state.templateId)}`;
  }

  return '#map=overview';
}

/**
 * Convert DrillDownState to MapNavigationState
 */
function drillToNavState(drill: DrillDownState): MapNavigationState {
  return {
    level: drill.level,
    templateId: drill.focusedTemplateId,
    topicId: drill.focusedTopicId,
  };
}

/**
 * Check if two navigation states are equal
 */
function statesEqual(a: MapNavigationState, b: MapNavigationState): boolean {
  return a.level === b.level &&
         a.templateId === b.templateId &&
         a.topicId === b.topicId;
}

/**
 * Hook for managing browser history with Strategic Map navigation
 */
export function useMapNavigation({
  drillState,
  onNavigate,
  useHash = true,
}: UseMapNavigationOptions) {
  // Track whether we're handling a popstate event to avoid circular updates
  const isHandlingPopState = useRef(false);
  // Track the last state we pushed to history
  const lastPushedState = useRef<MapNavigationState | null>(null);
  // Track initialization
  const isInitialized = useRef(false);

  // Handle initial load - check if there's a state in the URL
  useEffect(() => {
    if (!useHash || isInitialized.current) return;
    isInitialized.current = true;

    const initialState = parseHash(window.location.hash);
    if (initialState && initialState.level !== 'overview') {
      // Navigate to the state from the URL
      onNavigate(initialState);
      lastPushedState.current = initialState;
    } else {
      // Set initial history state
      const currentState = drillToNavState(drillState);
      window.history.replaceState(
        { mapNav: currentState },
        '',
        serializeToHash(currentState)
      );
      lastPushedState.current = currentState;
    }
  }, [useHash, onNavigate]); // Only run once on mount

  // Push state to history when drill state changes (but not during popstate handling)
  useEffect(() => {
    if (!useHash || isHandlingPopState.current || !isInitialized.current) return;

    const currentNavState = drillToNavState(drillState);

    // Don't push if state hasn't changed
    if (lastPushedState.current && statesEqual(currentNavState, lastPushedState.current)) {
      return;
    }

    // Push new state to history
    const hash = serializeToHash(currentNavState);
    window.history.pushState({ mapNav: currentNavState }, '', hash);
    lastPushedState.current = currentNavState;
  }, [drillState, useHash]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (!useHash) return;

    const handlePopState = (event: PopStateEvent) => {
      isHandlingPopState.current = true;

      // Try to get state from event first, fall back to parsing hash
      let navState: MapNavigationState | null = event.state?.mapNav ?? null;

      if (!navState) {
        navState = parseHash(window.location.hash);
      }

      if (navState) {
        lastPushedState.current = navState;
        onNavigate(navState);
      } else {
        // Default to overview if no state found
        const overviewState: MapNavigationState = {
          level: 'overview',
          templateId: null,
          topicId: null
        };
        lastPushedState.current = overviewState;
        onNavigate(overviewState);
      }

      // Reset flag after a microtask to allow the navigation to complete
      queueMicrotask(() => {
        isHandlingPopState.current = false;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [useHash, onNavigate]);

  // Callback to manually navigate (useful for programmatic navigation)
  const navigate = useCallback((state: MapNavigationState) => {
    if (!useHash) {
      onNavigate(state);
      return;
    }

    const hash = serializeToHash(state);
    window.history.pushState({ mapNav: state }, '', hash);
    lastPushedState.current = state;
    onNavigate(state);
  }, [useHash, onNavigate]);

  // Callback to go back in history
  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return {
    navigate,
    goBack,
  };
}
