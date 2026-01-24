'use client';

import { useTechMarketStore } from '@/src/stores/techMarketStore';
import { Calendar, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { DOMAIN_LABELS, DOMAIN_COLORS } from '@/src/types/techMarket';
import type { TechTimelineEvent } from '@/src/types/techMarket';

export function TechTimelinePanel() {
  const { getFilteredTimelineEvents, timelineYear } = useTechMarketStore();
  const events = getFilteredTimelineEvents();

  // Group events by year and quarter
  const grouped = events.reduce((acc, event) => {
    const key = `${event.year}-${event.quarter}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, TechTimelineEvent[]>);

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [yearA, qA] = a.split('-');
    const [yearB, qB] = b.split('-');
    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
    return qA.localeCompare(qB);
  });

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No timeline events match the current filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-400" />
          Tech Timeline {timelineYear !== 'both' && `- ${timelineYear}`}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          {events.filter(e => !e.isPrediction).length} events, {events.filter(e => e.isPrediction).length} predictions
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[60px] top-0 bottom-0 w-px bg-zinc-700" />

        {sortedKeys.map((key) => {
          const [year, quarter] = key.split('-');
          const periodEvents = grouped[key];
          const is2026 = year === '2026';

          return (
            <div key={key} className="mb-8">
              {/* Period Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-[60px] text-right ${is2026 ? 'text-violet-400' : 'text-emerald-400'}`}>
                  <span className="text-sm font-semibold">{quarter}</span>
                  <span className="text-xs block">{year}</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${is2026 ? 'bg-violet-500' : 'bg-emerald-500'}`} />
              </div>

              {/* Events */}
              <div className="ml-[80px] space-y-3">
                {periodEvents.map((event) => (
                  <TimelineCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCard({ event }: { event: TechTimelineEvent }) {
  const domainColor = DOMAIN_COLORS[event.domain] || 'slate';
  const colorClasses: Record<string, string> = {
    violet: 'border-violet-500/30 bg-violet-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    slate: 'border-slate-500/30 bg-slate-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[domainColor] || colorClasses.slate}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {event.isPrediction ? (
              <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded">
                Prediction
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                Event
              </span>
            )}
            <span className={`px-1.5 py-0.5 bg-${domainColor}-500/20 text-${domainColor}-400 text-xs rounded`}>
              {DOMAIN_LABELS[event.domain]}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              event.impact === 'high' ? 'bg-red-500/20 text-red-400' :
              event.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {event.impact} impact
            </span>
          </div>
          <h4 className="font-medium text-white">{event.title}</h4>
          <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{event.description}</p>

          {/* Technologies */}
          {event.relatedTechnologies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.relatedTechnologies.map((tech) => (
                <span key={tech} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Confidence */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-white">
            {Math.round(event.confidenceScore * 100)}%
          </div>
          <div className="text-xs text-zinc-500">confidence</div>
          <div className="mt-2 w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
              style={{ width: `${event.confidenceScore * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-600 mt-1">
            {Math.round(event.confidenceRange.low * 100)}-{Math.round(event.confidenceRange.high * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
