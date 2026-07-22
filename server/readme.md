# SentinelAI Backend Service

FastAPI-powered backend for SentinelAI (AI-Powered Cyber Defense Twin). Handles infrastructure ingestion, digital twin building in Neo4j, live NVD & MITRE threat intelligence mapping, shortest-path attack surface reachability analysis, ephemeral Docker Red Team sandbox detonations, LangGraph multi-agent AI assessment (Offense/Defense/Report), and remediation code generation.

---

## 🛠️ Tech Stack & Architecture

| Component | Technology |
|---|---|
| **API Framework** | FastAPI + Uvicorn |
| **Knowledge Graph** | Neo4j 5.x (Cypher queries & NetworkX analysis) |
| **Persistence** | Firebase Firestore |
| **AI Agents Engine** | LangGraph + LangChain OpenAI (`gpt-4o-mini`) |
| **Threat Intelligence** | Live NIST NVD API v2 + MITRE ATT&CK Mapping |
| **Red Team Sandbox** | Ephemeral Docker Engine API (Alpine / HTTP / SSL / SSH containers) |

---

## 🚀 Key Modules & File Structure

```
server/
├── app/
│   ├── api/                # FastAPI Routers
│   │   ├── auth.py         # Dynamic Firebase web config exposure
│   │   ├── ingest.py       # Infrastructure JSON ingestion (/api/ingest/repo)
│   │   ├── analyze.py      # Path analysis & risk recomputation (/api/analyze/*)
│   │   ├── labs.py         # HTB-style lab box deployment (/api/labs/*)
│   │   └── remediation.py  # User selections, sandbox verification & code gen
│   ├── core/               # Database & App Config
│   │   ├── config.py       # Pydantic environment configuration
│   │   ├── neo4j_db.py     # Neo4j GraphDatabase driver
│   │   └── firestore_db.py # Firebase Admin SDK & Firestore client
│   ├── data/               # Threat Intelligence & Sandbox Configs
│   │   ├── cve_database.json   # Local fallback CVE database
│   │   ├── mitre_mapping.json  # CWE-to-MITRE ATT&CK technique map
│   │   └── sandbox/            # Vulnerability container configs (e.g. httpd-vuln.conf)
│   ├── models/             # Pydantic Schemas
│   │   ├── infrastructure.py
│   │   ├── labs.py
│   │   └── remediation.py
│   ├── services/           # Core Business & AI Logic
│   │   ├── digital_twin_service.py # Ingestion & Neo4j graph construction
│   │   ├── threat_intel_service.py # Software-to-CVE mapping
│   │   ├── nvd_service.py          # Live NVD v2 API query & TTL caching
│   │   ├── attack_path_service.py  # Cypher graph reachability & risk scoring
│   │   ├── sandbox_service.py      # Docker container runner & exploit PoCs
│   │   ├── ai_agents.py            # LangGraph multi-agent state pipeline
│   │   └── remediation_service.py  # Script generation (Bash/Ansible/Git Diff)
│   └── main.py             # App entry point & CORS configuration
├── docker-compose.yml       # Local Neo4j container setup
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables & API keys
```

---

## 📡 API Endpoints Summary

### Authentication & Ingestion
* `GET /api/auth/config` — Returns client Firebase SDK credentials.
* `POST /api/ingest/repo` — Ingests infrastructure JSON payload and creates digital twin graph.

### Analysis & Threat Intel
* `POST /api/analyze/trigger` — Computes attack paths from internet entry points and runs LangGraph agents.
* `POST /api/analyze/recompute` — Recalculates environment risk score after excluding verified patched CVEs.
* `GET /api/analyze/threat-intel/{twin_id}` — Synchronizes twin software nodes with NVD API.

### Sandbox Detonation & Remediation
* `POST /api/remediation/select` — Persists user-approved recommendations.
* `POST /api/remediation/verify` — Runs automated Red Team exploit inside an ephemeral Docker container before and after patch application.
* `POST /api/remediation/generate` — Emits POSIX Bash script, Ansible playbook, or Git Diff patch code.

### Lab Boxes
* `GET /api/labs/boxes` / `POST /api/labs/deploy` / `POST /api/labs/destroy` — Manages manual lab instances.

---

## ⚡ How to Run Locally

1. **Start Neo4j Container:**
   ```bash
   docker-compose up -d
   ```
2. **Start Backend Server:**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. **Verify Health Check:**
   Open `http://localhost:8000/health` (should return `{"status": "ok", "environment": "development"}`).