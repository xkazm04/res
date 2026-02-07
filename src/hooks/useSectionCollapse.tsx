'use client';

import { useState, useCallback, useEffect, useMemo, createContext, useContext, type ReactNode } from 'react';

const STORAGE_KEY = 'res-section-collapse-state';

export interface SectionCollapseState {
  [sectionId: string]: boolean;
}

interface SectionCollapseContextValue {
  /** Get collapsed state for a section (default: expanded/false) */
  isCollapsed: (sectionId: string) => boolean;
  /** Toggle collapse state for a section */
  toggle: (sectionId: string) => void;
  /** Set collapse state for a section */
  setCollapsed: (sectionId: string, collapsed: boolean) => void;
  /** Expand all sections */
  expandAll: () => void;
  /** Collapse all sections */
  collapseAll: () => void;
  /** Register a section (for tracking available sections) */
  registerSection: (sectionId: string) => void;
  /** Unregister a section */
  unregisterSection: (sectionId: string) => void;
  /** Get count of collapsed sections */
  collapsedCount: number;
  /** Get count of total registered sections */
  totalSections: number;
}

const SectionCollapseContext = createContext<SectionCollapseContextValue | null>(null);

interface SectionCollapseProviderProps {
  children: ReactNode;
  /** Unique namespace for this provider (e.g., 'report', 'dashboard') */
  namespace?: string;
}

export function SectionCollapseProvider({ children, namespace = 'default' }: SectionCollapseProviderProps) {
  const [collapseState, setCollapseState] = useState<SectionCollapseState>({});
  const [registeredSections, setRegisteredSections] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  const storageKey = `${STORAGE_KEY}-${namespace}`;

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          setCollapseState(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load section collapse state from localStorage:', e);
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(collapseState));
    } catch (e) {
      console.warn('Failed to save section collapse state to localStorage:', e);
    }
  }, [collapseState, storageKey, isHydrated]);

  const isCollapsed = useCallback((sectionId: string) => {
    return collapseState[sectionId] ?? false;
  }, [collapseState]);

  const toggle = useCallback((sectionId: string) => {
    setCollapseState(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const setCollapsed = useCallback((sectionId: string, collapsed: boolean) => {
    setCollapseState(prev => ({
      ...prev,
      [sectionId]: collapsed,
    }));
  }, []);

  const expandAll = useCallback(() => {
    setCollapseState(prev => {
      const next: SectionCollapseState = {};
      // Set all registered sections to expanded (false)
      registeredSections.forEach(id => {
        next[id] = false;
      });
      return next;
    });
  }, [registeredSections]);

  const collapseAll = useCallback(() => {
    setCollapseState(prev => {
      const next: SectionCollapseState = {};
      // Set all registered sections to collapsed (true)
      registeredSections.forEach(id => {
        next[id] = true;
      });
      return next;
    });
  }, [registeredSections]);

  const registerSection = useCallback((sectionId: string) => {
    setRegisteredSections(prev => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  }, []);

  const unregisterSection = useCallback((sectionId: string) => {
    setRegisteredSections(prev => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  const collapsedCount = useMemo(() => {
    return Array.from(registeredSections).filter(id => collapseState[id]).length;
  }, [registeredSections, collapseState]);

  const value = useMemo<SectionCollapseContextValue>(() => ({
    isCollapsed,
    toggle,
    setCollapsed,
    expandAll,
    collapseAll,
    registerSection,
    unregisterSection,
    collapsedCount,
    totalSections: registeredSections.size,
  }), [isCollapsed, toggle, setCollapsed, expandAll, collapseAll,
       registerSection, unregisterSection, collapsedCount, registeredSections.size]);

  return (
    <SectionCollapseContext.Provider value={value}>
      {children}
    </SectionCollapseContext.Provider>
  );
}

/**
 * Hook to access section collapse context
 */
export function useSectionCollapseContext(): SectionCollapseContextValue | null {
  return useContext(SectionCollapseContext);
}

/**
 * Hook for individual collapsible sections
 * Falls back to local state if no provider is found
 */
export function useSectionCollapse(sectionId: string, defaultCollapsed = false) {
  const context = useContext(SectionCollapseContext);
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);

  // Register/unregister with context
  useEffect(() => {
    if (context) {
      context.registerSection(sectionId);
      return () => context.unregisterSection(sectionId);
    }
  }, [context, sectionId]);

  if (context) {
    return {
      isCollapsed: context.isCollapsed(sectionId),
      toggle: () => context.toggle(sectionId),
      setCollapsed: (collapsed: boolean) => context.setCollapsed(sectionId, collapsed),
    };
  }

  // Fallback to local state
  return {
    isCollapsed: localCollapsed,
    toggle: () => setLocalCollapsed(prev => !prev),
    setCollapsed: setLocalCollapsed,
  };
}
