'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FileText, Globe } from 'lucide-react';
import type { SessionSummary } from '@/src/lib/sessionCache';
import { getTemplateDisplayName, getTemplateColor } from '@/src/stores/appStore';

interface SessionCardProps {
  session: SessionSummary;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const SessionCard = memo(function SessionCard({
  session,
  isSelected,
  onSelect,
  onContextMenu,
}: SessionCardProps) {
  const templateColor = getTemplateColor(session.template_type || 'unknown');
  const findings = session.claim_count || 0;
  const sources = session.source_count || 0;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e);
  }, [onContextMenu]);

  return (
    <motion.button
      onClick={onSelect}
      onContextMenu={handleContextMenu}
      whileTap={{ scale: 0.98 }}
      layout
      className={`
        group w-full text-left p-3 rounded-xl transition-all duration-200
        border ${isSelected
          ? 'border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/5'
          : 'border-slate-800/40 hover:border-slate-700/60 hover:bg-slate-800/20'
        }
      `}
    >
      {/* Title */}
      <h3 className={`text-[13px] font-medium leading-snug line-clamp-2
                      ${isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'}`}>
        {session.title}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-2">
        {/* Template badge */}
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${templateColor}15`, color: templateColor }}
        >
          {getTemplateDisplayName(session.template_type || 'unknown')}
        </span>

        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {findings}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {sources}
          </span>
        </div>
      </div>

      {/* Date */}
      <p className="text-[10px] text-slate-600 mt-2 font-medium">
        {session.created_at ? format(new Date(session.created_at), 'MMM d, yyyy') : '\u2014'}
      </p>
    </motion.button>
  );
});
