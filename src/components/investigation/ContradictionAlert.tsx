'use client';

import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { useInvestigationStore } from '@/src/stores/investigationStore';
import { AlertTriangle, X, ChevronLeft, ChevronRight, ExternalLink } from '@/src/components/ui/icons';
import type { ResearchContradiction, ResearchFinding } from '@/src/types/research';

// ============================================================================
// BRUTALIST DESIGN SYSTEM
// ============================================================================
const BRUTALIST = {
  border: '3px solid black',
  borderLight: '2px solid black',
  shadow: '6px 6px 0 black',
  shadowSm: '4px 4px 0 black',
  font: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
} as const;

interface ContradictionAlertProps {
  contradictions: ResearchContradiction[];
  findings: ResearchFinding[];
}

export function ContradictionAlert({ contradictions, findings }: ContradictionAlertProps) {
  const { selectFinding, toggleContradictions } = useInvestigationStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const currentContradiction = contradictions[currentIndex];

  const getFinding = (id?: string) => findings.find((f) => f.id === id);

  const handlePrev = () => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : contradictions.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i < contradictions.length - 1 ? i + 1 : 0));
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-amber-500 text-black font-bold uppercase tracking-widest z-50 transition-transform hover:translate-x-[2px] hover:translate-y-[2px]"
        style={{
          border: BRUTALIST.border,
          boxShadow: BRUTALIST.shadowSm,
          fontFamily: BRUTALIST.font,
        }}
      >
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">{contradictions.length} CONTRADICTIONS</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50">
      <div
        className="bg-white overflow-hidden"
        style={{
          border: BRUTALIST.border,
          boxShadow: BRUTALIST.shadow,
          fontFamily: BRUTALIST.font,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-widest">Conflicting Claims</span>
            <span
              className="text-xs font-bold bg-black text-white px-1.5 py-0.5"
            >
              {currentIndex + 1} / {contradictions.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-amber-600 transition-colors"
              title="Minimize"
            >
              <span className="text-lg leading-none font-bold">−</span>
            </button>
            <button
              onClick={toggleContradictions}
              className="p-1 hover:bg-amber-600 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 relative">
            {/* Claim 1 */}
            <ContradictionClaim
              label="CLAIM A"
              claim={currentContradiction.claim_1}
              source={currentContradiction.source_1}
              finding={getFinding(currentContradiction.finding_id_1)}
              onViewFinding={() => {
                if (currentContradiction.finding_id_1) {
                  selectFinding(currentContradiction.finding_id_1);
                }
              }}
            />

            {/* VS indicator */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
              <div
                className="w-10 h-10 bg-black text-white flex items-center justify-center"
                style={{ border: BRUTALIST.borderLight }}
              >
                <span className="text-xs font-bold">VS</span>
              </div>
            </div>

            {/* Claim 2 */}
            <ContradictionClaim
              label="CLAIM B"
              claim={currentContradiction.claim_2}
              source={currentContradiction.source_2}
              finding={getFinding(currentContradiction.finding_id_2)}
              onViewFinding={() => {
                if (currentContradiction.finding_id_2) {
                  selectFinding(currentContradiction.finding_id_2);
                }
              }}
            />
          </div>

          {/* Resolution hint */}
          {currentContradiction.resolution_hint && (
            <div
              className="mt-3 pt-3"
              style={{ borderTop: BRUTALIST.borderLight }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">
                POSSIBLE RESOLUTION
              </div>
              <p className="text-xs">{currentContradiction.resolution_hint}</p>
            </div>
          )}

          {/* Significance */}
          {currentContradiction.significance && (
            <div className="mt-2 text-[10px]">
              <span className="font-bold uppercase">Significance:</span>{' '}
              <span>{currentContradiction.significance}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        {contradictions.length > 1 && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2"
            style={{ borderTop: BRUTALIST.borderLight }}
          >
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {contradictions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    'w-2 h-2 transition-colors',
                    i === currentIndex ? 'bg-black' : 'bg-gray-300'
                  )}
                  style={{ border: '1px solid black' }}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ContradictionClaimProps {
  label: string;
  claim: string;
  source?: string;
  finding?: ResearchFinding;
  onViewFinding: () => void;
}

function ContradictionClaim({ label, claim, source, finding, onViewFinding }: ContradictionClaimProps) {
  return (
    <div
      className="bg-gray-50 p-3 relative"
      style={{ border: BRUTALIST.borderLight }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">{label}</div>
      <p className="text-sm leading-relaxed mb-2">{claim}</p>
      {source && (
        <div className="text-[10px] text-gray-500">
          <span className="font-bold uppercase">Source:</span> {source}
        </div>
      )}
      {finding && (
        <button
          onClick={onViewFinding}
          className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          VIEW ON BOARD
        </button>
      )}
    </div>
  );
}
