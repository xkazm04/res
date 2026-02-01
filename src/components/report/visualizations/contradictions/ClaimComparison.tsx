'use client';

/**
 * ClaimComparison
 *
 * Side-by-side comparison of conflicting claims with visual highlighting
 * of differences and confidence indicators.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { EnrichedContradiction } from '@/src/hooks/useContradictionExplorer';
import { cn } from '@/src/lib/utils';
import { AlertCircle, CheckCircle2, Clock, Tag, Link2 } from 'lucide-react';

interface ClaimComparisonProps {
  contradiction: EnrichedContradiction;
}

export function ClaimComparison({ contradiction }: ClaimComparisonProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();

  const finding1 = contradiction.finding_1;
  const finding2 = contradiction.finding_2;

  // Extract key differences
  const differences = useMemo(() => {
    const diffs: Array<{
      label: string;
      value1: string;
      value2: string;
      significant: boolean;
    }> = [];

    // Confidence difference
    const conf1 = finding1?.confidence_score ?? 0.5;
    const conf2 = finding2?.confidence_score ?? 0.5;
    diffs.push({
      label: 'Confidence',
      value1: `${Math.round(conf1 * 100)}%`,
      value2: `${Math.round(conf2 * 100)}%`,
      significant: Math.abs(conf1 - conf2) > 0.2,
    });

    // Temporal context
    if (finding1?.temporal_context || finding2?.temporal_context) {
      diffs.push({
        label: 'Time Context',
        value1: finding1?.temporal_context ?? 'Not specified',
        value2: finding2?.temporal_context ?? 'Not specified',
        significant: finding1?.temporal_context !== finding2?.temporal_context,
      });
    }

    // Finding type
    if (finding1?.finding_type || finding2?.finding_type) {
      diffs.push({
        label: 'Type',
        value1: finding1?.finding_type ?? 'Unknown',
        value2: finding2?.finding_type ?? 'Unknown',
        significant: finding1?.finding_type !== finding2?.finding_type,
      });
    }

    // Source count
    const sources1 = finding1?.supporting_sources?.length ?? 0;
    const sources2 = finding2?.supporting_sources?.length ?? 0;
    diffs.push({
      label: 'Supporting Sources',
      value1: String(sources1),
      value2: String(sources2),
      significant: Math.abs(sources1 - sources2) > 2,
    });

    return diffs;
  }, [finding1, finding2]);

  return (
    <div className="space-y-6">
      {/* Side by side claims */}
      <div className="grid grid-cols-2 gap-4">
        {/* Claim 1 */}
        <ClaimCard
          label="Claim A"
          claim={contradiction.claim_1 ?? ''}
          source={contradiction.source_1}
          finding={finding1}
          colors={colors}
          isRadar={isRadar}
          surfaceClasses={surfaceClasses}
          index={0}
        />

        {/* Claim 2 */}
        <ClaimCard
          label="Claim B"
          claim={contradiction.claim_2 ?? ''}
          source={contradiction.source_2}
          finding={finding2}
          colors={colors}
          isRadar={isRadar}
          surfaceClasses={surfaceClasses}
          index={1}
        />
      </div>

      {/* Conflict visualization */}
      <div className="flex items-center justify-center py-2">
        <div
          className="flex items-center gap-4 px-6 py-3 rounded-full"
          style={{ backgroundColor: colors.dangerFill }}
        >
          <div className="text-2xl">⚡</div>
          <div>
            <p className="text-sm font-medium" style={{ color: colors.danger }}>
              Direct Contradiction
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              These claims cannot both be true simultaneously
            </p>
          </div>
        </div>
      </div>

      {/* Key differences */}
      <div>
        <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: colors.textSecondary }}>
          Key Differences
        </h4>
        <div className="space-y-2">
          {differences.map((diff, i) => (
            <motion.div
              key={diff.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('grid grid-cols-[100px_1fr_1fr] gap-2 p-2 rounded-lg', surfaceClasses)}
            >
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {diff.label}
              </span>
              <span
                className={cn('text-xs', diff.significant && 'font-semibold')}
                style={{ color: diff.significant ? colors.primary : colors.textPrimary }}
              >
                {diff.value1}
              </span>
              <span
                className={cn('text-xs', diff.significant && 'font-semibold')}
                style={{ color: diff.significant ? colors.secondary : colors.textPrimary }}
              >
                {diff.value2}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Significance note */}
      {contradiction.significance && (
        <div
          className="p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: colors.warningFill,
            borderColor: colors.warning,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} style={{ color: colors.warning }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: colors.warning }}>
                Significance
              </p>
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                {contradiction.significance}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resolution hint */}
      {contradiction.resolution_hint && (
        <div
          className="p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: colors.primaryFill,
            borderColor: colors.primary,
          }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} style={{ color: colors.primary }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
                Resolution Hint
              </p>
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                {contradiction.resolution_hint}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Claim Card Component
// ============================================================================

interface ClaimCardProps {
  label: string;
  claim: string;
  source?: string;
  finding?: EnrichedContradiction['finding_1'];
  colors: ReturnType<typeof useVisualizationTheme>['colors'];
  isRadar: boolean;
  surfaceClasses: string;
  index: number;
}

function ClaimCard({
  label,
  claim,
  source,
  finding,
  colors,
  isRadar,
  surfaceClasses,
  index,
}: ClaimCardProps) {
  const confidence = finding?.confidence_score ?? 0.5;
  const accentColor = index === 0 ? colors.primary : colors.secondary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn('p-4 rounded-xl relative overflow-hidden', surfaceClasses)}
    >
      {/* Accent border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />

      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] uppercase tracking-wider font-bold"
          style={{ color: accentColor }}
        >
          {label}
        </span>

        {/* Confidence badge */}
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
          }}
        >
          {Math.round(confidence * 100)}% confidence
        </span>
      </div>

      {/* Claim text */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: colors.textPrimary }}>
        {claim}
      </p>

      {/* Metadata */}
      <div className="space-y-2">
        {/* Source */}
        {source && (
          <div className="flex items-center gap-2">
            <Link2 size={12} style={{ color: colors.textMuted }} />
            <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
              {source}
            </span>
          </div>
        )}

        {/* Finding type */}
        {finding?.finding_type && (
          <div className="flex items-center gap-2">
            <Tag size={12} style={{ color: colors.textMuted }} />
            <span className="text-xs capitalize" style={{ color: colors.textSecondary }}>
              {finding.finding_type}
            </span>
          </div>
        )}

        {/* Temporal context */}
        {finding?.temporal_context && (
          <div className="flex items-center gap-2">
            <Clock size={12} style={{ color: colors.textMuted }} />
            <span className="text-xs capitalize" style={{ color: colors.textSecondary }}>
              {finding.temporal_context}
            </span>
          </div>
        )}
      </div>

      {/* Confidence bar */}
      <div className="mt-4">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.border }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </div>
    </motion.div>
  );
}
