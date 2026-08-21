import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ShieldCheck, TrendingDown } from 'lucide-react';

const data7d = [
  { time: 'Mon', risk: 8.8, critical: 4, high: 6 },
  { time: 'Tue', risk: 8.4, critical: 3, high: 6 },
  { time: 'Wed', risk: 8.1, critical: 3, high: 5 },
  { time: 'Thu', risk: 7.9, critical: 2, high: 5 },
  { time: 'Fri', risk: 8.2, critical: 3, high: 5 },
  { time: 'Sat', risk: 8.0, critical: 2, high: 5 },
  { time: 'Today', risk: 7.8, critical: 2, high: 5 },
];

const data30d = [
  { time: 'Week 1', risk: 9.4, critical: 6, high: 8 },
  { time: 'Week 2', risk: 8.9, critical: 5, high: 7 },
  { time: 'Week 3', risk: 8.3, critical: 3, high: 6 },
  { time: 'Week 4', risk: 7.8, critical: 2, high: 5 },
];

const data90d = [
  { time: 'May', risk: 9.6, critical: 7, high: 10 },
  { time: 'Jun', risk: 9.1, critical: 5, high: 8 },
  { time: 'Jul', risk: 8.5, critical: 4, high: 7 },
  { time: 'Aug', risk: 7.8, critical: 2, high: 5 },
];

export const RiskTrendChart: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const chartData = {
    '7d': data7d,
    '30d': data30d,
    '90d': data90d,
  }[range];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text-primary tracking-tight">OPSEC Risk Trend</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-low bg-low/10 px-2 py-0.5 rounded border border-low/20">
              <TrendingDown className="h-3 w-3" /> -1.0 pt reduction
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">Multi-dimensional exposure risk score tracked across Git history & artifacts</p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center rounded-lg border border-border bg-sidebar p-1 text-xs">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded font-mono font-medium transition-all ${
                range === r
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#24304A" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#24304A' }} 
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11} 
              domain={[0, 10]} 
              ticks={[0, 2, 4, 6, 8, 10]} 
              tickLine={false}
              axisLine={{ stroke: '#24304A' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141C31',
                borderColor: '#24304A',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
              formatter={(value: any) => [`${value} / 10`, 'Overall Risk Score']}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stroke="#6C63FF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#riskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
