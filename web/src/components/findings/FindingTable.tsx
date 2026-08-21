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
  FileCode,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface FindingTableProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onExport?: (format: 'JSON' | 'SARIF' | 'PDF' | 'HTML') => void;
  onBulkStatusChange?: (ids: string[], newStatus: FindingStatus) => void;
}

export const FindingTable: React.FC<FindingTableProps> = ({
  findings,
  onSelectFinding,
  onExport,
  onBulkStatusChange,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((f) => f.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = (newStatus: FindingStatus) => {
    if (onBulkStatusChange && selectedIds.size > 0) {
      onBulkStatusChange(Array.from(selectedIds), newStatus);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-5 border-b border-border bg-sidebar/60 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Search and Total Badge */}
        <div className="flex items-center gap-3">
          <div className="relative w-64 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search findings, rules, origin paths..."
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
          <span className="text-xs font-mono font-bold text-text-muted">
            {filtered.length} total
          </span>
        </div>

        {/* Right: Filters & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-primary focus:outline-none"
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
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-primary focus:outline-none"
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
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-primary focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="SUPPRESSED">Suppressed</option>
          </select>

          {/* Export Actions */}
          {onExport && (
            <div className="flex items-center gap-1 border-l border-border pl-2.5">
              {(['SARIF', 'JSON', 'PDF', 'HTML'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onExport(fmt)}
                  className="px-2 py-1 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-[11px] font-mono font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (when items selected) */}
      {selectedIds.size > 0 && (
        <div className="px-5 py-2.5 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-xs animate-fade-in">
          <span className="font-mono font-bold text-primary">
            {selectedIds.size} findings selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('RESOLVED')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-low/20 text-low border border-low/30 hover:bg-low/30 font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Resolved</span>
            </button>
            <button
              onClick={() => handleBulkAction('SUPPRESSED')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface text-text-muted border border-border hover:text-text-primary font-bold"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Suppress</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-sidebar/80 text-text-muted font-mono uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded border-border bg-surface text-primary focus:ring-primary h-3.5 w-3.5"
                />
              </th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Finding & Provenance</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Exposure</th>
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
                <td colSpan={9} className="py-12 text-center text-text-muted">
                  No findings match current search and filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => onSelectFinding(finding)}
                  className="hover:bg-surface-elevated/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(finding.id)}
                      onChange={() => toggleSelectOne(finding.id)}
                      className="rounded border-border bg-surface text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                  </td>

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
                      <span className="text-text-primary text-[11px] font-semibold">
                        {Math.round(finding.confidence * 100)}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className="text-text-secondary">
                      {finding.lifecycleStatus ? finding.lifecycleStatus.replace('_', ' ') : 'Active'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <RiskScoreBadge score={finding.riskScore} size="sm" />
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        finding.status === 'OPEN'
                          ? 'bg-critical/15 text-critical border-critical/30'
                          : finding.status === 'IN_REVIEW'
                          ? 'bg-medium/15 text-medium border-medium/30'
                          : 'bg-low/15 text-low border-low/30'
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-sidebar hover:border-primary/50 text-text-secondary hover:text-text-primary text-[11px] font-medium transition-all"
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
