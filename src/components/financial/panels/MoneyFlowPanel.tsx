'use client';

import { useMemo } from 'react';
import { useFinancialStore } from '@/src/stores/financialStore';
import { TerminalCard } from '@/src/components/ui/card';
import { Sankey, Tooltip, ResponsiveContainer, Rectangle, Layer } from 'recharts';
import { cn } from '@/src/lib/utils';
import { DollarSign, ArrowRight, Users } from 'lucide-react';

export function MoneyFlowPanel() {
  const { session, moneyFlows, selectedEntityId, selectEntity } = useFinancialStore();

  if (!session) return null;

  const hasData = moneyFlows.nodes.length > 0 && moneyFlows.links.length > 0;

  return (
    <div className="h-full p-4 grid grid-cols-4 gap-4">
      {/* Main Sankey chart */}
      <div className="col-span-3 flex flex-col gap-4">
        <TerminalCard className="flex-1 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Money Flow Diagram</span>
          </div>
          <div className="flex-1 min-h-0">
            {hasData ? (
              <MoneyFlowSankey
                nodes={moneyFlows.nodes}
                links={moneyFlows.links}
                selectedEntity={selectedEntityId}
                onSelectEntity={selectEntity}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No money flow data available</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Financial perspective analysis may not have identified money flows
                  </p>
                </div>
              </div>
            )}
          </div>
        </TerminalCard>
      </div>

      {/* Entity list sidebar */}
      <div className="col-span-1 flex flex-col gap-4">
        <TerminalCard className="flex-1 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Entities</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {moneyFlows.nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => selectEntity(selectedEntityId === node.id ? null : node.id)}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded text-xs transition-colors',
                  selectedEntityId === node.id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'hover:bg-zinc-800 text-zinc-400'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{node.name}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded',
                      node.type === 'source' && 'bg-blue-500/20 text-blue-400',
                      node.type === 'intermediary' && 'bg-amber-500/20 text-amber-400',
                      node.type === 'destination' && 'bg-emerald-500/20 text-emerald-400'
                    )}
                  >
                    {node.type}
                  </span>
                </div>
              </button>
            ))}
            {moneyFlows.nodes.length === 0 && (
              <div className="text-xs text-zinc-600 text-center py-4">No entities found</div>
            )}
          </div>
        </TerminalCard>

        {/* Flow summary */}
        <TerminalCard className="p-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Flow Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Total Flows</span>
              <span className="text-zinc-300 font-mono">{moneyFlows.links.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Unique Entities</span>
              <span className="text-zinc-300 font-mono">{moneyFlows.nodes.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Sources</span>
              <span className="text-blue-400 font-mono">
                {moneyFlows.nodes.filter((n) => n.type === 'source').length}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Destinations</span>
              <span className="text-emerald-400 font-mono">
                {moneyFlows.nodes.filter((n) => n.type === 'destination').length}
              </span>
            </div>
          </div>
        </TerminalCard>
      </div>
    </div>
  );
}

interface MoneyFlowSankeyProps {
  nodes: { id: string; name: string; type: string }[];
  links: { source: string; target: string; value: number; description?: string }[];
  selectedEntity: string | null;
  onSelectEntity: (id: string | null) => void;
}

function MoneyFlowSankey({ nodes, links, selectedEntity, onSelectEntity }: MoneyFlowSankeyProps) {
  // Transform data for Recharts Sankey
  const sankeyData = useMemo(() => {
    const nodeMap = new Map(nodes.map((n, i) => [n.id, i]));

    const transformedNodes = nodes.map((n) => ({
      name: n.name,
    }));

    const transformedLinks = links
      .map((l) => ({
        source: nodeMap.get(l.source),
        target: nodeMap.get(l.target),
        value: l.value || 1,
        description: l.description,
      }))
      .filter((l): l is { source: number; target: number; value: number; description: string | undefined } =>
        l.source !== undefined && l.target !== undefined
      );

    return {
      nodes: transformedNodes,
      links: transformedLinks,
    };
  }, [nodes, links]);

  if (sankeyData.nodes.length < 2 || sankeyData.links.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        Insufficient data for flow visualization
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Sankey
        data={sankeyData}
        nodeWidth={10}
        nodePadding={24}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        link={{ stroke: '#27272a', strokeOpacity: 0.5 }}
        node={<SankeyNode />}
      >
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '4px',
            fontSize: '11px',
          }}
        />
      </Sankey>
    </ResponsiveContainer>
  );
}

function SankeyNode(props: any) {
  const { x, y, width, height, index, payload } = props;

  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#10b981"
        fillOpacity={0.8}
        rx={2}
      />
      <text
        x={x + width + 6}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        className="fill-zinc-400 text-[10px]"
      >
        {payload?.name}
      </text>
    </g>
  );
}
