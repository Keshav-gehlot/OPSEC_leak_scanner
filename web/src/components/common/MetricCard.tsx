import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    isPositive?: boolean; // whether "up" is good or bad
  };
  severityColor?: 'critical' | 'high' | 'medium' | 'low' | 'primary' | 'secondary';
  subtext?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  severityColor = 'primary',
  subtext,
  onClick,
}) => {
  const colorMap = {
    critical: 'text-critical border-critical/30 bg-critical/10 hover:border-critical/60',
    high: 'text-high border-high/30 bg-high/10 hover:border-high/60',
    medium: 'text-medium border-medium/30 bg-medium/10 hover:border-medium/60',
    low: 'text-low border-low/30 bg-low/10 hover:border-low/60',
    primary: 'text-primary border-primary/30 bg-primary/10 hover:border-primary/60',
    secondary: 'text-secondary border-secondary/30 bg-secondary/10 hover:border-secondary/60',
  };

  const iconColor = {
    critical: 'text-critical bg-critical/15 border-critical/30',
    high: 'text-high bg-high/15 border-high/30',
    medium: 'text-medium bg-medium/15 border-medium/30',
    low: 'text-low bg-low/15 border-low/30',
    primary: 'text-primary bg-primary/15 border-primary/30',
    secondary: 'text-secondary bg-secondary/15 border-secondary/30',
  }[severityColor];

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:bg-card-hover ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</p>
          <h3 className="mt-2 text-3xl font-bold font-mono tracking-tight text-text-primary">{value}</h3>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {trend && (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              trend.direction === 'neutral'
                ? 'text-text-muted'
                : trend.isPositive
                ? 'text-low'
                : 'text-critical'
            }`}
          >
            {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            {trend.direction === 'neutral' && <Minus className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
        )}
        {subtext && <span className="text-text-muted">{subtext}</span>}
      </div>
    </div>
  );
};
