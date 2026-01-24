'use client';

import { useTechMarketStore } from '@/src/stores/techMarketStore';
import { Target, AlertTriangle, Rocket, Eye, Clock } from 'lucide-react';
import { DOMAIN_LABELS, DOMAIN_COLORS, QUADRANT_CONFIG } from '@/src/types/techMarket';
import type { PredictionMatrixItem } from '@/src/types/techMarket';

export function PredictionMatrixPanel() {
  const { getFilteredMatrixItems } = useTechMarketStore();
  const items = getFilteredMatrixItems();

  const risks = items.filter(i => i.type === 'risk');
  const opportunities = items.filter(i => i.type === 'opportunity');

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No matrix items match the current filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Risk / Opportunity Matrix
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          {risks.length} risks, {opportunities.length} opportunities
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Act Now - High Impact, High Probability */}
        <QuadrantCard
          title="Act Now"
          subtitle="High Impact × High Probability"
          icon={Rocket}
          color="emerald"
          items={items.filter(i => i.quadrant === 'act_now')}
        />

        {/* Prepare - High Impact, Lower Probability */}
        <QuadrantCard
          title="Prepare"
          subtitle="High Impact × Medium Probability"
          icon={Clock}
          color="blue"
          items={items.filter(i => i.quadrant === 'prepare')}
        />

        {/* Monitor - Medium Impact, High Probability */}
        <QuadrantCard
          title="Monitor"
          subtitle="Medium Impact × High Probability"
          icon={Eye}
          color="amber"
          items={items.filter(i => i.quadrant === 'monitor')}
        />

        {/* Watch - Lower Impact/Probability */}
        <QuadrantCard
          title="Watch"
          subtitle="Lower Impact or Probability"
          icon={AlertTriangle}
          color="slate"
          items={items.filter(i => i.quadrant === 'watch')}
        />
      </div>

      {/* Detailed Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunities */}
        <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-400 flex items-center gap-2 mb-4">
            <Rocket className="w-4 h-4" />
            Opportunities ({opportunities.length})
          </h3>
          <div className="space-y-3">
            {opportunities.map((item) => (
              <MatrixItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Risks */}
        <div className="bg-zinc-900/50 border border-red-500/20 rounded-lg p-4">
          <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" />
            Risks ({risks.length})
          </h3>
          <div className="space-y-3">
            {risks.map((item) => (
              <MatrixItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuadrantCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'amber' | 'slate';
  items: PredictionMatrixItem[];
}

function QuadrantCard({ title, subtitle, icon: Icon, color, items }: QuadrantCardProps) {
  const colorClasses = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    slate: 'border-slate-500/30 bg-slate-500/5',
  };

  const iconColors = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    slate: 'text-slate-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColors[color]}`} />
          <div>
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-xs text-zinc-500">{subtitle}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-sm font-bold ${iconColors[color]}`}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 italic">No items in this quadrant</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.type === 'opportunity' ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                <span className="text-zinc-300 truncate">{item.title}</span>
              </div>
              <span className="text-zinc-500 text-xs ml-2">
                {item.probability}%
              </span>
            </div>
          ))}
          {items.length > 4 && (
            <p className="text-xs text-zinc-500">+{items.length - 4} more</p>
          )}
        </div>
      )}
    </div>
  );
}

function MatrixItemCard({ item }: { item: PredictionMatrixItem }) {
  const domainColor = DOMAIN_COLORS[item.domain] || 'slate';

  return (
    <div className="p-3 bg-zinc-800/50 rounded-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 bg-${domainColor}-500/20 text-${domainColor}-400 text-xs rounded`}>
              {DOMAIN_LABELS[item.domain]}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              item.quadrant === 'act_now' ? 'bg-emerald-500/20 text-emerald-400' :
              item.quadrant === 'prepare' ? 'bg-blue-500/20 text-blue-400' :
              item.quadrant === 'monitor' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {item.quadrant.replace('_', ' ')}
            </span>
          </div>
          <h5 className="font-medium text-white text-sm">{item.title}</h5>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>

          {/* Capture Actions / Mitigation Actions */}
          {item.type === 'opportunity' && item.captureActions && item.captureActions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-zinc-600 mb-1">Actions:</p>
              <div className="flex flex-wrap gap-1">
                {item.captureActions.slice(0, 3).map((action, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          )}
          {item.type === 'risk' && item.mitigationActions && item.mitigationActions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-zinc-600 mb-1">Mitigations:</p>
              <div className="flex flex-wrap gap-1">
                {item.mitigationActions.slice(0, 3).map((mitigation, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded">
                    {mitigation}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-white">{item.probability}%</div>
          <div className="text-xs text-zinc-500">probability</div>
          <div className="mt-1">
            <div className="text-sm font-semibold text-violet-400">{item.impact}</div>
            <div className="text-xs text-zinc-500">impact</div>
          </div>
        </div>
      </div>
    </div>
  );
}
