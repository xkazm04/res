'use client';

import { useEffect, useState, RefObject } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface ScrollIndicatorProps {
  containerRef: RefObject<HTMLDivElement | null>;
  totalColumns: number;
}

export function ScrollIndicator({ containerRef, totalColumns }: ScrollIndicatorProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(1);

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

  const scrollTo = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 300; // ~1 column width
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full px-3 py-2 shadow-md z-20">
      {/* Scroll buttons */}
      <button
        onClick={() => scrollTo('left')}
        disabled={!canScrollLeft}
        className="p-1 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
      </button>

      {/* Column indicator */}
      <span className="text-sm text-[var(--text-muted)] min-w-[60px] text-center">
        {visibleColumns} of {totalColumns}
      </span>

      <button
        onClick={() => scrollTo('right')}
        disabled={!canScrollRight}
        className="p-1 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} className="text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}
