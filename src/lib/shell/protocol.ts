/**
 * Shell Protocol - Composable Layout Requirements System
 *
 * This module provides a protocol-based approach to layout composition where
 * content can declare its shell requirements (backdrop, animations, keyboard handlers)
 * and compose them declaratively rather than through nesting.
 *
 * The key insight is inverting control from container to content:
 * - Content declares what layout capabilities it needs
 * - Containers provide those capabilities through the protocol
 * - The same content can render in modal, drawer, or page context
 */

import type { ReactNode, RefObject } from 'react';
import type { MotionProps, Transition, AnimatePresenceProps } from 'framer-motion';

// =============================================================================
// Core Protocol Types
// =============================================================================

/** Available container types for rendering content */
export type ContainerType = 'modal' | 'drawer' | 'panel' | 'page' | 'inline';

/** Drawer position when using drawer container */
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/** Animation preset names */
export type AnimationPreset = 'fade' | 'scale' | 'slide' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'none';

/** Backdrop configuration */
export interface BackdropConfig {
  /** Whether to show backdrop */
  enabled: boolean;
  /** Backdrop blur intensity (px) */
  blur?: number;
  /** Backdrop opacity (0-1) */
  opacity?: number;
  /** Click backdrop to close */
  closeOnClick?: boolean;
  /** Custom backdrop class */
  className?: string;
}

/** Animation configuration */
export interface AnimationConfig {
  /** Animation preset or custom motion props */
  preset?: AnimationPreset;
  /** Entry animation */
  enter?: MotionProps;
  /** Exit animation */
  exit?: MotionProps;
  /** Animation transition config */
  transition?: Transition;
  /** Stagger children animations */
  staggerChildren?: number;
  /** AnimatePresence mode */
  mode?: AnimatePresenceProps['mode'];
}

/** Keyboard handler configuration */
export interface KeyboardConfig {
  /** Close on Escape key */
  escapeToClose?: boolean;
  /** Enable arrow key navigation */
  arrowNavigation?: boolean;
  /** Custom key handlers */
  handlers?: Record<string, (e: KeyboardEvent) => void>;
  /** Trap focus within container */
  focusTrap?: boolean;
  /** Auto-focus first focusable element */
  autoFocus?: boolean;
}

/** Scroll behavior configuration */
export interface ScrollConfig {
  /** Lock body scroll when open */
  lockBody?: boolean;
  /** Scroll container behavior */
  behavior?: 'auto' | 'smooth' | 'contain';
  /** Restore scroll position on close */
  restorePosition?: boolean;
}

/** Size configuration for containers */
export interface SizeConfig {
  /** Width (CSS value or preset) */
  width?: string | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto';
  /** Max width */
  maxWidth?: string;
  /** Height */
  height?: string | 'auto' | 'full' | 'screen';
  /** Max height */
  maxHeight?: string;
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/** Theme-aware styling configuration */
export interface ThemeConfig {
  /** Force a specific theme */
  theme?: 'light' | 'dark' | 'system';
  /** Border radius preset */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Shadow preset */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Border style */
  border?: boolean | string;
}

// =============================================================================
// Shell Requirements - What content declares
// =============================================================================

/**
 * Shell requirements that content can declare.
 * The container will provide these capabilities based on the requirements.
 */
export interface ShellRequirements {
  /** Preferred container type (container may override) */
  preferredContainer?: ContainerType;

  /** Backdrop requirements */
  backdrop?: BackdropConfig | boolean;

  /** Animation requirements */
  animation?: AnimationConfig | AnimationPreset;

  /** Keyboard handling requirements */
  keyboard?: KeyboardConfig | boolean;

  /** Scroll behavior requirements */
  scroll?: ScrollConfig | boolean;

  /** Size requirements */
  size?: SizeConfig;

  /** Theme/styling requirements */
  theme?: ThemeConfig;

  /** ARIA label for accessibility */
  ariaLabel?: string;

  /** ARIA described by */
  ariaDescribedBy?: string;

  /** Role attribute */
  role?: 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'tree' | 'grid';

  /** Z-index layer */
  zIndex?: number | 'auto' | 'modal' | 'popover' | 'tooltip';

  /** Custom class name to add */
  className?: string;
}

// =============================================================================
// Shell Context - What container provides
// =============================================================================

/**
 * Shell context provided by container to content.
 * Content can use this to interact with its container.
 */
export interface ShellContext {
  /** Current container type */
  containerType: ContainerType;

  /** Whether the container is currently open/active */
  isOpen: boolean;

  /** Close the container */
  close: () => void;

  /** Ref to the container element */
  containerRef: RefObject<HTMLElement>;

  /** Whether content is being rendered in a constrained space */
  isConstrained: boolean;

  /** Current container dimensions (if available) */
  dimensions?: { width: number; height: number };

  /** Register a keyboard handler */
  registerKeyHandler: (key: string, handler: (e: KeyboardEvent) => void) => () => void;

