'use client';

import { useEffect, useState, useCallback, RefObject } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { initiateTheme } from './InitiateTheme';

interface ScrollIndicatorProps {
  containerRef: RefObject<HTMLDivElement | null>;
  totalColumns: number;
}

export function ScrollIndicator({ containerRef, totalColumns }: ScrollIndicatorProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(1);
  const [activeKey, setActiveKey] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Estimate visible columns (280px min width per column)
      const visible = Math.floor(clientWidth / 280);
      setVisibleColumns(Math.min(visible, totalColumns));
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [containerRef, totalColumns]);

  const scrollTo = useCallback((direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 300; // ~1 column width
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }, [containerRef]);

  // Keyboard navigation: A = left, D = right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'a' && canScrollLeft) {
        e.preventDefault();
        scrollTo('left');
        setActiveKey('left');
        // Clear active state after brief highlight
        setTimeout(() => setActiveKey(null), 150);
      } else if (key === 'd' && canScrollRight) {
        e.preventDefault();
        scrollTo('right');
        setActiveKey('right');
        setTimeout(() => setActiveKey(null), 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollTo, canScrollLeft, canScrollRight]);

  return (
    <div className={`
      fixed bottom-6 right-6 z-20
      flex items-center gap-1
      ${initiateTheme.bgCard}
      border ${initiateTheme.borderAccent}
      rounded-full px-3 py-2
      ${initiateTheme.elevation2}
    `}>
      {/* Left: Key hint + button */}
      <div className="flex items-center gap-1.5">
        <kbd
          className={`
            min-w-[22px] h-[22px] flex items-center justify-center
            text-[10px] font-mono font-semibold uppercase
            rounded border transition-all duration-100
            ${activeKey === 'left'
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
              : `${initiateTheme.bgGlass} ${initiateTheme.borderSubtle} ${initiateTheme.textMuted}`
            }
            ${!canScrollLeft ? 'opacity-30' : ''}
          `}
        >
          A
        </kbd>
        <button
          onClick={() => scrollTo('left')}
          disabled={!canScrollLeft}
          className={`
            p-1.5 rounded-full
            transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed
            ${initiateTheme.bgHover}
            ${initiateTheme.textSecondary}
            hover:text-cyan-400
          `}
          aria-label="Scroll left (or press A)"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Column indicator */}
      <span className={`text-xs ${initiateTheme.textMuted} min-w-[50px] text-center tabular-nums`}>
        {visibleColumns}/{totalColumns}
      </span>

      {/* Right: button + Key hint */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => scrollTo('right')}
          disabled={!canScrollRight}
          className={`
            p-1.5 rounded-full
            transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed
            ${initiateTheme.bgHover}
            ${initiateTheme.textSecondary}
            hover:text-cyan-400
          `}
          aria-label="Scroll right (or press D)"
        >
          <ChevronRight size={16} />
        </button>
        <kbd
          className={`
            min-w-[22px] h-[22px] flex items-center justify-center
            text-[10px] font-mono font-semibold uppercase
            rounded border transition-all duration-100
            ${activeKey === 'right'
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
              : `${initiateTheme.bgGlass} ${initiateTheme.borderSubtle} ${initiateTheme.textMuted}`
            }
            ${!canScrollRight ? 'opacity-30' : ''}
          `}
        >
          D
        </kbd>
      </div>
    </div>
  );
}
