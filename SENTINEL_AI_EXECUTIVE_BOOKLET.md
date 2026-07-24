# 🛡️ SentinelAI — Executive Project Booklet & Architecture Guide

```text
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     █████╗   │
│   ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║    ██╔══██╗  │
│   ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║    ███████║  │
│   ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║    ██╔══██║  │
│   ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗██║    ██║  ██║  │
│   ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝    ╚═╝  ╚═╝  │
│                                                                        │
│          AI-POWERED CYBER DEFENSE TWIN & RED-TEAM SANDBOX ENGINE       │
│                                                                        │
│                    OFFICIAL EXECUTIVE & ARCHITECTURE BOOKLET            │
│                              VERSION 1.4 (2026)                        │
└────────────────────────────────────────────────────────────────────────┘
```

> **Document Purpose:** This executive booklet presents a comprehensive overview of **SentinelAI**, an autonomous cyber defense twin platform. Designed for CISOs, Security Engineers, SOC Analysts, and B2B Stakeholders, this document outlines SentinelAI's vision, core architecture, multi-agent AI engine, micro-sandbox detonation pipeline, regulatory compliance framework, and business revenue model.

---

## 📑 Table of Contents

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Product Vision & Target Audience](#2-product-vision--target-audience)
3. [Core Platform Capabilities](#3-core-platform-capabilities)
4. [High-Level System Architecture](#4-high-level-system-architecture)
5. [End-to-End Operational Lifecycle & Workflow](#5-end-to-end-operational-lifecycle--workflow)
6. [Deep-Dive Component Specifications](#6-deep-dive-component-specifications)
   * [6.1 Neo4j Digital Twin Knowledge Graph](#61-neo4j-digital-twin-knowledge-graph)
   * [6.2 NIST NVD & MITRE ATT&CK Threat Intelligence Engine](#62-nist-nvd--mitre-attck-threat-intelligence-engine)
   * [6.3 LangGraph Multi-Agent AI Engine](#63-langgraph-multi-agent-ai-engine)
   * [6.4 Ephemeral Docker Micro-Sandbox Detonation](#64-ephemeral-docker-micro-sandbox-detonation)
   * [6.5 Automated Patch & Script Generation Engine](#65-automated-patch--script-generation-engine)
7. [Enterprise Compliance & India DPDP Act Readiness](#7-enterprise-compliance--india-dpdp-act-readiness)
8. [Commercial Strategy & Revenue Model](#8-commercial-strategy--revenue-model)
9. [Visual Architecture Graphics & Diagrams](#9-visual-architecture-graphics--diagrams)

---

## 1. Executive Summary & Problem Statement

### The Problem in Modern Cybersecurity
Modern enterprise IT environments generate thousands of security alerts daily from traditional vulnerability scanners (Nessus, Qualys, OpenVAS). However, traditional security scanning presents three critical operational flaws:

1. **Alert Fatigue Without Context:** Scanners list vulnerabilities in isolation without explaining whether a vulnerability is mathematically reachable from the internet or critical to business operations.
2. **Uncertain Patch Impact:** Security teams cannot predict if applying a vendor patch will break production services or leave secondary attack paths open.
3. **Execution Bottlenecks:** Security teams lack the time and automated tools to write custom POSIX scripts, Ansible playbooks, or Git diff patches for every flagged CVE.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      TRADITIONAL VULNERABILITY SCANNERS                │
│                                                                        │
│   [Thousands of CVE Alerts] ──► [No Reachability Context] ──► [Manual Patching] │
│                                                                        │
│   ✖ High Operational Noise    ✖ High Downtime Risk       ✖ Slow Resolution│
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SENTINELAI CYBER DEFENSE TWIN                   │
│                                                                        │
│   [Graph Topology Mining] ──► [AI Threat Reachability] ──► [Sandbox Exploit]│
│                                                                        │
│   ✔ Zero False Positives     ✔ Empirically Verified Fix  ✔ Auto Code Gen │
└────────────────────────────────────────────────────────────────────────┘
```

### The SentinelAI Solution
**SentinelAI** transforms raw vulnerability scanning into mathematical risk optimization and empirical validation. By constructing a **Neo4j Digital Twin Graph** of your infrastructure, SentinelAI uses a **LangGraph Multi-Agent System** to simulate adversary attack chains, detonates live exploits inside ephemeral **Docker Micro-Sandboxes**, and automatically emits production-ready remediation code.

---

## 2. Product Vision & Target Audience

### Primary Objective
To enable organizations to **mathematically evaluate, actively test in a sandbox, and automatically remediate** complex cyber threat vectors with zero production risk.

### Ideal Customer Profiles (ICP) & Target Personas

```text
┌───────────────────────────┬────────────────────────────────────────────┐
│ User Role                 │ SentinelAI Core Value Proposition          │
├───────────────────────────┼────────────────────────────────────────────┤
│ Security Analyst / SOC    │ Visualizes real attack paths and severable │
│                           │ compromise vectors instantly in Neo4j.     │
├───────────────────────────┼────────────────────────────────────────────┤
│ CISO & Security Director  │ Quantifies business risk reduction and     │
│                           │ ensures compliance (DPDP, CERT-In, ISO).   │
├───────────────────────────┼────────────────────────────────────────────┤
│ Security / DevOps Engineer│ Receives auto-generated POSIX Bash,        │
│                           │ Ansible, and Git Diff patch scripts.       │
├───────────────────────────┼────────────────────────────────────────────┤
│ MSSP & Security Auditor   │ Multi-tenant client scanning & automated   │
│                           │ executive PDF audit report exports.        │
└───────────────────────────┴────────────────────────────────────────────┘
```

---

## 3. Core Platform Capabilities

* 🌐 **Infrastructure Digital Twin Ingestion:** Parses cloud and enterprise infrastructure topology JSONs to build a queryable digital twin.
* 🕸️ **Graph-Based Attack Path Analysis:** Leverages Cypher graph queries to identify shortest attack reachability paths from public ingress nodes to private assets.
* 🛡️ **Live Threat Intelligence Integration:** Queries the NIST NVD API v2 with automatic local caching and maps CWE identifiers directly to MITRE ATT&CK techniques.
* 🤖 **LangGraph Multi-Agent AI Orchestration:** Features stateful Offense (Red Team), Defense (Blue Team), and Executive Reporter AI agents.
* ⚡ **Ephemeral Micro-Sandbox Detonation:** Spins up isolated Docker containers to execute active exploits before and after patch application to prove zero-day reachability.
* 📝 **Automated Patch & Script Export:** Generates executable POSIX Bash scripts, Ansible playbooks, and Git diff patches ready for production deployment.

---

## 4. High-Level System Architecture

SentinelAI employs a microservices-based, containerized architecture that separates data ingestion, graph computation, AI agent orchestration, and sandbox detonation.

```text
               ┌─────────────────────────────────────────┐
               │    SentinelAI React + Vite Client       │
               │ (Dark Theme UI, 3D GLB, Tailwind CSS)   │
               └────────────────────┬────────────────────┘
                                    │ HTTPS / REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend Gateway                          │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Ingestion Router │  │ Analysis Router  │  │ Remediation Router   │ │
│  │ (/api/ingest)    │  │ (/api/analyze)   │  │ (/api/remediation)   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘ │
└───────────┼─────────────────────┼───────────────────────┼─────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌──────────────────────┐┌──────────────────┐┌───────────────────────────┐
│   Neo4j 5.x Graph    ││ NIST NVD v2 API  ││ Ephemeral Docker Engine   │
│ (Digital Twin Graph) ││ & MITRE ATT&CK   ││ (Red Team Sandbox Runner) │
└──────────────────────┘└──────────────────┘└───────────────────────────┘
            ▲                                             ▲
            │             ┌──────────────────┐            │
            └─────────────┤ LangGraph Agent  ├────────────┘
                          │ Pipeline Engine  │
                          └──────────────────┘
```

---

## 5. End-to-End Operational Lifecycle & Workflow

SentinelAI executes a rigorous 10-phase operational lifecycle:

```text
 ┌───────────────────────────┐
 │ 1. Ingest Infrastructure  │ ──► Upload JSON payload (Servers, DBs, Services, Ports)
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 2. Build Digital Twin     │ ──► Construct Neo4j Knowledge Graph nodes & edges
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 3. Threat Intel Sync      │ ──► Fetch live NIST NVD CVEs & map MITRE ATT&CK techniques
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 4. Compute Reachability   │ ──► Execute Cypher shortest-path reachability query
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 5. Multi-Agent AI Audit   │ ──► LangGraph Offense, Defense, and Reporter Agent execution
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 6. User Control Selection │ ──► Analyst chooses feasible security controls on UI
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 7. Micro-Sandbox Test     │ ──► Ephemeral Docker container exploit & patch verification
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 8. Recompute Risk Score   │ ──► Neo4j graph recalculation post-verification
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 9. Generate Patch Code    │ ──► Auto-generate POSIX Bash / Ansible / Git Diff
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 10. Production Deployment │ ──► Executed by DevOps team with complete audit log
 └───────────────────────────┘
```

---

## 6. Deep-Dive Component Specifications

### 6.1 Neo4j Digital Twin Knowledge Graph
The heart of SentinelAI is its Neo4j graph representation. Instead of inspecting files in isolation, the system maps physical and logical dependencies.

* **Node Types:** `Asset` (Server, DB, Gateway), `Software` (HTTPD, OpenSSL, PostgreSQL), `CVE` (CVE-2024-6387), `MITRE_Technique` (T1190).
* **Edge Types:** `:RUNS`, `:DEPENDS_ON`, `:CONNECTED_TO`, `:HAS_CVE`, `:MAPS_TO`.

```cypher
// Cypher Shortest Attack Path Reachability Query
MATCH (entry:Asset {is_internet_facing: true})
MATCH (target:Asset {type: 'database'})
MATCH p = shortestPath((entry)-[*..6]->(target))
RETURN p, length(p) AS hop_count
```

### 6.2 NIST NVD & MITRE ATT&CK Threat Intelligence Engine
SentinelAI integrates with the NIST National Vulnerability Database API v2.
* **Caching Strategy:** Local JSON caching (`cve_database.json`) with configurable Time-To-Live (TTL) to avoid API rate limits.
* **ATT&CK Resolution:** Maps Common Weakness Enumeration (CWE) IDs to MITRE ATT&CK Tactics & Techniques (e.g., `CWE-89` ➔ `T1059.001 Command and Scripting Interpreter: PowerShell/Bash`).

### 6.3 LangGraph Multi-Agent AI Engine
Built on LangChain & LangGraph, SentinelAI coordinates three stateful agents:

1. 🔴 **Offense Agent (Red Team):** Evaluates graph attack paths and crafts simulated attack vectors.
2. 🔵 **Defense Agent (Blue Team):** Formulates targeted mitigation controls and patch commands.
3. 📋 **Executive Security Reporter:** Synthesizes technical findings into executive reports.

### 6.4 Ephemeral Docker Micro-Sandbox Detonation
To prove zero-day exploitability without risking production downtime, SentinelAI spins up lightweight Docker containers (e.g., Alpine Linux with vulnerable package mirrors).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   EPHEMERAL DOCKER SANDBOX PIPELINE                    │
│                                                                        │
│ ┌────────────────────────┐  ┌─────────────────────┐  ┌───────────────┐ │
│ │ 1. Spin Container      │─►│ 2. Detonate Exploit │─►│ 3. Apply Fix  │ │
│ │    (Mocked Target)     │  │    (Verify RCE)     │  │    (Run Patch)│ │
│ └────────────────────────┘  └─────────────────────┘  └───────┬───────┘ │
│                                                              │         │
│                                                              ▼         │
│ ┌────────────────────────┐  ┌─────────────────────┐  ┌───────────────┐ │
│ │ 5. Destroy Container   │◄─│ 4. Re-run Exploit   │◄─│ Empirical     │ │
│ │    (Zero Resource Leaks)  │ Verify Failure (Pass)  │ Proof Achieved│ │
│ └────────────────────────┘  └─────────────────────┘  └───────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Automated Patch & Script Generation Engine
Once verified in the micro-sandbox, SentinelAI generates copy-pasteable, production-ready remediation code:
* **POSIX Bash Scripts:** Shell scripts with safety checks, backup steps, and package updates.
* **Ansible Playbooks:** Infrastructure-as-Code (IaC) playbooks for automated cluster-wide rollout.
* **Git Diff Patches:** Code-level unified diffs for software repositories.

---

## 7. Enterprise Compliance & India DPDP Act Readiness

SentinelAI is specifically built to fulfill stringent regulatory requirements across India and global markets:

```text
┌───────────────────────────┬────────────────────────────────────────────┐
│ Regulation / Framework    │ How SentinelAI Guarantees Compliance       │
├───────────────────────────┼────────────────────────────────────────────┤
│ Digital Personal Data     │ Maps database nodes containing PII and     │
│ Protection (DPDP) Act 2023│ verifies data isolation pathways,          │
│ (India)                   │ preventing penalties up to ₹250 Crore.     │
├───────────────────────────┼────────────────────────────────────────────┤
│ CERT-In 6-Hour Incident   │ Automatically exports full incident        │
│ Reporting Mandate         │ timelines and attack hop telemetry logs.   │
├───────────────────────────┼────────────────────────────────────────────┤
│ ISO 27001 & SOC 2         │ Provides audit-ready proof of continuous   │
│ Security Controls         │ vulnerability assessment & patch testing.  │
├───────────────────────────┼────────────────────────────────────────────┤
│ RBI & SEBI Data           │ Offers air-gapped, on-premise installation │
│ Localization (BFSI)       │ running local Neo4j & local LLMs.          │
└───────────────────────────┴────────────────────────────────────────────┘
```

---

## 8. Commercial Strategy & Revenue Model

SentinelAI employs a transparent, value-driven subscription model tailored for startups, growth companies, and enterprise organizations in India and internationally.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        REGIONAL PRICING TIERS                          │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ Tier            │ Target Audience  │ Pricing (INR)   │ Pricing (USD)   │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 🎓 Student      │ Students, CTF    │ FREE            │ FREE            │
│                 │ Researchers      │ (Forever)       │ (Forever)       │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 🚀 Starter      │ Early Startups & │ ₹1,999 / mo     │ $29 / mo        │
│                 │ Dev Teams        │ (₹1,599/mo yr)  │ ($24/mo yr)     │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 💼 Business     │ Growth Startups &│ ₹14,999 / mo    │ $199 / mo       │
│    (Most Popular)│ Active Cloud     │ (₹11,999/mo yr) │ ($159/mo yr)    │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 🏢 Enterprise   │ Banks, BFSI, &   │ ₹39,999 / mo    │ $499 / mo       │
│                 │ Large Teams      │ (₹31,999/mo yr) │ ($399/mo yr)    │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

---

## 9. Visual Architecture Graphics & Diagrams

### Full End-to-End System Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Security Analyst
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant Graph as Neo4j Database
    participant NVD as NIST NVD API
    participant AI as LangGraph Engine
    participant Box as Docker Sandbox

    Analyst->>UI: Upload Infrastructure JSON
    UI->>API: POST /api/ingest/repo
    API->>Graph: Construct Nodes & Relationships
    API->>NVD: Query CVEs & MITRE Mapping
    API->>Graph: Update CVE & Vulnerability Edges
    
    Analyst->>UI: Trigger Attack Surface Analysis
    UI->>API: POST /api/analyze/trigger
    API->>Graph: Execute Cypher Shortest Path Query
    API->>AI: Execute Offense, Defense & Report Agents
    AI-->>UI: Display Attack Path & Recommendations

    Analyst->>UI: Select Preferred Mitigations
    UI->>API: POST /api/remediation/verify
    API->>Box: Spin Up Ephemeral Container
    API->>Box: Run Red Team Exploit (Verify Failure)
    API->>Box: Apply Patch & Re-run Exploit (Verify Success)
    API->>Box: Destroy Container
    
    API->>Graph: Recompute Risk Score Post-Verification
    API-->>UI: Return Verified Remediation Code (Bash/Ansible/Git Diff)
```

---

## 📌 Booklet Summary & Contact Information

SentinelAI bridges the gap between vulnerability detection and patch execution. By transforming infrastructure topologies into actionable graph intelligence, SentinelAI allows security teams to act with mathematical precision and total confidence.

* **Repository:** `d:\cd`
* **Backend:** FastAPI + Neo4j 5.x + LangGraph + Docker Engine
* **Frontend:** React + Vite + Tailwind CSS + 3D GLB Model Viewer
* **Documentation Portal:** `/docs`
* **Pricing Portal:** `/pricing`

---
*© 2026 SentinelAI Cyber Defense Twin. All Rights Reserved.*
