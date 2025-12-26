'use client';

import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { competitors, featureCategories, marketInsights, type CompetitorData, type FeatureStatus } from '@/src/lib/competitorData';
import { TrendingUp, Users, DollarSign, Star, Building2, Calendar, Award, Target, ChevronRight, Cpu, Activity } from 'lucide-react';

export function ResearchDashboard() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [activeCompetitor, setActiveCompetitor] = useState<string>(competitors[0].id);

  const selectedCompetitor = competitors.find(c => c.id === activeCompetitor)!;

  return (
    <div className="min-h-screen bg-[#06060a] text-white overflow-x-hidden font-sans">
      {/* Subtle animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-600/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Scanline effect */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
        }}
      />

      {/* Micro grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 px-4 py-3 max-w-[1800px] mx-auto">
        {/* Compact Header */}
        <header className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-violet-400" />
              <h1 className="text-lg font-semibold tracking-tight">Competitive Intelligence</h1>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Real-time Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <StatPill icon="💰" label="TAM" value={marketInsights.totalMarket} />
            <StatPill icon="📈" label="CAGR" value={marketInsights.cagr} accent />
            <StatPill icon="🎯" value={marketInsights.topTrend} />
            <div className="ml-2 flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase">Live</span>
            </div>
          </div>
        </header>

        {/* Feature Comparison Matrix - Ultra Compact */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Feature Matrix</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="rounded-lg border border-white/[0.06] overflow-hidden bg-black/20 backdrop-blur-sm">
            {/* Table Header */}
            <div className="grid grid-cols-[220px_repeat(5,1fr)] border-b border-white/[0.06]">
              <div className="px-3 py-2 bg-white/[0.02]">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Capabilities</span>
              </div>
              {competitors.map((c) => (
                <div key={c.id} className="px-2 py-2 text-center bg-white/[0.02] border-l border-white/[0.04]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-base">{c.logo}</span>
                    <span className="text-xs font-medium truncate">{c.name}</span>
                    <span className={cn(
                      'px-1 py-0.5 rounded text-[8px] font-bold uppercase',
                      c.tier === 'leader' && 'bg-emerald-500/20 text-emerald-400',
                      c.tier === 'challenger' && 'bg-blue-500/20 text-blue-400',
                      c.tier === 'emerging' && 'bg-amber-500/20 text-amber-400',
                    )}>
                      {c.tier.charAt(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Rows - Compact */}
            {featureCategories.map((feature, i) => (
              <div
                key={feature.key}
                className={cn(
                  'grid grid-cols-[220px_repeat(5,1fr)] transition-all duration-150',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]',
                  hoveredFeature === feature.key && 'bg-violet-500/[0.03]'
                )}
                onMouseEnter={() => setHoveredFeature(feature.key)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="px-3 py-1.5 flex items-center gap-2 border-t border-white/[0.04]">
                  <span className="text-sm">{feature.icon}</span>
                  <span className="text-[11px] text-zinc-400">{feature.label}</span>
                </div>
                {competitors.map((c) => (
                  <div key={c.id} className="px-2 py-1.5 flex items-center justify-center border-t border-l border-white/[0.04]">
                    <FeatureCell status={c.features[feature.key as keyof typeof c.features]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Metrics Comparison - Compact Horizontal */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Key Metrics</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MetricComparisonCard
              title="Market Share"
              icon={<DollarSign className="w-3.5 h-3.5" />}
              competitors={competitors}
              getValue={(c) => c.metrics.marketShare}
              format={(v) => `${v}%`}
              color="violet"
            />
            <MetricComparisonCard
              title="YoY Growth"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              competitors={competitors}
              getValue={(c) => c.metrics.growth}
              format={(v) => `${v}%`}
              color="emerald"
            />
            <MetricComparisonCard
              title="Satisfaction"
              icon={<Star className="w-3.5 h-3.5" />}
              competitors={competitors}
              getValue={(c) => c.metrics.satisfaction}
              format={(v) => `${v}`}
              color="amber"
              maxValue={5}
            />
          </div>
        </section>

        {/* Detailed Analysis - Compact Tabs */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Intel Brief</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          {/* Ultra Compact Tab Switcher */}
          <div className="flex gap-1 mb-3 p-0.5 bg-black/30 rounded-lg border border-white/[0.06] w-fit">
            {competitors.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCompetitor(c.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  activeCompetitor === c.id
                    ? 'bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white shadow-lg shadow-violet-500/20'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                )}
              >
                <span className="text-sm">{c.logo}</span>
                <span className="hidden sm:inline">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Compact Competitor Detail View */}
          <CompetitorDetailView competitor={selectedCompetitor} />
        </section>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, accent }: { icon: string; label?: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded border text-xs',
      accent
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-white/[0.02] border-white/[0.06]'
    )}>
      <span className="text-xs">{icon}</span>
      {label && <span className="text-zinc-500 font-mono text-[10px]">{label}</span>}
      <span className={cn('font-semibold', accent ? 'text-emerald-400' : 'text-white')}>{value}</span>
    </div>
  );
}

function FeatureCell({ status }: { status: FeatureStatus }) {
  const config = {
    full: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Full', icon: '✓' },
    partial: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Partial', icon: '◐' },
    planned: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Soon', icon: '◷' },
    none: { bg: 'bg-zinc-800/30', text: 'text-zinc-600', label: '—', icon: '' },
  };

  const c = config[status];

  return (
    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium', c.bg, c.text)}>
      {c.icon && <span>{c.icon}</span>}
      <span>{c.label}</span>
    </div>
  );
}

function MetricComparisonCard({
  title,
  icon,
  competitors,
  getValue,
  format,
  color,
  maxValue,
}: {
  title: string;
  icon: React.ReactNode;
  competitors: CompetitorData[];
  getValue: (c: CompetitorData) => number;
  format: (v: number) => string;
  color: 'violet' | 'emerald' | 'amber';
  maxValue?: number;
}) {
  const max = maxValue || Math.max(...competitors.map(getValue));
  const colorClasses = {
    violet: { bar: 'from-violet-500 to-fuchsia-500', text: 'text-violet-400' },
    emerald: { bar: 'from-emerald-500 to-cyan-500', text: 'text-emerald-400' },
    amber: { bar: 'from-amber-500 to-orange-500', text: 'text-amber-400' },
  };

  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/20 backdrop-blur-sm p-3">
      <div className={cn('flex items-center gap-1.5 mb-2', colorClasses[color].text)}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <div className="space-y-1.5">
        {competitors.map((c) => {
          const value = getValue(c);
          const percentage = (value / max) * 100;
          return (
            <div key={c.id} className="flex items-center gap-2">
              <span className="text-xs w-5">{c.logo}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', colorClasses[color].bar)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-medium w-10 text-right text-zinc-400">{format(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompetitorDetailView({ competitor }: { competitor: CompetitorData }) {
  const tierColors = {
    leader: { gradient: 'from-emerald-600/10 to-cyan-600/5', border: 'border-emerald-500/20', accent: 'text-emerald-400', badge: 'bg-emerald-500/20' },
    challenger: { gradient: 'from-blue-600/10 to-violet-600/5', border: 'border-blue-500/20', accent: 'text-blue-400', badge: 'bg-blue-500/20' },
    emerging: { gradient: 'from-amber-600/10 to-orange-600/5', border: 'border-amber-500/20', accent: 'text-amber-400', badge: 'bg-amber-500/20' },
  };

  const colors = tierColors[competitor.tier];

  return (
    <div className={cn('rounded-lg border overflow-hidden', colors.border)}>
      {/* Compact Header */}
      <div className={cn('px-4 py-3 bg-gradient-to-r', colors.gradient, 'border-b', colors.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{competitor.logo}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{competitor.name}</h3>
                <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', colors.badge, colors.accent)}>
                  {competitor.tier}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{competitor.tagline}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">{competitor.score}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Score</div>
          </div>
        </div>
      </div>

      {/* Content - Compact Grid Layout */}
      <div className="p-3 bg-black/20 grid grid-cols-12 gap-3">
        {/* Metrics Row */}
        <div className="col-span-12 grid grid-cols-6 gap-2">
          <MiniMetric icon={<DollarSign className="w-3 h-3" />} label="Share" value={`${competitor.metrics.marketShare}%`} />
          <MiniMetric icon={<TrendingUp className="w-3 h-3" />} label="Growth" value={`+${competitor.metrics.growth}%`} highlight />
          <MiniMetric icon={<Building2 className="w-3 h-3" />} label="Revenue" value={competitor.metrics.revenue} />
          <MiniMetric icon={<Users className="w-3 h-3" />} label="Team" value={competitor.metrics.employees} />
          <MiniMetric icon={<Calendar className="w-3 h-3" />} label="Est." value={competitor.metrics.founded.toString()} />
          <MiniMetric icon={<Star className="w-3 h-3" />} label="Rating" value={`${competitor.metrics.satisfaction}`} />
        </div>

        {/* Strengths & Weaknesses */}
        <div className="col-span-6 rounded border border-emerald-500/10 bg-emerald-500/[0.02] p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Strengths</span>
          </div>
          <ul className="space-y-1">
            {competitor.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                <ChevronRight className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-6 rounded border border-red-500/10 bg-red-500/[0.02] p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3 h-3 text-red-400" />
            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Gaps</span>
          </div>
          <ul className="space-y-1">
            {competitor.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                <ChevronRight className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature Coverage - Inline Compact */}
        <div className="col-span-8 rounded border border-white/[0.06] bg-white/[0.01] p-2.5">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Capability Coverage</div>
          <div className="grid grid-cols-5 gap-1.5">
            {featureCategories.map((feature) => {
              const status = competitor.features[feature.key as keyof typeof competitor.features];
              const cfg = {
                full: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
                partial: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
                planned: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
                none: { bg: 'bg-zinc-800/30', text: 'text-zinc-600' },
              };
              const c = cfg[status];
              return (
                <div key={feature.key} className={cn('rounded p-1.5 text-center', c.bg)}>
                  <div className="text-sm">{feature.icon}</div>
                  <div className={cn('text-[8px] font-medium truncate', c.text)}>{feature.label.split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Intel */}
        <div className="col-span-4 rounded border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.03] to-fuchsia-500/[0.02] p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs">📰</span>
            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Intel</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">{competitor.recentNews}</p>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
  highlight = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'rounded border p-2 text-center transition-all',
      highlight
        ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
        : 'border-white/[0.06] bg-white/[0.01]'
    )}>
      <div className={cn('flex items-center justify-center gap-1 mb-0.5',
        highlight ? 'text-emerald-400' : 'text-zinc-500'
      )}>
        {icon}
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn('text-sm font-bold font-mono', highlight ? 'text-emerald-400' : 'text-white')}>
        {value}
      </div>
    </div>
  );
}
