'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  Terminal,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Database,
  Server,
  Code,
  FileCode,
  Hash,
  Fingerprint,
  Activity,
  Cpu,
  Network,
  Globe,
  Clock,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// BRUTALIST DESIGN SYSTEM
// ============================================================================
const BRUTALIST = {
  border: '3px solid black',
  borderLight: '2px solid black',
  shadow: '6px 6px 0 black',
  shadowSm: '4px 4px 0 black',
  shadowHover: '2px 2px 0 black',
  font: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
} as const;

// ============================================================================
// TYPES
// ============================================================================
export interface Finding {
  finding_id: string;
  finding_type: string;
  content: string;
  summary?: string;
  confidence_score: number;
  temporal_context: string;
  extracted_data?: Record<string, unknown>;
}

export interface Source {
  url: string;
  title: string;
  domain: string;
  credibility_score?: number;
  credibility_label?: string;
}

export interface Perspective {
  perspective_type: string;
  analysis_text: string;
  key_insights: string[];
  recommendations: string[];
  warnings: string[];
  confidence: number;
}

// ============================================================================
// BRUTALIST CARD
// ============================================================================
interface BrutalistCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'accent' | 'danger' | 'success' | 'warning';
  hover?: boolean;
}

const BrutalistCard: React.FC<BrutalistCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
}) => {
  const variants = {
    default: 'bg-white',
    dark: 'bg-gray-900 text-white',
    accent: 'bg-gray-50',
    danger: 'bg-red-50',
    success: 'bg-green-50',
    warning: 'bg-amber-50',
  };

  return (
    <div
      className={clsx(
        variants[variant],
        hover && 'transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px]',
        className
      )}
      style={{
        border: BRUTALIST.border,
        boxShadow: hover ? BRUTALIST.shadowSm : BRUTALIST.shadow,
        fontFamily: BRUTALIST.font,
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// BRUTALIST BUTTON
// ============================================================================
interface BrutalistButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}

const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  active = false,
  className = '',
}) => {
  const variants = {
    default: active ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100',
    primary: 'bg-black text-white hover:bg-gray-800',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        variants[variant],
        sizes[size],
        'font-bold uppercase tracking-widest transition-all duration-200',
        'hover:translate-x-[2px] hover:translate-y-[2px]',
        className
      )}
      style={{
        border: BRUTALIST.borderLight,
        boxShadow: BRUTALIST.shadowSm,
        fontFamily: BRUTALIST.font,
      }}
    >
      {children}
    </button>
  );
};

// ============================================================================
// BRUTALIST BADGE
// ============================================================================
interface BrutalistBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const BrutalistBadge: React.FC<BrutalistBadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default: 'bg-gray-100 text-black border-black',
    success: 'bg-green-100 text-green-900 border-green-900',
    warning: 'bg-amber-100 text-amber-900 border-amber-900',
    danger: 'bg-red-100 text-red-900 border-red-900',
    info: 'bg-blue-100 text-blue-900 border-blue-900',
  };

  return (
    <span
      className={clsx(
        variants[variant],
        'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-2',
        className
      )}
      style={{ fontFamily: BRUTALIST.font }}
    >
      {children}
    </span>
  );
};

// ============================================================================
// CONFIDENCE BAR
// ============================================================================
interface ConfidenceBarProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  score,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const percentage = Math.round(score * 100);
  const getVariant = () => {
    if (percentage >= 80) return { bg: 'bg-green-500', label: 'HIGH' };
    if (percentage >= 60) return { bg: 'bg-amber-500', label: 'MED' };
    return { bg: 'bg-red-500', label: 'LOW' };
  };
  const { bg, label } = getVariant();

  const heights = { sm: 'h-2', md: 'h-3' };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx('flex-1 bg-gray-200', heights[size])}
        style={{ border: '2px solid black' }}
      >
        <div
          className={clsx(bg, 'h-full transition-all duration-500')}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ fontFamily: BRUTALIST.font }}
        >
          {percentage}% {label}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// SECTION LABEL
// ============================================================================
const SectionLabel: React.FC<{ children: React.ReactNode; icon?: LucideIcon }> = ({
  children,
  icon: Icon,
}) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="w-4 h-4" />}
    <span
      className="text-[10px] font-bold uppercase tracking-widest text-gray-600"
      style={{ fontFamily: BRUTALIST.font }}
    >
      {children}
    </span>
  </div>
);

