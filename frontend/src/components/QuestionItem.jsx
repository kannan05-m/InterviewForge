import { useState } from 'react'

function RubricBreakdown({ breakdown }) {
  if (!breakdown || !Object.keys(breakdown).length) return null
  const colors = { strong: 'var(--green)', partial: 'var(--amber)', missing: 'var(--red)' }
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {Object.entries(breakdown).map(([k, v]) => (
        <span key={k} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${colors[v]}20`, color: colors[v], fontWeight: 500 }}>
          {k}: {v}
        </span>
      ))}
    </div>
  )
}

function Feedback({ evaluation }) {
  const map = {
    good: { color: 'var(--green)', label: 'Strong answer' },
    ok:   { color: 'var(--amber)', label: 'Decent — needs work' },
    bad:  { color: 'var(--red)',   label: 'Needs improvement' },
  }
  const s = map[evaluation.score] || map.ok
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6, borderLeft: `3px solid ${s.color}`, background: `${s.color}15`, color: 'var(--text1)', marginTop: 8 }}>
      <strong style={{ color: s.color }}>{s.label}:</strong> {evaluation.feedback}
      {evaluation.suggestion && <><br /><em style={{ opacity: 0.7 }}>Tip: {evaluation.suggestion}</em></>}
      <RubricBreakdown breakdown={evaluation.rubric_breakdown} />
    </div>
  )
}

export default function QuestionItem({ q, idx, onEvaluate }) {
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const letters = ['A', 'B', 'C', 'D']

  async function submitEval() {
    if (!answer.trim()) return
    setLoading(true)
    const result = await onEvaluate(q, answer)
    setEvaluation(result)
    setLoading(false)
  }

  function selectMCQ(optIdx) {
    if (evaluation) return
    const chosen = letters[optIdx]
    const isCorrect = chosen === q.correct
    setEvaluation({ score: isCorrect ? 'good' : 'bad', feedback: q.explanation || '', rubric_breakdown: {}, _mcq: { chosen, correct: q.correct } })
    setAnswer(chosen)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 8 }}>
      <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.6, marginBottom: 10 }}>
        <span style={{ color: 'var(--text3)', marginRight: 6 }}>{idx + 1}.</span>{q.q}
      </div>

      {q.type === 'mcq' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {q.options.map((opt, oi) => {
              const letter = letters[oi]
              const ev = evaluation?._mcq
              let bg = 'var(--surface2)', border = '0.5px solid var(--border)', color = 'var(--text1)'
              if (ev) {
                if (letter === ev.correct)      { bg = 'var(--green-soft)'; border = '0.5px solid var(--green)'; color = 'var(--green)' }
                else if (letter === ev.chosen)  { bg = 'var(--red-soft)';   border = '0.5px solid var(--red)';   color = 'var(--red)' }
              }
              return (
                <button key={oi} disabled={!!ev} onClick={() => selectMCQ(oi)}
                  style={{ padding: '7px 10px', border, borderRadius: 8, fontSize: 12, cursor: ev ? 'default' : 'pointer', background: bg, color, fontFamily: 'var(--font-mono, monospace)', textAlign: 'left', transition: 'all 0.1s' }}>
                  {opt}
                </button>
              )
            })}
          </div>
          {evaluation && <Feedback evaluation={evaluation} />}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            disabled={!!evaluation}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder={q.type === 'behavioral' ? 'Use STAR format: Situation → Task → Action → Result' : 'Type your answer…'}
            style={{ width: '100%', minHeight: 80, fontFamily: 'inherit', fontSize: 13, color: 'var(--text1)', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
          />
          {!evaluation && (
            <button onClick={submitEval} disabled={loading || !answer.trim()}
              style={{ alignSelf: 'flex-end', background: 'var(--surface2)', color: 'var(--text1)', border: '0.5px solid var(--border-em)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: (!answer.trim() || loading) ? 0.5 : 1 }}>
              {loading
                ? <><div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> Evaluating…</>
                : <><i className="ti ti-bolt" /> Evaluate answer</>}
            </button>
          )}
          {evaluation && <Feedback evaluation={evaluation} />}
        </div>
      )}
    </div>
  )
}
