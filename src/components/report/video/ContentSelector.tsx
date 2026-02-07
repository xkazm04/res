'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, Activity, BarChart3, TrendingUp, Lightbulb, Target,
  Zap, Brain, Check, X, Maximize2, Sparkles,
} from 'lucide-react';
import type { ContentSelectionState, SelectableItem, VideoSection } from './useContentSelection';
import { VIDEO_SECTIONS } from './useContentSelection';

// ── Icon Mapping ──────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'bar-chart-3': BarChart3,
  'trending-up': TrendingUp,
  'lightbulb': Lightbulb,
  'target': Target,
};

function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = SECTION_ICONS[icon];
  return Icon ? <Icon className={className} /> : null;
}

// ── Types ─────────────────────────────────────────────────────────────

interface ContentSelectorProps {
  selectionState: ContentSelectionState;
  onRecreate: () => void;
  isRadar: boolean;
  isRecreating?: boolean;
  showCurationOption?: boolean;
  onCurateWithLLM?: () => void;
  isCurating?: boolean;
}

type TabKey = 'findings' | 'perspectives' | 'analysis';

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'findings', label: 'Findings', Icon: Search },
  { key: 'perspectives', label: 'Perspectives', Icon: Eye },
  { key: 'analysis', label: 'Analysis', Icon: Activity },
];

// ── Animation Variants ────────────────────────────────────────────────

const ease = [0.25, 0.1, 0.25, 1] as const;
const popEase = [0.16, 1, 0.3, 1] as const;

const panelVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.2, ease },
  }),
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: popEase } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

// ── ContentSelector ───────────────────────────────────────────────────

