'use client';

import { createContext, useContext, useCallback, useReducer, type ReactNode } from 'react';

/**
 * Focus item types - represents what kind of item is focused
 */
export type FocusItemType = 'finding' | 'source' | 'entity' | 'perspective' | 'gap' | 'contradiction';

/**
 * A focused item in the report
 */
export interface FocusItem {
  type: FocusItemType;
  id: string;
  /** Related items that should be highlighted in other views */
  relatedIds?: {
    findings?: string[];
    sources?: string[];
    entities?: string[];
  };
}

/**
 * Focus state with history for back navigation
 */
interface FocusState {
  /** Currently focused item */
  current: FocusItem | null;
  /** Focus history stack for back navigation */
  history: FocusItem[];
  /** Maximum history size */
  maxHistory: number;
}

type FocusAction =
  | { type: 'FOCUS'; item: FocusItem }
  | { type: 'CLEAR' }
  | { type: 'BACK' }
  | { type: 'CLEAR_HISTORY' };

function focusReducer(state: FocusState, action: FocusAction): FocusState {
  switch (action.type) {
    case 'FOCUS': {
      // Don't add to history if focusing same item
      if (state.current?.type === action.item.type && state.current?.id === action.item.id) {
        return state;
      }

      const newHistory = state.current
        ? [...state.history, state.current].slice(-state.maxHistory)
        : state.history;

      return {
        ...state,
        current: action.item,
        history: newHistory,
      };
    }

    case 'CLEAR':
      return {
        ...state,
        current: null,
      };

    case 'BACK': {
      if (state.history.length === 0) {
        return { ...state, current: null };
      }

      const newHistory = [...state.history];
      const previous = newHistory.pop();

      return {
        ...state,
        current: previous || null,
        history: newHistory,
      };
    }

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
      };

    default:
      return state;
  }
}

interface FocusContextValue {
  /** Currently focused item */
  focused: FocusItem | null;
  /** Whether back navigation is available */
  canGoBack: boolean;
  /** Focus history length */
  historyLength: number;

  /** Focus on an item */
  focus: (item: FocusItem) => void;
  /** Focus on a finding */
  focusFinding: (id: string, relatedSourceIds?: string[]) => void;
  /** Focus on a source */
  focusSource: (id: string, relatedFindingIds?: string[]) => void;
  /** Focus on an entity */
  focusEntity: (id: string, relatedFindingIds?: string[], relatedSourceIds?: string[]) => void;
  /** Clear current focus */
  clearFocus: () => void;
  /** Go back to previous focus */
  goBack: () => void;

  /** Check if an item is the currently focused item */
  isFocused: (type: FocusItemType, id: string) => boolean;
  /** Check if an item is related to the currently focused item (for cross-view highlighting) */
  isRelated: (type: FocusItemType, id: string) => boolean;
}

const FocusContext = createContext<FocusContextValue | null>(null);

interface FocusProviderProps {
  children: ReactNode;
  /** Maximum history size (default: 20) */
  maxHistory?: number;
  /** Callback when focus changes */
  onFocusChange?: (item: FocusItem | null) => void;
}

export function FocusProvider({ children, maxHistory = 20, onFocusChange }: FocusProviderProps) {
  const [state, dispatch] = useReducer(focusReducer, {
    current: null,
    history: [],
    maxHistory,
  });

  const focus = useCallback((item: FocusItem) => {
    dispatch({ type: 'FOCUS', item });
    onFocusChange?.(item);
  }, [onFocusChange]);

  const focusFinding = useCallback((id: string, relatedSourceIds?: string[]) => {
    focus({
      type: 'finding',
      id,
      relatedIds: relatedSourceIds ? { sources: relatedSourceIds } : undefined,
    });
  }, [focus]);

  const focusSource = useCallback((id: string, relatedFindingIds?: string[]) => {
    focus({
      type: 'source',
      id,
      relatedIds: relatedFindingIds ? { findings: relatedFindingIds } : undefined,
    });
  }, [focus]);

  const focusEntity = useCallback((id: string, relatedFindingIds?: string[], relatedSourceIds?: string[]) => {
    focus({
      type: 'entity',
      id,
      relatedIds: (relatedFindingIds || relatedSourceIds) ? {
        findings: relatedFindingIds,
        sources: relatedSourceIds,
      } : undefined,
    });
  }, [focus]);

  const clearFocus = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    onFocusChange?.(null);
  }, [onFocusChange]);

  const goBack = useCallback(() => {
    dispatch({ type: 'BACK' });
    // Note: onFocusChange will be called with the new current item
    // We need to get the previous item from history
    if (state.history.length > 0) {
      onFocusChange?.(state.history[state.history.length - 1]);
    } else {
      onFocusChange?.(null);
    }
  }, [onFocusChange, state.history]);

  const isFocused = useCallback((type: FocusItemType, id: string) => {
    return state.current?.type === type && state.current?.id === id;
  }, [state.current]);

  const isRelated = useCallback((type: FocusItemType, id: string) => {
    if (!state.current?.relatedIds) return false;

    switch (type) {
      case 'finding':
        return state.current.relatedIds.findings?.includes(id) ?? false;
      case 'source':
        return state.current.relatedIds.sources?.includes(id) ?? false;
      case 'entity':
        return state.current.relatedIds.entities?.includes(id) ?? false;
      default:
        return false;
    }
  }, [state.current]);

  const value: FocusContextValue = {
    focused: state.current,
    canGoBack: state.history.length > 0,
    historyLength: state.history.length,
    focus,
    focusFinding,
    focusSource,
    focusEntity,
    clearFocus,
    goBack,
    isFocused,
    isRelated,
  };

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
}

/**
 * Hook to access the focus context
 * @throws Error if used outside FocusProvider
 */
export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return ctx;
}

/**
 * Hook to safely access focus context (returns null if not available)
 */
export function useFocusSafe() {
  return useContext(FocusContext);
}

/**
 * Hook to check if an item has focus-related styling
 * Returns 'focused' | 'related' | null
 */
export function useFocusState(type: FocusItemType, id: string): 'focused' | 'related' | null {
  const ctx = useFocusSafe();
  if (!ctx) return null;

  if (ctx.isFocused(type, id)) return 'focused';
  if (ctx.isRelated(type, id)) return 'related';
  return null;
}
