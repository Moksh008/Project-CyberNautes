import { apiFetch } from './client';

export interface SelectResponse {
  twin_id: string;
  selected: string[];
  message: string;
}

export interface SandboxResult {
  cve_id: string;
  before_exploit_success: boolean;
  after_exploit_success: boolean;
  patch_verified: boolean;
  logs: string[];
}

export interface CodeGenResponse {
  twin_id: string;
  format: string;
  code: string;
}

export function selectRecommendations(
  twin_id: string,
  recommendation_ids: string[],
): Promise<SelectResponse> {
  return apiFetch<SelectResponse>('/api/remediation/select', {
    method: 'POST',
    body: JSON.stringify({ twin_id, recommendation_ids }),
  });
}

export function verifyCVE(cve_id: string, twin_id?: string): Promise<SandboxResult> {
  return apiFetch<SandboxResult>('/api/remediation/verify', {
    method: 'POST',
    body: JSON.stringify({ cve_id, twin_id }),
  });
}

export function generateCode(
  twin_id: string,
  recommendations: object[],
  format: 'bash' | 'ansible' | 'git_diff',
): Promise<CodeGenResponse> {
  return apiFetch<CodeGenResponse>('/api/remediation/generate', {
    method: 'POST',
    body: JSON.stringify({ twin_id, recommendations, format }),
  });
}
