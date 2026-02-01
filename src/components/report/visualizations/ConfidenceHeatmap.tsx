'use client';

import { motion } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';

interface HeatmapCell {
  id: string;
  label: string;
  value: number; // 0-1
  category?: string;
}

interface ConfidenceHeatmapProps {
  data: HeatmapCell[];
  title?: string;
  onCellClick?: (id: string) => void;
}

export function ConfidenceHeatmap({ data, title, onCellClick }: ConfidenceHeatmapProps) {
  const { colors, isRadar, cardClasses, tooltipClasses, getConfidenceColor } = useVisualizationTheme();

  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className={`rounded-xl p-4 ${cardClasses}`}>
      {title && (
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
          {title}
        </h4>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1 mb-3">
        <span className="text-[10px]" style={{ color: colors.textMuted }}>Low</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden flex">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
            <div key={v} className="flex-1" style={{ backgroundColor: getConfidenceColor(v) }} />
          ))}
        </div>
        <span className="text-[10px]" style={{ color: colors.textMuted }}>High</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1">
        {sorted.map((cell, i) => {
          const cellColor = getConfidenceColor(cell.value);
          return (
            <motion.button
              key={cell.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              onClick={() => onCellClick?.(cell.id)}
              className="relative aspect-square rounded-md flex items-center justify-center cursor-pointer group"
              style={{
                backgroundColor: cellColor,
                boxShadow: isRadar && cell.value >= 0.8 ? `0 0 15px ${cellColor}` : undefined,
              }}
            >
              <span
                className="text-[10px] font-bold"
                style={{ color: cell.value >= 0.5 || isRadar ? colors.textOnDark : colors.textOnLight }}
              >
                {Math.round(cell.value * 100)}
              </span>

              {/* Hover tooltip */}
              <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 ${tooltipClasses}`}>
                {cell.label}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
