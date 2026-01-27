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
    <div className={`flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg ${className || ''}`}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            theme === t.id
              ? 'bg-[var(--bg-elevated)] shadow-sm text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
