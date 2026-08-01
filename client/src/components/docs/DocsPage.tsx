"use client";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  BookOpen,
  Cpu,
  Database,
  Terminal,
  Activity,
  CheckCircle2,
  Lock,
  Layers,
  FileCode,
  Sparkles,
  Search,
  ChevronRight,
  Workflow,
  AlertTriangle,
} from "lucide-react";
import { Navbar1 } from "../landingpage/Navbar";
import { Footer } from "../landingpage/Footer";
import { LandingStyles } from "../landingpage/LandingStyles";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: any;
  summary: string;
  content: React.ReactNode;
}

export function DocsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const docSections: DocSection[] = [
    {
      id: "overview",
      title: "System Overview & Architecture",
      category: "Getting Started",
      icon: Shield,
      summary:
        "High-level architectural design of SentinelAI — an AI-Powered Cyber Defense Digital Twin platform.",
      content: (
        <div className="space-y-8 text-slate-300">
          <div className="glass-panel glass-panel-interactive rounded-2xl border-blue-500/20 bg-blue-500/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="text-blue-300 h-5 w-5" /> Executive Summary
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              SentinelAI is an enterprise-grade cyber defense automation platform that builds a real-time **Digital Twin** of your organizational infrastructure using Neo4j Knowledge Graphs. By combining live NIST NVD vulnerability feeds, MITRE ATT&CK technique mapping, multi-agent AI analysis (LangGraph), and ephemeral Docker sandbox detonation, SentinelAI identifies, proves, and remediates breach vectors before adversaries can exploit them.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Core Technology Stack</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-medium">
                  <Database size={18} /> Neo4j 5.x Knowledge Graph
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Maps complex infrastructure topologies, microservices, open ports, database clusters, and shortest attack reachability paths using graph Cypher queries.
                </p>
              </div>

              <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-medium">
                  <Workflow size={18} /> LangGraph Multi-Agent Engine
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Orchestrates specialized Offense (Red Team), Defense (Blue Team), and Reporting AI agents to analyze attack impact and formulate patch strategies.
                </p>
              </div>

              <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Cpu size={18} /> Ephemeral Docker Sandbox
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Detonates verified Red-Team exploit payloads inside isolated container environments to validate vulnerability reachability before and after patching.
                </p>
              </div>

              <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-medium">
                  <Activity size={18} /> Live NIST NVD & MITRE ATT&CK
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fetches live CVE telemetry via NVD API v2 with automatic TTL caching and maps CWE identifiers to MITRE ATT&CK tactics & techniques.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">High-Level Data Flow</h3>
            <div className="glass-panel p-6 rounded-xl bg-white/[0.02] font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="flex items-center gap-2 text-blue-400">
                <span>1. Infrastructure JSON Payload</span>
                <span>➔</span>
                <span>FastAPI Ingestion Endpoint (/api/ingest/repo)</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <span>2. Neo4j Cypher Construction</span>
                <span>➔</span>
                <span>Digital Twin Topology Graph Creation</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <span>3. Live NVD v2 Sync</span>
                <span>➔</span>
                <span>CWE to MITRE ATT&CK Mapping & CVSS Scoring</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span>4. LangGraph Multi-Agent Pipeline</span>
                <span>➔</span>
                <span>Attack Reachability & Exploit Risk Computation</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400">
                <span>5. Ephemeral Docker Detonation</span>
                <span>➔</span>
                <span>Verified Patch Generation (Bash / Ansible / Git Diff)</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ingestion",
      title: "Infrastructure Ingestion & Digital Twin",
      category: "Core Engine",
      icon: Layers,
      summary:
        "How SentinelAI models servers, databases, endpoints, and microservices into a Neo4j graph.",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-sm text-slate-300 leading-relaxed">
            SentinelAI models your infrastructure as a directed property graph. Nodes represent physical/virtual servers, containers, databases, API gateways, and web services. Edges represent network connectivity, open ports, authentication privileges, and service dependencies.
          </p>

          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">Sample Infrastructure Ingestion Payload</h4>
            <div className="glass-panel relative rounded-xl bg-white/[0.02] p-4 font-mono text-xs overflow-x-auto text-emerald-400">
              <pre>{`POST /api/ingest/repo
Content-Type: application/json

{
  "repository_name": "production-cloud-us-east",
  "nodes": [
    {
      "id": "web-gateway-01",
      "type": "server",
      "ip": "192.168.1.10",
      "software": ["httpd:2.4.49", "openssl:1.1.1k"],
      "is_internet_facing": true
    },
    {
      "id": "customer-db-01",
      "type": "database",
      "ip": "10.0.2.45",
      "software": ["postgresql:13.2"],
      "is_internet_facing": false
    }
  ],
  "edges": [
    {
      "source": "web-gateway-01",
      "target": "customer-db-01",
      "port": 5432,
      "protocol": "TCP"
    }
  ]
}`}</pre>
            </div>
          </div>

          <div className="glass-panel rounded-xl bg-white/[0.02] p-5 space-y-3">
            <h4 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="text-blue-400 h-4 w-4" /> Cypher Reachability Querying
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once ingested, Cypher algorithms compute shortest paths from internet-facing entry points (<code className="text-blue-300">is_internet_facing: true</code>) to critical assets like customer databases or payment processors.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "threat-intel",
      title: "Threat Intelligence & NVD Sync",
      category: "Core Engine",
      icon: Activity,
      summary:
        "Automated CVE lookup, CVSS v3.1 scoring, and CWE-to-MITRE ATT&CK technique mapping.",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-sm leading-relaxed">
            SentinelAI automatically queries the **NIST National Vulnerability Database (NVD API v2)** to map software specs against known Common Vulnerabilities and Exposures (CVEs).
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-panel glass-panel-interactive p-4 rounded-xl bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono text-blue-400">01. Live CVE Fetch</span>
              <h5 className="text-sm font-semibold text-white">NVD API v2 Synchronization</h5>
              <p className="text-xs text-slate-400">Queries NVD API with automatic local caching and fallback to local CVE databases to prevent API rate limits.</p>
            </div>

            <div className="glass-panel glass-panel-interactive p-4 rounded-xl bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono text-purple-400">02. MITRE Mapping</span>
              <h5 className="text-sm font-semibold text-white">ATT&CK Technique Resolution</h5>
              <p className="text-xs text-slate-400">Maps CWE identifiers (e.g. CWE-89, CWE-78) to MITRE techniques like T1190 (Exploit Public-Facing Application).</p>
            </div>

            <div className="glass-panel glass-panel-interactive p-4 rounded-xl bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono text-emerald-400">03. Contextual Risk</span>
              <h5 className="text-sm font-semibold text-white">Dynamic Risk Recomputation</h5>
              <p className="text-xs text-slate-400">Calculates business risk based on CVSS severity, node centrality, and internet exposure reachability.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ai-agents",
      title: "Multi-Agent AI Engine (LangGraph)",
      category: "AI & Automation",
      icon: Cpu,
      summary:
        "Deep dive into our 3-stage LangGraph state graph: Offense Agent, Defense Agent, and Security Reporter.",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-sm leading-relaxed">
            SentinelAI uses **LangGraph** to coordinate specialized AI agents in a stateful pipeline. Unlike static scanners, our agents reason contextually about how vulnerabilities interact.
          </p>

          <div className="space-y-4">
            <div className="glass-panel glass-panel-interactive p-5 rounded-xl border-white/15 bg-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle size={18} /> Stage 1: Offense Agent (Red Team)
                </h4>
                <span className="text-[10px] font-mono uppercase bg-white/10 text-white/80 px-2 py-0.5 rounded">Threat Simulation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Analyzes the Neo4j attack graph to find multi-hop exploit chains. Simulates adversary behavior by determining how a breach at an edge node can pivot into internal database clusters.
              </p>
            </div>

            <div className="glass-panel glass-panel-interactive p-5 rounded-xl border-white/15 bg-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield size={18} /> Stage 2: Defense Agent (Blue Team)
                </h4>
                <span className="text-[10px] font-mono uppercase bg-white/10 text-white/80 px-2 py-0.5 rounded">Patch Formulator</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Evaluates the Offense Agent's findings and generates concrete remediation scripts (POSIX Bash, Ansible Playbooks, or Git Diff patches) to sever the attack chain with minimal operational downtime.
              </p>
            </div>

            <div className="glass-panel glass-panel-interactive p-5 rounded-xl border-white/15 bg-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileCode size={18} /> Stage 3: Executive Security Reporter
                </h4>
                <span className="text-[10px] font-mono uppercase bg-white/10 text-white/80 px-2 py-0.5 rounded">Audit Synthesis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Synthesizes technical findings into executive-ready markdown reports, complete with CVSS breakdowns, MITRE ATT&CK matrices, and regulatory compliance status.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "sandbox",
      title: "Ephemeral Red-Team Sandbox",
      category: "Verification",
      icon: Terminal,
      summary:
        "Proving vulnerability reachability via isolated Docker container exploit detonations.",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-sm leading-relaxed">
            To eliminate false positives, SentinelAI provides **Ephemeral Docker Sandbox Detonation**. It spins up isolated container mirrors of vulnerable software services (e.g. vulnerable Apache HTTPD, OpenSSL, or SSH containers) and runs automated proof-of-concept exploit scripts.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
              <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400 h-4 w-4" /> Before-Patch Verification
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detonates the exploit against the unpatched sandbox container to confirm vulnerability exploitation (e.g., verifying RCE or path traversal).
              </p>
            </div>

            <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
              <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="text-blue-400 h-4 w-4" /> After-Patch Verification
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies the generated patch script to the container and re-runs the exploit to empirically verify 100% remediation success.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "compliance",
      title: "Enterprise Compliance & India DPDP Act",
      category: "Compliance & Security",
      icon: Lock,
      summary:
        "Automated audit exports for India's DPDP Act 2023, CERT-In guidelines, ISO 27001, and SOC2.",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-sm leading-relaxed">
            SentinelAI is built to satisfy strict regulatory data governance and security reporting standards across India and global markets.
          </p>

          <div className="space-y-4">
            <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-white">Digital Personal Data Protection (DPDP) Act 2023 (India)</h5>
                <span className="glass-pill text-[10px] font-bold text-white px-2 py-0.5 rounded">Indian Regulation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maps database node access pathways containing Personal Identifiable Information (PII) to ensure technical safeguards are in place, preventing breach liabilities of up to ₹250 Crore.
              </p>
            </div>

            <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-white">CERT-In 6-Hour Incident Reporting Readiness</h5>
                <span className="glass-pill text-[10px] font-bold text-white px-2 py-0.5 rounded">Indian Cyber Mandate</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates instant timeline telemetry logs and blast-radius reports required by the Indian Computer Emergency Response Team (CERT-In) during security incidents.
              </p>
            </div>

            <div className="glass-panel glass-panel-interactive p-5 rounded-xl bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-white">Air-Gapped & Data Localization Mandates</h5>
                <span className="glass-pill text-[10px] font-bold text-white px-2 py-0.5 rounded">BFSI & Enterprise</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supports complete on-premise installation via Kubernetes Helm charts or Docker Compose with local Neo4j instances and self-hosted LLM engines for Indian Banking & Financial Services.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentSection =
    docSections.find((s) => s.id === activeTab) || docSections[0];

  const filteredSections = docSections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-[#05070a] text-white selection:bg-white selection:text-black">
      <LandingStyles />
      <div className="grain-overlay" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-wave" />
      </div>

      {/* Navigation */}
      <Navbar1 />

      <div className="max-w-7xl mx-auto pt-28 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Hero */}
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="glass-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-white/70 text-xs font-mono uppercase tracking-wider mb-3">
              <BookOpen size={14} /> Official Technical Documentation
            </div>
            <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white">
              SentinelAI Architecture & Developer Guide
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl font-light">
              Complete technical reference for security teams, CTOs, CISOs, and enterprise architects.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-panel w-full pl-10 pr-4 py-2.5 bg-white/[0.02] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>
        </div>

        {/* Documentation Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-2 sticky top-24">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 px-3 mb-2">
              Documentation Index
            </div>
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeTab === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={cn(
                    "glass-panel glass-panel-interactive w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer",
                    isActive
                      ? "!bg-white/10 !border-white/30 text-white shadow-md"
                      : "bg-white/[0.02] text-slate-400 hover:text-white"
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "mt-0.5 shrink-0",
                      isActive ? "text-white" : "text-slate-500"
                    )}
                  />
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider opacity-60 mb-0.5">
                      {section.category}
                    </div>
                    <div className="text-sm font-medium leading-snug">
                      {section.title}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="pt-6">
              <div className="glass-panel glass-panel-interactive rounded-xl bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Terminal size={14} className="text-blue-400" /> Need API Credentials?
                </div>
                <p className="text-xs text-slate-400">
                  Access live REST API endpoints or request custom enterprise SDK keys.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign in to Developer Console <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Main Article Content */}
          <div className="glass-panel lg:col-span-8 xl:col-span-9 bg-white/[0.02] rounded-2xl p-6 md:p-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-blue-400 block mb-1">
                  {currentSection.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                  {currentSection.title}
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-slate-400">v1.4 Production Verified</span>
              </div>
            </div>

            {/* Dynamic Content */}
            <div className="prose prose-invert max-w-none">
              {currentSection.content}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default DocsPage;
