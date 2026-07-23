# LangGraph Red Team (Offense) / Blue Team (Defense) / Report AI agents

from typing import TypedDict, Optional

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel

from ..core.config import settings
from .sandbox_service import POC_HANDLERS

LLM_MODEL = "gpt-4o-mini"

# CVEs with a real, runnable exploit/patch pair in the Docker sandbox. The agents
# are told which findings can be *proven* here vs. which are NVD-theoretical only.
SANDBOX_VERIFIABLE_CVES = sorted(POC_HANDLERS.keys())


class OffenseAnalysis(BaseModel):
    entry_point: str
    exploit_chain: str
    assets_at_risk: list[str]
    strategic_assessment: str = ""  # Red Team "Deep Think" reasoning for the phase timeline


class Recommendation(BaseModel):
    id: Optional[str] = None  # assigned after generation, not by the LLM
    title: str
    reason: str
    estimated_impact: str
    priority: str  # high, medium, low


class DefenseOutput(BaseModel):
    recommendations: list[Recommendation]
    strategy: str = ""  # Blue Team "Deep Think" reasoning for the phase timeline


class ReportOutput(BaseModel):
    executive_summary: str
    business_impact: str


class AgentState(TypedDict):
    risk_score: int
    attack_paths: list[dict]
    offense_analysis: Optional[OffenseAnalysis]
    recommendations: list[Recommendation]
    report: Optional[ReportOutput]
    defense_strategy: str


def _llm():
    return ChatOpenAI(model=LLM_MODEL, api_key=settings.OPENAI_API_KEY, temperature=0)


def offense_node(state: AgentState) -> dict:
    structured_llm = _llm().with_structured_output(OffenseAnalysis)
    prompt = f"""You are a Red Team offense analyst reviewing a digital twin's attack path data.

Attack paths (ranked by risk score, includes CVEs per path):
{state['attack_paths']}

CVEs that can be actively proven in our Docker sandbox (live exploit + patch test): {SANDBOX_VERIFIABLE_CVES}
All other CVEs are theoretical, based on NVD version matching only.

Identify:
- entry_point: the single most critical entry point asset — name it exactly as it appears in the data
- exploit_chain: step-by-step, how an attacker chains through the highest-risk path. Reference the exact
  CVE IDs and asset names involved. Call out which steps are sandbox-verifiable vs. theoretical.
- assets_at_risk: names of assets that would be compromised (use the exact names from the data)
- strategic_assessment: 2-3 sentences of Red Team "deep think" — which path you'd prioritize and why,
  and what makes this environment easy or hard to compromise.
"""
    result = structured_llm.invoke(prompt)
    return {"offense_analysis": result}


def defense_node(state: AgentState) -> dict:
    structured_llm = _llm().with_structured_output(DefenseOutput)
    prompt = f"""You are a Blue Team defense analyst.

Offense analysis:
{state['offense_analysis']}

Attack paths (with CVEs):
{state['attack_paths']}

CVEs that can be actively proven in our Docker sandbox (live exploit + patch test): {SANDBOX_VERIFIABLE_CVES}
Prioritize sandbox-verifiable CVEs first — their fixes can be verified end-to-end before deployment.

Generate a prioritized list of remediation recommendations. Each must include:
- title: short, specific action naming the affected component and target version
  (e.g. "Upgrade ProFTPD to 1.3.6 to remove the mod_copy SITE CPFR/CPTO RCE")
- reason: why this matters, citing the exact CVE ID(s) and the exact asset(s) affected, and
  stating whether the fix is sandbox-verifiable or based on NVD version matching only
- estimated_impact: expected effect on the risk score
- priority: "high", "medium", or "low"

Also provide:
- strategy: 2-3 sentences of Blue Team "deep think" — the overall remediation strategy, what to fix
  first to break the most attack paths, and which fixes can be proven in the sandbox before rollout.
"""
    result = structured_llm.invoke(prompt)
    recommendations = result.recommendations
    for index, rec in enumerate(recommendations):
        rec.id = f"rec-{index}"
    return {"recommendations": recommendations, "defense_strategy": result.strategy}


def report_node(state: AgentState) -> dict:
    structured_llm = _llm().with_structured_output(ReportOutput)
    prompt = f"""Write a security assessment summary for a non-technical stakeholder.

Risk score: {state['risk_score']} (out of 100)
Offense analysis: {state['offense_analysis']}
Recommendations: {state['recommendations']}
CVEs proven live in our Docker sandbox: {SANDBOX_VERIFIABLE_CVES}

Produce:
- executive_summary: 2-3 sentences on the current risk posture. State the risk score, name the single most
  critical exposure (with its CVE ID and affected asset), and note that at least one finding was proven with
  a live exploit in an isolated sandbox (not just flagged by a scanner) where applicable.
- business_impact: 1-2 concrete sentences on what an attacker gains if nothing is fixed (e.g. data theft,
  remote code execution, full server control) — tie it to the specific compromised assets, not generic risk.
"""
    result = structured_llm.invoke(prompt)
    return {"report": result}


_graph = StateGraph(AgentState)
_graph.add_node("offense", offense_node)
_graph.add_node("defense", defense_node)
_graph.add_node("report", report_node)
_graph.add_edge(START, "offense")
_graph.add_edge("offense", "defense")
_graph.add_edge("defense", "report")
_graph.add_edge("report", END)
compiled_agent_graph = _graph.compile()


def _build_phase_timeline(risk_score: int, attack_paths: list[dict], state: dict) -> list[dict]:
    """Summarize the multi-agent run as an ordered phase timeline (RedAmon-style:
    Recon -> Exploitation -> Remediation -> Reporting) for the UI to render."""
    offense = state.get("offense_analysis")
    recs = state.get("recommendations") or []
    report = state.get("report")

    entry_points = sorted({p.get("entry_name") for p in attack_paths if p.get("entry_name")})
    all_cves = sorted({c["cve_id"] for p in attack_paths for c in p.get("cves", [])})

    return [
        {
            "id": "recon",
            "title": "Reconnaissance & Graph Mapping",
            "status": "complete",
            "summary": f"Mapped {len(attack_paths)} attack path(s) from {len(entry_points)} "
                       f"internet-facing entry point(s); {len(all_cves)} unique CVE(s) in scope.",
            "detail": "Entry points: " + (", ".join(entry_points) if entry_points else "none"),
        },
        {
            "id": "offense",
            "title": "Exploitation Analysis · Red Team",
            "status": "complete",
            "summary": offense.exploit_chain if offense else "No exploitable path identified.",
            "detail": offense.strategic_assessment if offense else "",
        },
        {
            "id": "defense",
            "title": "Remediation Planning · Blue Team",
            "status": "complete",
            "summary": f"Generated {len(recs)} prioritized remediation(s).",
            "detail": state.get("defense_strategy") or "",
        },
        {
            "id": "report",
            "title": "Executive Reporting",
            "status": "complete",
            "summary": report.executive_summary if report else "No report generated.",
            "detail": report.business_impact if report else "",
        },
    ]


def run_agents(risk_score: int, attack_paths: list[dict]) -> dict:
    if not attack_paths:
        return {"offense_analysis": None, "recommendations": [], "report": None, "agent_phases": []}

    initial_state: AgentState = {
        "risk_score": risk_score,
        "attack_paths": attack_paths,
        "offense_analysis": None,
        "recommendations": [],
        "report": None,
        "defense_strategy": "",
    }
    result = compiled_agent_graph.invoke(initial_state)
    result["agent_phases"] = _build_phase_timeline(risk_score, attack_paths, result)
    return result
