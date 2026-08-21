import { IdentityGraphNode, IdentityGraphEdge, TargetProfile } from '../types';
import { apiClient } from './client';
import { mockIdentityGraphNodes, mockIdentityGraphEdges, mockTargetProfile } from './mockData';

export async function fetchIdentityGraph(): Promise<{ nodes: IdentityGraphNode[]; edges: IdentityGraphEdge[] }> {
  return apiClient.get('/identity/graph', {
    nodes: mockIdentityGraphNodes,
    edges: mockIdentityGraphEdges,
  });
}

export async function fetchTargetProfile(): Promise<TargetProfile> {
  const local = localStorage.getItem('opsec_target_profile');
  const profile = local ? JSON.parse(local) : mockTargetProfile;
  return apiClient.get<TargetProfile>('/identity/profile', profile);
}

export async function saveTargetProfile(profile: TargetProfile): Promise<TargetProfile> {
  localStorage.setItem('opsec_target_profile', JSON.stringify(profile));
  return apiClient.post<TargetProfile, TargetProfile>('/identity/profile', profile, profile);
}
