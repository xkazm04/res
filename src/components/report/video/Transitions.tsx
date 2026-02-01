'use client';

// Re-export all transition components from shared animation library
// This file is kept for backward compatibility with existing imports
export {
  Crossfade,
  Slide,
  Scale,
  Stagger,
  Reveal,
  CountUp,
  Pulse,
  transitionPresets,
} from '@/src/lib/animation';
