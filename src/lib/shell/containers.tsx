'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShellProvider } from './context';
import {
  type ShellRequirements,
  type ResolvedShellConfig,
  type ContainerType,
  type DrawerPosition,
  resolveShellConfig,
  containerDefaults,
  resolveWidth,
  paddingPresets,
} from './protocol';
import { useFocusTrap } from '@/src/hooks/useFocusTrap';

// =============================================================================
// Shared Types
// =============================================================================

export interface BaseContainerProps {
  /** Whether the container is open */
  isOpen: boolean;

  /** Callback to close the container */
  onClose: () => void;

  /** Content to render inside the container */
  children: ReactNode;

  /** Shell requirements from content */
  requirements?: ShellRequirements;

  /** Additional CSS classes */
  className?: string;

  /** ARIA label for accessibility */
  ariaLabel?: string;

  /** ID for aria-labelledby */
  titleId?: string;
}

// =============================================================================
// Shared Hooks
// =============================================================================

/**
 * Hook to manage body scroll lock
 */
function useBodyScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [enabled]);
}

/**
 * Hook to handle escape key
 */
function useEscapeKey(enabled: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape]);
}

// =============================================================================
// Backdrop Component
// =============================================================================

interface BackdropProps {
  config: ResolvedShellConfig['backdrop'];
  isRadar?: boolean;
  onClose: () => void;
}

function Backdrop({ config, isRadar = false, onClose }: BackdropProps) {
  if (!config.enabled) return null;

  const handleClick = () => {
    if (config.closeOnClick) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{
        opacity: 1,
        backdropFilter: `blur(${config.blur}px)`,
      }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      transition={{
        opacity: { duration: 0.15, ease: 'easeOut' },
        backdropFilter: { duration: 0.2, delay: 0.15, ease: 'easeOut' },
      }}
      className={`
        absolute inset-0
        ${isRadar ? 'bg-black' : 'bg-stone-900'}
        ${config.className}
      `}
      style={{
        opacity: config.opacity,
        WebkitBackdropFilter: `blur(${config.blur}px)`,
      }}
      onClick={handleClick}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// Modal Container
// =============================================================================

export interface ModalContainerProps extends BaseContainerProps {
  /** Whether to use radar (dark) theme */
  isRadar?: boolean;
}

/**
 * ModalContainer - A centered overlay container.
 *
 * Features:
 * - Centered content with backdrop
 * - Focus trap
 * - Escape to close
 * - Body scroll lock
 * - Animated entry/exit
 */
export function ModalContainer({
  isOpen,
  onClose,
  children,
  requirements = {},
  className = '',
  ariaLabel,
  titleId,
  isRadar = false,
}: ModalContainerProps) {
  const config = resolveShellConfig(requirements, containerDefaults.modal);
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ enabled: isOpen && config.keyboard.focusTrap });

  useBodyScrollLock(isOpen && config.scroll.lockBody);
  useEscapeKey(isOpen && config.keyboard.escapeToClose, onClose);

  const handleRequirementsChange = useCallback((newConfig: ResolvedShellConfig) => {
    // Container can react to dynamic requirement changes here
  }, []);

  if (!isOpen) return null;

  const widthValue = resolveWidth(config.size.width);
  const paddingValue = paddingPresets[config.size.padding];

  return (
    <ShellProvider
      containerType="modal"
      isOpen={isOpen}
      onClose={onClose}
      requirements={requirements}
      onRequirementsChange={handleRequirementsChange}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: config.zIndex }}
          role="presentation"
        >
          <Backdrop config={config.backdrop} isRadar={isRadar} onClose={onClose} />

          <motion.div
            ref={focusTrapRef}
            {...config.animation.enter}
            transition={config.animation.transition}
            className={`
              relative z-10 flex flex-col overflow-hidden
              ${isRadar ? 'bg-slate-900 border-cyan-500/20' : 'bg-white border-stone-200'}
              ${config.theme.border ? 'border' : ''}
              rounded-${config.theme.radius}
              shadow-${config.theme.shadow}
              ${className}
              ${config.className}
            `}
            style={{
              width: widthValue,
              maxWidth: config.size.maxWidth,
              maxHeight: config.size.maxHeight,
              padding: paddingValue,
            }}
            role={config.role}
            aria-modal="true"
            aria-label={ariaLabel || config.ariaLabel}
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ShellProvider>
  );
}

// =============================================================================
// Drawer Container
// =============================================================================

export interface DrawerContainerProps extends BaseContainerProps {
  /** Drawer position */
  position?: DrawerPosition;

