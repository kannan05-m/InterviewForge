"""
EvaluatorAgent
--------------
Responsibility: Score a candidate's answer against a structured rubric.
Called on-demand (per answer submission), not part of the main pipeline.

Uses a rubric with 4 dimensions rather than vibing a score — this is what
makes the evaluation defensible. Each dimension gets a rating so the
feedback is actionable, not just "good answer".

Rubric dimensions:
  - correctness:   Is the technical content accurate?
  - depth:         Does it go beyond surface-level explanation?
  - relevance:     Does it answer the specific question asked?
  - communication: Is it structured and clear (STAR for behavioral)?
"""

from .llm_client import call_llm


RUBRIC_PROMPT = """You are a senior technical interviewer evaluating a candidate's answer.

Question: {question}
Question type: {q_type}
{gap_context}
Candidate answer: {answer}

Evaluate against this rubric. Return ONLY JSON:
{{
  "score": "good | ok | bad",
  "feedback": "2-3 sentences: what was strong, what was missing, be specific",
  "suggestion": "the single most impactful thing to add or change",
  "rubric_breakdown": {{
    "correctness": "strong | partial | missing",
    "depth": "strong | partial | missing",
    "relevance": "strong | partial | missing",
    "communication": "strong | partial | missing"
  }}
}}

Score rules:
- good: 3-4 rubric dimensions are "strong"
- ok:   1-2 dimensions "strong", rest "partial"
- bad:  any dimension "missing", or answer is too vague to assess

{type_guidance}"""

TYPE_GUIDANCE = {
    "mcq": "",
    "project": "For project questions: expect the candidate to explain WHY they made the technical decision, not just WHAT it was.",
    "behavioral": "For behavioral questions: expect STAR format — Situation, Task, Action, Result. Missing Result = max 'ok'.",
    "weak": "For weak spot questions: candidate likely lacks depth here. Give credit for honest acknowledgment + adjacent knowledge.",
}


def evaluator_agent(question: str, q_type: str, answer: str, gap_skill: str = "") -> dict:
    gap_context = f"This is a weak spot question. Gap skill: {gap_skill}\n" if gap_skill else ""
    guidance = TYPE_GUIDANCE.get(q_type, "")

    data = call_llm(RUBRIC_PROMPT.format(
        question=question,
        q_type=q_type,
        gap_context=gap_context,
        answer=answer,
        type_guidance=guidance,
    ), max_tokens=512)

    return data
