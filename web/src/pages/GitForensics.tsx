import React from 'react';
import { GitForensicFinding } from '../types';
import { GitTimeline } from '../components/git/GitTimeline';
import { GitCommit, History, AlertTriangle } from 'lucide-react';

interface GitForensicsProps {
  forensics: GitForensicFinding[];
}

export const GitForensics: React.FC<GitForensicsProps> = ({ forensics }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Git Commit Forensics
            </h1>
            <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-mono font-bold text-primary">
              LIFECYCLE TRACKER
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1.5 max-w-3xl">
            Track the exact introduction, modification, deletion from HEAD, and ongoing persistence of credentials in Git object history.
          </p>
        </div>
      </div>

      {/* Forensic Timeline View */}
      <GitTimeline forensicItems={forensics} />
    </div>
  );
};
