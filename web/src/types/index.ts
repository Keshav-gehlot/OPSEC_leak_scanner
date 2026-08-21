export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingCategory = 'credentials' | 'identity' | 'infrastructure' | 'metadata' | 'git_forensics';

export type FindingStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'SUPPRESSED';

export type ExposureLevel = 'PUBLIC_REACHABLE' | 'ARCHIVED_OR_HIDDEN' | 'LOCAL_ONLY';

export interface SecretIntelligence {
  secretConfidence: number; // 0.0 - 1.0
  entropy: number;
  charsetDiversity: 'High' | 'Medium' | 'Low';
  contextMatch: 'Strong' | 'Moderate' | 'Weak';
  dictionaryFilter: 'Passed' | 'Filtered';
  signatureName: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: Severity;
  riskScore: number;
  confidence: number; // 0.0 - 1.0
  
  // 6-Dimensional Risk Engine
  dimensions: {
    baseSeverity: number;
    identityConfidence: number;
    exposure: number;
    exploitability: number;
    persistence: number;
    context: number;
  };

  // Secret Intelligence (for credential findings)
  secretIntelligence?: SecretIntelligence;

  // Domain Intelligence (for domain findings)
  domainIntelligence?: {
    domain: string;
    classification: 'PUBLIC' | 'INTERNAL' | 'STAGING' | 'DEVELOPMENT' | 'VPN' | 'ADMIN' | 'MONITORING' | 'SENSITIVE';
    exposure: string;
    confidence: number;
  };

  // Location & Provenance
  sourceType: string;
  origin: string;
  context: string;
  lineNumber?: number;
  commitSha?: string;
  author?: string;
  authorEmail?: string;
  date?: string;

  // Values
  detectedText: string;
  maskedText: string;
  revealedText?: string;

  // Framework Mapping
  mitreTechnique?: string;
  mitreName?: string;
  cwe?: string;
  cweName?: string;

  // Intelligence & Forensics
  status: FindingStatus;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  lifecycleStatus?: 'ACTIVE_IN_HEAD' | 'HISTORICAL_LEAK' | 'DANGLING ORPHAN';
  identityCorrelation?: {
    matchedString: string;
    type: string;
    reason: string;
  };

  // Remediation
  remediationSteps: string[];
  remediationCommands?: string[];
}

export interface ScanStats {
  filesScanned: number;
  commitsAnalyzed: number;
  rulesEvaluated: number;
  findingsDiscovered: number;
  entitiesDiscovered?: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface Scan {
  id: string;
  target: string;
  targetType: 'git' | 'media';
  status: 'running' | 'completed' | 'failed';
  progress: number;
  scanDepth: 'current' | 'full_history' | 'forensic';
  startedAt: string;
  completedAt?: string;
  stats: ScanStats;
  riskScore: number;
}

export interface TargetProfile {
  name: string;
  aliases: string[];
  emails: string[];
  domains: string[];
  githubHandles: string[];
  hostnames: string[];
  homeCoordinates?: [number, number] | null;
}

export type IdentityNodeType = 
  | 'target' 
  | 'email' 
  | 'username' 
  | 'github' 
  | 'hostname' 
  | 'repo' 
  | 'commit' 
  | 'file'
  | 'secret' 
  | 'gps' 
  | 'domain';

export interface IdentityGraphNode {
  id: string;
  type: IdentityNodeType;
  label: string;
  sublabel?: string;
  category: 'identity' | 'infrastructure' | 'git' | 'secrets' | 'metadata';
  confidence: number;
  details: Record<string, string | number>;
  x?: number;
  y?: number;
}

export interface IdentityGraphEdge {
  id: string;
  source: string;
  target: string;
  label: 'AUTHORED' | 'CONTAINS' | 'COMMITTED_BY' | 'CO_OCCURS_WITH' | 'RESOLVES_TO' | 'RUNS_ON' | 'GEO_PROXIMATE';
  animated?: boolean;
}

export interface GitCommitTimelineEvent {
  sha: string;
  shortSha: string;
  author: string;
  authorEmail: string;
  date: string;
  message: string;
  action: 'introduced' | 'modified' | 'deleted_in_head' | 'historical_persistence';
  branch: string;
  file: string;
  line: number;
  patchSnippet: string;
}

export interface GitForensicFinding {
  findingId: string;
  title: string;
  secretType: string;
  currentStatus: 'ACTIVE_IN_HEAD' | 'HISTORICAL_LEAK' | 'DANGLING_ORPHAN';
  firstSeenDate: string;
  lastSeenDate: string;
  commitsPersistent: number;
  firstAuthor: string;
  lastAuthor: string;
  timeline: GitCommitTimelineEvent[];
  safeRemediationCommand: string;
}

export interface BaselineComparison {
  baselineId: string;
  baselineDate: string;
  currentScanId: string;
  newCount: number;
  resolvedCount: number;
  unchangedCount: number;
  diffs: {
    finding: Finding;
    diffStatus: 'NEW' | 'RESOLVED' | 'UNCHANGED';
  }[];
}

export interface DomainIntelligence {
  id: string;
  domain: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'STAGING' | 'DEVELOPMENT' | 'VPN' | 'ADMIN' | 'MONITORING' | 'SENSITIVE';
  severity: Severity;
  confidence?: number;
  riskReason: string;
  associatedFindings: number;
  environment: string;
  firstDiscovered: string;
  ipAddresses?: string[];
}

export interface ReportItem {
  id: string;
  title: string;
  format: 'HTML' | 'PDF' | 'JSON' | 'SARIF';
  generatedAt: string;
  size: string;
  description: string;
  downloadFilename: string;
}
