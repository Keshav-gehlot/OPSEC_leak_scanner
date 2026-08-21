import React, { useState } from 'react';
import { Scan, ScanStats } from '../types';
import { 
  FolderGit2, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { ActiveScanView } from '../components/scans/ActiveScanView';

interface ScansProps {
  scans: Scan[];
  activeScan: Scan | null;
  onStartNewScan: () => void;
  onViewFindings: () => void;
}

export const Scans: React.FC<ScansProps> = ({
  scans,
  activeScan,
  onStartNewScan,
  onViewFindings,
}) => {
  const [search, setSearch] = useState('');

  const filteredScans = scans.filter((s) => 
    s.target.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            Scans & Audit Runs
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Manage live scan jobs, trigger deep historical git forensics, and view audit history.
          </p>
        </div>

        <button
          onClick={onStartNewScan}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>START NEW SCAN</span>
        </button>
      </div>

      {/* Active Scan Section (if active) */}
      {activeScan && (
        <ActiveScanView scan={activeScan} onViewFindings={onViewFindings} />
      )}

      {/* Past Scans History Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-sidebar/50 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-base font-bold text-text-primary tracking-tight">Audit History & Snapshots</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search past scans..."
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-sidebar/80 text-text-muted font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Scan ID</th>
                <th className="py-3 px-4">Target & Type</th>
                <th className="py-3 px-4">Depth</th>
                <th className="py-3 px-4">Duration & Date</th>
                <th className="py-3 px-4">Analyzed Artifacts</th>
                <th className="py-3 px-4">Findings Breakdown</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredScans.map((s) => (
                <tr key={s.id} className="hover:bg-card-hover/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-text-primary">{s.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 font-medium text-text-primary">
                      {s.targetType === 'git' ? <FolderGit2 className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-secondary" />}
                      <span className="font-mono">{s.target}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-text-secondary uppercase text-[11px]">{s.scanDepth.replace('_', ' ')}</td>
                  <td className="py-3.5 px-4 text-text-muted">
                    <span>{new Date(s.startedAt).toLocaleString()}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-text-secondary">
                    <span>{s.stats.commitsAnalyzed} commits / {s.stats.filesScanned} files</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      {s.stats.criticalCount > 0 && <span className="px-1.5 py-0.5 rounded bg-critical/15 text-critical border border-critical/30">{s.stats.criticalCount} C</span>}
                      {s.stats.highCount > 0 && <span className="px-1.5 py-0.5 rounded bg-high/15 text-high border border-high/30">{s.stats.highCount} H</span>}
                      <span className="text-text-muted">{s.stats.findingsDiscovered} total</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-low bg-low/10 px-2 py-0.5 rounded border border-low/20 uppercase font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={onViewFindings}
                      className="px-3 py-1 rounded border border-border bg-sidebar hover:border-primary/50 text-text-secondary hover:text-text-primary text-xs font-medium"
                    >
                      View Findings →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
