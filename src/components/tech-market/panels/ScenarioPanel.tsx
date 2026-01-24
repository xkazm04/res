'use client';

import { useTechMarketStore } from '@/src/stores/techMarketStore';
import { GitBranch, TrendingUp, TrendingDown, Minus, Target, Clock } from 'lucide-react';
import { DOMAIN_LABELS, DOMAIN_COLORS } from '@/src/types/techMarket';
import type { TechScenario, ScenarioType } from '@/src/types/techMarket';
import { cn } from '@/src/lib/utils';

const SCENARIO_CONFIG: Record<ScenarioType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  bull: {
    label: 'Bull Case',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  base: {
    label: 'Base Case',
    icon: Minus,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  bear: {
    label: 'Bear Case',
    icon: TrendingDown,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
};

export function ScenarioPanel() {
  const { scenarios, activeDomain, selectedScenarioType, setSelectedScenarioType } = useTechMarketStore();

  const filteredScenarios = activeDomain === 'all'
    ? scenarios
    : scenarios.filter(s => s.domain === activeDomain);

  if (filteredScenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No scenarios match the current filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-amber-400" />
          Scenario Analysis
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Bull, Base, and Bear case projections for 2026 predictions
        </p>
      </div>

      {/* Scenario Type Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-zinc-500">Focus on:</span>
        {(['all', 'bull', 'base', 'bear'] as const).map((type) => {
          const config = type === 'all' ? null : SCENARIO_CONFIG[type];
          const Icon = config?.icon || GitBranch;

          return (
            <button
              key={type}
              onClick={() => setSelectedScenarioType(type)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                selectedScenarioType === type
                  ? type === 'all'
                    ? 'bg-zinc-700 text-white'
                    : `${config?.bgColor} ${config?.color} border ${config?.borderColor}`
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-zinc-700'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {type === 'all' ? 'All Scenarios' : config?.label}
            </button>
          );
        })}
      </div>

      {/* Scenario Cards */}
      <div className="space-y-6">
        {filteredScenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            focusedType={selectedScenarioType}
          />
        ))}
      </div>
    </div>
  );
}

interface ScenarioCardProps {
  scenario: TechScenario;
  focusedType: ScenarioType | 'all';
}

function ScenarioCard({ scenario, focusedType }: ScenarioCardProps) {
  const domainColor = DOMAIN_COLORS[scenario.domain] || 'slate';
  const scenarioTypes: ScenarioType[] = ['bull', 'base', 'bear'];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-1.5 py-0.5 bg-${domainColor}-500/20 text-${domainColor}-400 text-xs rounded`}>
                {DOMAIN_LABELS[scenario.domain]}
              </span>
              <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded">
                {scenario.scenarios.base.timeframe}
              </span>
            </div>
            <h4 className="font-semibold text-white text-lg">{scenario.predictionTitle}</h4>
          </div>
        </div>

        {/* Probability Distribution Bar */}
        <div className="mt-4">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${scenario.scenarios.bull.probability}%` }}
            />
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${scenario.scenarios.base.probability}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${scenario.scenarios.bear.probability}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-zinc-500">
            <span>Bull: {scenario.scenarios.bull.probability}%</span>
            <span>Base: {scenario.scenarios.base.probability}%</span>
            <span>Bear: {scenario.scenarios.bear.probability}%</span>
          </div>
        </div>
      </div>

      {/* Scenario Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
        {scenarioTypes.map((type) => {
          const config = SCENARIO_CONFIG[type];
          const data = scenario.scenarios[type];
          const isFocused = focusedType === 'all' || focusedType === type;
          const Icon = config.icon;

          return (
            <div
              key={type}
              className={cn(
                'p-4 transition-opacity',
                isFocused ? 'opacity-100' : 'opacity-40'
              )}
            >
              {/* Scenario Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className={`font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <span className={`text-lg font-bold ${config.color}`}>
                  {data.probability}%
                </span>
              </div>

              {/* Outcome */}
              <p className="text-sm text-zinc-400 mb-3">{data.outcome}</p>

              {/* Implications */}
              <div className="space-y-2 mb-3">
                <p className="text-xs text-zinc-500 font-medium">Implications:</p>
                {data.implications.slice(0, 3).map((implication, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Target className={`w-3 h-3 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <span className="text-zinc-300">{implication}</span>
                  </div>
                ))}
              </div>

              {/* Timeframe */}
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                <span>{data.timeframe}</span>
              </div>

              {/* Key Assumptions */}
              {data.keyAssumptions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Key Assumptions:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.keyAssumptions.slice(0, 3).map((assumption, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 text-[10px] rounded ${config.bgColor} ${config.color}`}
                      >
                        {assumption}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
