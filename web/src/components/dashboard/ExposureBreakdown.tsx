import React from 'react';
import { UserCheck, KeyRound, Server, FileCode, ArrowUpRight } from 'lucide-react';

interface ExposureBreakdownProps {
  onNavigateToIdentity?: () => void;
  onNavigateToFindings?: () => void;
}

export const ExposureBreakdown: React.FC<ExposureBreakdownProps> = ({
  onNavigateToIdentity,
  onNavigateToFindings,
}) => {
  const vectors = [
    {
      label: 'Identity Exposure',
      percentage: 82,
      icon: UserCheck,
      color: 'bg-primary',
      textColor: 'text-primary',
      description: 'Emails, GitHub handles & author aliases linked to target',
      onClick: onNavigateToIdentity,
    },
    {
      label: 'Credential Exposure',
      percentage: 64,
      icon: KeyRound,
      color: 'bg-critical',
      textColor: 'text-critical',
      description: 'AWS keys, GCP service accounts & database URIs',
      onClick: onNavigateToFindings,
    },
    {
      label: 'Infrastructure Exposure',
      percentage: 74,
      icon: Server,
      color: 'bg-high',
      textColor: 'text-high',
      description: 'Internal DNS hostnames, VPN gateways & staging URLs',
      onClick: onNavigateToFindings,
    },
    {
      label: 'Metadata Exposure',
      percentage: 48,
      icon: FileCode,
      color: 'bg-medium',
      textColor: 'text-medium',
      description: 'GPS EXIF coordinates, Office author headers & debug info',
      onClick: onNavigateToFindings,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-5 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-text-primary tracking-tight">
          Exposure Vector Breakdown
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          Calculated attack surface reach across core vulnerability dimensions
        </p>
      </div>

      <div className="space-y-4">
        {vectors.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.label}
              onClick={v.onClick}
              className={`p-2.5 rounded-xl transition-all space-y-1.5 ${
                v.onClick ? 'hover:bg-surface-elevated/70 cursor-pointer group' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${v.textColor}`} />
                  <span className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {v.label}
                  </span>
                  {v.onClick && (
                    <ArrowUpRight className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <span className={`font-mono font-bold ${v.textColor}`}>{v.percentage}%</span>
              </div>

              {/* Progress meter bar */}
              <div className="h-2 w-full rounded-full bg-sidebar overflow-hidden border border-border/60">
                <div
                  className={`h-full rounded-full ${v.color} transition-all duration-700`}
                  style={{ width: `${v.percentage}%` }}
                />
              </div>

              <p className="text-[10px] text-text-muted">{v.description}</p>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-text-muted">
        <span>Combined Attack Surface: High</span>
        <span>4 Active Vectors</span>
      </div>
    </div>
  );
};
