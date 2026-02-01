'use client';

/**
 * ContextCard
 *
 * Displays detailed context information for the current event,
 * including source details, related entities, and additional metadata.
 */

import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { StoryEvent } from '@/src/lib/storyScript';
import type { ResearchSource } from '@/src/types/research';
import { cn } from '@/src/lib/utils';
import {
  Calendar,
  MapPin,
  Link2,
  User,
  Building2,
  Tag,
  FileText,
  ExternalLink,
  Star,
  Clock,
  Shield,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ContextCardProps {
  event: StoryEvent;
  source?: ResearchSource;
  eventProgress: number;
}

// ============================================================================
// Component
// ============================================================================

export function ContextCard({
  event,
  source,
  eventProgress,
}: ContextCardProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();

  // Format date nicely
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get credibility color
  const getCredibilityColor = (score?: number) => {
    if (!score) return colors.textMuted;
    if (score >= 0.8) return colors.success;
    if (score >= 0.6) return colors.primary;
    if (score >= 0.4) return colors.warning;
    return colors.danger;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Event header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              'text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded',
              event.importance === 'major' && 'bg-amber-500/20 text-amber-400',
              event.importance === 'minor' && 'bg-blue-500/20 text-blue-400',
              event.importance === 'transitional' && 'bg-purple-500/20 text-purple-400'
            )}
          >
            {event.importance}
          </span>
          {event.event_type && (
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                backgroundColor: colors.surfaceBg,
                color: colors.textMuted,
              }}
            >
              {event.event_type}
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
          {event.title}
        </h3>
      </div>

      {/* Date & time */}
      {event.date && (
        <div className="flex items-start gap-3">
          <Calendar size={16} style={{ color: colors.textMuted }} className="mt-0.5" />
          <div>
            <p className="text-sm" style={{ color: colors.textPrimary }}>
              {formatDate(event.date)}
            </p>
            {event.temporal_context && (
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                {event.temporal_context}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      {event.location && (
        <div className="flex items-start gap-3">
          <MapPin size={16} style={{ color: colors.textMuted }} className="mt-0.5" />
          <p className="text-sm" style={{ color: colors.textPrimary }}>
            {event.location}
          </p>
        </div>
      )}

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: eventProgress > 0.2 ? 1 : 0, height: 'auto' }}
        className="overflow-hidden"
      >
        <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          {event.description}
        </p>
      </motion.div>

      {/* Entities */}
      {event.entities && event.entities.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: eventProgress > 0.4 ? 1 : 0 }}
        >
          <h4
            className="text-[10px] uppercase tracking-wider font-semibold mb-2"
            style={{ color: colors.textMuted }}
          >
            Related Entities
          </h4>
          <div className="space-y-2">
            {event.entities.map((entity, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ backgroundColor: colors.surfaceBg }}
              >
                {entity.type === 'person' && (
                  <User size={14} style={{ color: colors.primary }} />
                )}
                {entity.type === 'organization' && (
                  <Building2 size={14} style={{ color: colors.secondary }} />
                )}
                {!['person', 'organization'].includes(entity.type) && (
                  <Tag size={14} style={{ color: colors.textMuted }} />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: colors.textPrimary }}
                  >
                    {entity.name}
                  </p>
                  <p
                    className="text-[10px] capitalize"
                    style={{ color: colors.textMuted }}
                  >
                    {entity.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: eventProgress > 0.5 ? 1 : 0 }}
        >
          <h4
            className="text-[10px] uppercase tracking-wider font-semibold mb-2"
            style={{ color: colors.textMuted }}
          >
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-1 rounded-full"
                style={{
                  backgroundColor: colors.border,
                  color: colors.textSecondary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Source information */}
      {source && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: eventProgress > 0.6 ? 1 : 0 }}
          className="pt-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <h4
            className="text-[10px] uppercase tracking-wider font-semibold mb-3"
            style={{ color: colors.textMuted }}
          >
            Source
          </h4>

          <div
            className="p-3 rounded-lg space-y-2"
            style={{ backgroundColor: colors.surfaceBg }}
          >
            <div className="flex items-start gap-2">
              <FileText size={14} style={{ color: colors.textMuted }} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium line-clamp-2"
                  style={{ color: colors.textPrimary }}
                >
                  {source.title || 'Untitled Source'}
                </p>
                {source.domain && (
                  <p className="text-[10px]" style={{ color: colors.textMuted }}>
                    {source.domain}
                  </p>
                )}
              </div>
            </div>

            {/* Credibility score */}
            {source.credibility_score !== undefined && (
              <div className="flex items-center gap-2">
                <Shield size={12} style={{ color: colors.textMuted }} />
                <div className="flex-1">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.border }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${source.credibility_score * 100}%`,
                        backgroundColor: getCredibilityColor(source.credibility_score),
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: getCredibilityColor(source.credibility_score) }}
                >
                  {Math.round(source.credibility_score * 100)}%
                </span>
              </div>
            )}

            {/* Source type */}
            {source.source_type && (
              <div className="flex items-center gap-2">
                <Star size={12} style={{ color: colors.textMuted }} />
                <span
                  className="text-[10px] capitalize"
                  style={{ color: colors.textSecondary }}
                >
                  {source.source_type}
                </span>
              </div>
            )}

            {/* Content date */}
            {source.content_date && (
              <div className="flex items-center gap-2">
                <Clock size={12} style={{ color: colors.textMuted }} />
                <span className="text-[10px]" style={{ color: colors.textSecondary }}>
                  {new Date(source.content_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Link */}
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] hover:underline mt-2"
                style={{ color: colors.primary }}
              >
                <ExternalLink size={10} />
                View source
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Chapter context */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: eventProgress > 0.8 ? 1 : 0 }}
        className="pt-4 border-t"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: colors.textMuted }}>
            Chapter {event.chapterIndex + 1}
          </span>
          <span className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>
            {event.chapter}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ContextCard;
