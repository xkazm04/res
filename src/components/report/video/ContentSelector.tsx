'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentSelectionState, SelectableItem, VideoSection } from './useContentSelection';
import { VIDEO_SECTIONS } from './useContentSelection';

interface ContentSelectorProps {
  selectionState: ContentSelectionState;
  onRecreate: () => void;
  isRadar: boolean;
  isRecreating?: boolean;
  /** Show LLM curation option vs quick transform */
  showCurationOption?: boolean;
  onCurateWithLLM?: () => void;
  isCurating?: boolean;
}

type TabKey = 'findings' | 'perspectives' | 'analysis';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'findings', label: 'Findings', icon: '🔍' },
  { key: 'perspectives', label: 'Perspectives', icon: '👁' },
  { key: 'analysis', label: 'Analysis', icon: '📊' },
];

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
  const { availableItems, counts, sectionCounts, toggleItem, selectAll, deselectAll, toggleSection, getSections } = selectionState;

  // Check if any items have section assignments
  const hasSectionAssignments = useMemo(() => {
    return Object.values(selectionState.selection.sectionAssignments).some(s => s.length > 0);
  }, [selectionState.selection.sectionAssignments]);

  const handleTabClick = useCallback((key: TabKey) => {
    setActiveTab(prev => prev === key ? null : key);
  }, []);

  const getTypeColor = useCallback((type: string, isRadar: boolean) => {
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
    return colors[type]?.[isRadar ? 'radar' : 'swiss'] || (isRadar ? 'bg-slate-500/20 text-slate-300' : 'bg-stone-100 text-stone-700');
  }, []);

  const items = activeTab ? availableItems[activeTab] : [];
  const selectedIds = useMemo(() => {
    if (!activeTab) return new Set<string>();
    if (activeTab === 'findings') return new Set(selectionState.selection.selectedFindings);
    if (activeTab === 'perspectives') return new Set(selectionState.selection.selectedPerspectives);
    // Analysis combines all three
    return new Set([
      ...selectionState.selection.selectedContradictions,
      ...selectionState.selection.selectedGaps,
      ...selectionState.selection.selectedCausalChains,
    ]);
  }, [activeTab, selectionState.selection]);

  return (
    <div className={`rounded-xl overflow-hidden ${isRadar ? 'bg-slate-900/50 border border-slate-700/50' : 'bg-white border border-stone-200'}`}>
      {/* Tabs Row */}
      <div className={`flex items-center gap-1 p-2 ${isRadar ? 'bg-slate-800/50' : 'bg-stone-50'}`}>
        {TABS.map(tab => {
          const count = counts[tab.key];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${isActive
                  ? isRadar
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-stone-800 text-white'
                  : isRadar
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`
                px-1.5 py-0.5 rounded text-[10px] font-bold
                ${isRadar ? 'bg-slate-700 text-slate-300' : 'bg-stone-200 text-stone-600'}
              `}>
                {count.selected}/{count.total}
              </span>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Section counts indicator */}
        {hasSectionAssignments && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${isRadar ? 'bg-slate-700/50' : 'bg-stone-100'}`}>
            {VIDEO_SECTIONS.map(section => (
              <span
                key={section.key}
                className={`px-1 ${sectionCounts[section.key] > 0 ? (isRadar ? 'text-cyan-300' : 'text-stone-700') : (isRadar ? 'text-slate-500' : 'text-stone-400')}`}
                title={`${section.label}: ${sectionCounts[section.key]} items`}
              >
                {section.icon}{sectionCounts[section.key] > 0 && <span className="ml-0.5">{sectionCounts[section.key]}</span>}
              </span>
            ))}
          </div>
        )}

        {/* Re-create Buttons */}
        <div className="flex items-center gap-1">
          {/* Quick Re-create */}
          <button
            onClick={onRecreate}
            disabled={isRecreating || isCurating}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isRecreating || isCurating ? 'opacity-50 cursor-not-allowed' : ''}
              ${isRadar
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }
            `}
            title="Quick preview without LLM curation"
          >
            {isRecreating ? (
              <>
                <span className="animate-spin">↻</span>
                <span>Quick...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Quick</span>
              </>
            )}
          </button>

          {/* LLM Curate Button */}
          {showCurationOption && onCurateWithLLM && hasSectionAssignments && (
            <button
              onClick={onCurateWithLLM}
              disabled={isCurating || isRecreating}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${isCurating || isRecreating ? 'opacity-50 cursor-not-allowed' : ''}
                ${isRadar
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400'
                  : 'bg-stone-800 text-white hover:bg-stone-700'
                }
              `}
              title="Use AI to curate content for each video section"
            >
              {isCurating ? (
                <>
                  <span className="animate-spin">↻</span>
                  <span>Curating...</span>
                </>
              ) : (
                <>
                  <span>🧠</span>
                  <span>AI Curate</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Panel */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`p-2 border-t ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}`}>
              {/* Select All / Deselect All */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => selectAll(activeTab)}
                  className={`text-[10px] font-medium ${isRadar ? 'text-cyan-400 hover:text-cyan-300' : 'text-stone-600 hover:text-stone-800'}`}
                >
                  Select All
                </button>
                <span className={isRadar ? 'text-slate-600' : 'text-stone-300'}>|</span>
                <button
                  onClick={() => deselectAll(activeTab)}
                  className={`text-[10px] font-medium ${isRadar ? 'text-slate-400 hover:text-slate-300' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Deselect All
                </button>
              </div>

              {/* Scrollable List */}
              <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {items.length === 0 ? (
                  <div className={`text-center py-4 text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                    No items available
                  </div>
                ) : (
                  items.map(item => (
                    <SelectableRow
                      key={item.id}
                      item={item}
                      isSelected={selectedIds.has(item.id)}
                      onToggle={() => toggleItem(activeTab, item.id)}
                      assignedSections={getSections(item.id)}
                      onToggleSection={(section) => toggleSection(item.id, section)}
                      isRadar={isRadar}
                      typeColor={getTypeColor(item.type, isRadar)}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SelectableRowProps {
  item: SelectableItem;
  isSelected: boolean;
  onToggle: () => void;
  assignedSections: VideoSection[];
  onToggleSection: (section: VideoSection) => void;
  isRadar: boolean;
  typeColor: string;
}

function SelectableRow({
  item,
  isSelected,
  onToggle,
  assignedSections,
  onToggleSection,
  isRadar,
  typeColor,
}: SelectableRowProps) {
  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded-lg transition-all
        ${isRadar
          ? isSelected
            ? 'bg-cyan-500/10 border border-cyan-500/30'
            : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
          : isSelected
            ? 'bg-stone-100 border border-stone-300'
            : 'bg-white border border-stone-100 hover:bg-stone-50'
        }
      `}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onToggle}
        className={`
          w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all
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
        {isSelected && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs truncate ${isRadar ? 'text-slate-200' : 'text-stone-700'}`}>
          {item.content}
        </p>
      </div>

      {/* Confidence Badge */}
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

      {/* Type Badge */}
      <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${typeColor}`}>
        {item.type}
      </div>

      {/* Section Assignment Buttons */}
      {isSelected && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {VIDEO_SECTIONS.map(section => {
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
                  w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all
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
                {section.icon}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
