import { DomainIntelligence } from '../types';
import { apiClient } from './client';
import { mockDomainIntelligence } from './mockData';

export async function fetchDomainIntelligence(): Promise<DomainIntelligence[]> {
  return apiClient.get<DomainIntelligence[]>('/intelligence/domains', mockDomainIntelligence);
}
