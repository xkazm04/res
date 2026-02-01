'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';

export interface AlertItem {
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  icon?: string;
}

interface AlertStackProps {
  alerts: AlertItem[];
  frame: number;
  fps: number;
  isRadar: boolean;
  width?: number;
  /** Maximum alerts to show */
  maxVisible?: number;
  /** Animation style */
  stackStyle?: 'cascade' | 'slide' | 'fade';
}

/**
 * Stacked warning/alert cards animation.
 * Used for RedFlagCompilation and CorruptionFlags scenes.
 */
export function AlertStack({
  alerts,
  frame,
  fps,
  isRadar,
  width = 300,
  maxVisible = 5,
  stackStyle = 'cascade',
}: AlertStackProps) {
  const visibleAlerts = alerts.slice(0, maxVisible);
  const hiddenCount = Math.max(0, alerts.length - maxVisible);

  const getSeverityColors = (severity: AlertItem['severity']) => {
    const colors = {
      critical: {
        bg: isRadar ? 'bg-red-500/15' : 'bg-red-50',
        border: isRadar ? 'border-red-500/50' : 'border-red-300',
        badge: isRadar ? 'bg-red-500 text-white' : 'bg-red-500 text-white',
        text: isRadar ? 'text-red-300' : 'text-red-800',
        icon: isRadar ? 'text-red-400' : 'text-red-500',
      },
      high: {
        bg: isRadar ? 'bg-orange-500/15' : 'bg-orange-50',
        border: isRadar ? 'border-orange-500/50' : 'border-orange-300',
        badge: isRadar ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white',
        text: isRadar ? 'text-orange-300' : 'text-orange-800',
        icon: isRadar ? 'text-orange-400' : 'text-orange-500',
      },
      medium: {
        bg: isRadar ? 'bg-amber-500/15' : 'bg-amber-50',
        border: isRadar ? 'border-amber-500/50' : 'border-amber-300',
        badge: isRadar ? 'bg-amber-500 text-white' : 'bg-amber-600 text-white',
        text: isRadar ? 'text-amber-300' : 'text-amber-800',
        icon: isRadar ? 'text-amber-400' : 'text-amber-500',
      },
      low: {
        bg: isRadar ? 'bg-slate-500/15' : 'bg-stone-100',
        border: isRadar ? 'border-slate-500/50' : 'border-stone-300',
        badge: isRadar ? 'bg-slate-500 text-white' : 'bg-stone-500 text-white',
        text: isRadar ? 'text-slate-300' : 'text-stone-700',
        icon: isRadar ? 'text-slate-400' : 'text-stone-500',
      },
    };
    return colors[severity];
  };

  const getDefaultIcon = (severity: AlertItem['severity']) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️',
    };
    return icons[severity];
  };

  return (
    <div className="relative" style={{ width }}>
      <div className="space-y-2">
        {visibleAlerts.map((alert, i) => {
          // Calculate animation delays based on style
          let delay: number;
          let translateY: number;
          let translateX: number;

          switch (stackStyle) {
            case 'cascade':
              delay = i * 8;
              translateY = (1 - spring({ frame, fps, delay, durationFrames: 25, easing: easeOutQuart })) * 30;
              translateX = 0;
              break;
            case 'slide':
              delay = i * 6;
              translateY = 0;
              translateX = (1 - spring({ frame, fps, delay, durationFrames: 22, easing: easeOutCubic })) * -50;
              break;
            case 'fade':
            default:
              delay = i * 5;
              translateY = 0;
              translateX = 0;
              break;
          }

          const itemProgress = spring({ frame, fps, delay, durationFrames: 22, easing: easeOutQuart });
          const colors = getSeverityColors(alert.severity);

          return (
            <div
              key={i}
              className={`
                relative p-3 rounded-lg border
                ${colors.bg} ${colors.border}
              `}
              style={{
                opacity: itemProgress,
                transform: `translate(${translateX}px, ${translateY}px)`,
              }}
            >
              {/* Severity indicator line */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${colors.badge.split(' ')[0]}`}
              />

              <div className="flex items-start gap-2 pl-2">
                {/* Icon */}
                <span className={`text-base ${colors.icon}`}>
                  {alert.icon || getDefaultIcon(alert.severity)}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs font-semibold truncate ${colors.text}`}>
                      {alert.title}
                    </h4>
                    <span
                      className={`
                        px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                        ${colors.badge}
                      `}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  {/* Description */}
                  {alert.description && (
                    <p
                      className={`mt-1 text-[10px] leading-relaxed ${
                        isRadar ? 'text-slate-400' : 'text-stone-600'
                      }`}
                    >
                      {alert.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Hidden count indicator */}
        {hiddenCount > 0 && (
          <div
            className={`
              text-center py-2 text-xs
              ${isRadar ? 'text-slate-500' : 'text-stone-400'}
            `}
            style={{
              opacity: spring({
                frame,
                fps,
                delay: visibleAlerts.length * 8 + 10,
                durationFrames: 18,
                easing: easeOutCubic,
              }),
            }}
          >
            +{hiddenCount} more alert{hiddenCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Summary badge */}
      {alerts.length > 0 && (
        <div
          className={`
            absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold
            ${isRadar ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}
            shadow-lg
          `}
          style={{
            opacity: spring({ frame, fps, delay: 15, durationFrames: 20, easing: easeOutQuart }),
            transform: `scale(${spring({ frame, fps, delay: 15, durationFrames: 25, easing: easeOutQuart })})`,
          }}
        >
          {alerts.length}
        </div>
      )}
    </div>
  );
}
