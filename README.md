# 🔨 InterviewForge

> A resume-aware AI interview prep engine powered by a **5-agent LangGraph pipeline** — upload your resume and a job description, get adaptive interview questions, and receive rubric-scored feedback on your answers.

---

## ✨ What It Does

1. **Parses your resume** — extracts tech stack, projects, and experience level
2. **Analyzes the JD** — identifies required skills, responsibilities, and seniority
3. **Detects gaps** — compares your profile against the role and scores gap severity
4. **Generates adaptive questions** — MCQ, project-based, behavioral, and weak-spot questions scaled to your gap severity
5. **Evaluates your answers** — scores across 4 rubric dimensions with actionable feedback

---

## 🏗️ Multi-Agent Architecture

```
ResumeParserAgent → JDAnalyzerAgent → GapDetectorAgent ──[conditional edge]──▶ QuestionGeneratorAgent
                                                              │
                                                         gap_severity
                                                         low    → 2 weak-spot Qs
                                                         medium → 3 weak-spot Qs
                                                         high   → 5 weak-spot Qs
```

Each agent has a **single responsibility**, its own prompt, and writes only to its own keys in a shared typed `GraphState`. This means:

- Any agent can be unit-tested in isolation
- Failures are localised — a bad JD parse doesn't corrupt resume data
- The conditional edge makes question generation **adaptive** based on gap severity

### Agent Breakdown

| Agent | Reads | Writes |
|---|---|---|
| `ResumeParserAgent` | `resume_text` | `candidate_name`, `tech_stack`, `projects`, `years_experience` |
| `JDAnalyzerAgent` | `jd_text` | `jd_required_skills`, `jd_responsibilities`, `jd_seniority_level` |
| `GapDetectorAgent` | `tech_stack` + `jd_required_skills` | `gap_skills`, `strong_match_skills`, `probe_areas`, `gap_severity` |
| `QuestionGeneratorAgent` | full state | `mcq_questions`, `project_questions`, `behavioral_questions`, `weak_spot_questions` |
| `EvaluatorAgent` | single answer (on-demand) | rubric score across 4 dimensions |

### EvaluatorAgent Rubric

Rather than asking the LLM to produce a vibe score, the evaluator scores 4 dimensions independently:

| Dimension | What It Checks |
|---|---|
| **Correctness** | Is the technical content accurate? |
| **Depth** | Does the answer go beyond surface level? |
| **Relevance** | Does it actually answer the question asked? |
| **Communication** | STAR structure for behavioral; clarity for technical |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | LangGraph (StateGraph + conditional edges) |
| LLM | Groq (`llama-3.1-70b-versatile`) |
| Backend | FastAPI + Python |
| Frontend | React + Vite |
| State Schema | Pydantic (`GraphState`) |

---

## 📁 Project Structure

```
interviewforge/
├── backend/
│   ├── agents/
│   │   ├── llm_client.py          # Shared Groq client
│   │   ├── resume_parser.py       # Agent 1 — resume extraction
│   │   ├── jd_analyzer.py         # Agent 2 — JD parsing
│   │   ├── gap_detector.py        # Agent 3 — gap analysis + severity scoring
│   │   ├── question_generator.py  # Agent 4 — adaptive question generation
│   │   └── evaluator.py           # Agent 5 — rubric-based answer evaluation
│   ├── graph/
│   │   └── pipeline.py            # LangGraph StateGraph + conditional edge logic
│   ├── schemas/
│   │   └── state.py               # Typed GraphState (Pydantic)
│   └── main.py                    # FastAPI — thin HTTP layer over the pipeline
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
            ├── PipelineVisualizer.jsx   # Live Mermaid diagram of agent flow
            ├── AnalysisView.jsx
            ├── QuestionItem.jsx         # Per-question rubric breakdown
            └── ReportView.jsx
```

---

## ⚡ Quick Start

### 1. Clone & set up environment

```bash
git clone https://github.com/kannan05-m/InterviewForge.git
cd InterviewForge
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

Or export directly:
```bash
export GROQ_API_KEY=your_groq_api_key_here
```

### 2. Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open → [http://localhost:5173](http://localhost:5173)

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Run full pipeline — resume PDF + JD text → `GraphState` |
| `POST` | `/api/evaluate` | Score a single answer with the rubric evaluator |
| `GET` | `/api/graph` | Returns Mermaid diagram of the agent pipeline |
| `GET` | `/health` | Health check — lists all registered agents |

### Visualize the Pipeline

```python
from graph.pipeline import build_pipeline
g = build_pipeline()
print(g.get_graph().draw_mermaid())
```

---

## 🗺️ Roadmap

- [ ] PDF resume upload support
- [ ] Session history — track question attempts over time
- [ ] Deploy to Hugging Face Spaces

---

## 👤 Author

**Kannan Mehra**  
B.Tech AI & ML — ADGIPS, GGSIPU  
[GitHub](https://github.com/kannan05-m)

---

## 📄 License

MIT
