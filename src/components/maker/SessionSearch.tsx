'use client';

import { Search, X } from 'lucide-react';

interface SessionSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SessionSearch({ value, onChange }: SessionSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search sessions..."
        className="w-full pl-10 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg
          text-white placeholder-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
          transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
