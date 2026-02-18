'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Newspaper, Cpu, TrendingUp,
  Shield, Zap, MessageCircle, RefreshCw, List, Film,
  Sparkles, ChevronUp, BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { SourceColumn } from '@/src/components/initiate/SourceColumn';
import { ScrollIndicator } from '@/src/components/initiate/ScrollIndicator';
import { ResearchQueue } from '@/src/components/initiate/ResearchQueue';
import { ResearchTerminal } from '@/src/components/initiate/ResearchTerminal';
import { InitiateThemeProvider, initiateTheme } from '@/src/components/initiate/InitiateTheme';
import { MakerTerminal } from '@/src/components/maker/cli/MakerTerminal';
import { useDiscovery } from '@/src/components/initiate/useDiscovery';
import { useLearn } from '@/src/components/initiate/useLearn';
import { useResearch } from '@/src/components/initiate/useResearch';
import { SOURCES } from '@/src/lib/sources';
import { supabase } from '@/src/lib/supabase';
import { TopicStatus, TOPIC_STATUSES } from '@/src/types/research';
import { useStatusPolling, TopicStatusUpdate } from '@/src/hooks/useStatusPolling';

// Exclude Twitter (blocks crawlers) and Reddit (unreliable news via WebSearch)
const DISPLAY_SOURCES = SOURCES.filter(s => s.slug !== 'twitter' && s.slug !== 'reddit');

const ICON_MAP: Record<string, typeof Globe> = {
  bbc: Globe,
  reuters: Newspaper,
  techcrunch: Cpu,
  bloomberg: TrendingUp,
  nyt: Newspaper,
  guardian: Shield,
  'ap-news': Zap,
  'al-jazeera': Globe,
  reddit: MessageCircle,
};

interface Topic {
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
}

interface TopicRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  discovered_at: string;
  updated_at: string;
  session_id: string | null;
  signals: string[] | null;
  research_query: string | null;
  suggested_template: string | null;
  claim: string | null;
  source_bias: string | null;
  debunkable: number | null;
  user_verdict: string | null;
}

function transformTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: (TOPIC_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as TopicStatus)
      : 'new',
    discoveredAt: row.discovered_at,
    updatedAt: row.updated_at,
    sessionId: row.session_id ?? undefined,
    signals: row.signals ?? undefined,
    researchQuery: row.research_query ?? undefined,
    suggestedTemplate: row.suggested_template ?? undefined,
    claim: row.claim ?? undefined,
    sourceBias: row.source_bias ?? undefined,
    debunkable: row.debunkable ?? undefined,
    userVerdict: row.user_verdict === 'accepted' || row.user_verdict === 'rejected'
      ? row.user_verdict
      : undefined,
  };
}

const ease = [0.25, 0.1, 0.25, 1] as const;

type TerminalMode = 'discover' | 'learn' | null;

function InitiatePageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topicsBySource, setTopicsBySource] = useState<Record<string, Topic[]>>({});
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [terminalMode, setTerminalMode] = useState<TerminalMode>(null);
  const discovery = useDiscovery();
  const learn = useLearn();
  const research = useResearch();

  // Fetch topics for a specific source
  const fetchTopicsForSource = useCallback(async (sourceSlug: string) => {
    const { data: source } = await supabase
      .from('data_sources')
      .select('id')
      .eq('slug', sourceSlug)
      .single();

    if (source) {
      const { data: topics } = await supabase
        .from('research_topics')
        .select('id, title, description, status, discovered_at, updated_at, session_id, signals, research_query, suggested_template, claim, source_bias, debunkable, user_verdict')
        .eq('source_id', source.id)
        .order('discovered_at', { ascending: false });

      if (topics) {
        setTopicsBySource(prev => ({
          ...prev,
          [sourceSlug]: topics.map(transformTopic),
        }));
      }
    }
  }, []);

  // Fetch all sources
  const fetchAllTopics = useCallback(() => {
    DISPLAY_SOURCES.forEach(source => {
      fetchTopicsForSource(source.slug);
    });
  }, [fetchTopicsForSource]);

  // Load initial topics and research queue on mount
  useEffect(() => {
    fetchAllTopics();
    research.fetchQueue();
  }, [fetchAllTopics, research.fetchQueue]);

  // On discovery completion, refetch everything
  const handleDiscoveryComplete = useCallback(() => {
    discovery.handleComplete();
    // Small delay for DB writes to finalize
    setTimeout(fetchAllTopics, 1500);
  }, [discovery, fetchAllTopics]);

  // On learn completion, refresh unreviewed count
  const handleLearnComplete = useCallback(() => {
    learn.handleComplete();
  }, [learn]);

  // Start discovery with shared terminal
  const startDiscoverTerminal = useCallback(() => {
    if (learn.isTerminalOpen) learn.closeTerminal();
    setTerminalMode('discover');
    discovery.startDiscovery();
  }, [discovery, learn]);

  // Start learn with shared terminal
  const startLearnTerminal = useCallback(() => {
    if (discovery.isTerminalOpen) discovery.closeTerminal();
    setTerminalMode('learn');
    learn.startLearning();
  }, [discovery, learn]);

  // Close whichever terminal is open
  const closeActiveTerminal = useCallback(() => {
    if (terminalMode === 'discover') discovery.closeTerminal();
    if (terminalMode === 'learn') learn.closeTerminal();
    setTerminalMode(null);
  }, [terminalMode, discovery, learn]);

  const isTerminalOpen = discovery.isTerminalOpen || learn.isTerminalOpen;

  // Topic status change (optimistic update)
  const handleTopicStatusChange = useCallback(
    (id: string, status: TopicStatus, sessionId?: string) => {
      setTopicsBySource((prev) => {
        const updated = { ...prev };
        for (const slug of Object.keys(updated)) {
          const topics = updated[slug];
          const topicIndex = topics.findIndex((t) => t.id === id);
          if (topicIndex !== -1) {
            updated[slug] = topics.map((t) =>
              t.id === id ? { ...t, status, sessionId: sessionId || t.sessionId } : t
            );
            break;
          }
        }
        return updated;
      });
    },
    []
  );

  // On accept/reject, update local verdict state + refresh learn count
  const handleVerdictChange = useCallback((id: string, verdict: 'accepted' | 'rejected') => {
    setTopicsBySource((prev) => {
      const updated = { ...prev };
      for (const slug of Object.keys(updated)) {
        const topics = updated[slug];
        const topicIndex = topics.findIndex((t) => t.id === id);
        if (topicIndex !== -1) {
          updated[slug] = topics.map((t) =>
            t.id === id ? { ...t, userVerdict: verdict } : t
          );
          break;
        }
      }
      return updated;
    });
    learn.refreshCount();
    // Refresh research queue when a topic is accepted
    if (verdict === 'accepted') {
      research.refreshQueue();
    }
  }, [learn, research]);

  // Active topics count
  const activeTopicsCount = Object.values(topicsBySource).reduce(
    (count, topics) =>
      count + topics.filter((t) => t.status === 'queued' || t.status === 'researching').length,
    0
  );
  const hasActiveTopics = activeTopicsCount > 0;

  // Status polling
  const handleStatusUpdate = useCallback((updates: TopicStatusUpdate[]) => {
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    setTopicsBySource((prev) => {
      let changed = false;
      const next: Record<string, Topic[]> = {};
      for (const slug of Object.keys(prev)) {
        next[slug] = prev[slug].map((t) => {
          const update = updateMap.get(t.id);
          if (update) {
            changed = true;
            return { ...t, status: update.status, updatedAt: update.updatedAt, sessionId: update.sessionId || t.sessionId };
          }
          return t;
        });
      }
      return changed ? next : prev;
    });
  }, []);

  useStatusPolling(hasActiveTopics, handleStatusUpdate);

  // Manual refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAllActiveTopics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/topics/status?active=true');
      if (response.ok) {
        const data = await response.json();
        if (data.topics?.length > 0) {
          handleStatusUpdate(data.topics.map((t: { id: string; status: string; updatedAt: string; sessionId?: string }) => ({
            id: t.id,
            status: t.status as TopicStatus,
            updatedAt: t.updatedAt,
            sessionId: t.sessionId,
          })));
        }
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [handleStatusUpdate]);

  const totalToReview = Object.values(topicsBySource).reduce(
    (count, topics) => count + topics.filter((t) => t.status === 'new' && !t.userVerdict).length,
    0
  );

  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className={`
        flex-shrink-0
        ${initiateTheme.bgSecondary}
        border-b ${initiateTheme.borderSubtle}
      `}>
        {/* Top row */}
        <div className="h-[44px] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className={`text-sm font-medium ${initiateTheme.text}`}>
              Initiate
            </h1>
            <Link
              href="/maker"
              className={`
                flex items-center gap-1 px-2 py-1
                text-xs rounded
                ${initiateTheme.textMuted}
                hover:text-slate-100
                ${initiateTheme.bgHover}
                transition-colors
              `}
              title="Video Maker"
            >
              <Film size={12} />
              Maker
            </Link>
            {totalToReview > 0 && (
              <span className={`text-xs ${initiateTheme.textMuted}`}>
                {totalToReview} to review
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Discovery button */}
            <button
              onClick={terminalMode === 'discover' ? closeActiveTerminal : startDiscoverTerminal}
              disabled={discovery.isDiscovering && terminalMode !== 'discover'}
              className={`
                flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium rounded-lg
                transition-all duration-200
                ${terminalMode === 'discover'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/25 hover:border-cyan-500/40'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {discovery.isDiscovering ? (
                <>
                  <Sparkles size={12} className="animate-pulse" />
                  Discovering...
                  <ChevronUp size={12} className={terminalMode === 'discover' ? 'rotate-180' : ''} />
                </>
              ) : terminalMode === 'discover' ? (
                <>
                  <ChevronUp size={12} />
                  Hide Terminal
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Discover
                </>
              )}
            </button>

            {/* Learn button */}
            <button
              onClick={terminalMode === 'learn' ? closeActiveTerminal : startLearnTerminal}
              disabled={(learn.isLearning && terminalMode !== 'learn') || learn.unreviewedCount === 0}
              className={`
                flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium rounded-lg
                transition-all duration-200
                ${terminalMode === 'learn'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-500/15 text-slate-300 border border-slate-500/20 hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-500/30'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={learn.unreviewedCount === 0 ? 'No unreviewed topics' : `${learn.unreviewedCount} unreviewed topics`}
            >
              {learn.isLearning ? (
                <>
                  <BookOpen size={12} className="animate-pulse" />
                  Learning...
                  <ChevronUp size={12} className={terminalMode === 'learn' ? 'rotate-180' : ''} />
                </>
              ) : terminalMode === 'learn' ? (
                <>
                  <ChevronUp size={12} />
                  Hide Terminal
                </>
              ) : (
                <>
                  <BookOpen size={12} />
                  Learn
                  {learn.unreviewedCount > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-semibold bg-amber-500 text-slate-950 rounded-full">
                      {learn.unreviewedCount}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Queue */}
            <button
              onClick={() => setIsQueueOpen((prev) => !prev)}
              className={`
                relative flex items-center gap-1.5 px-2 py-1
                text-xs rounded
                ${isQueueOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : initiateTheme.buttonSecondary
                }
                transition-colors
              `}
              title="Toggle research queue"
            >
              <List size={12} />
              Queue
              {research.queue.length > 0 && (
                <span className="ml-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-semibold bg-cyan-500 text-slate-950 rounded-full">
                  {research.queue.length}
                </span>
              )}
            </button>

            {hasActiveTopics && (
              <button
                onClick={refreshAllActiveTopics}
                disabled={isRefreshing}
                className={`
                  p-1.5 rounded
                  ${initiateTheme.textMuted}
                  hover:text-slate-100
                  ${initiateTheme.bgHover}
                  transition-colors
                  disabled:opacity-50
                `}
                title="Refresh"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            )}

            {/* Keyboard hints */}
            <div className={`
              hidden sm:flex items-center gap-1
              text-[9px] ${initiateTheme.textMuted}
            `}>
              <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">J</kbd>
              <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">K</kbd>
              <span>nav</span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 ml-1">A</kbd>
              <span>accept</span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 ml-1">D</kbd>
              <span>reject</span>
            </div>
          </div>
        </div>

        {/* Expandable Terminal Area */}
        <AnimatePresence>
          {isTerminalOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 320, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden border-t border-slate-700/40"
            >
              <div className="h-[320px]">
                {terminalMode === 'discover' && (
                  <MakerTerminal
                    isOpen={discovery.isTerminalOpen}
                    projectPath={discovery.projectPath}
                    prompt={discovery.prompt}
                    autoStart={true}
                    onComplete={handleDiscoveryComplete}
                    onClose={closeActiveTerminal}
                    onError={discovery.handleError}
                    title="News Discovery"
                    composingLabel="Discovering..."
                  />
                )}
                {terminalMode === 'learn' && (
                  <MakerTerminal
                    isOpen={learn.isTerminalOpen}
                    projectPath={learn.projectPath}
                    prompt={learn.prompt}
                    autoStart={true}
                    onComplete={handleLearnComplete}
                    onClose={closeActiveTerminal}
                    onError={learn.handleError}
                    title="Preference Learning"
                    composingLabel="Learning preferences..."
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content area with optional queue sidebar + terminal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Research Queue (left sidebar) */}
        <ResearchQueue
          isOpen={isQueueOpen}
          topics={research.queue}
          activeTopicId={research.activeTopicId}
          isLoading={research.isLoading}
          onPlay={(topicId) => research.startResearch(topicId)}
          onRefresh={() => research.refreshQueue()}
          onClose={() => setIsQueueOpen(false)}
        />

        {/* Research Terminal (opens next to queue when playing) */}
        <AnimatePresence>
          {research.isTerminalOpen && research.activeTopicId && (
            <ResearchTerminal
              topic={research.queue.find((t) => t.id === research.activeTopicId) || { id: research.activeTopicId, title: 'Research', suggestedTemplate: null, researchQuery: null, sourceSlug: '', status: 'new' }}
              projectPath={research.projectPath}
              prompt={research.prompt}
              isResearching={research.isResearching}
              onComplete={() => {
                research.handleComplete();
                research.refreshQueue();
              }}
              onError={research.handleError}
              onClose={research.closeTerminal}
            />
          )}
        </AnimatePresence>

        {/* Source Columns Grid */}
        <div
          ref={containerRef}
          className={`
            initiate-grid-container flex-1 overflow-x-auto
            ${initiateTheme.scrollbar}
          `}
        >
          {DISPLAY_SOURCES.map((source, index) => (
            <SourceColumn
              key={source.slug}
              name={source.name}
              slug={source.slug}
              icon={ICON_MAP[source.slug] || Globe}
              color={source.color}
              isFirst={index === 0}
              topics={topicsBySource[source.slug] || []}
              onTopicStatusChange={handleTopicStatusChange}
              onVerdictChange={handleVerdictChange}
            />
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator
        containerRef={containerRef}
        totalColumns={DISPLAY_SOURCES.length}
      />
    </main>
  );
}

export default function InitiatePage() {
  return (
    <InitiateThemeProvider>
      <InitiatePageContent />
    </InitiateThemeProvider>
  );
}
