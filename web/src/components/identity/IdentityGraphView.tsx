import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomIdentityNode } from './CustomNodes';
import { IdentityGraphNode, IdentityGraphEdge } from '../../types';
import { Network, Search, X, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface IdentityGraphViewProps {
  initialNodes: IdentityGraphNode[];
  initialEdges: IdentityGraphEdge[];
}

export const IdentityGraphView: React.FC<IdentityGraphViewProps> = ({
  initialNodes,
  initialEdges,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<IdentityGraphNode | null>(null);

  // Convert raw nodes to React Flow Node objects
  const flowNodes: Node[] = useMemo(() => {
    return initialNodes
      .filter((n) => {
        const matchesCat = activeCategory === 'all' || n.category === activeCategory;
        const matchesQuery = !searchQuery || 
          n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (n.sublabel && n.sublabel.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesQuery;
      })
      .map((n) => ({
        id: n.id,
        type: 'identityNode',
        position: { x: n.x || 100, y: n.y || 100 },
        data: {
          label: n.label,
          sublabel: n.sublabel,
          type: n.type,
          confidence: n.confidence,
          category: n.category,
        },
      }));
  }, [initialNodes, activeCategory, searchQuery]);

  const flowEdges: Edge[] = useMemo(() => {
    const visibleNodeIds = new Set(flowNodes.map((n) => n.id));
    return initialEdges
      .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated,
        style: { stroke: '#6C63FF', strokeWidth: 1.5 },
        labelStyle: { fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
        labelBgStyle: { fill: '#111A2B', stroke: '#22304A', strokeWidth: 1, rx: 4, ry: 4 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6C63FF',
        },
      }));
  }, [initialEdges, flowNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  React.useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ identityNode: CustomIdentityNode } as any), []);

  const handleNodeClick = (_: any, node: Node) => {
    const fullNode = initialNodes.find((n) => n.id === node.id);
    if (fullNode) {
      setSelectedNode(fullNode);
    }
  };

  return (
    <div className="relative h-[740px] w-full rounded-2xl border border-border bg-surface shadow-card overflow-hidden flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="p-4 border-b border-border bg-sidebar/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary tracking-tight">Identity Intelligence Graph</h3>
            <p className="text-xs text-text-muted mt-0.5">Multi-hop relationship correlation between targets, emails, hostnames, repos and credentials</p>
          </div>
        </div>

        {/* Search & Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter entities..."
              className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 text-xs">
            {[
              { id: 'all', label: 'All Vectors' },
              { id: 'identity', label: 'Identity' },
              { id: 'secrets', label: 'Secrets' },
              { id: 'infrastructure', label: 'Infrastructure' },
              { id: 'git', label: 'Git' },
              { id: 'metadata', label: 'Metadata' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeCategory === tab.id
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap zoomable pannable />
          <Background color="#22304A" gap={28} size={1} />
        </ReactFlow>

        {/* Right-Side Entity Evidence Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bottom-4 w-80 rounded-2xl border border-border bg-surface-elevated/95 p-5 shadow-card-elevated backdrop-blur-md z-20 flex flex-col justify-between animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-border/80 pb-3">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-primary/15 text-primary border border-primary/30">
                    {selectedNode.type}
                  </span>
                  <h4 className="text-sm font-bold text-text-primary mt-1.5">{selectedNode.label}</h4>
                  {selectedNode.sublabel && (
                    <p className="text-xs text-text-muted mt-0.5">{selectedNode.sublabel}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-center justify-between font-mono text-xs">
                <span className="text-text-secondary uppercase font-bold text-[11px]">Correlation Confidence</span>
                <span className="text-primary font-extrabold text-sm">
                  {Math.round(selectedNode.confidence * 100)}%
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-text-muted block">
                  Discovered Entity Metadata
                </span>
                <div className="rounded-xl border border-border bg-sidebar/80 divide-y divide-border/60 text-xs p-3">
                  {Object.entries(selectedNode.details).map(([k, v]) => (
                    <div key={k} className="py-1.5 flex justify-between gap-2">
                      <span className="text-text-muted">{k}:</span>
                      <span className="font-mono text-text-primary font-semibold truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 text-center">
              <span className="text-[11px] font-mono text-text-muted">Entity Graph Intelligence v0.6.0</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
