'use client';

import { useFinancialStore } from '@/src/stores/financialStore';
import { OverviewPanel } from './panels/OverviewPanel';
import { MoneyFlowPanel } from './panels/MoneyFlowPanel';
import { StakeholderPanel } from './panels/StakeholderPanel';
import { TimelinePanel } from './panels/TimelinePanel';
import { SourcesPanel } from './panels/SourcesPanel';

export function FinancialDashboard() {
  const { session, activeTab } = useFinancialStore();

  if (!session) return null;

  return (
    <main className="h-[calc(100vh-88px)] overflow-hidden">
      {activeTab === 'overview' && <OverviewPanel />}
      {activeTab === 'flows' && <MoneyFlowPanel />}
      {activeTab === 'stakeholders' && <StakeholderPanel />}
      {activeTab === 'timeline' && <TimelinePanel />}
      {activeTab === 'sources' && <SourcesPanel />}
    </main>
  );
}
