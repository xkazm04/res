'use client';

import { useTechMarketStore } from '@/src/stores/techMarketStore';
import { LineChart, TrendingUp, Users, Calendar } from 'lucide-react';
import { DOMAIN_LABELS, DOMAIN_COLORS, PHASE_THRESHOLDS } from '@/src/types/techMarket';
import type { TechnologyAdoption, AdoptionPhase } from '@/src/types/techMarket';

const PHASE_LABELS: Record<AdoptionPhase, string> = {
  innovators: 'Innovators',
  early_adopters: 'Early Adopters',
  early_majority: 'Early Majority',
  late_majority: 'Late Majority',
  laggards: 'Laggards',
};

const PHASE_COLORS: Record<AdoptionPhase, string> = {
  innovators: 'text-violet-400',
  early_adopters: 'text-blue-400',
  early_majority: 'text-emerald-400',
  late_majority: 'text-amber-400',
  laggards: 'text-slate-400',
};

export function AdoptionCurvesPanel() {
  const { adoptionCurves, activeDomain } = useTechMarketStore();

  const filteredCurves = activeDomain === 'all'
    ? adoptionCurves
    : adoptionCurves.filter(c => c.domain === activeDomain);

  if (filteredCurves.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <LineChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No adoption curves match the current filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <LineChart className="w-5 h-5 text-emerald-400" />
          Technology Adoption Curves
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          S-curve analysis based on Rogers&apos; Diffusion of Innovation model
        </p>
      </div>

      {/* Phase Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <span className="text-xs text-zinc-500">Adoption Phases:</span>
        {Object.entries(PHASE_LABELS).map(([phase, label]) => (
          <div key={phase} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${
              phase === 'innovators' ? 'bg-violet-500' :
              phase === 'early_adopters' ? 'bg-blue-500' :
              phase === 'early_majority' ? 'bg-emerald-500' :
              phase === 'late_majority' ? 'bg-amber-500' :
              'bg-slate-500'
            }`} />
            <span className="text-xs text-zinc-400">
              {label} ({PHASE_THRESHOLDS[phase as AdoptionPhase].max}%)
            </span>
          </div>
        ))}
      </div>

      {/* Adoption Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCurves.map((curve) => (
          <AdoptionCard key={curve.id} curve={curve} />
        ))}
      </div>
    </div>
  );
}

function AdoptionCard({ curve }: { curve: TechnologyAdoption }) {
  const domainColor = DOMAIN_COLORS[curve.domain] || 'slate';

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 bg-${domainColor}-500/20 text-${domainColor}-400 text-xs rounded`}>
              {DOMAIN_LABELS[curve.domain]}
            </span>
            {curve.marketSize && (
              <span className="px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 text-xs rounded">
                {curve.marketSize}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-white">{curve.name}</h4>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{curve.adoptionPercentage}%</div>
          <div className="text-xs text-zinc-500">adoption</div>
        </div>
      </div>

      {/* S-Curve Visualization */}
      <div className="relative h-32 mb-4">
        <SCurveVisualization curve={curve} />
      </div>

      {/* Phase Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-500" />
          <span className={`text-sm font-medium ${PHASE_COLORS[curve.currentPhase]}`}>
            {PHASE_LABELS[curve.currentPhase]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-violet-400" />
          <span className="text-sm text-violet-400">Peak: {curve.projectedPeakYear}</span>
        </div>
      </div>

      {/* Key Drivers */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">Key Drivers:</p>
        <div className="flex flex-wrap gap-1">
          {curve.keyDrivers.slice(0, 3).map((driver, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded"
            >
              {driver}
            </span>
          ))}
        </div>
      </div>

      {/* Barriers */}
      {curve.barriers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">Barriers:</p>
          <p className="text-xs text-amber-400/80">
            {curve.barriers.slice(0, 2).join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
}

function SCurveVisualization({ curve }: { curve: TechnologyAdoption }) {
  // Generate S-curve points
  const points: { x: number; y: number }[] = [];
  const k = 0.1; // Steepness
  const x0 = 50; // Midpoint

  for (let x = 0; x <= 100; x += 2) {
    const y = 100 / (1 + Math.exp(-k * (x - x0)));
    points.push({ x, y });
  }

  // Find current position on curve
  const currentX = curve.adoptionPercentage;
  const currentY = 100 / (1 + Math.exp(-k * (currentX - x0)));

  // Phase boundaries
  const phaseMarkers = [
    { x: 2.5, label: 'Inn' },
    { x: 16, label: 'EA' },
    { x: 50, label: 'EM' },
    { x: 84, label: 'LM' },
  ];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.5" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="#27272a" strokeWidth="0.5" />

      {/* Phase markers */}
      {phaseMarkers.map((marker, idx) => (
        <g key={idx}>
          <line
            x1={marker.x}
            y1="0"
            x2={marker.x}
            y2="100"
            stroke="#3f3f46"
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
        </g>
      ))}

      {/* S-Curve path */}
      <path
        d={`M ${points.map(p => `${p.x},${100 - p.y}`).join(' L ')}`}
        fill="none"
        stroke="url(#curveGradient)"
        strokeWidth="2"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Current position marker */}
      <circle
        cx={currentX}
        cy={100 - currentY}
        r="4"
        fill="#10b981"
        stroke="#fff"
        strokeWidth="1.5"
      />
    </svg>
  );
}
