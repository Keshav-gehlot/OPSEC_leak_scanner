import React from 'react';
import { UserCheck, KeyRound, Server, FileSearch } from 'lucide-react';

interface CategoryItem {
  name: string;
  percentage: number;
  icon: React.ElementType;
  color: string;
  barColor: string;
  findingsCount: number;
}

export const ExposureBreakdown: React.FC = () => {
  const categories: CategoryItem[] = [
    {
      name: 'Identity Exposure',
      percentage: 82,
      icon: UserCheck,
      color: 'text-secondary',
      barColor: 'bg-secondary',
      findingsCount: 5,
    },
    {
      name: 'Credential Exposure',
      percentage: 61,
      icon: KeyRound,
      color: 'text-critical',
      barColor: 'bg-critical',
      findingsCount: 4,
    },
    {
      name: 'Infrastructure Exposure',
      percentage: 74,
      icon: Server,
      color: 'text-high',
      barColor: 'bg-high',
      findingsCount: 6,
    },
    {
      name: 'Metadata Exposure',
      percentage: 43,
      icon: FileSearch,
      color: 'text-medium',
      barColor: 'bg-medium',
      findingsCount: 3,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <h3 className="text-base font-bold text-text-primary tracking-tight">Exposure Breakdown</h3>
          <span className="text-xs text-text-muted font-mono">4 Vectors</span>
        </div>
        <p className="text-xs text-text-muted mt-2">Correlation index per OPSEC threat surface category</p>
      </div>

      <div className="mt-6 space-y-5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.name} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                  <span className="font-semibold text-text-primary">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-text-muted">{cat.findingsCount} findings</span>
                  <span className="font-mono font-bold text-text-primary">{cat.percentage}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-sidebar overflow-hidden border border-border/50">
                <div
                  className={`h-full rounded-full ${cat.barColor} transition-all duration-500`}
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-[11px] text-text-muted">
        <span>Highest vector: Identity (82%)</span>
        <span className="text-primary hover:underline cursor-pointer">View Graph →</span>
      </div>
    </div>
  );
};
