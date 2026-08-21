import React, { useState } from 'react';
import { ReportItem } from '../types';
import { 
  FileText, 
  Download, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  Code, 
  FileCheck2,
  Share2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface ReportsProps {
  reports: ReportItem[];
  onGenerateReport: (format: 'HTML' | 'PDF' | 'JSON' | 'SARIF') => void;
}

export const Reports: React.FC<ReportsProps> = ({ reports, onGenerateReport }) => {
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (format: 'HTML' | 'PDF' | 'JSON' | 'SARIF') => {
    setGenerating(format);
    setTimeout(() => {
      onGenerateReport(format);
      setGenerating(null);
    }, 700);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Reports & Audit Dossiers
            </h1>
            <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-mono font-bold text-primary">
              EXPORTS
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1.5 max-w-3xl">
            Export standalone interactive HTML audit case files, redacted executive PDFs, machine-readable JSON schemas, and SARIF 2.1.0 PR check artifacts.
          </p>
        </div>
      </div>

      {/* 4 Report Format Generation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            format: 'HTML' as const,
            title: 'Interactive HTML Dossier',
            desc: 'Single-file zero-dependency case file with click-to-reveal secret triage.',
            color: 'text-primary border-primary/30 bg-primary/10',
          },
          {
            format: 'PDF' as const,
            title: 'Executive PDF Briefing',
            desc: 'Formal PDF audit report with permanent redaction bars for distribution.',
            color: 'text-secondary border-secondary/30 bg-secondary/10',
          },
          {
            format: 'SARIF' as const,
            title: 'SARIF 2.1.0 Pipeline',
            desc: 'OASIS Standard SARIF for GitHub Code Scanning and GitLab Security pipelines.',
            color: 'text-high border-high/30 bg-high/10',
          },
          {
            format: 'JSON' as const,
            title: 'Raw Findings JSON',
            desc: 'Structured raw candidates with full provenance, timestamps and scores.',
            color: 'text-low border-low/30 bg-low/10',
          },
        ].map((card) => (
          <div key={card.format} className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between shadow-card hover:bg-surface-elevated transition-all">
            <div>
              <div className={`inline-flex p-2.5 rounded-xl border ${card.color} mb-3`}>
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-text-primary">{card.title}</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{card.desc}</p>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => handleGenerate(card.format)}
                disabled={generating === card.format}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-sidebar hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary hover:border-primary/50 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{generating === card.format ? 'Generating...' : 'Generate'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Export Archive Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-4 border-b border-border bg-sidebar/50 flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">Generated Audit Archive</h3>
          <span className="text-xs font-mono text-text-muted">{reports.length} files available</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-sidebar/80 text-text-muted font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-surface-elevated/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span className="px-2 py-0.5 rounded-lg bg-sidebar border border-border text-primary">
                      {rep.format}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">{rep.title}</td>
                  <td className="py-3.5 px-4 font-mono text-text-muted">{rep.generatedAt}</td>
                  <td className="py-3.5 px-4 font-mono text-text-secondary">{rep.size}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewReport(rep)}
                        className="p-1.5 rounded-lg hover:bg-sidebar text-text-muted hover:text-text-primary transition-colors"
                        title="Live Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={`/${rep.downloadFilename}`}
                        download={rep.downloadFilename}
                        className="p-1.5 rounded-lg hover:bg-sidebar text-text-muted hover:text-primary transition-colors"
                        title="Download Artifact"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewReport && (
        <Modal
          isOpen={Boolean(previewReport)}
          onClose={() => setPreviewReport(null)}
          title={`Preview: ${previewReport.title}`}
          subtitle={`Format: ${previewReport.format} • Size: ${previewReport.size}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-4 font-mono text-xs text-text-secondary space-y-2">
              <div className="text-primary font-bold"># OPSEC Scanner v0.6.0 Case File Export</div>
              <div>Generated: {previewReport.generatedAt}</div>
              <div>Schema Version: OASIS / OPSEC-CORRELATION-2.1</div>
              <div>Redaction Mode: ACTIVE_MASKED_CREDENTIALS</div>
              <div className="pt-2 text-text-muted">
                --- BEGIN ENCRYPTED REPORT METADATA STREAM ---
                <br />
                {`{"target": "Keshav-gehlot/OPSEC_leak_scanner", "findings_count": 18, "critical": 2, "high": 5, "overall_score": 7.8}`}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <a
                href={`/${previewReport.downloadFilename}`}
                download={previewReport.downloadFilename}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary hover:bg-primary-hover transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download {previewReport.format} File</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
