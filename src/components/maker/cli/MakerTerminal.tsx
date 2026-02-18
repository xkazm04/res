'use client';

import { useEffect, useCallback, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Bot, Wrench, CheckCircle, AlertCircle,
  Square, Loader2, ChevronDown, FileEdit, FilePlus, Eye,
  Sparkles, X, Send,
} from 'lucide-react';
import type { LogEntry, ExecutionInfo, ExecutionResult, CLISSEEvent, AIComposeResult } from './types';

const LOG_ICON_SIZE = 'w-3 h-3';

const LOG_TYPE_ICONS: Record<LogEntry['type'], { icon: typeof Bot; colorClass: string }> = {
  user: { icon: Sparkles, colorClass: 'text-cyan-400' },
  assistant: { icon: Bot, colorClass: 'text-violet-400' },
  tool_use: { icon: Wrench, colorClass: 'text-amber-400' },
  tool_result: { icon: CheckCircle, colorClass: 'text-emerald-400' },
  error: { icon: AlertCircle, colorClass: 'text-red-400' },
  system: { icon: Terminal, colorClass: 'text-cyan-400' },
};

const TOOL_ICONS: Record<string, { icon: typeof FileEdit; colorClass: string }> = {
  Edit: { icon: FileEdit, colorClass: 'text-amber-400' },
  Write: { icon: FilePlus, colorClass: 'text-emerald-400' },
  Read: { icon: Eye, colorClass: 'text-blue-400' },
};

const getLogIcon = (type: LogEntry['type'], toolName?: string) => {
  if (type === 'tool_use' && toolName) {
    const toolIcon = TOOL_ICONS[toolName];
    if (toolIcon) {
      const Icon = toolIcon.icon;
      return <Icon className={`${LOG_ICON_SIZE} ${toolIcon.colorClass}`} />;
    }
  }
  const config = LOG_TYPE_ICONS[type];
  if (config) {
    const Icon = config.icon;
    return <Icon className={`${LOG_ICON_SIZE} ${config.colorClass}`} />;
  }
  return <Bot className={`${LOG_ICON_SIZE} text-slate-400`} />;
};

const formatLogContent = (log: LogEntry) => {
  if (log.type === 'tool_use' && log.toolInput?.file_path) {
    const fileName = String(log.toolInput.file_path).split(/[/\\]/).pop();
    return `${log.toolName}: ${fileName}`;
  }
  if (log.type === 'tool_result') {
    return log.content.length > 80 ? log.content.slice(0, 80) + '...' : log.content;
  }
  return log.content.length > 200 ? log.content.slice(0, 200) + '...' : log.content;
};

const getLogTextClass = (type: LogEntry['type']) => {
  switch (type) {
    case 'error': return 'text-red-400';
    case 'user': return 'text-cyan-300';
    case 'tool_result': return 'text-slate-500 font-mono';
    case 'system': return 'text-cyan-400';
    default: return 'text-slate-300';
  }
};

const ease = [0.25, 0.1, 0.25, 1] as const;

interface MakerTerminalProps {
  isOpen: boolean;
  projectPath: string;
  prompt: string;
  autoStart?: boolean;
  onResult?: (result: AIComposeResult) => void;
  onComplete?: () => void;
  onClose: () => void;
  onError?: (error: string) => void;
  title?: string;
  composingLabel?: string;
  /** Show input textarea for follow-up prompts after completion */
  enableInput?: boolean;
  /** Called when user submits a follow-up prompt */
  onSubmitFollowUp?: (prompt: string, sessionId: string) => void;
}

