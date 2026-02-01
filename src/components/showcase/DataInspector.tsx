'use client';

import { useState } from 'react';
import { VideoShowcaseMock, TEMPLATE_META } from '@/src/lib/videoShowcaseMockData';

interface DataInspectorProps {
  mock: VideoShowcaseMock;
  currentFrame: number;
}

type Section = 'overview' | 'narratives' | 'actors' | 'money' | 'patterns' | 'warnings';

export function DataInspector({ mock, currentFrame }: DataInspectorProps) {
  const [expandedSection, setExpandedSection] = useState<Section | null>('overview');
  const meta = TEMPLATE_META[mock.templateType];
  const content = mock.videoContent;

  const toggleSection = (section: Section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-4 space-y-3 text-sm">
      {/* Header */}
      <div className="pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{meta.icon}</span>
          <span className="font-semibold text-white">{meta.name}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: meta.color + '30', color: meta.color }}
          >
            {mock.templateType}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          Frame: {currentFrame} / 450 ({((currentFrame / 450) * 100).toFixed(0)}%)
        </div>
      </div>

      {/* Overview Section */}
      <Section
        title="Overview"
        isExpanded={expandedSection === 'overview'}
        onToggle={() => toggleSection('overview')}
      >
        <div className="space-y-3">
          <Field label="Hook" value={content.hook} highlight />
          <Field label="Title" value={content.title} />
          <Field label="Subtitle" value={content.subtitle} />
          <Field
            label="Verdict"
            value={content.verdict}
            badge={content.verdictType}
            badgeColor={
              content.verdictType === 'positive' ? 'emerald' :
              content.verdictType === 'negative' ? 'red' :
              content.verdictType === 'caution' ? 'amber' : 'slate'
            }
          />
        </div>
      </Section>

      {/* Key Narratives */}
      <Section
        title="Key Narratives"
        count={content.keyNarratives.length}
        isExpanded={expandedSection === 'narratives'}
        onToggle={() => toggleSection('narratives')}
      >
        <ul className="space-y-2">
          {content.keyNarratives.map((narrative, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-cyan-500 flex-shrink-0">{i + 1}.</span>
              <span className="text-slate-300">{narrative}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Actors */}
      {content.actors && content.actors.length > 0 && (
        <Section
          title="Actors"
          count={content.actors.length}
          isExpanded={expandedSection === 'actors'}
          onToggle={() => toggleSection('actors')}
        >
          <div className="space-y-3">
            {content.actors.map((actor, i) => (
              <div key={i} className="p-2 bg-slate-800/50 rounded-lg">
                <div className="font-medium text-white">{actor.name}</div>
                <div className="text-xs text-cyan-400">{actor.role}</div>
                <div className="text-xs text-slate-400 mt-1">{actor.connection}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Money Flows */}
      {content.moneyFlows && content.moneyFlows.length > 0 && (
        <Section
          title="Money Flows"
          count={content.moneyFlows.length}
          isExpanded={expandedSection === 'money'}
          onToggle={() => toggleSection('money')}
        >
          <div className="space-y-3">
            {content.moneyFlows.map((flow, i) => (
              <div key={i} className="p-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-300">{flow.from}</span>
                  <span className="text-emerald-400">→</span>
                  <span className="text-slate-300">{flow.to}</span>
                </div>
                <div className="font-mono font-bold text-emerald-400 mt-1">{flow.amount}</div>
                <div className="text-xs text-slate-500 mt-1">{flow.why}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Patterns */}
      {content.patterns && content.patterns.length > 0 && (
        <Section
          title="Patterns"
          count={content.patterns.length}
          isExpanded={expandedSection === 'patterns'}
          onToggle={() => toggleSection('patterns')}
        >
          <div className="space-y-3">
            {content.patterns.map((pattern, i) => (
              <div key={i} className="p-2 bg-slate-800/50 rounded-lg">
                <div className="font-medium text-amber-400">{pattern.pattern}</div>
                <div className="text-xs text-slate-400 mt-1">
                  <span className="text-slate-500">Evidence:</span> {pattern.evidence}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  <span className="text-slate-500">Implication:</span> {pattern.implication}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Warnings */}
      <Section
        title="Warnings"
        count={content.warnings.length}
        isExpanded={expandedSection === 'warnings'}
        onToggle={() => toggleSection('warnings')}
      >
        <ul className="space-y-2">
          {content.warnings.map((warning, i) => (
            <li key={i} className="flex gap-2 text-amber-400">
              <span className="flex-shrink-0">⚠️</span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Red Flags (if present) */}
      {content.redFlags && content.redFlags.length > 0 && (
        <Section
          title="Red Flags"
          count={content.redFlags.length}
          isExpanded={false}
          onToggle={() => {}}
        >
          <div className="space-y-2">
            {content.redFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className={`
                    px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                    ${flag.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      flag.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'}
                  `}
                >
                  {flag.severity}
                </span>
                <span className="text-slate-300">{flag.flag}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Comparisons (if present) */}
      {content.comparisons && content.comparisons.length > 0 && (
        <Section
          title="Comparisons"
          count={content.comparisons.length}
          isExpanded={false}
          onToggle={() => {}}
        >
          <div className="space-y-2">
            {content.comparisons.map((comp, i) => (
              <div key={i} className="p-2 bg-slate-800/50 rounded-lg text-xs">
                <div className="font-medium text-white">{comp.item}</div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Claimed:</span>
                    <div className="text-slate-400">{comp.claimed}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Reality:</span>
                    <div className="text-red-400">{comp.reality}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// Helper Components

interface SectionProps {
  title: string;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, count, isExpanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{title}</span>
          {count !== undefined && (
            <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-3 border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: string;
  badgeColor?: 'emerald' | 'red' | 'amber' | 'slate';
}

function Field({ label, value, highlight, badge, badgeColor = 'slate' }: FieldProps) {
  const badgeColors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
    amber: 'bg-amber-500/20 text-amber-400',
    slate: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        {badge && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className={`mt-0.5 ${highlight ? 'text-cyan-400' : 'text-slate-300'}`}>
        {value}
      </div>
    </div>
  );
}
