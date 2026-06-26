"""
JDAnalyzerAgent
---------------
Responsibility: Parse the job description into structured requirements.
Writes: jd_required_skills, jd_responsibilities, jd_seniority_level
Reads:  jd_text

Separated from GapDetectorAgent because combining "what does the JD require"
with "what does the candidate lack" in one prompt caused the model to anchor
on the resume and miss implicit JD requirements. Independent extraction first,
comparison second.
"""

from .llm_client import call_llm
from schemas.state import GraphState


PROMPT = """You are a technical recruiter parsing a job description.

Return ONLY a JSON object with these exact keys:
{{
  "jd_required_skills": ["every technical skill, tool, framework, language explicitly or implicitly required"],
  "jd_responsibilities": ["key responsibility or expectation — keep each one concrete"],
  "jd_seniority_level": "Intern | Junior | Mid | Senior | Lead"
}}

Job Description:
{jd_text}"""


def jd_analyzer_agent(state: GraphState) -> GraphState:
    data = call_llm(PROMPT.format(jd_text=state.jd_text))

    return state.model_copy(update={
        "jd_required_skills": data.get("jd_required_skills", []),
        "jd_responsibilities": data.get("jd_responsibilities", []),
        "jd_seniority_level": data.get("jd_seniority_level", ""),
        "current_agent": "jd_analyzer",
        "completed_agents": state.completed_agents + ["jd_analyzer"],
    })
