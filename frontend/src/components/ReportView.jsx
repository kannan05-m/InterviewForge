export default function ReportView({ scores, analysis, questions, onReset }) {
  const evList = Object.values(scores)
  const good = evList.filter(e => e === 'good').length
  const ok = evList.filter(e => e === 'ok').length
  const bad = evList.filter(e => e === 'bad').length
  const skipped = questions.length - evList.length
  const score = evList.length > 0
    ? Math.round((good * 100 + ok * 55 + bad * 15) / evList.length)
    : 0

  const label = score >= 75 ? 'Ready to interview' : score >= 50 ? 'Needs more prep' : 'Study recommended'
  const ringColor = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)'
  const missedQs = questions.filter(q => scores[q.id] === 'bad')

  return (
    <div>
      {/* Score header */}
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Prep report</div>
            <div style={{ fontSize: 52, fontWeight: 500, lineHeight: 1, color: ringColor }}>{score}%</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
          </div>
          <div style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 500, background: `${ringColor}18`, color: ringColor, border: `2px solid ${ringColor}` }}>
            {score}%
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Performance breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[['Strong', good, 'var(--green)'], ['Decent', ok, 'var(--amber)'], ['Weak', bad, 'var(--red)'], ['Skipped', skipped, 'var(--text3)']].map(([l, v, c]) => (
            <div key={l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: c, marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap skills */}
      {analysis?.gap_skills?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            <i className="ti ti-alert-triangle" style={{ marginRight: 5 }} />Gap skills to study before the interview
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {analysis.gap_skills.map(s => (
              <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, color: 'var(--amber)', background: 'var(--amber-soft)' }}>{s}</span>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            Gap severity: <strong style={{ color: { low: 'var(--green)', medium: 'var(--amber)', high: 'var(--red)' }[analysis.gap_severity] }}>{analysis.gap_severity}</strong>.
            {' '}The pipeline generated {analysis.weak_spot_questions?.length} weak-spot questions targeting these gaps.
          </p>
        </div>
      )}

      {/* Questions to revisit */}
      {missedQs.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Questions to revisit</div>
          {missedQs.map(q => (
            <div key={q.id} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12, color: 'var(--text1)', lineHeight: 1.5 }}>
              <i className="ti ti-x" style={{ color: 'var(--red)', fontSize: 13, marginTop: 2, flexShrink: 0 }} />{q.q}
            </div>
          ))}
        </div>
      )}

      {/* Next steps */}
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Next steps</div>
        {[
          { icon: 'ti-code', color: 'var(--blue)',  text: `Justify every architecture decision in ${(analysis?.projects || []).map(p => p.name).join(', ') || 'your projects'} — not just what, but why` },
          { icon: 'ti-check', color: 'var(--green)', text: 'STAR format for behavioral: Situation → Task → Action → Result. Missing Result = automatic downgrade' },
          { icon: 'ti-book',  color: 'var(--amber)', text: `Study gap skills: ${(analysis?.gap_skills || []).slice(0, 3).join(', ')} — even surface-level knowledge removes red flags` },
          { icon: 'ti-refresh', color: 'var(--purple)', text: 'Re-run InterviewForge after studying to track your improvement score' },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>
            <i className={`ti ${item.icon}`} style={{ color: item.color, fontSize: 14, marginTop: 2, flexShrink: 0 }} />{item.text}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={onReset}
          style={{ background: 'var(--surface2)', color: 'var(--text1)', border: '0.5px solid var(--border-em)', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-refresh" /> New Session
        </button>
      </div>
    </div>
  )
}
