import React from 'react';
import { 
  Search, 
  Plus, 
  Radio, 
  Bell, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  SlidersHorizontal,
  Command
} from 'lucide-react';
import { PageId } from './Sidebar';

interface TopbarProps {
  activePage: PageId;
  onStartNewScan: () => void;
  onOpenCommandPalette: () => void;
  collapsed?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  activePage,
  onStartNewScan,
  onOpenCommandPalette,
  collapsed = false,
}) => {
  const pageTitles: Record<PageId, { title: string; breadcrumb: string }> = {
    dashboard: { title: 'Security Overview', breadcrumb: 'Dashboard' },
    scans: { title: 'Audit Runs & Jobs', breadcrumb: 'Scans' },
    findings: { title: 'Findings Explorer & Triage', breadcrumb: 'Findings' },
    identity: { title: 'Identity Intelligence Graph', breadcrumb: 'Identity Correlation' },
    'git-forensics': { title: 'Git Commit Forensics', breadcrumb: 'Forensics' },
    baseline: { title: 'Baseline & Drift Analysis', breadcrumb: 'CI/CD Baseline' },
    intelligence: { title: 'Domain & Infrastructure Recon', breadcrumb: 'Threat Intelligence' },
    reports: { title: 'Reports & Export Dossiers', breadcrumb: 'Reports Center' },
    settings: { title: 'Settings & Identity Profiles', breadcrumb: 'System Settings' },
  };

  const current = pageTitles[activePage] || { title: 'Overview', breadcrumb: 'Dashboard' };

  return (
    <header
      className={`fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-sidebar/90 px-6 backdrop-blur-md transition-all duration-300 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
          <span>OPSEC</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-secondary">{current.breadcrumb}</span>
        </div>
        <span className="h-4 w-[1px] bg-border hidden sm:block" />
        <h2 className="text-sm font-bold text-text-primary hidden sm:block">
          {current.title}
        </h2>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar with Ctrl+K trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs text-text-muted hover:border-primary/50 hover:text-text-secondary transition-all w-52 sm:w-72 justify-between group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-text-muted group-hover:text-primary transition-colors" />
            <span className="truncate">Search findings, repos, rules...</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-elevated border border-border text-text-muted group-hover:text-primary">
              Ctrl K
            </span>
          </div>
        </button>

        {/* Live Engine Status Pill */}
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-low animate-pulse" />
          <span className="text-[11px] font-bold text-text-primary">READY</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onStartNewScan}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover px-4 py-2 text-xs font-bold text-white shadow-glow-primary hover:opacity-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
          <span className="hidden sm:inline">NEW SCAN</span>
        </button>
      </div>
    </header>
  );
};
