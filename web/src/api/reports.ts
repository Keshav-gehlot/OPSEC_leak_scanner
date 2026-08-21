import { ReportItem } from '../types';
import { apiClient } from './client';
import { mockReports } from './mockData';

export async function fetchReports(): Promise<ReportItem[]> {
  return apiClient.get<ReportItem[]>('/reports', mockReports);
}

export async function triggerReportGeneration(format: 'HTML' | 'PDF' | 'JSON' | 'SARIF'): Promise<ReportItem> {
  const newReport: ReportItem = {
    id: `rep-${Date.now()}`,
    title: `OPSEC Audit ${format} Export`,
    format,
    generatedAt: new Date().toLocaleString(),
    size: '28.4 KB',
    description: `Generated on-demand export for ${format} schema compliance.`,
    downloadFilename: `opsec_report_${Date.now()}.${format.toLowerCase()}`,
  };

  return apiClient.post('/reports/generate', { format }, newReport);
}
