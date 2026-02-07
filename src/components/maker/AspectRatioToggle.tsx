'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone } from 'lucide-react';

export type AspectRatio = 'standard' | 'shorts';

interface AspectRatioToggleProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
}

const OPTIONS: { key: AspectRatio; label: string; Icon: React.ComponentType<{ className?: string }>; title: string }[] = [
  { key: 'standard', label: '16:9', Icon: Monitor, title: '16:9 Standard (YouTube)' },
  { key: 'shorts', label: '9:16', Icon: Smartphone, title: '9:16 Shorts (YouTube Shorts, TikTok, Reels)' },
];

export const AspectRatioToggle = memo(function AspectRatioToggle({ value, onChange }: AspectRatioToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/40 rounded-lg border border-slate-700/30">
      {OPTIONS.map(opt => {
        const isActive = value === opt.key;
        const OptIcon = opt.Icon;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'}
            `}
            title={opt.title}
          >
            {isActive && (
              <motion.div
                layoutId="aspectRatioBg"
                className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/30 rounded-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <OptIcon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
