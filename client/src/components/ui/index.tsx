// Shared UI primitives for the SentinelAI dashboard.
// Centralizes the card / badge / empty-state recipes that were previously
// copy-pasted across every view, plus the risk visualizations.

import type { ReactNode } from 'react';
import { ExternalLink, ShieldCheck, Target } from 'lucide-react';
import { cn } from '../../utils/cn';

export const CARD = 'rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(CARD, className)}>{children}</div>;
}

type BadgeTone = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'info' | 'neutral';

const BADGE_TONES: Record<BadgeTone, string> = {
  critical: 'bg-rose-950/80 border-rose-600 text-rose-300',
  high: 'bg-amber-950/80 border-amber-600 text-amber-300',
  medium: 'bg-sky-950/70 border-sky-700 text-sky-300',
  low: 'bg-zinc-800 border-zinc-700 text-zinc-300',
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  neutral: 'bg-white/5 border-white/10 text-zinc-300',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold', BADGE_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function severityTone(severity: string): BadgeTone {
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'high';
  if (severity === 'medium') return 'medium';
  return 'low';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn(CARD, 'p-12 text-center')}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-zinc-600">{icon}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-400">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={cn(CARD, 'p-4')}>
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
    </div>
  );
}

function riskColor(score: number): string {
  if (score >= 70) return '#f43f5e'; // rose-500
  if (score >= 40) return '#f59e0b'; // amber-500
  if (score >= 15) return '#38bdf8'; // sky-400
  return '#34d399'; // emerald-400
}

// Radial gauge for a 0-100 risk score.
export function RiskGauge({ score, size = 132 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color = riskColor(clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 700ms ease, stroke 400ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{clamped}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">/ 100</span>
      </div>
    </div>
  );
}

// Horizontal before/after risk comparison bar.
export function RiskBar({ before, after }: { before: number; after: number }) {
  const b = Math.max(0, Math.min(100, before));
  const a = Math.max(0, Math.min(100, after));
  return (
    <div className="space-y-3">
      {[
        { label: 'Before', value: b, color: riskColor(b) },
        { label: 'After', value: a, color: riskColor(a) },
      ].map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-xs text-zinc-400">{row.label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full"
              style={{ width: `${row.value}%`, backgroundColor: row.color, transition: 'width 700ms ease' }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-semibold text-white">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// Threat-intel enrichment card for a single CVE: CVSS breakdown, MITRE ATT&CK
// mapping, CWE, and public exploit / advisory references pulled from NVD.
export interface CveIntel {
  cve_id: string;
  severity: string;
  cvss_score?: number | null;
  cvss_vector?: string | null;
  cwe?: string | null;
  description?: string | null;
  references?: string[];
  mitre_technique?: { id: string; name: string } | null;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function CveIntelCard({ cve, verified }: { cve: CveIntel; verified?: boolean }) {
  return (
    <div className={cn(CARD, 'p-4 space-y-3')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">{cve.cve_id}</span>
          <Badge tone={severityTone(cve.severity)}>{cve.severity}</Badge>
          {verified && (
            <Badge tone="success"><ShieldCheck className="h-3 w-3" /> Sandbox-verified</Badge>
          )}
        </div>
        {typeof cve.cvss_score === 'number' && (
          <span className="font-mono text-xs text-zinc-300">
            CVSS <strong className="text-white">{cve.cvss_score.toFixed(1)}</strong>
          </span>
        )}
      </div>

      {cve.description && <p className="text-xs leading-relaxed text-zinc-400">{cve.description}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {cve.mitre_technique && (
          <Badge tone="info">
            <Target className="h-3 w-3" /> {cve.mitre_technique.id} · {cve.mitre_technique.name}
          </Badge>
        )}
        {cve.cwe && <Badge tone="neutral" className="font-mono">{cve.cwe}</Badge>}
      </div>

      {cve.cvss_vector && (
        <p className="font-mono text-[10px] text-zinc-500 break-all">{cve.cvss_vector}</p>
      )}

      {cve.references && cve.references.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {cve.references.map((url, i) => (
            <a
              key={`${url}-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-blue-300 hover:bg-white/10"
            >
              <ExternalLink className="h-3 w-3" /> {hostOf(url)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-agent orchestrator phase timeline (Recon -> Exploitation -> Remediation -> Report).
export interface AgentPhaseItem {
  id: string;
  title: string;
  status: string;
  summary: string;
  detail: string;
}

export function AgentPhaseTimeline({ phases }: { phases: AgentPhaseItem[] }) {
  return (
    <ol className="relative space-y-4 border-l border-white/10 pl-6">
      {phases.map((phase) => {
        const done = phase.status === 'complete';
        return (
          <li key={phase.id} className="relative">
            <span
              className={cn(
                'absolute -left-[27px] flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-zinc-950',
                done ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse',
              )}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{phase.title}</span>
              <Badge tone={done ? 'success' : 'medium'} className="uppercase">{phase.status}</Badge>
            </div>
            {phase.summary && <p className="mt-1 text-xs text-zinc-300 leading-relaxed">{phase.summary}</p>}
            {phase.detail && (
              <p className="mt-1 rounded-lg border border-white/5 bg-white/[0.03] p-2 text-[11px] italic text-zinc-400">
                <span className="not-italic font-semibold text-purple-300">Deep Think: </span>{phase.detail}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Attack-path hop chain: nodes joined by labelled connectors (replaces ASCII "--[RCE]--▶").
export function HopChain({ nodes, edgeLabel = 'RCE' }: { nodes: string[]; edgeLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-y-2">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center">
          <span className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-200 shadow-sm">
            {node}
          </span>
          {i < nodes.length - 1 && (
            <span className="mx-1.5 flex items-center gap-1 text-rose-500">
              <span className="h-px w-4 bg-rose-500/50" />
              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-400">{edgeLabel}</span>
              <span className="text-xs">▶</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
