'use client';

import { useMemo } from 'react';
import type { KnowledgeEntity } from '@/src/types/research';
import { ThemedSection } from '../ThemedCards';
import { EmptyState } from '../shared/EmptyState';
import { PersonIcon, GridIcon, TargetIcon, ClockIcon } from '../shared/Icons';
import { UniversalCard } from '../shared/UniversalCard';
import { useThemedColors } from '../shared/themeColors';

interface EntitiesTabProps {
  entities: KnowledgeEntity[];
}

type EntityType = 'person' | 'organization' | 'location' | 'event' | 'other';

export function EntitiesTab({ entities }: EntitiesTabProps) {
  // Group entities by type
  const grouped = useMemo(() => {
    const groups: Record<EntityType, KnowledgeEntity[]> = {
      person: [],
      organization: [],
      location: [],
      event: [],
      other: [],
    };

    entities.forEach((entity) => {
      const type = (entity.entity_type?.toLowerCase() || 'other') as EntityType;
      if (groups[type]) {
        groups[type].push(entity);
      } else {
        groups.other.push(entity);
      }
    });

    return groups;
  }, [entities]);

  if (entities.length === 0) {
    return <EmptyState type="users" title="No entities extracted" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <EntityTypeCard type="person" count={grouped.person.length} />
        <EntityTypeCard type="organization" count={grouped.organization.length} />
        <EntityTypeCard type="location" count={grouped.location.length} />
        <EntityTypeCard type="event" count={grouped.event.length} />
      </div>

      {/* People */}
      {grouped.person.length > 0 && (
        <ThemedSection title="People" count={grouped.person.length} collapsible defaultExpanded>
          <EntityList entities={grouped.person} />
        </ThemedSection>
      )}

      {/* Organizations */}
      {grouped.organization.length > 0 && (
        <ThemedSection title="Organizations" count={grouped.organization.length} collapsible defaultExpanded>
          <EntityList entities={grouped.organization} />
        </ThemedSection>
      )}

      {/* Locations */}
      {grouped.location.length > 0 && (
        <ThemedSection title="Locations" count={grouped.location.length} collapsible>
          <EntityList entities={grouped.location} />
        </ThemedSection>
      )}

      {/* Events */}
      {grouped.event.length > 0 && (
        <ThemedSection title="Events" count={grouped.event.length} collapsible>
          <EntityList entities={grouped.event} />
        </ThemedSection>
      )}

      {/* Other */}
      {grouped.other.length > 0 && (
        <ThemedSection title="Other Entities" count={grouped.other.length} collapsible>
          <EntityList entities={grouped.other} />
        </ThemedSection>
      )}
    </div>
  );
}

function EntityTypeCard({ type, count }: { type: EntityType; count: number }) {
  const config = {
    person: { icon: <PersonIcon />, color: 'bg-rose-50 border-rose-200 text-rose-600' },
    organization: { icon: <GridIcon />, color: 'bg-blue-50 border-blue-200 text-blue-600' },
    location: { icon: <TargetIcon />, color: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
    event: { icon: <ClockIcon />, color: 'bg-amber-50 border-amber-200 text-amber-600' },
    other: { icon: <GridIcon />, color: 'bg-slate-50 border-slate-200 text-slate-600' },
  };

  const { icon, color } = config[type];

  return (
    <div className={`p-3 rounded-lg border ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-4 h-4">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-70">{type}s</span>
      </div>
      <div className="text-xl font-bold">{count}</div>
    </div>
  );
}

function EntityList({ entities }: { entities: KnowledgeEntity[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {entities.map((entity) => (
        <EntityCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
}

function EntityCard({ entity }: { entity: KnowledgeEntity }) {
  const mentionCount = entity.mention_count || 0;
  const aliases = entity.aliases || [];
  const { isRadar } = useThemedColors();

  return (
    <UniversalCard
      disableExpand
      showChevron={false}
      header={
        <div>
          <h4 className={`font-medium text-sm ${isRadar ? 'text-slate-200' : 'text-slate-800'}`}>
            {entity.canonical_name}
          </h4>
          {aliases.length > 0 && (
            <p className={`text-[10px] mt-0.5 ${isRadar ? 'text-slate-500' : 'text-slate-500'}`}>
              aka: {aliases.slice(0, 3).join(', ')}
              {aliases.length > 3 && ` +${aliases.length - 3}`}
            </p>
          )}
        </div>
      }
      actions={
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isRadar ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
          {mentionCount} mention{mentionCount !== 1 ? 's' : ''}
        </span>
      }
      footer={
        entity.description ? (
          <p className={`text-xs line-clamp-2 ${isRadar ? 'text-slate-400' : 'text-slate-600'}`}>
            {entity.description}
          </p>
        ) : undefined
      }
    />
  );
}
