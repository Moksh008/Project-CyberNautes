# SentinelAI — End-to-End Workflow

How a target goes from raw input to a verified, remediated report — and, at each
stage, **what is really executed vs. what is AI-generated analysis**. This
distinction matters: parts of the pipeline run real code against real containers,
and parts are LLM reasoning over that evidence. Both are legitimate; they are
just different kinds of output and should be read as such.

---

## Pipeline at a glance

```
  ┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
  │ 1. Ingest   │ ──▶ │ 2. Digital   │ ──▶ │ 3. Threat     │ ──▶ │ 4. Attack    │
  │ JSON/GitHub │     │    Twin      │     │    Intel      │     │    Paths     │
  └─────────────┘     │  (Neo4j)     │     │  (NVD CVEs)   │     │  (Neo4j)     │
                      └──────────────┘     └───────────────┘     └──────┬───────┘
                                                                        │
  ┌──────────────┐     ┌───────────────┐     ┌──────────────┐          │
  │ 8. Report /  │ ◀── │ 7. Sandbox    │ ◀── │ 6. Blue Team │ ◀────────┘
  │  Remediation │     │  Verify       │     │  (LLM)       │     ┌──────────────┐
  │  (LLM + code)│     │  (real Docker)│     │              │ ◀── │ 5. Red Team  │
  └──────────────┘     └───────────────┘     └──────────────┘     │  (LLM)       │
                                                                  └──────────────┘
```

Legend: **REAL** = executes code / hits a live system. **LLM** = model reasoning
over the data produced by the real stages. **DATA** = deterministic transform.

---

## Stage-by-stage

### 1. Ingest — DATA
- **JSON:** user submits an `InfrastructurePayload` (assets, software, connections).
- **GitHub:** `github_scan_service.scan_repository()` downloads the repo tarball and
  parses real dependency manifests (`package.json`, `requirements.txt`, `go.mod`,
  `pom.xml`, `Dockerfile`) into that same payload.
- Code: `server/app/api/ingest.py`, `services/github_scan_service.py`.

### 2. Digital Twin — REAL (Neo4j) + DATA
- `digital_twin_service.create_digital_twin()` persists the twin to Firestore and
  builds the graph in Neo4j (`Asset`-`RUNS`->`Software`, `Asset`-`CONNECTS_TO`->`Asset`).
- Degrades gracefully: if Neo4j/Firestore aren't configured it logs and skips,
  rather than fabricating data.
- Code: `services/digital_twin_service.py`.

### 3. Threat Intel — REAL (live NVD API)
- `threat_intel_service.map_threat_intel()` queries the **live NIST NVD API** for
  CVEs matching each asset's software versions.
- Code: `services/threat_intel_service.py`, `services/nvd_service.py`.

### 4. Attack Paths — REAL (Neo4j graph algorithm)
- `attack_path_service.compute_attack_paths()` runs a real Cypher variable-length
  path query (`-[:CONNECTS_TO*1..5]->`) and scores each path with a probabilistic
  survival formula. Produces the `risk_score` (0–100).
- Code: `services/attack_path_service.py`.

### 5. Red Team (Offense) — LLM
- `ai_agents.offense_node` — an LLM (`gpt-4o-mini`, structured output) reads the
  real attack-path data and describes the entry point, exploit chain, and assets
  at risk. It is **told which CVEs are sandbox-verifiable** so its narrative
  separates provable steps from theoretical ones.
- Output is *analysis of real data*, not itself an executed attack.

### 6. Blue Team (Defense) — LLM
- `ai_agents.defense_node` — LLM generates prioritized remediation
  recommendations, prioritizing sandbox-verifiable CVEs and citing exact CVE IDs
  and affected assets.

### 7. Sandbox Verify — REAL (ephemeral Docker) ⭐
This is the stage that turns "the scanner says you're vulnerable" into **proof**.
- `sandbox_service.verify_cve()` spins up a real ephemeral Docker container on the
  **vulnerable** image, fires a real exploit, tears it down, then repeats on the
  **patched** image. `patch_verified = exploited_before AND NOT exploited_after`.
