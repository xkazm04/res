'use client';

import { useState, useMemo } from 'react';
import type { ResearchSession } from '@/src/types/research';
import { getTemplateDisplayName, groupSessionsByTemplate } from '@/src/stores/appStore';

interface SwissViewProps {
  sessions: ResearchSession[];
  onSessionSelect?: (session: ResearchSession) => void;
}

type ViewLevel = 'overview' | 'template' | 'session';

interface NavigationState {
  level: ViewLevel;
  template?: string;
  session?: ResearchSession;
}

export function SwissView({ sessions, onSessionSelect }: SwissViewProps) {
  const [nav, setNav] = useState<NavigationState>({ level: 'overview' });

  const grouped = useMemo(() => groupSessionsByTemplate(sessions), [sessions]);
  const templates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalFindings = sessions.reduce((sum, s) => sum + (s.claim_count || 0), 0);
    const totalSources = sessions.reduce((sum, s) => sum + (s.source_count || 0), 0);
    return { totalFindings, totalSources };
  }, [sessions]);

  const handleTemplateClick = (template: string) => {
    setNav({ level: 'template', template });
  };

  const handleSessionClick = (session: ResearchSession) => {
    if (onSessionSelect) {
      onSessionSelect(session);
    }
  };

  const handleBack = () => {
    if (nav.level === 'template') {
      setNav({ level: 'overview' });
    } else if (nav.level === 'session') {
      setNav({ level: 'template', template: nav.template });
    }
  };

  return (
    <div className="h-full bg-white overflow-auto">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-black z-10">
        <div className="flex items-baseline justify-between px-8 py-6">
          <div className="flex items-baseline gap-6">
            {nav.level !== 'overview' && (
              <button
                onClick={handleBack}
                className="text-sm uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
              >
                ← Back
              </button>
            )}
            <h1 className="text-4xl font-light tracking-tight">
              {nav.level === 'overview' && 'Research Index'}
              {nav.level === 'template' && getTemplateDisplayName(nav.template!)}
            </h1>
          </div>
          <div className="text-right text-sm text-gray-500 font-mono">
            <div>{sessions.length} Sessions</div>
            <div>{stats.totalFindings} Findings</div>
          </div>
        </div>
      </header>

      {/* Overview Level - Treemap-style grid */}
      {nav.level === 'overview' && (
        <div className="p-8">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-px bg-black mb-8">
            <div className="bg-white p-6">
              <div className="text-5xl font-light">{sessions.length}</div>
              <div className="text-sm uppercase tracking-widest text-gray-500 mt-2">Sessions</div>
            </div>
            <div className="bg-white p-6">
              <div className="text-5xl font-light">{templates.length}</div>
              <div className="text-sm uppercase tracking-widest text-gray-500 mt-2">Categories</div>
            </div>
            <div className="bg-white p-6">
              <div className="text-5xl font-light">{stats.totalFindings}</div>
              <div className="text-sm uppercase tracking-widest text-gray-500 mt-2">Findings</div>
            </div>
            <div className="bg-white p-6">
              <div className="text-5xl font-light">{stats.totalSources}</div>
              <div className="text-sm uppercase tracking-widest text-gray-500 mt-2">Sources</div>
            </div>
          </div>

          {/* Template treemap */}
          <div className="grid grid-cols-12 gap-px bg-black">
            {templates.map((template, idx) => {
              const templateSessions = grouped[template];
              const weight = templateSessions.length / sessions.length;
              const cols = Math.max(3, Math.min(12, Math.round(weight * 12)));

              // Alternate row placement for visual interest
              const isLarge = weight > 0.15;

              return (
                <button
                  key={template}
                  onClick={() => handleTemplateClick(template)}
                  className={`bg-white hover:bg-gray-50 transition-colors text-left group ${
                    isLarge ? 'col-span-6 row-span-2' : cols >= 6 ? 'col-span-6' : 'col-span-4'
                  }`}
                  style={{ minHeight: isLarge ? 200 : 120 }}
                >
                  <div className="h-full p-6 flex flex-col justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <h2 className="text-2xl font-light group-hover:underline decoration-1 underline-offset-4">
                        {getTemplateDisplayName(template)}
                      </h2>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <div className="text-4xl font-light">{templateSessions.length}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest">
                        {Math.round(weight * 100)}%
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Template Level - Session list */}
      {nav.level === 'template' && nav.template && (
        <div className="p-8">
          {/* Template stats */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="text-6xl font-light">{grouped[nav.template].length}</div>
            <div className="text-sm uppercase tracking-widest text-gray-500 mt-2">
              Research Sessions
            </div>
          </div>

          {/* Sessions table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-4 text-xs uppercase tracking-widest text-gray-500 font-normal w-16">#</th>
                <th className="text-left py-4 text-xs uppercase tracking-widest text-gray-500 font-normal">Title</th>
                <th className="text-left py-4 text-xs uppercase tracking-widest text-gray-500 font-normal w-24">Findings</th>
                <th className="text-left py-4 text-xs uppercase tracking-widest text-gray-500 font-normal w-24">Sources</th>
                <th className="text-left py-4 text-xs uppercase tracking-widest text-gray-500 font-normal w-32">Date</th>
              </tr>
            </thead>
            <tbody>
              {grouped[nav.template].map((session, idx) => (
                <tr
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer group"
                >
                  <td className="py-4 text-gray-400 font-mono text-sm">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-4">
                    <div className="font-medium group-hover:underline decoration-1 underline-offset-4">
                      {session.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {session.query}
                    </div>
                  </td>
                  <td className="py-4 font-mono">{session.claim_count}</td>
                  <td className="py-4 font-mono">{session.source_count}</td>
                  <td className="py-4 text-gray-500 text-sm">
                    {new Date(session.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-black mt-auto">
        <div className="px-8 py-4 flex items-center justify-between text-xs text-gray-500 font-mono">
          <div>Research Intelligence System</div>
          <div>{new Date().toISOString().split('T')[0]}</div>
        </div>
      </footer>
    </div>
  );
}