export const MakerTerminal = memo(function MakerTerminal({
  isOpen,
  projectPath,
  prompt,
  autoStart = true,
  onResult,
  onComplete,
  onClose,
  onError,
  title = 'AI Composer',
  composingLabel = 'Composing...',
  enableInput = false,
  onSubmitFollowUp,
}: MakerTerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [executionInfo, setExecutionInfo] = useState<ExecutionInfo | null>(null);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [inputValue, setInputValue] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const hasStartedRef = useRef(false);
  const lastAssistantTextRef = useRef<string>('');
  const allAssistantTextRef = useRef<string>('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev, entry]);
  }, []);

  // Try to parse AI compose result from the last assistant message
  const tryParseResult = useCallback((text: string) => {
    try {
      // Find JSON in the text (may be wrapped in markdown code blocks)
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      const jsonStr = jsonMatch[1]?.trim() || text.trim();

      // Try to find a JSON object
      const braceStart = jsonStr.indexOf('{');
      const braceEnd = jsonStr.lastIndexOf('}');
      if (braceStart === -1 || braceEnd === -1) return null;

      const parsed = JSON.parse(jsonStr.slice(braceStart, braceEnd + 1));

      // Validate it looks like an AIComposeResult
      if (parsed.selection && parsed.selection.selectedFindings) {
        return parsed as AIComposeResult;
      }
      // Legacy flat format
      if (parsed.selectedFindings) {
        return {
          selection: {
            selectedFindings: parsed.selectedFindings || [],
            selectedPerspectives: parsed.selectedPerspectives || [],
            selectedContradictions: parsed.selectedContradictions || [],
            selectedGaps: parsed.selectedGaps || [],
            selectedCausalChains: parsed.selectedCausalChains || [],
            sectionAssignments: parsed.sectionAssignments || {},
          },
          enrichments: parsed.enrichments,
          rewrites: parsed.rewrites,
          sceneComposition: parsed.sceneComposition,
        } as AIComposeResult;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Handle SSE events
  const handleSSEEvent = useCallback((event: CLISSEEvent) => {
    switch (event.type) {
      case 'connected': {
        const data = event.data as ExecutionInfo & { executionId?: string };
        setExecutionInfo(data);
        setError(null);
        break;
      }
      case 'message': {
        const data = event.data as { type: string; content: string; model?: string };
        if (data.type === 'assistant' && data.content) {
          lastAssistantTextRef.current = data.content;
          allAssistantTextRef.current += '\n' + data.content;
          addLog({
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'assistant',
            content: data.content,
            timestamp: event.timestamp,
            model: data.model,
          });
        }
        break;
      }
      case 'tool_use': {
        const data = event.data as { toolUseId: string; toolName: string; toolInput: Record<string, unknown> };
        addLog({
          id: `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'tool_use',
          content: data.toolName,
          timestamp: event.timestamp,
          toolName: data.toolName,
          toolInput: data.toolInput,
        });
        break;
      }
      case 'tool_result': {
        const data = event.data as { toolUseId: string; content: string };
        addLog({
          id: `result-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'tool_result',
          content: typeof data.content === 'string' ? data.content.slice(0, 200) : JSON.stringify(data.content).slice(0, 200),
          timestamp: event.timestamp,
        });
        break;
      }
      case 'result': {
        const data = event.data as ExecutionResult;
        setLastResult(data);
        setIsStreaming(false);

        // Try to parse AI compose result - try last message first, then all accumulated text
        const result = onResult
          ? (tryParseResult(lastAssistantTextRef.current) || tryParseResult(allAssistantTextRef.current))
          : null;
        if (result) {
          addLog({
            id: `parsed-${Date.now()}`,
            type: 'system',
            content: 'AI composition complete - applying selections',
            timestamp: Date.now(),
          });
          onResult!(result);
        } else {
          addLog({
            id: `no-parse-${Date.now()}`,
            type: 'system',
            content: 'Execution completed',
            timestamp: Date.now(),
          });
        }
        onComplete?.();
        break;
      }
      case 'error': {
        const data = event.data as { error: string };
        setError(data.error);
        setIsStreaming(false);
        onError?.(data.error);
        addLog({
          id: `error-${Date.now()}`,
          type: 'error',
          content: data.error,
          timestamp: event.timestamp,
        });
        break;
      }
    }
  }, [addLog, onResult, onComplete, onError, tryParseResult]);

  // Connect to SSE stream
  const connectToStream = useCallback((streamUrl: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as CLISSEEvent;
        handleSSEEvent(data);
        if (data.type === 'result' || data.type === 'error') {
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (e) {
        console.error('Failed to parse SSE:', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [handleSSEEvent]);

  // Start execution
  const startExecution = useCallback(async () => {
    if (isStreaming || !prompt.trim()) return;

    setIsStreaming(true);
    setError(null);
    lastAssistantTextRef.current = '';
    allAssistantTextRef.current = '';

    addLog({
      id: `start-${Date.now()}`,
      type: 'system',
      content: 'Starting AI composition...',
      timestamp: Date.now(),
    });

    try {
      const response = await fetch('/api/claude-terminal/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, prompt }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error);
        setIsStreaming(false);
        onError?.(err.error);
        return;
      }

      const { streamUrl } = await response.json();
      connectToStream(streamUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start';
      setError(msg);
      setIsStreaming(false);
      onError?.(msg);
    }
  }, [isStreaming, prompt, projectPath, addLog, connectToStream, onError]);

  // Auto-start on open
  useEffect(() => {
    if (isOpen && autoStart && !hasStartedRef.current && prompt.trim()) {
      hasStartedRef.current = true;
      startExecution();
    }
  }, [isOpen, autoStart, prompt, startExecution]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      hasStartedRef.current = false;
    }
  }, [isOpen]);

  // Abort
  const handleAbort = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Follow-up input submission
  const handleInputSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    const sid = executionInfo?.sessionId;
    if (!sid) return;

    addLog({
      id: `user-${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: Date.now(),
    });
    setInputValue('');
    onSubmitFollowUp?.(text, sid);
  }, [inputValue, isStreaming, executionInfo, addLog, onSubmitFollowUp]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  }, [handleInputSubmit]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease }}
      className="flex flex-col h-full bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-slate-200">{title}</span>
          {executionInfo?.model && (
            <span className="text-[10px] text-slate-500 font-mono">
              {executionInfo.model.split('-').slice(-2).join('-')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isStreaming && (
            <button
              onClick={handleAbort}
              className="p-1 text-red-400 hover:bg-red-500/15 rounded transition-colors"
              title="Stop"
            >
              <Square className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-[10px] text-slate-500 bg-slate-800/30 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="flex items-center gap-1 text-amber-400">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Working
            </span>
          ) : lastResult?.isError || error ? (
            <span className="text-red-400">Error</span>
          ) : lastResult ? (
            <span className="text-emerald-400">Complete</span>
          ) : (
            <span>Starting...</span>
          )}
        </div>
        {lastResult?.usage && (
          <span className="text-slate-600 tabular-nums">
            {((lastResult.usage as { inputTokens: number }).inputTokens / 1000).toFixed(1)}k in / {((lastResult.usage as { outputTokens: number }).outputTokens / 1000).toFixed(1)}k out
          </span>
        )}
      </div>

      {/* Log area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Initializing...
          </div>
        ) : (
          <div className="py-1">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-2 px-3 py-0.5 hover:bg-slate-800/40 transition-colors"
                >
                  <span className="flex-shrink-0 mt-0.5">
                    {getLogIcon(log.type, log.toolName)}
                  </span>
                  <span className={`text-xs leading-relaxed break-all ${getLogTextClass(log.type)}`}>
                    {formatLogContent(log)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 px-3 py-1 text-violet-400 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{composingLabel}</span>
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      {!isAutoScroll && logs.length > 10 && (
        <button
          onClick={() => {
            setIsAutoScroll(true);
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
          }}
          className="absolute bottom-2 right-3 p-1 bg-slate-800/90 border border-slate-700 rounded-full text-slate-400 hover:text-white transition-all"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      )}

      {/* Follow-up input */}
      {enableInput && !isStreaming && lastResult && executionInfo?.sessionId && (
        <div className="flex items-start gap-2 px-3 py-2 border-t border-slate-700/40 bg-slate-800/50">
          <span className="text-cyan-400 text-xs font-mono mt-[5px]">{'>'}</span>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              const el = e.target;
              el.style.height = '20px';
              el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
            }}
            onKeyDown={handleInputKeyDown}
            rows={1}
            placeholder="Follow-up prompt... (Shift+Enter for newline)"
            className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none font-mono resize-none overflow-y-auto leading-[20px]"
            style={{ height: '20px', maxHeight: '88px' }}
          />
          <button
            onClick={handleInputSubmit}
            disabled={!inputValue.trim()}
            className="p-1 mt-[3px] text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors disabled:opacity-30"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
});
