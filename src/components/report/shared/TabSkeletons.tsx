'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';

// Base skeleton pulse component with theme awareness
function SkeletonPulse({ className = '', style }: { className?: string; style?: CSSProperties }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  return (
    <div
      className={`animate-pulse rounded ${isRadar ? 'bg-slate-800/60' : 'bg-stone-200'} ${className}`}
      style={style}
    />
  );
}

// Skeleton for stat cards (used in Overview, header bars)
function StatCardSkeleton() {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  return (
    <div className={`p-4 rounded-xl ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
      <SkeletonPulse className="h-3 w-16 mb-2" />
      <SkeletonPulse className="h-8 w-24 mb-1" />
      <SkeletonPulse className="h-2 w-20" />
    </div>
  );
}

// Skeleton for list rows (Findings table rows)
function TableRowSkeleton() {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  return (
    <div className={`grid grid-cols-12 gap-2 px-3 py-3 border-b ${isRadar ? 'border-cyan-500/5' : 'border-stone-100'}`}>
      <div className="col-span-1"><SkeletonPulse className="h-4 w-8" /></div>
      <div className="col-span-2"><SkeletonPulse className="h-4 w-16" /></div>
      <div className="col-span-7"><SkeletonPulse className="h-4 w-full" /></div>
      <div className="col-span-1"><SkeletonPulse className="h-4 w-6" /></div>
      <div className="col-span-1"><SkeletonPulse className="h-4 w-10" /></div>
    </div>
  );
}

// Skeleton for cards in grid layouts (Sources, Entities)
function CardSkeleton() {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  return (
    <div className={`p-4 rounded-xl ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
      <div className="flex items-start gap-3">
        <SkeletonPulse className="w-11 h-11 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <SkeletonPulse className="h-3 w-12 mb-2" />
          <SkeletonPulse className="h-4 w-3/4 mb-1" />
          <SkeletonPulse className="h-2 w-20 mb-2" />
          <SkeletonPulse className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for perspective tab selector
function PerspectiveButtonSkeleton() {
  return <SkeletonPulse className="h-10 w-24 rounded-lg" />;
}

// Overview Tab Skeleton - matches StaticOverview layout
export function OverviewSkeleton() {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-6 w-24" />
        <SkeletonPulse className="h-8 w-32 rounded-lg" />
      </div>

      {/* Intel Dashboard - 6 stat cards */}
      <div className={`p-4 rounded-2xl ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center">
              <SkeletonPulse className="h-3 w-16 mx-auto mb-2" />
              <SkeletonPulse className="h-10 w-10 rounded-full mx-auto mb-1" />
              <SkeletonPulse className="h-2 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout: KeyPoints + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Points Panel */}
        <div className={`rounded-2xl overflow-hidden ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
          <div className={`p-4 border-b ${isRadar ? 'border-cyan-500/10' : 'border-stone-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-3 w-16" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonPulse key={i} className="h-6 w-12 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="p-3 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`p-3 rounded-xl ${isRadar ? 'bg-slate-800/30' : 'bg-stone-50'}`}>
                <div className="flex gap-2">
                  <SkeletonPulse className="w-6 h-6 rounded flex-shrink-0" />
                  <div className="flex-1">
                    <SkeletonPulse className="h-4 w-full mb-2" />
                    <div className="flex gap-3">
                      <SkeletonPulse className="h-2 w-20" />
                      <SkeletonPulse className="h-2 w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap placeholder */}
        <div className={`h-48 rounded-xl ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
          <div className="h-full flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${isRadar ? 'border-cyan-500/30' : 'border-stone-300'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Findings Tab Skeleton - matches FindingsView table layout
export function FindingsSkeleton() {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-6 w-20" />
          <SkeletonPulse className="h-5 w-8 rounded" />
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl overflow-hidden border ${isRadar ? 'border-cyan-500/10' : 'border-stone-200'}`}>
        {/* Table header */}
        <div className={`grid grid-cols-12 gap-2 px-3 py-2 ${isRadar ? 'bg-slate-900/80' : 'bg-stone-100'}`}>
          <SkeletonPulse className="col-span-1 h-3 w-8" />
          <SkeletonPulse className="col-span-2 h-3 w-12" />
          <SkeletonPulse className="col-span-7 h-3 w-16" />
          <SkeletonPulse className="col-span-1 h-3 w-6" />
          <SkeletonPulse className="col-span-1 h-3 w-8" />
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Sources Tab Skeleton - matches SourcesView cards layout
export function SourcesSkeleton() {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-6 w-20" />
          <SkeletonPulse className="h-5 w-8 rounded" />
        </div>
        <SkeletonPulse className="h-8 w-36 rounded-lg" />
      </div>

      {/* Credibility bar */}
      <div className="flex items-center gap-4">
        <SkeletonPulse className="h-4 w-24" />
        <SkeletonPulse className="h-2 w-32 rounded-full" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Perspectives Tab Skeleton - matches PerspectivesView layout
export function PerspectivesSkeleton() {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-6 w-28" />
        <SkeletonPulse className="h-5 w-6 rounded" />
      </div>
      <SkeletonPulse className="h-3 w-48" />

      {/* Perspective selector buttons */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <PerspectiveButtonSkeleton key={i} />
        ))}
      </div>

      {/* Active perspective detail */}
      <div className={`rounded-xl overflow-hidden ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
        {/* Gradient header */}
        <div className={`p-4 ${isRadar ? 'bg-gradient-to-r from-slate-700 to-slate-600' : 'bg-stone-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <SkeletonPulse className="h-5 w-40 mb-2 bg-white/20" />
              <SkeletonPulse className="h-3 w-24 bg-white/20" />
            </div>
            <SkeletonPulse className="w-14 h-14 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-3/4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`p-3 rounded-lg ${isRadar ? 'bg-slate-800/30' : 'bg-stone-50'}`}>
                <SkeletonPulse className="h-3 w-16 mb-3" />
                <div className="space-y-2">
                  <SkeletonPulse className="h-3 w-full" />
                  <SkeletonPulse className="h-3 w-5/6" />
                  <SkeletonPulse className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Analysis Tab Skeleton - matches AnalysisView tabs layout
export function AnalysisSkeleton() {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-6 w-20" />
        <SkeletonPulse className="h-5 w-8 rounded" />
      </div>
      <SkeletonPulse className="h-3 w-64" />

      {/* Tab navigation */}
      <div className={`flex gap-2 p-2 rounded-xl ${isRadar ? 'bg-slate-900/80' : 'bg-stone-100'}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonPulse key={i} className="flex-1 h-12 rounded-lg" />
        ))}
      </div>

      {/* Content area - matrix visualization */}
      <div className={`p-4 rounded-xl ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`aspect-square rounded-lg ${isRadar ? 'bg-slate-800/50' : 'bg-stone-100'}`}>
              <div className="h-full flex items-center justify-center">
                <SkeletonPulse className="w-8 h-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Entities Tab Skeleton - matches EntitiesView layout
export function EntitiesSkeleton() {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-6 w-20" />
          <SkeletonPulse className="h-5 w-8 rounded" />
        </div>
        <SkeletonPulse className="h-8 w-40 rounded-lg" />
      </div>

      {/* Type filters */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-7 w-14 rounded-lg" />
        ))}
      </div>

      {/* Constellation placeholder */}
      <div className={`h-72 rounded-xl ${isRadar ? 'bg-slate-900/60 border border-cyan-500/10' : 'bg-white border border-stone-200'}`}>
        <div className="h-full flex items-center justify-center relative">
          {/* Central node */}
          <SkeletonPulse className="w-12 h-12 rounded-full absolute" />
          {/* Orbiting nodes */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60) * (Math.PI / 180);
            const x = Math.cos(angle) * 80;
            const y = Math.sin(angle) * 80;
            return (
              <SkeletonPulse
                key={i}
                className="w-8 h-8 rounded-full absolute"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Map tab ID to skeleton component
export const tabSkeletons: Record<string, () => ReactNode> = {
  overview: OverviewSkeleton,
  findings: FindingsSkeleton,
  sources: SourcesSkeleton,
  perspectives: PerspectivesSkeleton,
  analysis: AnalysisSkeleton,
  entities: EntitiesSkeleton,
};
