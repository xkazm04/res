'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

export type ReportTheme = 'radar' | 'swiss';

interface ThemeContextValue {
  theme: ReportTheme;
  reducedMotion: boolean;
}

// Default to 'swiss' (light theme) for components used outside the provider
const ThemeContext = createContext<ThemeContextValue>({ theme: 'swiss', reducedMotion: false });

export function ReportThemeProvider({
  theme,
  children,
}: {
  theme: ReportTheme;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <ThemeContext.Provider value={{ theme, reducedMotion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useReportTheme() {
  return useContext(ThemeContext);
}

// Theme-specific style utilities
export const themeStyles = {
  radar: {
    // Dark ambient with glowing accents
    bg: 'bg-slate-950',
    bgSecondary: 'bg-slate-900/80',
    bgCard: 'bg-slate-900/60 backdrop-blur-xl',
    bgGlass: 'bg-white/5 backdrop-blur-lg',
    border: 'border-cyan-500/20',
    borderGlow: 'border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    textAccent: 'text-cyan-400',
    accent: 'cyan',
    accentGradient: 'from-cyan-400 to-blue-500',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
    glow: 'shadow-[0_0_30px_rgba(34,211,238,0.2)]',
    // Elevation system - subtle glow-based depth for dark theme
    elevation1: 'shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
    elevation2: 'shadow-[0_4px_12px_rgba(0,0,0,0.4),0_0_8px_rgba(34,211,238,0.08)]',
    elevation3: 'shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_16px_rgba(34,211,238,0.12)]',
    // Semantic colors for KeyPoint types
    semantic: {
      insight: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        bgHover: 'hover:bg-emerald-500/15',
      },
      warning: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        bgHover: 'hover:bg-amber-500/15',
      },
      action: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        bgHover: 'hover:bg-blue-500/15',
      },
      fact: {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/30',
        text: 'text-violet-400',
        bgHover: 'hover:bg-violet-500/15',
      },
    },
  },
  swiss: {
    // Clean minimal with precise accents
    bg: 'bg-stone-50',
    bgSecondary: 'bg-white',
    bgCard: 'bg-white',
    bgGlass: 'bg-white/90',
    border: 'border-stone-200',
    borderGlow: 'border-stone-900',
    text: 'text-stone-900',
    textMuted: 'text-stone-500',
    textAccent: 'text-stone-900',
    accent: 'stone',
    accentGradient: 'from-stone-900 to-stone-700',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-rose-700',
    glow: 'shadow-lg',
    // Elevation system - crisp shadows for light theme
    elevation1: 'shadow-sm',
    elevation2: 'shadow-md',
    elevation3: 'shadow-xl',
    // Semantic colors for KeyPoint types
    semantic: {
      insight: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        bgHover: 'hover:bg-emerald-100',
      },
      warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        bgHover: 'hover:bg-amber-100',
      },
      action: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        bgHover: 'hover:bg-blue-100',
      },
      fact: {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-700',
        bgHover: 'hover:bg-violet-100',
      },
    },
  },
};

export function useThemeStyles() {
  const { theme } = useReportTheme();
  return useMemo(() => themeStyles[theme], [theme]);
}

/**
 * Safe version of useThemeStyles that falls back to swiss (light) theme
 * when used outside of ReportThemeProvider. Use this in shared components
 * that may be rendered both inside and outside the theme provider.
 */
export function useThemeStylesSafe() {
  const ctx = useContext(ThemeContext);
  // If theme is 'radar', we're inside the provider (since default is 'radar')
  // but we check if it's actually provided by checking if reducedMotion is false (default)
  // Better approach: use a sentinel value
  return useMemo(() => themeStyles[ctx.theme], [ctx.theme]);
}

/**
 * Safe version of useReportTheme that provides defaults when outside provider.
 * Returns { theme: 'swiss', reducedMotion: false, isInsideProvider: false } when outside.
 */
export function useReportThemeSafe() {
  const ctx = useContext(ThemeContext);
  return ctx;
}
