import React, { useState } from 'react';
import { Finding, Severity, FindingCategory, FindingStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { RiskScoreBadge } from '../common/RiskScoreBadge';
import { 
  ChevronRight, 
  ArrowUpDown, 
  Search, 
  SlidersHorizontal, 
  Download, 
  Filter, 
  ShieldAlert,
  GitCommit,
  UserCheck,
  FileCode
} from 'lucide-react';

interface FindingTableProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onExport?: (format: 'JSON' | 'SARIF' | 'PDF') => void;
}

export const FindingTable: React.FC<FindingTableProps> = ({
  findings,
  onSelectFinding,
  onExport,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'riskScore' | 'confidence' | 'severity'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter logic
  const filtered = findings.filter((f) => {
    const matchesSearch = 
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.ruleId.toLowerCase().includes(search.toLowerCase()) ||
      f.origin.toLowerCase().includes(search.toLowerCase()) ||
      f.detectedText.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'riskScore') {
      return sortOrder === 'desc' ? b.riskScore - a.riskScore : a.riskScore - b.riskScore;
    }
    if (sortBy === 'confidence') {
      return sortOrder === 'desc' ? b.confidence - a.confidence : a.confidence - b.confidence;
    }
    const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return sortOrder === 'desc' ? order[b.severity] - order[a.severity] : order[a.severity] - order[b.severity];
  });

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-5 border-b border-border bg-sidebar/50 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by keyword, rule, path..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-primary focus:outline-none"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-primary focus:outline-none"
          >
            <option value="ALL">Category: All</option>
            <option value="credentials">Credentials</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="identity">Identity</option>
            <option value="metadata">Metadata</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-primary focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Export Actions */}
          {onExport && (
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              <button
                onClick={() => onExport('SARIF')}
                className="px-2.5 py-1.5 rounded border border-border bg-card hover:bg-card-hover text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors"
                title="Export SARIF 2.1.0"
              >
                SARIF
              </button>
              <button
                onClick={() => onExport('JSON')}
                className="px-2.5 py-1.5 rounded border border-border bg-card hover:bg-card-hover text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors"
                title="Export JSON"
              >
                JSON
              </button>
              <button
                onClick={() => onExport('PDF')}
                className="px-2.5 py-1.5 rounded border border-border bg-card hover:bg-card-hover text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors"
                title="Export PDF"
              >
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-sidebar/80 text-text-muted font-mono uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Finding & Provenance</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Identity Confidence</th>
              <th className="py-3 px-4">MITRE ATT&CK</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-text-primary"
                onClick={() => {
                  if (sortBy === 'riskScore') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  else { setSortBy('riskScore'); setSortOrder('desc'); }
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-muted">
                  No findings match current search and filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => onSelectFinding(finding)}
                  className="hover:bg-card-hover/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <SeverityBadge severity={finding.severity} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                      {finding.title}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5 truncate font-mono">
                      <span>{finding.origin}</span>
                      {finding.lineNumber && <span>:L{finding.lineNumber}</span>}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="capitalize text-text-secondary font-medium">{finding.category}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-sidebar rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${finding.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-text-primary text-[11px] font-semibold">{Math.round(finding.confidence * 100)}%</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-text-secondary">
                    {finding.mitreTechnique ? (
                      <span className="rounded bg-sidebar px-2 py-0.5 border border-border text-[11px] text-primary font-semibold">
                        {finding.mitreTechnique}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <RiskScoreBadge score={finding.riskScore} size="sm" />
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        finding.status === 'OPEN'
                          ? 'bg-critical/10 text-critical border-critical/30'
                          : finding.status === 'IN_REVIEW'
                          ? 'bg-medium/10 text-medium border-medium/30'
                          : 'bg-low/10 text-low border-low/30'
                      }`}
                    >
                      {finding.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFinding(finding);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-sidebar hover:border-primary/50 text-text-secondary hover:text-text-primary text-[11px] font-medium transition-all"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="h-3 w-3 text-text-muted group-hover:text-primary" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t border-border bg-sidebar/50 flex items-center justify-between text-xs text-text-muted font-mono">
        <span>Showing {filtered.length} of {findings.length} findings</span>
        <span>OPSEC Risk Engine v0.6.0</span>
      </div>
    </div>
  );
};
