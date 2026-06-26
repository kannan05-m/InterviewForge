# InterviewForge 🔨

Resume-aware AI interview prep engine built on a **multi-agent LangGraph pipeline**.

## Architecture

```
ResumeParserAgent → JDAnalyzerAgent → GapDetectorAgent ──[conditional edge]──▶ QuestionGeneratorAgent
                                                          gap_severity
                                                          low  → 2 weak-spot Qs
                                                          medium → 3 weak-spot Qs
                                                          high → 5 weak-spot Qs
```

Each agent has a **single responsibility**, its own prompt, and writes only to its own keys in `GraphState`. This means:
- Any agent can be unit-tested in isolation
- Failures are localised — a bad JD parse doesn't corrupt resume data
- The conditional edge makes question generation *adaptive* based on gap severity

### Agent breakdown

| Agent | Reads | Writes |
|-------|-------|--------|
| `ResumeParserAgent` | `resume_text` | `candidate_name`, `tech_stack`, `projects`, `years_experience` |
| `JDAnalyzerAgent` | `jd_text` | `jd_required_skills`, `jd_responsibilities`, `jd_seniority_level` |
| `GapDetectorAgent` | tech_stack + jd_required_skills | `gap_skills`, `strong_match_skills`, `probe_areas`, `gap_severity` |
| `QuestionGeneratorAgent` | full state | `mcq_questions`, `project_questions`, `behavioral_questions`, `weak_spot_questions` |
| `EvaluatorAgent` | single answer (on-demand) | rubric score across 4 dimensions |

### EvaluatorAgent rubric dimensions

Instead of vibing a score, the evaluator scores 4 dimensions independently:
- **correctness** — is the technical content accurate?
- **depth** — beyond surface-level?
- **relevance** — answers the specific question?
- **communication** — STAR structure for behavioral, clarity for technical?

## Quick Start

### 1. Set your API key

```bash
export GROQ_API_KEY=gsk_...
```

Or create `backend/.env`:
```
GROQ_API_KEY=gsk_...
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | Run full pipeline — resume PDF + JD → `GraphState` |
| `POST` | `/api/evaluate` | Score a single answer with rubric |
| `GET`  | `/api/graph`   | Returns Mermaid diagram of the pipeline |
| `GET`  | `/health`      | Lists all agents |

### Visualise the graph

```python
from graph.pipeline import build_pipeline
g = build_pipeline()
print(g.get_graph().draw_mermaid())
```

## Project structure

```
interviewforge/
├── backend/
│   ├── agents/
│   │   ├── llm_client.py        # shared Groq client
│   │   ├── resume_parser.py     # Agent 1
│   │   ├── jd_analyzer.py       # Agent 2
│   │   ├── gap_detector.py      # Agent 3
│   │   ├── question_generator.py# Agent 4
│   │   └── evaluator.py         # Agent 5 (on-demand)
│   ├── graph/
│   │   └── pipeline.py          # LangGraph StateGraph + conditional edge
│   ├── schemas/
│   │   └── state.py             # Typed GraphState (Pydantic)
│   └── main.py                  # FastAPI — thin HTTP layer
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
            ├── PipelineVisualizer.jsx
            ├── AnalysisView.jsx
            ├── QuestionItem.jsx     # rubric breakdown display
            └── ReportView.jsx
```

## Resume talking points

> "I decomposed the pipeline into 5 specialised agents because a single monolithic prompt hallucinated on gap analysis — combining JD parsing with gap detection caused it to anchor on the resume and miss implicit JD requirements."

> "The conditional edge routes to one of three QuestionGenerator variants based on `gap_severity` — low/medium/high — so weak-spot question count scales adaptively with how big the candidate's gaps are."

> "Each agent writes only to its own keys in a shared typed `GraphState`, so any node can be replayed in isolation for debugging, and failures are localised."

> "The EvaluatorAgent scores across four rubric dimensions rather than asking the LLM to vibe a rating — correctness, depth, relevance, communication — which makes the feedback actionable."