  /** Whether to use radar (dark) theme */
  isRadar?: boolean;
}

/**
 * DrawerContainer - A slide-in panel from an edge.
 *
 * Features:
 * - Slides from any edge (left, right, top, bottom)
 * - Focus trap
 * - Escape to close
 * - Body scroll lock
 */
export function DrawerContainer({
  isOpen,
  onClose,
  children,
  requirements = {},
  position = 'right',
  className = '',
  ariaLabel,
  titleId,
  isRadar = false,
}: DrawerContainerProps) {
  // Override animation based on position
  const animationOverrides: ShellRequirements = {
    animation: position === 'left' ? 'slideRight' : position === 'right' ? 'slideLeft' : position === 'top' ? 'slideDown' : 'slideUp',
  };

  const config = resolveShellConfig({ ...requirements, ...animationOverrides }, containerDefaults.drawer);
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ enabled: isOpen && config.keyboard.focusTrap });

  useBodyScrollLock(isOpen && config.scroll.lockBody);
  useEscapeKey(isOpen && config.keyboard.escapeToClose, onClose);

  if (!isOpen) return null;

  const isHorizontal = position === 'left' || position === 'right';
  const widthValue = isHorizontal ? resolveWidth(config.size.width) : '100%';
  const heightValue = isHorizontal ? '100%' : resolveWidth(config.size.height);

  const positionClasses = {
    left: 'left-0 top-0 bottom-0',
    right: 'right-0 top-0 bottom-0',
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
  };

  return (
    <ShellProvider
      containerType="drawer"
      isOpen={isOpen}
      onClose={onClose}
      requirements={requirements}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          style={{ zIndex: config.zIndex }}
          role="presentation"
        >
          <Backdrop config={config.backdrop} isRadar={isRadar} onClose={onClose} />

          <motion.div
            ref={focusTrapRef}
            {...config.animation.enter}
            transition={config.animation.transition}
            className={`
              absolute ${positionClasses[position]}
              flex flex-col overflow-hidden
              ${isRadar ? 'bg-slate-900 border-cyan-500/20' : 'bg-white border-stone-200'}
              ${config.theme.border ? 'border' : ''}
              shadow-${config.theme.shadow}
              ${className}
              ${config.className}
            `}
            style={{
              width: widthValue,
              height: heightValue,
              maxWidth: isHorizontal ? config.size.maxWidth : undefined,
              maxHeight: !isHorizontal ? config.size.maxHeight : undefined,
            }}
            role={config.role}
            aria-modal="true"
            aria-label={ariaLabel || config.ariaLabel}
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ShellProvider>
  );
}

// =============================================================================
// Panel Container
// =============================================================================

export interface PanelContainerProps extends BaseContainerProps {
  /** Whether to use radar (dark) theme */
  isRadar?: boolean;
}

/**
 * PanelContainer - An inline panel that doesn't overlay content.
 *
 * Features:
 * - No backdrop
 * - No body scroll lock
 * - Optional focus trap
 * - Subtle animation
 */
export function PanelContainer({
  isOpen,
  onClose,
  children,
  requirements = {},
  className = '',
  ariaLabel,
  titleId,
  isRadar = false,
}: PanelContainerProps) {
  const config = resolveShellConfig(requirements, containerDefaults.panel);

  if (!isOpen) return null;

  const widthValue = resolveWidth(config.size.width);
  const paddingValue = paddingPresets[config.size.padding];

  return (
    <ShellProvider
      containerType="panel"
      isOpen={isOpen}
      onClose={onClose}
      requirements={requirements}
    >
      <motion.div
        {...config.animation.enter}
        transition={config.animation.transition}
        className={`
          ${isRadar ? 'bg-slate-900 border-cyan-500/20' : 'bg-white border-stone-200'}
          ${config.theme.border ? 'border' : ''}
          rounded-${config.theme.radius}
          shadow-${config.theme.shadow}
          ${className}
          ${config.className}
        `}
        style={{
          width: widthValue,
          maxWidth: config.size.maxWidth,
          padding: paddingValue,
        }}
        role={config.role}
        aria-label={ariaLabel || config.ariaLabel}
        aria-labelledby={titleId}
      >
        {children}
      </motion.div>
    </ShellProvider>
  );
}

// =============================================================================
// Report Shell Container
// =============================================================================

export interface ReportShellContainerProps extends BaseContainerProps {
  /** Whether to use radar (dark) theme */
  isRadar?: boolean;

  /** Ambient effects (radar scan line, corner accents) */
  ambient?: ReactNode;
}

