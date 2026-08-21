import {
  Finding,
  Scan,
  TargetProfile,
  IdentityGraphNode,
  IdentityGraphEdge,
  GitForensicFinding,
  BaselineComparison,
  DomainIntelligence,
  ReportItem,
} from '../types';

/**
 * Real scanner snapshot generated from the Phase 1 media scan on 2026-08-20.
 * Values are taken from the redacted scanner JSON output, not synthetic demo data.
 * Re-run the scanner and replace this snapshot when a newer result is available.
 */

export const mockTargetProfile: TargetProfile = {
  name: 'Demo Media Scan',
  aliases: [],
  emails: [],
  domains: [],
  githubHandles: [],
  hostnames: [],
  homeCoordinates: null,
};

export const mockFindings: Finding[] = [
  {
    id: 'OPSEC-REAL-001',
    ruleId: 'aws_access_key',
    title: 'Potential AWS Access Key Detected',
    description: 'An AWS access-key signature was detected in an Office document. The scanner classified the evidence as a likely secret with 90% secret confidence.',
    category: 'credentials',
    severity: 'LOW',
    riskScore: 3.56,
    confidence: 0.90,
    dimensions: {
      baseSeverity: 9.5,
      identityConfidence: 0.50,
      exposure: 0.75,
      exploitability: 1.0,
      persistence: 0.50,
      context: 1.0,
    },
    sourceType: 'media_document',
    origin: 'demo-notes.docx',
    context: 'Office document body text',
    detectedText: '████████████████████',
    maskedText: '████████████████████',
    mitreTechnique: 'T1552.001',
    mitreName: 'Unsecured Credentials: Credentials In Files',
    cwe: 'CWE-798',
    cweName: 'Use of Hard-coded Credentials',
    status: 'OPEN',
    firstSeen: '2026-08-20T15:19:13Z',
    lastSeen: '2026-08-20T15:19:13Z',
    occurrences: 1,
    remediationSteps: [
      'Rotate or revoke the exposed AWS access key immediately.',
      'Review CloudTrail for use of the key before and after exposure.',
      'Remove the key from the document and store it in AWS Secrets Manager or an equivalent secret manager.',
      'If the value exists in Git history, rewrite history and rotate the credential.',
    ],
  },
  {
    id: 'OPSEC-REAL-002',
    ruleId: 'generic_api_key_assignment',
    title: 'Potential Generic API Key Assignment',
    description: 'A generic API-key assignment pattern was detected in an Office document. The scanner classified the evidence as a likely secret with 90% secret confidence.',
    category: 'credentials',
    severity: 'LOW',
    riskScore: 2.62,
    confidence: 0.90,
    dimensions: {
      baseSeverity: 7.0,
      identityConfidence: 0.50,
      exposure: 0.75,
      exploitability: 1.0,
      persistence: 0.50,
      context: 1.0,
    },
    sourceType: 'media_document',
    origin: 'demo-notes.docx',
    context: 'Office document body text',
    detectedText: '██████████████████',
    maskedText: '██████████████████',
    mitreTechnique: 'T1552.001',
    mitreName: 'Unsecured Credentials: Credentials In Files',
    cwe: 'CWE-798',
    cweName: 'Use of Hard-coded Credentials',
    status: 'OPEN',
    firstSeen: '2026-08-20T15:19:13Z',
    lastSeen: '2026-08-20T15:19:13Z',
    occurrences: 1,
    remediationSteps: [
      'Replace the hard-coded credential with an environment variable or secret-manager reference.',
      'Rotate the credential if it was ever valid outside a disposable test environment.',
    ],
  },
];

export const mockScans: Scan[] = [
  {
    id: 'scan-real-20260820-media',
    target: 'demo-media',
    targetType: 'media',
    status: 'completed',
    progress: 100,
    scanDepth: 'current',
    startedAt: '2026-08-20T15:19:13Z',
    completedAt: '2026-08-20T15:19:13Z',
    stats: {
      filesScanned: 3,
      commitsAnalyzed: 0,
      rulesEvaluated: 2,
      findingsDiscovered: 2,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 2,
    },
    riskScore: 3.56,
  },
];

// The current real snapshot is a media scan, so there are no verified Git
// lifecycle events, identity correlations, or domain-intelligence results yet.
export const mockIdentityGraphNodes: IdentityGraphNode[] = mockFindings.map((finding) => ({
  id: finding.id,
  type: 'secret',
  label: finding.ruleId,
  sublabel: `${finding.origin} · ${finding.severity}`,
  category: 'secrets',
  confidence: finding.confidence,
  details: {
    riskScore: finding.riskScore,
    source: finding.sourceType,
  },
}));

export const mockIdentityGraphEdges: IdentityGraphEdge[] = [];
export const mockGitForensicFindings: GitForensicFinding[] = [];

export const mockBaselineComparison: BaselineComparison = {
  baselineId: 'none',
  baselineDate: 'No baseline established',
  currentScanId: 'scan-real-20260820-media',
  newCount: 0,
  resolvedCount: 0,
  unchangedCount: 0,
  diffs: [],
};

export const mockDomainIntelligence: DomainIntelligence[] = [];
export const mockReports: ReportItem[] = [];
