import React, { useState } from 'react';
import { DomainIntelligence } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { 
  Globe2, 
  Server, 
  Search, 
  ExternalLink,
  ShieldAlert,
  Lock,
  Activity
} from 'lucide-react';

interface IntelligenceProps {
  domains: DomainIntelligence[];
}

export const Intelligence: React.FC<IntelligenceProps> = ({ domains }) => {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  const filtered = domains.filter((d) => {
    const matchesSearch = d.domain.toLowerCase().includes(search.toLowerCase()) || d.environment.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'ALL' || d.classification === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Domain & Infrastructure Intelligence
            </h1>
            <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-mono font-bold text-primary">
              RECON ENGINE
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1.5 max-w-3xl">
            Classify and catalog discovered hostnames, internal subdomains, VPN gateways, telemetry dashboards, and staging environments.
          </p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-sidebar/60 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domains, environments, IPs..."
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Classifications</option>
              <option value="INTERNAL">Internal</option>
              <option value="VPN">VPN Gateway</option>
              <option value="MONITORING">Monitoring</option>
              <option value="STAGING">Staging</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="ADMIN">Admin</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-sidebar/80 text-text-muted font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Domain / Hostname</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Environment Context</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Mapped IP Addresses</th>
                <th className="py-3 px-4">Associated Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-surface-elevated/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-text-primary flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span>{d.domain}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      d.classification === 'INTERNAL' || d.classification === 'VPN' || d.classification === 'ADMIN'
                        ? 'bg-critical/15 text-critical border border-critical/30'
                        : d.classification === 'MONITORING' || d.classification === 'STAGING' || d.classification === 'DEVELOPMENT'
                        ? 'bg-high/15 text-high border border-high/30'
                        : 'bg-sidebar text-text-muted border border-border'
                    }`}>
                      {d.classification}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-text-primary font-semibold">
                    {d.confidence ? `${Math.round(d.confidence * 100)}%` : '90%'}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-text-secondary">{d.environment}</td>

                  <td className="py-3.5 px-4">
                    <SeverityBadge severity={d.severity} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 font-mono text-text-muted text-[11px]">
                    {d.ipAddresses && d.ipAddresses.length > 0 ? (
                      <span>{d.ipAddresses.join(', ')}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                    <span>{d.associatedFindings} findings</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
