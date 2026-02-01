'use client';

import { createContext, useContext, ReactNode } from 'react';

interface SequenceContextValue {
  frame: number;
  startFrame: number;
  durationInFrames: number;
  localFrame: number;
}

const SequenceContext = createContext<SequenceContextValue | null>(null);

export function useSequence() {
  const ctx = useContext(SequenceContext);
  if (!ctx) throw new Error('useSequence must be used within a Sequence');
  return ctx;
}

interface SequenceProps {
  from: number;
  durationInFrames?: number;
  frame: number;
  children: ReactNode;
  name?: string;
}

export function Sequence({ from, durationInFrames, frame, children, name }: SequenceProps) {
  const localFrame = frame - from;
  const isVisible = localFrame >= 0 && (durationInFrames === undefined || localFrame < durationInFrames);

  if (!isVisible) return null;

  const value: SequenceContextValue = {
    frame,
    startFrame: from,
    durationInFrames: durationInFrames ?? Infinity,
    localFrame,
  };

  return (
    <SequenceContext.Provider value={value}>
      <div data-sequence={name} className="absolute inset-0">
        {children}
      </div>
    </SequenceContext.Provider>
  );
}

// Series helper - auto-calculate frame offsets
interface SeriesItem {
  component: ReactNode;
  durationInFrames: number;
}

interface SeriesProps {
  items: SeriesItem[];
  frame: number;
}

export function Series({ items, frame }: SeriesProps) {
  let currentOffset = 0;

  return (
    <>
      {items.map((item, i) => {
        const startFrame = currentOffset;
        currentOffset += item.durationInFrames;

        return (
          <Sequence key={i} from={startFrame} durationInFrames={item.durationInFrames} frame={frame}>
            {item.component}
          </Sequence>
        );
      })}
    </>
  );
}
