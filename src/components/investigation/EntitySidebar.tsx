'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { useInvestigationStore } from '@/src/stores/investigationStore';
import { EntityTypeIcon, Search, ChevronRight, ChevronDown, User, Building2, MapPin } from '@/src/components/ui/icons';
import type { ResearchFinding } from '@/src/types/research';

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

interface EntitySidebarProps {
  findings: ResearchFinding[];
  className?: string;
}

interface ExtractedEntity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'other';
  mentions: number;
  findingIds: string[];
}

export function EntitySidebar({ findings, className }: EntitySidebarProps) {
  const { selectedEntityId, selectEntity, selectFinding } = useInvestigationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['person', 'organization', 'location']));

  // Extract entities from findings
  const entities = useMemo(() => {
    const entityMap = new Map<string, ExtractedEntity>();

    findings.forEach((finding) => {
      // Look for actors in finding type
      if (finding.finding_type === 'actor') {
        const name = finding.summary || finding.content.split('.')[0];
        const key = name.toLowerCase().trim();
        const existing = entityMap.get(key);
        if (existing) {
          existing.mentions++;
          existing.findingIds.push(finding.id);
        } else {
          entityMap.set(key, {
            name: name.trim(),
            type: 'person',
            mentions: 1,
            findingIds: [finding.id],
          });
        }
      }

      // Extract from extracted_data if available
      if (finding.extracted_data) {
        const data = finding.extracted_data as Record<string, unknown>;
        if (data.actors && Array.isArray(data.actors)) {
          (data.actors as string[]).forEach((actor) => {
            const key = actor.toLowerCase().trim();
            const existing = entityMap.get(key);
            if (existing) {
              existing.mentions++;
              if (!existing.findingIds.includes(finding.id)) {
                existing.findingIds.push(finding.id);
              }
            } else {
              entityMap.set(key, {
                name: actor.trim(),
                type: 'person',
                mentions: 1,
                findingIds: [finding.id],
              });
            }
          });
        }
        if (data.organizations && Array.isArray(data.organizations)) {
          (data.organizations as string[]).forEach((org) => {
            const key = org.toLowerCase().trim();
            const existing = entityMap.get(key);
            if (existing) {
              existing.mentions++;
              if (!existing.findingIds.includes(finding.id)) {
                existing.findingIds.push(finding.id);
              }
            } else {
              entityMap.set(key, {
                name: org.trim(),
                type: 'organization',
                mentions: 1,
                findingIds: [finding.id],
              });
            }
          });
        }
        if (data.locations && Array.isArray(data.locations)) {
          (data.locations as string[]).forEach((loc) => {
            const key = loc.toLowerCase().trim();
            const existing = entityMap.get(key);
            if (existing) {
              existing.mentions++;
              if (!existing.findingIds.includes(finding.id)) {
                existing.findingIds.push(finding.id);
              }
            } else {
              entityMap.set(key, {
                name: loc.trim(),
                type: 'location',
                mentions: 1,
                findingIds: [finding.id],
              });
            }
          });
        }
      }
    });

    return Array.from(entityMap.values()).sort((a, b) => b.mentions - a.mentions);
  }, [findings]);

  // Group by type
  const groupedEntities = useMemo(() => {
    const groups: Record<string, ExtractedEntity[]> = {
      person: [],
      organization: [],
      location: [],
      other: [],
    };

    entities
      .filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach((entity) => {
        groups[entity.type].push(entity);
      });

    return groups;
  }, [entities, searchQuery]);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    person: { label: 'PEOPLE', icon: <User className="w-4 h-4" /> },
    organization: { label: 'ORGANIZATIONS', icon: <Building2 className="w-4 h-4" /> },
    location: { label: 'LOCATIONS', icon: <MapPin className="w-4 h-4" /> },
    other: { label: 'OTHER', icon: <EntityTypeIcon type="concept" className="w-4 h-4" /> },
  };

  return (
    <aside
      className={cn('bg-white flex flex-col', className)}
      style={{
        borderRight: BRUTALIST.border,
        fontFamily: BRUTALIST.font,
      }}
    >
      {/* Header */}
      <div
        className="p-3 bg-black text-white"
      >
        <h2 className="text-sm font-bold uppercase tracking-widest mb-2">Entities</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="SEARCH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-white text-black uppercase tracking-widest placeholder:text-gray-400 focus:outline-none"
            style={{ border: BRUTALIST.borderLight }}
          />
        </div>
      </div>

      {/* Entity list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedEntities).map(([type, typeEntities]) => {
          if (typeEntities.length === 0) return null;
          const { label, icon } = typeLabels[type];
          const isExpanded = expandedTypes.has(type);

          return (
            <div key={type} style={{ borderBottom: BRUTALIST.borderLight }}>
              {/* Type header */}
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {icon}
                <span className="text-xs font-bold uppercase tracking-widest flex-1 text-left">{label}</span>
                <span
                  className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5"
                >
                  {typeEntities.length}
                </span>
              </button>

              {/* Entity items */}
              {isExpanded && (
                <div className="bg-white">
                  {typeEntities.slice(0, 20).map((entity) => (
                    <EntityItem
                      key={entity.name}
                      entity={entity}
                      isSelected={selectedEntityId === entity.name}
                      onSelect={() => selectEntity(entity.name)}
                      onFindingClick={(id) => {
                        selectFinding(id);
                        selectEntity(null);
                      }}
                    />
                  ))}
                  {typeEntities.length > 20 && (
                    <div className="px-3 py-1 text-[10px] text-gray-500 font-bold uppercase">
                      +{typeEntities.length - 20} MORE
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div
        className="p-3 bg-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-600"
        style={{ borderTop: BRUTALIST.borderLight }}
      >
        {entities.length} ENTITIES / {findings.length} FINDINGS
      </div>
    </aside>
  );
}

interface EntityItemProps {
  entity: ExtractedEntity;
  isSelected: boolean;
  onSelect: () => void;
  onFindingClick: (id: string) => void;
}

function EntityItem({ entity, isSelected, onSelect, onFindingClick }: EntityItemProps) {
  const [showFindings, setShowFindings] = useState(false);

  return (
    <div
      className={cn(
        'px-3',
        isSelected && 'bg-gray-100'
      )}
      style={{ borderBottom: '1px solid black' }}
    >
      <button
        onClick={() => {
          onSelect();
          setShowFindings(!showFindings);
        }}
        className="w-full flex items-center gap-2 py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <EntityTypeIcon type={entity.type} className="w-3 h-3 shrink-0" />
        <span className="text-xs truncate flex-1">{entity.name}</span>
        <span
          className="text-[10px] font-bold bg-gray-200 px-1.5 py-0.5"
          style={{ border: '1px solid black' }}
        >
          {entity.mentions}
        </span>
      </button>

      {/* Linked findings */}
      {showFindings && entity.findingIds.length > 0 && (
        <div className="pl-5 pb-2 space-y-1">
          {entity.findingIds.slice(0, 5).map((id) => (
            <button
              key={id}
              onClick={() => onFindingClick(id)}
              className="block w-full text-left text-[10px] text-gray-600 hover:text-black hover:underline truncate"
            >
              → FINDING {id.slice(0, 8)}...
            </button>
          ))}
          {entity.findingIds.length > 5 && (
            <span className="text-[10px] text-gray-400 font-bold">
              +{entity.findingIds.length - 5} MORE
            </span>
          )}
        </div>
      )}
    </div>
  );
}
