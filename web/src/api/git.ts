import { GitForensicFinding } from '../types';
import { apiClient } from './client';
import { mockGitForensicFindings } from './mockData';

export async function fetchGitForensics(): Promise<GitForensicFinding[]> {
  return apiClient.get<GitForensicFinding[]>('/git/forensics', mockGitForensicFindings);
}

export async function fetchGitForensicById(findingId: string): Promise<GitForensicFinding | undefined> {
  const item = mockGitForensicFindings.find((g) => g.findingId === findingId);
  return apiClient.get<GitForensicFinding | undefined>(`/git/forensics/${findingId}`, item);
}
