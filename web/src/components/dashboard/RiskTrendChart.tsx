import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Activity, Calendar } from 'lucide-react';

const data7d = [
  { date: 'Aug 14', riskScore: 8.8, critical: 3, high: 6, medium: 7, low: 3 },
  { date: 'Aug 15', riskScore: 8.6, critical: 3, high: 5, medium: 7, low: 3 },
  { date: 'Aug 16', riskScore: 8.5, critical: 3, high: 5, medium: 7, low: 4 },
  { date: 'Aug 17', riskScore: 8.2, critical: 2, high: 5, medium: 8, low: 4 },
  { date: 'Aug 18', riskScore: 8.1, critical: 2, high: 5, medium: 7, low: 4 },
  { date: 'Aug 19', riskScore: 7.9, critical: 2, high: 5, medium: 7, low: 4 },
  { date: 'Aug 20', riskScore: 7.8, critical: 2, high: 5, medium: 7, low: 4 },
];

const data30d = [
  { date: 'Jul 22', riskScore: 9.4, critical: 5, high: 8, medium: 10, low: 2 },
  { date: 'Jul 29', riskScore: 9.1, critical: 4, high: 7, medium: 9, low: 3 },
  { date: 'Aug 05', riskScore: 8.6, critical: 3, high: 6, medium: 8, low: 3 },
  { date: 'Aug 12', riskScore: 8.2, critical: 2, high: 5, medium: 7, low: 4 },
  { date: 'Aug 20', riskScore: 7.8, critical: 2, high: 5, medium: 7, low: 4 },
];

const data90d = [
  { date: 'May 2026', riskScore: 9.8, critical: 6, high: 9, medium: 12, low: 1 },
  { date: 'Jun 2026', riskScore: 9.2, critical: 4, high: 8, medium: 10, low: 2 },
  { date: 'Jul 2026', riskScore: 8.7, critical: 3, high: 6, medium: 8, low: 3 },
  { date: 'Aug 2026', riskScore: 7.8, critical: 2, high: 5, medium: 7, low: 4 },
];

export const RiskTrendChart: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const chartData = range === '7d' ? data7d : range === '30d' ? data30d : data90d;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold text-text-primary tracking-tight">
              OPSEC Risk Trend
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Historical vulnerability and credential exposure score over time
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-sidebar p-1 text-xs font-mono">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                range === r
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#22304A" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              domain={[0, 10]}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-border bg-surface-elevated/95 p-3.5 shadow-card-elevated backdrop-blur-md text-xs font-mono space-y-2">
                      <div className="font-bold text-text-primary border-b border-border/80 pb-1 flex justify-between gap-4">
                        <span>{data.date}</span>
                        <span className="text-primary font-extrabold">{data.riskScore} / 10 Risk</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between gap-4 text-critical font-semibold">
                          <span>Critical Findings:</span>
                          <span>{data.critical}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-high font-semibold">
                          <span>High Findings:</span>
                          <span>{data.high}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-medium">
                          <span>Medium Findings:</span>
                          <span>{data.medium}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-low">
                          <span>Low Findings:</span>
                          <span>{data.low}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="riskScore"
              stroke="#6C63FF"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#riskGradient)"
              name="Risk Score"
            />
            <Area
              type="monotone"
              dataKey="critical"
              stroke="#EF4444"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#criticalGradient)"
              name="Critical Findings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60 text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-text-secondary">Overall Risk Score (0–10)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-critical" />
            <span className="text-text-secondary">Critical Findings</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-low font-semibold">
          <TrendingDown className="h-3.5 w-3.5" />
          <span>-1.0 pt reduction across {range}</span>
        </div>
      </div>
    </div>
  );
};
