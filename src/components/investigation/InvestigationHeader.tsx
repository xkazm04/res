'use client';

import { useInvestigationStore } from '@/src/stores/investigationStore';
import { StatusIndicator, ProgressRing } from '@/src/components/ui/progress';
import { Clock, RefreshCw, Filter, Eye, EyeOff, ZoomIn, ZoomOut } from '@/src/components/ui/icons';
import { formatRelativeTime } from '@/src/lib/utils';
import type { SessionWithDetails } from '@/src/types/research';

interface InvestigationHeaderProps {
  session: SessionWithDetails | null;
  onRefresh: () => void;
}

export function InvestigationHeader({ session, onRefresh }: InvestigationHeaderProps) {
  const {
    zoom,
    setZoom,
    showTimeline,
    showEntities,
    showPerspectives,
    showContradictions,
    toggleTimeline,
    toggleEntities,
    togglePerspectives,
    toggleContradictions,
  } = useInvestigationStore();

  if (!session) return null;

  const progress = session.status === 'completed' ? 100 :
    session.status === 'analyzing' ? 75 :
      session.status === 'searching' ? 40 : 20;

  return (
    <header className="h-16 bg-[#2a2420] border-b border-amber-900/30 px-4 flex items-center justify-between relative z-20">
      {/* Left section - Title and status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-600/20 flex items-center justify-center">
            <span className="text-amber-500 text-lg">🔍</span>
          </div>
          <div>
            <h1 className="font-serif text-lg text-amber-100 leading-tight">{session.title}</h1>
            <p className="text-xs text-amber-100/50 truncate max-w-[300px]">{session.query}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-amber-900/30">
          <StatusIndicator status={session.status} />
          {session.status !== 'completed' && (
            <ProgressRing value={progress} size={32} strokeWidth={3} variant="default" />
          )}
        </div>
      </div>

      {/* Center section - Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-amber-100/70">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="font-mono">{session.findings.length}</span>
          <span className="text-amber-100/50">findings</span>
        </div>
        <div className="flex items-center gap-2 text-amber-100/70">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-mono">{session.sources.length}</span>
          <span className="text-amber-100/50">sources</span>
        </div>
        <div className="flex items-center gap-2 text-amber-100/70">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="font-mono">{session.contradictions.length}</span>
          <span className="text-amber-100/50">contradictions</span>
        </div>
        <div className="flex items-center gap-2 text-amber-100/70">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="font-mono">{session.perspectives.length}</span>
          <span className="text-amber-100/50">perspectives</span>
        </div>
      </div>

      {/* Right section - Controls */}
      <div className="flex items-center gap-2">
        {/* View toggles */}
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-amber-900/30">
          <ToggleButton
            active={showTimeline}
            onClick={toggleTimeline}
            label="Timeline"
          />
          <ToggleButton
            active={showEntities}
            onClick={toggleEntities}
            label="Entities"
          />
          <ToggleButton
            active={showPerspectives}
            onClick={togglePerspectives}
            label="Perspectives"
          />
          <ToggleButton
            active={showContradictions}
            onClick={toggleContradictions}
            label="Conflicts"
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-amber-900/30">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="p-1.5 rounded hover:bg-amber-900/30 text-amber-100/70 hover:text-amber-100"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-amber-100/50 w-12 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="p-1.5 rounded hover:bg-amber-900/30 text-amber-100/70 hover:text-amber-100"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Updated time */}
        <div className="flex items-center gap-1.5 text-xs text-amber-100/50 mr-2">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(session.updated_at)}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded hover:bg-amber-900/30 text-amber-100/70 hover:text-amber-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors ${active
        ? 'bg-amber-600/30 text-amber-100'
        : 'text-amber-100/50 hover:text-amber-100 hover:bg-amber-900/30'
        }`}
    >
      {label}
    </button>
  );
}