/**
 * ReportShellContainer - A full-viewport shell for complex content like reports.
 *
 * This is a specialized container that provides:
 * - Full viewport coverage with margin
 * - Cinematic backdrop animation
 * - Support for ambient effects
 * - Focus trap and keyboard handling
 */
export function ReportShellContainer({
  isOpen,
  onClose,
  children,
  requirements = {},
  className = '',
  ariaLabel,
  titleId,
  isRadar = false,
  ambient,
}: ReportShellContainerProps) {
  const shellRequirements: ShellRequirements = {
    backdrop: { enabled: true, blur: 8, opacity: 0.5, closeOnClick: true },
    animation: 'scale',
    keyboard: { escapeToClose: true, focusTrap: true, autoFocus: true },
    scroll: { lockBody: true },
    size: { width: 'full', height: 'full', padding: 'none' },
    theme: { radius: '2xl', shadow: 'xl', border: true },
    role: 'dialog',
    zIndex: 'modal',
    ...requirements,
  };

  const config = resolveShellConfig(shellRequirements, containerDefaults.modal);
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ enabled: isOpen && config.keyboard.focusTrap });

  useBodyScrollLock(isOpen && config.scroll.lockBody);
  useEscapeKey(isOpen && config.keyboard.escapeToClose, onClose);

  if (!isOpen) return null;

  return (
    <ShellProvider
      containerType="modal"
      isOpen={isOpen}
      onClose={onClose}
      requirements={shellRequirements}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex"
          style={{ zIndex: config.zIndex }}
          role="presentation"
        >
          {/* Staged backdrop: fade → blur → content */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{
              opacity: 1,
              backdropFilter: `blur(${config.backdrop.blur}px)`,
            }}
            transition={{
              opacity: { duration: 0.15, ease: 'easeOut' },
              backdropFilter: { duration: 0.2, delay: 0.15, ease: 'easeOut' },
            }}
            className={`absolute inset-0 ${isRadar ? 'bg-black/50' : 'bg-stone-900/50'}`}
            style={{ WebkitBackdropFilter: `blur(${config.backdrop.blur}px)` }}
            onClick={config.backdrop.closeOnClick ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Content container */}
          <motion.div
            ref={focusTrapRef}
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 350,
              delay: 0.35,
            }}
            className={`
              relative z-10 flex flex-1 m-4 overflow-hidden
              ${isRadar ? 'bg-slate-900 border-cyan-500/20' : 'bg-white border-stone-200'}
              border rounded-2xl
              ${className}
              ${config.className}
            `}
            role={config.role}
            aria-modal="true"
            aria-label={ariaLabel || config.ariaLabel}
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            {ambient}
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ShellProvider>
  );
}

// =============================================================================
// Universal Shell Container
// =============================================================================

export interface ShellContainerProps extends BaseContainerProps {
  /** Container type to use */
  containerType: ContainerType;

  /** Drawer position (only for drawer type) */
  drawerPosition?: DrawerPosition;

  /** Whether to use radar (dark) theme */
  isRadar?: boolean;

  /** Ambient effects (only for report shell type) */
  ambient?: ReactNode;
}

/**
 * ShellContainer - Universal container that renders based on containerType.
 *
 * This allows content to specify its preferred container type and have it
 * rendered appropriately without knowing the container implementation.
 *
 * @example
 * ```tsx
 * <ShellContainer
 *   containerType={isMobile ? 'drawer' : 'modal'}
 *   isOpen={isOpen}
 *   onClose={handleClose}
 * >
 *   <MyContent />
 * </ShellContainer>
 * ```
 */
export function ShellContainer({
  containerType,
  drawerPosition,
  ...props
}: ShellContainerProps) {
  switch (containerType) {
    case 'modal':
      return <ModalContainer {...props} />;
    case 'drawer':
      return <DrawerContainer position={drawerPosition} {...props} />;
    case 'panel':
      return <PanelContainer {...props} />;
    case 'page':
      // Page just renders children with shell context
      return (
        <ShellProvider
          containerType="page"
          isOpen={props.isOpen}
          onClose={props.onClose}
          requirements={props.requirements}
        >
          {props.children}
        </ShellProvider>
      );
    case 'inline':
      // Inline just renders children with shell context
      return (
        <ShellProvider
          containerType="inline"
          isOpen={props.isOpen}
          onClose={props.onClose}
          requirements={props.requirements}
        >
          {props.children}
        </ShellProvider>
      );
    default:
      return <ModalContainer {...props} />;
  }
}
