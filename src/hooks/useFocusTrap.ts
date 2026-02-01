'use client';

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Return focus to this element on unmount (defaults to previously focused element) */
  returnFocusTo?: HTMLElement | null;
  /** Auto-focus the first focusable element when enabled */
  autoFocus?: boolean;
}

/**
 * Custom hook to trap focus within a container element.
 * Useful for modals, dialogs, and other overlay components.
 *
 * Features:
 * - Traps tab navigation within the container
 * - Returns focus to the trigger element on close
 * - Auto-focuses the first focusable element
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, returnFocusTo, autoFocus = true } = options;
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => el.offsetParent !== null); // Filter out hidden elements
  }, []);

  // Handle tab key to trap focus
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift+Tab on first element -> go to last
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> go to first
      else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
      // If focus is outside container, bring it back
      else if (!containerRef.current?.contains(activeElement)) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, getFocusableElements]);

  // Store previously focused element and auto-focus on mount
  useEffect(() => {
    if (!enabled) return;

    // Store the currently focused element to return to later
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Auto-focus the first focusable element
    if (autoFocus) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // If no focusable elements, focus the container itself
          containerRef.current?.focus();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [enabled, autoFocus, getFocusableElements]);

  // Return focus on unmount
  useEffect(() => {
    if (!enabled) return;

    return () => {
      const elementToFocus = returnFocusTo || previouslyFocusedRef.current;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        // Small delay to ensure the modal is fully closed
        setTimeout(() => elementToFocus.focus(), 0);
      }
    };
  }, [enabled, returnFocusTo]);

  return containerRef;
}
