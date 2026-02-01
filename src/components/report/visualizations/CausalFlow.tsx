'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';
import type { CausalChain } from '@/src/types/research';

interface CausalFlowProps {
  chains: CausalChain[];
  onStepClick?: (chainId: string, stepIndex: number) => void;
}

export function CausalFlow({ chains, onStepClick }: CausalFlowProps) {
  const { colors, isRadar, cardClasses, surfaceClasses, getButtonClasses } = useVisualizationTheme();
  const [activeChain, setActiveChain] = useState<string | null>(chains[0]?.id || null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const activeData = chains.find(c => c.id === activeChain);
  const steps = activeData?.descriptions || [];

  // Theme-aware gradient colors
  const gradientColors = isRadar
    ? 'from-cyan-500/50 via-blue-500/50 to-violet-500/50'
    : 'from-blue-300 via-indigo-300 to-violet-300';

  const nodeGradient = isRadar
    ? 'from-cyan-500 to-blue-600'
    : 'from-blue-500 to-indigo-600';

  return (
    <div className={`rounded-xl overflow-hidden ${cardClasses}`}>
      {/* Chain selector */}
      {chains.length > 1 && (
        <div
          className="flex gap-2 p-3 border-b"
          style={{ borderColor: colors.border, backgroundColor: colors.overlayBg }}
        >
          {chains.map((chain, i) => (
            <button
              key={chain.id}
              onClick={() => setActiveChain(chain.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${getButtonClasses(activeChain === chain.id)}`}
            >
              Chain {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Flow visualization */}
      <div className="p-6">
        <div className="relative">
          {/* Connection line */}
          <div className={`absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r ${gradientColors}`} />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, i) => {
              const isHovered = hoveredStep === i;
              const glowIntensity = isHovered ? '20' : '10';
              const glowOpacity = isHovered ? '0.5' : '0.3';

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / steps.length}%` }}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Node */}
                  <motion.div
                    animate={{ scale: isHovered ? 1.2 : 1 }}
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all bg-gradient-to-br ${nodeGradient}`}
                    style={{
                      boxShadow: isRadar
                        ? `0 0 ${glowIntensity}px rgba(34,211,238,${glowOpacity})`
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    onClick={() => onStepClick?.(activeData?.id || '', i)}
                  >
                    <span className="text-white font-bold text-sm">{i + 1}</span>
                  </motion.div>

                  {/* Label */}
                  <motion.div
                    animate={{ opacity: isHovered ? 1 : 0.7, y: isHovered ? 4 : 8 }}
                    className="mt-4 text-center max-w-[120px]"
                    style={{ color: colors.textPrimary }}
                  >
                    <p className="text-xs leading-tight">{step}</p>
                  </motion.div>

                  {/* Arrow connector */}
                  {i < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 + 0.1 }}
                      className="absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] flex items-center justify-center"
                    >
                      <svg width="100%" height="12" className="overflow-visible">
                        <motion.path
                          d={`M 0 6 L ${100}% 6`}
                          stroke={colors.connectionLine}
                          strokeWidth={2}
                          fill="none"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: i * 0.2, duration: 0.5 }}
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Impact indicator */}
        <div className={`mt-8 p-3 rounded-lg ${surfaceClasses}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              Chain Complexity
            </span>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: i < steps.length ? 1 : 0.5 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i < steps.length
                      ? colors.primary
                      : colors.gridLine,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
