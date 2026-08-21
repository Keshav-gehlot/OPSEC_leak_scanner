import React, { useState } from 'react';
import { BaselineComparison, Finding } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { 
  GitCompare, 
  PlusCircle, 
  CheckCircle2, 
  MinusCircle, 
  RefreshCw, 
  Download,
  AlertCircle
} from 'lucide-react';

interface BaselineProps {
  baseline: BaselineComparison;
  onSelectFinding: (finding: Finding) => void;
  onUpdateBaseline: () => void;
}

export const Baseline: React.FC<BaselineProps> = ({
  baseline,
  onSelectFinding,
  onUpdateBaseline,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'RESOLVED' | 'UNCHANGED'>('ALL');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredDiffs = baseline.diffs.filter((d) => 
    filter === 'ALL' || d.diffStatus === filter
  );

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      onUpdateBaseline();
      setIsUpdating(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Baseline & Drift Analysis
            </h1>
            <span className="rounded-full bg-secondary/15 border border-secondary/30 px-3 py-1 text-xs font-mono font-bold text-secondary">
              CI/CD DRIFT
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1.5 max-w-3xl">
            Compare active scan results against the approved baseline snapshot ({baseline.baselineId}) to enforce pull request policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>Update Baseline</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilter('NEW')}
          className={`cursor-pointer rounded-xl border p-5 transition-all ${
            filter === 'NEW' ? 'border-critical bg-critical/15' : 'border-border bg-card hover:bg-card-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">NEW EXPOSURES</span>
            <PlusCircle className="h-5 w-5 text-critical" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-critical">{baseline.newCount}</span>
            <span className="text-xs text-text-muted">Requires fix before merge</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter('RESOLVED')}
          className={`cursor-pointer rounded-xl border p-5 transition-all ${
            filter === 'RESOLVED' ? 'border-low bg-low/15' : 'border-border bg-card hover:bg-card-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">RESOLVED LEAKS</span>
            <CheckCircle2 className="h-5 w-5 text-low" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-low">{baseline.resolvedCount}</span>
            <span className="text-xs text-text-muted">Fixed in current branch</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter('UNCHANGED')}
          className={`cursor-pointer rounded-xl border p-5 transition-all ${
            filter === 'UNCHANGED' ? 'border-primary bg-primary/15' : 'border-border bg-card hover:bg-card-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">UNCHANGED BASELINE</span>
            <MinusCircle className="h-5 w-5 text-text-muted" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-text-primary">{baseline.unchangedCount}</span>
            <span className="text-xs text-text-muted">Known tracked items</span>
          </div>
        </div>
      </div>

      {/* Visual Drift Distribution Bar */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-text-muted uppercase">Delta Distribution</span>
          <span className="text-text-secondary">
            {Math.round((baseline.newCount / (baseline.newCount + baseline.resolvedCount + baseline.unchangedCount)) * 100)}% New Risk
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-sidebar flex overflow-hidden border border-border">
          <div style={{ width: `${(baseline.newCount / 16) * 100}%` }} className="bg-critical h-full" title="New" />
          <div style={{ width: `${(baseline.resolvedCount / 16) * 100}%` }} className="bg-low h-full" title="Resolved" />
          <div style={{ width: `${(baseline.unchangedCount / 16) * 100}%` }} className="bg-text-muted/40 h-full" title="Unchanged" />
        </div>
      </div>

      {/* Diff Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border bg-sidebar/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Baseline Finding Delta List</h3>
          <div className="flex items-center gap-2 text-xs">
            {(['ALL', 'NEW', 'RESOLVED', 'UNCHANGED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded font-mono font-medium transition-all ${
                  filter === tab ? 'bg-primary text-white font-bold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-sidebar/80 text-text-muted font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Drift Status</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Finding</th>
                <th className="py-3 px-4">Origin File</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDiffs.map((diff, idx) => (
                <tr
                  key={idx}
                  onClick={() => onSelectFinding(diff.finding)}
                  className="hover:bg-card-hover/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {diff.diffStatus === 'NEW' && (
                      <span className="px-2 py-0.5 rounded bg-critical/15 text-critical border border-critical/30">
                        + NEW
                      </span>
                    )}
                    {diff.diffStatus === 'RESOLVED' && (
                      <span className="px-2 py-0.5 rounded bg-low/15 text-low border border-low/30">
                        ✓ RESOLVED
                      </span>
                    )}
                    {diff.diffStatus === 'UNCHANGED' && (
                      <span className="px-2 py-0.5 rounded bg-sidebar text-text-muted border border-border">
                        = UNCHANGED
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <SeverityBadge severity={diff.finding.severity} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">{diff.finding.title}</td>
                  <td className="py-3.5 px-4 font-mono text-text-secondary truncate max-w-xs">{diff.finding.origin}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-text-primary">{diff.finding.riskScore}</td>
                  <td className="py-3.5 px-4 text-right text-primary font-medium">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
