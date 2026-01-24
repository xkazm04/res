'use client';

import { useTechMarketStore } from '@/src/stores/techMarketStore';
import { TechMarketHeader } from './TechMarketHeader';
import { TechTimelinePanel } from './panels/TechTimelinePanel';
import { PredictionMatrixPanel } from './panels/PredictionMatrixPanel';
import { AdoptionCurvesPanel } from './panels/AdoptionCurvesPanel';
import { ScenarioPanel } from './panels/ScenarioPanel';
import { TechTrendsPanel } from './panels/TechTrendsPanel';
import { Cpu, TrendingUp, BarChart3, GitBranch, Calendar, Target } from 'lucide-react';

export function TechMarketDashboard() {
  const { session, activeView, isLoading, error, getDomainSummary } = useTechMarketStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center">
        <div className="text-center">
          <Cpu className="w-12 h-12 text-violet-500 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Loading tech market analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tech market session loaded</p>
        </div>
      </div>
    );
  }

  const summary = getDomainSummary();

  return (
    <div className="min-h-screen bg-[#06060a] text-white">
      <TechMarketHeader />
      <main className="h-[calc(100vh-120px)] overflow-auto p-4">
        {activeView === 'overview' && <OverviewGrid summary={summary} />}
        {activeView === 'timeline' && <TechTimelinePanel />}
        {activeView === 'matrix' && <PredictionMatrixPanel />}
        {activeView === 'adoption' && <AdoptionCurvesPanel />}
        {activeView === 'scenarios' && <ScenarioPanel />}
        {activeView === 'trends' && <TechTrendsPanel />}
      </main>
    </div>
  );
}

interface OverviewGridProps {
  summary: ReturnType<typeof useTechMarketStore.getState>['getDomainSummary'] extends () => infer R ? R : never;
}

function OverviewGrid({ summary }: OverviewGridProps) {
  const {
    timelineEvents,
    matrixItems,
    trends2025,
    scenarios,
    setActiveView,
  } = useTechMarketStore();

  const predictions2026 = timelineEvents.filter(e => e.isPrediction);
  const risks = matrixItems.filter(m => m.type === 'risk');
  const opportunities = matrixItems.filter(m => m.type === 'opportunity');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="2025 Events"
          value={timelineEvents.filter(e => !e.isPrediction).length}
          color="emerald"
          onClick={() => setActiveView('timeline')}
        />
        <StatCard
          icon={TrendingUp}
          label="2026 Predictions"
          value={predictions2026.length}
          color="violet"
          onClick={() => setActiveView('timeline')}
        />
        <StatCard
          icon={Target}
          label="Opportunities"
          value={opportunities.length}
          color="blue"
          onClick={() => setActiveView('matrix')}
        />
        <StatCard
          icon={BarChart3}
          label="Risk Factors"
          value={risks.length}
          color="red"
          onClick={() => setActiveView('matrix')}
        />
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline Preview */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:border-violet-500/50 transition-colors"
          onClick={() => setActiveView('timeline')}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold">Timeline: 2025 - 2026</h3>
          </div>
          <div className="space-y-2">
            {timelineEvents.slice(0, 4).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    event.isPrediction ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {event.quarter} {event.year}
                  </span>
                  <span className="text-zinc-300 truncate max-w-[200px]">{event.title}</span>
                </div>
                <span className="text-zinc-500 text-xs">
                  {Math.round(event.confidenceScore * 100)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">Click to see full timeline</p>
        </div>

        {/* Matrix Preview */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:border-violet-500/50 transition-colors"
          onClick={() => setActiveView('matrix')}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Risk/Opportunity Matrix</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-2">Top Opportunities</p>
              {opportunities.slice(0, 2).map((opp) => (
                <div key={opp.id} className="text-sm text-emerald-400 truncate">
                  {opp.title}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-2">Key Risks</p>
              {risks.slice(0, 2).map((risk) => (
                <div key={risk.id} className="text-sm text-red-400 truncate">
                  {risk.title}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">Click to see full matrix</p>
        </div>

        {/* Trends Preview */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:border-violet-500/50 transition-colors"
          onClick={() => setActiveView('trends')}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold">2025 Trends</h3>
          </div>
          <div className="space-y-3">
            {trends2025.slice(0, 3).map((trend) => (
              <div key={trend.id} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{trend.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                      style={{ width: `${trend.momentum}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8">{trend.momentum}%</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">Click to see all trends</p>
        </div>

        {/* Scenarios Preview */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:border-violet-500/50 transition-colors"
          onClick={() => setActiveView('scenarios')}
        >
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold">Scenario Analysis</h3>
          </div>
          <div className="space-y-3">
            {scenarios.slice(0, 2).map((scenario) => (
              <div key={scenario.id} className="text-sm">
                <p className="text-zinc-300 truncate">{scenario.predictionTitle}</p>
                <div className="flex gap-2 mt-1">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                    Bull: {scenario.scenarios.bull.probability}%
                  </span>
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                    Base: {scenario.scenarios.base.probability}%
                  </span>
                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                    Bear: {scenario.scenarios.bear.probability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">Click to explore scenarios</p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'emerald' | 'violet' | 'blue' | 'red' | 'amber';
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, color, onClick }: StatCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${colorClasses[color]}`}
      onClick={onClick}
    >
      <Icon className="w-6 h-6 mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}
