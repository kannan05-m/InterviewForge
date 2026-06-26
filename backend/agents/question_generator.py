"""
QuestionGeneratorAgent
----------------------
Responsibility: Generate all interview questions using the full enriched state.
Writes: mcq_questions, project_questions, behavioral_questions, weak_spot_questions
Reads:  everything from previous three agents

Receives weak_spot_count as a parameter set by the conditional edge router
based on gap_severity: low=2, medium=3, high=5.

Questions are generated in a single LLM call here because they share context
(e.g. MCQs should avoid topics covered by project questions). If generation
quality degrades, this is the natural split point — each question type becomes
its own node.
"""

from .llm_client import call_llm
from schemas.state import GraphState, MCQQuestion, ProjectQuestion, BehavioralQuestion, WeakSpotQuestion


PROMPT = """You are a senior technical interviewer generating a personalised interview question set.

Candidate: {candidate_name} ({years_experience})
Tech stack: {tech_stack}
Projects: {projects}
JD required skills: {jd_required_skills}
Gap skills (candidate is weak here): {gap_skills}
Probe areas: {probe_areas}
Seniority level expected: {seniority_level}

Generate a JSON object with exactly these keys:

{{
  "mcq_questions": [
    // exactly 4 MCQs on the candidate's OWN tech stack — not generic questions
    {{"q": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": "A", "topic": "...", "explanation": "why this answer is correct"}}
  ],
  "project_questions": [
    // exactly 3 questions that NAME a specific project from their resume
    // e.g. "In DeskHub, why did you choose JWT over session-based auth?"
    {{"q": "...", "project": "exact project name", "difficulty": "medium"}}
  ],
  "behavioral_questions": [
    // exactly 2 STAR-format questions grounded in their actual experience
    {{"q": "...", "competency": "e.g. ownership / debugging / collaboration"}}
  ],
  "weak_spot_questions": [
    // exactly {weak_spot_count} questions on gap skills — these should be hard
    {{"q": "...", "gap_skill": "exact skill name", "why_hard": "why a candidate without this skill will struggle"}}
  ]
}}"""


def question_generator_agent(state: GraphState, weak_spot_count: int = 3) -> GraphState:
    projects_summary = [
        {"name": p.name, "tech": p.tech, "highlights": p.highlights}
        for p in state.projects
    ]

    data = call_llm(PROMPT.format(
        candidate_name=state.candidate_name,
        years_experience=state.years_experience,
        tech_stack=state.tech_stack,
        projects=projects_summary,
        jd_required_skills=state.jd_required_skills,
        gap_skills=state.gap_skills,
        probe_areas=state.probe_areas,
        seniority_level=state.jd_seniority_level,
        weak_spot_count=weak_spot_count,
    ))

    mcq = [MCQQuestion(**q) for q in data.get("mcq_questions", [])]
    proj = [ProjectQuestion(**q) for q in data.get("project_questions", [])]
    beh = [BehavioralQuestion(**q) for q in data.get("behavioral_questions", [])]
    weak = [WeakSpotQuestion(**q) for q in data.get("weak_spot_questions", [])]

    return state.model_copy(update={
        "mcq_questions": mcq,
        "project_questions": proj,
        "behavioral_questions": beh,
        "weak_spot_questions": weak,
        "current_agent": "question_generator",
        "completed_agents": state.completed_agents + ["question_generator"],
    })
