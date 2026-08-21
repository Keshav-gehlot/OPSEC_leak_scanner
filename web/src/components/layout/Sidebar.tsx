import React from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ScanSearch, 
  SearchCode, 
  Network, 
  GitCommit, 
  Globe2, 
  GitCompare, 
  FileText, 
  Settings, 
  Activity,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export type PageId = 
  | 'dashboard' 
  | 'scans' 
  | 'findings' 
  | 'identity' 
  | 'git-forensics' 
  | 'intelligence' 
  | 'baseline' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  openFindingsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  openFindingsCount = 18,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ElementType; badge?: number; section?: string }[] = [
    { id: 'dashboard', label: 'Security Overview', icon: LayoutDashboard },
    { id: 'scans', label: 'Scans & Workflows', icon: ScanSearch },
    { id: 'findings', label: 'Findings Explorer', icon: SearchCode, badge: openFindingsCount },
    { id: 'identity', label: 'Identity Graph', icon: Network },
    { id: 'git-forensics', label: 'Git Forensics', icon: GitCommit },
    { id: 'intelligence', label: 'Domain & Infra', icon: Globe2 },
    { id: 'baseline', label: 'Baseline & Drift', icon: GitCompare },
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
    { id: 'settings', label: 'Target & Rules', icon: Settings, section: 'Configuration' },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-border/70 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-glow-primary">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-sidebar">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-text-primary font-mono">OPSEC</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">v0.6</span>
            </div>
            <p className="text-[11px] font-medium text-text-muted">Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Operations Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <React.Fragment key={item.id}>
                {item.section && (
                  <div className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm font-semibold'
                      : 'text-text-secondary hover:bg-card-hover hover:text-text-primary border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-primary text-white' : 'bg-critical/20 text-critical border border-critical/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Engine Status / Footer */}
      <div className="p-4 border-t border-border/70 bg-background/40">
        <div className="rounded-lg border border-border p-3 bg-card/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-low opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-low"></span>
              </span>
              <span className="font-semibold text-text-primary">Engine Active</span>
            </div>
            <span className="text-[10px] font-mono text-low font-bold">READY</span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex justify-between">
            <span>Target: Keshav-gehlot</span>
            <span className="font-mono text-text-secondary">8 anchors</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