  /** Request focus on a specific element */
  requestFocus: (element: HTMLElement | null) => void;

  /** Update requirements dynamically */
  updateRequirements: (requirements: Partial<ShellRequirements>) => void;
}

// =============================================================================
// Resolved Configuration - What container uses internally
// =============================================================================

/**
 * Fully resolved configuration after merging requirements with container defaults.
 */
export interface ResolvedShellConfig {
  backdrop: Required<BackdropConfig>;
  animation: Required<Omit<AnimationConfig, 'enter' | 'exit'>> & {
    enter: MotionProps;
    exit: MotionProps;
  };
  keyboard: Required<KeyboardConfig>;
  scroll: Required<ScrollConfig>;
  size: Required<SizeConfig>;
  theme: Required<ThemeConfig>;
  ariaLabel: string;
  ariaDescribedBy?: string;
  role: string;
  zIndex: number;
  className: string;
}

// =============================================================================
// Default Configurations
// =============================================================================

/** Default backdrop configuration */
export const defaultBackdrop: Required<BackdropConfig> = {
  enabled: true,
  blur: 8,
  opacity: 0.5,
  closeOnClick: true,
  className: '',
};

/** Default animation configuration */
export const defaultAnimation: AnimationConfig = {
  preset: 'scale',
  transition: {
    type: 'spring',
    damping: 28,
    stiffness: 350,
  },
  staggerChildren: 0,
  mode: 'wait',
};

/** Default keyboard configuration */
export const defaultKeyboard: Required<KeyboardConfig> = {
  escapeToClose: true,
  arrowNavigation: false,
  handlers: {},
  focusTrap: true,
  autoFocus: true,
};

/** Default scroll configuration */
export const defaultScroll: Required<ScrollConfig> = {
  lockBody: true,
  behavior: 'auto',
  restorePosition: true,
};

/** Default size configuration */
export const defaultSize: Required<SizeConfig> = {
  width: 'auto',
  maxWidth: '100%',
  height: 'auto',
  maxHeight: '100%',
  padding: 'md',
};

/** Default theme configuration */
export const defaultTheme: Required<ThemeConfig> = {
  theme: 'system',
  radius: 'xl',
  shadow: 'lg',
  border: true,
};

// =============================================================================
// Animation Presets
// =============================================================================

/** Get motion props for animation presets */
export function getAnimationPreset(preset: AnimationPreset): { enter: MotionProps; exit: MotionProps } {
  const presets: Record<AnimationPreset, { enter: MotionProps; exit: MotionProps }> = {
    fade: {
      enter: { initial: { opacity: 0 }, animate: { opacity: 1 } },
      exit: { exit: { opacity: 0 } },
    },
    scale: {
      enter: { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 } },
      exit: { exit: { opacity: 0, scale: 0.92 } },
    },
    slide: {
      enter: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
      exit: { exit: { opacity: 0, y: 20 } },
    },
    slideUp: {
      enter: { initial: { opacity: 0, y: '100%' }, animate: { opacity: 1, y: 0 } },
      exit: { exit: { opacity: 0, y: '100%' } },
    },
    slideDown: {
      enter: { initial: { opacity: 0, y: '-100%' }, animate: { opacity: 1, y: 0 } },
      exit: { exit: { opacity: 0, y: '-100%' } },
    },
    slideLeft: {
      enter: { initial: { opacity: 0, x: '100%' }, animate: { opacity: 1, x: 0 } },
      exit: { exit: { opacity: 0, x: '100%' } },
    },
    slideRight: {
      enter: { initial: { opacity: 0, x: '-100%' }, animate: { opacity: 1, x: 0 } },
      exit: { exit: { opacity: 0, x: '-100%' } },
    },
    none: {
      enter: { initial: {}, animate: {} },
      exit: { exit: {} },
    },
  };

  return presets[preset];
}

// =============================================================================
// Z-Index Layers
// =============================================================================

/** Z-index layer values */
export const zIndexLayers = {
  auto: 0,
  popover: 40,
  modal: 50,
  tooltip: 60,
} as const;

/** Resolve z-index from config value */
export function resolveZIndex(value: ShellRequirements['zIndex']): number {
  if (typeof value === 'number') return value;
  if (value === 'auto' || value === undefined) return zIndexLayers.modal;
  return zIndexLayers[value];
}

// =============================================================================
// Size Presets
// =============================================================================

/** Width preset values */
export const widthPresets = {
  sm: '24rem', // 384px
  md: '32rem', // 512px
  lg: '42rem', // 672px
  xl: '56rem', // 896px
  full: '100%',
  auto: 'auto',
} as const;

/** Resolve width from config value */
export function resolveWidth(value: SizeConfig['width']): string {
  if (!value) return 'auto';
  if (value in widthPresets) return widthPresets[value as keyof typeof widthPresets];
  return value;
}

