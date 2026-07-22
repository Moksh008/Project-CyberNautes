import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { ingestAndAnalyze, addVerifiedCve, recomputeAfterPatch } from '../../../store/slices/assessmentSlice';
import { toggleId, saveSelection, setFormat, generateRemediationCode } from '../../../store/slices/remediationSlice';
import { runSandboxVerify } from '../../../store/slices/sandboxSlice';
import type { InfrastructurePayload } from '../../../api/ingest';
import sampleInfra from '../../../data/sample_infra.json';
import { SUPPORTED_SANDBOX_CVES } from '../../../data/sandboxCves';
import {
  UploadCloud, FileCode, Play, AlertCircle, CheckCircle2, RefreshCw,
  Server, ShieldAlert, CheckSquare, Square, ShieldCheck, FlaskConical,
  FileCode2, Sparkles, Terminal, Activity, Sliders, GitBranch, FileText
} from 'lucide-react';
import { Card, Badge, RiskGauge, HopChain } from '../../ui';

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

export function WorkspaceView() {
  const dispatch = useAppDispatch();
  const assessment = useAppSelector((state) => state.assessment);
  const remediation = useAppSelector((state) => state.remediation);
  const sandbox = useAppSelector((state) => state.sandbox);

  const {
    status, twinId, twinName, assets, connections,
    riskScore, riskScoreBefore, attackPaths, offenseAnalysis, recommendations,
    report, verifiedCves,
  } = assessment;
  const { selectedIds, format, generatedCode, loading: remediationLoading } = remediation;

  // Input states
  const [inputMode, setInputMode] = useState<'json' | 'github'>('json');
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(sampleInfra, null, 2));
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com/org/vulnerable-microservices');
  const [parseError, setParseError] = useState<string | null>(null);
  
  // UI Split-screen states (Image 2 style)
  const [activeStepTab, setActiveStepTab] = useState<'overview' | 'paths' | 'recs' | 'sandbox' | 'code' | 'report'>('overview');
  const [platformMode, setPlatformMode] = useState<'ephemeral' | 'real' | 'educational'>('ephemeral');
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const isIngesting = status === 'ingesting' || status === 'analyzing';
  const typedAssets = assets as AssetShape[];
  const typedConnections = connections as ConnectionShape[];
  const uniqueCveIds = new Set(attackPaths.flatMap((p) => p.cves.map((c) => c.cve_id)));

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
      const parsed: InfrastructurePayload = JSON.parse(jsonText);
      await dispatch(ingestAndAnalyze(parsed)).unwrap();
    } catch (err: unknown) {
      console.error('Ingest failed:', err);
    }
  };

  const handleSaveSelection = async () => {
    if (!twinId) return;
    await dispatch(saveSelection({ twinId, ids: selectedIds, recs: selectedRecs })).unwrap();
    setActiveStepTab('sandbox');
  };

  const handleRunAllVerifications = async () => {
    if (!twinId) return;
    setSandboxRunning(true);
    const newlyVerified: string[] = [];
    for (const item of testableCves) {
      if (verifiedCves.includes(item.cve)) continue;
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
    if (newlyVerified.length) {
      const updated = [...new Set([...verifiedCves, ...newlyVerified])];
      await dispatch(recomputeAfterPatch({ twinId, excludedCves: updated }));
    }
    setSandboxRunning(false);
    setActiveStepTab('code');
  };

  const handleGenerate = async (fmt: 'bash' | 'ansible' | 'git_diff') => {
    if (!twinId) return;
    dispatch(setFormat(fmt));
    await dispatch(generateRemediationCode({ twinId, recs: selectedRecs.length > 0 ? selectedRecs : recommendations, format: fmt }));
  };

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

  // --------------------------------------------------------------------------
  // STAGE 1: INITIAL HERO UPLOAD WINDOW (IMAGE 1 LOVABLE STYLE)
  // --------------------------------------------------------------------------
  if (!twinId && !isIngesting) {
    return (
      <div className="relative min-h-[82vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-purple-950/20 to-zinc-950 p-6 md:p-12 shadow-2xl flex flex-col items-center justify-center text-center">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-blue-500/20 via-purple-500/30 to-pink-500/20 blur-[120px] pointer-events-none rounded-full" />
        
        {/* Top Status Pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          <span>SentinelAI Engine ready • Multi-Agent Cyber Defense Twin</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight">
          Let's defend your infrastructure, <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Moksh</span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-zinc-400 max-w-xl">
          Upload your infrastructure JSON or connect your GitHub repository to generate an interactive Digital Twin, map exploit paths, and detonate live sandbox patches.
        </p>

        {/* Main Lovable-style Central Input Container (Image 1 reference) */}
        <div className="mt-8 w-full max-w-3xl rounded-2xl border border-white/15 bg-zinc-950/80 p-4 md:p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-left space-y-4 relative z-10">
          
          {/* Input Method Toggles */}
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

          {/* Dynamic Content Area based on mode */}
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
                  disabled={isIngesting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 transition-all"
                >
                  <Play className="h-4 w-4 fill-current" /> Import & Run Assessment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preset Cards below search bar */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-left">
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
    );
  }

  // Loading state while ingesting
  if (isIngesting) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
        <RefreshCw className="mb-4 h-10 w-10 animate-spin text-blue-500" />
        <h3 className="text-xl font-bold text-white">Synthesizing Digital Twin & Neo4j Graph</h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">
          Ingesting asset software versions, querying live NIST NVD API for CVEs, computing graph attack reachability, and prompting Red/Blue team AI agents...
        </p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STAGE 2: SPLIT SCREEN WORKSPACE WINDOW (IMAGE 2 LOVABLE STYLE)
  // Left: Working & Controls of project | Right: Animation & Visualizer
  // --------------------------------------------------------------------------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[85vh] w-full">
      
      {/* ==================================================================== */}
      {/* LEFT SIDE PANEL (4 Columns): WORKING OF THE PROJECT & CONTROLS      */}
      {/* ==================================================================== */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        
        {/* Top Control Settings Card (Image 2 style question box) */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/90 p-5 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Platform Execution Mode</h3>
            </div>
            <Badge tone="info" className="font-mono text-[10px]">MVP Live</Badge>
          </div>

          <div className="space-y-2.5">
            <label 
              onClick={() => setPlatformMode('ephemeral')}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                platformMode === 'ephemeral' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/5'
              }`}
            >
              <input type="radio" checked={platformMode === 'ephemeral'} onChange={() => {}} className="mt-0.5 accent-blue-500" />
              <div>
                <span className="text-xs font-semibold block text-white">Ephemeral Docker Sandbox</span>
                <span className="text-[11px] text-zinc-400 leading-tight block">Safe isolated red-team detonations & live patch verification</span>
              </div>
            </label>

            <label 
              onClick={() => setPlatformMode('real')}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                platformMode === 'real' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/5'
              }`}
            >
              <input type="radio" checked={platformMode === 'real'} onChange={() => {}} className="mt-0.5 accent-blue-500" />
              <div>
                <span className="text-xs font-semibold block text-white">Live NVD Threat Sync</span>
                <span className="text-[11px] text-zinc-400 leading-tight block">Query NIST API v2 with API key & calculate real risk score</span>
              </div>
            </label>

            <label 
              onClick={() => setPlatformMode('educational')}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                platformMode === 'educational' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/5'
              }`}
            >
              <input type="radio" checked={platformMode === 'educational'} onChange={() => {}} className="mt-0.5 accent-blue-500" />
              <div>
                <span className="text-xs font-semibold block text-white">Interactive Cyber Twin Lab</span>
                <span className="text-[11px] text-zinc-400 leading-tight block">HackTheBox-style scenario simulation & graph traversal</span>
              </div>
            </label>
          </div>
        </div>

        {/* Project Working Stepper & Interactive Action Drawer */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/90 p-5 backdrop-blur-xl flex-1 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Cyber Defense Workflow</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">Step Controls</span>
            </div>

            {/* Stepper Tabs */}
            <div className="space-y-1.5">
              {[
                { id: 'overview', title: '1. Digital Twin & Graph', done: !!twinId, count: typedAssets.length },
                { id: 'paths', title: '2. Attack Path Analysis', done: attackPaths.length > 0, count: attackPaths.length },
                { id: 'recs', title: '3. Blue Team Mitigations', done: selectedIds.length > 0, count: recommendations.length },
                { id: 'sandbox', title: '4. Sandbox Detonation', done: verifiedCves.length > 0, count: testableCves.length },
                { id: 'code', title: '5. Remediation Code', done: !!generatedCode, count: selectedRecs.length },
                { id: 'report', title: '6. Executive Report', done: !!report, count: 1 },
              ].map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStepTab(step.id as any)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                    activeStepTab === step.id
                      ? 'bg-blue-600/20 border border-blue-500/40 text-white font-medium'
                      : 'border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${step.done ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    <span>{step.title}</span>
                  </div>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400">{step.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contextual Active Controls based on active step */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            {activeStepTab === 'recs' && (
              <button
                onClick={handleSaveSelection}
                disabled={selectedIds.length === 0 || remediationLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
              >
                {remediationLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Confirm Selection ({selectedIds.length}) & Proceed to Sandbox
              </button>
            )}

            {activeStepTab === 'sandbox' && (
              <button
                onClick={handleRunAllVerifications}
                disabled={sandboxRunning}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500 disabled:opacity-50"
              >
                {sandboxRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                Detonate Red Team Exploits in Docker Sandbox
              </button>
            )}

            {activeStepTab === 'code' && (
              <div className="grid grid-cols-3 gap-2">
                {(['bash', 'ansible', 'git_diff'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleGenerate(fmt)}
                    className={`rounded-lg py-2 text-[11px] font-semibold uppercase transition-all ${
                      format === fmt ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {fmt === 'git_diff' ? 'Git Diff' : fmt}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { dispatch({ type: 'assessment/reset' }); }}
              className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors pt-1"
            >
              Upload New Infrastructure JSON
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* RIGHT SIDE PANEL (8 Columns): ANIMATED PROJECT VISUALIZER (IMAGE 2) */}
      {/* ==================================================================== */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl border border-white/10 bg-zinc-950/95 overflow-hidden shadow-2xl relative min-h-[600px]">
        
        {/* Top Studio Bar (Image 2 window bar style) */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-5 py-3 text-xs text-zinc-400 no-print">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-zinc-300 font-medium">Digital Twin Live Canvas • {twinName || twinId}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-mono">Engine Active</span>
            </div>
            {verifiedCves.length > 0 && (
              <Badge tone="success" className="font-mono text-[10px]">
                <ShieldCheck className="h-3 w-3" /> Patches Verified ({verifiedCves.length})
              </Badge>
            )}
          </div>
        </div>

        {/* Dynamic Studio Canvas View based on active step tab */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* OVERVIEW / TOPOLOGY ANIMATION CANVAS */}
          {activeStepTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Dynamic Animated Node Visualizer Header */}
              <div className="relative h-64 w-full rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-950/30 to-black p-6 overflow-hidden flex flex-col justify-between">
                
                {/* Glowing Grid Background Animation */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:24px_24px]" />
                
                {/* Canvas Top Bar */}
                <div className="relative z-10 flex justify-between items-center">
                  <span className="text-xs font-mono text-blue-400 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" /> Cyber Twin Topology Graph
                  </span>
                  <RiskGauge score={riskScore} size={90} />
                </div>

                {/* Animated Graph Nodes */}
                <div className="relative z-10 flex items-center justify-around my-auto">
                  {typedAssets.map((asset) => {
                    return (
                      <div
                        key={asset.id}
                        className="group relative flex flex-col items-center cursor-pointer transition-all transform hover:scale-105"
                      >
                        {/* Outer Pulsing Ring if internet facing */}
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
                    );
                  })}
                </div>

                {/* Bottom Canvas Footer */}
                <div className="relative z-10 flex justify-between text-[11px] text-zinc-400 font-mono border-t border-white/10 pt-2">
                  <span>Assets: {typedAssets.length}</span>
                  <span>Connections: {typedConnections.length}</span>
                  <span>CVEs Mapped: {uniqueCveIds.size}</span>
                </div>
              </div>

              {/* Detailed Node Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typedAssets.map((asset) => (
                  <Card key={asset.id} className="p-4 bg-black/40 space-y-3">
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

          {/* ATTACK PATHS ANIMATED VIEW */}
          {activeStepTab === 'paths' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-500" /> Red Team Discovered Attack Chains
                </h3>
                <Badge tone="critical">Environment Risk: {riskScore}/100</Badge>
              </div>

              {offenseAnalysis && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-200 space-y-2">
                  <span className="font-semibold text-rose-400 block uppercase tracking-wider text-[10px]">Offense AI Summary</span>
                  <p>{offenseAnalysis.exploit_chain}</p>
                </div>
              )}

              <div className="space-y-4">
                {attackPaths.map((path, idx) => (
                  <Card key={idx} className="p-5 bg-black/40 space-y-4 border-l-4 border-l-rose-500">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-rose-400 font-bold">Path #{idx + 1}: {path.entry_name} → {path.target_name}</span>
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
            </div>
          )}

          {/* BLUE TEAM RECOMMENDATIONS VIEW */}
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
            </div>
          )}

          {/* SANDBOX DETONATION ANIMATED VIEW */}
          {activeStepTab === 'sandbox' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-purple-400" /> Ephemeral Docker Sandbox Engine
                </h3>
                {sandboxRunning && (
                  <span className="flex items-center gap-2 text-xs text-purple-400 animate-pulse font-mono">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Detonating Payloads...
                  </span>
                )}
              </div>

              {testableCves.map((item) => {
                const result = sandbox.results[item.cve];
                const isVerified = verifiedCves.includes(item.cve);
                return (
                  <Card key={item.cve} className="p-5 bg-black/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-xs text-purple-300 font-bold">{item.cve}</span>
                        <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                      </div>
                      {isVerified && <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> Patch Verified</Badge>}
                    </div>

                    {result ? (
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

          {/* REMEDIATION CODE VIEW */}
          {activeStepTab === 'code' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileCode2 className="h-5 w-5 text-emerald-400" /> Auto-Generated Patch Code
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

              <pre className="rounded-xl border border-white/10 bg-black/80 p-5 font-mono text-xs text-emerald-300 overflow-x-auto min-h-[300px]">
                {generatedCode || '# Click format on left control panel to generate remediation code...'}
              </pre>
            </div>
          )}

          {/* EXECUTIVE REPORT VIEW */}
          {activeStepTab === 'report' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" /> Executive Security Assessment
                </h3>
                <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white">
                  Export PDF
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <span className="text-[11px] text-zinc-400">Initial Risk</span>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{riskScoreBefore}/100</p>
                </Card>
                <Card className="p-4 text-center">
                  <span className="text-[11px] text-zinc-400">Post-Patch Risk</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{riskScore}/100</p>
                </Card>
                <Card className="p-4 text-center">
                  <span className="text-[11px] text-zinc-400">Risk Reduction</span>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{reduction}%</p>
                </Card>
              </div>

              {report && (
                <div className="space-y-4">
                  <Card className="p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Executive Summary</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">{report.executive_summary}</p>
                  </Card>
                  <Card className="p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Projected Business Impact</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">{report.business_impact}</p>
                  </Card>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
