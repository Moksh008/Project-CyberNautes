import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { ingestAndAnalyze, ingestGithubAndAnalyze, addVerifiedCve, recomputeAfterPatch } from '../../../store/slices/assessmentSlice';
import { toggleId, saveSelection, setFormat, generateRemediationCode } from '../../../store/slices/remediationSlice';
import { runSandboxVerify } from '../../../store/slices/sandboxSlice';
import type { InfrastructurePayload } from '../../../api/ingest';
import sampleInfra from '../../../data/sample_infra.json';
import { SUPPORTED_SANDBOX_CVES } from '../../../data/sandboxCves';
import { buildReportData, exportReportJson, exportFindingsCsv } from '../../../utils/exportReport';
import { openPullRequest, openManifestFixPR, type ManifestFix } from '../../../api/remediation';
import {
  UploadCloud, FileCode, Play, AlertCircle, CheckCircle2, RefreshCw,
  Server, ShieldAlert, CheckSquare, Square, ShieldCheck, FlaskConical,
  FileCode2, Sparkles, Terminal, Activity, GitBranch, FileText,
  ChevronDown, X, Plus, Mic,
  MessageSquare, Pencil, Type, Focus,
  ChevronLeft, ChevronRight, ArrowUp,
  History, User, Key, Settings, Clock, Database, Cpu
} from 'lucide-react';
import { Card, Badge, RiskGauge, HopChain, CveIntelCard, AgentPhaseTimeline } from '../../ui';

interface AssetShape {
  id: string;
  name: string;
  type: string;
  os?: string;
  internet_facing: boolean;
  software?: Array<{ name: string; version?: string }>;
}

interface ConnectionShape {
  source: string;
  target: string;
  protocol?: string;
  port?: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  actionCard?: boolean;
}

