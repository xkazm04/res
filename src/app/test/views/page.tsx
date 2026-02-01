'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ReportThemeProvider, type ReportTheme } from '@/src/components/report/core/ThemeContext';
import { NavigationProvider } from '@/src/components/report/core/NavigationContext';
import { OverviewView } from '@/src/components/report/views/OverviewView';
import { FindingsView } from '@/src/components/report/views/FindingsView';
import { SourcesView } from '@/src/components/report/views/SourcesView';
import { AnalysisView } from '@/src/components/report/views/AnalysisView';
import { EntitiesView } from '@/src/components/report/views/EntitiesView';
import { PerspectivesView } from '@/src/components/report/views/PerspectivesView';
import { mockSession, mockStats, mockFindings, mockSources, mockContradictions, mockGaps, mockCausalChains, mockEntities, mockPerspectives } from './mockData';

function ViewRenderer() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'overview';
  const theme = (searchParams.get('theme') || 'radar') as ReportTheme;

  const renderView = () => {
    switch (view) {
      case 'overview':
        return <OverviewView session={mockSession} stats={mockStats} />;
      case 'findings':
        return (
          <FindingsView
            findings={mockFindings}
            sources={mockSources}
          />
        );
      case 'sources':
        return (
          <SourcesView
            sources={mockSources}
          />
        );
      case 'analysis':
        return (
          <AnalysisView
            contradictions={mockContradictions}
            gaps={mockGaps}
            causalChains={mockCausalChains}
          />
        );
      case 'entities':
        return <EntitiesView entities={mockEntities} />;
      case 'perspectives':
        return <PerspectivesView perspectives={mockPerspectives} />;
      default:
        return <div>Unknown view: {view}</div>;
    }
  };

  return (
    <ReportThemeProvider theme={theme}>
      <NavigationProvider onNavigate={() => {}} selectedEntityId={null} selectedSourceId={null}>
        <div
          data-testid="view-container"
          className={`min-h-screen p-6 ${
            theme === 'radar' ? 'bg-slate-950' : 'bg-stone-100'
          }`}
        >
          {renderView()}
        </div>
      </NavigationProvider>
    </ReportThemeProvider>
  );
}

export default function TestViewsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ViewRenderer />
    </Suspense>
  );
}
