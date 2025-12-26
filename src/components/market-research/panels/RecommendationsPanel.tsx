'use client';

import { useResearchStore, Opportunity } from '@/src/stores/researchStore';
import { ConsultingCard } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';
import { Target, Lightbulb, AlertCircle, ArrowRight, Zap, Clock, TrendingUp } from 'lucide-react';

export function RecommendationsPanel() {
  const { session, opportunities, swotItems, marketTrends } = useResearchStore();

  if (!session) return null;

  // Get recommendations from perspectives
  const recommendations = session.perspectives.flatMap((p) => p.recommendations || []);
  const warnings = session.perspectives.flatMap((p) => p.warnings || []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Strategic Recommendations</h2>
        <p className="text-sm text-slate-500 mt-1">
          AI-generated recommendations based on research analysis
        </p>
      </div>

      {/* Priority Matrix */}
      <ConsultingCard className="p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Opportunity Priority Matrix</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Zap className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {opportunities.filter((o) => o.impact === 'high' && o.effort === 'low').length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Quick Wins</div>
            <div className="text-[10px] text-slate-500">High Impact, Low Effort</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <Target className="w-6 h-6 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {opportunities.filter((o) => o.impact === 'high' && o.effort !== 'low').length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Major Projects</div>
            <div className="text-[10px] text-slate-500">High Impact, Higher Effort</div>
          </div>
          <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
            <Clock className="w-6 h-6 mx-auto text-amber-600 dark:text-amber-400 mb-2" />
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {opportunities.filter((o) => o.impact !== 'high').length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Fill-ins</div>
            <div className="text-[10px] text-slate-500">Lower Priority</div>
          </div>
        </div>

        {/* Opportunity List */}
        <div className="space-y-3">
          {opportunities.map((opportunity, index) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} rank={index + 1} />
          ))}
          {opportunities.length === 0 && (
            <p className="text-center text-slate-500 py-4">No opportunities identified</p>
          )}
        </div>
      </ConsultingCard>

      <div className="grid grid-cols-2 gap-6">
        {/* Strategic Recommendations */}
        <ConsultingCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Key Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{rec}</p>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-center text-slate-500 py-4">No recommendations available</p>
            )}
          </div>
        </ConsultingCard>

        {/* Warnings */}
        <ConsultingCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Risk Factors & Warnings</h3>
          </div>
          <div className="space-y-3">
            {warnings.slice(0, 5).map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
              >
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{warning}</p>
              </div>
            ))}
            {/* Add SWOT threats as warnings */}
            {swotItems
              .filter((i) => i.category === 'threat' && i.priority === 'high')
              .slice(0, 3)
              .map((threat) => (
                <div
                  key={threat.id}
                  className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">{threat.content}</p>
                </div>
              ))}
            {warnings.length === 0 && swotItems.filter((i) => i.category === 'threat').length === 0 && (
              <p className="text-center text-slate-500 py-4">No warnings identified</p>
            )}
          </div>
        </ConsultingCard>
      </div>

      {/* Action Plan */}
      <ConsultingCard className="p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Suggested Action Plan</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-6">
            {[
              { phase: 'Immediate', timeline: '0-30 days', actions: opportunities.filter((o) => o.impact === 'high' && o.effort === 'low').slice(0, 2) },
              { phase: 'Short-term', timeline: '1-3 months', actions: opportunities.filter((o) => o.impact === 'high').slice(0, 2) },
              { phase: 'Medium-term', timeline: '3-6 months', actions: opportunities.filter((o) => o.impact === 'medium').slice(0, 2) },
            ].map((phase, index) => (
              <div key={phase.phase} className="relative pl-10">
                <div className="absolute left-2 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-900" />
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{phase.phase}</span>
                    <span className="text-xs text-slate-500">{phase.timeline}</span>
                  </div>
                  {phase.actions.length > 0 ? (
                    <ul className="space-y-2">
                      {phase.actions.map((action) => (
                        <li key={action.id} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          {action.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Actions to be determined based on analysis</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ConsultingCard>
    </div>
  );
}

function OpportunityCard({ opportunity, rank }: { opportunity: Opportunity; rank: number }) {
  const impactColors = {
    high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };

  const effortColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 dark:text-white">{opportunity.title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{opportunity.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn('px-2 py-0.5 text-[10px] rounded uppercase font-medium', impactColors[opportunity.impact])}>
            {opportunity.impact} impact
          </span>
          <span className={cn('px-2 py-0.5 text-[10px] rounded uppercase font-medium', effortColors[opportunity.effort])}>
            {opportunity.effort} effort
          </span>
        </div>
      </div>
      <TrendingUp className="w-5 h-5 text-slate-400 shrink-0" />
    </div>
  );
}
