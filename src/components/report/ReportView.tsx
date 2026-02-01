'use client';

import { useState, useId, useRef, useEffect, useCallback, useTransition, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SessionWithDetails } from '@/src/types/research';
import { ReportThemeProvider, useThemeStyles, type ReportTheme } from './core/ThemeContext';
import { NavigationProvider, type TabId } from './core/NavigationContext';
import { ReportShell } from './ReportShell';
import { ThemedSidebar } from './ThemedSidebar';
import { tabSkeletons } from './shared/TabSkeletons';
import { usePrefetchTabData } from '@/src/hooks/usePrefetchTabData';
import { useSessionStats } from '@/src/hooks/useSessionStats';

// Lazy load view components for code splitting
// Only the active tab's component is loaded, deferring ~80% of view code
const OverviewView = lazy(() => import('./views/OverviewView').then(m => ({ default: m.OverviewView })));
const FindingsView = lazy(() => import('./views/FindingsView').then(m => ({ default: m.FindingsView })));
const SourcesView = lazy(() => import('./views/SourcesView').then(m => ({ default: m.SourcesView })));
const PerspectivesView = lazy(() => import('./views/PerspectivesView').then(m => ({ default: m.PerspectivesView })));
const AnalysisView = lazy(() => import('./views/AnalysisView').then(m => ({ default: m.AnalysisView })));
const EntitiesView = lazy(() => import('./views/EntitiesView').then(m => ({ default: m.EntitiesView })));

interface ReportViewProps {
  session: SessionWithDetails;
  onClose: () => void;
  theme?: ReportTheme;
}

export function ReportView({ session, onClose, theme = 'radar' }: ReportViewProps) {
  return (
    <ReportThemeProvider theme={theme}>
      <ReportViewInner session={session} onClose={onClose} />
    </ReportThemeProvider>
  );
}

// Tab order for determining navigation direction
const TAB_ORDER: TabId[] = ['overview', 'findings', 'sources', 'perspectives', 'analysis', 'entities'];

function ReportViewInner({ session, onClose }: Omit<ReportViewProps, 'theme'>) {
  const styles = useThemeStyles();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const titleId = useId();

  // Cross-view navigation state
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Use transition for non-urgent tab switches to enable skeleton display
  const [isPending, startTransition] = useTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const skeletonTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track navigation direction for page transitions
  const prevTabRef = useRef<TabId>('overview');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Prefetch tab data on hover for instant tab switches
  const { prefetchTab, clearCache } = usePrefetchTabData(session);

  // Clear cache when session changes
  useEffect(() => {
    clearCache();
  }, [session.id, clearCache]);

  // Handle tab hover - prefetch the tab's data
  const handleTabHover = useCallback((tab: TabId) => {
    prefetchTab(tab);
  }, [prefetchTab]);

  // Clean up skeleton timeout on unmount
  useEffect(() => {
    return () => {
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current);
      }
    };
  }, []);

  const handleTabChange = useCallback((newTab: TabId) => {
    const prevIndex = TAB_ORDER.indexOf(prevTabRef.current);
    const newIndex = TAB_ORDER.indexOf(newTab);
    setDirection(newIndex > prevIndex ? 1 : -1);
    prevTabRef.current = newTab;

    // Show skeleton immediately for perceived responsiveness
    setShowSkeleton(true);

    // Clear any existing timeout
    if (skeletonTimeoutRef.current) {
      clearTimeout(skeletonTimeoutRef.current);
    }

    // Use startTransition for the actual tab change (allows React to deprioritize)
    startTransition(() => {
      setActiveTab(newTab);
    });

    // Hide skeleton after a brief moment (gives skeleton time to show even for fast loads)
    skeletonTimeoutRef.current = setTimeout(() => {
      setShowSkeleton(false);
    }, 80);
  }, []);

  // Handle cross-view navigation (from findings to entities/sources)
  const handleCrossNavigation = useCallback(({ tab, entityId, sourceId }: { tab: TabId; entityId?: string; sourceId?: string }) => {
    // Set the selection state first
    if (entityId !== undefined) setSelectedEntityId(entityId || null);
    if (sourceId !== undefined) setSelectedSourceId(sourceId || null);

    // Then navigate to the tab
    handleTabChange(tab);
  }, [handleTabChange]);

  // Use memoized stats hook that depends on stable primitives (session.id, array lengths)
  // instead of the entire session object reference
  const stats = useSessionStats(session);

  return (
    <NavigationProvider onNavigate={handleCrossNavigation} selectedEntityId={selectedEntityId} selectedSourceId={selectedSourceId}>
      <ReportShell onClose={onClose} titleId={titleId}>
        <ThemedSidebar activeTab={activeTab} onTabChange={handleTabChange} onTabHover={handleTabHover} stats={stats} onClose={onClose} />

        <main className={`flex-1 flex flex-col overflow-hidden ${styles.bg}`}>
          {/* Header */}
          <header className={`px-6 py-4 border-b ${styles.border}`}>
            <motion.h1 id={titleId} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`text-lg font-bold ${styles.text}`}>
              {session.title}
            </motion.h1>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                {(showSkeleton || isPending) ? (
                  <motion.div
                    key={`skeleton-${activeTab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {tabSkeletons[activeTab]?.()}
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: direction * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Suspense fallback={tabSkeletons[activeTab]?.()}>
                      {activeTab === 'overview' && <OverviewView session={session} stats={stats} />}
                      {activeTab === 'findings' && <FindingsView findings={session.findings || []} sources={session.sources || []} />}
                      {activeTab === 'sources' && <SourcesView sources={session.sources || []} initialSelectedId={selectedSourceId} />}
                      {activeTab === 'perspectives' && <PerspectivesView perspectives={session.perspectives || []} />}
                      {activeTab === 'analysis' && <AnalysisView contradictions={session.contradictions || []} gaps={session.gaps || []} causalChains={session.causal_chains || []} />}
                      {activeTab === 'entities' && <EntitiesView entities={session.entities || []} initialSelectedId={selectedEntityId} />}
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </ReportShell>
    </NavigationProvider>
  );
}