export function ContentSelector({
  selectionState,
  onRecreate,
  isRadar,
  isRecreating = false,
  showCurationOption = true,
  onCurateWithLLM,
  isCurating = false,
}: ContentSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [modalItem, setModalItem] = useState<{ item: SelectableItem; tab: TabKey } | null>(null);
  const { availableItems, counts, sectionCounts, toggleItem, selectAll, deselectAll, toggleSection, getSections, enrichments, rewrites } = selectionState;

  const hasSectionAssignments = useMemo(() => {
    return Object.values(selectionState.selection.sectionAssignments).some(s => s.length > 0);
  }, [selectionState.selection.sectionAssignments]);

  const handleTabClick = useCallback((key: TabKey) => {
    setActiveTab(prev => prev === key ? null : key);
  }, []);

  const getTypeColor = useCallback((type: string, radar: boolean) => {
    const colors: Record<string, { radar: string; swiss: string }> = {
      fact: { radar: 'bg-cyan-500/20 text-cyan-300', swiss: 'bg-cyan-100 text-cyan-700' },
      claim: { radar: 'bg-amber-500/20 text-amber-300', swiss: 'bg-amber-100 text-amber-700' },
      event: { radar: 'bg-violet-500/20 text-violet-300', swiss: 'bg-violet-100 text-violet-700' },
      pattern: { radar: 'bg-emerald-500/20 text-emerald-300', swiss: 'bg-emerald-100 text-emerald-700' },
      relationship: { radar: 'bg-rose-500/20 text-rose-300', swiss: 'bg-rose-100 text-rose-700' },
      actor: { radar: 'bg-blue-500/20 text-blue-300', swiss: 'bg-blue-100 text-blue-700' },
      historical: { radar: 'bg-orange-500/20 text-orange-300', swiss: 'bg-orange-100 text-orange-700' },
      financial: { radar: 'bg-green-500/20 text-green-300', swiss: 'bg-green-100 text-green-700' },
      political: { radar: 'bg-red-500/20 text-red-300', swiss: 'bg-red-100 text-red-700' },
      journalist: { radar: 'bg-sky-500/20 text-sky-300', swiss: 'bg-sky-100 text-sky-700' },
      contradiction: { radar: 'bg-rose-500/20 text-rose-300', swiss: 'bg-rose-100 text-rose-700' },
      gap: { radar: 'bg-yellow-500/20 text-yellow-300', swiss: 'bg-yellow-100 text-yellow-700' },
      causal: { radar: 'bg-indigo-500/20 text-indigo-300', swiss: 'bg-indigo-100 text-indigo-700' },
    };
    return colors[type]?.[radar ? 'radar' : 'swiss'] || (radar ? 'bg-slate-500/20 text-slate-300' : 'bg-stone-100 text-stone-700');
  }, []);

  const items = activeTab ? availableItems[activeTab] : [];
  const selectedIds = useMemo(() => {
    if (!activeTab) return new Set<string>();
    if (activeTab === 'findings') return new Set(selectionState.selection.selectedFindings);
    if (activeTab === 'perspectives') return new Set(selectionState.selection.selectedPerspectives);
    return new Set([
      ...selectionState.selection.selectedContradictions,
      ...selectionState.selection.selectedGaps,
      ...selectionState.selection.selectedCausalChains,
    ]);
  }, [activeTab, selectionState.selection]);

  return (
    <>
      <div className={`rounded-xl overflow-hidden ${
        isRadar
          ? 'bg-slate-900/60 border border-slate-700/40 backdrop-blur-sm'
          : 'bg-white border border-stone-200'
      }`}>
        {/* Tabs Row */}
        <div className={`flex items-center gap-1 p-2 ${isRadar ? 'bg-slate-800/40' : 'bg-stone-50'}`}>
          {TABS.map(tab => {
            const count = counts[tab.key];
            const isActive = activeTab === tab.key;
            const TabIcon = tab.Icon;
            return (
              <motion.button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                whileTap={{ scale: 0.97 }}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${isActive
                    ? isRadar
                      ? 'text-cyan-300'
                      : 'text-white'
                    : isRadar
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className={isRadar
                      ? 'absolute inset-0 bg-cyan-500/15 border border-cyan-500/30 rounded-lg'
                      : 'absolute inset-0 bg-stone-800 rounded-lg'
                    }
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`
                    px-1.5 py-0.5 rounded text-[10px] font-bold
                    ${isRadar ? 'bg-slate-700/80 text-slate-300' : 'bg-stone-200 text-stone-600'}
                  `}>
                    {count.selected}/{count.total}
                  </span>
                </span>
              </motion.button>
            );
          })}

          <div className="flex-1" />

          {/* Section counts indicator */}
          {hasSectionAssignments && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] ${
              isRadar ? 'bg-slate-700/40 border border-slate-600/30' : 'bg-stone-100'
            }`}>
              {VIDEO_SECTIONS.map(section => (
                <span
                  key={section.key}
                  className={`flex items-center gap-0.5 ${
                    sectionCounts[section.key] > 0
                      ? (isRadar ? 'text-cyan-300' : 'text-stone-700')
                      : (isRadar ? 'text-slate-500' : 'text-stone-400')
                  }`}
                  title={`${section.label}: ${sectionCounts[section.key]} items`}
                >
                  <SectionIcon icon={section.icon} className="w-3 h-3" />
                  {sectionCounts[section.key] > 0 && (
                    <span className="font-bold">{sectionCounts[section.key]}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRecreate}
              disabled={isRecreating || isCurating}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isRecreating || isCurating ? 'opacity-50 cursor-not-allowed' : ''}
                ${isRadar
                  ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 border border-slate-600/30'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }
              `}
              title="Quick preview without LLM curation"
            >
              {isRecreating ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Zap className="w-3.5 h-3.5" />
                </motion.span>
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>{isRecreating ? 'Quick...' : 'Quick'}</span>
            </motion.button>

            {showCurationOption && onCurateWithLLM && hasSectionAssignments && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCurateWithLLM}
                disabled={isCurating || isRecreating}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${isCurating || isRecreating ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isRadar
                    ? 'bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white hover:from-violet-400/80 hover:to-purple-400/80 border border-violet-400/30'
                    : 'bg-stone-800 text-white hover:bg-stone-700'
                  }
                `}
                title="Use AI to curate content for each video section"
              >
                {isCurating ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Brain className="w-3.5 h-3.5" />
                  </motion.span>
                ) : (
                  <Brain className="w-3.5 h-3.5" />
                )}
                <span>{isCurating ? 'Curating...' : 'AI Curate'}</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Expandable Panel */}
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
            >
              <div className={`p-3 border-t ${isRadar ? 'border-slate-700/40' : 'border-stone-200'}`}>
                {/* Select All / Deselect All */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => selectAll(activeTab)}
                    className={`text-[11px] font-medium transition-colors ${
                      isRadar ? 'text-cyan-400 hover:text-cyan-300' : 'text-stone-600 hover:text-stone-800'
                    }`}
                  >
                    Select All
                  </button>
                  <span className={isRadar ? 'text-slate-600' : 'text-stone-300'}>|</span>
                  <button
                    onClick={() => deselectAll(activeTab)}
                    className={`text-[11px] font-medium transition-colors ${
                      isRadar ? 'text-slate-400 hover:text-slate-300' : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Deselect All
                  </button>
                  <div className="flex-1" />
                  <span className={`text-[10px] font-medium ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                    Click item to expand
                  </span>
                </div>

                {/* Scrollable List */}
                <div className="max-h-[360px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {items.length === 0 ? (
                    <div className={`text-center py-6 text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                      No items available
                    </div>
                  ) : (
                    items.map((item, i) => (
                      <SelectableRow
                        key={item.id}
                        index={i}
                        item={item}
                        isSelected={selectedIds.has(item.id)}
                        onToggle={() => toggleItem(activeTab, item.id)}
                        onExpand={() => setModalItem({ item, tab: activeTab })}
                        assignedSections={getSections(item.id)}
                        onToggleSection={(section) => toggleSection(item.id, section)}
                        isRadar={isRadar}
                        typeColor={getTypeColor(item.type, isRadar)}
                        hasEnrichment={enrichments.has(item.id)}
                        hasRewrite={rewrites.has(item.id)}
                        rewriteText={rewrites.get(item.id)?.optimized}
                        enrichmentTypes={enrichments.get(item.id)?.map(e => e.type)}
                      />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {modalItem && activeTab && (
          <ContentItemModal
            item={modalItem.item}
            tab={modalItem.tab}
            isSelected={selectedIds.has(modalItem.item.id)}
            onToggle={() => toggleItem(modalItem.tab, modalItem.item.id)}
            assignedSections={getSections(modalItem.item.id)}
            onToggleSection={(section) => toggleSection(modalItem.item.id, section)}
            onClose={() => setModalItem(null)}
            isRadar={isRadar}
            typeColor={getTypeColor(modalItem.item.type, isRadar)}
            rewrite={(() => {
              const rw = rewrites.get(modalItem.item.id);
              return rw ? rw : undefined;
            })()}
            enrichments={enrichments.get(modalItem.item.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── SelectableRow ─────────────────────────────────────────────────────

interface SelectableRowProps {
  item: SelectableItem;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
  onExpand: () => void;
  assignedSections: VideoSection[];
  onToggleSection: (section: VideoSection) => void;
  isRadar: boolean;
  typeColor: string;
  hasEnrichment?: boolean;
  hasRewrite?: boolean;
  rewriteText?: string;
  enrichmentTypes?: string[];
}

const SelectableRow = memo(function SelectableRow({
  item,
  index,
  isSelected,
  onToggle,
  onExpand,
  assignedSections,
  onToggleSection,
  isRadar,
  typeColor,
  hasEnrichment,
  hasRewrite,
  rewriteText,
  enrichmentTypes,
}: SelectableRowProps) {
  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={`
        group p-2.5 rounded-lg transition-colors cursor-pointer space-y-1.5
        ${isRadar
          ? isSelected
            ? 'bg-cyan-500/8 border border-cyan-500/25'
            : 'bg-slate-800/40 border border-transparent hover:bg-slate-800/60 hover:border-slate-700/50'
          : isSelected
            ? 'bg-stone-100 border border-stone-300'
            : 'bg-white border border-stone-100 hover:bg-stone-50'
        }
      `}
    >
      {/* Row 1: Checkbox + Title */}
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`
            w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
            ${isRadar
              ? isSelected
                ? 'bg-cyan-500 text-slate-900'
                : 'bg-slate-700 border border-slate-600 hover:border-slate-500'
              : isSelected
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-300 hover:border-stone-400'
            }
          `}
        >
          {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
        </button>

        <button
          onClick={onExpand}
          className="flex-1 min-w-0 text-left"
        >
          {rewriteText ? (
            <div>
              <p className={`text-xs leading-snug line-clamp-2 transition-colors ${
                isRadar ? 'text-cyan-200 group-hover:text-cyan-100' : 'text-cyan-700 group-hover:text-cyan-800'
              }`}>
                {rewriteText}
              </p>
              <p className={`text-[10px] leading-snug line-clamp-1 mt-0.5 line-through ${
                isRadar ? 'text-slate-500' : 'text-stone-400'
              }`}>
                {item.title}
              </p>
            </div>
          ) : (
            <p className={`text-xs leading-snug line-clamp-2 transition-colors ${
              isRadar
                ? 'text-slate-200 group-hover:text-white'
                : 'text-stone-700 group-hover:text-stone-900'
            }`}>
              {item.title}
            </p>
          )}
        </button>
      </div>

      {/* Row 2: Tags (left) + Actions (right) */}
      <div className="flex items-center justify-between pl-6">
        {/* Left: badges */}
        <div className="flex items-center gap-1.5">
          <div className={`
            px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0
            ${item.confidence >= 80
              ? isRadar ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              : item.confidence >= 60
                ? isRadar ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                : isRadar ? 'bg-slate-500/20 text-slate-300' : 'bg-stone-100 text-stone-600'
            }
          `}>
            {item.confidence}%
          </div>
          <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${typeColor}`}>
            {item.type}
          </div>
          {enrichmentTypes && enrichmentTypes.length > 0 && (
            <>
              {enrichmentTypes.slice(0, 2).map((type, i) => (
                <span key={i} className={`px-1 py-0.5 rounded text-[10px] font-medium ${
                  type === 'stat'
                    ? isRadar ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700'
                    : type === 'quote'
                      ? isRadar ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700'
                      : isRadar ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  +{type}
                </span>
              ))}
              {enrichmentTypes.length > 2 && (
                <span className={`px-1 py-0.5 rounded text-[10px] ${
                  isRadar ? 'text-slate-400' : 'text-stone-400'
                }`}>
                  +{enrichmentTypes.length - 2}
                </span>
              )}
            </>
          )}
          {hasEnrichment && (!enrichmentTypes || enrichmentTypes.length === 0) && (
            <span className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium ${
              isRadar ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700'
            }`} title="AI enriched">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          )}
          {hasRewrite && (
            <span className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium ${
              isRadar ? 'bg-cyan-500/15 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
            }`} title="Optimized for video">
              AI
            </span>
          )}
        </div>

        {/* Right: section buttons + expand */}
        <div className="flex items-center gap-0.5">
          {isSelected && VIDEO_SECTIONS.map(section => {
            const isAssigned = assignedSections.includes(section.key);
            return (
              <button
                key={section.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSection(section.key);
                }}
                title={`${isAssigned ? 'Remove from' : 'Add to'} ${section.label}`}
                className={`
                  w-5 h-5 rounded flex items-center justify-center transition-all
                  ${isAssigned
                    ? isRadar
                      ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                      : 'bg-stone-700 text-white'
                    : isRadar
                      ? 'bg-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                      : 'bg-stone-100 text-stone-400 hover:text-stone-600 hover:bg-stone-200'
                  }
                `}
              >
                <SectionIcon icon={section.icon} className="w-2.5 h-2.5" />
              </button>
            );
          })}
          <button
            onClick={onExpand}
            className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 ${
              isRadar
                ? 'text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
            title="View full details"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ── ContentItemModal ──────────────────────────────────────────────────

interface ContentItemModalProps {
  item: SelectableItem;
  tab: TabKey;
  isSelected: boolean;
  onToggle: () => void;
  assignedSections: VideoSection[];
  onToggleSection: (section: VideoSection) => void;
  onClose: () => void;
  isRadar: boolean;
  typeColor: string;
  rewrite?: { original: string; optimized: string };
  enrichments?: Array<{ type: string; content: string; source?: string }>;
}

function ContentItemModal({
  item,
  tab,
  isSelected,
  onToggle,
  assignedSections,
  onToggleSection,
  onClose,
  isRadar,
  typeColor,
  rewrite,
  enrichments,
}: ContentItemModalProps) {
  const fullContent = item.content;
  const keyInsights = item.rawData?.keyInsights as string[] | undefined;

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl ${
          isRadar
            ? 'bg-slate-900 border border-slate-700/60'
            : 'bg-white border border-stone-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start gap-3 p-5 border-b ${
          isRadar ? 'border-slate-700/40 bg-slate-800/30' : 'border-stone-100'
        }`}>
          <div className="flex-1 min-w-0">
            {/* Type + Confidence badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${typeColor}`}>
                {item.type}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                item.confidence >= 80
                  ? isRadar ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  : item.confidence >= 60
                    ? isRadar ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                    : isRadar ? 'bg-slate-500/20 text-slate-300' : 'bg-stone-100 text-stone-600'
              }`}>
                {item.confidence}% confidence
              </span>
              <span className={`text-[11px] capitalize ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                {item.category.replace('_', ' ')}
              </span>
            </div>

            <h3 className={`text-sm font-semibold leading-snug ${
              isRadar ? 'text-white' : 'text-stone-900'
            }`}>
              {item.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              isRadar
                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[50vh]">
          {/* Rewrite comparison */}
          {rewrite ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-lg ${
                isRadar ? 'bg-slate-800/50 border border-slate-700/40' : 'bg-stone-50 border border-stone-200'
              }`}>
                <h4 className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isRadar ? 'text-slate-500' : 'text-stone-400'
                }`}>
                  Original
                </h4>
                <p className={`text-xs leading-relaxed ${
                  isRadar ? 'text-slate-400' : 'text-stone-500'
                }`}>
                  {fullContent}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isRadar ? 'bg-cyan-500/5 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200'
              }`}>
                <h4 className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isRadar ? 'text-cyan-400' : 'text-cyan-600'
                }`}>
                  Optimized
                </h4>
                <p className={`text-xs leading-relaxed ${
                  isRadar ? 'text-cyan-200' : 'text-cyan-800'
                }`}>
                  {rewrite.optimized}
                </p>
              </div>
            </div>
          ) : (
            <p className={`text-sm leading-relaxed ${
              isRadar ? 'text-slate-300' : 'text-stone-600'
            }`}>
              {fullContent}
            </p>
          )}

          {/* Enrichments */}
          {enrichments && enrichments.length > 0 && (
            <div className="mt-4">
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                isRadar ? 'text-violet-400' : 'text-violet-600'
              }`}>
                Enrichments
              </h4>
              <div className="space-y-2">
                {enrichments.map((e, i) => (
                  <div key={i} className={`p-2.5 rounded-lg ${
                    isRadar ? 'bg-violet-500/5 border border-violet-500/15' : 'bg-violet-50 border border-violet-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        e.type === 'stat'
                          ? isRadar ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
                          : e.type === 'quote'
                            ? isRadar ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                            : isRadar ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {e.type}
                      </span>
                      {e.source && (
                        <a
                          href={e.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[10px] truncate max-w-[200px] ${
                            isRadar ? 'text-slate-500 hover:text-cyan-400' : 'text-stone-400 hover:text-cyan-600'
                          }`}
                        >
                          {e.source}
                        </a>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      isRadar ? 'text-slate-300' : 'text-stone-600'
                    }`}>
                      {e.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights */}
          {keyInsights && keyInsights.length > 0 && (
            <div className="mt-4">
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                isRadar ? 'text-slate-400' : 'text-stone-500'
              }`}>
                Key Insights
              </h4>
              <ul className="space-y-1.5">
                {keyInsights.map((insight, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${
                    isRadar ? 'text-slate-300' : 'text-stone-600'
                  }`}>
                    <Lightbulb className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                      isRadar ? 'text-amber-400' : 'text-amber-600'
                    }`} />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center gap-3 p-4 border-t ${
          isRadar ? 'border-slate-700/40 bg-slate-800/20' : 'border-stone-100 bg-stone-50'
        }`}>
          {/* Toggle selection */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onToggle}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors
              ${isSelected
                ? isRadar
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
                  : 'bg-stone-800 text-white hover:bg-stone-700'
                : isRadar
                  ? 'bg-slate-700/60 text-slate-300 border border-slate-600/40 hover:bg-slate-700'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }
            `}
          >
            {isSelected ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5" />}
            {isSelected ? 'Selected' : 'Select for video'}
          </motion.button>

          {/* Section assignment - larger buttons */}
          {isSelected && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className={`text-[10px] font-medium mr-1 ${
                isRadar ? 'text-slate-500' : 'text-stone-400'
              }`}>
                Assign to:
              </span>
              {VIDEO_SECTIONS.map(section => {
                const isAssigned = assignedSections.includes(section.key);
                return (
                  <motion.button
                    key={section.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onToggleSection(section.key)}
                    title={section.description}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors
                      ${isAssigned
                        ? isRadar
                          ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
                          : 'bg-stone-700 text-white'
                        : isRadar
                          ? 'bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:text-slate-200 hover:bg-slate-700'
                          : 'bg-stone-100 text-stone-500 hover:text-stone-700 hover:bg-stone-200'
                      }
                    `}
                  >
                    <SectionIcon icon={section.icon} className="w-3.5 h-3.5" />
                    <span>{section.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