// ============================================================================
// FINDING TYPE CONFIG
// ============================================================================
const findingTypeConfig: Record<string, { icon: LucideIcon; label: string }> = {
  fact: { icon: Database, label: 'FACT' },
  event: { icon: Clock, label: 'EVENT' },
  actor: { icon: Fingerprint, label: 'ACTOR' },
  relationship: { icon: Network, label: 'LINK' },
  financial: { icon: Activity, label: 'FUNDS' },
  evidence: { icon: FileCode, label: 'EVIDENCE' },
  pattern: { icon: Cpu, label: 'PATTERN' },
  gap: { icon: AlertTriangle, label: 'GAP' },
  claim: { icon: Shield, label: 'CLAIM' },
  prediction: { icon: Zap, label: 'PREDICT' },
};

const getTypeConfig = (type: string) =>
  findingTypeConfig[type] || { icon: Code, label: type.toUpperCase() };

// ============================================================================
// FINDINGS GRID
// ============================================================================
interface FindingsGridProps {
  findings: Finding[];
  className?: string;
}

export const FindingsGrid: React.FC<FindingsGridProps> = ({ findings, className }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const types = useMemo(() => {
    const t = new Set(findings.map((f) => f.finding_type));
    return ['all', ...Array.from(t)];
  }, [findings]);

  const filteredFindings = filter === 'all' ? findings : findings.filter((f) => f.finding_type === filter);

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Filter bar */}
      <BrutalistCard className="p-4">
        <SectionLabel icon={Terminal}>Filter Findings</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <BrutalistButton
              key={type}
              size="sm"
              active={filter === type}
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? `ALL (${findings.length})` : type}
            </BrutalistButton>
          ))}
        </div>
      </BrutalistCard>

      {/* Findings list */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => {
          const config = getTypeConfig(finding.finding_type);
          const Icon = config.icon;
          const isExpanded = expandedId === finding.finding_id;
          const confidenceVariant =
            finding.confidence_score >= 0.8
              ? 'success'
              : finding.confidence_score >= 0.5
                ? 'warning'
                : 'danger';

          return (
            <BrutalistCard key={finding.finding_id} hover className="p-0">
              {/* Header */}
              <div className="p-4 border-b-2 border-black bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 bg-black text-white"
                      style={{ border: BRUTALIST.borderLight }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <BrutalistBadge variant={confidenceVariant}>{config.label}</BrutalistBadge>
                      {finding.temporal_context && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          {finding.temporal_context}
                        </div>
                      )}
                    </div>
                  </div>
                  <ConfidenceBar score={finding.confidence_score} size="sm" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {finding.summary && (
                  <h4
                    className="text-sm font-bold mb-2"
                    style={{ fontFamily: BRUTALIST.font }}
                  >
                    → {finding.summary}
                  </h4>
                )}

                <p
                  className={clsx(
                    'text-sm text-gray-700 leading-relaxed',
                    !isExpanded && 'line-clamp-2'
                  )}
                  style={{ fontFamily: BRUTALIST.font }}
                >
                  {finding.content}
                </p>

                {/* Extracted data */}
                {isExpanded && finding.extracted_data && Object.keys(finding.extracted_data).length > 0 && (
                  <div className="mt-4 p-3 bg-gray-100" style={{ border: BRUTALIST.borderLight }}>
                    <SectionLabel icon={Hash}>Extracted Data</SectionLabel>
                    <pre
                      className="text-xs overflow-x-auto"
                      style={{ fontFamily: BRUTALIST.font }}
                    >
                      {JSON.stringify(finding.extracted_data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : finding.finding_id)}
                  className="mt-3 flex items-center gap-1 text-xs font-bold uppercase tracking-widest hover:underline"
                  style={{ fontFamily: BRUTALIST.font }}
                >
                  {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {isExpanded ? 'COLLAPSE' : 'EXPAND'}
                </button>
              </div>
            </BrutalistCard>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// PERSPECTIVES PANEL
// ============================================================================
interface PerspectivesPanelProps {
  perspectives: Perspective[];
  className?: string;
}

const perspectiveConfig: Record<string, { icon: LucideIcon }> = {
  critical: { icon: AlertTriangle },
  supportive: { icon: CheckCircle },
  financial: { icon: Activity },
  legal: { icon: Shield },
  strategic: { icon: Cpu },
  network: { icon: Network },
  historical: { icon: Clock },
  forensic: { icon: Fingerprint },
  default: { icon: Terminal },
};

export const PerspectivesPanel: React.FC<PerspectivesPanelProps> = ({ perspectives, className }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (perspectives.length === 0) return null;

  const activePerspective = perspectives[activeIndex];
  const config = perspectiveConfig[activePerspective.perspective_type] || perspectiveConfig.default;
  const Icon = config.icon;

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Perspective selector */}
      <BrutalistCard className="p-4">
        <SectionLabel>Select Perspective</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {perspectives.map((p, i) => {
            const pConfig = perspectiveConfig[p.perspective_type] || perspectiveConfig.default;
            const PIcon = pConfig.icon;

            return (
              <BrutalistButton
                key={i}
                size="sm"
                active={i === activeIndex}
                onClick={() => setActiveIndex(i)}
              >
                <span className="flex items-center gap-2">
                  <PIcon className="w-3 h-3" />
                  {p.perspective_type}
                  <span className="opacity-60">{Math.round(p.confidence * 100)}%</span>
                </span>
              </BrutalistButton>
            );
          })}
        </div>
      </BrutalistCard>

      {/* Active perspective content */}
      <BrutalistCard className="p-0">
        {/* Header */}
        <div className="p-4 border-b-2 border-black bg-black text-white">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span
              className="text-sm font-bold uppercase tracking-widest"
              style={{ fontFamily: BRUTALIST.font }}
            >
              {activePerspective.perspective_type} Analysis
            </span>
          </div>
          <div className="mt-2">
            <ConfidenceBar score={activePerspective.confidence} size="sm" />
          </div>
        </div>

        {/* Analysis text */}
        <div className="p-4 border-b-2 border-black bg-gray-50">
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: BRUTALIST.font }}
          >
            {activePerspective.analysis_text}
          </p>
        </div>

        {/* Insights, Recommendations, Warnings */}
        <div className="grid md:grid-cols-3 divide-x-2 divide-black">
          {/* Key Insights */}
          {activePerspective.key_insights.length > 0 && (
            <div className="p-4">
              <SectionLabel icon={Zap}>Insights</SectionLabel>
              <ul className="space-y-2">
                {activePerspective.key_insights.map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs"
                    style={{ fontFamily: BRUTALIST.font }}
                  >
                    <span className="font-bold">→</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {activePerspective.recommendations.length > 0 && (
            <div className="p-4 bg-green-50">
              <SectionLabel icon={CheckCircle}>Actions</SectionLabel>
              <ul className="space-y-2">
                {activePerspective.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-green-900"
                    style={{ fontFamily: BRUTALIST.font }}
                  >
                    <span className="font-bold">+</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {activePerspective.warnings.length > 0 && (
            <div className="p-4 bg-red-50">
              <SectionLabel icon={AlertTriangle}>Warnings</SectionLabel>
              <ul className="space-y-2">
                {activePerspective.warnings.map((warn, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-red-900"
                    style={{ fontFamily: BRUTALIST.font }}
                  >
                    <span className="font-bold">!</span>
                    {warn}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </BrutalistCard>
    </div>
  );
};

// ============================================================================
// SOURCES LIST
// ============================================================================
interface SourcesListProps {
  sources: Source[];
  className?: string;
}

export const SourcesList: React.FC<SourcesListProps> = ({ sources, className }) => {
  const getCredibilityVariant = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  };

  const sortedSources = [...sources].sort((a, b) => (b.credibility_score || 0) - (a.credibility_score || 0));

  return (
    <div className={clsx('space-y-3', className)}>
      {sortedSources.map((source, index) => {
        const variant = source.credibility_score ? getCredibilityVariant(source.credibility_score) : 'default';

        return (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <BrutalistCard hover className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-bold truncate group-hover:underline"
                    style={{ fontFamily: BRUTALIST.font }}
                  >
                    {source.title || source.url}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="w-3 h-3 text-gray-500" />
                    <span
                      className="text-[10px] text-gray-500 uppercase tracking-widest"
                      style={{ fontFamily: BRUTALIST.font }}
                    >
                      {source.domain}
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {source.credibility_score && (
                  <BrutalistBadge variant={variant as 'success' | 'warning' | 'danger'}>
                    {source.credibility_label || `${Math.round(source.credibility_score * 100)}%`}
                  </BrutalistBadge>
                )}
              </div>

              {source.credibility_score && (
                <div className="mt-3">
                  <ConfidenceBar score={source.credibility_score} showLabel={false} size="sm" />
                </div>
              )}
            </BrutalistCard>
          </a>
        );
      })}
    </div>
  );
};

// ============================================================================
// SEARCH QUERIES DISPLAY
// ============================================================================
interface SearchQueriesProps {
  queries: string[];
  className?: string;
}

export const SearchQueries: React.FC<SearchQueriesProps> = ({ queries, className }) => {
  return (
    <BrutalistCard className={clsx('p-4', className)}>
      <SectionLabel icon={Terminal}>Search Queries</SectionLabel>
      <div className="space-y-2">
        {queries.map((query, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs p-2 bg-gray-100"
            style={{ fontFamily: BRUTALIST.font, border: BRUTALIST.borderLight }}
          >
            <span className="font-bold">$</span>
            <span className="text-gray-600">search</span>
            <span className="font-bold">--query</span>
            <span className="text-gray-800">&quot;{query}&quot;</span>
          </div>
        ))}
      </div>
    </BrutalistCard>
  );
};

// ============================================================================
// RESEARCH STATUS HEADER
// ============================================================================
interface ResearchStatusProps {
  status: string;
  executionTime: number;
  findingsCount: number;
  sourcesCount: number;
  tokensUsed: number;
  cost: number;
  errors?: string[];
  className?: string;
}

export const ResearchStatus: React.FC<ResearchStatusProps> = ({
  status,
  executionTime,
  findingsCount,
  sourcesCount,
  tokensUsed,
  cost,
  errors,
  className,
}) => {
  const statusConfig = {
    completed: { icon: CheckCircle, label: 'COMPLETED', variant: 'success' as const },
    partial: { icon: AlertTriangle, label: 'PARTIAL', variant: 'warning' as const },
    failed: { icon: XCircle, label: 'FAILED', variant: 'danger' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.partial;
  const StatusIcon = config.icon;

  return (
    <BrutalistCard
      variant={config.variant === 'danger' ? 'danger' : config.variant === 'warning' ? 'warning' : 'success'}
      className={clsx('p-4', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-2 bg-black text-white">
            <StatusIcon className="w-4 h-4" />
            <span
              className="text-sm font-bold uppercase tracking-widest"
              style={{ fontFamily: BRUTALIST.font }}
            >
              {config.label}
            </span>
          </div>

          <div className="h-6 w-0.5 bg-black" />

          <div className="flex items-center gap-4">
            <StatItem icon={Clock} label={`${executionTime.toFixed(1)}s`} />
            <StatItem icon={Database} label={`${findingsCount} FINDINGS`} />
            <StatItem icon={Globe} label={`${sourcesCount} SOURCES`} />
          </div>
        </div>

        {/* Cost info */}
        <div className="flex items-center gap-4">
          <StatItem icon={Cpu} label={`${tokensUsed.toLocaleString()} TOKENS`} />
          <span
            className="text-sm font-bold bg-black text-white px-2 py-1"
            style={{ fontFamily: BRUTALIST.font }}
          >
            ${cost.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div
          className="mt-4 p-3 bg-red-100"
          style={{ border: BRUTALIST.borderLight }}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-red-900">
            <AlertTriangle className="w-4 h-4" />
            ERROR: {errors.join(' | ')}
          </div>
        </div>
      )}
    </BrutalistCard>
  );
};

const StatItem: React.FC<{ icon: LucideIcon; label: string }> = ({ icon: Icon, label }) => (
  <span
    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
    style={{ fontFamily: BRUTALIST.font }}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </span>
);

// ============================================================================
// MARKDOWN REPORT VIEWER
// ============================================================================
interface ReportViewerProps {
  markdown: string;
  className?: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ markdown, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BrutalistCard className={clsx('p-0', className)}>
      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-black text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4" />
          <span
            className="text-sm font-bold uppercase tracking-widest"
            style={{ fontFamily: BRUTALIST.font }}
          >
            Report.md
          </span>
        </div>
        <BrutalistButton size="sm" onClick={handleCopy} variant={copied ? 'primary' : 'default'}>
          {copied ? (
            <>
              <CheckCircle className="w-3 h-3 inline mr-1" />
              COPIED
            </>
          ) : (
            <>
              <Code className="w-3 h-3 inline mr-1" />
              COPY
            </>
          )}
        </BrutalistButton>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto bg-gray-50">
        <pre
          className="text-sm whitespace-pre-wrap leading-relaxed"
          style={{ fontFamily: BRUTALIST.font }}
        >
          {markdown}
        </pre>
      </div>
    </BrutalistCard>
  );
};
