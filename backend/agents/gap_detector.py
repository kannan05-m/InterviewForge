"""
GapDetectorAgent
----------------
Responsibility: Compare candidate profile against JD requirements.
Writes: gap_skills, strong_match_skills, probe_areas, gap_severity
Reads:  tech_stack, projects, jd_required_skills, jd_responsibilities

gap_severity ("low" | "medium" | "high") is used by a conditional edge in
the graph to scale the number of weak_spot_questions generated downstream.
This is the key architectural decision that makes question generation
adaptive rather than static.
"""

from .llm_client import call_llm
from schemas.state import GraphState


PROMPT = """You are a technical interviewer doing gap analysis.

Candidate tech stack: {tech_stack}
Candidate projects: {projects}

JD required skills: {jd_required_skills}
JD responsibilities: {jd_responsibilities}

Return ONLY a JSON object:
{{
  "gap_skills": ["skills in JD that are NOT in candidate's stack — be precise, not generic"],
  "strong_match_skills": ["skills where candidate clearly matches JD requirements"],
  "probe_areas": ["specific things an interviewer will dig into given this candidate's background — reference actual projects"],
  "gap_severity": "low | medium | high"
}}

gap_severity rules:
- low: candidate matches >80% of JD skills
- medium: candidate matches 50-80%
- high: candidate matches <50%"""


def gap_detector_agent(state: GraphState) -> GraphState:
    projects_summary = [
        {"name": p.name, "tech": p.tech, "highlights": p.highlights}
        for p in state.projects
    ]

    data = call_llm(PROMPT.format(
        tech_stack=state.tech_stack,
        projects=projects_summary,
        jd_required_skills=state.jd_required_skills,
        jd_responsibilities=state.jd_responsibilities,
    ))

    return state.model_copy(update={
        "gap_skills": data.get("gap_skills", []),
        "strong_match_skills": data.get("strong_match_skills", []),
        "probe_areas": data.get("probe_areas", []),
        "gap_severity": data.get("gap_severity", "medium"),
        "current_agent": "gap_detector",
        "completed_agents": state.completed_agents + ["gap_detector"],
    })
