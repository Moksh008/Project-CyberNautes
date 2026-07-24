from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

SENTINEL_SYSTEM_PROMPT = """You are SentinelAI, an expert AI assistant embedded inside the SentinelAI Cyber Defense platform.
You are helping security analysts, developers, and executives understand and use the SentinelAI platform.

## About SentinelAI Platform
SentinelAI is an AI-powered cybersecurity platform that:
1. **Digital Twin Construction**: Ingests infrastructure descriptions (JSON or GitHub repos) and builds a Neo4j graph-based Digital Twin of the environment mapping assets, software versions, and network connections.
2. **Vulnerability Scanning (CVEs)**: Queries the NIST National Vulnerability Database (NVD) in real-time to find known CVEs in the detected software versions.
3. **Attack Path Mapping**: Runs graph reachability analysis on the Neo4j Digital Twin to discover multi-hop exploit chains from internet-facing assets to critical databases.
4. **AI Red Team & Blue Team Agents**: Uses LangGraph-orchestrated AI agents -- a Red Team (offensive analysis) that maps exploit chains and a Blue Team (defensive analysis) that generates prioritized remediation recommendations.
5. **Docker Sandbox Exploitation**: For certain high-risk CVEs, spins up ephemeral Docker containers to live-detonate exploit payloads and verify patch efficacy.
6. **Remediation Code Generation**: Auto-generates hardening scripts (Bash, Ansible, Git Diff/Patch) and can open GitHub Pull Requests automatically.
7. **Executive Report**: Generates a board-level security assessment with risk scores, attack narrative, business impact, compliance notes, and remediation roadmap.

## Technical Stack
- Frontend: React + TypeScript + Redux Toolkit + Vite
- Backend: FastAPI (Python) + Neo4j graph database + Firebase Auth
- AI: LangGraph + OpenAI GPT-4o-mini for Red/Blue team agents
- Vulnerability Data: NIST NVD API for real-time CVE lookups
- Infrastructure Ingestion: Manual JSON upload OR automatic GitHub repository scanning

## How Ingestion Works
- JSON Mode: User provides a JSON with assets (name, type, OS, software list) and connections.
- GitHub Mode: Provide a public GitHub repo URL. SentinelAI downloads the repo, parses dependency manifests (package.json, requirements.txt, pom.xml, etc.) and auto-builds the Digital Twin.

## Key Concepts
- Risk Score: 0-100 score calculated from CVSS severity scores of CVEs found in attack paths
- Attack Path: A sequence of assets an attacker would traverse to reach a critical target
- Sandbox Verification: Live Docker exploit + patch verification for supported CVEs
- Digital Twin: A graph model of the infrastructure in Neo4j

## How to Use This Platform (Step-by-Step)
1. Upload infrastructure JSON or paste a GitHub URL in the main panel
2. Click Analyze -- the system builds the Digital Twin and finds CVEs
3. Review attack paths in the Attack Paths tab
4. Accept Blue Team recommendations in the Recommendations tab
5. Run Docker sandbox verification (optional but recommended)
6. Generate remediation code (Bash/Ansible/Git Diff)
7. Download the executive report (PDF/JSON/CSV)

Be helpful, concise, and technical but also approachable. Explain features clearly. Always be encouraging and guide users to use the platform effectively.
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[list[ChatMessage]] = []
    twin_name: Optional[str] = None
    risk_score: Optional[int] = None
    asset_count: Optional[int] = None
    cve_count: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    model_used: str


def _build_context_suffix(req: ChatRequest) -> str:
    parts = []
    if req.twin_name:
        parts.append(f"Current Digital Twin: {req.twin_name}")
    if req.risk_score is not None:
        parts.append(f"Current Risk Score: {req.risk_score}/100")
    if req.asset_count is not None:
        parts.append(f"Assets in Twin: {req.asset_count}")
    if req.cve_count is not None:
        parts.append(f"Unique CVEs Detected: {req.cve_count}")
    if parts:
        return "\n\n[Current Session Context: " + " | ".join(parts) + "]"
    return ""


async def _try_openai(req: ChatRequest) -> Optional[str]:
    if not settings.OPENAI_API_KEY:
        return None
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        messages = [{"role": "system", "content": SENTINEL_SYSTEM_PROMPT}]
        for msg in (req.history or []):
            messages.append({"role": msg.role, "content": msg.content})
        user_msg = req.message + _build_context_suffix(req)
        messages.append({"role": "user", "content": user_msg})
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=800,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning(f"OpenAI chat failed: {e}")
        return None


async def _try_google(req: ChatRequest) -> Optional[str]:
    if not settings.GOOGLE_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SENTINEL_SYSTEM_PROMPT
        )
        history_items = []
        for msg in (req.history or []):
            history_items.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [msg.content]
            })
        chat_session = model.start_chat(history=history_items)
        user_msg = req.message + _build_context_suffix(req)
        response = chat_session.send_message(user_msg)
        return response.text
    except Exception as e:
        logger.warning(f"Google Gemini chat failed: {e}")
        return None


def _fallback_reply(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["what is", "what does", "explain", "how does", "tell me about", "how do i", "how to"]):
        return "SentinelAI is an AI-powered cybersecurity platform that builds a Digital Twin of your infrastructure and uses AI agents (Red Team + Blue Team) to simulate attacks and generate remediation. Upload an infrastructure JSON or paste a GitHub URL to get started. To get detailed AI-powered answers, configure an OpenAI or Google API key in the server .env file."
    if any(w in msg for w in ["attack", "path", "exploit", "cve", "vulnerability"]):
        return "SentinelAI maps attack paths by running graph reachability analysis on the Neo4j Digital Twin. It finds CVEs in your software versions via the NIST NVD API and maps which vulnerabilities an attacker can chain to reach critical assets. Check the Attack Paths tab for details."
    if any(w in msg for w in ["sandbox", "docker", "verify", "detonate"]):
        return "The Docker Sandbox spins up ephemeral containers to live-detonate exploit payloads against unpatched and patched builds. This proves that a patch actually closes the vulnerability in a real isolated environment."
    if any(w in msg for w in ["report", "pdf", "ciso", "executive"]):
        return "The Executive Report provides a board-level security assessment with risk scores, attack narrative, business impact, compliance notes (MITRE ATT&CK), and a remediation roadmap. Export as PDF, JSON, or CSV."
    if any(w in msg for w in ["risk", "score", "posture"]):
        return "The Risk Score is a 0-100 value calculated from CVSS severity scores of CVEs found in attack paths that can reach critical assets. A score above 70 is Critical Threat, 40-70 is High Threat, below 40 is Low Risk."
    if any(w in msg for w in ["github", "repo", "repository"]):
        return "Paste any public GitHub repository URL in the input field and select GitHub mode. SentinelAI will download and scan the repo's dependency manifests (package.json, requirements.txt, pom.xml, go.mod, Gemfile) and auto-build a Digital Twin from the detected software versions."
    return "I am SentinelAI -- your embedded security assistant. I can explain how the platform works, help you understand CVEs, attack paths, sandbox verification, and reports. To get full AI-powered answers, configure an OpenAI or Google API key in the server .env file. What would you like to know?"


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    reply = await _try_openai(req)
    model_used = "gpt-4o-mini"

    if reply is None:
        reply = await _try_google(req)
        model_used = "gemini-1.5-flash"

    if reply is None:
        reply = _fallback_reply(req.message)
        model_used = "fallback"

    return ChatResponse(reply=reply, model_used=model_used)
