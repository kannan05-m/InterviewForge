"""
ResumeParserAgent
-----------------
Responsibility: Extract structured candidate data from raw resume text.
Writes: candidate_name, years_experience, tech_stack, projects, raw_resume_sections
Reads:  resume_text

Kept separate from JD analysis so failures in resume parsing don't corrupt
JD extraction, and so this node can be unit-tested with just a resume.
"""

from .llm_client import call_llm
from schemas.state import GraphState, Project


PROMPT = """You are a resume parser. Extract structured information from this resume text.

Return ONLY a JSON object with these exact keys:
{{
  "candidate_name": "full name or empty string",
  "years_experience": "e.g. 2 years or Fresher",
  "tech_stack": ["list", "of", "every", "technology", "tool", "language", "framework", "mentioned"],
  "projects": [
    {{
      "name": "project name",
      "tech": ["tech used"],
      "highlights": ["key technical decision or achievement — be specific, e.g. 'Used JWT with refresh token rotation for stateless auth'"]
    }}
  ],
  "raw_resume_sections": {{
    "education": "raw text of education section",
    "experience": "raw text of experience section",
    "skills": "raw text of skills section"
  }}
}}

Resume text:
{resume_text}"""


def resume_parser_agent(state: GraphState) -> GraphState:
    data = call_llm(PROMPT.format(resume_text=state.resume_text))

    projects = [
        Project(
            name=p.get("name", ""),
            tech=p.get("tech", []),
            highlights=p.get("highlights", []),
        )
        for p in data.get("projects", [])
    ]

    return state.model_copy(update={
        "candidate_name": data.get("candidate_name", ""),
        "years_experience": data.get("years_experience", ""),
        "tech_stack": data.get("tech_stack", []),
        "projects": projects,
        "raw_resume_sections": data.get("raw_resume_sections", {}),
        "current_agent": "resume_parser",
        "completed_agents": state.completed_agents + ["resume_parser"],
    })
