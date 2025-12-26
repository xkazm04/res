'use client';

import { useMemo } from 'react';
import { useResearchStore, SWOTItem } from '@/src/stores/researchStore';
import { ConsultingCard } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';
import { Plus, Trash2, ChevronUp, ChevronDown, Shield, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export function SWOTPanel() {
  const { swotItems, addSWOTItem, updateSWOTItem, removeSWOTItem } = useResearchStore();

  const groupedItems = useMemo(() => ({
    strength: swotItems.filter((i) => i.category === 'strength'),
    weakness: swotItems.filter((i) => i.category === 'weakness'),
    opportunity: swotItems.filter((i) => i.category === 'opportunity'),
    threat: swotItems.filter((i) => i.category === 'threat'),
  }), [swotItems]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">SWOT Analysis</h2>
        <p className="text-sm text-slate-500 mt-1">
          Strategic analysis of strengths, weaknesses, opportunities, and threats
        </p>
      </div>

      {/* SWOT Grid */}
      <div className="grid grid-cols-2 gap-6">
        <SWOTQuadrant
          category="strength"
          title="Strengths"
          subtitle="Internal positive factors"
          icon={Shield}
          color="emerald"
          items={groupedItems.strength}
          onUpdateItem={updateSWOTItem}
          onRemoveItem={removeSWOTItem}
        />
        <SWOTQuadrant
          category="weakness"
          title="Weaknesses"
          subtitle="Internal negative factors"
          icon={AlertTriangle}
          color="red"
          items={groupedItems.weakness}
          onUpdateItem={updateSWOTItem}
          onRemoveItem={removeSWOTItem}
        />
        <SWOTQuadrant
          category="opportunity"
          title="Opportunities"
          subtitle="External positive factors"
          icon={TrendingUp}
          color="blue"
          items={groupedItems.opportunity}
          onUpdateItem={updateSWOTItem}
          onRemoveItem={removeSWOTItem}
        />
        <SWOTQuadrant
          category="threat"
          title="Threats"
          subtitle="External negative factors"
          icon={TrendingDown}
          color="amber"
          items={groupedItems.threat}
          onUpdateItem={updateSWOTItem}
          onRemoveItem={removeSWOTItem}
        />
      </div>

      {/* SWOT Summary Stats */}
      <ConsultingCard className="p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-4 gap-6">
          <SWOTStat
            label="Total Factors"
            value={swotItems.length}
            color="slate"
          />
          <SWOTStat
            label="High Priority"
            value={swotItems.filter((i) => i.priority === 'high').length}
            color="red"
          />
          <SWOTStat
            label="Internal (S+W)"
            value={groupedItems.strength.length + groupedItems.weakness.length}
            color="purple"
          />
          <SWOTStat
            label="External (O+T)"
            value={groupedItems.opportunity.length + groupedItems.threat.length}
            color="blue"
          />
        </div>
      </ConsultingCard>
    </div>
  );
}

interface SWOTQuadrantProps {
  category: SWOTItem['category'];
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'emerald' | 'red' | 'blue' | 'amber';
  items: SWOTItem[];
  onUpdateItem: (id: string, updates: Partial<SWOTItem>) => void;
  onRemoveItem: (id: string) => void;
}

function SWOTQuadrant({
  category,
  title,
  subtitle,
  icon: Icon,
  color,
  items,
  onUpdateItem,
  onRemoveItem,
}: SWOTQuadrantProps) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={cn('rounded-xl border p-4', classes.bg, classes.border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', classes.icon)} />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 text-sm font-medium rounded', classes.badge)}>
          {items.length}
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {items.map((item) => (
          <SWOTItemCard
            key={item.id}
            item={item}
            onUpdateItem={onUpdateItem}
            onRemoveItem={onRemoveItem}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            No {title.toLowerCase()} identified
          </p>
        )}
      </div>
    </div>
  );
}

function SWOTItemCard({
  item,
  onUpdateItem,
  onRemoveItem,
}: {
  item: SWOTItem;
  onUpdateItem: (id: string, updates: Partial<SWOTItem>) => void;
  onRemoveItem: (id: string) => void;
}) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };

  const cyclePriority = () => {
    const priorities: SWOTItem['priority'][] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(item.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    onUpdateItem(item.id, { priority: nextPriority });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{item.content}</p>
        <button
          onClick={() => onRemoveItem(item.id)}
          className="p-1 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={cyclePriority}
          className={cn('px-2 py-0.5 text-[10px] rounded uppercase font-medium', priorityColors[item.priority])}
        >
          {item.priority}
        </button>
        {item.findingId && (
          <span className="text-[10px] text-slate-400">Linked to finding</span>
        )}
      </div>
    </div>
  );
}

function SWOTStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'slate' | 'red' | 'purple' | 'blue';
}) {
  const colorClasses = {
    slate: 'text-slate-900 dark:text-white',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="text-center">
      <p className={cn('text-3xl font-bold', colorClasses[color])}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
