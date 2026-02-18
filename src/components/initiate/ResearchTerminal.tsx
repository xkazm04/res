'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { MakerTerminal } from '@/src/components/maker/cli/MakerTerminal';
import { initiateTheme } from './InitiateTheme';
import type { QueueTopic } from './useResearch';

const ease = [0.25, 0.1, 0.25, 1] as const;

interface ResearchTerminalProps {
  topic: QueueTopic;
  projectPath: string;
  prompt: string;
  isResearching: boolean;
  onComplete: () => void;
  onError: (error: string) => void;
  onClose: () => void;
  onSessionId?: (sid: string) => void;
}

export function ResearchTerminal({
  topic,
  projectPath,
  prompt,
  isResearching,
  onComplete,
  onError,
  onClose,
  onSessionId,
}: ResearchTerminalProps) {
  const [followUpExecutionId, setFollowUpExecutionId] = useState<string | null>(null);
  const [, setIsFollowUpStreaming] = useState(false);

  // Handle follow-up submission: spawn new CLI execution with resume
  const handleSubmitFollowUp = useCallback(async (followUpPrompt: string, sessionId: string) => {
    if (onSessionId) onSessionId(sessionId);
    setIsFollowUpStreaming(true);

    try {
      const response = await fetch('/api/claude-terminal/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          prompt: followUpPrompt,
          resumeSessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        onError(err.error || 'Failed to start follow-up');
        setIsFollowUpStreaming(false);
        return;
      }

      const { executionId } = await response.json();
      setFollowUpExecutionId(executionId);
      // MakerTerminal will handle the streaming via its existing SSE mechanism
      // We need to trigger it to reconnect — but MakerTerminal manages its own SSE.
      // The parent needs to update the prompt to trigger a new execution.
      // Instead, we'll handle this by updating the prompt prop which triggers autoStart.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start follow-up';
      onError(msg);
      setIsFollowUpStreaming(false);
    }
  }, [projectPath, onSessionId, onError]);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'calc(50vw - 140px)', opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease }}
      className={`
        flex-shrink-0 h-full flex flex-col overflow-hidden
        border-r ${initiateTheme.borderSubtle}
        min-w-[400px]
      `}
    >
      {/* Header */}
      <div className={`
        flex items-center justify-between px-3 py-2
        border-b ${initiateTheme.borderSubtle}
        ${initiateTheme.bgCard}
      `}>
        <span
          className={`text-xs font-medium ${initiateTheme.text} truncate max-w-[calc(100%-30px)]`}
          title={topic.title}
        >
          {topic.title}
        </span>
        <button
          onClick={onClose}
          className={`
            flex-shrink-0 p-1 rounded
            ${initiateTheme.textMuted}
            hover:text-slate-100
            ${initiateTheme.bgHover}
            transition-colors
          `}
        >
          <X size={12} />
        </button>
      </div>

      {/* Terminal */}
      <div className="flex-1 min-h-0">
        <MakerTerminal
          isOpen={true}
          projectPath={projectPath}
          prompt={prompt}
          autoStart={true}
          onComplete={onComplete}
          onClose={onClose}
          onError={onError}
          title="Research"
          composingLabel="Researching..."
          enableInput={true}
          onSubmitFollowUp={handleSubmitFollowUp}
        />
      </div>
    </motion.div>
  );
}
