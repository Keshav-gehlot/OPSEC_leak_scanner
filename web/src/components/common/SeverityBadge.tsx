import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ 
  severity, 
  className = '',
  size = 'md'
}) => {
  const styles = {
    CRITICAL: 'bg-critical-muted text-critical border-critical/40 shadow-glow-critical/20',
    HIGH: 'bg-high-muted text-high border-high/40',
    MEDIUM: 'bg-medium-muted text-medium border-medium/40',
    LOW: 'bg-low-muted text-low border-low/40',
  }[severity];

  const dotColor = {
    CRITICAL: 'bg-critical',
    HIGH: 'bg-high',
    MEDIUM: 'bg-medium',
    LOW: 'bg-low',
  }[severity];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border tracking-wider uppercase font-mono ${styles} ${sizeClasses} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor}`} />
      {severity}
    </span>
  );
};
