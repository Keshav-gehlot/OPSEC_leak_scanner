import React, { useState } from 'react';
import { Finding, FindingStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { RiskScoreBadge } from '../common/RiskScoreBadge';
import { Modal } from '../common/Modal';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  ShieldAlert, 
  KeyRound, 
  Server, 
  GitCommit, 
  UserCheck,
  CheckCircle2,
  XCircle,
  FileCode,
  Globe2,
  Lock,
  Binary
} from 'lucide-react';

interface FindingDetailModalProps {
  finding: Finding | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: FindingStatus) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!finding) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setRevealed(false);
        onClose();
      }}
      title={finding.title}
      subtitle={`Rule: ${finding.ruleId} • Origin: ${finding.origin}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Intelligence Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-elevated/70 p-4">
          <div className="flex items-center gap-3">
            <SeverityBadge severity={finding.severity} size="md" />
            <RiskScoreBadge score={finding.riskScore} size="md" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-sidebar text-xs font-mono">
              <UserCheck className="h-3.5 w-3.5 text-secondary" />
              <span className="text-text-muted">Confidence:</span>
              <span className="font-bold text-text-primary">{Math.round(finding.confidence * 100)}%</span>
            </div>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-text-muted">Status:</span>
            <select
              value={finding.status}
              onChange={(e) => onStatusChange && onStatusChange(finding.id, e.target.value as FindingStatus)}
              className="rounded-lg border border-border bg-sidebar px-3 py-1.5 text-xs font-mono font-semibold text-text-primary focus:border-primary focus:outline-none"
            >
              <option value="OPEN">🔴 OPEN</option>
              <option value="IN_REVIEW">🟡 IN REVIEW</option>
              <option value="RESOLVED">🟢 RESOLVED</option>
              <option value="SUPPRESSED">⚪ SUPPRESSED</option>
            </select>
          </div>
        </div>

        {/* Forensic Evidence Card (Masked by default) */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Forensic Code Evidence
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRevealed(!revealed)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-sidebar hover:bg-surface-elevated text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                <span>{revealed ? 'Mask Secret' : 'Reveal Secret (Audit)'}</span>
              </button>

              <button
                onClick={() => handleCopy(revealed ? finding.detectedText : finding.maskedText)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-sidebar hover:bg-surface-elevated text-xs text-text-secondary hover:text-text-primary transition-colors"
                title="Copy Value"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-low" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 font-mono text-xs text-text-primary overflow-x-auto space-y-2">
            <div className="text-[11px] text-text-muted flex items-center justify-between border-b border-border/50 pb-2">
              <span>Source: {finding.origin}{finding.lineNumber ? ` : Line ${finding.lineNumber}` : ''}</span>
              {finding.commitSha && <span>Commit: {finding.commitSha}</span>}
            </div>

            <pre className="text-secondary whitespace-pre-wrap leading-relaxed">
              {revealed ? finding.context : finding.context.replace(finding.detectedText, finding.maskedText)}
            </pre>
          </div>
        </div>

        {/* Multi-Dimensional 6D Risk Breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
              6-Dimensional OPSEC Risk Vector Model
            </h4>
            <span className="text-xs font-mono font-extrabold text-primary">
              FINAL OPSEC RISK: {finding.riskScore} / 10
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[
              { label: 'Base Severity', val: finding.dimensions.baseSeverity, max: 10 },
              { label: 'Identity Confidence', val: finding.dimensions.identityConfidence, max: 1 },
              { label: 'Exposure Reach', val: finding.dimensions.exposure, max: 1 },
              { label: 'Exploitability', val: finding.dimensions.exploitability, max: 1 },
              { label: 'Persistence', val: finding.dimensions.persistence, max: 1 },
              { label: 'Context', val: finding.dimensions.context, max: 1 },
            ].map((d) => (
              <div key={d.label} className="space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">{d.label}</span>
                  <span className="font-bold text-text-primary">
                    {d.max === 10 ? d.val.toFixed(1) : d.val.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-sidebar overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${(d.val / d.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secret Intelligence Card (if credentials) */}
        {finding.secretIntelligence && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Binary className="h-4 w-4 text-critical" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Secret & Cryptographic Intelligence
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Secret Confidence</span>
                <span className="font-bold text-text-primary text-sm mt-0.5 block">
                  {Math.round(finding.secretIntelligence.secretConfidence * 100)}%
                </span>
              </div>

              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Shannon Entropy</span>
                <span className="font-bold text-secondary text-sm mt-0.5 block">
                  {finding.secretIntelligence.entropy}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Charset Diversity</span>
                <span className="font-bold text-text-primary text-sm mt-0.5 block">
                  {finding.secretIntelligence.charsetDiversity}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Context Match</span>
                <span className="font-bold text-primary text-sm mt-0.5 block">
                  {finding.secretIntelligence.contextMatch}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Dictionary Filter</span>
                <span className="font-bold text-low text-sm mt-0.5 block">
                  {finding.secretIntelligence.dictionaryFilter}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Signature Type</span>
                <span className="font-bold text-text-primary text-sm mt-0.5 block truncate">
                  {finding.secretIntelligence.signatureName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Domain Intelligence Card (if domain) */}
        {finding.domainIntelligence && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-secondary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Domain Reconnaissance & Routing
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Target Hostname</span>
                <span className="font-bold text-text-primary text-xs mt-0.5 block truncate">
                  {finding.domainIntelligence.domain}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Classification</span>
                <span className="font-bold text-primary text-xs mt-0.5 block">
                  {finding.domainIntelligence.classification}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-sidebar p-3">
                <span className="text-[10px] text-text-muted uppercase block">Exposure State</span>
                <span className="font-bold text-medium text-xs mt-0.5 block truncate">
                  {finding.domainIntelligence.exposure}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MITRE ATT&CK & CWE Framework Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted uppercase font-bold">MITRE ATT&CK</span>
              <a
                href={`https://attack.mitre.org/techniques/${finding.mitreTechnique?.replace('.', '/')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <span>View Technique</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded bg-sidebar border border-border font-mono text-xs font-bold text-primary">
                {finding.mitreTechnique || 'T1552.001'}
              </span>
              <span className="text-xs font-medium text-text-primary">
                {finding.mitreName || 'Unsecured Credentials in Files'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted uppercase font-bold">CWE CATEGORY</span>
              <a
                href={`https://cwe.mitre.org/data/definitions/${finding.cwe?.replace('CWE-', '')}.html`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-secondary hover:underline"
              >
                <span>View Advisory</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded bg-sidebar border border-border font-mono text-xs font-bold text-secondary">
                {finding.cwe || 'CWE-798'}
              </span>
              <span className="text-xs font-medium text-text-primary">
                {finding.cweName || 'Use of Hard-coded Credentials'}
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Remediation Panel */}
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-mono flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              RECOMMENDED REMEDIATION ACTIONS
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStatusChange && onStatusChange(finding.id, 'RESOLVED')}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-low/20 hover:bg-low/30 border border-low/40 text-low text-xs font-bold transition-all"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Resolved</span>
              </button>
              <button
                onClick={() => onStatusChange && onStatusChange(finding.id, 'SUPPRESSED')}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-sidebar hover:bg-surface-elevated border border-border text-text-muted hover:text-text-primary text-xs font-bold transition-all"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Suppress</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {finding.remediationSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-text-primary">
                <span className="font-mono text-primary font-bold">{String(idx + 1).padStart(2, '0')}.</span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {finding.remediationCommands && finding.remediationCommands.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-primary/20">
              <span className="text-[10px] uppercase font-mono text-text-muted block">
                Quick Terminal Commands
              </span>
              {finding.remediationCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-text-primary"
                >
                  <code className="truncate mr-3">{cmd}</code>
                  <button
                    onClick={() => handleCopyCommand(cmd)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-surface-elevated border border-border text-[11px] text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                  >
                    {copiedCommand === cmd ? <Check className="h-3 w-3 text-low" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCommand === cmd ? 'Copied' : 'Copy'}</span>
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
