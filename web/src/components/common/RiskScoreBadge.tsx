import React from 'react';

interface RiskScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({ 
  score, 
  maxScore = 10,
  size = 'md',
  showLabel = false 
}) => {
  let color = 'text-low border-low/30 bg-low/10';
  if (score >= 9.0) {
    color = 'text-critical border-critical/40 bg-critical/15';
  } else if (score >= 6.5) {
    color = 'text-high border-high/40 bg-high/15';
  } else if (score >= 4.0) {
    color = 'text-medium border-medium/40 bg-medium/15';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-sm px-2.5 py-1 font-semibold',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md border font-mono ${color} ${sizeClasses}`}>
      {showLabel && <span className="text-text-secondary text-xs uppercase">Risk</span>}
      <span>{score.toFixed(1)}</span>
      <span className="text-text-muted text-xs">/{maxScore}</span>
    </div>
  );
};
