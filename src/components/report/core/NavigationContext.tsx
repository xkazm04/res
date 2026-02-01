'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';

export type TabId = 'overview' | 'findings' | 'sources' | 'perspectives' | 'analysis' | 'entities';

interface NavigationTarget {
  tab: TabId;
  entityId?: string;
  sourceId?: string;
}

interface NavigationContextValue {
  navigateTo: (target: NavigationTarget) => void;
  selectedEntityId: string | null;
  selectedSourceId: string | null;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
  onNavigate: (target: NavigationTarget) => void;
  selectedEntityId: string | null;
  selectedSourceId: string | null;
}

export function NavigationProvider({ children, onNavigate, selectedEntityId, selectedSourceId }: NavigationProviderProps) {
  const navigateTo = useCallback((target: NavigationTarget) => {
    onNavigate(target);
  }, [onNavigate]);

  return (
    <NavigationContext.Provider value={{ navigateTo, selectedEntityId, selectedSourceId }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
}

export function useNavigationSafe() {
  return useContext(NavigationContext);
}