- Every deploy → ready → inject → teardown step is streamed to the UI log.
- **Only CVEs with a registered PoC handler are proven here.** Currently:

  | CVE | Box | What actually runs |
  |-----|-----|--------------------|
  | CVE-2021-41773 | Apache 2.4.49 | Real HTTP path-traversal request; success = `/etc/passwd` leaks |
  | CVE-2021-28041 | OpenSSH <8.5 | Real TCP banner grab + version comparison |
  | CVE-2015-3306  | ProFTPD 1.3.5 | Real FTP banner/version check **+ live `SITE CPFR`/`CPTO` mod_copy attack** |

- Any CVE **outside** this table returns `patch_verified: false` with a "no
  automated sandbox test available" log line — it is honestly reported as
  *not proven*, never faked.
- Code: `services/sandbox_service.py` (`POC_HANDLERS`, `BOX_REGISTRY`).

> **Requires a running Docker daemon.** The ProFTPD box installs proftpd at
> container boot (Debian 8 `jessie` = 1.3.5 vulnerable, Debian 11 `bullseye` =
> 1.3.7 patched), so its first run pulls images and installs packages over the
> network and can take a few minutes. If Docker is down, the stage reports the
> error rather than a false pass.

### 8. Report & Remediation — LLM + DATA + REAL (GitHub PR)
- `ai_agents.report_node` — LLM writes an executive summary + business impact,
  told which findings were sandbox-proven so the report can say "verified with a
  live exploit" where true.
- **Report export** — the report tab renders a findings table (CVE / CVSS / MITRE
  ATT&CK / sandbox-verified) plus recommendations, exportable as PDF (print),
  JSON, and CSV (`client/src/utils/exportReport.ts`).
- `remediation_service.generate_remediation()` — produces deployable Bash /
  Ansible / Git-diff output for the selected fixes.
- **Auto-PR (CypherFix-lite)** — two flavors, both opening a REAL pull request on
  the ingested GitHub repo (require `GITHUB_TOKEN` with repo write access):
  - *Artifact PR* (`github_pr_service.open_remediation_pr`, `POST /api/remediation/pr`)
    — commits the generated remediation script/playbook/diff as a file.
  - *Dependency-fix PR* (`manifest_patch_service.open_manifest_fix_pr`,
    `POST /api/remediation/manifest-pr`) — actually EDITS the repo's manifests:
    re-fetches the repo, finds each vulnerable package (from the twin graph) in
    `package.json` / `requirements.txt`, bumps it to the latest stable release
    from the npm/PyPI registry (factual lookup, not LLM-guessed), commits the
    edited manifests, and opens the PR with a per-package changelog.
- After verified patches, `analyze/recompute` re-scores risk with the fixed CVEs
  excluded, showing the real before/after drop.

## Multi-agent orchestrator (phase timeline)

The Red/Blue agents (`ai_agents.py`) now emit an ordered **phase timeline** —
Recon → Exploitation (Red Team) → Remediation (Blue Team) → Reporting — each with
a status, a summary, and a "Deep Think" strategic-reasoning line. It's returned as
`agent_phases` on the analyze response and rendered as a live timeline in the UI.

## Threat-intel enrichment

Each CVE is enriched from the live NVD data with its CVSS base score + vector
string, CWE, MITRE ATT&CK technique mapping, and public exploit / advisory
reference URLs (ExploitDB-tagged links surfaced first). Shown per-CVE in the
Attack Paths tab and in the exported report.

## RedAmon-inspired features

These four capabilities were adapted (at MVP scale) from the RedAmon framework:
threat-intel enrichment, the phase-based agent orchestrator + UI timeline, the
pentest report export, and the CypherFix-style automated GitHub PR remediation.

---

## What "hardcoded" would look like vs. what this does

- ❌ Hardcoded: return a canned "exploit succeeded, risk 100→0" JSON.
- ✅ This pipeline: real NVD lookups, a real Neo4j graph query for reachability,
  and — for the three registered CVEs — a real container that is genuinely
  exploited before patching and genuinely resists after. The LLM stages only
  ever *interpret* that real evidence, and the report now marks which findings
  are sandbox-proven vs. NVD-theoretical.
