// Client-side pentest report export: JSON (full assessment) and CSV (findings table).
// PDF is handled via the browser print dialog on a print-optimized report layout.

import type { AttackPath, CVEEntry, Recommendation } from '../api/analyze';

export interface ReportData {
  twin: string | null;
  generated_at: string;
  risk_score_before: number;
  risk_score_after: number;
  risk_reduction_pct: number;
  verified_cves: string[];
  findings: CVEEntry[];
  attack_paths: AttackPath[];
  recommendations: Recommendation[];
}

export function buildReportData(params: {
  twin: string | null;
  riskBefore: number;
  riskAfter: number;
  reduction: number;
  verifiedCves: string[];
  findings: CVEEntry[];
  attackPaths: AttackPath[];
  recommendations: Recommendation[];
}): ReportData {
  return {
    twin: params.twin,
    generated_at: new Date().toISOString(),
    risk_score_before: params.riskBefore,
    risk_score_after: params.riskAfter,
    risk_reduction_pct: params.reduction,
    verified_cves: params.verifiedCves,
    findings: params.findings,
    attack_paths: params.attackPaths,
    recommendations: params.recommendations,
  };
}

function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string | null): string {
  return (name || 'assessment').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export function exportReportJson(data: ReportData): void {
  downloadBlob(`sentinelai-report-${slug(data.twin)}.json`, JSON.stringify(data, null, 2), 'application/json');
}

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportFindingsCsv(data: ReportData): void {
  const header = ['CVE', 'Severity', 'CVSS', 'CWE', 'MITRE ATT&CK', 'Sandbox Verified', 'Description'];
  const rows = data.findings.map((c) => [
    c.cve_id,
    c.severity,
    c.cvss_score ?? '',
    c.cwe ?? '',
    c.mitre_technique ? `${c.mitre_technique.id} ${c.mitre_technique.name}` : '',
    data.verified_cves.includes(c.cve_id) ? 'yes' : 'no',
    c.description ?? '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  downloadBlob(`sentinelai-findings-${slug(data.twin)}.csv`, csv, 'text/csv');
}
