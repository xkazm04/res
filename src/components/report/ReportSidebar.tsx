'use client';

import type { ReactNode } from 'react';
import { SearchIcon, GridIcon, DocumentIcon, LinkIcon, UsersIcon, AlertIcon, PersonIcon } from './shared/Icons';

type TabId = 'overview' | 'findings' | 'sources' | 'perspectives' | 'analysis' | 'entities';

interface ReportSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  stats: {
    findings: number;
    sources: number;
    perspectives: number;
    contradictions: number;
    gaps: number;
    avgConfidence: number;
    highConfidence: number;
    medConfidence: number;
    lowConfidence: number;
    redFlags: number;
    highCredSources: number;
    entities: number;
  };
  metadata: {
    templateType: string;
    status: string;
    sessionId: string;
    cost?: number;
    tokens?: number;
  };
  onClose: () => void;
}

const tabIcons: Record<TabId, ReactNode> = {
  overview: <GridIcon />,
  findings: <DocumentIcon />,
  sources: <LinkIcon />,
  perspectives: <UsersIcon />,
  analysis: <AlertIcon />,
  entities: <PersonIcon />,
};

export function ReportSidebar({ activeTab, onTabChange, stats, metadata, onClose }: ReportSidebarProps) {
  return (
    <aside className="w-60 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="w-5 h-5 text-blue-400"><SearchIcon /></span>
          Deep Research
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <NavSection label="Views">
          <NavItem icon={tabIcons.overview} label="Overview" active={activeTab === 'overview'} onClick={() => onTabChange('overview')} />
          <NavItem icon={tabIcons.findings} label="Findings" count={stats.findings} active={activeTab === 'findings'} onClick={() => onTabChange('findings')} />
          <NavItem icon={tabIcons.sources} label="Sources" count={stats.sources} active={activeTab === 'sources'} onClick={() => onTabChange('sources')} />
          <NavItem icon={tabIcons.perspectives} label="Perspectives" count={stats.perspectives} active={activeTab === 'perspectives'} onClick={() => onTabChange('perspectives')} />
          <NavItem icon={tabIcons.analysis} label="Analysis" count={stats.contradictions + stats.gaps} active={activeTab === 'analysis'} onClick={() => onTabChange('analysis')} />
          <NavItem icon={tabIcons.entities} label="Entities" count={stats.entities} active={activeTab === 'entities'} onClick={() => onTabChange('entities')} />
        </NavSection>

        <NavSection label="Statistics">
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            <StatRow label="Avg Confidence" value={`${stats.avgConfidence}%`} color={stats.avgConfidence >= 80 ? 'emerald' : stats.avgConfidence >= 50 ? 'amber' : 'red'} />
            <StatRow label="High Confidence" value={stats.highConfidence} />
            <StatRow label="High Cred Sources" value={stats.highCredSources} />
            <StatRow label="Red Flags" value={stats.redFlags} color={stats.redFlags > 0 ? 'red' : undefined} />
          </div>
        </NavSection>

        <NavSection label="Metadata">
          <div className="text-xs space-y-1.5 px-1">
            <MetaRow label="Template" value={metadata.templateType} />
            <MetaRow label="Status" value={metadata.status} />
            {metadata.cost !== undefined && <MetaRow label="Cost" value={`$${metadata.cost.toFixed(4)}`} />}
            {metadata.tokens !== undefined && <MetaRow label="Tokens" value={metadata.tokens.toLocaleString()} />}
            <MetaRow label="Session" value={`${metadata.sessionId.slice(0, 8)}...`} />
          </div>
        </NavSection>
      </nav>

      {/* Close */}
      <div className="p-3 border-t border-white/10">
        <button onClick={onClose} className="w-full px-3 py-2 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
          Close Report
        </button>
      </div>
    </aside>
  );
}

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-2">{label}</div>
      {children}
    </div>
  );
}

function NavItem({ icon, label, count, active, onClick }: { icon: ReactNode; label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${active ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
    >
      <span className="w-4 h-4 opacity-70">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-white/10'}`}>{count}</span>
      )}
    </button>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: 'emerald' | 'amber' | 'red' }) {
  const colorClass = color ? { emerald: 'text-emerald-400', amber: 'text-amber-400', red: 'text-red-400' }[color] : 'text-white';
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/5 last:border-0 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${colorClass}`}>{value}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-slate-400">
      <span className="text-slate-500">{label}:</span> <span className="text-slate-300">{value}</span>
    </div>
  );
}
