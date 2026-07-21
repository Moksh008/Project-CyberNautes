# LangGraph Red Team (Offense) / Blue Team (Defense) / Report AI agents

from typing import TypedDict, Optional

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel

from ..core.config import settings

LLM_MODEL = "gpt-4o-mini"


class OffenseAnalysis(BaseModel):
    entry_point: str
    exploit_chain: str
    assets_at_risk: list[str]


class Recommendation(BaseModel):
    id: Optional[str] = None  # assigned after generation, not by the LLM
    title: str
    reason: str
    estimated_impact: str
    priority: str  # high, medium, low


class DefenseOutput(BaseModel):
    recommendations: list[Recommendation]


class ReportOutput(BaseModel):
    executive_summary: str
    business_impact: str


class AgentState(TypedDict):
    risk_score: int
    attack_paths: list[dict]
    offense_analysis: Optional[OffenseAnalysis]
    recommendations: list[Recommendation]
    report: Optional[ReportOutput]


def _llm():
    return ChatOpenAI(model=LLM_MODEL, api_key=settings.OPENAI_API_KEY, temperature=0)


def offense_node(state: AgentState) -> dict:
    structured_llm = _llm().with_structured_output(OffenseAnalysis)
    prompt = f"""You are a Red Team offense analyst reviewing a digital twin's attack path data.

Attack paths (ranked by risk score, includes CVEs per path):
{state['attack_paths']}

Identify:
- entry_point: the single most critical entry point asset
- exploit_chain: a short description of how an attacker would chain through the highest-risk path
- assets_at_risk: names of assets that would be compromised
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

Generate a prioritized list of remediation recommendations. Each must include:
- title: short action (e.g. "Patch Apache to latest version")
- reason: why this matters, referencing the relevant CVE(s)
- estimated_impact: expected effect on risk score
- priority: "high", "medium", or "low"
"""
    result = structured_llm.invoke(prompt)
    recommendations = result.recommendations
    for index, rec in enumerate(recommendations):
        rec.id = f"rec-{index}"
    return {"recommendations": recommendations}


def report_node(state: AgentState) -> dict:
    structured_llm = _llm().with_structured_output(ReportOutput)
    prompt = f"""Write a security assessment summary for a non-technical stakeholder.

Risk score: {state['risk_score']}
Offense analysis: {state['offense_analysis']}
Recommendations: {state['recommendations']}

Produce:
- executive_summary: 2-3 sentences on the current risk posture
- business_impact: 1-2 sentences on what happens if nothing is fixed
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


def run_agents(risk_score: int, attack_paths: list[dict]) -> dict:
    if not attack_paths:
        return {"offense_analysis": None, "recommendations": [], "report": None}

    initial_state: AgentState = {
        "risk_score": risk_score,
        "attack_paths": attack_paths,
        "offense_analysis": None,
        "recommendations": [],
        "report": None,
    }
    return compiled_agent_graph.invoke(initial_state)
