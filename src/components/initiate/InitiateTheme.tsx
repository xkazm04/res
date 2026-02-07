'use client';

/**
 * Initiate Page Theme
 *
 * Extends the radar theme from ThemeContext with additional semantic colors
 * for topic signals, status badges, bias indicators, and debunkability scores.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

// Signal semantic colors (breaking, trending, controversial)
export const signalStyles = {
  breaking: {
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_8px_rgba(244,63,94,0.3)]',
  },
  trending: {
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'shadow-[0_0_8px_rgba(139,92,246,0.3)]',
  },
  controversial: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
  },
};

// Status style type
interface StatusStyle {
  bg: string;
  border: string;
  text: string;
  icon: string;
  pulse?: boolean;
}

// Status semantic colors
export const statusStyles: Record<string, StatusStyle> = {
  new: {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    icon: 'text-cyan-400',
  },
  queued: {
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    icon: 'text-slate-400',
  },
  researching: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    icon: 'text-blue-400',
    pulse: true,
  },
  completed: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
  },
  failed: {
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    icon: 'text-rose-400',
  },
  deleted: {
    bg: 'bg-slate-700/20',
    border: 'border-slate-600/30',
    text: 'text-slate-500',
    icon: 'text-slate-500',
  },
};

// Source bias indicator colors
export const biasStyles = {
  left: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  'center-left': {
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
  },
  center: {
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/30',
    text: 'text-slate-300',
  },
  'center-right': {
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
  },
  right: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
};

// Debunkability score colors (1-5 scale)
export const debunkabilityStyles = {
  1: { bg: 'bg-rose-500/15', text: 'text-rose-400', label: 'Hard to verify' },
  2: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Difficult' },
  3: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Moderate effort' },
  4: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Verifiable' },
  5: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', label: 'Easily verifiable' },
};

// Template badge colors
export const templateStyles: Record<string, { bg: string; text: string; label: string }> = {
  debunk_claim: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Debunk' },
  actor_investigation: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Actor' },
  event_timeline: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Timeline' },
  policy_analysis: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Policy' },
  financial_investigation: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Financial' },
  controversy_analysis: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Controversy' },
};

// Core initiate theme styles (radar-based)
export const initiateTheme = {
  // Backgrounds
  bg: 'bg-slate-950',
  bgSecondary: 'bg-slate-900/80',
  bgCard: 'bg-slate-900/60 backdrop-blur-xl',
  bgGlass: 'bg-white/5 backdrop-blur-lg',
  bgHover: 'hover:bg-white/5',
  bgSelected: 'bg-cyan-500/10',

  // Borders
  border: 'border-slate-800/60',
  borderSubtle: 'border-slate-800/40',
  borderAccent: 'border-cyan-500/20',
  borderGlow: 'border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]',

  // Text
  text: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-500',
  textAccent: 'text-cyan-400',

  // Accent colors
  accent: 'cyan',
  accentBg: 'bg-cyan-500/15',
  accentText: 'text-cyan-400',
  accentBorder: 'border-cyan-500/30',

  // Elevation system with subtle glow
  elevation1: 'shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
  elevation2: 'shadow-[0_4px_12px_rgba(0,0,0,0.4),0_0_8px_rgba(34,211,238,0.08)]',
  elevation3: 'shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_16px_rgba(34,211,238,0.12)]',

  // Glow effects
  glow: 'shadow-[0_0_30px_rgba(34,211,238,0.2)]',
  glowSubtle: 'shadow-[0_0_15px_rgba(34,211,238,0.1)]',

  // Interactive states
  hoverGlow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]',
  focusRing: 'focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-0',

  // Button styles
  buttonPrimary: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 hover:border-cyan-400/50',
  buttonSecondary: 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-100',
  buttonDanger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25',

  // Scrollbar styling
  scrollbar: '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/50',
};

// Context for initiate theme
interface InitiateThemeContextValue {
  reducedMotion: boolean;
}

const InitiateThemeContext = createContext<InitiateThemeContextValue>({
  reducedMotion: false,
});

export function InitiateThemeProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  const value = useMemo(() => ({ reducedMotion }), [reducedMotion]);

  return (
    <InitiateThemeContext.Provider value={value}>
      <div className={`${initiateTheme.bg} min-h-screen`}>{children}</div>
    </InitiateThemeContext.Provider>
  );
}

export function useInitiateTheme() {
  return useContext(InitiateThemeContext);
}

// Helper to get signal style
export function getSignalStyle(signal: string) {
  return signalStyles[signal as keyof typeof signalStyles] || signalStyles.trending;
}

// Helper to get status style
export function getStatusStyle(status: string) {
  return statusStyles[status as keyof typeof statusStyles] || statusStyles.new;
}

// Helper to get bias style
export function getBiasStyle(bias: string) {
  return biasStyles[bias as keyof typeof biasStyles] || biasStyles.center;
}

// Helper to get debunkability style
export function getDebunkabilityStyle(score: number) {
  const clampedScore = Math.max(1, Math.min(5, score)) as 1 | 2 | 3 | 4 | 5;
  return debunkabilityStyles[clampedScore];
}

// Helper to get template style
export function getTemplateStyle(template: string) {
  return templateStyles[template] || { bg: 'bg-slate-500/10', text: 'text-slate-400', label: template };
}
