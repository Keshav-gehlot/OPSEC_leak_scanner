import React from 'react';
import { Finding, FindingStatus } from '../types';
import { FindingTable } from '../components/findings/FindingTable';
import { ShieldAlert, Download, FileSpreadsheet } from 'lucide-react';

interface FindingsProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onExport: (format: 'JSON' | 'SARIF' | 'PDF') => void;
}

export const Findings: React.FC<FindingsProps> = ({
  findings,
  onSelectFinding,
  onExport,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Findings Explorer
            </h1>
            <span className="rounded-full bg-critical/15 border border-critical/30 px-3 py-1 text-xs font-mono font-bold text-critical">
              {findings.length} DISCOVERED
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1.5">
            Deep forensic triage for leaked credentials, identity exposure, infrastructure artifacts, and metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('SARIF')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-card-hover text-xs font-medium text-text-primary transition-all"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>Export SARIF 2.1.0</span>
          </button>

          <button
            onClick={() => onExport('PDF')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-card-hover text-xs font-medium text-text-primary transition-all"
          >
            <Download className="h-4 w-4 text-secondary" />
            <span>Export PDF Briefing</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <FindingTable
        findings={findings}
        onSelectFinding={onSelectFinding}
        onExport={onExport}
      />
    </div>
  );
};
