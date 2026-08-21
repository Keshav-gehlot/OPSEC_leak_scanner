import React, { useState } from 'react';
import { GitForensicFinding } from '../../types';
import { 
  GitCommit, 
  History, 
  Terminal, 
  AlertTriangle, 
  Check, 
  Copy, 
  ArrowRight, 
  ShieldAlert,
  GitBranch,
  Calendar,
  UserCheck
} from 'lucide-react';

interface GitTimelineProps {
  forensicItems: GitForensicFinding[];
}

export const GitTimeline: React.FC<GitTimelineProps> = ({ forensicItems }) => {
  const [selectedItem, setSelectedItem] = useState<GitForensicFinding>(forensicItems[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedItem) return null;

  return (
    <div className="space-y-6">
      {/* Target Selector Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {forensicItems.map((item) => (
          <button
            key={item.findingId}
            onClick={() => setSelectedItem(item)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              selectedItem.findingId === item.findingId
                ? 'border-primary bg-primary/15 text-primary shadow-glow-primary'
                : 'border-border bg-card text-text-secondary hover:bg-card-hover hover:text-text-primary'
            }`}
          >
            <GitCommit className="h-4 w-4" />
            <span>{item.title}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sidebar border border-border">
              {item.currentStatus}
            </span>
          </button>
        ))}
      </div>

      {/* Main Forensic Dossier */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
        {/* Header Summary */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-critical/15 text-critical border border-critical/30">
                {selectedItem.currentStatus.replace(/_/g, ' ')}
              </span>
              <h3 className="text-lg font-bold text-text-primary tracking-tight">{selectedItem.title}</h3>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Discovered across {selectedItem.commitsPersistent} commits • First introduced {new Date(selectedItem.firstSeenDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="rounded-lg border border-border bg-sidebar/80 px-3 py-1.5">
              <span className="text-text-muted text-[10px] block uppercase">First Author</span>
              <span className="font-semibold text-text-primary">{selectedItem.firstAuthor}</span>
            </div>
          </div>
        </div>

        {/* Commit Lifecycle Timeline */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Secret Lifecycle & Commit Progression
          </h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
            {selectedItem.timeline.map((event, idx) => {
              const actionStyles = {
                introduced: {
                  dot: 'bg-critical ring-4 ring-critical/20',
                  badge: 'bg-critical/15 text-critical border-critical/30',
                  label: 'Secret Introduced',
                },
                modified: {
                  dot: 'bg-high ring-4 ring-high/20',
                  badge: 'bg-high/15 text-high border-high/30',
                  label: 'Secret Modified',
                },
                deleted_in_head: {
                  dot: 'bg-medium ring-4 ring-medium/20',
                  badge: 'bg-medium/15 text-medium border-medium/30',
                  label: 'Deleted from Working Tree (HEAD)',
                },
                historical_persistence: {
                  dot: 'bg-primary ring-4 ring-primary/20',
                  badge: 'bg-primary/20 text-primary border-primary/30',
                  label: 'Historical Persistence Alert',
                },
              }[event.action];

              return (
                <div key={idx} className="relative group">
                  {/* Timeline node dot */}
                  <div className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full ${actionStyles.dot}`} />

                  {/* Event Card */}
                  <div className="rounded-xl border border-border bg-sidebar/70 p-4 transition-all hover:border-border/90 hover:bg-sidebar">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${actionStyles.badge}`}>
                          {actionStyles.label}
                        </span>
                        <span className="font-mono text-xs font-bold text-text-primary">{event.shortSha}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-secondary" /> {event.branch}
                        </span>
                        <span>{event.date}</span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs font-medium text-text-primary">{event.message}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                      Author: {event.author} &lt;{event.authorEmail}&gt; • {event.file}:{event.line}
                    </p>

                    {/* Diff snippet */}
                    <div className="mt-3 rounded-lg border border-border bg-background p-3 font-mono text-xs overflow-x-auto">
                      <pre className="text-[11px] text-text-secondary whitespace-pre-wrap">{event.patchSnippet}</pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forensic Git Remediation Command Box */}
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                Safe Git History Rewrite Remediation
              </h4>
            </div>
            <span className="text-[10px] font-mono text-text-muted">Purges all commit blobs</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-xs text-text-primary">
            <code className="truncate mr-4">{selectedItem.safeRemediationCommand}</code>
            <button
              onClick={() => handleCopy(selectedItem.safeRemediationCommand)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-card hover:bg-card-hover border border-border text-[11px] text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-low" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
