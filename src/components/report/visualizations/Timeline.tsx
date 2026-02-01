'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';

interface TimelineEvent {
  id: string;
  date: Date;
  label: string;
  type: 'finding' | 'event' | 'prediction';
  confidence?: number;
}

interface TimelineProps {
  events: TimelineEvent[];
  onEventClick?: (eventId: string) => void;
}

export function Timeline({ events, onEventClick }: TimelineProps) {
  const { colors, isRadar, getTimelineTypeConfig, cardClasses, tooltipClasses } = useVisualizationTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  if (events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  const minDate = sortedEvents[0].date.getTime();
  const maxDate = sortedEvents[sortedEvents.length - 1].date.getTime();
  const range = maxDate - minDate || 1;

  const getPosition = (date: Date) => ((date.getTime() - minDate) / range) * 100;

  const typeConfig = getTimelineTypeConfig();

  return (
    <div className={`relative p-4 rounded-xl ${cardClasses}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: colors.textSecondary }}
        >
          Timeline
        </h4>
        <div className="flex gap-3 text-[10px]">
          {Object.entries(typeConfig).map(([type, config]) => (
            <span key={type} className="flex items-center gap-1" style={{ color: config.color }}>
              {config.icon} {type}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline track */}
      <div ref={containerRef} className="relative h-20">
        {/* Background track */}
        <div
          className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2"
          style={{ backgroundColor: colors.axisLine }}
        >
          {/* Glow effect for radar */}
          {isRadar && (
            <div
              className="absolute inset-0 blur-sm"
              style={{ backgroundColor: colors.glowColor }}
            />
          )}
        </div>

        {/* Date markers */}
        <div
          className="absolute top-full left-0 right-0 flex justify-between pt-2 text-[10px]"
          style={{ color: colors.textMuted }}
        >
          <span>{sortedEvents[0].date.toLocaleDateString()}</span>
          <span>{sortedEvents[sortedEvents.length - 1].date.toLocaleDateString()}</span>
        </div>

        {/* Events */}
        {sortedEvents.map((event, i) => {
          const pos = getPosition(event.date);
          const config = typeConfig[event.type];
          const isHovered = hoveredEvent === event.id;

          return (
            <motion.div
              key={event.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${pos}%` }}
              onMouseEnter={() => setHoveredEvent(event.id)}
              onMouseLeave={() => setHoveredEvent(null)}
              onClick={() => onEventClick?.(event.id)}
            >
              {/* Event node */}
              <motion.div
                animate={{ scale: isHovered ? 1.5 : 1 }}
                className="relative w-4 h-4 -ml-2 flex items-center justify-center text-xs"
                style={{
                  color: config.color,
                  filter: isHovered ? `drop-shadow(0 0 8px ${config.color})` : undefined,
                }}
              >
                {config.icon}

                {/* Confidence ring */}
                {event.confidence !== undefined && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="8" cy="8" r="6"
                      fill="none"
                      stroke={config.color}
                      strokeWidth="1"
                      strokeDasharray={`${event.confidence * 37.7} 37.7`}
                      opacity={0.5}
                    />
                  </svg>
                )}
              </motion.div>

              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-[10px] whitespace-nowrap z-10 ${tooltipClasses}`}
                >
                  {event.label}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
