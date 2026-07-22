import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UploadCloud,
  Network,
  Radar,
  Sparkles,
  FlaskConical,
  FileCode2,
  FileText,
  ChevronDown,
  X,
  Menu,
  Check,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { reset as resetAssessment } from '../../store/slices/assessmentSlice';
import { reset as resetRemediation } from '../../store/slices/remediationSlice';
import { clearResults as clearSandbox } from '../../store/slices/sandboxSlice';
import { WorkspaceView } from './views/WorkspaceView';

type Stage = {
  id: string;
  title: string;
  icon: React.ElementType;
  done: boolean;
};

function WorkspaceSwitcher({ selected, onSelect }: { selected?: string; onSelect?: (ws: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState('Acme Corp');

  const current = selected || internalSelected;
  const handleSelect = onSelect || setInternalSelected;

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="mb-4 flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-blue-500 font-semibold text-[13px] text-white shadow-sm">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="mb-1 truncate text-[13px] font-medium leading-none text-white">{current}</span>
            <span className="text-[11px] leading-none text-zinc-400">Pro Plan</span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-colors hover:text-zinc-300" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-[52px] z-50 flex w-full flex-col gap-0.5 rounded-lg border border-white/10 bg-zinc-950/95 py-1 shadow-xl">
            {['Acme Corp', 'Personal Workspace', 'Client Sandbox'].map((ws) => (
              <div
                key={ws}
                onClick={() => {
                  handleSelect(ws);
                  setIsOpen(false);
                }}
                className={`mx-1 rounded-md px-3 py-2 text-[13px] transition-colors ${current === ws ? 'bg-blue-500/15 font-medium text-blue-400' : 'cursor-pointer text-zinc-300 hover:bg-white/5'}`}
              >
                {ws}
              </div>
            ))}
            <div className="mx-2 my-1 h-px bg-white/10" />
            <div className="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-400 transition-colors hover:bg-white/5">
              <span className="mb-0.5 text-[16px] leading-none">+</span> Create Workspace
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Read-only progress tracker reflecting real assessment state — replaces the
// old click-to-switch tab navigation now that results stream into one page.
function StageTracker({ stages, activeStage }: { stages: Stage[]; activeStage: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      {stages.map((stage, idx) => {
        const isCurrent = idx === activeStage;
        return (
          <div
            key={stage.id}
            className={`flex items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] text-[13px] transition-colors ${isCurrent ? 'bg-white/10 text-white' : stage.done ? 'text-zinc-300' : 'text-zinc-500'}`}
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {stage.done ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
              ) : isCurrent ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" strokeWidth={2} />
              ) : (
                <stage.icon className="h-[15px] w-[15px] text-zinc-600" strokeWidth={1.5} />
              )}
            </span>
            <span className="truncate">{stage.title}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function SentinelDashboard() {
  const dispatch = useAppDispatch();
  const [activeWorkspace, setActiveWorkspace] = useState('Acme Corp');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { status, twinId, attackPaths, recommendations, verifiedCves, report } = useAppSelector((state) => state.assessment);
  const { selectionSaved } = useAppSelector((state) => state.remediation);

  const engine =
    status === 'ingesting' || status === 'analyzing'
      ? { label: 'Engine Working…', dot: 'bg-amber-400', text: 'text-amber-300', pulse: true }
      : status === 'done'
      ? { label: 'Assessment Active', dot: 'bg-emerald-400', text: 'text-emerald-300', pulse: true }
      : status === 'error'
      ? { label: 'Engine Error', dot: 'bg-rose-500', text: 'text-rose-300', pulse: false }
      : { label: 'Engine Idle', dot: 'bg-zinc-500', text: 'text-zinc-400', pulse: false };

  const stages: Stage[] = [
    { id: 'upload', title: 'Upload Infrastructure', icon: UploadCloud, done: !!twinId },
    { id: 'twin', title: 'Digital Twin & Graph', icon: Network, done: !!twinId },
    { id: 'paths', title: 'Attack Paths', icon: Radar, done: attackPaths.length > 0 },
    { id: 'recs', title: 'AI Recommendations', icon: Sparkles, done: recommendations.length > 0 },
    { id: 'sandbox', title: 'Sandbox Verification', icon: FlaskConical, done: verifiedCves.length > 0 },
    { id: 'remediation', title: 'Remediation Code', icon: FileCode2, done: selectionSaved },
    { id: 'report', title: 'Executive Report', icon: FileText, done: !!report },
  ];
  const activeStage = stages.findIndex((s) => !s.done);

  const handleNewAssessment = () => {
    dispatch(resetAssessment());
    dispatch(resetRemediation());
    dispatch(clearSandbox());
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05070a] text-white">
      <div className="grain-overlay no-print" />
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.04)_0%,_rgba(255,255,255,0)_100%)] shadow-[0_0_80px_rgba(0,0,0,0.45)] md:flex-row">
        <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden no-print ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setIsSidebarOpen(false)} />

        <aside className={`fixed top-0 bottom-0 left-0 z-50 w-[86vw] max-w-[280px] shrink-0 border-r border-white/10 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-200 md:static md:z-auto md:h-screen md:w-[260px] md:border-r md:bg-zinc-950/80 no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex h-full w-full flex-col p-3">
            <div className="mb-3 flex items-center justify-between md:hidden">
              <span className="text-sm font-medium text-white">Navigation</span>
              <button onClick={() => setIsSidebarOpen(false)} className="rounded-md p-1 text-zinc-400 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <WorkspaceSwitcher selected={activeWorkspace} onSelect={setActiveWorkspace} />

            <div className="mt-2 flex flex-1 flex-col gap-1">
              <span className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Assessment Progress</span>
              <StageTracker stages={stages} activeStage={activeStage} />
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.03)_0%,_rgba(255,255,255,0)_100%)]">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/70 px-4 backdrop-blur-xl no-print">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:hidden">
                <Menu className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="truncate">{activeWorkspace}</span>
                <span>/</span>
                <span className="truncate font-medium text-white">Workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleNewAssessment}
                className="hidden rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10 sm:inline-flex"
              >
                New Assessment
              </button>
              <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-blue-400">SentinelAI Workspace</p>
                <h2 className="text-2xl font-semibold text-white">Cyber Defense Twin</h2>
              </div>
              <div className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm ${engine.text}`}>
                <span className={`h-2 w-2 rounded-full ${engine.dot} ${engine.pulse ? 'animate-pulse' : ''}`} />
                {engine.label}
              </div>
            </div>

            <WorkspaceView />
          </div>
        </main>
      </div>
    </div>
  );
}
