'use client';

import { useReportTheme } from '../core/ThemeContext';

export interface ViewModeOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface ViewModeToggleProps<T extends string = string> {
  options: ViewModeOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ViewModeToggle<T extends string = string>({
  options,
  value,
  onChange,
}: ViewModeToggleProps<T>) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <div className={`flex rounded-lg overflow-hidden ${isRadar ? 'bg-slate-800' : 'bg-stone-200'}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors flex items-center gap-1 ${
            value === option.value
              ? isRadar ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white text-stone-900'
              : isRadar ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
