import React from 'react';
import { 
  Plus, 
  Search, 
  Bell, 
  FolderGit2, 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';

interface TopbarProps {
  onStartNewScan: () => void;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  activeTarget?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onStartNewScan,
  onSearchChange,
  searchQuery = '',
  activeTarget = 'Keshav-gehlot/OPSEC_leak_scanner',
}) => {
  return (
    <header className="h-16 border-b border-border bg-sidebar/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search and Target Indicator */}
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search findings, commits, secrets..."
            className="w-full rounded-lg border border-border bg-card/80 pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/60 text-xs">
          <FolderGit2 className="h-4 w-4 text-secondary" />
          <span className="text-text-muted">Target:</span>
          <span className="font-mono font-semibold text-text-primary">{activeTarget}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-low ml-1" />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-4">
        <button
          onClick={onStartNewScan}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-semibold shadow-glow-primary hover:opacity-95 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Scan</span>
        </button>

        <div className="h-5 w-[1px] bg-border mx-1" />

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-xs font-mono">
            KG
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-text-primary leading-none">Security Analyst</p>
            <p className="text-[10px] text-text-muted mt-0.5">keshav@opsec</p>
          </div>
        </div>
      </div>
    </header>
  );
};
