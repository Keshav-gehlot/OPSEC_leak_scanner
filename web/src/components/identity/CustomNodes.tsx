import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  User, 
  Mail, 
  Code2, 
  Server, 
  FolderGit2, 
  GitCommit, 
  FileCode,
  KeyRound, 
  MapPin, 
  Globe2 
} from 'lucide-react';
import { IdentityNodeType } from '../../types';

interface NodeData {
  label: string;
  sublabel?: string;
  type: IdentityNodeType;
  confidence: number;
  category: string;
}

export const CustomIdentityNode: React.FC<any> = memo(({ data, selected }: any) => {
  const { label, sublabel, type, confidence } = data as NodeData;

  const iconMap: Record<IdentityNodeType, React.ElementType> = {
    target: User,
    email: Mail,
    username: User,
    github: Code2,
    hostname: Server,
    repo: FolderGit2,
    commit: GitCommit,
    file: FileCode,
    secret: KeyRound,
    gps: MapPin,
    domain: Globe2,
  };

  const Icon = iconMap[type] || Globe2;

  const styleMap: Record<IdentityNodeType, { border: string; bg: string; text: string; iconBg: string }> = {
    target: {
      border: 'border-primary shadow-glow-primary',
      bg: 'bg-surface-elevated/95',
      text: 'text-primary font-bold',
      iconBg: 'bg-primary/20 text-primary',
    },
    email: {
      border: 'border-secondary/50',
      bg: 'bg-surface/95',
      text: 'text-text-primary',
      iconBg: 'bg-secondary/20 text-secondary',
    },
    username: {
      border: 'border-secondary/50',
      bg: 'bg-surface/95',
      text: 'text-text-primary',
      iconBg: 'bg-secondary/20 text-secondary',
    },
    github: {
      border: 'border-purple-500/50',
      bg: 'bg-surface/95',
      text: 'text-text-primary',
      iconBg: 'bg-purple-500/20 text-purple-400',
    },
    hostname: {
      border: 'border-high/50',
      bg: 'bg-surface/95',
      text: 'text-text-primary',
      iconBg: 'bg-high/20 text-high',
    },
    repo: {
      border: 'border-secondary/60',
      bg: 'bg-surface/95',
      text: 'text-secondary font-semibold',
      iconBg: 'bg-secondary/20 text-secondary',
    },
    commit: {
      border: 'border-border',
      bg: 'bg-sidebar/90',
      text: 'text-text-secondary',
      iconBg: 'bg-sidebar text-text-muted',
    },
    file: {
      border: 'border-border',
      bg: 'bg-surface/95',
      text: 'text-text-primary',
      iconBg: 'bg-surface text-text-secondary',
    },
    secret: {
      border: 'border-critical shadow-glow-critical/50',
      bg: 'bg-critical/10',
      text: 'text-critical font-bold',
      iconBg: 'bg-critical/20 text-critical',
    },
    gps: {
      border: 'border-medium/60',
      bg: 'bg-surface/95',
      text: 'text-medium font-medium',
      iconBg: 'bg-medium/20 text-medium',
    },
    domain: {
      border: 'border-blue-500/50',
      bg: 'bg-surface/95',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/20 text-blue-400',
    },
  };

  const style = styleMap[type] || styleMap.target;

  return (
    <div
      className={`min-w-[190px] max-w-[250px] rounded-2xl border p-3.5 shadow-card backdrop-blur-md transition-all duration-200 ${
        style.bg
      } ${style.border} ${selected ? 'ring-2 ring-primary scale-105' : 'hover:scale-[1.02]'}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-border !border-primary !w-2.5 !h-2.5" />

      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl p-1.5 ${style.iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs truncate ${style.text}`}>{label}</p>
          {sublabel && <p className="text-[10px] text-text-muted truncate">{sublabel}</p>}
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-mono">
        <span className="text-text-muted uppercase">{type}</span>
        <span className="text-secondary font-bold">{Math.round(confidence * 100)}% conf</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border !border-secondary !w-2.5 !h-2.5" />
    </div>
  );
});
