import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Network,
  FileText,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';
import { Scan } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveScanViewProps {
  scan: Scan;
  onViewFindings: () => void;
  onViewIdentity?: () => void;
  onGenerateReport?: () => void;
}

export const ActiveScanView: React.FC<ActiveScanViewProps> = ({
  scan,
  onViewFindings,
  onViewIdentity,
  onGenerateReport,
}) => {
  const [progress, setProgress] = useState(scan.progress || 0);
  const [logs, setLogs] = useState<{ time: string; text: string; type: 'info' | 'alert' | 'graph' | 'done' }[]>([
    { time: '21:04:10', text: `INITIALIZATION — Loading OPSEC Engine v0.6.0 on target ${scan.target}`, type: 'info' },
    { time: '21:04:11', text: 'ANCHORS — 8 target identity anchors loaded from target_profile.yaml', type: 'info' },
    { time: '21:04:12', text: 'ANALYSIS — Scanning commit a82f4c (author: Keshav Gehlot)', type: 'info' },
  ]);
  const [isDone, setIsDone] = useState(scan.status === 'completed');

  useEffect(() => {
    if (scan.status === 'completed') {
      setProgress(100);
      setIsDone(true);
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsDone(true);
          setLogs((l) => [
            ...l,
            { time: '21:04:15', text: 'REPORT — Rendered interactive HTML dossier & SARIF 2.1.0 report', type: 'done' },
            { time: '21:04:15', text: 'COMPLETE — 18 findings recorded across Git commit DAG and digital media', type: 'done' },
          ]);
          return 100;
        }

        const next = prev + 14;
        if (next === 28) {
          setLogs((l) => [
            ...l,
            { time: '21:04:13', text: 'DETECTION — Credential signature matched: aws_access_key (AKIAIOSFODNN7EXAMPLE)', type: 'alert' },
          ]);
        }
        if (next === 56) {
          setLogs((l) => [
            ...l,
            { time: '21:04:13', text: 'IDENTITY — Correlating author identity: keshav.gehlot@gmail.com (Confidence 0.96)', type: 'graph' },
          ]);
        }
        if (next === 84) {
          setLogs((l) => [
            ...l,
            { time: '21:04:14', text: 'RISK — Multi-dimensional risk score calculated: 9.8 / 10 (CRITICAL)', type: 'alert' },
            { time: '21:04:14', text: 'FORENSICS — Verified secret persistence in HEAD and commit 8f3a91b2', type: 'info' },
          ]);
        }

        return next > 100 ? 100 : next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [scan]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`h-3 w-3 rounded-full ${isDone ? 'bg-low' : 'bg-primary animate-ping'}`} />
            <h3 className="text-base font-extrabold text-text-primary tracking-tight">
              {isDone ? 'SCAN COMPLETE' : 'SCANNING REPOSITORY & ARTIFACTS'}
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-1 font-mono">Target: {scan.target}</p>
        </div>

        {/* Completion Actions */}
        {isDone ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onViewFindings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
            >
              <span>View Findings (18)</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {onViewIdentity && (
              <button
                onClick={onViewIdentity}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface-elevated hover:bg-card-hover text-xs font-semibold text-text-primary transition-all"
              >
                <Network className="h-4 w-4 text-secondary" />
                <span>Identity Graph</span>
              </button>
            )}

            {onGenerateReport && (
              <button
                onClick={onGenerateReport}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface-elevated hover:bg-card-hover text-xs font-semibold text-text-primary transition-all"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span>Generate Report</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-sidebar px-3.5 py-2 text-xs font-mono text-text-secondary">
            <Clock className="h-4 w-4 animate-spin text-primary" />
            <span>Analyzing commits...</span>
          </div>
        )}
      </div>

      {/* Progress Bar & Counters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-text-muted uppercase">Analysis Progress</span>
          <span className="font-bold text-text-primary text-sm">{progress}%</span>
        </div>

        <div className="h-3.5 w-full rounded-full bg-sidebar overflow-hidden border border-border p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-low transition-all duration-300 shadow-glow-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[
            { label: 'Files Scanned', val: isDone ? '1,482' : String(Math.round(progress * 14.82)) },
            { label: 'Commits Analyzed', val: isDone ? '621' : String(Math.round(progress * 6.21)) },
            { label: 'Rules Evaluated', val: isDone ? '128' : String(Math.round(progress * 1.28)) },
            { label: 'Entities Discovered', val: isDone ? '96' : String(Math.round(progress * 0.96)) },
            { label: 'Findings Discovered', val: isDone ? '18' : String(Math.round(progress * 0.18)) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-surface-elevated/70 p-3.5 text-center">
              <span className="text-[10px] uppercase font-mono text-text-muted block">{stat.label}</span>
              <span className="text-lg font-bold font-mono text-text-primary mt-1 block">{stat.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Summary Banner (if done) */}
      {isDone && (
        <div className="rounded-xl border border-low/30 bg-low/10 p-4 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-low flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-text-primary">Audit Scan Completed Successfully</p>
              <p className="text-[11px] text-text-muted mt-0.5 font-mono">18 security findings categorized across 4 severity tiers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-critical/20 text-critical border border-critical/40 font-bold">2 Critical</span>
            <span className="px-2 py-0.5 rounded bg-high/20 text-high border border-high/40 font-bold">5 High</span>
            <span className="px-2 py-0.5 rounded bg-medium/20 text-medium border border-medium/40 font-bold">7 Medium</span>
            <span className="px-2 py-0.5 rounded bg-low/20 text-low border border-low/40 font-bold">4 Low</span>
          </div>
        </div>
      )}

      {/* Live Event Stream Console */}
      <div className="rounded-xl border border-border bg-background p-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-text-muted font-mono border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-text-secondary">LIVE EVENT CONSOLE STREAM</span>
          </div>
          <span>Real-time Event Stream</span>
        </div>

        <div className="h-40 overflow-y-auto font-mono text-xs space-y-1.5 text-text-secondary">
          <AnimatePresence initial={false}>
            {logs.map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="leading-relaxed"
              >
                <span className="text-text-muted text-[10px] mr-2">[{log.time}]</span>
                <span
                  className={
                    log.type === 'alert'
                      ? 'text-critical font-bold'
                      : log.type === 'graph'
                      ? 'text-secondary font-semibold'
                      : log.type === 'done'
                      ? 'text-low font-bold'
                      : 'text-text-primary'
                  }
                >
                  {log.text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
