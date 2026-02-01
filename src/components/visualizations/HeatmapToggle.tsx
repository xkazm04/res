'use client';

import { useState, useCallback } from 'react';
import type { RenderMode } from '@/src/lib/strategicMap';

interface HeatmapToggleProps {
  mode: RenderMode;
  onChange: (mode: RenderMode) => void;
}

const MODES: { value: RenderMode; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Original colors' },
  { value: 'heatmap-recency', label: 'Recency', description: 'Green = recent, Gray = old' },
  { value: 'heatmap-density', label: 'Density', description: 'By finding count' },
  { value: 'heatmap-status', label: 'Status', description: 'Completion status' },
];

export function HeatmapToggle({ mode, onChange }: HeatmapToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentMode = MODES.find(m => m.value === mode) || MODES[0];

  const handleSelect = useCallback((newMode: RenderMode) => {
    onChange(newMode);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
          mode === 'default'
            ? 'bg-[#1A1A1E] border-[#27272A] text-[#A1A1AA] hover:text-[#E8E8E8]'
            : 'bg-[#22D3EE]/10 border-[#22D3EE]/30 text-[#22D3EE]'
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="text-xs font-medium">{currentMode.label}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1A1A1E] border border-[#27272A] rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="px-3 py-2 border-b border-[#27272A]">
              <span className="text-xs text-[#52525B] uppercase">View Mode</span>
            </div>

            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => handleSelect(m.value)}
                className={`w-full flex flex-col items-start px-3 py-2 text-left transition-colors ${
                  mode === m.value
                    ? 'bg-[#22D3EE]/10 text-[#22D3EE]'
                    : 'text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#E8E8E8]'
                }`}
              >
                <span className="text-sm font-medium">{m.label}</span>
                <span className="text-xs opacity-70">{m.description}</span>
              </button>
            ))}

            {/* Legend */}
            {mode !== 'default' && (
              <div className="px-3 py-2 border-t border-[#27272A]">
                <div className="text-xs text-[#52525B] mb-2">Legend</div>
                {mode === 'heatmap-recency' && (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 rounded-full bg-gradient-to-r from-[#6B7280] to-[#22C55E]" />
                    <span className="text-xs text-[#71717A]">Old → Recent</span>
                  </div>
                )}
                {mode === 'heatmap-density' && (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#EC4899]" />
                    <span className="text-xs text-[#71717A]">Few → Many</span>
                  </div>
                )}
                {mode === 'heatmap-status' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                      <span className="text-xs text-[#71717A]">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FACC15]" />
                      <span className="text-xs text-[#71717A]">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                      <span className="text-xs text-[#71717A]">Failed</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
