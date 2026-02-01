'use client';

import { motion } from 'framer-motion';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { AnimatedNumber, AnimatedProgressRing } from '../core/AnimatedNumber';

interface MetricData {
  label: string;
  value: number;
  max?: number;
  trend?: 'up' | 'down' | 'stable';
  sublabel?: string;
}

interface IntelDashboardProps {
  confidence: number;
  findings: MetricData;
  sources: MetricData;
  coverage: number;
  reliability: number;
  completeness: number;
  alerts: number;
}

export function IntelDashboard({
  confidence,
  findings,
  sources,
  coverage,
  reliability,
  completeness,
  alerts,
}: IntelDashboardProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className={`grid grid-cols-12 gap-2 p-4 rounded-xl ${isRadar ? 'bg-slate-900/80' : 'bg-white border border-stone-200'}`}>
      {/* Main confidence gauge - spans 4 columns */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`col-span-4 row-span-2 flex flex-col items-center justify-center p-4 rounded-xl ${isRadar ? 'bg-slate-950/50 border border-cyan-500/20' : 'bg-stone-50'}`}
      >
        <div className="relative">
          <AnimatedProgressRing
            value={confidence}
            size={120}
            strokeWidth={8}
            color={isRadar ? '#22d3ee' : '#0ea5e9'}
            bgColor={isRadar ? 'rgba(34,211,238,0.1)' : 'rgba(0,0,0,0.05)'}
            showValue={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${isRadar ? 'text-cyan-400' : 'text-stone-900'}`}>
              <AnimatedNumber value={confidence} />
            </span>
            <span className={`text-[11px] uppercase tracking-wider ${styles.textMuted}`}>Confidence</span>
          </div>
        </div>
        <StatusIndicator value={confidence} />
      </motion.div>

      {/* Findings metric */}
      <MetricCard metric={findings} delay={0.1} color="blue" />

      {/* Sources metric */}
      <MetricCard metric={sources} delay={0.15} color="purple" />

      {/* Coverage gauge */}
      <GaugeCard label="Coverage" value={coverage} delay={0.2} color="emerald" />

      {/* Reliability gauge */}
      <GaugeCard label="Reliability" value={reliability} delay={0.25} color="amber" />

      {/* Completeness gauge */}
      <GaugeCard label="Completeness" value={completeness} delay={0.3} color="cyan" />

      {/* Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`col-span-4 p-4 rounded-xl ${
          alerts > 0
            ? isRadar ? 'bg-rose-500/10 border border-rose-500/30' : 'bg-rose-50 border border-rose-200'
            : isRadar ? 'bg-slate-800/50' : 'bg-stone-50'
        }`}
      >
        <div className={`text-[11px] uppercase tracking-wider mb-1 ${alerts > 0 ? (isRadar ? 'text-rose-400' : 'text-rose-600') : styles.textMuted}`}>
          Alerts
        </div>
        <div className={`text-2xl font-bold ${alerts > 0 ? (isRadar ? 'text-rose-400' : 'text-rose-600') : styles.text}`}>
          <AnimatedNumber value={alerts} />
        </div>
        {alerts > 0 && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-[11px] ${isRadar ? 'text-rose-400/60' : 'text-rose-500'}`}
          >
            Requires attention
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function MetricCard({ metric, delay, color }: { metric: MetricData; delay: number; color: string }) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  const trendIcon = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`col-span-4 p-4 rounded-xl ${isRadar ? 'bg-slate-800/50' : 'bg-stone-50'}`}
    >
      <div className={`text-[11px] uppercase tracking-wider mb-1 ${styles.textMuted}`}>{metric.label}</div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${styles.text}`}>
          <AnimatedNumber value={metric.value} />
        </span>
        {metric.max && (
          <span className={`text-sm ${styles.textMuted}`}>/ {metric.max}</span>
        )}
        {metric.trend && (
          <span className={`text-sm ${metric.trend === 'up' ? 'text-emerald-500' : metric.trend === 'down' ? 'text-rose-500' : styles.textMuted}`}>
            {trendIcon[metric.trend]}
          </span>
        )}
      </div>
      {metric.sublabel && (
        <div className={`text-[11px] mt-1 ${styles.textMuted}`}>{metric.sublabel}</div>
      )}
    </motion.div>
  );
}

function GaugeCard({ label, value, delay, color }: { label: string; value: number; delay: number; color: string }) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  const colorMap: Record<string, string> = {
    emerald: isRadar ? '#34d399' : '#059669',
    amber: isRadar ? '#fbbf24' : '#d97706',
    cyan: isRadar ? '#22d3ee' : '#0891b2',
    blue: isRadar ? '#60a5fa' : '#2563eb',
    purple: isRadar ? '#a78bfa' : '#7c3aed',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`col-span-4 p-4 rounded-xl ${isRadar ? 'bg-slate-800/50' : 'bg-stone-50'}`}
    >
      <div className={`text-[11px] uppercase tracking-wider mb-2 ${styles.textMuted}`}>{label}</div>
      <div className="flex items-center gap-2">
        <AnimatedProgressRing
          value={value}
          size={40}
          strokeWidth={4}
          color={colorMap[color]}
          bgColor={isRadar ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
        />
        <span className={`text-2xl font-bold ${styles.text}`}>
          <AnimatedNumber value={value} suffix="%" />
        </span>
      </div>
    </motion.div>
  );
}

function StatusIndicator({ value }: { value: number }) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const status = value >= 80 ? 'HIGH' : value >= 50 ? 'MEDIUM' : 'LOW';
  const color = value >= 80 ? 'emerald' : value >= 50 ? 'amber' : 'rose';

  const colorClasses = {
    emerald: isRadar ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-700 bg-emerald-100',
    amber: isRadar ? 'text-amber-400 bg-amber-500/20' : 'text-amber-700 bg-amber-100',
    rose: isRadar ? 'text-rose-400 bg-rose-500/20' : 'text-rose-700 bg-rose-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className={`mt-4 px-4 py-1 rounded-full text-[11px] font-bold tracking-wider ${colorClasses[color]}`}
    >
      {status} CONFIDENCE
    </motion.div>
  );
}
