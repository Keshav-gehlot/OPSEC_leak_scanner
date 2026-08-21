import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    isPositive?: boolean; // Positive for security (e.g., risk down is good)
  };
  severityColor?: 'critical' | 'high' | 'medium' | 'low' | 'primary' | 'secondary';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  severityColor = 'primary',
  onClick,
}) => {
  const colorStyles = {
    critical: {
      border: 'border-critical/30 hover:border-critical/60',
      iconBg: 'bg-critical/15 text-critical',
      glow: 'hover:shadow-glow-critical',
      accent: 'text-critical',
    },
    high: {
      border: 'border-high/30 hover:border-high/60',
      iconBg: 'bg-high/15 text-high',
      glow: 'hover:shadow-card-elevated',
      accent: 'text-high',
    },
    medium: {
      border: 'border-medium/30 hover:border-medium/60',
      iconBg: 'bg-medium/15 text-medium',
      glow: 'hover:shadow-card-elevated',
      accent: 'text-medium',
    },
    low: {
      border: 'border-low/30 hover:border-low/60',
      iconBg: 'bg-low/15 text-low',
      glow: 'hover:shadow-card-elevated',
      accent: 'text-low',
    },
    primary: {
      border: 'border-primary/30 hover:border-primary/60',
      iconBg: 'bg-primary/15 text-primary',
      glow: 'hover:shadow-glow-primary',
      accent: 'text-primary',
    },
    secondary: {
      border: 'border-secondary/30 hover:border-secondary/60',
      iconBg: 'bg-secondary/15 text-secondary',
      glow: 'hover:shadow-card-elevated',
      accent: 'text-secondary',
    },
  }[severityColor];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-surface p-5 shadow-card transition-all duration-200 ${
        colorStyles.border
      } ${colorStyles.glow} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-surface-elevated' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <div className={`rounded-xl p-2.5 ${colorStyles.iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold font-mono tracking-tight text-text-primary">
          {value}
        </span>
      </div>

      {trend && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {trend.direction === 'up' && (
            <TrendingUp
              className={`h-3.5 w-3.5 ${
                trend.isPositive ? 'text-low' : 'text-critical'
              }`}
            />
          )}
          {trend.direction === 'down' && (
            <TrendingDown
              className={`h-3.5 w-3.5 ${
                trend.isPositive ? 'text-low' : 'text-critical'
              }`}
            />
          )}
          {trend.direction === 'neutral' && (
            <Minus className="h-3.5 w-3.5 text-text-muted" />
          )}
          <span
            className={`font-medium ${
              trend.direction === 'neutral'
                ? 'text-text-muted'
                : trend.isPositive
                ? 'text-low'
                : 'text-critical'
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}

      {subtext && !trend && (
        <p className="mt-2.5 text-xs text-text-muted">{subtext}</p>
      )}
    </div>
  );
};
