'use client';

import { motion } from 'framer-motion';

// Bounce animation for illustrations on mount
const bounceTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 15,
};

interface IllustrationProps {
  className?: string;
}

// Magnifying glass - for "no search results"
export function SearchIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <circle cx="28" cy="28" r="16" />
      <path d="M40 40L52 52" />
      <path d="M28 20v16M20 28h16" strokeDasharray="4 4" opacity="0.5" />
    </motion.svg>
  );
}

// Folder - for "no entities"
export function FolderIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <path d="M8 16v32a4 4 0 004 4h40a4 4 0 004-4V24a4 4 0 00-4-4H32l-4-8H12a4 4 0 00-4 4z" />
      <path d="M24 36h16" strokeDasharray="4 4" opacity="0.5" />
    </motion.svg>
  );
}

// Chain break - for "no contradictions"
export function ChainBreakIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <path d="M12 32a8 8 0 018-8h4" />
      <path d="M12 32a8 8 0 008 8h4" />
      <path d="M52 32a8 8 0 00-8-8h-4" />
      <path d="M52 32a8 8 0 01-8 8h-4" />
      <path d="M28 28l8 8M36 28l-8 8" opacity="0.5" />
    </motion.svg>
  );
}

// Document stack - for "no findings"
export function DocumentsIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <rect x="16" y="12" width="32" height="40" rx="2" />
      <path d="M24 24h16M24 32h12M24 40h8" opacity="0.7" />
      <path d="M12 16v36a4 4 0 004 4h28" opacity="0.4" />
    </motion.svg>
  );
}

// Globe/Network - for "no sources"
export function NetworkIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <circle cx="32" cy="32" r="20" />
      <ellipse cx="32" cy="32" rx="8" ry="20" />
      <path d="M12 32h40" />
      <path d="M16 20h32" opacity="0.5" />
      <path d="M16 44h32" opacity="0.5" />
    </motion.svg>
  );
}

// Lightbulb - for "no perspectives"
export function LightbulbIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <path d="M32 8a16 16 0 00-8 29.8V44a4 4 0 004 4h8a4 4 0 004-4v-6.2A16 16 0 0032 8z" />
      <path d="M24 52h16M28 56h8" />
      <path d="M32 16v8M24 24l4 4M40 24l-4 4" opacity="0.5" />
    </motion.svg>
  );
}

// Bar chart - for "no analysis"
export function AnalysisIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <path d="M8 52h48" />
      <rect x="14" y="36" width="8" height="16" rx="1" opacity="0.5" />
      <rect x="28" y="24" width="8" height="28" rx="1" opacity="0.7" />
      <rect x="42" y="16" width="8" height="36" rx="1" />
      <path d="M12 20l16 8 16-12" strokeDasharray="4 4" opacity="0.5" />
    </motion.svg>
  );
}

// Users/People - for "no entities (people)"
export function UsersIllustration({ className = '' }: IllustrationProps) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounceTransition}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-300 ${className}`}
    >
      <circle cx="32" cy="20" r="8" />
      <path d="M16 52v-4a16 16 0 0132 0v4" />
      <circle cx="16" cy="24" r="6" opacity="0.5" />
      <circle cx="48" cy="24" r="6" opacity="0.5" />
      <path d="M4 52v-2a12 12 0 0112-12" opacity="0.4" />
      <path d="M60 52v-2a12 12 0 00-12-12" opacity="0.4" />
    </motion.svg>
  );
}
