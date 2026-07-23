import { apiFetch } from './client';

export interface MitreTechnique {
  id: string;
  name: string;
}

export interface CVEEntry {
  cve_id: string;
  severity: string;
  cvss_score?: number | null;
  cvss_vector?: string | null;
  cwe?: string | null;
  description?: string | null;
  references?: string[];
  mitre_technique?: MitreTechnique | null;
}

export interface AttackPath {
  entry_id: string;
  entry_name: string;
  target_id: string;
  target_name: string;
  path: string[];
  hops: number;
  risk_score: number;
  cves: CVEEntry[];
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  estimated_impact: string;
  priority: string;
}

export interface OffenseAnalysis {
  entry_point: string;
  exploit_chain: string;
  assets_at_risk: string[];
  strategic_assessment?: string;
}

export interface AgentPhase {
  id: string;
  title: string;
  status: string;
  summary: string;
  detail: string;
}

export interface ReportOutput {
  executive_summary: string;
  risk_posture?: string;
  key_findings?: string[];
  attack_narrative?: string;
  business_impact: string;
  remediation_roadmap?: string[];
  compliance_notes?: string;
  next_steps?: string[];
}

export interface AnalyzeResponse {
  twin_id: string;
  risk_score: number;
  attack_paths: AttackPath[];
  offense_analysis: OffenseAnalysis | null;
  recommendations: Recommendation[];
  report: ReportOutput | null;
  agent_phases?: AgentPhase[];
}

export interface RecomputeResponse {
  twin_id: string;
  excluded_cves: string[];
  risk_score: number;
  attack_paths: AttackPath[];
}

export function triggerAnalysis(twin_id: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>('/api/analyze/trigger', {
    method: 'POST',
    body: JSON.stringify({ twin_id }),
  });
}

export function recomputeRisk(twin_id: string, excluded_cves: string[]): Promise<RecomputeResponse> {
  return apiFetch<RecomputeResponse>('/api/analyze/recompute', {
    method: 'POST',
    body: JSON.stringify({ twin_id, excluded_cves }),
  });
}

export function refreshThreatIntel(twin_id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/analyze/threat-intel/${twin_id}`);
}
