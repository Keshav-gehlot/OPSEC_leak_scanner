import { Scan } from '../types';
import { apiClient } from './client';
import { mockScans } from './mockData';

const LOCAL_STORAGE_KEY = 'opsec_scans_v06';

function getStoredScans(): Scan[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : mockScans;
  } catch {
    return mockScans;
  }
}

function setStoredScans(scans: Scan[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scans));
  } catch (e) {
    console.error(e);
  }
}

export async function fetchScans(): Promise<Scan[]> {
  const local = getStoredScans();
  return apiClient.get<Scan[]>('/scans', local);
}

export async function fetchScanById(id: string): Promise<Scan | undefined> {
  const scans = getStoredScans();
  const scan = scans.find((s) => s.id === id);
  return apiClient.get<Scan | undefined>(`/scans/${id}`, scan);
}

export async function createScan(target: string, targetType: 'git' | 'media', depth: 'current' | 'full_history' | 'forensic'): Promise<Scan> {
  const newScan: Scan = {
    id: `scan-${Date.now().toString(36)}`,
    target,
    targetType,
    status: 'running',
    progress: 0,
    scanDepth: depth,
    startedAt: new Date().toISOString(),
    stats: {
      filesScanned: 0,
      commitsAnalyzed: 0,
      rulesEvaluated: 0,
      findingsDiscovered: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    },
    riskScore: 0,
  };

  const current = getStoredScans();
  setStoredScans([newScan, ...current]);

  return apiClient.post<any, Scan>('/scans', { target, targetType, depth }, newScan);
}
