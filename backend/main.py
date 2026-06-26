import io
import os
import json


import pdfplumber
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
load_dotenv()

from schemas.state import GraphState
from graph.pipeline import pipeline
from agents.evaluator import evaluator_agent

app = FastAPI(title="InterviewForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_pdf_text(pdf_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages).strip()


@app.post("/api/analyze")
async def analyze(resume: UploadFile = File(...), jd: str = Form(...)):
    """
    Runs the full 4-agent LangGraph pipeline:
      ResumeParser → JDAnalyzer → GapDetector → QuestionGenerator
    Returns the final GraphState as JSON.
    """
    pdf_bytes = await resume.read()

    try:
        resume_text = extract_pdf_text(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="PDF appears to be empty or image-only.")

    initial_state = GraphState(resume_text=resume_text, jd_text=jd)

    try:
        final_state: GraphState = pipeline.invoke(initial_state)
        if isinstance(final_state, dict):
            final_state = GraphState(**final_state)
        return JSONResponse(content=final_state.model_dump(mode="json"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")


@app.post("/api/evaluate")
async def evaluate(payload: dict):
    """
    Calls EvaluatorAgent on a single answer.
    Returns rubric breakdown + score + feedback.
    """
    question = payload.get("question", "")
    q_type = payload.get("type", "")
    answer = payload.get("answer", "")
    gap_skill = payload.get("gap_skill", "")

    if not answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    try:
        result = evaluator_agent(
            question=question,
            q_type=q_type,
            answer=answer,
            gap_skill=gap_skill,
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/graph")
def get_graph():
    """
    Returns the Mermaid diagram of the pipeline graph.
    Useful for debugging and for showing in the README.
    """
    try:
        mermaid = pipeline.get_graph().draw_mermaid()
        return {"mermaid": mermaid}
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
def health():
    return {"status": "ok", "agents": ["resume_parser", "jd_analyzer", "gap_detector", "question_generator", "evaluator"]}
