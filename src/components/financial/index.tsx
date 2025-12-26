'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Percent,
  Building2,
  Users,
  Shield,
  Zap,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';
import { GlassCard, Badge, ConfidenceIndicator, StatCard } from '@/src/components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface FinancialMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  color?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose';
}

interface BullBearCase {
  type: 'bull' | 'bear';
  points: string[];
  confidence: number;
}

interface RiskFactor {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
}

interface AnalystRating {
  rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  count: number;
  percentage: number;
}

// ============================================================================
// METRICS DASHBOARD
// ============================================================================
interface MetricsDashboardProps {
  metrics: FinancialMetric[];
  className?: string;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, className }) => {
  return (
    <div className={clsx('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon || DollarSign;
        const color = metric.color || 'cyan';
        const isPositive = metric.change && metric.change > 0;
        const isNegative = metric.change && metric.change < 0;
        const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

        return (
          <GlassCard
            key={index}
            className="p-4 reveal-stagger"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-[var(--mist)] uppercase tracking-wider">
                {metric.label}
              </span>
              <div className={`p-1.5 rounded-lg bg-[var(--${color}-glow)]/10`}>
                <Icon className={`w-3.5 h-3.5 text-[var(--${color}-glow)]`} />
              </div>
            </div>

            <div className="flex items-end justify-between">
              <span
                className={`text-2xl font-bold text-gradient-${color}`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {metric.value}
              </span>

              {metric.change !== undefined && (
                <div
                  className={clsx(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                    isPositive && 'bg-[var(--emerald-glow)]/10 text-[var(--emerald-glow)]',
                    isNegative && 'bg-[var(--rose-glow)]/10 text-[var(--rose-glow)]',
                    !isPositive && !isNegative && 'bg-[var(--graphite)] text-[var(--mist)]'
                  )}
                >
                  <TrendIcon className="w-3 h-3" />
                  {Math.abs(metric.change).toFixed(1)}%
                </div>
              )}
            </div>

            {metric.changeLabel && (
              <span className="text-xs text-[var(--mist)] mt-1">{metric.changeLabel}</span>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};

// ============================================================================
// BULL BEAR CASES
// ============================================================================
interface BullBearCasesProps {
  bullCase: BullBearCase;
  bearCase: BullBearCase;
  className?: string;
}

export const BullBearCases: React.FC<BullBearCasesProps> = ({ bullCase, bearCase, className }) => {
  const [activeTab, setActiveTab] = useState<'bull' | 'bear'>('bull');

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Tab selector */}
      <div className="flex gap-2 p-1 bg-[var(--obsidian)] rounded-xl">
        <button
          onClick={() => setActiveTab('bull')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300',
            activeTab === 'bull'
              ? 'bg-gradient-to-r from-[var(--emerald-glow)]/20 to-transparent text-[var(--emerald-glow)] border border-[var(--emerald-glow)]/30'
              : 'text-[var(--mist)] hover:text-[var(--cloud)]'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Bull Case
          <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--emerald-glow)]/10">
            {Math.round(bullCase.confidence * 100)}%
          </span>
        </button>
        <button
          onClick={() => setActiveTab('bear')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300',
            activeTab === 'bear'
              ? 'bg-gradient-to-r from-[var(--rose-glow)]/20 to-transparent text-[var(--rose-glow)] border border-[var(--rose-glow)]/30'
              : 'text-[var(--mist)] hover:text-[var(--cloud)]'
          )}
        >
          <TrendingDown className="w-4 h-4" />
          Bear Case
          <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--rose-glow)]/10">
            {Math.round(bearCase.confidence * 100)}%
          </span>
        </button>
      </div>

      {/* Content */}
      <GlassCard variant="elevated" className="overflow-hidden">
        <div
          className={clsx(
            'h-1.5 transition-all duration-500',
            activeTab === 'bull'
              ? 'bg-gradient-to-r from-[var(--emerald-glow)] to-[var(--emerald-deep)]'
              : 'bg-gradient-to-r from-[var(--rose-glow)] to-[var(--rose-deep)]'
          )}
        />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {activeTab === 'bull' ? (
              <ThumbsUp className="w-5 h-5 text-[var(--emerald-glow)]" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-[var(--rose-glow)]" />
            )}
            <h3
              className="text-lg font-semibold text-[var(--pure)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {activeTab === 'bull' ? 'Bullish Arguments' : 'Bearish Arguments'}
            </h3>
          </div>

          <ul className="space-y-3">
            {(activeTab === 'bull' ? bullCase.points : bearCase.points).map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-[var(--obsidian)] border border-[var(--glass-border)]"
              >
                <span
                  className={clsx(
                    'mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    activeTab === 'bull'
                      ? 'bg-[var(--emerald-glow)]/10 text-[var(--emerald-glow)]'
                      : 'bg-[var(--rose-glow)]/10 text-[var(--rose-glow)]'
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-[var(--cloud)] leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>
    </div>
  );
};

// ============================================================================
// RISK MATRIX
// ============================================================================
interface RiskMatrixProps {
  risks: RiskFactor[];
  className?: string;
}

const severityConfig = {
  low: { color: 'emerald', label: 'Low', bg: 'bg-[var(--emerald-glow)]' },
  medium: { color: 'amber', label: 'Medium', bg: 'bg-[var(--amber-glow)]' },
  high: { color: 'rose', label: 'High', bg: 'bg-[var(--rose-glow)]' },
  critical: { color: 'rose', label: 'Critical', bg: 'bg-[var(--rose-glow)]' },
};

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks, className }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const sortedRisks = [...risks].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <GlassCard className={clsx('p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-[var(--amber-glow)]" />
        <h3
          className="text-sm font-semibold text-[var(--pure)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Risk Assessment
        </h3>
        <Badge variant="amber" size="sm">
          {risks.length} factors
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedRisks.map((risk, i) => {
          const config = severityConfig[risk.severity];
          const isExpanded = expandedIndex === i;

          return (
            <div
              key={i}
              className={clsx(
                'rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden',
                isExpanded
                  ? 'border-[var(--cyan-glow)]/30 bg-[var(--graphite)]'
                  : 'border-[var(--glass-border)] hover:border-[var(--ash)]'
              )}
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-2 h-2 rounded-full', config.bg)} />
                    <span className="text-sm font-medium text-[var(--pure)]">{risk.name}</span>
                  </div>
                  <Badge
                    variant={config.color as 'emerald' | 'amber' | 'rose'}
                    size="sm"
                  >
                    {config.label}
                  </Badge>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--glass-border)] space-y-3">
                    <p className="text-sm text-[var(--cloud)]">{risk.description}</p>
                    {risk.mitigation && (
                      <div className="p-3 rounded-lg bg-[var(--emerald-glow)]/5 border border-[var(--emerald-glow)]/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-3 h-3 text-[var(--emerald-glow)]" />
                          <span className="text-xs font-medium text-[var(--emerald-glow)]">Mitigation</span>
                        </div>
                        <p className="text-xs text-[var(--cloud)]">{risk.mitigation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// ANALYST SENTIMENT
// ============================================================================
interface AnalystSentimentProps {
  ratings: AnalystRating[];
  averageTarget?: number;
  currentPrice?: number;
  className?: string;
}

const ratingConfig = {
  strong_buy: { label: 'Strong Buy', color: '#10b981' },
  buy: { label: 'Buy', color: '#34d399' },
  hold: { label: 'Hold', color: '#ffb800' },
  sell: { label: 'Sell', color: '#f87171' },
  strong_sell: { label: 'Strong Sell', color: '#f43f5e' },
};

export const AnalystSentiment: React.FC<AnalystSentimentProps> = ({
  ratings,
  averageTarget,
  currentPrice,
  className,
}) => {
  const totalAnalysts = ratings.reduce((sum, r) => sum + r.count, 0);
  const upside = averageTarget && currentPrice ? ((averageTarget - currentPrice) / currentPrice) * 100 : null;

  const chartData = ratings.map((r) => ({
    name: ratingConfig[r.rating].label,
    value: r.count,
    fill: ratingConfig[r.rating].color,
  }));

  return (
    <GlassCard className={clsx('p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-[var(--amber-glow)]" />
        <h3
          className="text-sm font-semibold text-[var(--pure)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Analyst Sentiment
        </h3>
        <Badge variant="muted" size="sm">
          {totalAnalysts} analysts
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--graphite)',
                  border: '1px solid var(--ash)',
                  borderRadius: '8px',
                  color: 'var(--pure)',
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and target */}
        <div className="space-y-4">
          {/* Ratings breakdown */}
          <div className="space-y-2">
            {ratings.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: ratingConfig[r.rating].color }}
                />
                <span className="text-xs text-[var(--mist)] flex-1">
                  {ratingConfig[r.rating].label}
                </span>
                <span className="text-xs font-mono text-[var(--cloud)]">{r.count}</span>
                <span className="text-xs text-[var(--mist)]">({r.percentage.toFixed(0)}%)</span>
              </div>
            ))}
          </div>

          {/* Price target */}
          {averageTarget && currentPrice && (
            <div className="p-3 rounded-xl bg-[var(--obsidian)] border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--mist)]">Avg. Price Target</span>
                <span className="text-sm font-bold text-[var(--pure)]">${averageTarget.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--mist)]">Implied Upside</span>
                <span
                  className={clsx(
                    'text-sm font-bold',
                    upside && upside > 0 ? 'text-[var(--emerald-glow)]' : 'text-[var(--rose-glow)]'
                  )}
                >
                  {upside && upside > 0 ? '+' : ''}{upside?.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================================================
// PRICE CHART
// ============================================================================
interface PriceChartProps {
  data: { date: string; price: number; volume?: number }[];
  symbol?: string;
  className?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, symbol, className }) => {
  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const priceChange = data.length >= 2 ? data[data.length - 1].price - data[0].price : 0;
  const priceChangePercent = data.length >= 2 ? (priceChange / data[0].price) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <GlassCard className={clsx('p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h3
            className="text-sm font-semibold text-[var(--pure)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {symbol ? `${symbol} Price` : 'Price Chart'}
          </h3>
        </div>
        <div
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium',
            isPositive
              ? 'bg-[var(--emerald-glow)]/10 text-[var(--emerald-glow)]'
              : 'bg-[var(--rose-glow)]/10 text-[var(--rose-glow)]'
          )}
        >
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8b8b9e', fontSize: 10 }}
            />
            <YAxis
              domain={[minPrice * 0.95, maxPrice * 1.05]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8b8b9e', fontSize: 10 }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--graphite)',
                border: '1px solid var(--ash)',
                borderRadius: '8px',
                color: 'var(--pure)',
              }}
              formatter={(value) => value !== undefined ? [`$${Number(value).toFixed(2)}`, 'Price'] : ['', 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

// ============================================================================
// FINANCIAL HIGHLIGHTS
// ============================================================================
interface FinancialHighlightsProps {
  highlights: {
    revenue?: string;
    revenueGrowth?: number;
    netIncome?: string;
    netIncomeGrowth?: number;
    eps?: string;
    epsGrowth?: number;
    pe?: number;
    marketCap?: string;
    dividend?: string;
    dividendYield?: number;
  };
  className?: string;
}

export const FinancialHighlights: React.FC<FinancialHighlightsProps> = ({ highlights, className }) => {
  const metrics: FinancialMetric[] = [
    {
      label: 'Revenue',
      value: highlights.revenue || 'N/A',
      change: highlights.revenueGrowth,
      icon: DollarSign,
      color: 'cyan',
    },
    {
      label: 'Net Income',
      value: highlights.netIncome || 'N/A',
      change: highlights.netIncomeGrowth,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'EPS',
      value: highlights.eps || 'N/A',
      change: highlights.epsGrowth,
      icon: BarChart3,
      color: 'violet',
    },
    {
      label: 'P/E Ratio',
      value: highlights.pe?.toFixed(1) || 'N/A',
      icon: Scale,
      color: 'amber',
    },
    {
      label: 'Market Cap',
      value: highlights.marketCap || 'N/A',
      icon: Building2,
      color: 'cyan',
    },
    {
      label: 'Dividend',
      value: highlights.dividend || 'N/A',
      change: highlights.dividendYield,
      changeLabel: 'yield',
      icon: Percent,
      color: 'emerald',
    },
  ];

  return (
    <GlassCard className={clsx('p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[var(--violet-glow)]" />
        <h3
          className="text-sm font-semibold text-[var(--pure)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Financial Highlights
        </h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon || DollarSign;
          const color = metric.color || 'cyan';
          const isPositive = metric.change && metric.change > 0;
          const isNegative = metric.change && metric.change < 0;

          return (
            <div
              key={i}
              className="p-3 rounded-xl bg-[var(--obsidian)] border border-[var(--glass-border)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-3.5 h-3.5 text-[var(--${color}-glow)]`} />
                <span className="text-[10px] font-medium text-[var(--mist)] uppercase tracking-wider">
                  {metric.label}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold text-[var(--pure)]">{metric.value}</span>
                {metric.change !== undefined && (
                  <span
                    className={clsx(
                      'text-xs font-medium',
                      isPositive && 'text-[var(--emerald-glow)]',
                      isNegative && 'text-[var(--rose-glow)]',
                      !isPositive && !isNegative && 'text-[var(--mist)]'
                    )}
                  >
                    {isPositive ? '+' : ''}{metric.change.toFixed(1)}%
                    {metric.changeLabel && ` ${metric.changeLabel}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// INVESTMENT THESIS SUMMARY
// ============================================================================
interface InvestmentThesisProps {
  thesis: string;
  rating: 'bullish' | 'neutral' | 'bearish';
  timeframe: string;
  targetPrice?: number;
  currentPrice?: number;
  keyPoints: string[];
  className?: string;
}

export const InvestmentThesis: React.FC<InvestmentThesisProps> = ({
  thesis,
  rating,
  timeframe,
  targetPrice,
  currentPrice,
  keyPoints,
  className,
}) => {
  const ratingStyles = {
    bullish: {
      color: 'emerald',
      icon: TrendingUp,
      label: 'Bullish',
      gradient: 'from-[var(--emerald-glow)] to-[var(--emerald-deep)]',
    },
    neutral: {
      color: 'amber',
      icon: Minus,
      label: 'Neutral',
      gradient: 'from-[var(--amber-glow)] to-[var(--amber-deep)]',
    },
    bearish: {
      color: 'rose',
      icon: TrendingDown,
      label: 'Bearish',
      gradient: 'from-[var(--rose-glow)] to-[var(--rose-deep)]',
    },
  };

  const config = ratingStyles[rating];
  const RatingIcon = config.icon;
  const upside = targetPrice && currentPrice ? ((targetPrice - currentPrice) / currentPrice) * 100 : null;

  return (
    <GlassCard variant="elevated" className={clsx('overflow-hidden', className)}>
      <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-[var(--${config.color}-glow)]/10`}>
              <RatingIcon className={`w-5 h-5 text-[var(--${config.color}-glow)]`} />
            </div>
            <div>
              <Badge variant={config.color as 'emerald' | 'amber' | 'rose'} size="lg">
                {config.label}
              </Badge>
              <p className="text-xs text-[var(--mist)] mt-1">
                <Clock className="w-3 h-3 inline mr-1" />
                {timeframe} outlook
              </p>
            </div>
          </div>

          {targetPrice && currentPrice && (
            <div className="text-right">
              <p className="text-xs text-[var(--mist)]">Target Price</p>
              <p className="text-lg font-bold text-[var(--pure)]">${targetPrice.toFixed(2)}</p>
              <p
                className={clsx(
                  'text-xs font-medium',
                  upside && upside > 0 ? 'text-[var(--emerald-glow)]' : 'text-[var(--rose-glow)]'
                )}
              >
                {upside && upside > 0 ? '+' : ''}{upside?.toFixed(1)}% upside
              </p>
            </div>
          )}
        </div>

        {/* Thesis */}
        <p className="text-[var(--cloud)] leading-relaxed mb-6">{thesis}</p>

        {/* Key points */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[var(--mist)] uppercase tracking-wider">Key Points</h4>
          {keyPoints.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-[var(--obsidian)] border border-[var(--glass-border)]"
            >
              <Target className={`w-4 h-4 text-[var(--${config.color}-glow)] mt-0.5 shrink-0`} />
              <span className="text-sm text-[var(--cloud)]">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};
