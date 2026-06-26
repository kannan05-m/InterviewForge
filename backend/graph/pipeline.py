"""
InterviewForge Pipeline
-----------------------
LangGraph StateGraph wiring 5 agents into a directed pipeline.

Graph structure:
  START
    → resume_parser          (parse PDF text → structured candidate data)
    → jd_analyzer            (parse JD → required skills + seniority)
    → gap_detector           (diff candidate vs JD → gap_severity)
    → [conditional edge]     (gap_severity routes to question_generator
                              with different weak_spot_count)
    → question_generator_*   (generate personalised question set)
    → END

Conditional edge: gap_severity → weak_spot_count
  "low"    → 2 weak spot questions
  "medium" → 3 weak spot questions
  "high"   → 5 weak spot questions

This makes the pipeline adaptive — a candidate with many gaps gets harder
and more targeted preparation than one who nearly matches the JD.

To visualise the graph:
  from graph.pipeline import build_pipeline
  g = build_pipeline()
  print(g.get_graph().draw_mermaid())
"""

from functools import partial
from langgraph.graph import StateGraph, START, END

from schemas.state import GraphState
from agents import (
    resume_parser_agent,
    jd_analyzer_agent,
    gap_detector_agent,
    question_generator_agent,
)


# ---------- conditional edge router ----------

def route_by_gap_severity(state: GraphState) -> str:
    """
    Routes to a labelled node so weak_spot_count is baked in at graph
    construction time rather than passed as runtime state — keeps the
    node signatures clean and the graph inspectable.
    """
    return {
        "low": "question_generator_low",
        "medium": "question_generator_medium",
        "high": "question_generator_high",
    }.get(state.gap_severity, "question_generator_medium")


# ---------- wrapped node functions (partial application of weak_spot_count) ----------

def qgen_low(state: GraphState) -> GraphState:
    return question_generator_agent(state, weak_spot_count=2)

def qgen_medium(state: GraphState) -> GraphState:
    return question_generator_agent(state, weak_spot_count=3)

def qgen_high(state: GraphState) -> GraphState:
    return question_generator_agent(state, weak_spot_count=5)


# ---------- graph builder ----------

def build_pipeline() -> StateGraph:
    graph = StateGraph(GraphState)

    graph.add_node("resume_parser", resume_parser_agent)
    graph.add_node("jd_analyzer", jd_analyzer_agent)
    graph.add_node("gap_detector", gap_detector_agent)
    graph.add_node("question_generator_low", qgen_low)
    graph.add_node("question_generator_medium", qgen_medium)
    graph.add_node("question_generator_high", qgen_high)

    graph.add_edge(START, "resume_parser")
    graph.add_edge("resume_parser", "jd_analyzer")
    graph.add_edge("jd_analyzer", "gap_detector")

    graph.add_conditional_edges(
        "gap_detector",
        route_by_gap_severity,
        {
            "question_generator_low": "question_generator_low",
            "question_generator_medium": "question_generator_medium",
            "question_generator_high": "question_generator_high",
        },
    )

    graph.add_edge("question_generator_low", END)
    graph.add_edge("question_generator_medium", END)
    graph.add_edge("question_generator_high", END)

    return graph.compile()


# singleton — compiled once at import time
pipeline = build_pipeline()
