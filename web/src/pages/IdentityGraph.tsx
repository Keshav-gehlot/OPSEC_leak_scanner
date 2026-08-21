import React from 'react';
import { IdentityGraphNode, IdentityGraphEdge } from '../types';
import { IdentityGraphView } from '../components/identity/IdentityGraphView';
import { Network, Sparkles, UserCheck } from 'lucide-react';

interface IdentityGraphProps {
  nodes: IdentityGraphNode[];
  edges: IdentityGraphEdge[];
}

export const IdentityGraph: React.FC<IdentityGraphProps> = ({ nodes, edges }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Identity Intelligence Graph
            </h1>
            <span className="rounded-full bg-secondary/15 border border-secondary/30 px-3 py-1 text-xs font-mono font-bold text-secondary">
              CORRELATION ENGINE
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1.5 max-w-3xl">
            Multi-node entity relationship graph mapping real target identities against leaked credentials, hostnames, repositories, commit signatures, and GPS coordinates.
          </p>
        </div>
      </div>

      {/* Graph Visualizer */}
      <IdentityGraphView initialNodes={nodes} initialEdges={edges} />
    </div>
  );
};
