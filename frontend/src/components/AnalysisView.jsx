function TagRow({ label, tags, color, icon }) {
  if (!tags?.length) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon && <i className={`ti ${icon}`} style={{ color, fontSize: 12 }} />}{label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {tags.map((t, i) => (
          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, color, background: `${color}20` }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

export default function AnalysisView({ data }) {
  const d = data
  const totalQ = (d.mcq_questions?.length || 0) + (d.project_questions?.length || 0) +
    (d.behavioral_questions?.length || 0) + (d.weak_spot_questions?.length || 0)

  const severityColor = { low: 'var(--green)', medium: 'var(--amber)', high: 'var(--red)' }[d.gap_severity] || 'var(--amber)'

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Candidate', val: d.candidate_name || 'You', small: true },
          { label: 'Experience', val: d.years_experience || '—' },
          { label: 'Stack size', val: d.tech_stack?.length || 0 },
          { label: 'JD skills', val: d.jd_required_skills?.length || 0 },
          { label: 'Gap severity', val: d.gap_severity || '—', color: severityColor },
          { label: 'Questions', val: totalQ },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: s.color || 'var(--text3)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: s.small ? 13 : 18, fontWeight: 500, color: s.color || 'var(--text1)' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <TagRow label="Your tech stack" tags={d.tech_stack} color="var(--blue)" />
      <TagRow label="Strong matches" tags={d.strong_match_skills} color="var(--green)" icon="ti-circle-check" />
      <TagRow label="Gaps — expect probing" tags={d.gap_skills} color="var(--amber)" icon="ti-alert-triangle" />

      {d.probe_areas?.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Expected probe areas</div>
          {d.probe_areas.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12, color: 'var(--text1)', lineHeight: 1.5 }}>
              <i className="ti ti-target" style={{ color: 'var(--amber)', fontSize: 13, marginTop: 2, flexShrink: 0 }} />{p}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
