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
import { Filter, Layers, Network, Sparkles, UserCheck } from 'lucide-react';
import { Modal } from '../common/Modal';

interface IdentityGraphViewProps {
  initialNodes: IdentityGraphNode[];
  initialEdges: IdentityGraphEdge[];
}

export const IdentityGraphView: React.FC<IdentityGraphViewProps> = ({
  initialNodes,
  initialEdges,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<IdentityGraphNode | null>(null);

  // Convert raw domain nodes to React Flow Node objects
  const flowNodes: Node[] = useMemo(() => {
    return initialNodes
      .filter((n) => activeCategory === 'all' || n.category === activeCategory)
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
  }, [initialNodes, activeCategory]);

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
        labelBgStyle: { fill: '#141C31', stroke: '#24304A', strokeWidth: 1, rx: 4, ry: 4 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6C63FF',
        },
      }));
  }, [initialEdges, flowNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync state when filters change
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
    <div className="relative h-[720px] w-full rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="p-4 border-b border-border bg-sidebar/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary tracking-tight">Identity Intelligence Graph</h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">Multi-hop relationship correlation between targets, emails, hostnames, repos and credentials</p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1 text-xs">
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
              className={`px-3 py-1 rounded font-medium transition-all ${
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
          <Background color="#24304A" gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* Node Detail Modal */}
      {selectedNode && (
        <Modal
          isOpen={Boolean(selectedNode)}
          onClose={() => setSelectedNode(null)}
          title={`Entity: ${selectedNode.label}`}
          subtitle={`Node Type: ${selectedNode.type.toUpperCase()} • Category: ${selectedNode.category.toUpperCase()}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-text-primary uppercase font-mono">Correlation Confidence</span>
                <span className="font-mono font-bold text-primary text-base">
                  {Math.round(selectedNode.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-sidebar/70 p-4 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">Discovered Metadata</h5>
              <div className="divide-y divide-border/50 text-xs">
                {Object.entries(selectedNode.details).map(([key, val]) => (
                  <div key={key} className="py-2 flex justify-between">
                    <span className="text-text-muted font-medium">{key}</span>
                    <span className="font-mono text-text-primary font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