/** Padding preset values */
export const paddingPresets = {
  none: '0',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
} as const;

// =============================================================================
// Configuration Resolution
// =============================================================================

/**
 * Merge shell requirements with container defaults to produce resolved config.
 */
export function resolveShellConfig(
  requirements: ShellRequirements,
  containerDefaults?: Partial<ShellRequirements>
): ResolvedShellConfig {
  // Merge with container defaults first
  const merged = { ...containerDefaults, ...requirements };

  // Resolve backdrop
  const backdropInput = merged.backdrop;
  const backdrop: Required<BackdropConfig> = backdropInput === true
    ? defaultBackdrop
    : backdropInput === false
      ? { ...defaultBackdrop, enabled: false }
      : { ...defaultBackdrop, ...backdropInput };

  // Resolve animation
  const animationInput = merged.animation;
  const animationPreset = typeof animationInput === 'string' ? animationInput : (animationInput?.preset || 'scale');
  const presetMotion = getAnimationPreset(animationPreset);
  const animation = {
    preset: animationPreset,
    transition: (typeof animationInput === 'object' ? animationInput.transition : undefined) || defaultAnimation.transition!,
    staggerChildren: (typeof animationInput === 'object' ? animationInput.staggerChildren : undefined) || 0,
    mode: (typeof animationInput === 'object' ? animationInput.mode : undefined) || 'wait' as const,
    enter: (typeof animationInput === 'object' && animationInput.enter) || presetMotion.enter,
    exit: (typeof animationInput === 'object' && animationInput.exit) || presetMotion.exit,
  };

  // Resolve keyboard
  const keyboardInput = merged.keyboard;
  const keyboard: Required<KeyboardConfig> = keyboardInput === true
    ? defaultKeyboard
    : keyboardInput === false
      ? { ...defaultKeyboard, escapeToClose: false, focusTrap: false }
      : { ...defaultKeyboard, ...keyboardInput };

  // Resolve scroll
  const scrollInput = merged.scroll;
  const scroll: Required<ScrollConfig> = scrollInput === true
    ? defaultScroll
    : scrollInput === false
      ? { ...defaultScroll, lockBody: false }
      : { ...defaultScroll, ...scrollInput };

  // Resolve size
  const size: Required<SizeConfig> = { ...defaultSize, ...merged.size };

  // Resolve theme
  const theme: Required<ThemeConfig> = { ...defaultTheme, ...merged.theme };

  return {
    backdrop,
    animation,
    keyboard,
    scroll,
    size,
    theme,
    ariaLabel: merged.ariaLabel || 'Dialog',
    ariaDescribedBy: merged.ariaDescribedBy,
    role: merged.role || 'dialog',
    zIndex: resolveZIndex(merged.zIndex),
    className: merged.className || '',
  };
}

// =============================================================================
// Container Type Defaults
// =============================================================================

/** Default requirements for each container type */
export const containerDefaults: Record<ContainerType, Partial<ShellRequirements>> = {
  modal: {
    backdrop: { enabled: true, blur: 8, opacity: 0.5, closeOnClick: true },
    animation: 'scale',
    keyboard: { escapeToClose: true, focusTrap: true, autoFocus: true },
    scroll: { lockBody: true },
    size: { width: 'lg', padding: 'none' },
    theme: { radius: '2xl', shadow: 'xl' },
    role: 'dialog',
    zIndex: 'modal',
  },
  drawer: {
    backdrop: { enabled: true, blur: 4, opacity: 0.4, closeOnClick: true },
    animation: 'slideLeft',
    keyboard: { escapeToClose: true, focusTrap: true },
    scroll: { lockBody: true },
    size: { width: 'md', height: 'full', padding: 'none' },
    theme: { radius: 'none', shadow: 'xl' },
    role: 'dialog',
    zIndex: 'modal',
  },
  panel: {
    backdrop: { enabled: false },
    animation: 'slide',
    keyboard: { escapeToClose: false, focusTrap: false },
    scroll: { lockBody: false },
    size: { width: 'auto', padding: 'md' },
    theme: { radius: 'lg', shadow: 'md', border: true },
    role: 'dialog',
    zIndex: 'popover',
  },
  page: {
    backdrop: { enabled: false },
    animation: 'fade',
    keyboard: { escapeToClose: false, focusTrap: false },
    scroll: { lockBody: false },
    size: { width: 'full', height: 'full', padding: 'lg' },
    theme: { radius: 'none', shadow: 'none', border: false },
    zIndex: 'auto',
  },
  inline: {
    backdrop: { enabled: false },
    animation: 'none',
    keyboard: { escapeToClose: false, focusTrap: false },
    scroll: { lockBody: false },
    size: { width: 'auto', height: 'auto', padding: 'none' },
    theme: { radius: 'none', shadow: 'none', border: false },
    zIndex: 'auto',
  },
};
