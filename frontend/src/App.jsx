import { useState, useRef } from 'react'
import PipelineVisualizer from './components/PipelineVisualizer'
import AnalysisView from './components/AnalysisView'
import QuestionItem from './components/QuestionItem'
import ReportView from './components/ReportView'

const PHASES = ['Upload', 'Pipeline', 'Test', 'Report']

const SECTIONS = [
  { types: ['mcq'],       label: 'Technical MCQ',       icon: 'ti-brain',        color: 'var(--blue)'   },
  { types: ['project'],   label: 'Project deep-dives',  icon: 'ti-code',         color: 'var(--purple)' },
  { types: ['behavioral'],label: 'Behavioral',           icon: 'ti-users',        color: 'var(--green)'  },
  { types: ['weak'],      label: 'Weak spot questions', icon: 'ti-alert-circle', color: 'var(--amber)'  },
]

export default function App() {
  const [phase, setPhase] = useState(0)
  const [pdfFile, setPdfFile] = useState(null)
  const [jd, setJd] = useState('')
  const [drag, setDrag] = useState(false)

  // pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [completedAgents, setCompletedAgents] = useState([])
  const [pipelineError, setPipelineError] = useState('')
  const [analysis, setAnalysis] = useState(null)

  // test state
  const [questions, setQuestions] = useState([])
  const [scores, setScores] = useState({})   // { [q.id]: 'good' | 'ok' | 'bad' }

  const fileRef = useRef()

  // ── file handling ──────────────────────────────────────────────
  function handleFile(f) {
    if (f?.type === 'application/pdf') setPdfFile(f)
  }

  // ── pipeline ───────────────────────────────────────────────────
  async function runPipeline() {
    setPipelineRunning(true)
    setPipelineError('')
    setCompletedAgents([])
    setPhase(1)

    const form = new FormData()
    form.append('resume', pdfFile)
    form.append('jd', jd)

    // Simulate agent progress while waiting for the single API call.
    // In production you'd use SSE/websockets to stream real agent completions.
    const agentOrder = ['resume_parser', 'jd_analyzer', 'gap_detector', 'question_generator']
    const delays = [1200, 2400, 3600]   // mark first 3 done before response arrives
    const timers = delays.map((d, i) =>
      setTimeout(() => setCompletedAgents(prev => [...prev, agentOrder[i]]), d)
    )

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/analyze`, { method: 'POST', body: form })
      timers.forEach(clearTimeout)

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }

      const data = await res.json()
      setCompletedAgents(agentOrder)   // mark all done
      setAnalysis(data)
      setPipelineRunning(false)
    } catch (e) {
      timers.forEach(clearTimeout)
      setPipelineError(e.message)
      setPipelineRunning(false)
    }
  }

  // ── test ────────────────────────────────────────────────────────
  function startTest() {
    if (!analysis) return
    const qs = [
      ...(analysis.mcq_questions       || []).map((q, i) => ({ ...q, type: 'mcq',       id: 'mcq_'  + i })),
      ...(analysis.project_questions   || []).map((q, i) => ({ ...q, type: 'project',   id: 'proj_' + i })),
      ...(analysis.behavioral_questions|| []).map((q, i) => ({ ...q, type: 'behavioral',id: 'beh_'  + i })),
      ...(analysis.weak_spot_questions || []).map((q, i) => ({ ...q, type: 'weak',      id: 'weak_' + i })),
    ]
    setQuestions(qs)
    setScores({})
    setPhase(2)
  }

  async function evaluateAnswer(q, answer) {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q.q, type: q.type, answer, gap_skill: q.gap_skill || '' }),
    })
    const ev = await res.json()
    setScores(prev => ({ ...prev, [q.id]: ev.score }))
    return ev
  }

  function reset() {
    setPdfFile(null); setJd(''); setAnalysis(null); setQuestions([])
    setScores({}); setCompletedAgents([]); setPipelineError(''); setPipelineRunning(false)
    setPhase(0)
  }

  // ── derived ────────────────────────────────────────────────────
  const doneCount = Object.keys(scores).length
  const progress = questions.length > 0 ? Math.round((doneCount / questions.length) * 100) : 0
  const canFinish = doneCount >= 0

  // ── render ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <i className="ti ti-hammer" style={{ color: 'var(--blue)', fontSize: 22 }} />
            <span style={{ fontSize: 20, fontWeight: 500 }}>InterviewForge</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            Multi-agent pipeline: Resume Parser → JD Analyzer → Gap Detector → Question Generator
          </p>
        </header>

        <PhaseBar current={phase} />

        {/* ── Phase 0: Upload ── */}
        {phase === 0 && (
          <div>
            <Card>
              <SectionTitle>Resume (PDF)</SectionTitle>
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
                style={{
                  border: `1.5px dashed ${pdfFile ? 'var(--green)' : drag ? 'var(--blue)' : 'var(--border-em)'}`,
                  borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer',
                  background: drag ? 'var(--blue-soft)' : 'var(--surface2)', transition: 'all 0.15s',
                }}
              >
                <i className={`ti ${pdfFile ? 'ti-file-check' : 'ti-upload'}`}
                  style={{ fontSize: 28, color: pdfFile ? 'var(--green)' : 'var(--text3)', display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{pdfFile ? pdfFile.name : 'Drop PDF here or click to browse'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {pdfFile ? `${(pdfFile.size / 1024).toFixed(0)} KB — ready` : 'PDF up to 10MB'}
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </Card>

            <Card>
              <SectionTitle>Job description</SectionTitle>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Paste the full job description — the more detail, the better the gap analysis…"
                style={{ width: '100%', minHeight: 140, fontFamily: 'inherit', fontSize: 13, color: 'var(--text1)', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
              />
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <BtnPrimary onClick={runPipeline} disabled={!pdfFile || jd.trim().length < 30}>
                <i className="ti ti-bolt" /> Run Pipeline
              </BtnPrimary>
            </div>
          </div>
        )}

        {/* ── Phase 1: Pipeline ── */}
        {phase === 1 && (
          <div>
            <Card>
              <PipelineVisualizer
                completedAgents={completedAgents}
                currentAgent={pipelineRunning && completedAgents.length < 4
                  ? ['resume_parser','jd_analyzer','gap_detector','question_generator'][completedAgents.length]
                  : ''}
                error={pipelineError}
              />
            </Card>

            {analysis && !pipelineRunning && (
              <>
                <Card>
                  <SectionTitle>Analysis results</SectionTitle>
                  <AnalysisView data={analysis} />
                </Card>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <BtnSecondary onClick={() => setPhase(0)}>Back</BtnSecondary>
                  <BtnPrimary onClick={startTest}>
                    <i className="ti ti-player-play" /> Start Interview Prep
                  </BtnPrimary>
                </div>
              </>
            )}

            {pipelineError && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <BtnSecondary onClick={() => setPhase(0)}>← Back</BtnSecondary>
              </div>
            )}
          </div>
        )}

        {/* ── Phase 2: Test ── */}
        {phase === 2 && (
          <div>
            {/* Progress bar */}
            <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ width: progress + '%', height: '100%', background: 'var(--blue)', transition: 'width 0.3s', borderRadius: 4 }} />
            </div>

            {SECTIONS.map(sec => {
              const qs = questions.filter(q => sec.types.includes(q.type))
              if (!qs.length) return null
              return (
                <div key={sec.label} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <i className={`ti ${sec.icon}`} style={{ color: sec.color, fontSize: 16 }} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{sec.label}</span>
                    <span style={{ fontSize: 11, padding: '2px 7px', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 20, color: 'var(--text2)', marginLeft: 'auto' }}>
                      {qs.length} questions
                    </span>
                  </div>
                  {qs.map((q, idx) => (
                    <QuestionItem key={q.id} q={q} idx={idx} onEvaluate={evaluateAnswer} />
                  ))}
                </div>
              )
            })}

            {canFinish && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <BtnPrimary onClick={() => setPhase(3)}>
                  <i className="ti ti-chart-bar" /> Generate Prep Report
                </BtnPrimary>
              </div>
            )}
          </div>
        )}

        {/* ── Phase 3: Report ── */}
        {phase === 3 && (
          <ReportView
            scores={scores}
            analysis={analysis}
            questions={questions}
            onReset={reset}
          />
        )}

      </div>
    </div>
  )
}

// ── small shared components ──────────────────────────────────────

function PhaseBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
      {PHASES.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < PHASES.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500,
              background: i < current ? 'var(--green)' : i === current ? 'var(--blue)' : 'var(--surface2)',
              color: i <= current ? 'white' : 'var(--text3)',
              border: `1.5px solid ${i < current ? 'var(--green)' : i === current ? 'var(--blue)' : 'var(--border-em)'}`,
            }}>
              {i < current ? <i className="ti ti-check" style={{ fontSize: 12 }} /> : i + 1}
            </div>
            <span style={{ fontSize: 10, color: i === current ? 'var(--text1)' : 'var(--text3)', fontWeight: i === current ? 500 : 400 }}>{label}</span>
          </div>
          {i < PHASES.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < current ? 'var(--green)' : 'var(--border-em)', margin: '0 4px', marginBottom: 16 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
      {children}
    </div>
  )
}

function BtnPrimary({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: disabled ? 0.45 : 1, transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

function BtnSecondary({ children, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background: 'var(--surface2)', color: 'var(--text1)', border: '0.5px solid var(--border-em)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {children}
    </button>
  )
}
