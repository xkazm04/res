/**
 * Shell Protocol - Composable Layout Requirements System
 *
 * A protocol-based approach to layout composition where content can declare
 * its shell requirements (backdrop, animations, keyboard handlers) and
 * compose them declaratively rather than through nesting.
 *
 * @example
 * ```tsx
 * // Content declares its requirements
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
 *
 * // Container renders content with appropriate shell
 * <ShellContainer
 *   containerType={isMobile ? 'drawer' : 'modal'}
 *   isOpen={isOpen}
 *   onClose={handleClose}
 * >
 *   <MyDialog onClose={handleClose} />
 * </ShellContainer>
 * ```
 */

// Protocol types and utilities
export {
  // Types
  type ContainerType,
  type DrawerPosition,
  type AnimationPreset,
  type BackdropConfig,
  type AnimationConfig,
  type KeyboardConfig,
  type ScrollConfig,
  type SizeConfig,
  type ThemeConfig,
  type ShellRequirements,
  type ShellContext,
  type ResolvedShellConfig,

  // Defaults
  defaultBackdrop,
  defaultAnimation,
  defaultKeyboard,
  defaultScroll,
  defaultSize,
  defaultTheme,
  containerDefaults,

  // Utilities
  getAnimationPreset,
  resolveZIndex,
  resolveWidth,
  resolveShellConfig,
  zIndexLayers,
  widthPresets,
  paddingPresets,
} from './protocol';

// Context and hooks
export {
  ShellProvider,
  useShellContext,
  useRequiredShellContext,
  useShell,
  type ShellProviderProps,
  type UseShellOptions,
} from './context';

// Container components
export {
  ModalContainer,
  DrawerContainer,
  PanelContainer,
  ReportShellContainer,
  ShellContainer,
  type BaseContainerProps,
  type ModalContainerProps,
  type DrawerContainerProps,
  type PanelContainerProps,
  type ReportShellContainerProps,
  type ShellContainerProps,
} from './containers';
