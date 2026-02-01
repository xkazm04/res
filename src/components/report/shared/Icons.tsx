// Report Icon Components
// Frequently used icons are synchronous, less common icons use lazy loading
import { lazy, Suspense, ComponentType } from 'react';

// =============================================================================
// FREQUENTLY USED ICONS (Synchronous - used in 3+ files)
// =============================================================================

export function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

// =============================================================================
// LESS FREQUENT ICONS (Lazy loaded - used in 1-2 files)
// =============================================================================

// Raw icon components for lazy loading
const GridIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const DocumentIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

const UsersIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" />
  </svg>
);

const PersonIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const CheckCircleIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ArrowRightIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const XCircleIconRaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// Lazy module loaders - returns promise of component module
const LazyGridIcon = lazy(() => Promise.resolve({ default: GridIconRaw }));
const LazyDocumentIcon = lazy(() => Promise.resolve({ default: DocumentIconRaw }));
const LazyUsersIcon = lazy(() => Promise.resolve({ default: UsersIconRaw }));
const LazyPersonIcon = lazy(() => Promise.resolve({ default: PersonIconRaw }));
const LazySearchIcon = lazy(() => Promise.resolve({ default: SearchIconRaw }));
const LazyCheckCircleIcon = lazy(() => Promise.resolve({ default: CheckCircleIconRaw }));
const LazyArrowRightIcon = lazy(() => Promise.resolve({ default: ArrowRightIconRaw }));
const LazyXCircleIcon = lazy(() => Promise.resolve({ default: XCircleIconRaw }));

// Wrapper to provide fallback for lazy icons
function withLazyWrapper<P extends object>(LazyComponent: ComponentType<P>) {
  return function LazyIconWrapper(props: P) {
    return (
      <Suspense fallback={<span className="w-4 h-4 inline-block" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Export lazy-loaded icons with Suspense wrapper
export const GridIcon = withLazyWrapper(LazyGridIcon);
export const DocumentIcon = withLazyWrapper(LazyDocumentIcon);
export const UsersIcon = withLazyWrapper(LazyUsersIcon);
export const PersonIcon = withLazyWrapper(LazyPersonIcon);
export const SearchIcon = withLazyWrapper(LazySearchIcon);
export const CheckCircleIcon = withLazyWrapper(LazyCheckCircleIcon);
export const ArrowRightIcon = withLazyWrapper(LazyArrowRightIcon);
export const XCircleIcon = withLazyWrapper(LazyXCircleIcon);
