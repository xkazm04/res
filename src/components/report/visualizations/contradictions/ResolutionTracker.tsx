'use client';

/**
 * ResolutionTracker
 *
 * Tracks resolution status, history, and allows adding notes.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { EnrichedContradiction } from '@/src/hooks/useContradictionExplorer';
import type {
  ResolutionStatus,
  ResolutionHistory,
} from '@/src/lib/contradictionResolution';
import { cn } from '@/src/lib/utils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  MessageSquare,
  Plus,
  ChevronRight,
  GitCommit,
  Vote,
  FileText,
  User,
} from 'lucide-react';
import { formatRelativeTime } from '@/src/lib/utils';

interface ResolutionTrackerProps {
  contradiction: EnrichedContradiction;
  onStatusChange: (status: ResolutionStatus) => void;
  onAddNote: (note: string) => void;
  history: ResolutionHistory | null;
}

export function ResolutionTracker({
  contradiction,
  onStatusChange,
  onAddNote,
  history,
}: ResolutionTrackerProps) {
  const { colors, isRadar, surfaceClasses, getButtonClasses } = useVisualizationTheme();
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const resolution = contradiction.resolution;
  const currentStatus = resolution?.status ?? 'unresolved';

  const statusConfig: Record<
    ResolutionStatus,
    {
      label: string;
      icon: typeof Clock;
      color: string;
      bgColor: string;
      description: string;
    }
  > = {
    unresolved: {
      label: 'Unresolved',
      icon: AlertCircle,
      color: colors.danger,
      bgColor: colors.dangerFill,
      description: 'This contradiction needs attention',
    },
    investigating: {
      label: 'Investigating',
      icon: Search,
      color: colors.warning,
      bgColor: colors.warningFill,
      description: 'Currently being analyzed',
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCircle2,
      color: colors.success,
      bgColor: colors.successFill,
      description: 'Resolution has been finalized',
    },
    dismissed: {
      label: 'Dismissed',
      icon: XCircle,
      color: colors.textMuted,
      bgColor: colors.surfaceBg,
      description: 'Deemed non-material',
    },
  };

  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  // Event icons
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return GitCommit;
      case 'vote':
        return Vote;
      case 'note':
        return MessageSquare;
      case 'strategy_selected':
        return CheckCircle2;
      case 'evidence_added':
        return FileText;
      default:
        return Clock;
    }
  };

  // Format event for display
  const formatEvent = (event: ResolutionHistory['events'][0]) => {
    switch (event.type) {
      case 'status_change':
        return `Status changed from "${event.previousValue}" to "${event.newValue}"`;
      case 'vote':
        return `Voted for strategy: ${event.newValue}`;
      case 'note':
        return event.details ?? 'Added a note';
      case 'strategy_selected':
        return `Selected strategy: ${event.newValue}`;
      case 'evidence_added':
        return 'Added supporting evidence';
      default:
        return 'Unknown event';
    }
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current status card */}
      <div
        className={cn('p-4 rounded-xl', surfaceClasses)}
        style={{
          borderLeft: `4px solid ${config.color}`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.bgColor }}
          >
            <StatusIcon size={24} style={{ color: config.color }} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {config.label}
              </h3>
              {resolution?.resolvedAt && currentStatus === 'resolved' && (
                <span className="text-xs" style={{ color: colors.textMuted }}>
                  {formatRelativeTime(resolution.resolvedAt)}
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Custom resolution note */}
        {resolution?.customResolution && (
          <div
            className="mt-4 p-3 rounded-lg"
            style={{ backgroundColor: colors.surfaceBg }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
              Resolution Note
            </p>
            <p className="text-sm" style={{ color: colors.textPrimary }}>
              {resolution.customResolution}
            </p>
          </div>
        )}

        {/* Selected strategy */}
        {resolution?.selectedStrategy && (
          <div
            className="mt-4 p-3 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: colors.primaryFill }}
          >
            <CheckCircle2 size={16} style={{ color: colors.primary }} />
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.primary }}>
                Selected Strategy
              </p>
              <p className="text-sm capitalize" style={{ color: colors.textPrimary }}>
                {resolution.selectedStrategy.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status changer */}
      <div>
        <label
          className="text-xs font-medium mb-2 block"
          style={{ color: colors.textSecondary }}
        >
          Change Status
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusConfig) as ResolutionStatus[]).map((status) => {
            const sc = statusConfig[status];
            const Icon = sc.icon;
            const isActive = currentStatus === status;

            return (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2',
                  isActive ? 'ring-2' : 'hover:bg-white/5'
                )}
                style={{
                  backgroundColor: isActive ? sc.bgColor : colors.surfaceBg,
                  color: isActive ? sc.color : colors.textSecondary,
                  ...(isActive && {
                    '--tw-ring-color': sc.color,
                  } as React.CSSProperties),
                }}
              >
                <Icon size={14} />
                {sc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            Notes
          </label>
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="flex items-center gap-1 text-xs hover:underline"
            style={{ color: colors.primary }}
          >
            <Plus size={12} />
            Add note
          </button>
        </div>

        <AnimatePresence>
          {showNoteInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className={cn('p-3 rounded-lg', surfaceClasses)}>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this contradiction..."
                  rows={3}
                  className="w-full text-sm bg-transparent border-0 outline-none resize-none"
                  style={{ color: colors.textPrimary }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setNoteText('');
                      setShowNoteInput(false);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg"
                    style={{ color: colors.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg font-medium',
                      !noteText.trim() && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.textOnDark,
                    }}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing notes */}
        {resolution?.notes && (
          <div
            className={cn('p-4 rounded-lg whitespace-pre-wrap', surfaceClasses)}
          >
            <p className="text-sm" style={{ color: colors.textPrimary }}>
              {resolution.notes}
            </p>
          </div>
        )}
      </div>

      {/* Activity history */}
      <div>
        <h4 className="text-xs font-semibold mb-3" style={{ color: colors.textSecondary }}>
          Activity History
        </h4>

        {history && history.events.length > 0 ? (
          <div className="space-y-2">
            {history.events
              .slice()
              .reverse()
              .map((event, i) => {
                const EventIcon = getEventIcon(event.type);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn('p-3 rounded-lg flex items-start gap-3', surfaceClasses)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colors.surfaceBg }}
                    >
                      <EventIcon size={14} style={{ color: colors.textSecondary }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: colors.textPrimary }}>
                        {formatEvent(event)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {event.userName && (
                          <span className="text-[10px] flex items-center gap-1" style={{ color: colors.textMuted }}>
                            <User size={10} />
                            {event.userName}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <div
            className={cn('p-4 rounded-lg text-center', surfaceClasses)}
          >
            <Clock size={24} style={{ color: colors.textMuted }} className="mx-auto mb-2" />
            <p className="text-xs" style={{ color: colors.textMuted }}>
              No activity recorded yet
            </p>
          </div>
        )}
      </div>

      {/* Votes summary */}
      {resolution?.votes && resolution.votes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-3" style={{ color: colors.textSecondary }}>
            Team Votes ({resolution.votes.length})
          </h4>
          <div className="space-y-2">
            {resolution.votes.map((vote, i) => (
              <motion.div
                key={vote.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn('p-3 rounded-lg', surfaceClasses)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium capitalize" style={{ color: colors.textPrimary }}>
                    {vote.strategy.replace(/_/g, ' ')}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: colors.primary }}
                  >
                    {Math.round(vote.confidence * 100)}% confident
                  </span>
                </div>
                {vote.reasoning && (
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    "{vote.reasoning}"
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px]" style={{ color: colors.textMuted }}>
                    {vote.userName ?? 'Anonymous'}
                  </span>
                  <span className="text-[10px]" style={{ color: colors.textMuted }}>
                    •
                  </span>
                  <span className="text-[10px]" style={{ color: colors.textMuted }}>
                    {formatRelativeTime(vote.votedAt)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
