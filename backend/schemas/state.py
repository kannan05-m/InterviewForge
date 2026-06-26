from typing import Optional
from pydantic import BaseModel, Field


class Project(BaseModel):
    name: str
    tech: list[str]
    highlights: list[str]


class MCQQuestion(BaseModel):
    q: str
    options: list[str]          # ["A) ...", "B) ...", "C) ...", "D) ..."]
    correct: str                # "A" | "B" | "C" | "D"
    topic: str
    explanation: str


class ProjectQuestion(BaseModel):
    q: str
    project: str
    difficulty: str             # "easy" | "medium" | "hard"


class BehavioralQuestion(BaseModel):
    q: str
    competency: str


class WeakSpotQuestion(BaseModel):
    q: str
    gap_skill: str
    why_hard: str


class EvaluationResult(BaseModel):
    score: str                  # "good" | "ok" | "bad"
    feedback: str
    suggestion: str
    rubric_breakdown: dict[str, str] = Field(default_factory=dict)


# ---------- Pipeline state ----------

class GraphState(BaseModel):
    """
    Typed state object passed between every agent node.
    Each agent reads what it needs and writes its own output keys.
    Immutable fields are set once; agent fields are set by their node.
    """

    # -- inputs (set at pipeline entry) --
    resume_text: str = ""
    jd_text: str = ""

    # -- ResumeParserAgent output --
    candidate_name: str = ""
    years_experience: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    raw_resume_sections: dict[str, str] = Field(default_factory=dict)

    # -- JDAnalyzerAgent output --
    jd_required_skills: list[str] = Field(default_factory=list)
    jd_responsibilities: list[str] = Field(default_factory=list)
    jd_seniority_level: str = ""

    # -- GapDetectorAgent output --
    gap_skills: list[str] = Field(default_factory=list)
    strong_match_skills: list[str] = Field(default_factory=list)
    probe_areas: list[str] = Field(default_factory=list)
    gap_severity: str = "medium"    # "low" | "medium" | "high" — drives weak_spot count

    # -- QuestionGeneratorAgent output --
    mcq_questions: list[MCQQuestion] = Field(default_factory=list)
    project_questions: list[ProjectQuestion] = Field(default_factory=list)
    behavioral_questions: list[BehavioralQuestion] = Field(default_factory=list)
    weak_spot_questions: list[WeakSpotQuestion] = Field(default_factory=list)

    # -- pipeline metadata --
    current_agent: str = ""
    errors: list[str] = Field(default_factory=list)
    completed_agents: list[str] = Field(default_factory=list)
