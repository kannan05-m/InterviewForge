const AGENTS = [
  { id: 'resume_parser',       label: 'Resume Parser',       desc: 'Extracting tech stack, projects, experience',  icon: 'ti-file-text' },
  { id: 'jd_analyzer',         label: 'JD Analyzer',         desc: 'Parsing required skills and seniority level',  icon: 'ti-briefcase' },
  { id: 'gap_detector',        label: 'Gap Detector',         desc: 'Comparing candidate profile vs JD',           icon: 'ti-arrows-diff' },
  { id: 'question_generator',  label: 'Question Generator',   desc: 'Generating personalised question set',        icon: 'ti-brain' },
]

export default function PipelineVisualizer({ completedAgents = [], currentAgent = '', error = '' }) {
  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        Agent pipeline
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {AGENTS.map((agent, idx) => {
          const done = completedAgents.includes(agent.id)
          const active = currentAgent === agent.id || (!done && completedAgents.length === idx)
          const waiting = !done && !active

          return (
            <div key={agent.id} style={{ display: 'flex', gap: 0 }}>
              {/* spine */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--green-soft)' : active ? 'var(--blue-soft)' : 'var(--surface2)',
                  border: `1.5px solid ${done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--border-em)'}`,
                  transition: 'all 0.3s',
                }}>
                  {done
                    ? <i className="ti ti-check" style={{ fontSize: 12, color: 'var(--green)' }} />
                    : active
                      ? <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      : <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>{idx + 1}</span>
                  }
                </div>
                {idx < AGENTS.length - 1 && (
                  <div style={{ width: 1.5, flex: 1, minHeight: 20, background: done ? 'var(--green)' : 'var(--border-em)', transition: 'background 0.3s', margin: '3px 0' }} />
                )}
              </div>

              {/* content */}
              <div style={{ paddingLeft: 12, paddingBottom: idx < AGENTS.length - 1 ? 20 : 0, paddingTop: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className={`ti ${agent.icon}`} style={{ fontSize: 13, color: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--text3)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: done ? 'var(--text1)' : active ? 'var(--text1)' : 'var(--text3)' }}>
                    {agent.label}
                  </span>
                  {done && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--green-soft)', color: 'var(--green)', marginLeft: 4 }}>done</span>}
                  {active && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--blue-soft)', color: 'var(--blue)', marginLeft: 4 }}>running</span>}
                </div>
                {(active || done) && (
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{agent.desc}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {error && (
        <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 8, background: 'var(--red-soft)', border: '0.5px solid var(--red)', fontSize: 12, color: 'var(--red)' }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
        </div>
      )}
    </div>
  )
}
