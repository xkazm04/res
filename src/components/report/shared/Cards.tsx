'use client';

import { type ReactNode } from 'react';
import { useThemedColors, type CardColor, type AlertVariant, progressColors } from './themeColors';

// Quick stat card - theme-aware with centralized colors
export function QuickStatCard({
  label,
  value,
  subtext,
  progress,
  icon,
  color,
  children,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  progress?: number;
  icon: ReactNode;
  color: CardColor;
  children?: ReactNode;
}) {
  const { getCard, getProgressBg, getProgressColor } = useThemedColors();

  return (
    <div className={`rounded-lg border p-3 ${getCard(color)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="w-4 h-4 opacity-60">{icon}</span>
        <span className="text-[9px] uppercase tracking-wider opacity-60">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {subtext && <div className="text-[10px] opacity-70 mt-0.5">{subtext}</div>}
      {progress !== undefined && (
        <div className={`h-1 ${getProgressBg()} rounded-full mt-2 overflow-hidden`}>
          <div
            className={`h-full rounded-full ${getProgressColor(color)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

// Alert banner - theme-aware with centralized colors
export function AlertBanner({
  title,
  description,
  variant,
  icon,
}: {
  title: string;
  description: string;
  variant: AlertVariant;
  icon?: ReactNode;
}) {
  const { getAlert } = useThemedColors();

  return (
    <div className={`border rounded-lg p-3 ${getAlert(variant)}`}>
      <div className="flex items-center gap-2 font-semibold text-xs mb-1">
        {icon && <span className="w-3.5 h-3.5">{icon}</span>}
        {title}
      </div>
      <p className="text-[10px] opacity-80">{description}</p>
    </div>
  );
}
