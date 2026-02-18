'use client';

import { useState, useEffect, forwardRef, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { formatRelativeTime } from '@/src/lib/utils';
import { TopicStatus } from '@/src/types/research';
import { initiateTheme } from './InitiateTheme';

const EXIT_MS = 220;

// Template type to subtle background tint mapping
const TEMPLATE_TINTS: Record<string, string> = {
  debunk_claim: 'bg-rose-500/[0.04]',
  actor_investigation: 'bg-violet-500/[0.04]',
  event_timeline: 'bg-blue-500/[0.04]',
  policy_analysis: 'bg-amber-500/[0.04]',
  financial_investigation: 'bg-emerald-500/[0.04]',
  controversy_analysis: 'bg-orange-500/[0.04]',
};

// Left border accent per template type
const TEMPLATE_BORDERS: Record<string, string> = {
  debunk_claim: 'border-l-rose-500/40',
  actor_investigation: 'border-l-violet-500/40',
  event_timeline: 'border-l-blue-500/40',
  policy_analysis: 'border-l-amber-500/40',
  financial_investigation: 'border-l-emerald-500/40',
  controversy_analysis: 'border-l-orange-500/40',
};

interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    description?: string;
    status: TopicStatus;
    discoveredAt: string;
    updatedAt?: string;
    sessionId?: string;
    signals?: string[];
    researchQuery?: string;
    suggestedTemplate?: string;
    claim?: string;
    sourceBias?: string;
    debunkable?: number;
    userVerdict?: 'accepted' | 'rejected';
  };
  focused?: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onFocus?: (id: string) => void;
}

