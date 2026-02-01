'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReportTheme } from './core/ThemeContext';
import { AnimatedNumber, AnimatedProgressRing, PulsingDot } from './core/AnimatedNumber';

type TabId = 'overview' | 'findings' | 'sources' | 'perspectives' | 'analysis' | 'entities';

const SIDEBAR_COLLAPSED_KEY = 'report-sidebar-collapsed';

// Hook to persist sidebar collapsed state
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return { collapsed, toggle };
}

// Collapse toggle button with rotating chevron - uses CSS transition instead of Framer Motion
function CollapseToggle({ collapsed, onToggle, theme }: { collapsed: boolean; onToggle: () => void; theme: 'radar' | 'swiss' }) {
  const isRadar = theme === 'radar';
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-center py-2 transition-colors ${
        isRadar
          ? 'text-slate-400 hover:text-cyan-400 border-t border-cyan-500/10'
          : 'text-stone-400 hover:text-stone-900 border-t border-stone-100'
      }`}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg
        className="w-5 h-5 transition-transform duration-200 ease-out"
        style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

// Unified tab indicator with smooth sliding animation via layoutId
function TabIndicator({ theme }: { theme: 'radar' | 'swiss' }) {
  const isRadar = theme === 'radar';
  return (
    <motion.div
      layoutId="tab-indicator"
      className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-full ${
        isRadar ? 'bg-cyan-400' : 'bg-stone-900'
      }`}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
      }}
    />
  );
}

interface ThemedSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onTabHover?: (tab: TabId) => void;
  stats: {
    findings: number;
    sources: number;
    perspectives: number;
    contradictions: number;
    gaps: number;
    avgConfidence: number;
    redFlags: number;
    entities: number;
  };
  onClose: () => void;
}

const tabs: { id: TabId; label: string; key: keyof ThemedSidebarProps['stats'] | null }[] = [
  { id: 'overview', label: 'Overview', key: null },
  { id: 'findings', label: 'Findings', key: 'findings' },
  { id: 'sources', label: 'Sources', key: 'sources' },
  { id: 'perspectives', label: 'Perspectives', key: 'perspectives' },
  { id: 'analysis', label: 'Analysis', key: null },
  { id: 'entities', label: 'Entities', key: 'entities' },
];

export function ThemedSidebar({ activeTab, onTabChange, onTabHover, stats, onClose }: ThemedSidebarProps) {
  const { theme } = useReportTheme();
  const { collapsed, toggle } = useSidebarCollapsed();

  return theme === 'radar' ? (
    <RadarSidebar activeTab={activeTab} onTabChange={onTabChange} onTabHover={onTabHover} stats={stats} onClose={onClose} collapsed={collapsed} onToggleCollapse={toggle} />
  ) : (
    <SwissSidebar activeTab={activeTab} onTabChange={onTabChange} onTabHover={onTabHover} stats={stats} onClose={onClose} collapsed={collapsed} onToggleCollapse={toggle} />
  );
}

