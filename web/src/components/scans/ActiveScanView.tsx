import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Layers, 
  SearchCode, 
  ArrowRight 
} from 'lucide-react';
import { Scan } from '../../types';

interface ActiveScanViewProps {
  scan: Scan;
  onViewFindings: () => void;
}

export const ActiveScanView: React.FC<ActiveScanViewProps> = ({
  scan,
  onViewFindings,
}) => {
  const [progress, setProgress] = useState(scan.progress || 0);
  const [logs, setLogs] = useState<string[]>([
    `[INFO] Initializing OPSEC Engine v0.6.0 on target: ${scan.target}`,
    `[INFO] Loading target profile anchors (8 identities detected)...`,
    `[GIT] Traversing commit DAG and full branch refs...`,
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
            `[DONE] Scan finished with 18 findings discovered.`,
            `[OUTPUT] Reports rendered to HTML, JSON, and SARIF.`,
          ]);
          return 100;
        }

        const next = prev + 12;
        if (next === 24) setLogs((l) => [...l, `[PATCH] Analyzing commit 8f3a91b2 (author: Keshav Gehlot)...`]);
        if (next === 48) setLogs((l) => [...l, `[ALERT] Candidate rule match: aws_access_key (AKIAIOSFODNN7EXAMPLE)`]);
        if (next === 72) setLogs((l) => [...l, `[GRAPH] Correlating identity anchors: keshav.gehlot@gmail.com (Confidence 0.96)`]);
        if (next === 84) setLogs((l) => [...l, `[SCORE] Multi-dimensional risk score computed: 9.8 / 10 (CRITICAL)`]);

        return next;
      });
    }, 450);

    return () => clearInterval(timer);
  }, [scan]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isDone ? 'bg-low' : 'bg-primary animate-ping'}`} />
            <h3 className="text-base font-bold text-text-primary tracking-tight">
              {isDone ? 'OPSEC Scan Completed' : 'Scanning Repository History & Artifacts'}
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-1 font-mono">Target: {scan.target}</p>
        </div>

        <div className="flex items-center gap-2">
          {isDone ? (
            <button
              onClick={onViewFindings}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
            >
              <span>View Discovered Findings (18)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-sidebar px-3 py-1.5 text-xs font-mono text-text-secondary">
              <Clock className="h-4 w-4 animate-spin text-primary" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar & Counters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-text-muted">Analysis Progress</span>
          <span className="font-mono font-bold text-text-primary">{progress}%</span>
        </div>

        <div className="h-3 w-full rounded-full bg-sidebar overflow-hidden border border-border/80 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 shadow-glow-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { label: 'Files Scanned', val: isDone ? 1248 : Math.round(progress * 12.4) },
            { label: 'Commits Analyzed', val: isDone ? 482 : Math.round(progress * 4.8) },
            { label: 'Rules Evaluated', val: isDone ? 96 : Math.round(progress * 0.96) },
            { label: 'Findings Discovered', val: isDone ? 18 : Math.round(progress * 0.18) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-sidebar/70 p-3 text-center">
              <span className="text-[10px] uppercase font-mono text-text-muted block">{stat.label}</span>
              <span className="text-lg font-bold font-mono text-text-primary mt-1 block">{stat.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Event Log Stream */}
      <div className="rounded-xl border border-border bg-background p-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-text-muted font-mono border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span>LIVE SCANNER EVENT STREAM</span>
          </div>
          <span>Real-time Log</span>
        </div>

        <div className="h-36 overflow-y-auto font-mono text-xs space-y-1.5 text-text-secondary">
          {logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              <span className="text-text-muted text-[10px] mr-2">[{new Date().toLocaleTimeString()}]</span>
              <span className={log.includes('ALERT') ? 'text-critical font-bold' : log.includes('GRAPH') ? 'text-secondary' : 'text-text-primary'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
