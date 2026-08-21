import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Activity, 
  Plus, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileCode,
  KeyRound,
  Server
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskScoreBadge } from '../components/common/RiskScoreBadge';
import { RiskTrendChart } from '../components/dashboard/RiskTrendChart';
import { ExposureBreakdown } from '../components/dashboard/ExposureBreakdown';
import { Finding } from '../types';
import { PageId } from '../components/layout/Sidebar';

interface DashboardProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onNavigatePage: (pageId: PageId, filter?: string) => void;
  onStartNewScan: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  findings,
  onSelectFinding,
  onNavigatePage,
  onStartNewScan,
}) => {
  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = findings.filter((f) => f.severity === 'HIGH').length;
  const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter((f) => f.severity === 'LOW').length;

  const recentFindings = findings.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Security Overview
            </h1>
            <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-mono font-bold text-primary">
              SOC LIVE
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1.5 max-w-2xl">
            Monitor operational-security exposure across your repositories and digital artifacts.
          </p>
        </div>

        <button
          onClick={onStartNewScan}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>START NEW SCAN</span>
        </button>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Critical Findings"
          value={criticalCount.toString().padStart(2, '0')}
          icon={Flame}
          severityColor="critical"
          trend={{ value: '+1 from previous scan', direction: 'up', isPositive: false }}
          onClick={() => onNavigatePage('findings', 'CRITICAL')}
        />

        <MetricCard
          label="High Findings"
          value={highCount.toString().padStart(2, '0')}
          icon={ShieldAlert}
          severityColor="high"
          trend={{ value: '-1 from previous scan', direction: 'down', isPositive: true }}
          onClick={() => onNavigatePage('findings', 'HIGH')}
        />

        <MetricCard
          label="Medium Findings"
          value={mediumCount.toString().padStart(2, '0')}
          icon={AlertTriangle}
          severityColor="medium"
          trend={{ value: 'Stable', direction: 'neutral' }}
          onClick={() => onNavigatePage('findings', 'MEDIUM')}
        />

        <MetricCard
          label="Low Findings"
          value={lowCount.toString().padStart(2, '0')}
          icon={CheckCircle2}
          severityColor="low"
          trend={{ value: '+2 from previous scan', direction: 'up', isPositive: false }}
          onClick={() => onNavigatePage('findings', 'LOW')}
        />

        <MetricCard
          label="Overall Risk"
          value="7.8 / 10"
          icon={Activity}
          severityColor="primary"
          trend={{ value: '-1.0 pt reduction', direction: 'down', isPositive: true }}
          onClick={() => onNavigatePage('baseline')}
        />
      </div>

      {/* Grid: Risk Trend Chart + Exposure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskTrendChart />
        </div>
        <div className="lg:col-span-1">
          <ExposureBreakdown
            onNavigateToIdentity={() => onNavigatePage('identity')}
            onNavigateToFindings={() => onNavigatePage('findings')}
          />
        </div>
      </div>

      {/* Recent Discovered Findings Section */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary tracking-tight">Recent Discovered Findings</h3>
            <p className="text-xs text-text-muted mt-0.5">Top-ranked security exposures discovered across active scans</p>
          </div>
          <button
            onClick={() => onNavigatePage('findings')}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <span>View All Findings ({findings.length})</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Findings Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-text-muted font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Finding</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Exposure</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recentFindings.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => onSelectFinding(finding)}
                  className="hover:bg-surface-elevated/70 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3">
                    <SeverityBadge severity={finding.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                      {finding.title}
                    </div>
                    <div className="text-[11px] text-text-muted font-mono truncate">{finding.origin}</div>
                  </td>
                  <td className="py-3 px-3 capitalize text-text-secondary">{finding.category}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-text-primary">
                    {Math.round(finding.confidence * 100)}%
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-text-secondary">
                    {finding.lifecycleStatus ? finding.lifecycleStatus.replace('_', ' ') : 'Active'}
                  </td>
                  <td className="py-3 px-3">
                    <RiskScoreBadge score={finding.riskScore} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        finding.status === 'OPEN'
                          ? 'bg-critical/15 text-critical border-critical/30'
                          : finding.status === 'IN_REVIEW'
                          ? 'bg-medium/15 text-medium border-medium/30'
                          : 'bg-low/15 text-low border-low/30'
                      }`}
                    >
                      {finding.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-primary font-medium">
                    Investigate →
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
