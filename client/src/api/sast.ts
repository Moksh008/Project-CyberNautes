import { apiFetch } from './client';

export interface SastFinding {
  id: string;
  file: string;
  line: number;
  type: 'vulnerability' | 'bug' | 'code_smell' | 'security_hotspot';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rule: string;
  message: string;
  effort: string;
  language: string;
}

export interface SastSummary {
  project_key: string;
  total_issues: number;
  vulnerabilities: number;
  bugs: number;
  code_smells: number;
  security_hotspots: number;
  findings: SastFinding[];
}

export async function runSastScan(repoUrl: string): Promise<SastSummary> {
  return apiFetch<SastSummary>(`/api/sast/scan?repo_url=${encodeURIComponent(repoUrl)}`);
}
