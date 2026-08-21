import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  SearchCode, 
  ShieldAlert, 
  Network, 
  GitCommit, 
  GitCompare, 
  Globe2, 
  FileText, 
  Settings as SettingsIcon,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';

export type PageId = 
  | 'dashboard' 
  | 'scans' 
  | 'findings' 
  | 'identity' 
  | 'git-forensics' 
  | 'baseline' 
  | 'intelligence' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  openFindingsCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  openFindingsCount = 18,
  collapsed = false,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scans' as PageId, label: 'Scans', icon: SearchCode },
    { 
      id: 'findings' as PageId, 
      label: 'Findings', 
      icon: ShieldAlert, 
      badge: openFindingsCount > 0 ? openFindingsCount : undefined,
      badgeColor: 'bg-critical/15 text-critical border border-critical/30'
    },
    { id: 'identity' as PageId, label: 'Identity', icon: Network },
    { id: 'git-forensics' as PageId, label: 'Git Forensics', icon: GitCommit },
    { id: 'baseline' as PageId, label: 'Baseline', icon: GitCompare },
    { id: 'intelligence' as PageId, label: 'Intelligence', icon: Globe2 },
    { id: 'reports' as PageId, label: 'Reports', icon: FileText },
  ];

  const secondaryNavItems = [
    { id: 'settings' as PageId, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onSelectPage('dashboard')}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-glow-primary">
            <Shield className="h-5 w-5 fill-white/15" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold tracking-wider text-text-primary uppercase font-mono">
                OPSEC SCANNER
              </span>
              <span className="text-[10px] text-text-muted font-medium truncate">
                Intelligence Platform
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
              Security Center
            </span>
          )}
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-glow-primary'
                      : 'text-text-secondary hover:bg-surface-elevated/70 hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1 pt-4 border-t border-border/60">
          {!collapsed && (
            <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
              System
            </span>
          )}
          <nav className="mt-2 space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-text-secondary hover:bg-surface-elevated/70 hover:text-text-primary'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Status & Version */}
      <div className="p-3 border-t border-border/80 bg-sidebar/50">
        {!collapsed ? (
          <div className="rounded-xl border border-border/60 bg-surface/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-text-secondary">
                <Radio className="h-3 w-3 text-low animate-pulse" />
                <span>ENGINE LIVE</span>
              </span>
              <span className="text-[10px] font-mono text-text-muted">v0.6.0</span>
            </div>
            <p className="text-[10px] text-text-muted font-mono truncate">Keshav-gehlot / main</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1" title="Engine Live v0.6.0">
            <Radio className="h-3 w-3 text-low animate-pulse" />
            <span className="text-[9px] font-mono text-text-muted">v0.6</span>
          </div>
        )}
      </div>
    </aside>
  );
};
