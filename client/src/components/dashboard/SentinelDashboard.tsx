import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  UploadCloud,
  Network,
  Workflow,
  Radar,
  FlaskConical,
  FileCode2,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Menu,
} from 'lucide-react';

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

const workflowGroups: NavGroupData[] = [
  {
    heading: 'Assessment',
    items: [
      { id: 'upload', title: 'Upload Infrastructure', icon: UploadCloud, shortcut: '1' },
      { id: 'digital-twin', title: 'Digital Twin', icon: Network, shortcut: '2' },
      { id: 'knowledge-graph', title: 'Knowledge Graph', icon: Workflow, shortcut: '3' },
      { id: 'attack-paths', title: 'Attack Paths', icon: Radar, shortcut: '4' },
      { id: 'recommendations', title: 'AI Recommendations', icon: Sparkles, shortcut: '5' },
    ],
  },
  {
    heading: 'Verification',
    items: [
      { id: 'sandbox', title: 'Sandbox Verification', icon: FlaskConical, shortcut: '6' },
      { id: 'remediation', title: 'Remediation Code', icon: FileCode2, shortcut: '7' },
    ],
  },
  {
    heading: 'Reporting',
    items: [{ id: 'report', title: 'Executive Report', icon: FileText, shortcut: '8' }],
  },
];