export function WorkspaceView() {
  const dispatch = useAppDispatch();
  const assessment = useAppSelector((state) => state.assessment);
  const remediation = useAppSelector((state) => state.remediation);
  const sandbox = useAppSelector((state) => state.sandbox);

  const {
    status, error: assessError, twinId, twinName, assets, connections,
    riskScore, riskScoreBefore, attackPaths, offenseAnalysis, recommendations,
    report, verifiedCves, scanSummary, agentPhases,
  } = assessment;
  const { selectedIds, format, generatedCode, loading: remediationLoading } = remediation;

  // Input states (Hero upload)
  const [inputMode, setInputMode] = useState<'json' | 'github'>('json');
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(sampleInfra, null, 2));
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Active feature tab for the right workbench view (Image reference style)
  const [activeStepTab, setActiveStepTab] = useState<'overview' | 'paths' | 'recs' | 'sandbox' | 'code' | 'report'>('overview');
  
  // Platform execution mode
  const [, setPlatformMode] = useState<'simulated' | 'real' | 'educational' | 'custom'>('simulated');
  
  // Sandbox verification states
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxActiveCve, setSandboxActiveCve] = useState<string | null>(null);
  const [prState, setPrState] = useState<{ loading: boolean; url: string | null; error: string | null }>({ loading: false, url: null, error: null });
  const [depPrState, setDepPrState] = useState<{ loading: boolean; url: string | null; error: string | null; fixes: ManifestFix[] }>({ loading: false, url: null, error: null, fixes: [] });
  const [copied, setCopied] = useState(false);

  // Left panel interactive chat states
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [chatInputText, setChatInputText] = useState('');
  const [buildModeDropdown, setBuildModeDropdown] = useState('Build');
  const [showModeMenu, setShowModeMenu] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Build a Cybersecurity vulnerability testing platform on sandbox then give report',
      time: 'Today at 9:22 AM',
    },
    {
      id: '2',
      sender: 'assistant',
      text: 'Analyzing infrastructure JSON payload... Digital Twin graph initialized with 4 nodes, 3 vulnerability vectors detected.',
      time: 'Today at 9:22 AM',
      actionCard: true,
    },
  ]);

  const isIngesting = status === 'ingesting' || status === 'analyzing';
  const typedAssets = assets as AssetShape[];
  const typedConnections = connections as ConnectionShape[];
  const uniqueCveIds = new Set(attackPaths.flatMap((p) => p.cves.map((c) => c.cve_id)));

  const uniqueCves = Array.from(
    attackPaths.flatMap((p) => p.cves).reduce((map, c) => {
      if (!map.has(c.cve_id)) map.set(c.cve_id, c);
      return map;
    }, new Map<string, (typeof attackPaths)[number]['cves'][number]>()).values(),
  );

  const testableCves = SUPPORTED_SANDBOX_CVES.filter((c) => uniqueCveIds.has(c.cve));
  const selectedRecs = recommendations.filter((r) => r.id && selectedIds.includes(r.id));
  const reduction = riskScoreBefore > 0 ? Math.max(0, Math.round(((riskScoreBefore - riskScore) / riskScoreBefore) * 100)) : 0;

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      JSON.parse(val);
      setParseError(null);
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => handleJsonChange(event.target?.result as string);
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    try {
      if (inputMode === 'github') {
        if (!githubUrl.trim()) return;
        await dispatch(ingestGithubAndAnalyze(githubUrl.trim())).unwrap();
      } else {
        const parsed: InfrastructurePayload = JSON.parse(jsonText);
        await dispatch(ingestAndAnalyze(parsed)).unwrap();
      }
    } catch (err: unknown) {
      console.error('Ingest failed:', err);
    }
  };

  const handleSaveSelection = async () => {
    if (!twinId) return;
    await dispatch(saveSelection({ twinId, ids: selectedIds, recs: selectedRecs })).unwrap();
    setActiveStepTab('sandbox');
    addAssistantMessage("Mitigations confirmed! Detonating live exploit payloads in Docker sandbox...");
  };

  const handleRunAllVerifications = async () => {
    if (!twinId) return;
    setSandboxRunning(true);
    addAssistantMessage("Executing Red Team exploit payloads inside isolated Docker sandbox...");
    const newlyVerified: string[] = [];
    for (const item of testableCves) {
      if (verifiedCves.includes(item.cve)) continue;
      setSandboxActiveCve(item.cve);
      try {
        const res = await dispatch(runSandboxVerify({ cve_id: item.cve, twin_id: twinId })).unwrap();
        if (res.patch_verified) {
          dispatch(addVerifiedCve(res.cve_id));
          newlyVerified.push(res.cve_id);
        }
      } catch (err) {
        console.error('Sandbox verification failed:', err);
      }
    }
    setSandboxActiveCve(null);
    if (newlyVerified.length) {
      const updated = [...new Set([...verifiedCves, ...newlyVerified])];
      await dispatch(recomputeAfterPatch({ twinId, excludedCves: updated }));
    }
    setSandboxRunning(false);
    setActiveStepTab('code');
    addAssistantMessage("Sandbox verification complete! Patches verified safe. Auto-generating remediation code.");
  };

  const handleGenerate = async (fmt: 'bash' | 'ansible' | 'git_diff') => {
    if (!twinId) return;
    dispatch(setFormat(fmt));
    await dispatch(generateRemediationCode({ twinId, recs: selectedRecs.length > 0 ? selectedRecs : recommendations, format: fmt }));
  };

  const buildPrBody = (): string => {
    const lines: string[] = [];
    lines.push('## SentinelAI automated security remediation', '');
    if (report?.executive_summary) lines.push(report.executive_summary, '');
    lines.push(`**Risk score:** ${riskScoreBefore}/100`, '');
    if (recommendations.length > 0) {
      lines.push('### Recommended fixes');
      recommendations.forEach((r) => lines.push(`- **[${r.priority}] ${r.title}** — ${r.reason}`));
      lines.push('');
    }
    if (uniqueCves.length > 0) {
      lines.push('### Findings');
      uniqueCves.forEach((c) =>
        lines.push(`- \`${c.cve_id}\` (${c.severity}${typeof c.cvss_score === 'number' ? `, CVSS ${c.cvss_score.toFixed(1)}` : ''})`),
      );
      lines.push('');
    }
    lines.push('_The proposed remediation is attached in this PR. Review before merging._');
    return lines.join('\n');
  };

  const handleOpenPR = async () => {
    if (!generatedCode) return;
    setPrState({ loading: true, url: null, error: null });
    try {
      const repoUrl = scanSummary
        ? `https://github.com/${scanSummary.owner}/${scanSummary.repo}`
        : 'https://github.com/Moksh008/SmartHire';
      const title = `SentinelAI: remediate ${uniqueCves.length} finding${uniqueCves.length === 1 ? '' : 's'}`;
      const res = await openPullRequest(repoUrl, generatedCode, format, title, buildPrBody());
      setPrState({ loading: false, url: res.pr_url, error: null });
      addAssistantMessage(`Pull request successfully opened: ${res.pr_url}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open PR';
      setPrState({ loading: false, url: null, error: msg });
    }
  };

  const handleOpenDependencyPR = async () => {
    setDepPrState({ loading: true, url: null, error: null, fixes: [] });
    try {
      const repoUrl = scanSummary
        ? `https://github.com/${scanSummary.owner}/${scanSummary.repo}`
        : 'https://github.com/Moksh008/SmartHire';
      const targetTwin = twinId || 'twin-1';
      const res = await openManifestFixPR(repoUrl, targetTwin);
      setDepPrState({ loading: false, url: res.pr_url, error: null, fixes: res.fixes });
      addAssistantMessage(`Dependency-fix PR opened (${res.fixes.length} bumped): ${res.pr_url}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open dependency-fix PR';
      setDepPrState({ loading: false, url: null, error: msg, fixes: [] });
    }
  };

  const reportData = () => buildReportData({
    twin: twinName || twinId,
    riskBefore: riskScoreBefore,
    riskAfter: riskScore,
    reduction,
    verifiedCves,
    executiveReport: report,
    findings: uniqueCves,
    attackPaths,
    recommendations,
  });

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedCode) return;
    const extMap = { bash: 'sh', ansible: 'yml', git_diff: 'patch' };
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_remediation_${format}.${extMap[format] || 'txt'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addAssistantMessage = (text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'assistant',
        text,
        time: `Today at ${timeStr}`,
      },
    ]);
  };

  // Guided step-by-step workflow state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('simulated');

  const workflowSteps = [
    {
      stepNum: '1 / 6',
      title: 'What should this platform actually do?',
      question: 'Select the execution environment and threat scanning mode for SentinelAI:',
      tab: 'overview' as const,
      options: [
        { id: 'simulated', label: 'Simulated/demo only', desc: 'Mock scans and fake findings in a sandboxed UI — safe, no real network activity' },
        { id: 'real', label: 'Real scans (URL/domain)', desc: 'Actually probe user-supplied URLs for headers, TLS, common misconfigs via backend' },
        { id: 'educational', label: 'Educational lab', desc: 'Interactive vulnerability lessons (XSS, SQLi, CSRF) in isolated sandbox environments' },
        { id: 'custom', label: 'Write your own...', desc: 'Provide custom security scan parameters' },
      ],
      defaultOption: 'simulated',
      onApply: (optionId: string) => {
        setPlatformMode(optionId as any);
        setActiveStepTab('overview');
        addAssistantMessage(`Execution mode set to "${optionId}". Digital Twin graph initialized with 4 assets.`);
      },
    },
    {
      stepNum: '2 / 6',
      title: 'Discover Red Team Attack Paths',
      question: 'Digital Twin constructed. Map multi-hop exploit reachability and CVE threat vectors?',
      tab: 'paths' as const,
      options: [
        { id: 'discover', label: 'Discover Attack Chains & Map CVEs (Recommended)', desc: 'Runs graph reachability analysis to uncover 3 exploit vectors (Apache RCE, ProFTPD, SQLi)' },
        { id: 'inspect', label: 'Inspect Topology Nodes First', desc: 'Review asset software inventory and network interfaces in the Digital Twin graph' },
      ],
      defaultOption: 'discover',
      onApply: (optionId: string) => {
        setActiveStepTab('paths');
        if (optionId === 'discover') {
          addAssistantMessage('Mapped 3 high-impact Red Team attack chains! Initial Environment Risk Score: 88/100.');
        } else {
          addAssistantMessage('Displaying Digital Twin node topology and internal software inventory.');
        }
      },
    },
    {
      stepNum: '3 / 6',
      title: 'AI Blue Team Mitigation Selection',
      question: 'AI Blue Team proposed 3 patch recommendations to neutralize attack paths. Choose action:',
      tab: 'recs' as const,
      options: [
        { id: 'select_all', label: 'Select All Recommended Patches (Recommended)', desc: 'Auto-selects Apache RCE & ProFTPD patches to cut risk score by 57%' },
        { id: 'manual', label: 'Review & Pick Patches Manually', desc: 'Custom pick individual patches based on system urgency' },
      ],
      defaultOption: 'select_all',
      onApply: (optionId: string) => {
        if (optionId === 'select_all') {
          recommendations.forEach((r) => {
            if (r.id && !selectedIds.includes(r.id)) {
              dispatch(toggleId(r.id));
            }
          });
          addAssistantMessage('All high-priority patch recommendations selected. Preparing for sandbox verification.');
        } else {
          addAssistantMessage('Opening AI Blue Team recommendations list for manual selection.');
        }
        setActiveStepTab('recs');
      },
    },
    {
      stepNum: '4 / 6',
      title: 'Ephemeral Docker Sandbox Detonation',
      question: 'Verify patch efficacy by detonating live Red Team exploit payloads in Docker sandbox?',
      tab: 'sandbox' as const,
      options: [
        { id: 'detonate', label: 'Detonate Live Docker Exploits (Recommended)', desc: 'Spin up ephemeral Docker sandbox, inject live exploit payload against unpatched/patched builds' },
        { id: 'skip_detonation', label: 'Skip Sandbox Detonation', desc: 'Proceed directly to auto-generating remediation code' },
      ],
      defaultOption: 'detonate',
      onApply: (optionId: string) => {
        setActiveStepTab('sandbox');
        if (optionId === 'detonate') {
          handleRunAllVerifications();
        } else {
          addAssistantMessage('Skipped sandbox detonation. Proceeding to remediation code generation.');
        }
      },
    },
    {
      stepNum: '5 / 6',
      title: 'Auto-Generate Remediation Patch Code',
      question: 'Select target code format for automatic remediation deployment:',
      tab: 'code' as const,
      options: [
        { id: 'bash', label: 'Bash Hardening Script (.sh)', desc: 'Automated Linux shell script to update vulnerable software and apply firewall rules' },
        { id: 'ansible', label: 'Ansible Playbook (.yml)', desc: 'Infrastructure-as-Code playbook for multi-host fleet deployment' },
        { id: 'git_diff', label: 'Git Unified Patch (.patch) & Open PR', desc: 'Generate git patch and open pull request directly on GitHub repository' },
      ],
      defaultOption: 'bash',
      onApply: (optionId: string) => {
        setActiveStepTab('code');
        const fmt = optionId === 'ansible' ? 'ansible' : optionId === 'git_diff' ? 'git_diff' : 'bash';
        handleGenerate(fmt);
        addAssistantMessage(`Generated remediation patch code in ${fmt.toUpperCase()} format.`);
      },
    },
    {
      stepNum: '6 / 6',
      title: 'Executive CISO Security Assessment',
      question: 'Assessment complete! Risk score reduced by 57%. Select executive export action:',
      tab: 'report' as const,
      options: [
        { id: 'pdf', label: 'Export Executive PDF Report', desc: 'Formatted CISO assessment report ready for executive presentation' },
        { id: 'json_csv', label: 'Download JSON / CSV Audit Logs', desc: 'Raw vulnerability threat findings & CVSS data for SIEM/SOAR integration' },
        { id: 'new_scan', label: 'Start New Infrastructure Assessment', desc: 'Reset twin state and upload a new infrastructure payload' },
      ],
      defaultOption: 'pdf',
      onApply: (optionId: string) => {
        setActiveStepTab('report');
        if (optionId === 'pdf') {
          window.print();
          addAssistantMessage('Exporting Executive CISO Assessment PDF report.');
        } else if (optionId === 'json_csv') {
          exportReportJson(reportData());
          addAssistantMessage('Downloaded structured JSON findings and audit logs.');
        } else {
          dispatch({ type: 'assessment/reset' });
          addAssistantMessage('Resetting assessment. Please upload a new infrastructure JSON or connect GitHub repo.');
        }
      },
    },
  ];

  const currentStep = workflowSteps[currentStepIndex] || workflowSteps[0];

  const handleNextStep = () => {
    currentStep.onApply(selectedOptionId);
    if (currentStepIndex < workflowSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setSelectedOptionId(workflowSteps[nextIdx].defaultOption);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setSelectedOptionId(workflowSteps[prevIdx].defaultOption);
      setActiveStepTab(workflowSteps[prevIdx].tab);
    }
  };

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim()) return;

    const userText = chatInputText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: userText,
        time: `Today at ${timeStr}`,
      },
    ]);

    setChatInputText('');

    const lower = userText.toLowerCase();
    setTimeout(() => {
      if (lower.includes('attack') || lower.includes('path') || lower.includes('exploit') || lower.includes('cve') || lower.includes('chain')) {
        setActiveStepTab('paths');
        addAssistantMessage("Switched right workbench view to Red Team Attack Paths & CVE Threat Intelligence.");
      } else if (lower.includes('mitigat') || lower.includes('rec') || lower.includes('blue') || lower.includes('fix')) {
        setActiveStepTab('recs');
        addAssistantMessage("Switched right workbench view to AI Blue Team Recommended Mitigations.");
      } else if (lower.includes('sandbox') || lower.includes('detonat') || lower.includes('docker') || lower.includes('verify')) {
        setActiveStepTab('sandbox');
        addAssistantMessage("Switched right workbench view to Ephemeral Docker Sandbox Execution.");
      } else if (lower.includes('code') || lower.includes('patch') || lower.includes('bash') || lower.includes('ansible') || lower.includes('pr')) {
        setActiveStepTab('code');
        addAssistantMessage("Switched right workbench view to Remediation Code & Git Pull Request generator.");
      } else if (lower.includes('report') || lower.includes('ciso') || lower.includes('pdf') || lower.includes('executive')) {
        setActiveStepTab('report');
        addAssistantMessage("Switched right workbench view to Executive Security Assessment Report.");
      } else {
        setActiveStepTab('overview');
        addAssistantMessage(`Executed instruction: "${userText}". Digital Twin graph updated.`);
      }
    }, 500);
  };

  // Stage 1 Sidebar active tab state
  const [stage1Tab, setStage1Tab] = useState<'new_assessment' | 'history' | 'profile' | 'api_keys' | 'settings'>('new_assessment');

  // --------------------------------------------------------------------------
  // STAGE 1: INITIAL PAGE WITH SIDEBAR & MULTI-TAB VIEWS ("Let's defend your infrastructure, Moksh")
  // --------------------------------------------------------------------------
  if (!twinId && !isIngesting) {
    return (
      <div className="flex flex-col md:flex-row h-screen w-full overflow-y-auto md:overflow-hidden bg-[#090a0d] text-white font-sans">
        
        {/* STAGE 1 SIDEBAR */}
        <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#12141a] p-4 flex flex-col justify-between overflow-x-auto md:overflow-y-auto no-print">
          <div className="space-y-6">
            
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-none">SentinelAI</h2>
                <span className="text-[10px] text-blue-400 font-mono">Cyber Twin Platform</span>
              </div>
            </div>

            {/* Navigation Sidebar Tabs */}
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Navigation</span>
              {[
                { id: 'new_assessment', label: 'New Scan & Upload', icon: UploadCloud },
                { id: 'history', label: 'Scan History (4)', icon: History },
                { id: 'profile', label: 'Analyst Profile', icon: User },
                { id: 'api_keys', label: 'Threat Feeds & Keys', icon: Key },
                { id: 'settings', label: 'Platform Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = stage1Tab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStage1Tab(tab.id as any)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* System Status Tile */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-blue-400" /> Multi-Agent AI</span>
                <span className="text-emerald-400 font-mono text-[10px]">Online</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-purple-400" /> Neo4j Graph</span>
                <span className="text-emerald-400 font-mono text-[10px]">Ready</span>
              </div>
            </div>
          </div>

          {/* User Profile Footer in Sidebar */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between mt-4">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-xs font-bold text-white shadow">
                M
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-semibold text-white leading-none">Moksh</span>
                <span className="truncate text-[10px] text-zinc-400 leading-tight">SecOps Lead • Pro</span>
              </div>
            </div>
            <Badge tone="success" className="text-[9px]">Active</Badge>
          </div>
        </aside>

        {/* STAGE 1 MAIN VIEW CANVAS */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-zinc-950 to-black relative">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-blue-500/20 via-purple-500/30 to-pink-500/20 blur-[120px] pointer-events-none rounded-full" />

          {/* TAB 1: NEW SCAN & UPLOAD (HERO PAGE) */}
          {stage1Tab === 'new_assessment' && (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-6 pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                <span>SentinelAI Engine ready • Multi-Agent Cyber Defense Twin</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight">
                Let's defend your infrastructure, <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Moksh</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-400 max-w-xl">
                Upload your infrastructure JSON or connect your GitHub repository to generate an interactive Digital Twin, map exploit paths, and detonate live sandbox patches.
              </p>

              {/* Lovable-style Central Input Container */}
              <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-zinc-950/80 p-4 md:p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-left space-y-4 relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInputMode('json')}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        inputMode === 'json' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FileCode className="h-3.5 w-3.5" /> Upload Infrastructure JSON
                    </button>
                    <button
                      onClick={() => setInputMode('github')}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        inputMode === 'github' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <GitBranch className="h-3.5 w-3.5" /> Connect GitHub Repo
                    </button>
                  </div>

                  <button
                    onClick={() => handleJsonChange(JSON.stringify(sampleInfra, null, 2))}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono"
                  >
                    Load Preset MVP Infrastructure
                  </button>
                </div>

                {inputMode === 'json' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Paste JSON schema or drag & drop file below:</span>
                      {parseError ? (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Syntax Error
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valid Schema
                        </span>
                      )}
                    </div>
                    <textarea
                      value={jsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      className="w-full h-44 rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-zinc-300 outline-none focus:border-blue-500/50 transition-all resize-none"
                      placeholder="Paste your infrastructure JSON payload here..."
                      spellCheck={false}
                    />
                    <div className="flex items-center justify-between pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">
                        <UploadCloud className="h-3.5 w-3.5 text-blue-400" /> Browse File (.json)
                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                      </label>

                      <button
                        onClick={handleSubmit}
                        disabled={!!parseError || isIngesting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
                      >
                        <Play className="h-4 w-4 fill-current" /> Analyze & Build Digital Twin
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <p className="text-xs text-zinc-400">
                      Connect your organization's repository to automatically parse dependencies, detect vulnerable software packages, and construct the Neo4j Digital Twin.
                    </p>
                    <div className="relative">
                      <GitBranch className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/60 pl-10 pr-4 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500"
                        placeholder="https://github.com/username/repository"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmit}
                        disabled={!githubUrl.trim() || isIngesting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
                      >
                        <Play className="h-4 w-4 fill-current" /> Import & Run Assessment
                      </button>
                    </div>
                  </div>
                )}

                {assessError && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> <span>{assessError}</span>
                  </div>
                )}
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-left">
                <div
                  onClick={() => handleJsonChange(JSON.stringify(sampleInfra, null, 2))}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                    <span>Apache RCE Scenario</span>
                    <Badge tone="critical">CVE-2024-6387</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400">Internet → Apache Server → RCE → Database</p>
                </div>

                <div
                  onClick={() => handleJsonChange(JSON.stringify(sampleInfra, null, 2))}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-purple-500/40 hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                    <span>ProFTPD Server</span>
                    <Badge tone="high">CVE-2015-3306</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400">Internet → FTP Gateway → App → DB</p>
                </div>

                <div
                  onClick={() => handleJsonChange(JSON.stringify(sampleInfra, null, 2))}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-emerald-500/40 hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                    <span>SQL Injection</span>
                    <Badge tone="medium">OWASP Top 10</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400">Web Form → SQL Payload → DB Access</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCAN HISTORY */}
          {stage1Tab === 'history' && (
            <div className="max-w-4xl mx-auto space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-400" /> Recent Digital Twins & Audits
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">Review past infrastructure threat assessments and saved digital twin models</p>
                </div>
                <Badge tone="info" className="font-mono text-xs">4 Twins Saved</Badge>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Acme Corp Production Infrastructure', assets: 4, risk: 88, cves: 3, time: '2 hours ago', status: 'Completed' },
                  { name: 'E-Commerce Microservices Cluster', assets: 8, risk: 64, cves: 5, time: 'Yesterday at 4:15 PM', status: 'Verified' },
                  { name: 'AWS VPC Gateway & DB Layer', assets: 12, risk: 92, cves: 7, time: '3 days ago', status: 'Patched' },
                  { name: 'Kubernetes Ingress Controller', assets: 6, risk: 45, cves: 2, time: '5 days ago', status: 'Archived' },
                ].map((item, idx) => (
                  <Card key={idx} className="p-5 bg-zinc-950/80 border-white/10 hover:border-blue-500/40 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 font-bold text-xs">
                          TWIN
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {item.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={item.risk > 70 ? 'critical' : 'high'}>Risk Score: {item.risk}/100</Badge>
                        <button
                          onClick={() => {
                            handleJsonChange(JSON.stringify(sampleInfra, null, 2));
                            handleSubmit();
                          }}
                          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                        >
                          Load Twin
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2 border-t border-white/5 text-xs text-zinc-400 font-mono">
                      <span>Assets: <strong className="text-white">{item.assets}</strong></span>
                      <span>CVEs Vector Mapped: <strong className="text-rose-400">{item.cves}</strong></span>
                      <span>Status: <strong className="text-emerald-400">{item.status}</strong></span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ANALYST PROFILE */}
          {stage1Tab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-6 text-left">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-400" /> Analyst Profile & Subscription
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Manage security credentials, organization details, and assessment quotas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-zinc-950/80 border-white/10 md:col-span-1 flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                    M
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Moksh</h3>
                    <span className="text-xs text-purple-400 font-medium">Lead Security Architect</span>
                  </div>
                  <Badge tone="success" className="px-3 py-1 text-xs">Pro License Active</Badge>
                </Card>

                <Card className="p-6 bg-zinc-950/80 border-white/10 md:col-span-2 space-y-4">
                  <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Organization Security Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <span className="text-xs text-zinc-400 block">Total Scans Executed</span>
                      <p className="text-2xl font-bold text-white mt-1">14 Scans</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <span className="text-xs text-zinc-400 block">Verified Patches</span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">42 CVEs</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <span className="text-xs text-zinc-400 block">Avg Risk Reduction</span>
                      <p className="text-2xl font-bold text-blue-400 mt-1">57%</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <span className="text-xs text-zinc-400 block">Current Plan</span>
                      <p className="text-2xl font-bold text-purple-400 mt-1">Pro Enterprise</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 4: THREAT FEEDS & API KEYS */}
          {stage1Tab === 'api_keys' && (
            <div className="max-w-4xl mx-auto space-y-6 text-left">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-400" /> Threat Feeds & API Credentials
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Configure connections to NIST NVD API v2, Neo4j Graph DB, and AI Engines</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'NIST NVD API v2 Key', status: 'Connected', desc: 'Queries real-time CVSS scores, CWEs, and public exploit references', key: 'nvd_api_key_****7f9a' },
                  { name: 'Neo4j Graph Database', status: 'Active (bolt://localhost:7687)', desc: 'Stores infrastructure node relationships and computes reachability attack paths', key: 'neo4j_auth_****881b' },
                  { name: 'Ephemeral Docker Engine', status: 'Active Local Daemon', desc: 'Deploys isolated container sandboxes for Red Team exploit verification', key: '/var/run/docker.sock' },
                  { name: 'AI Red/Blue Orchestrator', status: 'Operational', desc: 'Drives multi-agent reasoning for attack discovery and patch recommendation', key: 'ai_sdk_****440c' },
                ].map((item, idx) => (
                  <Card key={idx} className="p-5 bg-zinc-950/80 border-white/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                        <Badge tone="success">{item.status}</Badge>
                      </div>
                      <p className="text-xs text-zinc-400">{item.desc}</p>
                      <p className="text-[11px] font-mono text-zinc-500 pt-1">Target: {item.key}</p>
                    </div>
                    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">
                      Configure
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PLATFORM SETTINGS */}
          {stage1Tab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6 text-left">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-zinc-400" /> Platform Settings & Preferences
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Configure default remediation formats, sandbox behavior, and report exports</p>
              </div>

              <Card className="p-6 bg-zinc-950/80 border-white/10 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white block">Default Remediation Code Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="rounded-xl border border-blue-500 bg-blue-600/20 p-3 text-xs font-semibold text-white text-center">
                      Bash Script (.sh)
                    </button>
                    <button className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400 text-center hover:bg-white/10">
                      Ansible Playbook (.yml)
                    </button>
                    <button className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400 text-center hover:bg-white/10">
                      Git Unified Patch (.patch)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <span className="text-sm font-semibold text-white block">Auto-Run Ephemeral Docker Sandbox</span>
                    <span className="text-xs text-zinc-400">Automatically detonate exploit payloads after Blue Team mitigation selection</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-blue-500 h-4 w-4" />
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <span className="text-sm font-semibold text-white block">CISO Executive Report Theme</span>
                    <span className="text-xs text-zinc-400">Styled executive summary layout for PDF export</span>
                  </div>
                  <select className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white">
                    <option>Dark Modern CISO Theme</option>
                    <option>Light Enterprise Theme</option>
                  </select>
                </div>
              </Card>
            </div>
          )}

        </main>
      </div>
    );
  }

  // Loading state while ingesting
  if (isIngesting) {
    return (
      <div className="flex min-h-[75vh] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
        <RefreshCw className="mb-4 h-10 w-10 animate-spin text-blue-500" />
        <h3 className="text-xl font-bold text-white">Synthesizing Digital Twin & Neo4j Graph</h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">
          {inputMode === 'github'
            ? 'Cloning repository, parsing dependency manifests, querying live NIST NVD API for CVEs, computing graph attack reachability...'
            : 'Ingesting asset software versions, querying live NIST NVD API for CVEs, computing graph attack reachability, and prompting AI agents...'}
        </p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STAGE 2: POST UPLOADING SCREEN (EXACTLY LIKE THE ATTACHED IMAGE)
  // Top Sandbox Bar + Split Screen: Left Chat Interface | Right Current Feature
  // --------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#141518] text-white font-sans">
      


      {/* ==================================================================== */}
      {/* MAIN BODY SPLIT SCREEN                                               */}
      {/* Left (38%): Chat Interface | Right (62%): Current Feature Going On    */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full overflow-y-auto lg:overflow-hidden">
        
        {/* ================================================================== */}
        {/* LEFT HAND SIDE: CHAT INTERFACE (MATCHING REFERENCE IMAGE)          */}
        {/* ================================================================== */}
        <div className="w-full lg:w-[420px] xl:w-[460px] h-[480px] lg:h-full shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#16171a] flex flex-col justify-between overflow-hidden">
          
          {/* Scrollable Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            <div className="text-center">
              <span className="text-[11px] text-zinc-500 font-medium">Today at 9:22 AM</span>
            </div>

            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.sender === 'user' ? (
                  /* User Prompt Bubble (Image reference style) */
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-zinc-800/80 border border-white/10 px-4 py-3 text-xs text-zinc-100 leading-relaxed shadow-sm">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  /* Assistant Message Bubble */
                  <div className="flex justify-start">
                    <div className="max-w-[90%] space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                          S
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400">SentinelAI</span>
                      </div>
                      <div className="rounded-2xl bg-zinc-900/90 border border-white/10 p-3.5 text-xs text-zinc-300 leading-relaxed">
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Interactive Step-by-Step Question Card (DYNAMIC GUIDED WORKFLOW) */}
            {isCardVisible && (
              <div className="rounded-2xl border border-white/15 bg-[#1f2025] p-4 space-y-4 shadow-xl text-left relative mt-4">
                
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">Step {currentStep.stepNum}</span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">{currentStep.title}</h3>
                  </div>
                  <button
                    onClick={() => setIsCardVisible(false)}
                    className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-300 font-medium">{currentStep.question}</p>

                {/* Radio Options List */}
                <div className="space-y-2 text-xs">
                  {currentStep.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm'
                            : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`step_opt_${currentStepIndex}`}
                          checked={isSelected}
                          onChange={() => setSelectedOptionId(opt.id)}
                          className="mt-0.5 accent-blue-500 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <span className="font-semibold block text-white">{opt.label}</span>
                          <span className="text-[11px] text-zinc-400 leading-tight block">
                            {opt.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Card Footer Controls */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <button
                      onClick={handlePrevStep}
                      disabled={currentStepIndex === 0}
                      className="p-1 hover:text-white rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Previous Step"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={currentStepIndex === workflowSteps.length - 1}
                      className="p-1 hover:text-white rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Next Step"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="text-[10px] font-mono text-zinc-500 ml-1">{currentStep.stepNum}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCardVisible(false)}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Skip all
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-1.5 text-xs font-semibold text-white shadow hover:from-blue-500 hover:to-purple-500 transition-all"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chat Input Bar at Bottom (Image reference style) */}
          <div className="p-3 border-t border-white/10 bg-[#191a1e]">
            <form onSubmit={handleSendChatMessage} className="rounded-2xl border border-white/15 bg-[#121316] p-2 space-y-2 shadow-inner">
              
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Tell Sentinel what to do instead..."
                className="w-full bg-transparent px-3 py-1.5 text-xs text-white outline-none placeholder:text-zinc-500"
              />

              <div className="flex items-center justify-between pt-1 border-t border-white/5 px-1">
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModeMenu(!showModeMenu)}
                      className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10"
                    >
                      <span>{buildModeDropdown}</span>
                      <ChevronDown className="h-3 w-3 text-zinc-500" />
                    </button>
                    {showModeMenu && (
                      <div className="absolute bottom-8 left-0 z-50 w-28 rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl">
                        {['Build', 'Attack', 'Patch', 'Report'].map((m) => (
                          <div
                            key={m}
                            onClick={() => {
                              setBuildModeDropdown(m);
                              setShowModeMenu(false);
                            }}
                            className="px-3 py-1 text-xs text-zinc-300 hover:bg-white/10 cursor-pointer"
                          >
                            {m}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!chatInputText.trim()}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 hover:bg-blue-600 text-white transition-all disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT HAND SIDE: CURRENT FEATURE GOING ON (MATCHING REFERENCE UI)  */}
        {/* ================================================================== */}
        <div className="flex-1 flex flex-col bg-[#fdfdfd] dark:bg-[#0b0d11] overflow-hidden relative">
          
          {/* Top Workbench Feature Selector & Status Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#16171b] px-4 py-2.5 text-xs text-zinc-300 no-print">
            
            {/* Interactive Feature Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'overview', label: 'Digital Twin Graph', icon: Server },
                { id: 'paths', label: 'Attack Paths', icon: ShieldAlert },
                { id: 'recs', label: 'AI Mitigations', icon: Sparkles },
                { id: 'sandbox', label: 'Docker Sandbox', icon: FlaskConical },
                { id: 'code', label: 'Remediation Code', icon: FileCode2 },
                { id: 'report', label: 'Executive Report', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeStepTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStepTab(tab.id as any)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Feature Status & Risk Score Widget */}
            <div className="flex items-center gap-3.5 shrink-0 ml-2 rounded-2xl border border-white/15 bg-zinc-950/90 px-3.5 py-1.5 shadow-2xl shadow-black">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 leading-none">Environment Risk</span>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">Live Twin</span>
                </div>
              </div>
              <div className="border-l border-white/15 pl-3 flex items-center gap-3">
                <RiskGauge score={riskScore} size={60} />
                <div className="flex flex-col justify-center leading-tight">
                  <span
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ color: riskScore > 70 ? '#f43f5e' : riskScore > 40 ? '#fb923c' : '#34d399' }}
                  >
                    {riskScore > 70 ? 'Critical Threat' : riskScore > 40 ? 'High Threat' : 'Low Risk'}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400 mt-0.5">Calculated Posture</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Feature Main Canvas Area */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6">
            
            {/* FEATURE 1: DIGITAL TWIN TOPOLOGY & GRAPH */}
            {activeStepTab === 'overview' && (
              <div className="space-y-6">
                
                {scanSummary && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs">
                    <div className="flex items-center gap-2 text-blue-300">
                      <GitBranch className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Scanned <strong className="text-white">{scanSummary.owner}/{scanSummary.repo}</strong>@{scanSummary.branch} — {scanSummary.dependencies_found} dependencies across {scanSummary.files_scanned.length} manifest{scanSummary.files_scanned.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-500">{scanSummary.files_scanned.join(', ')}</span>
                  </div>
                )}

                {/* Topology Canvas */}
                <div className="relative h-64 w-full rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-950/30 to-black p-6 overflow-hidden flex flex-col justify-between shadow-2xl">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:24px_24px]" />
                  
                  <div className="relative z-10 flex justify-between items-center">
                    <span className="text-xs font-mono text-blue-400 flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5" /> Cyber Twin Infrastructure Graph
                    </span>
                    <Badge tone="info">Neo4j Realtime Graph</Badge>
                  </div>

                  <div className="relative z-10 flex items-center justify-around my-auto">
                    {typedAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="group relative flex flex-col items-center cursor-pointer transition-all transform hover:scale-105"
                      >
                        {asset.internet_facing && (
                          <span className="absolute -inset-2 rounded-2xl bg-rose-500/20 animate-ping" />
                        )}
                        
                        <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xl transition-all ${
                          asset.internet_facing
                            ? 'border-rose-500/60 bg-rose-950/60 text-rose-300 shadow-rose-500/20'
                            : 'border-blue-500/50 bg-blue-950/60 text-blue-300 shadow-blue-500/20'
                        }`}>
                          <Server className="h-7 w-7" />
                        </div>
                        <span className="mt-2 text-xs font-semibold text-white tracking-wide">{asset.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{asset.os || 'Linux'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="relative z-10 flex justify-between text-[11px] text-zinc-400 font-mono border-t border-white/10 pt-2">
                    <span>Assets: {typedAssets.length}</span>
                    <span>Connections: {typedConnections.length}</span>
                    <span>CVEs Mapped: {uniqueCveIds.size}</span>
                  </div>
                </div>

                {/* Node details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typedAssets.map((asset) => (
                    <Card key={asset.id} className="p-4 bg-black/40 space-y-3 border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Server className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-semibold text-white">{asset.name}</span>
                        </div>
                        {asset.internet_facing ? (
                          <Badge tone="critical">Internet Facing</Badge>
                        ) : (
                          <Badge tone="neutral">Internal</Badge>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 space-y-1">
                        <p><strong className="text-zinc-300">OS:</strong> {asset.os || 'N/A'}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {asset.software?.map((s, i) => (
                            <span key={i} className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] text-blue-300 border border-blue-500/20">
                              {s.name} v{s.version}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* FEATURE 2: ATTACK PATHS & EXPLOITS */}
            {activeStepTab === 'paths' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-500" /> Red Team Discovered Attack Chains
                  </h3>
                  <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-300 shadow-sm">
                    <span>Environment Risk:</span>
                    <span className="text-sm font-black text-rose-400 font-mono">{riskScore} / 100</span>
                  </div>
                </div>

                {agentPhases.length > 0 && (
                  <Card className="p-5 bg-black/40 space-y-4 border-white/10">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400" /> Multi-Agent Orchestrator
                    </h4>
                    <AgentPhaseTimeline phases={agentPhases} />
                  </Card>
                )}

                {offenseAnalysis && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-200 space-y-2">
                    <span className="font-semibold text-rose-400 block uppercase tracking-wider text-[10px]">Offense AI Summary</span>
                    <p>{offenseAnalysis.exploit_chain}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {attackPaths.map((path, idx) => (
                    <Card key={idx} className="p-5 bg-black/40 space-y-4 border-l-4 border-l-rose-500 border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-rose-400 font-bold">
                          {path.hops === 0
                            ? `Direct Exposure: ${path.entry_name}`
                            : `Path #${idx + 1}: ${path.entry_name} → ${path.target_name}`}
                        </span>
                        <Badge tone="critical">Risk Impact: {path.risk_score}</Badge>
                      </div>
                      <HopChain nodes={path.path} />
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {path.cves.map((c) => (
                          <Badge key={c.cve_id} tone="critical" className="font-mono">{c.cve_id} ({c.severity})</Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>

                {uniqueCves.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                      <Activity className="h-4 w-4 text-blue-400" /> Threat Intelligence · CVSS &amp; MITRE ATT&amp;CK Enrichment
                    </h4>
                    {uniqueCves.map((c) => (
                      <CveIntelCard key={c.cve_id} cve={c} verified={verifiedCves.includes(c.cve_id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FEATURE 3: AI MITIGATIONS */}
            {activeStepTab === 'recs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400" /> AI Recommended Mitigations
                  </h3>
                  <span className="text-xs text-zinc-400">{selectedIds.length} Selected</span>
                </div>

                <div className="space-y-3">
                  {recommendations.map((rec) => {
                    const recId = rec.id || '';
                    const isSelected = selectedIds.includes(recId);
                    return (
                      <div
                        key={recId}
                        onClick={() => dispatch(toggleId(recId))}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-950/30' : 'border-white/10 bg-black/40 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isSelected ? <CheckSquare className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" /> : <Square className="h-5 w-5 text-zinc-600 shrink-0 mt-0.5" />}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                              <Badge tone={rec.priority === 'high' ? 'critical' : 'medium'}>{rec.priority}</Badge>
                            </div>
                            <p className="text-xs text-zinc-300">{rec.reason}</p>
                            <p className="text-[11px] text-blue-400 font-medium">Impact: {rec.estimated_impact}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleSaveSelection}
                    disabled={selectedIds.length === 0 || remediationLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
                  >
                    {remediationLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    Confirm Selection ({selectedIds.length}) & Detonate Sandbox
                  </button>
                </div>
              </div>
            )}

            {/* FEATURE 4: DOCKER SANDBOX DETONATION */}
            {activeStepTab === 'sandbox' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-purple-400" /> Ephemeral Docker Sandbox Engine
                  </h3>
                  <button
                    onClick={handleRunAllVerifications}
                    disabled={sandboxRunning}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-purple-500 disabled:opacity-50"
                  >
                    {sandboxRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                    Detonate All Exploits
                  </button>
                </div>

                {testableCves.map((item) => {
                  const result = sandbox.results[item.cve];
                  const isVerified = verifiedCves.includes(item.cve);
                  const isActive = sandboxActiveCve === item.cve;
                  return (
                    <Card key={item.cve} className={`p-5 bg-black/50 space-y-3 border-white/10 ${isActive ? 'border-purple-500/60 shadow-lg shadow-purple-500/10' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono text-xs text-purple-300 font-bold">{item.cve}</span>
                          <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                        </div>
                        {isActive ? (
                          <Badge tone="medium" className="font-mono"><RefreshCw className="h-3 w-3 animate-spin" /> Detonating…</Badge>
                        ) : isVerified ? (
                          <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> Patch Verified</Badge>
                        ) : null}
                      </div>

                      {isActive && !result ? (
                        <div className="rounded-xl border border-purple-500/20 bg-black/80 p-4 font-mono text-xs space-y-1.5 text-zinc-400">
                          <p className="text-purple-300 animate-pulse">&gt; Spinning up ephemeral Docker container…</p>
                          <p className="text-zinc-600">&gt; Deploying vulnerable build, then patched build</p>
                          <p className="text-zinc-600">&gt; Injecting live exploit against each and grabbing evidence</p>
                        </div>
                      ) : result ? (
                        <div className="rounded-xl border border-white/10 bg-black/80 p-4 font-mono text-xs space-y-2 text-zinc-300">
                          <p className="text-rose-400">&gt; [Before Patch] Exploit Payload Fired: {result.before_exploit_success ? 'Target Compromised' : 'Failed'}</p>
                          <p className="text-emerald-400">&gt; [After Patch] Patch Applied: {!result.after_exploit_success ? 'Exploit Blocked (Safe)' : 'Vulnerable'}</p>
                          {result.logs.map((l, i) => <p key={i} className="text-zinc-500">&gt; {l}</p>)}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">{item.description}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* FEATURE 5: REMEDIATION CODE */}
            {activeStepTab === 'code' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileCode2 className="h-5 w-5 text-emerald-400" /> Auto-Generated Remediation Code
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleDownload} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500">
                      Download
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pb-1">
                  {(['bash', 'ansible', 'git_diff'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleGenerate(fmt)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
                        format === fmt ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {fmt === 'git_diff' ? 'Git Diff' : fmt}
                    </button>
                  ))}
                </div>

                <pre className="rounded-xl border border-white/10 bg-black/80 p-5 font-mono text-xs text-emerald-300 overflow-x-auto min-h-[300px]">
                  {generatedCode || '# Select code format above to generate remediation patch code...'}
                </pre>

                {scanSummary && generatedCode && (
                  <div className="space-y-2 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-blue-300">
                        <GitBranch className="h-4 w-4 shrink-0" />
                        <span>Open this fix as a pull request on <strong className="text-white">{scanSummary.owner}/{scanSummary.repo}</strong></span>
                      </div>
                      <button
                        onClick={handleOpenPR}
                        disabled={prState.loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        {prState.loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
                        Open Pull Request
                      </button>
                    </div>
                    {prState.url && (
                      <a href={prState.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">
                        <CheckCircle2 className="h-3.5 w-3.5" /> PR opened — {prState.url}
                      </a>
                    )}
                    {prState.error && (
                      <div className="flex items-center gap-2 text-xs text-rose-300">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> <span>{prState.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {scanSummary && (
                  <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-emerald-300">
                        <GitBranch className="h-4 w-4 shrink-0" />
                        <span>Auto-fix vulnerable dependencies — edits <strong className="text-white">package.json / requirements.txt</strong> and opens a PR</span>
                      </div>
                      <button
                        onClick={handleOpenDependencyPR}
                        disabled={depPrState.loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {depPrState.loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
                        Open Dependency-Fix PR
                      </button>
                    </div>
                    {depPrState.fixes.length > 0 && (
                      <ul className="space-y-1 font-mono text-[11px] text-zinc-400">
                        {depPrState.fixes.map((f) => (
                          <li key={`${f.file}:${f.package}`}>
                            <span className="text-white">{f.package}</span> {f.from} → <span className="text-emerald-400">{f.to}</span> <span className="text-zinc-600">({f.file})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {depPrState.url && (
                      <a href={depPrState.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Dependency-fix PR opened — {depPrState.url}
                      </a>
                    )}
                    {depPrState.error && (
                      <div className="flex items-center gap-2 text-xs text-rose-300">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> <span>{depPrState.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FEATURE 6: EXECUTIVE REPORT */}
            {activeStepTab === 'report' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" /> Executive Security Assessment
                  </h3>
                  <div className="flex gap-2 no-print">
                    <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500">
                      Export PDF
                    </button>
                    <button onClick={() => exportReportJson(reportData())} className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">
                      JSON
                    </button>
                    <button onClick={() => exportFindingsCsv(reportData())} className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">
                      CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-5 flex flex-col items-center justify-center text-center border-white/10 bg-black/40 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Initial Risk Score</span>
                    <div className="flex items-center gap-3 mt-1">
                      <RiskGauge score={riskScoreBefore || 88} size={64} />
                      <div className="flex flex-col text-left">
                        <span className="text-2xl font-black text-rose-400">{riskScoreBefore || 88}</span>
                        <span className="text-[10px] uppercase font-semibold text-zinc-500">out of 100</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-5 flex flex-col items-center justify-center text-center border-emerald-500/30 bg-emerald-950/10 space-y-2 shadow-lg shadow-emerald-500/5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Post-Patch Risk Score</span>
                    <div className="flex items-center gap-3 mt-1">
                      <RiskGauge score={riskScore} size={64} />
                      <div className="flex flex-col text-left">
                        <span className="text-2xl font-black text-emerald-400">{riskScore}</span>
                        <span className="text-[10px] uppercase font-semibold text-zinc-500">out of 100</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 flex flex-col items-center justify-center text-center border-blue-500/30 bg-blue-950/10 space-y-2 shadow-lg shadow-blue-500/5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Threat Risk Reduction</span>
                    <div className="flex flex-col items-center justify-center pt-1">
                      <span className="text-3xl font-black text-blue-400">{reduction}%</span>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 mt-1">Mitigated Score</span>
                    </div>
                  </Card>
                </div>

                {report && (
                  <div className="space-y-4">
                    <Card className="p-4 space-y-2 border-white/10">
                      <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Executive Summary</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">{report.executive_summary}</p>
                    </Card>

                    {report.risk_posture && (
                      <Card className="p-4 space-y-2 border-white/10">
                        <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Risk Posture</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">{report.risk_posture}</p>
                      </Card>
                    )}

                    {report.key_findings && report.key_findings.length > 0 && (
                      <Card className="p-4 space-y-2 border-white/10">
                        <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Key Findings</h4>
                        <ul className="space-y-1.5">
                          {report.key_findings.map((f, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                              <span className="mt-0.5 text-rose-400">•</span><span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {report.attack_narrative && (
                      <Card className="p-4 space-y-2 border-white/10">
                        <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Attack Narrative</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{report.attack_narrative}</p>
                      </Card>
                    )}

                    <Card className="p-4 space-y-2 border-white/10">
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Projected Business Impact</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">{report.business_impact}</p>
                    </Card>

                    {report.remediation_roadmap && report.remediation_roadmap.length > 0 && (
                      <Card className="p-4 space-y-2 border-white/10">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Remediation Roadmap</h4>
                        <ol className="space-y-1.5">
                          {report.remediation_roadmap.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                              <span className="mt-0.5 font-semibold text-emerald-400">{i + 1}.</span><span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </Card>
                    )}

                    {report.compliance_notes && (
                      <Card className="p-4 space-y-2 border-white/10">
                        <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Compliance & Framework Mapping</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">{report.compliance_notes}</p>
                      </Card>
                    )}

                    {report.next_steps && report.next_steps.length > 0 && (
                      <Card className="p-4 space-y-2 border-white/10">
                        <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Recommended Next Steps</h4>
                        <ul className="space-y-1.5">
                          {report.next_steps.map((s, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                              <span className="mt-0.5 text-violet-400">→</span><span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Floating Action Toolbar on Bottom Right (MATCHING REFERENCE IMAGE FLOATING BAR) */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-zinc-900/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl">
            <button title="Focus Canvas" className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
              <Focus className="h-3.5 w-3.5" />
            </button>
            <button title="Text Annotation" className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
              <Type className="h-3.5 w-3.5" />
            </button>
            <button title="Pencil Draw" className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button title="Add Comment" className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
