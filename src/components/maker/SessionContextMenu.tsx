'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface SessionContextMenuProps {
  sessionId: string;
  sessionTitle: string;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (id: string) => void;
}

const menuVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -2,
    transition: { duration: 0.1 },
  },
};

export function SessionContextMenu({
  sessionId,
  sessionTitle,
  position,
  onClose,
  onDelete,
}: SessionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    // Close on scroll
    function handleScroll() {
      onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = useCallback(() => {
    const menuWidth = 180;
    const menuHeight = 48;
    const padding = 8;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth + padding > window.innerWidth) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight + padding > window.innerHeight) {
      y = window.innerHeight - menuHeight - padding;
    }

    return { x, y };
  }, [position])();

  const handleDelete = useCallback(() => {
    onDelete(sessionId);
    onClose();
  }, [sessionId, onDelete, onClose]);

  return (
    <motion.div
      ref={menuRef}
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed z-50 min-w-[180px] py-1 rounded-xl
                 bg-slate-800/95 backdrop-blur-md border border-slate-700/60
                 shadow-xl shadow-black/40"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      <button
        onClick={handleDelete}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium
                   text-red-400 hover:bg-red-500/10 hover:text-red-300
                   transition-colors rounded-lg mx-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete session</span>
      </button>
    </motion.div>
  );
}
