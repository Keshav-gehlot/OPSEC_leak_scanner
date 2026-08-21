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

interface DashboardProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onNavigatePage: (pageId: any) => void;
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
            Continuous operational-security intelligence monitoring across Git repositories, identity graphs, and digital media.
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
          label="Critical Risk"
          value={criticalCount.toString().padStart(2, '0')}
          icon={Flame}
          severityColor="critical"
          trend={{ value: '-1 resolved', direction: 'down', isPositive: true }}
          onClick={() => onNavigatePage('findings')}
        />

        <MetricCard
          label="High Risk"
          value={highCount.toString().padStart(2, '0')}
          icon={ShieldAlert}
          severityColor="high"
          trend={{ value: '2 active in HEAD', direction: 'neutral' }}
          onClick={() => onNavigatePage('findings')}
        />

        <MetricCard
          label="Medium Risk"
          value={mediumCount.toString().padStart(2, '0')}
          icon={AlertTriangle}
          severityColor="medium"
          trend={{ value: 'Stable', direction: 'neutral' }}
          onClick={() => onNavigatePage('findings')}
        />

        <MetricCard
          label="Low Risk"
          value={lowCount.toString().padStart(2, '0')}
          icon={CheckCircle2}
          severityColor="low"
          trend={{ value: '4 suppressed', direction: 'neutral' }}
          onClick={() => onNavigatePage('findings')}
        />

        <MetricCard
          label="Overall Risk"
          value="7.8 / 10"
          icon={Activity}
          severityColor="primary"
          trend={{ value: '-1.0 pt 7d', direction: 'down', isPositive: true }}
          subtext="High Exposure"
        />
      </div>

      {/* Grid: Risk Trend Chart + Exposure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskTrendChart />
        </div>
        <div className="lg:col-span-1">
          <ExposureBreakdown />
        </div>
      </div>

      {/* Recent Discovered Findings Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary tracking-tight">Recent High-Priority Findings</h3>
            <p className="text-xs text-text-muted mt-0.5">Top-ranked security exposures requiring immediate analyst remediation</p>
          </div>
          <button
            onClick={() => onNavigatePage('findings')}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <span>View All Findings ({findings.length})</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Findings Row Items */}
        <div className="divide-y divide-border/60">
          {recentFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-card-hover/60 -mx-6 px-6 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <SeverityBadge severity={finding.severity} size="md" />
                <div>
                  <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                    {finding.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1 font-mono">
                    <span>{finding.origin}</span>
                    {finding.mitreTechnique && (
                      <span className="text-primary font-semibold">[{finding.mitreTechnique}]</span>
                    )}
                    <span>Confidence {Math.round(finding.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <RiskScoreBadge score={finding.riskScore} size="md" />
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-1">
                  <span>Investigate</span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
