'use client';

import { spring, easeOutCubic, easeOutQuart, easeInOutCubic } from '../useVideoPlayback';
import type { ReactNode } from 'react';

interface SplitScreenProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftTitle: string;
  rightTitle: string;
  frame: number;
  fps: number;
  isRadar: boolean;
  width: number;
  height: number;
  /** Left panel color */
  leftColor?: string;
  /** Right panel color */
  rightColor?: string;
  /** Animation style */
  revealStyle?: 'slide' | 'fade' | 'wipe';
  /** Show VS divider */
  showDivider?: boolean;
}

/**
 * Two-panel comparison layout with animated reveal.
 * Used for BullBear and NarrativeComparison scenes.
 */
export function SplitScreen({
  leftContent,
  rightContent,
  leftTitle,
  rightTitle,
  frame,
  fps,
  isRadar,
  width,
  height,
  leftColor = '#22c55e',
  rightColor = '#ef4444',
  revealStyle = 'slide',
  showDivider = true,
}: SplitScreenProps) {
  const titleProgress = spring({ frame, fps, delay: 0, durationFrames: 20, easing: easeOutCubic });
  const leftProgress = spring({ frame, fps, delay: 5, durationFrames: 28, easing: easeOutQuart });
  const rightProgress = spring({ frame, fps, delay: 15, durationFrames: 28, easing: easeOutQuart });
  const dividerProgress = spring({ frame, fps, delay: 10, durationFrames: 22, easing: easeInOutCubic });

  const panelWidth = (width - (showDivider ? 40 : 8)) / 2;

  // Calculate animation transforms based on style
  const getLeftTransform = () => {
    switch (revealStyle) {
      case 'slide':
        return `translateX(${(1 - leftProgress) * -30}px)`;
      case 'wipe':
        return `scaleX(${leftProgress})`;
      case 'fade':
      default:
        return 'none';
    }
  };

  const getRightTransform = () => {
    switch (revealStyle) {
      case 'slide':
        return `translateX(${(1 - rightProgress) * 30}px)`;
      case 'wipe':
        return `scaleX(${rightProgress})`;
      case 'fade':
      default:
        return 'none';
    }
  };

  return (
    <div className="flex items-stretch gap-1" style={{ width, height }}>
      {/* Left Panel */}
      <div
        className="relative flex flex-col rounded-l-xl overflow-hidden"
        style={{
          width: panelWidth,
          opacity: leftProgress,
          transform: getLeftTransform(),
          transformOrigin: 'right center',
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{
            backgroundColor: `${leftColor}20`,
            borderBottom: `2px solid ${leftColor}`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: leftColor }}
          />
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: leftColor, opacity: titleProgress }}
          >
            {leftTitle}
          </h3>
        </div>

        {/* Content */}
        <div
          className={`flex-1 p-3 overflow-hidden ${
            isRadar ? 'bg-slate-900/50' : 'bg-white/50'
          }`}
        >
          {leftContent}
        </div>
      </div>

      {/* Center Divider */}
      {showDivider && (
        <div
          className="flex items-center justify-center"
          style={{ width: 40, opacity: dividerProgress }}
        >
          <div className="relative">
            {/* Vertical line */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-px ${
                isRadar ? 'bg-slate-700' : 'bg-stone-300'
              }`}
              style={{
                height: height * dividerProgress,
                top: `${((1 - dividerProgress) / 2) * 100}%`,
              }}
            />

            {/* VS badge */}
            <div
              className={`
                relative px-2 py-1 rounded-full text-[10px] font-bold
                ${isRadar ? 'bg-slate-800 text-slate-300' : 'bg-stone-200 text-stone-600'}
              `}
              style={{
                transform: `scale(${dividerProgress})`,
              }}
            >
              VS
            </div>
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div
        className="relative flex flex-col rounded-r-xl overflow-hidden"
        style={{
          width: panelWidth,
          opacity: rightProgress,
          transform: getRightTransform(),
          transformOrigin: 'left center',
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center justify-end gap-2"
          style={{
            backgroundColor: `${rightColor}20`,
            borderBottom: `2px solid ${rightColor}`,
          }}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: rightColor, opacity: titleProgress }}
          >
            {rightTitle}
          </h3>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: rightColor }}
          />
        </div>

        {/* Content */}
        <div
          className={`flex-1 p-3 overflow-hidden ${
            isRadar ? 'bg-slate-900/50' : 'bg-white/50'
          }`}
        >
          {rightContent}
        </div>
      </div>
    </div>
  );
}

/**
 * Content item for split screen panels
 */
interface SplitContentItemProps {
  text: string;
  frame: number;
  fps: number;
  delay: number;
  isRadar: boolean;
  color: string;
  /** String icon (emoji or character) */
  icon?: string;
  /** Custom ReactNode icon (SVG component) - takes precedence over icon */
  customIcon?: ReactNode;
}

export function SplitContentItem({
  text,
  frame,
  fps,
  delay,
  isRadar,
  color,
  icon = '•',
  customIcon,
}: SplitContentItemProps) {
  const progress = spring({ frame, fps, delay, durationFrames: 20, easing: easeOutCubic });

  return (
    <div
      className="flex items-start gap-2 py-1.5"
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 10}px)`,
      }}
    >
      {customIcon ? (
        <span className="flex-shrink-0">{customIcon}</span>
      ) : (
        <span style={{ color }}>{icon}</span>
      )}
      <span className={`text-xs leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
        {text}
      </span>
    </div>
  );
}
