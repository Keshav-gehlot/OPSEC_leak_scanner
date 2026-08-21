import React, { useState } from 'react';
import { Finding, FindingStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { RiskScoreBadge } from '../common/RiskScoreBadge';
import { Modal } from '../common/Modal';
import { 
  ShieldAlert, 
  FileCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Terminal, 
  GitCommit, 
  UserCheck,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FindingDetailModalProps {
  finding: Finding | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: FindingStatus) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!finding) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={finding.title}
      subtitle={`Finding ID: ${finding.id} • Rule: ${finding.ruleId}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-sidebar/80 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SeverityBadge severity={finding.severity} size="lg" />
            <RiskScoreBadge score={finding.riskScore} size="lg" showLabel />
            <div className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1.5 font-mono text-xs font-semibold text-secondary">
              Confidence: {Math.round(finding.confidence * 100)}%
            </div>
            {finding.lifecycleStatus && (
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
                finding.lifecycleStatus === 'ACTIVE_IN_HEAD' 
                  ? 'bg-critical/20 text-critical border border-critical/30'
                  : 'bg-high/20 text-high border border-high/30'
              }`}>
                {finding.lifecycleStatus.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Status:</span>
            <select
              value={finding.status}
              onChange={(e) => onStatusChange(finding.id, e.target.value as FindingStatus)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none"
            >
              <option value="OPEN">🔴 OPEN</option>
              <option value="IN_REVIEW">🟡 IN REVIEW</option>
              <option value="RESOLVED">🟢 RESOLVED</option>
              <option value="SUPPRESSED">⚪ SUPPRESSED</option>
            </select>
          </div>
        </div>

        {/* Section 1: Provenance & Evidence */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-text-primary tracking-wide">Forensic Evidence & Source Context</h4>
            </div>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-mono"
            >
              {showSecret ? <EyeOff className="h-3.5 w-3.5 text-high" /> : <Eye className="h-3.5 w-3.5 text-secondary" />}
              <span>{showSecret ? 'Mask Secret' : 'Reveal Secret (Audit)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border/70 bg-sidebar/70 p-3">
              <span className="text-text-muted block text-[10px] uppercase font-mono">Origin File / Artifact</span>
              <span className="font-mono text-text-primary font-medium mt-1 block truncate">
                {finding.origin} {finding.lineNumber && `(line ${finding.lineNumber})`}
              </span>
            </div>

            <div className="rounded-lg border border-border/70 bg-sidebar/70 p-3">
              <span className="text-text-muted block text-[10px] uppercase font-mono">Git Commit & Author</span>
              <span className="font-mono text-text-primary font-medium mt-1 block truncate">
                {finding.author || 'Author Signature'} {finding.authorEmail && `<${finding.authorEmail}>`}
              </span>
            </div>
          </div>

          {/* Evidence Code Box */}
          <div className="relative rounded-lg border border-border bg-background p-4 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between text-[11px] text-text-muted mb-2 border-b border-border/40 pb-2">
              <span>DETECTED STRING / PATTERN MATCH</span>
              <button
                onClick={() => handleCopy(showSecret ? (finding.revealedText || finding.detectedText) : finding.maskedText, -1)}
                className="flex items-center gap-1 hover:text-text-primary text-[10px]"
              >
                {copiedIndex === -1 ? <Check className="h-3 w-3 text-low" /> : <Copy className="h-3 w-3" />}
                {copiedIndex === -1 ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className={`block ${showSecret ? 'text-critical font-bold' : 'text-text-primary'}`}>
              {showSecret ? (finding.revealedText || finding.detectedText) : finding.maskedText}
            </code>
          </div>

          {/* Identity Correlation Reason */}
          {finding.identityCorrelation && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 flex items-start gap-3">
              <UserCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-primary">Identity Correlation ({finding.identityCorrelation.type}): </span>
                <span className="text-text-secondary">{finding.identityCorrelation.reason}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: 6-Dimensional Risk Breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <Layers className="h-4 w-4 text-secondary" />
            <h4 className="text-sm font-bold text-text-primary tracking-wide">6-Dimensional OPSEC Risk Breakdown</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Base Severity', val: finding.dimensions.baseSeverity, max: 10, color: 'bg-critical' },
              { label: 'Identity Confidence', val: (finding.dimensions.identityConfidence * 10).toFixed(1), max: 10, color: 'bg-primary' },
              { label: 'Exposure Reach', val: (finding.dimensions.exposure * 10).toFixed(1), max: 10, color: 'bg-secondary' },
              { label: 'Exploitability', val: (finding.dimensions.exploitability * 10).toFixed(1), max: 10, color: 'bg-high' },
              { label: 'Git Persistence', val: (finding.dimensions.persistence * 10).toFixed(1), max: 10, color: 'bg-medium' },
              { label: 'Context Weight', val: (finding.dimensions.context * 10).toFixed(1), max: 10, color: 'bg-low' },
            ].map((dim) => (
              <div key={dim.label} className="rounded-lg border border-border/70 bg-sidebar/60 p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted text-[10px] uppercase font-mono">{dim.label}</span>
                  <span className="font-mono font-bold text-text-primary">{dim.val} / {dim.max}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-background overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dim.color}`}
                    style={{ width: `${(Number(dim.val) / dim.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: MITRE ATT&CK & CWE */}
        {(finding.mitreTechnique || finding.cwe) && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h4 className="text-sm font-bold text-text-primary tracking-wide">Security Framework Classification</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finding.mitreTechnique && (
                <div className="rounded-lg border border-border/80 bg-sidebar/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">MITRE ATT&CK</span>
                    <span className="font-mono text-xs font-bold text-primary">{finding.mitreTechnique}</span>
                  </div>
                  <h5 className="mt-1 text-sm font-semibold text-text-primary">{finding.mitreName}</h5>
                  <p className="mt-1 text-xs text-text-muted">Adversaries extract credentials or reconnaissance data from source artifacts.</p>
                </div>
              )}

              {finding.cwe && (
                <div className="rounded-lg border border-border/80 bg-sidebar/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">CWE VULNERABILITY</span>
                    <span className="font-mono text-xs font-bold text-secondary">{finding.cwe}</span>
                  </div>
                  <h5 className="mt-1 text-sm font-semibold text-text-primary">{finding.cweName}</h5>
                  <p className="mt-1 text-xs text-text-muted">Software contains hard-coded secret material that compromises integrity.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Actionable Remediation Steps & Commands */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <Sparkles className="h-4 w-4 text-low" />
            <h4 className="text-sm font-bold text-text-primary tracking-wide">Actionable Remediation Guidance</h4>
          </div>

          <div className="space-y-2">
            {finding.remediationSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-border/50 bg-sidebar/50 p-3 text-xs">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="text-text-secondary leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {finding.remediationCommands && finding.remediationCommands.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider block">
                Safe Git / Cloud Remediation Commands
              </span>
              {finding.remediationCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-mono text-text-primary"
                >
                  <div className="flex items-center gap-2 overflow-x-auto mr-2">
                    <Terminal className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <code>{cmd}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(cmd, idx)}
                    className="flex-shrink-0 rounded p-1 hover:bg-card-hover text-text-muted hover:text-text-primary"
                  >
                    {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-low" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