export const TopicCard = forwardRef<HTMLDivElement, TopicCardProps>(
  function TopicCard({ topic, focused = false, onAccept, onReject, onFocus }, ref) {
    // 'accepted' | 'rejected' while exit animation plays, null otherwise
    const [exiting, setExiting] = useState<'accepted' | 'rejected' | null>(null);

    const templateTint = topic.suggestedTemplate
      ? TEMPLATE_TINTS[topic.suggestedTemplate] || ''
      : '';
    const templateBorder = topic.suggestedTemplate
      ? TEMPLATE_BORDERS[topic.suggestedTemplate] || 'border-l-slate-700/40'
      : 'border-l-slate-700/40';

    // Accept: start exit animation + fire API in parallel.
    // Only notify parent after both animation AND API succeed.
    const handleAccept = useCallback(async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (exiting) return;
      setExiting('accepted');

      const delay = new Promise(r => setTimeout(r, EXIT_MS));
      try {
        const [res] = await Promise.all([
          fetch(`/api/topics/${topic.id}/accept`, { method: 'POST' }),
          delay,
        ]);
        if (!res.ok) {
          console.error('Accept failed');
          setExiting(null);
          return;
        }
        onAccept(topic.id);
      } catch (error) {
        console.error('Accept error:', error);
        setExiting(null);
      }
    }, [topic.id, onAccept, exiting]);

    // Reject: same pattern
    const handleReject = useCallback(async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (exiting) return;
      setExiting('rejected');

      const delay = new Promise(r => setTimeout(r, EXIT_MS));
      try {
        const [res] = await Promise.all([
          fetch(`/api/topics/${topic.id}`, { method: 'DELETE' }),
          delay,
        ]);
        if (!res.ok) {
          console.error('Reject failed');
          setExiting(null);
          return;
        }
        onReject(topic.id);
      } catch (error) {
        console.error('Reject error:', error);
        setExiting(null);
      }
    }, [topic.id, onReject, exiting]);

    const handleClick = () => onFocus?.(topic.id);

    // Keyboard handler
    useEffect(() => {
      if (!focused || exiting) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          e.stopPropagation();
          handleAccept();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          e.stopPropagation();
          handleReject();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focused, exiting, handleAccept, handleReject]);

    if (topic.status === 'deleted') return null;

    const isProcessing = topic.status === 'queued' || topic.status === 'researching';
    const isCompleted = topic.status === 'completed';
    const canAct = !isProcessing && !isCompleted && !exiting;

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={`
          relative px-4 py-3
          border-l-2
          ${exiting === 'accepted' ? 'border-l-emerald-500/60' : ''}
          ${exiting === 'rejected' ? 'border-l-rose-500/60' : ''}
          ${!exiting ? templateBorder : ''}
          border-b ${initiateTheme.borderSubtle}
          ${exiting === 'accepted' ? 'bg-emerald-500/15' : ''}
          ${exiting === 'rejected' ? 'bg-rose-500/10' : ''}
          ${!exiting ? templateTint : ''}
          cursor-pointer group
          transition-[opacity,transform] duration-200 ease-out
          ${exiting
            ? 'opacity-0 -translate-x-4 scale-[0.97]'
            : 'opacity-100 translate-x-0 scale-100'
          }
          ${focused && canAct
            ? 'bg-cyan-500/[0.08] ring-1 ring-cyan-500/30 ring-inset'
            : canAct ? 'hover:bg-white/[0.02]' : ''
          }
        `}
        data-topic-id={topic.id}
        tabIndex={0}
      >
        {/* Title */}
        <h3 className={`
          text-sm font-medium leading-snug
          ${isCompleted ? 'text-slate-500' : initiateTheme.text}
          ${isProcessing ? 'text-blue-300' : ''}
        `}>
          {topic.title}
        </h3>

        {/* Claim or description */}
        {(topic.claim || topic.description) && (
          <p className={`
            text-xs leading-relaxed mt-1
            ${isCompleted ? 'text-slate-600' : initiateTheme.textMuted}
          `}>
            {topic.claim ? `"${topic.claim}"` : topic.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] ${initiateTheme.textMuted}`}>
              {formatRelativeTime(topic.discoveredAt)}
            </span>

            {topic.sourceBias && (
              <span className={`
                text-[9px] font-medium
                ${topic.sourceBias === 'left' ? 'text-blue-500/60' : ''}
                ${topic.sourceBias === 'center-left' ? 'text-sky-500/60' : ''}
                ${topic.sourceBias === 'center' ? 'text-slate-500/60' : ''}
                ${topic.sourceBias === 'center-right' ? 'text-orange-500/60' : ''}
                ${topic.sourceBias === 'right' ? 'text-red-500/60' : ''}
              `}>
                {topic.sourceBias === 'left' && 'L'}
                {topic.sourceBias === 'center-left' && 'CL'}
                {topic.sourceBias === 'center' && 'C'}
                {topic.sourceBias === 'center-right' && 'CR'}
                {topic.sourceBias === 'right' && 'R'}
              </span>
            )}

            {topic.debunkable && (
              <span className={`
                text-[9px] font-medium
                ${topic.debunkable >= 4 ? 'text-emerald-500/60' : ''}
                ${topic.debunkable === 3 ? 'text-amber-500/60' : ''}
                ${topic.debunkable <= 2 ? 'text-rose-500/60' : ''}
              `}>
                {topic.debunkable}
              </span>
            )}

            {isProcessing && (
              <span className="flex items-center gap-1 text-[10px] text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {topic.status === 'researching' ? 'researching' : 'queued'}
              </span>
            )}

            {isCompleted && (
              <span className="text-[10px] text-emerald-500/60">done</span>
            )}
          </div>

          {/* Accept/Reject buttons */}
          {canAct && (
            <div className={`
              flex items-center gap-1
              transition-opacity duration-100
              ${focused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}>
              <button
                onClick={handleAccept}
                className={`
                  p-1 rounded
                  bg-emerald-500/10 text-emerald-400
                  hover:bg-emerald-500/20 hover:scale-110
                  active:scale-95
                  transition-all duration-100
                `}
                title="Accept (A)"
                aria-label="Accept"
              >
                <Check size={12} />
              </button>

              <button
                onClick={handleReject}
                className={`
                  p-1 rounded
                  bg-rose-500/10 text-rose-400
                  hover:bg-rose-500/20 hover:scale-110
                  active:scale-95
                  transition-all duration-100
                `}
                title="Reject (D)"
                aria-label="Reject"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
