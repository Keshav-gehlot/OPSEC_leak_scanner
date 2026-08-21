import { BaselineComparison } from '../types';
import { apiClient } from './client';
import { mockBaselineComparison } from './mockData';

export async function fetchBaselineComparison(): Promise<BaselineComparison> {
  return apiClient.get<BaselineComparison>('/baseline', mockBaselineComparison);
}

export async function updateBaselineSnapshot(): Promise<{ success: boolean; timestamp: string }> {
  return apiClient.post('/baseline/update', {}, {
    success: true,
    timestamp: new Date().toISOString(),
  });
}
