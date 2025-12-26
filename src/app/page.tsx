'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { getMockSessionData, getMockEntities } from '@/src/lib/mockData';
import { Search, TrendingUp, Target } from 'lucide-react';

// Investigation components
import { useInvestigationStore } from '@/src/stores/investigationStore';
import { DetectiveBoardCanvas } from '@/src/components/investigation/DetectiveBoardCanvas';
import { TimelineStrip } from '@/src/components/investigation/TimelineStrip';
import { EntitySidebar } from '@/src/components/investigation/EntitySidebar';
import { PerspectivePanel } from '@/src/components/investigation/PerspectivePanel';
import { ContradictionAlert } from '@/src/components/investigation/ContradictionAlert';

// Financial components
import { useFinancialStore } from '@/src/stores/financialStore';
import { FinancialDashboard } from '@/src/components/financial/FinancialDashboard';

// Market Research components
import { useResearchStore } from '@/src/stores/researchStore';
import { ResearchDashboard } from '@/src/components/market-research/ResearchDashboard';

type TemplateType = 'investigation' | 'financial' | 'market';

const templates = [
  {
    id: 'investigation' as TemplateType,
    title: 'Investigation',
    subtitle: 'Detective Board',
    icon: Search,
    bgClass: 'bg-[#030303]',
    activeClass: 'bg-[#00ff41] text-white',
    hoverClass: 'hover:bg-[#00ff41]/20',
  },
  {
    id: 'financial' as TemplateType,
    title: 'Financial',
    subtitle: 'Bloomberg Terminal',
    icon: TrendingUp,
    bgClass: 'bg-[#0a0a0a]',
    activeClass: 'bg-emerald-600 text-white',
    hoverClass: 'hover:bg-emerald-600/20',
  },
  {
    id: 'market' as TemplateType,
    title: 'Market Research',
    subtitle: 'Competitive Intel',
    icon: Target,
    bgClass: 'bg-[#0a0a0f]',
    activeClass: 'bg-violet-600 text-white',
    hoverClass: 'hover:bg-violet-600/20',
  },
];

export default function Home() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('investigation');
  const [isLoaded, setIsLoaded] = useState(false);

  // Investigation store
  const {
    session: invSession,
    setSession: setInvSession,
    initializeCardPositions,
    showTimeline,
    showEntities,
    showPerspectives,
    showContradictions,
  } = useInvestigationStore();

  // Financial store
  const { setSession: setFinSession } = useFinancialStore();

  // Market Research store
  const { setSession: setMktSession } = useResearchStore();

  // Load mock data on mount
  useEffect(() => {
    // Load investigation data
    const invData = getMockSessionData('investigation');
    setInvSession(invData);
    initializeCardPositions(invData.findings);

    // Load financial data
    const finData = getMockSessionData('financial');
    setFinSession(finData);

    // Load market research data
    const mktData = getMockSessionData('market');
    setMktSession(mktData);

    setIsLoaded(true);
  }, [setInvSession, initializeCardPositions, setFinSession, setMktSession]);

  const currentTemplate = templates.find((t) => t.id === activeTemplate)!;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen', currentTemplate.bgClass)}>
      {/* Tab Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-1">
            {templates.map((t) => {
              const Icon = t.icon;
              const isActive = activeTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive ? t.activeClass : `text-zinc-400 ${t.hoverClass}`
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.title}</span>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-zinc-500">
            <span className="text-zinc-400">{currentTemplate.subtitle}</span>
            <span className="mx-2">•</span>
            <span>Mock Data</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-14">
        {activeTemplate === 'investigation' && <InvestigationView />}
        {activeTemplate === 'financial' && <FinancialView />}
        {activeTemplate === 'market' && <MarketView />}
      </div>
    </div>
  );
}

function InvestigationView() {
  const {
    session,
    showTimeline,
    showEntities,
    showPerspectives,
    showContradictions,
    toggleTimeline,
    toggleEntities,
    togglePerspectives,
  } = useInvestigationStore();

  if (!session) return null;

  return (
    <div className="text-[#00ff41]">
      {/* Cork board texture overlay */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Toggle buttons */}
      <div className="fixed top-20 right-4 z-40 flex flex-col gap-2">
        <ToggleButton active={showEntities} onClick={toggleEntities} label="Entities" />
        <ToggleButton active={showTimeline} onClick={toggleTimeline} label="Timeline" />
        <ToggleButton active={showPerspectives} onClick={togglePerspectives} label="Perspectives" />
      </div>

      {/* Main content area */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Entity sidebar */}
        {showEntities && (
          <EntitySidebar findings={session.findings} className="w-64 shrink-0" />
        )}

        {/* Main canvas */}
        <div className="flex-1 flex flex-col relative">
          <DetectiveBoardCanvas className="flex-1" />

          {/* Timeline strip at bottom */}
          {showTimeline && (
            <TimelineStrip
              findings={session.findings}
              gaps={session.gaps}
              className="h-32 shrink-0"
            />
          )}
        </div>

        {/* Perspectives panel */}
        {showPerspectives && (
          <PerspectivePanel perspectives={session.perspectives} className="w-80 shrink-0" />
        )}
      </div>

      {/* Contradiction alerts overlay */}
      {showContradictions && session.contradictions.length > 0 && (
        <ContradictionAlert
          contradictions={session.contradictions}
          findings={session.findings}
        />
      )}
    </div>
  );
}

function FinancialView() {
  const { session } = useFinancialStore();

  if (!session) return null;

  return (
    <div className="text-zinc-100 font-mono">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-emerald-400">{session.title}</h1>
        <p className="text-xs text-zinc-500 mt-1">{session.query}</p>
      </div>
      <FinancialDashboard />
    </div>
  );
}

function MarketView() {
  return <ResearchDashboard />;
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-medium rounded transition-all',
        active
          ? 'bg-[#00ff41] text-white'
          : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'
      )}
    >
      {label}
    </button>
  );
}
