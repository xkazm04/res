'use client';

import { memo } from 'react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  minScale?: number;
  maxScale?: number;
}

/**
 * Zoom control buttons for the strategic map
 */
export const ZoomControls = memo(function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  minScale = 0.1,
  maxScale = 3.0,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);
  const canZoomIn = scale < maxScale;
  const canZoomOut = scale > minScale;

  return (
    <div className="flex flex-col gap-1 bg-[#1A1A1E]/90 backdrop-blur-sm rounded-lg p-1 border border-[#27272A] shadow-lg transition-all duration-200 hover:border-[#3F3F46]">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={`
          w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150
          ${canZoomIn
            ? 'text-[#A1A1AA] hover:text-[#E8E8E8] hover:bg-[#27272A] active:scale-90 focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none'
            : 'text-[#52525B] cursor-not-allowed opacity-50'
          }
        `}
        title="Zoom In (+)"
        aria-label="Zoom in"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11L14 14" />
          <path d="M7 5V9M5 7H9" />
        </svg>
      </button>

      {/* Percentage indicator */}
      <div className="text-[10px] text-[#71717A] text-center font-mono py-1">
        {percentage}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={`
          w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150
          ${canZoomOut
            ? 'text-[#A1A1AA] hover:text-[#E8E8E8] hover:bg-[#27272A] active:scale-90 focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none'
            : 'text-[#52525B] cursor-not-allowed opacity-50'
          }
        `}
        title="Zoom Out (-)"
        aria-label="Zoom out"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11L14 14" />
          <path d="M5 7H9" />
        </svg>
      </button>

      {/* Divider */}
      <div className="h-px bg-[#27272A] my-1" />

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-8 h-8 flex items-center justify-center rounded-md text-[#A1A1AA] hover:text-[#E8E8E8] hover:bg-[#27272A] transition-all duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none"
        title="Reset View (Home)"
        aria-label="Reset view"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 8L8 3L13 8" />
          <path d="M5 7V13H11V7" />
        </svg>
      </button>
    </div>
  );
});
