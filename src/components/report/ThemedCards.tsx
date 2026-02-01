'use client';

import { motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { useReportTheme, useThemeStyles } from './core/ThemeContext';
import { AnimatedNumber, AnimatedProgressRing } from './core/AnimatedNumber';
import { ChevronRightIcon } from './shared/Icons';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  subtext?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
  showRing?: boolean;
  delay?: number;
}

export function ThemedStatCard({ label, value, suffix = '', subtext, color = 'default', showRing, delay = 0 }: StatCardProps) {
  const { theme } = useReportTheme();
  return theme === 'radar' ? (
    <RadarStatCard {...{ label, value, suffix, subtext, color, showRing, delay }} />
  ) : (
    <SwissStatCard {...{ label, value, suffix, subtext, color, delay }} />
  );
}

function RadarStatCard({ label, value, suffix, subtext, color, showRing, delay }: StatCardProps) {
  const styles = useThemeStyles();
  const colors = {
    default: { ring: '#22d3ee', text: 'text-cyan-400' },
    success: { ring: '#34d399', text: 'text-emerald-400' },
    warning: { ring: '#fbbf24', text: 'text-amber-400' },
    danger: { ring: '#f87171', text: 'text-rose-400' },
  };
  const c = colors[color || 'default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm overflow-hidden group hover:border-cyan-500/40 transition-all ${styles.elevation1} hover:${styles.elevation2}`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all" />

      <div className="relative flex items-center gap-3">
        {showRing && (
          <AnimatedProgressRing
            value={value}
            size={48}
            strokeWidth={4}
            color={c.ring}
            bgColor="rgba(255,255,255,0.05)"
            showValue={false}
          />
        )}
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
          <div className={`text-2xl font-bold ${c.text}`}>
            <AnimatedNumber value={value} suffix={suffix} />
          </div>
          {subtext && <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>}
        </div>
      </div>
    </motion.div>
  );
}

function SwissStatCard({ label, value, suffix, subtext, color, delay }: StatCardProps) {
  const styles = useThemeStyles();
  const colors = {
    default: 'text-stone-900',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-rose-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={`p-4 border-l-2 border-stone-900 bg-white ${styles.elevation1}`}
    >
      <div className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mb-2">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${colors[color || 'default']}`}>
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      {subtext && <div className="text-xs text-stone-500 mt-1">{subtext}</div>}
    </motion.div>
  );
}

interface SectionCardProps {
  title: string;
  count?: number;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  delay?: number;
}

export function ThemedSection({ title, count, children, collapsible = false, defaultExpanded = true, delay = 0 }: SectionCardProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isRadar = theme === 'radar';

  const headerContent = (
    <>
      <div className="flex items-center gap-2">
        {collapsible && (
          <span className={`w-4 h-4 transition-transform ${isRadar ? 'text-slate-400' : 'text-stone-400'} ${expanded ? 'rotate-90' : ''}`}>
            <ChevronRightIcon />
          </span>
        )}
        <h3 className={`text-sm font-medium ${isRadar ? 'text-white' : 'text-stone-900 font-semibold uppercase tracking-wider'}`}>
          {title}
        </h3>
      </div>
      {count !== undefined && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          isRadar ? 'bg-cyan-500/20 text-cyan-400' : 'bg-stone-100 text-stone-600'
        }`}>
          {count}
        </span>
      )}
    </>
  );

  if (isRadar) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`rounded-xl bg-slate-900/40 border border-cyan-500/10 overflow-hidden ${styles.elevation1}`}
      >
        <div
          className={`px-4 py-3 border-b border-cyan-500/10 flex items-center justify-between ${
            collapsible ? 'cursor-pointer hover:bg-slate-800/50 transition-colors' : ''
          }`}
          onClick={() => collapsible && setExpanded(!expanded)}
        >
          {headerContent}
        </div>
        {(!collapsible || expanded) && <div className="p-4">{children}</div>}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={`bg-white border border-stone-200 rounded-xl overflow-hidden ${styles.elevation1}`}
    >
      <div
        className={`px-4 py-3 border-b border-stone-100 flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:bg-stone-50 transition-colors' : ''
        }`}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        {headerContent}
      </div>
      {(!collapsible || expanded) && <div className="p-4">{children}</div>}
    </motion.div>
  );
}

export function ThemedBadge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' }) {
  const { theme } = useReportTheme();

  const radarColors = {
    default: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  const swissColors = {
    default: 'bg-stone-100 text-stone-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
  };

  const colors = theme === 'radar' ? radarColors : swissColors;

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${colors[variant]} ${theme === 'radar' ? 'border' : ''}`}>
      {children}
    </span>
  );
}
