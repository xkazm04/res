'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { StrategicMapNode } from '@/src/lib/strategicMap';
import { getSessionIndex } from '@/src/lib/sessionIndex';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (nodeId: string) => void;
  nodes: StrategicMapNode[];
  onHighlight: (nodeIds: Set<string>) => void;
}

interface SearchResult {
  id: string;
  title: string;
  query: string;
  template_type: string;
  nodeId: string | null;
}

const MAX_RECENT = 5;
const RECENT_STORAGE_KEY = 'radar-search-recent';

export function SearchOverlay({
  isOpen,
  onClose,
  onSelect,
  nodes,
  onHighlight,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build node lookup
  const nodeBySessionId = useMemo(() => {
    const map = new Map<string, StrategicMapNode>();
    for (const node of nodes) {
      if (node.session) {
        map.set(node.session.id, node);
      }
    }
    return map;
  }, [nodes]);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      onHighlight(new Set());
      return;
    }

    const index = getSessionIndex();
    const matches = index.search(query, { limit: 10 });

    const searchResults: SearchResult[] = matches.map(session => ({
      id: session.id,
      title: session.title,
      query: session.query,
      template_type: session.template_type,
      nodeId: nodeBySessionId.get(session.id)?.id || null,
    }));

    setResults(searchResults);
    setSelectedIndex(0);

    // Highlight matching nodes
    const matchingNodeIds = new Set<string>();
    for (const result of searchResults) {
      if (result.nodeId) {
        matchingNodeIds.add(result.nodeId);
      }
    }
    onHighlight(matchingNodeIds);
  }, [query, nodeBySessionId, onHighlight]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;

      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]?.nodeId) {
          handleSelect(results[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onClose]);

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
    if (!result.nodeId) return;

    // Save to recent
    const newRecent = [query, ...recentSearches.filter(r => r !== query)].slice(0, MAX_RECENT);
    setRecentSearches(newRecent);
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(newRecent));
    } catch {
      // Ignore
    }

    onSelect(result.nodeId);
    onClose();
  }, [query, recentSearches, onSelect, onClose]);

  // Handle clicking recent search
  const handleRecentClick = useCallback((recent: string) => {
    setQuery(recent);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Search panel */}
      <div className="relative w-full max-w-xl mx-4 bg-[#1A1A1E] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#27272A]">
          <svg
            className="w-5 h-5 text-[#71717A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search sessions..."
            className="flex-1 bg-transparent text-[#E8E8E8] placeholder-[#52525B] outline-none text-lg transition-colors duration-150 focus:text-white"
          />
          <kbd className="px-2 py-0.5 text-xs text-[#52525B] bg-[#27272A] rounded">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 ${
                  index === selectedIndex
                    ? 'bg-[#22D3EE]/10'
                    : 'hover:bg-[#27272A] active:bg-[#27272A]/80'
                }`}
              >
                <div
                  className="w-2 h-2 mt-2 rounded-full flex-shrink-0 transition-transform duration-150 group-hover:scale-125"
                  style={{
                    backgroundColor: result.nodeId ? '#22D3EE' : '#52525B',
                    boxShadow: result.nodeId ? '0 0 6px rgba(34, 211, 238, 0.4)' : 'none',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[#E8E8E8] truncate">{result.title}</div>
                  <div className="text-sm text-[#71717A] truncate">
                    {result.query}
                  </div>
                </div>
                <span className="text-xs text-[#52525B] uppercase">
                  {result.template_type?.replace('_', ' ')}
                </span>
              </button>
            ))
          ) : query ? (
            <div className="px-4 py-8 text-center text-[#71717A]">
              No sessions found
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs text-[#52525B] uppercase">
                Recent Searches
              </div>
              {recentSearches.map((recent, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentClick(recent)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#27272A] transition-all duration-150 active:bg-[#27272A]/80"
                >
                  <svg
                    className="w-4 h-4 text-[#52525B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[#A1A1AA]">{recent}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[#71717A]">
              Type to search sessions
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#27272A] text-xs text-[#52525B]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#27272A] rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#27272A] rounded">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#27272A] rounded">↵</kbd>
            select
          </span>
        </div>
      </div>
    </div>
  );
}
