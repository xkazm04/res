'use client';

/**
 * SourceQualityCompare
 *
 * Visual comparison of source credibility for each claim in a contradiction.
 * Shows credibility scores, factors, and source metadata.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { EnrichedContradiction } from '@/src/hooks/useContradictionExplorer';
import { cn } from '@/src/lib/utils';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Calendar,
  FileText,
  Award,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface SourceQualityCompareProps {
  contradiction: EnrichedContradiction;
}

export function SourceQualityCompare({ contradiction }: SourceQualityCompareProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();

  const source1 = contradiction.source_1_details;
  const source2 = contradiction.source_2_details;

  // Calculate credibility comparison
  const credComparison = useMemo(() => {
    const cred1 = source1?.credibility_score ?? 0.5;
    const cred2 = source2?.credibility_score ?? 0.5;
    const diff = Math.abs(cred1 - cred2);

    let verdict: string;
    let verdictColor: string;

    if (diff < 0.1) {
      verdict = 'Sources have comparable credibility';
      verdictColor = colors.warning;
    } else if (cred1 > cred2) {
      verdict = 'Source A has higher credibility';
      verdictColor = colors.primary;
    } else {
      verdict = 'Source B has higher credibility';
      verdictColor = colors.secondary;
    }

    return {
      cred1,
      cred2,
      diff,
      winner: cred1 > cred2 ? 'A' : cred2 > cred1 ? 'B' : 'tie',
      verdict,
      verdictColor,
    };
  }, [source1, source2, colors]);

  // Get credibility factors
  const getCredibilityFactors = (source: typeof source1) => {
    if (!source?.credibility_factors) return [];

    const factors = source.credibility_factors as Record<string, number | string | boolean>;
    return Object.entries(factors).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value:
        typeof value === 'number'
          ? Math.round(value * 100)
          : typeof value === 'boolean'
            ? value
              ? 'Yes'
              : 'No'
            : String(value),
      isPositive:
        typeof value === 'number' ? value > 0.5 : typeof value === 'boolean' ? value : true,
    }));
  };

  const factors1 = getCredibilityFactors(source1);
  const factors2 = getCredibilityFactors(source2);

  // Get source type icon
  const getSourceTypeIcon = (type?: string) => {
    switch (type) {
      case 'academic':
        return Award;
      case 'government':
        return Shield;
      case 'news':
        return FileText;
      default:
        return Globe;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall comparison */}
      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: `${credComparison.verdictColor}15` }}
      >
        <div className="flex items-center justify-center gap-8 mb-3">
          {/* Source A score */}
          <div className="text-center">
            <CredibilityGauge
              score={credComparison.cred1}
              label="Source A"
              color={colors.primary}
              isWinner={credComparison.winner === 'A'}
            />
          </div>

          {/* VS indicator */}
          <div
            className="text-2xl font-bold"
            style={{ color: colors.textMuted }}
          >
            vs
          </div>

          {/* Source B score */}
          <div className="text-center">
            <CredibilityGauge
              score={credComparison.cred2}
              label="Source B"
              color={colors.secondary}
              isWinner={credComparison.winner === 'B'}
            />
          </div>
        </div>

        <p
          className="text-sm font-medium"
          style={{ color: credComparison.verdictColor }}
        >
          {credComparison.verdict}
        </p>

        {credComparison.diff > 0.2 && (
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            {Math.round(credComparison.diff * 100)}% credibility difference suggests a resolution path
          </p>
        )}
      </div>

      {/* Source details side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Source A */}
        <SourceDetailCard
          source={source1}
          label="Source A"
          url={contradiction.source_1}
          accentColor={colors.primary}
          colors={colors}
          surfaceClasses={surfaceClasses}
          factors={factors1}
          getSourceTypeIcon={getSourceTypeIcon}
        />

        {/* Source B */}
        <SourceDetailCard
          source={source2}
          label="Source B"
          url={contradiction.source_2}
          accentColor={colors.secondary}
          colors={colors}
          surfaceClasses={surfaceClasses}
          factors={factors2}
          getSourceTypeIcon={getSourceTypeIcon}
        />
      </div>

      {/* Quality factors comparison */}
      {(factors1.length > 0 || factors2.length > 0) && (
        <div>
          <h4
            className="text-xs font-semibold mb-3 uppercase tracking-wider"
            style={{ color: colors.textSecondary }}
          >
            Credibility Factors Comparison
          </h4>

          <div className="space-y-2">
            {/* Combine all unique factor names */}
            {Array.from(
              new Set([...factors1.map((f) => f.name), ...factors2.map((f) => f.name)])
            ).map((factorName, i) => {
              const f1 = factors1.find((f) => f.name === factorName);
              const f2 = factors2.find((f) => f.name === factorName);

              return (
                <motion.div
                  key={factorName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'grid grid-cols-[1fr_80px_80px] gap-2 p-2 rounded-lg items-center',
                    surfaceClasses
                  )}
                >
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    {factorName}
                  </span>

                  {/* Source A value */}
                  <div className="flex items-center justify-center gap-1">
                    {f1 ? (
                      <>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            f1.isPositive ? '' : 'opacity-60'
                          )}
                          style={{
                            color: f1.isPositive ? colors.primary : colors.textMuted,
                          }}
                        >
                          {typeof f1.value === 'number' ? `${f1.value}%` : f1.value}
                        </span>
                        {f1.isPositive ? (
                          <ShieldCheck size={12} style={{ color: colors.primary }} />
                        ) : (
                          <ShieldAlert size={12} style={{ color: colors.textMuted }} />
                        )}
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        —
                      </span>
                    )}
                  </div>

                  {/* Source B value */}
                  <div className="flex items-center justify-center gap-1">
                    {f2 ? (
                      <>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            f2.isPositive ? '' : 'opacity-60'
                          )}
                          style={{
                            color: f2.isPositive ? colors.secondary : colors.textMuted,
                          }}
                        >
                          {typeof f2.value === 'number' ? `${f2.value}%` : f2.value}
                        </span>
                        {f2.isPositive ? (
                          <ShieldCheck size={12} style={{ color: colors.secondary }} />
                        ) : (
                          <ShieldAlert size={12} style={{ color: colors.textMuted }} />
                        )}
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        —
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning if sources are missing */}
      {(!source1 || !source2) && (
        <div
          className="p-3 rounded-lg flex items-center gap-3"
          style={{ backgroundColor: colors.warningFill }}
        >
          <AlertTriangle size={16} style={{ color: colors.warning }} />
          <p className="text-xs" style={{ color: colors.textPrimary }}>
            Source details are incomplete. Credibility comparison may not be fully accurate.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Credibility Gauge Component
// ============================================================================

interface CredibilityGaugeProps {
  score: number;
  label: string;
  color: string;
  isWinner: boolean;
}

function CredibilityGauge({ score, label, color, isWinner }: CredibilityGaugeProps) {
  const percentage = Math.round(score * 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  return (
    <div className="relative">
      <svg width="100" height="100" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="opacity-10"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>
          {percentage}%
        </span>
        <span className="text-[10px] opacity-70">{label}</span>
      </div>

      {/* Winner badge */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1"
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
            style={{ backgroundColor: color }}
          >
            ✓
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Source Detail Card Component
// ============================================================================

interface SourceDetailCardProps {
  source?: EnrichedContradiction['source_1_details'];
  label: string;
  url?: string;
  accentColor: string;
  colors: ReturnType<typeof useVisualizationTheme>['colors'];
  surfaceClasses: string;
  factors: Array<{ name: string; value: string | number; isPositive: boolean }>;
  getSourceTypeIcon: (type?: string) => typeof Globe;
}

function SourceDetailCard({
  source,
  label,
  url,
  accentColor,
  colors,
  surfaceClasses,
  factors,
  getSourceTypeIcon,
}: SourceDetailCardProps) {
  const TypeIcon = getSourceTypeIcon(source?.source_type);

  if (!source && !url) {
    return (
      <div className={cn('p-4 rounded-xl', surfaceClasses)}>
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: accentColor }}
        />
        <p className="text-sm" style={{ color: colors.textMuted }}>
          {label}: No source details available
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-4 rounded-xl relative overflow-hidden', surfaceClasses)}
    >
      {/* Accent border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TypeIcon size={16} style={{ color: accentColor }} />
        <span
          className="text-[10px] uppercase tracking-wider font-bold"
          style={{ color: accentColor }}
        >
          {label}
        </span>
      </div>

      {/* Source title/domain */}
      <h5 className="text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
        {source?.title ?? source?.domain ?? url ?? 'Unknown source'}
      </h5>

      {/* Metadata */}
      <div className="space-y-2 text-xs">
        {source?.source_type && (
          <div className="flex items-center gap-2">
            <span style={{ color: colors.textMuted }}>Type:</span>
            <span className="capitalize" style={{ color: colors.textSecondary }}>
              {source.source_type}
            </span>
          </div>
        )}

        {source?.domain && (
          <div className="flex items-center gap-2">
            <Globe size={12} style={{ color: colors.textMuted }} />
            <span style={{ color: colors.textSecondary }}>{source.domain}</span>
          </div>
        )}

        {source?.content_date && (
          <div className="flex items-center gap-2">
            <Calendar size={12} style={{ color: colors.textMuted }} />
            <span style={{ color: colors.textSecondary }}>
              {new Date(source.content_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {source?.citation_count !== undefined && source.citation_count > 0 && (
          <div className="flex items-center gap-2">
            <FileText size={12} style={{ color: colors.textMuted }} />
            <span style={{ color: colors.textSecondary }}>
              {source.citation_count} citations
            </span>
          </div>
        )}

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
            style={{ color: accentColor }}
          >
            <ExternalLink size={12} />
            <span>View source</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}
