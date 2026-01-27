'use client';

import { useThemeStore, ThemeName } from '@/src/stores/themeStore';

const themes: { id: ThemeName; label: string; description: string }[] = [
  { id: 'radar', label: 'Radar', description: 'Dark, ambient' },
  { id: 'swiss', label: 'Swiss', description: 'Clean, minimal' },
  { id: 'organic', label: 'Organic', description: 'Fluid, natural' },
];

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className={`flex gap-1 p-1 bg-[var(--warm-gray-100)] rounded-lg ${className || ''}`}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            theme === t.id
              ? 'bg-white shadow-sm text-[var(--charcoal)]'
              : 'text-[var(--warm-gray-500)] hover:text-[var(--charcoal)]'
          }`}
          aria-pressed={theme === t.id}
          title={t.description}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
