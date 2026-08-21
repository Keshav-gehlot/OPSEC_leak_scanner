import { Finding, FindingStatus } from '../types';
import { apiClient } from './client';
import { mockFindings } from './mockData';

const LOCAL_STORAGE_KEY = 'opsec_findings_v06';

function getStoredFindings(): Finding[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : mockFindings;
  } catch {
    return mockFindings;
  }
}

function setStoredFindings(findings: Finding[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(findings));
  } catch (e) {
    console.error(e);
  }
}

export async function fetchFindings(): Promise<Finding[]> {
  const local = getStoredFindings();
  return apiClient.get<Finding[]>('/findings', local);
}

export async function fetchFindingById(id: string): Promise<Finding | undefined> {
  const findings = getStoredFindings();
  const finding = findings.find((f) => f.id === id);
  return apiClient.get<Finding | undefined>(`/findings/${id}`, finding);
}

export async function updateFindingStatus(id: string, status: FindingStatus): Promise<Finding | undefined> {
  const findings = getStoredFindings();
  const idx = findings.findIndex((f) => f.id === id);
  if (idx !== -1) {
    findings[idx] = { ...findings[idx], status };
    setStoredFindings([...findings]);
    return apiClient.post<any, Finding>(`/findings/${id}/status`, { status }, findings[idx]);
  }
  return undefined;
}
