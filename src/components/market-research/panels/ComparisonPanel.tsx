'use client';

import { useMemo } from 'react';
import { useResearchStore, Competitor } from '@/src/stores/researchStore';
import { ConsultingCard } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';
import { CheckCircle2, XCircle, MinusCircle, Users } from 'lucide-react';

export function ComparisonPanel() {
  const { competitors, selectedCompetitorIds, toggleCompetitorSelection } = useResearchStore();

  const selectedCompetitors = useMemo(() => {
    return competitors.filter((c) => selectedCompetitorIds.includes(c.id));
  }, [competitors, selectedCompetitorIds]);

  // Comparison criteria (simulated)
  const criteria = [
    'Market Presence',
    'Innovation',
    'Brand Recognition',
    'Customer Satisfaction',
    'Product Quality',
    'Pricing',
    'Distribution',
    'Technology',
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Competitive Comparison</h2>
        <p className="text-sm text-slate-500 mt-1">
          Side-by-side comparison of selected competitors
        </p>
      </div>

      {/* Competitor selector */}
      <ConsultingCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Select Competitors to Compare</h3>
          <span className="text-sm text-slate-500">
            {selectedCompetitorIds.length} of {competitors.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {competitors.map((competitor) => (
            <button
              key={competitor.id}
              onClick={() => toggleCompetitorSelection(competitor.id)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-2',
                selectedCompetitorIds.includes(competitor.id)
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
                  : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-blue-300'
              )}
            >
              {selectedCompetitorIds.includes(competitor.id) && <CheckCircle2 className="w-4 h-4" />}
              {competitor.name}
            </button>
          ))}
        </div>
      </ConsultingCard>

      {/* Comparison Table */}
      {selectedCompetitors.length > 0 ? (
        <ConsultingCard className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white w-48">
                  Criteria
                </th>
                {selectedCompetitors.map((competitor) => (
                  <th
                    key={competitor.id}
                    className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <div className="flex flex-col items-center">
                      <span>{competitor.name}</span>
                      <span
                        className={cn(
                          'mt-1 px-2 py-0.5 text-[10px] rounded capitalize',
                          competitor.quadrant === 'leader' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                          competitor.quadrant === 'challenger' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                          competitor.quadrant === 'niche' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                          competitor.quadrant === 'laggard' && 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        )}
                      >
                        {competitor.quadrant}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((criterion, index) => (
                <tr
                  key={criterion}
                  className={cn(
                    'border-b border-slate-100 dark:border-slate-800',
                    index % 2 === 0 && 'bg-slate-50/50 dark:bg-slate-800/30'
                  )}
                >
                  <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {criterion}
                  </td>
                  {selectedCompetitors.map((competitor) => {
                    // Generate a simulated score based on position and quadrant
                    const score = getSimulatedScore(competitor, criterion);
                    return (
                      <td key={competitor.id} className="py-3 px-4 text-center">
                        <ComparisonScore score={score} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ConsultingCard>
      ) : (
        <ConsultingCard className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500">Select competitors above to compare</p>
        </ConsultingCard>
      )}

      {/* Strengths and Weaknesses */}
      {selectedCompetitors.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {selectedCompetitors.slice(0, 4).map((competitor) => (
            <ConsultingCard key={competitor.id} className="p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{competitor.name}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                    Strengths
                  </div>
                  <ul className="space-y-1">
                    {(competitor.strengths.length > 0 ? competitor.strengths : ['Market position', 'Brand awareness']).map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-1">
                        <span className="text-emerald-500">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
                    Weaknesses
                  </div>
                  <ul className="space-y-1">
                    {(competitor.weaknesses.length > 0 ? competitor.weaknesses : ['Limited innovation', 'Price pressure']).map((w, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-1">
                        <span className="text-red-500">−</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ConsultingCard>
          ))}
        </div>
      )}
    </div>
  );
}

function getSimulatedScore(competitor: Competitor, criterion: string): 'high' | 'medium' | 'low' {
  // Simulate scores based on quadrant and position
  const baseScore = competitor.quadrant === 'leader' ? 0.8 :
    competitor.quadrant === 'challenger' ? 0.6 :
      competitor.quadrant === 'niche' ? 0.5 : 0.3;

  // Add some variation based on criterion
  const variation = (criterion.charCodeAt(0) % 3) * 0.1 - 0.1;
  const score = Math.max(0, Math.min(1, baseScore + variation));

  return score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low';
}

function ComparisonScore({ score }: { score: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'text-emerald-500',
    medium: 'text-amber-500',
    low: 'text-red-500',
  };

  const Icon = score === 'high' ? CheckCircle2 : score === 'low' ? XCircle : MinusCircle;

  return (
    <div className="flex items-center justify-center">
      <Icon className={cn('w-5 h-5', colors[score])} />
    </div>
  );
}
