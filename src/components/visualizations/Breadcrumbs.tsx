'use client';

import type { BreadcrumbItem } from '@/src/lib/strategicMap/types';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onBack: () => void;
}

/**
 * Breadcrumb navigation for drill-down visualization.
 * Shows the current path: Overview → Template → Topic
 */
export function Breadcrumbs({ items, onNavigate, onBack }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-1 bg-[#1A1A1E]/90 backdrop-blur-sm border border-[#27272A] rounded-lg px-3 py-2 shadow-lg transition-all duration-200 hover:border-[#3F3F46]">
      {/* Back button */}
      <button
        onClick={onBack}
        className="p-1.5 rounded hover:bg-[#27272A] transition-all duration-150 mr-2 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none"
        title="Go back (Esc)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A1A1AA" strokeWidth="1.5" className="transition-transform duration-150 hover:-translate-x-0.5">
          <path d="M10 12L6 8L10 4" />
        </svg>
      </button>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center">
          {index > 0 && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#52525B" strokeWidth="1.5" className="mx-1">
              <path d="M6 4L10 8L6 12" />
            </svg>
          )}

          <button
            onClick={() => onNavigate(item.id)}
            className={`
              flex items-center gap-2 px-2 py-1 rounded transition-all duration-150
              ${index === items.length - 1
                ? 'text-[#E8E8E8] cursor-default'
                : 'text-[#A1A1AA] hover:text-[#E8E8E8] hover:bg-[#27272A] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none'
              }
            `}
            disabled={index === items.length - 1}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: item.color, boxShadow: `0 0 4px ${item.color}40` }}
            />
            <span className="text-sm font-medium max-w-[120px] truncate">
              {item.label}
            </span>
          </button>
        </div>
      ))}

      {/* Keyboard hint */}
      <div className="ml-4 text-[10px] text-[#52525B] hidden sm:block">
        Esc to go back
      </div>
    </div>
  );
}
