'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { useAppStore } from '@/src/stores/appStore';
import { getSessionIndex } from '@/src/lib/sessionIndex';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { SessionSearch } from './SessionSearch';
import { TemplateFilter } from './TemplateFilter';
import { SessionCard } from './SessionCard';
import { SessionContextMenu } from './SessionContextMenu';

interface SessionBrowserProps {
  onSelectSession: (sessionId: string) => void;
  selectedId: string | null;
}

interface ContextMenuState {
  sessionId: string;
  sessionTitle: string;
  position: { x: number; y: number };
}

export function SessionBrowser({ onSelectSession, selectedId }: SessionBrowserProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { fetchSessions, sessions, sessionsLoading, deleteSession } = useAppStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const debouncedQuery = useDebouncedValue(searchQuery, 150);

  const filteredSessions = useMemo(() => {
    const index = getSessionIndex();

    if (debouncedQuery.trim()) {
      return index.search(debouncedQuery, { template: templateFilter || undefined, limit: 100 });
    }

    if (templateFilter) {
      return index.getByTemplate(templateFilter);
    }

    return index.getAll().sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [debouncedQuery, templateFilter, sessions]);

  const virtualizer = useVirtualizer({
    count: filteredSessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 5,
  });

  const hasFilters = searchQuery || templateFilter;

  const handleContextMenu = useCallback((sessionId: string, sessionTitle: string, e: React.MouseEvent) => {
    setContextMenu({
      sessionId,
      sessionTitle,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);

    // Clear selection if deleting the currently selected session
    if (selectedId === id) {
      onSelectSession('');
    }

    // Wait for the exit animation to play before actually deleting
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = await deleteSession(id);
    if (!success) {
      // If delete failed, clear the deleting state to restore the card
      setDeletingId(null);
    }
  }, [deleteSession, selectedId, onSelectSession]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-slate-800/80">
        <h2 className="text-sm font-semibold text-white tracking-tight mb-3">
          Research Sessions
        </h2>
        <SessionSearch value={searchQuery} onChange={setSearchQuery} />
      </header>

      {/* Filters */}
      <div className="border-b border-slate-800/60">
        <TemplateFilter value={templateFilter} onChange={setTemplateFilter} />
      </div>

      {/* Session List */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent"
      >
        {sessionsLoading && filteredSessions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 px-4">
            <p className="text-sm">No sessions found</p>
            {hasFilters && (
              <button
                onClick={() => { setSearchQuery(''); setTemplateFilter(null); }}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const session = filteredSessions[virtualRow.index];
              const isDeleting = deletingId === session.id;

              return (
                <div
                  key={session.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="px-2 py-1"
                >
                  <AnimatePresence mode="popLayout">
                    {!isDeleting && (
                      <motion.div
                        key={session.id}
                        initial={false}
                        exit={{
                          opacity: 0,
                          x: -60,
                          height: 0,
                          marginTop: 0,
                          marginBottom: 0,
                          paddingTop: 0,
                          paddingBottom: 0,
                          transition: {
                            opacity: { duration: 0.2 },
                            x: { duration: 0.25, ease: [0.36, 0, 0.66, -0.56] as const },
                            height: { duration: 0.25, delay: 0.05 },
                          },
                        }}
                      >
                        <SessionCard
                          session={session}
                          isSelected={selectedId === session.id}
                          onSelect={() => onSelectSession(session.id)}
                          onContextMenu={(e) => handleContextMenu(session.id, session.title, e)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 border-t border-slate-800/60">
        <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
        </span>
      </footer>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <SessionContextMenu
            key={contextMenu.sessionId}
            sessionId={contextMenu.sessionId}
            sessionTitle={contextMenu.sessionTitle}
            position={contextMenu.position}
            onClose={handleCloseContextMenu}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