const mockBottomItems: NavItemData[] = [
  { id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' },
  { id: 'logout', title: 'Log out', icon: LogOut },
];

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

function NavItem({
  item,
  activeId,
  onSelect,
  level = 0,
}: {
  item: NavItemData;
  activeId: string;
  onSelect: (id: string) => void;
  level?: number;
}) {
  const isActive = activeId === item.id;
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <div
        className={`group flex items-center justify-between rounded-[6px] px-2.5 py-[7px] transition-all duration-200 select-none ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={`h-[16px] w-[16px] transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}
            strokeWidth={1.5}
          />
          <span className="truncate text-[13px] tracking-wide">{item.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.shortcut && (
            <kbd className="hidden h-5 items-center justify-center rounded-[4px] border border-white/10 bg-zinc-900/80 px-1.5 font-mono text-[10px] font-medium text-zinc-400 shadow-xs group-hover:inline-flex">
              {item.shortcut}
            </kbd>
          )}
          {item.badge && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500/15 px-1.5 text-[10px] font-medium text-blue-400">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} strokeWidth={2} />
          )}
        </div>
      </div>

      {hasChildren && (
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="relative mt-0.5 flex min-h-0 flex-col gap-0.5 overflow-hidden">
            <div className="absolute bottom-0 top-0 border-l border-white/10" style={{ left: `${level * 12 + 17.5}px` }} />
            {item.children!.map((child) => (
              <NavItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const allItems = [...workflowGroups.flatMap((group) => group.items), ...mockBottomItems];
const flattenItems = (items: NavItemData[]): NavItemData[] => {
  return items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) acc.push(...flattenItems(item.children));
    return acc;
  }, [] as NavItemData[]);
};

const flatMockData = flattenItems(allItems);

const contentMap: Record<string, { title: string; description: string; stats: Array<{ label: string; value: string; trend: string }>; cards: Array<{ title: string; body: string; note: string }> }> = {
  upload: {
    title: 'Upload Infrastructure',
    description: 'Connect your repository or import a ZIP archive to build a digital twin of your environment.',
    stats: [
      { label: 'Assets Detected', value: '128', trend: '+12% this week' },
      { label: 'External Ports', value: '24', trend: '4 exposed' },
      { label: 'Critical Paths', value: '11', trend: '2 newly discovered' },
    ],
    cards: [
      { title: 'Repository Intake', body: 'GitHub cloning and artifact parsing complete. SentinelAI is ready to map your attack surface.', note: 'Latest sync: 2 mins ago' },
      { title: 'Threat Coverage', body: 'CVE, MITRE ATT&CK, and framework-specific recommendations are queued for analysis.', note: 'Ready for graph analysis' },
      { title: 'Recommended Next Step', body: 'Generate the digital twin and begin path analysis across the mapped services.', note: 'Auto-triggered on upload' },
    ],
  },
  'digital-twin': {
    title: 'Digital Twin',
    description: 'The system reconstructs your environment as a virtual replica with assets, software, services, and network relationships.',
    stats: [
      { label: 'Services Mapped', value: '47', trend: '7 internet-facing' },
      { label: 'Dependencies', value: '214', trend: '18 risky packages' },
      { label: 'Network Segments', value: '9', trend: '3 unsegmented' },
    ],
    cards: [
      { title: 'Environment Model', body: 'Applications, connectors, and hosts have been grouped into a living attack-surface graph.', note: 'Updated from latest scan' },
      { title: 'Business Context', body: 'Critical systems are ranked by customer impact, regulatory exposure, and operational dependency.', note: 'Auto-prioritized' },
      { title: 'Next Verification', body: 'Attack paths will now be computed from the verified graph and mapped to exploitability.', note: 'Ready' },
    ],
  },
  'knowledge-graph': {
    title: 'Knowledge Graph',
    description: 'Neo4j relationships connect assets, CVEs, MITRE techniques, and exploit paths into one explainable model.',
    stats: [
      { label: 'Nodes', value: '1,284', trend: 'Stable' },
      { label: 'Relationships', value: '3,521', trend: '+8% today' },
      { label: 'Critical Paths', value: '19', trend: '6 chain attacks' },
    ],
    cards: [
      { title: 'Graph Health', body: 'The graph is fully connected and ready for attack-path inference and policy scoring.', note: 'No integrity issues' },
      { title: 'Threat Intelligence', body: 'CVE metadata and ATT&CK tags have been attached to the relevant assets and services.', note: 'Updated hourly' },
      { title: 'Explainability', body: 'Each path explains the entry point, propagation method, and affected business asset.', note: 'Human-readable' },
    ],
  },
  'attack-paths': {
    title: 'Attack Paths',
    description: 'SentinelAI identifies the most likely and most impactful exploit chains that lead to privileged access.',
    stats: [
      { label: 'Highest Risk', value: 'RCE -> DB', trend: 'Critical' },
      { label: 'Avg. Path Length', value: '3 hops', trend: 'Short chain' },
      { label: 'Reachability', value: '68%', trend: 'Needs segmentation' },
    ],
    cards: [
      { title: 'Path 1', body: 'Internet → Apache → RCE → Internal Database', note: 'Exploitability: High' },
      { title: 'Path 2', body: 'VPN → Authentication Service → Token Replay → Admin Console', note: 'Exploitability: Medium' },
      { title: 'Path 3', body: 'Public S3 Bucket → Credentials Exposure → CI/CD Access', note: 'Exploitability: High' },
    ],
  },
  recommendations: {
    title: 'AI Recommendations',
    description: 'Blue-team reasoning turns the graph evidence into targeted, verifiable recommendations with estimated impact.',
    stats: [
      { label: 'Suggested Fixes', value: '7', trend: '3 ranked urgent' },
      { label: 'Risk Reduction', value: '54%', trend: 'Projected' },
      { label: 'Manual Approval', value: 'Required', trend: 'User-driven' },
    ],
    cards: [
      { title: 'Patch Apache', body: 'Upgrade the vulnerable service and block the known exploit chain at the edge.', note: 'Priority: P0' },
      { title: 'Restrict DB Access', body: 'Limit the database to only the required application tier and reduce lateral movement.', note: 'Priority: P1' },
      { title: 'Enable MFA', body: 'Reduce the chance of credential abuse across privileged admin access paths.', note: 'Priority: P1' },
    ],
  },
  sandbox: {
    title: 'Sandbox Verification',
    description: 'The red team replays the identified attacks inside a temporary sandbox before any change is approved.',
    stats: [
      { label: 'Attacks Run', value: '12', trend: '4 successful' },
      { label: 'Patch Verified', value: 'Yes', trend: 'On latest run' },
      { label: 'Runtime', value: '3m 18s', trend: 'Fast' },
    ],
    cards: [
      { title: 'Live Exploit Replay', body: 'Metasploit payloads and HTTP probing were executed in an isolated container with no production impact.', note: 'Container destroyed after test' },
      { title: 'Telemetry', body: 'Success/failure signals and shell output were captured for evidence-backed reporting.', note: 'Stored for review' },
      { title: 'Ready For Approval', body: 'Verified mitigations are now eligible to be converted into remediation scripts.', note: 'User approval required' },
    ],
  },
  remediation: {
    title: 'Remediation Code',
    description: 'Generate tailored scripts, configs, or playbooks that apply only the selected patches.',
    stats: [
      { label: 'Files Generated', value: '3', trend: 'Bash + Ansible' },
      { label: 'Patch Scope', value: '3 controls', trend: 'Selected by user' },
      { label: 'Export Format', value: 'ZIP', trend: 'Download ready' },
    ],
    cards: [
      { title: 'Ansible Playbook', body: 'A hardened deployment plan updates Apache, enforces MFA, and restricts DB exposure.', note: 'Ready to review' },
      { title: 'Firewall Script', body: 'A bash script blocks the exposed ingress path while preserving application uptime.', note: 'Portable' },
      { title: 'Diff Preview', body: 'Changes are rendered as a compact, reviewable patch before they are shared.', note: 'Production-safe' },
    ],
  },
  report: {
    title: 'Executive Report',
    description: 'A concise summary of findings, mitigations, verification status, and projected business risk reduction.',
    stats: [
      { label: 'Risk Before', value: '84', trend: 'High' },
      { label: 'Risk After', value: '39', trend: 'Medium' },
      { label: 'Improvement', value: '54%', trend: 'Verified' },
    ],
    cards: [
      { title: 'Executive Summary', body: 'The selected controls successfully blocked the major exploit chain and reduced the overall threat posture.', note: 'Prepared for leadership' },
      { title: 'Business Impact', body: 'Risk reduction is tied to customer exposure, critical functionality, and likely attack cost.', note: 'Evidence-backed' },
      { title: 'Next Action', body: 'Review the generated patch, export the artifacts, and deploy to production during the next approved window.', note: 'Recommended' },
    ],
  },
};

export default function SentinelDashboard() {
  const [activeId, setActiveId] = useState('upload');
  const [activeWorkspace, setActiveWorkspace] = useState('Acme Corp');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeItem = useMemo(() => flatMockData.find((item) => item.id === activeId), [activeId]);
  const activeTitle = activeItem ? activeItem.title : 'Dashboard';
  const currentContent = contentMap[activeId] || contentMap.upload;

  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return flatMockData.slice(0, 8);
    return flatMockData.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleSelect = (id: string) => {
    if (id === 'search') {
      setIsSearchOpen(true);
      return;
    }
    setActiveId(id);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05070a] text-white">
      <div className="grain-overlay" />
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.04)_0%,_rgba(255,255,255,0)_100%)] shadow-[0_0_80px_rgba(0,0,0,0.45)] md:flex-row">
        <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setIsSidebarOpen(false)} />

        <aside className={`fixed top-0 bottom-0 left-0 z-50 w-[86vw] max-w-[280px] shrink-0 border-r border-white/10 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-200 md:static md:z-auto md:h-screen md:w-[260px] md:border-r md:bg-zinc-950/80 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex h-full w-full flex-col p-3">
            <div className="mb-3 flex items-center justify-between md:hidden">
              <span className="text-sm font-medium text-white">Navigation</span>
              <button onClick={() => setIsSidebarOpen(false)} className="rounded-md p-1 text-zinc-400 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <WorkspaceSwitcher selected={activeWorkspace} onSelect={setActiveWorkspace} />

            <div className="mt-2 flex flex-1 flex-col gap-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:min-h-0">
              {workflowGroups.map((group, idx) => (
                <div key={`${group.heading}-${idx}`} className="flex flex-col gap-0.5">
                  {group.heading && <span className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{group.heading}</span>}
                  {group.items.map((item) => (
                    <NavItem key={item.id} item={item} activeId={activeId} onSelect={(id) => { handleSelect(id); setIsSidebarOpen(false); }} />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-0.5 border-t border-white/10 pt-4">
              {mockBottomItems.map((item) => (
                <NavItem key={item.id} item={item} activeId={activeId} onSelect={(id) => { handleSelect(id); setIsSidebarOpen(false); }} />
              ))}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.03)_0%,_rgba(255,255,255,0)_100%)]">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/70 px-4 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:hidden">
                <Menu className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="truncate">{activeWorkspace}</span>
                <span>/</span>
                <span className="truncate font-medium text-white">{activeTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setActiveId('upload');
                  setIsSearchOpen(false);
                }}
                className="hidden rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10 sm:inline-flex"
              >
                New Assessment
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="rounded-md border border-white/10 bg-white/5 p-2 text-zinc-300 transition-colors hover:bg-white/10"
              >
                <Search className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-blue-400">SentinelAI Workspace</p>
                <h2 className="text-2xl font-semibold text-white">{currentContent.title}</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">
                <Play className="h-4 w-4 text-blue-400" />
                Live workflow active
              </div>
            </div>

            <div className="mb-6 grid gap-4 xl:grid-cols-3">
              {currentContent.stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-sm backdrop-blur-xl">
                  <p className="text-[12px] uppercase tracking-[0.18em] text-zinc-400">{stat.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="text-2xl font-semibold text-white">{stat.value}</span>
                    <span className="text-xs text-blue-400">{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-sm backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{currentContent.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{currentContent.description}</p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 p-2 text-blue-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {currentContent.cards.map((card) => (
                    <div key={card.title} className="rounded-lg border border-white/10 bg-black/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{card.title}</p>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">{card.body}</p>
                        </div>
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-400" />
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">{card.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-sm backdrop-blur-xl sm:p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Recommended action
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Focus on the highest-impact control first, then validate it in the sandbox before exporting the remediation bundle.
                  </p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400">
                    Review Patch <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-sm backdrop-blur-xl sm:p-6">
                  <p className="text-sm font-medium text-white">Execution Timeline</p>
                  <div className="mt-4 space-y-4">
                    {[
                      ['Upload repository', 'Complete'],
                      ['Build digital twin', 'In progress'],
                      ['Run attack-path analysis', 'Queued'],
                      ['Generate verified patch', 'Pending'],
                    ].map(([label, status]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm">
                        <span className="text-zinc-400">{label}</span>
                        <span className="font-medium text-white">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center border-b border-white/10 px-4">
              <Search className="mr-3 h-[18px] w-[18px] shrink-0 text-zinc-500" strokeWidth={1.5} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="flex-1 bg-transparent py-4 text-[14px] text-white outline-none placeholder:text-zinc-500"
                placeholder="Search workflow pages, findings, or actions..."
              />
              <button onClick={() => setIsSearchOpen(false)} className="ml-3 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white">
                <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveId(item.id);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                  >
                    <span className="font-medium text-white">{item.title}</span>
                    <span className="text-zinc-500">Open</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">No matching workflow steps found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