function RadarSidebar({ activeTab, onTabChange, onTabHover, stats, onClose, collapsed, onToggleCollapse }: ThemedSidebarProps & { collapsed: boolean; onToggleCollapse: () => void }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 224 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col border-r border-cyan-500/20 bg-slate-950/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">DR</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-sm font-semibold text-white whitespace-nowrap">Deep Research</div>
              <div className="text-[10px] text-cyan-400/60 whitespace-nowrap">Intelligence Report</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Confidence Ring */}
      <div className={`flex justify-center border-b border-cyan-500/10 ${collapsed ? 'p-2' : 'p-4'}`}>
        <AnimatedProgressRing
          value={stats.avgConfidence}
          size={collapsed ? 40 : 80}
          strokeWidth={collapsed ? 4 : 6}
          color="#22d3ee"
          bgColor="rgba(34,211,238,0.1)"
          showValue={!collapsed}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {tabs.map((tab, i) => {
          const count = tab.key ? stats[tab.key] : tab.id === 'analysis' ? stats.contradictions + stats.gaps : null;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => onTabHover?.(tab.id)}
              title={collapsed ? tab.label : undefined}
              className={`relative w-full px-3 py-2 rounded-lg text-left text-sm transition-all flex items-center gap-2 animate-slide-in-left ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {isActive && <TabIndicator theme="radar" />}
              {collapsed ? (
                <span className="text-xs font-bold">{tab.label.charAt(0)}</span>
              ) : (
                <>
                  <span className="flex-1 whitespace-nowrap">{tab.label}</span>
                  {count !== null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                      <AnimatedNumber value={count} />
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats */}
      {!collapsed && stats.redFlags > 0 && (
        <div className="p-3 border-t border-cyan-500/10 space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-rose-500/10 border border-rose-500/20">
            <PulsingDot color="bg-rose-500" />
            <span className="text-xs text-rose-400 whitespace-nowrap">{stats.redFlags} Red Flags</span>
          </div>
        </div>
      )}

      {/* Collapse indicator for red flags when collapsed */}
      {collapsed && stats.redFlags > 0 && (
        <div className="px-2 py-2 border-t border-cyan-500/10 flex justify-center">
          <PulsingDot color="bg-rose-500" />
        </div>
      )}

      {/* Close */}
      {!collapsed && (
        <div className="p-3">
          <button onClick={onClose} className="w-full px-3 py-2 text-xs text-slate-400 hover:text-white border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all whitespace-nowrap">
            Close Report
          </button>
        </div>
      )}

      {/* Collapse Toggle */}
      <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} theme="radar" />
    </motion.aside>
  );
}

function SwissSidebar({ activeTab, onTabChange, onTabHover, stats, onClose, collapsed, onToggleCollapse }: ThemedSidebarProps & { collapsed: boolean; onToggleCollapse: () => void }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 208 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col border-r border-stone-200 bg-white overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        {collapsed ? (
          <div className="w-8 h-8 rounded bg-stone-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
        ) : (
          <>
            <div className="text-lg font-bold text-stone-900 tracking-tight whitespace-nowrap">Research</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-0.5 whitespace-nowrap">Intelligence Report</div>
          </>
        )}
      </div>

      {/* Big number */}
      <div className={`border-b border-stone-100 ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className={`font-bold text-stone-900 tabular-nums ${collapsed ? 'text-lg text-center' : 'text-4xl'}`}>
          <AnimatedNumber value={stats.avgConfidence} suffix="%" />
        </div>
        {!collapsed && (
          <div className="text-[10px] uppercase tracking-wider text-stone-400 mt-1 whitespace-nowrap">Confidence Score</div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {tabs.map((tab, i) => {
          const count = tab.key ? stats[tab.key] : tab.id === 'analysis' ? stats.contradictions + stats.gaps : null;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => onTabHover?.(tab.id)}
              title={collapsed ? tab.label : undefined}
              className={`relative w-full px-4 py-2.5 text-left text-sm flex items-center transition-all animate-fade-in ${
                isActive
                  ? 'bg-stone-50 text-stone-900 font-medium'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {isActive && <TabIndicator theme="swiss" />}
              {collapsed ? (
                <span className="text-xs font-bold">{tab.label.charAt(0)}</span>
              ) : (
                <>
                  <span className="flex-1 whitespace-nowrap">{tab.label}</span>
                  {count !== null && (
                    <span className="text-xs tabular-nums text-stone-400">{count}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats */}
      {!collapsed && stats.redFlags > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 border-l-2 border-rose-600 bg-rose-50">
          <div className="text-xs font-medium text-rose-700 whitespace-nowrap">{stats.redFlags} Issues Found</div>
        </div>
      )}

      {/* Red flag indicator when collapsed */}
      {collapsed && stats.redFlags > 0 && (
        <div className="px-2 py-2 flex justify-center">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
        </div>
      )}

      {/* Close */}
      {!collapsed && (
        <div className="p-3 border-t border-stone-100">
          <button onClick={onClose} className="w-full px-3 py-2 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-900 rounded transition-all whitespace-nowrap">
            Close
          </button>
        </div>
      )}

      {/* Collapse Toggle */}
      <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} theme="swiss" />
    </motion.aside>
  );
}
