'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KnowledgeEntity } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { useFocusSafe } from '../core/FocusContext';
import { AnimatedNumber } from '../core/AnimatedNumber';
import { EntityConstellation } from '../visualizations/EntityConstellation';
import { ViewHeader } from '../shared/ViewHeader';
import { ViewModeToggle, type ViewModeOption } from '../shared/ViewModeToggle';
import { EmptyState } from '../shared/EmptyState';
import { FilterChip } from '../shared/FilterChip';
import { CollapsibleSection, SectionGroup } from '../shared/CollapsibleSection';
import { entityTypeConfig, getEntityConfig, type EntityType } from '../shared/typeConfig';

interface EntitiesViewProps {
  entities: KnowledgeEntity[];
  initialSelectedId?: string | null;
}

type ViewMode = 'constellation' | 'cards';

const viewModeOptions: ViewModeOption<ViewMode>[] = [
  { value: 'constellation', label: 'Constellation' },
  { value: 'cards', label: 'Cards' },
];

// Stagger animation variants - calculated once at parent level
const listContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function EntitiesView({ entities, initialSelectedId }: EntitiesViewProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const focusCtx = useFocusSafe();
  const [viewMode, setViewMode] = useState<ViewMode>('constellation');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(initialSelectedId || null);
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');

  // Sync selection when navigating from another view
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedEntity(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Handle selecting an entity and updating global focus
  const handleSelectEntity = useCallback((id: string | null) => {
    setSelectedEntity(id);

    // Update global focus context if available
    if (focusCtx && id) {
      focusCtx.focusEntity(id);
    } else if (focusCtx && !id) {
      focusCtx.clearFocus();
    }
  }, [focusCtx]);

  const grouped = useMemo(() => {
    const groups: Record<EntityType, KnowledgeEntity[]> = {
      person: [], organization: [], location: [], event: [], other: [],
    };
    entities.forEach(e => {
      const type = (e.entity_type?.toLowerCase() || 'other') as EntityType;
      (groups[type] || groups.other).push(e);
    });
    return groups;
  }, [entities]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return entities;
    return grouped[filterType];
  }, [entities, grouped, filterType]);

  const selectedData = selectedEntity ? entities.find(e => e.id === selectedEntity) : null;

  if (entities.length === 0) {
    return (
      <EmptyState
        type="users"
        title="No entities extracted"
        description="The research hasn't identified any people, organizations, or locations yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ViewHeader
        title="Entities"
        count={entities.length}
        persona="network"
        actions={<ViewModeToggle options={viewModeOptions} value={viewMode} onChange={setViewMode} />}
      />

      {/* Type filters */}
      <div className="flex gap-2">
        <FilterChip label="All" count={entities.length} active={filterType === 'all'} onClick={() => setFilterType('all')} />
        {(['person', 'organization', 'location', 'event'] as EntityType[]).map(type => (
          <FilterChip
            key={type}
            label={entityTypeConfig[type].icon}
            count={grouped[type].length}
            active={filterType === type}
            onClick={() => setFilterType(type)}
          />
        ))}
      </div>

      {/* Constellation view */}
      {viewMode === 'constellation' && (
        <CollapsibleSection
          sectionId="entities-constellation"
          title="Entity Network"
          subtitle="Visual representation of entity relationships"
          icon="🌐"
          count={filtered.length}
          variant="card"
        >
          <EntityConstellation
            entities={filtered}
            selectedEntity={selectedEntity || undefined}
            onEntitySelect={handleSelectEntity}
          />
        </CollapsibleSection>
      )}

      {/* Cards view */}
      {viewMode === 'cards' && (
        <SectionGroup>
          {(['person', 'organization', 'location', 'event'] as EntityType[]).map(type => {
            const list = filterType === 'all' ? grouped[type] : (filterType === type ? grouped[type] : []);
            if (list.length === 0) return null;
            const config = entityTypeConfig[type];

            return (
              <CollapsibleSection
                key={type}
                sectionId={`entities-${type}`}
                title={`${type.charAt(0).toUpperCase() + type.slice(1)}s`}
                icon={config.icon}
                count={list.length}
                variant="card"
              >
                <EntityTypeList
                  type={type}
                  entities={list}
                  selectedEntity={selectedEntity}
                  onSelect={handleSelectEntity}
                />
              </CollapsibleSection>
            );
          })}
        </SectionGroup>
      )}

      {/* Selected entity detail */}
      <AnimatePresence>
        {selectedData && (
          <EntityDetail entity={selectedData} onClose={() => handleSelectEntity(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function EntityTypeList({ type, entities, selectedEntity, onSelect }: {
  type: EntityType;
  entities: KnowledgeEntity[];
  selectedEntity: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {entities.slice(0, 20).map((e) => (
        <motion.button
          key={e.id}
          variants={listItemVariants}
          onClick={() => onSelect(selectedEntity === e.id ? null : e.id)}
          data-testid={`entity-item-${e.id}`}
          className={`w-full text-left p-3 rounded-lg text-xs transition-all ${
            selectedEntity === e.id
              ? isRadar ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-stone-800 text-white'
              : isRadar ? 'text-slate-300 hover:bg-slate-800/50 bg-slate-800/30' : 'text-stone-700 hover:bg-stone-100 bg-stone-50'
          }`}
        >
          <div className="font-medium truncate">{e.canonical_name}</div>
          {e.mention_count && (
            <div className={`text-[10px] mt-1 ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
              {e.mention_count} mentions
            </div>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}

function EntityDetail({ entity, onClose }: { entity: KnowledgeEntity; onClose: () => void }) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const config = getEntityConfig(entity.entity_type || 'other');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`p-4 rounded-xl ${isRadar ? 'bg-slate-900/80 border border-cyan-500/20' : 'bg-white border border-stone-200 shadow-lg'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`font-semibold ${styles.text}`}>{entity.canonical_name}</h3>
            <p className={`text-xs ${styles.textMuted}`}>{entity.mention_count || 0} mentions</p>
          </div>
        </div>
        <button onClick={onClose} className={`p-1 rounded ${isRadar ? 'hover:bg-slate-800' : 'hover:bg-stone-100'}`}>
          <svg className={`w-5 h-5 ${styles.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {entity.description && <p className={`text-sm mb-3 ${styles.text}`}>{entity.description}</p>}

      {entity.aliases && entity.aliases.length > 0 && (
        <div className={`p-3 rounded-lg ${isRadar ? 'bg-slate-800/50' : 'bg-stone-50'}`}>
          <div className={`text-[10px] uppercase tracking-wider mb-2 ${styles.textMuted}`}>Also known as</div>
          <div className="flex flex-wrap gap-1">
            {entity.aliases.map((alias, i) => (
              <span key={i} className={`px-2 py-1 rounded text-xs ${isRadar ? 'bg-slate-700 text-slate-300' : 'bg-stone-200 text-stone-700'}`}>
                {alias}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
