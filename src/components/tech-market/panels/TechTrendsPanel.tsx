'use client';

import { useTechMarketStore } from '@/src/stores/techMarketStore';
import { TrendingUp, TrendingDown, Minus, Flame, Zap, ArrowUpRight } from 'lucide-react';
import { DOMAIN_LABELS, DOMAIN_COLORS } from '@/src/types/techMarket';
import type { TechTrend2025 } from '@/src/types/techMarket';

export function TechTrendsPanel() {
  const { trends2025, activeDomain } = useTechMarketStore();

  const filteredTrends = activeDomain === 'all'
    ? trends2025
    : trends2025.filter(t => t.domain === activeDomain);

  // Sort by momentum
  const sortedTrends = [...filteredTrends].sort((a, b) => b.momentum - a.momentum);

  if (sortedTrends.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No trends match the current filters</p>
        </div>
      </div>
    );
  }

  // Group by direction
  const accelerating = sortedTrends.filter(t => t.direction === 'accelerating');
  const stable = sortedTrends.filter(t => t.direction === 'stable');
  const decelerating = sortedTrends.filter(t => t.direction === 'decelerating');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          2025 Technology Trends
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          {filteredTrends.length} trends tracked across {activeDomain === 'all' ? 'all domains' : DOMAIN_LABELS[activeDomain]}
        </p>
      </div>

      {/* Trajectory Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Accelerating</span>
          </div>
          <p className="text-2xl font-bold text-white">{accelerating.length}</p>
          <p className="text-xs text-zinc-500">trends gaining momentum</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Minus className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400 font-semibold">Stable</span>
          </div>
          <p className="text-2xl font-bold text-white">{stable.length}</p>
          <p className="text-xs text-zinc-500">trends holding steady</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-semibold">Decelerating</span>
          </div>
          <p className="text-2xl font-bold text-white">{decelerating.length}</p>
          <p className="text-xs text-zinc-500">trends losing steam</p>
        </div>
      </div>

      {/* Top Trends */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          Hottest Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTrends.slice(0, 6).map((trend, idx) => (
            <TrendCard key={trend.id} trend={trend} rank={idx + 1} />
          ))}
        </div>
      </div>

      {/* All Trends by Domain */}
      {activeDomain === 'all' && (
        <div className="space-y-6">
          {(['ai_ml', 'software_development', 'cloud_infrastructure', 'devops_platform', 'enterprise_stack', 'security'] as const).map((domain) => {
            const domainTrends = sortedTrends.filter(t => t.domain === domain);
            if (domainTrends.length === 0) return null;

            const domainColor = DOMAIN_COLORS[domain] || 'slate';

            return (
              <div key={domain}>
                <h3 className={`text-sm font-semibold text-${domainColor}-400 mb-3`}>
                  {DOMAIN_LABELS[domain]} ({domainTrends.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {domainTrends.map((trend) => (
                    <TrendCard key={trend.id} trend={trend} compact />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered Domain View */}
      {activeDomain !== 'all' && sortedTrends.length > 6 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">
            All {DOMAIN_LABELS[activeDomain]} Trends
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTrends.slice(6).map((trend) => (
              <TrendCard key={trend.id} trend={trend} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TrendCardProps {
  trend: TechTrend2025;
  rank?: number;
  compact?: boolean;
}

function TrendCard({ trend, rank, compact }: TrendCardProps) {
  const domainColor = DOMAIN_COLORS[trend.domain] || 'slate';

  const DirectionIcon = trend.direction === 'accelerating' ? TrendingUp :
    trend.direction === 'decelerating' ? TrendingDown : Minus;

  const directionColor = trend.direction === 'accelerating' ? 'text-emerald-400' :
    trend.direction === 'decelerating' ? 'text-amber-400' : 'text-blue-400';

  if (compact) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DirectionIcon className={`w-3.5 h-3.5 ${directionColor}`} />
              <span className="text-sm font-medium text-white truncate">{trend.name}</span>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-1">{trend.description}</p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Zap className="w-3 h-3 text-violet-400" />
            <span className="text-sm font-semibold text-violet-400">{trend.momentum}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {rank && (
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              rank <= 3 ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {rank}
            </span>
          )}
          <span className={`px-1.5 py-0.5 bg-${domainColor}-500/20 text-${domainColor}-400 text-xs rounded`}>
            {DOMAIN_LABELS[trend.domain]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DirectionIcon className={`w-4 h-4 ${directionColor}`} />
          <span className={`text-xs ${directionColor}`}>{trend.direction}</span>
        </div>
      </div>

      {/* Name & Description */}
      <h4 className="font-semibold text-white mb-2">{trend.name}</h4>
      <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{trend.description}</p>

      {/* Momentum Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500">Momentum</span>
          <span className="text-sm font-bold text-violet-400">{trend.momentum}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
            style={{ width: `${trend.momentum}%` }}
          />
        </div>
      </div>

      {/* Signals */}
      <div className="space-y-1.5 mb-3">
        {trend.signals.slice(0, 2).map((signal, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <ArrowUpRight className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-zinc-400">{signal}</span>
          </div>
        ))}
      </div>

      {/* Key Players */}
      {trend.keyPlayers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {trend.keyPlayers.slice(0, 4).map((player, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded"
            >
              {player}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
