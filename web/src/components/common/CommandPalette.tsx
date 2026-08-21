import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  SearchCode, 
  ShieldAlert, 
  Network, 
  GitCommit, 
  GitCompare, 
  Globe2, 
  FileText, 
  Settings as SettingsIcon,
  Play,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { PageId } from '../layout/Sidebar';
import { Finding } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: PageId) => void;
  onSelectFinding: (finding: Finding) => void;
  onStartNewScan: () => void;
  findings: Finding[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectPage,
  onSelectFinding,
  onStartNewScan,
  findings,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent if listening, but also handles toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pages: { id: PageId; label: string; icon: React.ElementType; category: string }[] = [
    { id: 'dashboard', label: 'Security Overview Dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { id: 'scans', label: 'Scans & Audit Runs', icon: SearchCode, category: 'Navigation' },
    { id: 'findings', label: 'Findings Explorer & Triage', icon: ShieldAlert, category: 'Navigation' },
    { id: 'identity', label: 'Identity Intelligence Graph', icon: Network, category: 'Navigation' },
    { id: 'git-forensics', label: 'Git Commit Forensics', icon: GitCommit, category: 'Navigation' },
    { id: 'baseline', label: 'Baseline & Drift Analysis', icon: GitCompare, category: 'Navigation' },
    { id: 'intelligence', label: 'Domain & Infrastructure Intelligence', icon: Globe2, category: 'Navigation' },
    { id: 'reports', label: 'Reports & Export Dossiers', icon: FileText, category: 'Navigation' },
    { id: 'settings', label: 'Settings & Identity Profiles', icon: SettingsIcon, category: 'Navigation' },
  ];

  const filteredPages = pages.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFindings = findings.filter((f) =>
    f.title.toLowerCase().includes(query.toLowerCase()) ||
    f.ruleId.toLowerCase().includes(query.toLowerCase()) ||
    f.origin.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-card-elevated overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-elevated/70">
          <Search className="h-4 w-4 text-primary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search findings, repositories, identities, commands... (Esc to exit)"
            className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sidebar border border-border text-text-muted">
            ESC
          </span>
        </div>

        {/* List Content */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Quick Actions */}
          <div>
            <span className="px-2 text-[10px] font-mono font-bold uppercase text-text-muted tracking-wider">
              Quick Actions
            </span>
            <div className="mt-1 space-y-1">
              <button
                onClick={() => {
                  onStartNewScan();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-elevated text-left text-text-primary transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Play className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Start New OPSEC Scan</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          {filteredPages.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono font-bold uppercase text-text-muted tracking-wider">
                Pages & Views
              </span>
              <div className="mt-1 space-y-1">
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        onSelectPage(page.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-elevated text-left text-text-primary transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-text-secondary group-hover:text-primary" />
                        <span>{page.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Findings */}
          {filteredFindings.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono font-bold uppercase text-text-muted tracking-wider">
                Discovered Security Findings ({filteredFindings.length})
              </span>
              <div className="mt-1 space-y-1">
                {filteredFindings.slice(0, 5).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFinding(f);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-elevated text-left text-text-primary transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate group-hover:text-primary">{f.title}</p>
                      <p className="text-[10px] font-mono text-text-muted truncate">{f.origin}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex-shrink-0 ${
                      f.severity === 'CRITICAL' ? 'bg-critical/15 text-critical' : 'bg-high/15 text-high'
                    }`}>
                      {f.severity}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-sidebar/50 flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span>OPSEC Scanner v0.6.0</span>
        </div>
      </div>
    </div>
  );
};
