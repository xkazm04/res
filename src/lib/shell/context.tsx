'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type RefObject,
} from 'react';
import type {
  ShellContext,
  ShellRequirements,
  ContainerType,
  ResolvedShellConfig,
} from './protocol';
import { resolveShellConfig, containerDefaults } from './protocol';

// =============================================================================
// Context Definition
// =============================================================================

const ShellContextValue = createContext<ShellContext | null>(null);

/**
 * Hook to access the shell context from content.
 * Returns null if not within a shell container.
 */
export function useShellContext(): ShellContext | null {
  return useContext(ShellContextValue);
}

/**
 * Hook to access the shell context, throwing if not available.
 * Use this when your component requires a shell container.
 */
export function useRequiredShellContext(): ShellContext {
  const context = useContext(ShellContextValue);
  if (!context) {
    throw new Error('useRequiredShellContext must be used within a ShellProvider');
  }
  return context;
}

// =============================================================================
// Provider Props
// =============================================================================

export interface ShellProviderProps {
  /** Child content to render */
  children: ReactNode;

  /** Container type for this shell */
  containerType: ContainerType;

  /** Whether the container is open/visible */
  isOpen: boolean;

  /** Callback to close the container */
  onClose: () => void;

  /** Initial shell requirements from content */
  requirements?: ShellRequirements;

  /** Callback when requirements change */
  onRequirementsChange?: (config: ResolvedShellConfig) => void;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * ShellProvider - Provides shell context to content.
 *
 * This component bridges the gap between content requirements and container capabilities.
 * It manages:
 * - Keyboard handlers registry
 * - Focus management
 * - Dynamic requirement updates
 * - Container dimensions
 */
export function ShellProvider({
  children,
  containerType,
  isOpen,
  onClose,
  requirements: initialRequirements = {},
  onRequirementsChange,
}: ShellProviderProps) {
  const containerRef = useRef<HTMLElement>(null) as RefObject<HTMLElement>;
  const [requirements, setRequirements] = useState<ShellRequirements>(initialRequirements);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | undefined>();
  const keyHandlersRef = useRef<Map<string, (e: KeyboardEvent) => void>>(new Map());

  // Resolve configuration when requirements change
  useEffect(() => {
    const config = resolveShellConfig(requirements, containerDefaults[containerType]);
    onRequirementsChange?.(config);
  }, [requirements, containerType, onRequirementsChange]);

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current || !isOpen) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Global keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const handler = keyHandlersRef.current.get(e.key);
      if (handler) {
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Register a keyboard handler
  const registerKeyHandler = useCallback((key: string, handler: (e: KeyboardEvent) => void) => {
    keyHandlersRef.current.set(key, handler);
    return () => {
      keyHandlersRef.current.delete(key);
    };
  }, []);

  // Request focus on an element
  const requestFocus = useCallback((element: HTMLElement | null) => {
    if (element) {
      // Defer focus to next tick to ensure element is ready
      setTimeout(() => element.focus(), 0);
    }
  }, []);

  // Update requirements dynamically
  const updateRequirements = useCallback((newRequirements: Partial<ShellRequirements>) => {
    setRequirements((prev) => ({ ...prev, ...newRequirements }));
  }, []);

  // Determine if space is constrained (modal, drawer, panel)
  const isConstrained = containerType !== 'page' && containerType !== 'inline';

  const contextValue: ShellContext = {
    containerType,
    isOpen,
    close: onClose,
    containerRef,
    isConstrained,
    dimensions,
    registerKeyHandler,
    requestFocus,
    updateRequirements,
  };

  return (
    <ShellContextValue.Provider value={contextValue}>
      {children}
    </ShellContextValue.Provider>
  );
}

// =============================================================================
// Content Wrapper Hook
// =============================================================================

export interface UseShellOptions {
  /** Shell requirements for this content */
  requirements?: ShellRequirements;

  /** Callback when close is requested */
  onClose?: () => void;
}

/**
 * Hook for content to declare its shell requirements and interact with the container.
 *
 * @example
 * ```tsx
 * function MyDialog({ onClose }) {
 *   const { close, isConstrained } = useShell({
 *     requirements: {
 *       backdrop: true,
 *       keyboard: { escapeToClose: true },
 *       size: { width: 'md' },
 *     },
 *     onClose,
 *   });
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useShell(options: UseShellOptions = {}) {
  const context = useShellContext();
  const { requirements, onClose } = options;

  // Update requirements on mount and when they change
  useEffect(() => {
    if (context && requirements) {
      context.updateRequirements(requirements);
    }
  }, [context, requirements]);

  // Register escape handler if onClose provided
  useEffect(() => {
    if (!context || !onClose) return;

    return context.registerKeyHandler('Escape', () => {
      onClose();
    });
  }, [context, onClose]);

  return {
    // Context values (with fallbacks for when not in a shell)
    containerType: context?.containerType || 'inline',
    isOpen: context?.isOpen ?? true,
    close: context?.close || onClose || (() => {}),
    containerRef: context?.containerRef,
    isConstrained: context?.isConstrained ?? false,
    dimensions: context?.dimensions,

    // Actions
    registerKeyHandler: context?.registerKeyHandler || (() => () => {}),
    requestFocus: context?.requestFocus || (() => {}),
    updateRequirements: context?.updateRequirements || (() => {}),

    // Whether we're in a shell context
    hasShellContext: !!context,
  };
}
