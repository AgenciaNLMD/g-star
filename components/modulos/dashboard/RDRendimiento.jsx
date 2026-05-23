"use client"

function efColor(pct) {
  if (pct >= 90) return "#1A7A4A"
  if (pct >= 70) return "#A87020"
  return "#C0392B"
}

export default function RDRendimiento({ equipos = [] }) {
  return (
    <div className="rd-card rd-rend-card" style={{ "--rd-accent": "#A87020" }}>
      <span className="rd-card__label">Rendimiento de Equipos</span>

      {equipos.length === 0 && <p className="rd-empty">Sin equipos asignados</p>}

      {equipos.length > 0 && (
        <div className="rd-rend__table">
          <div className="rd-rend__head">
            <span>Equipo</span>
            <span>Tomados</span>
            <span>Derivados</span>
            <span>Eficiencia</span>
          </div>
          {equipos.map(eq => (
            <div key={eq.nombre} className="rd-rend__row">
              <span className="rd-rend__name">
                <span className="rd-dot" style={{ background: eq.color }} />
                {eq.nombre}
              </span>
              <span className="rd-rend__num">{eq.tomados}</span>
              <span className="rd-rend__num">{eq.derivados}</span>
              <div className="rd-rend__ef-cell">
                <div className="rd-prog-track rd-prog-track--sm">
                  <div
                    className="rd-prog-fill"
                    style={{ width: `${eq.eficiencia}%`, background: efColor(eq.eficiencia) }}
                  />
                </div>
                <span
                  className="rd-rend__ef-val"
                  style={{ color: efColor(eq.eficiencia) }}
                >
                  {eq.eficiencia < 90 ? "⚠" : "✓"} {eq.eficiencia}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
