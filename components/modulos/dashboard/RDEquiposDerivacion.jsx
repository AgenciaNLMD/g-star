"use client"

export default function RDEquiposDerivacion({ derivacion = {}, equipos = [] }) {
  const { total = 0, derivados = 0, resueltos = 0 } = derivacion
  const pctDer = total > 0 ? Math.round(derivados / total * 100) : 0
  const pctRes = total > 0 ? Math.round(resueltos / total * 100) : 0
  const maxEq  = Math.max(...equipos.map(e => e.tomados), 1)

  return (
    <div className="rd-card rd-deriv-card" style={{ "--rd-accent": "#1499C2" }}>
      <span className="rd-card__label">Derivación y Cierre</span>

      {/* Métricas globales */}
      <div className="rd-deriv__globals">
        <div className="rd-deriv__global-item">
          <div className="rd-deriv__global-top">
            <span className="rd-deriv__global-lbl">Derivados</span>
            <span className="rd-deriv__global-val">{pctDer}%</span>
          </div>
          <span className="rd-deriv__global-sub">{derivados} / {total}</span>
          <div className="rd-prog-track">
            <div className="rd-prog-fill" style={{ width: `${pctDer}%`, background: "#1499C2" }} />
          </div>
        </div>
        <div className="rd-deriv__global-item">
          <div className="rd-deriv__global-top">
            <span className="rd-deriv__global-lbl">Resueltos por área</span>
            <span className="rd-deriv__global-val">{pctRes}%</span>
          </div>
          <span className="rd-deriv__global-sub">{resueltos} / {total}</span>
          <div className="rd-prog-track">
            <div className="rd-prog-fill" style={{ width: `${pctRes}%`, background: "#1A7A4A" }} />
          </div>
        </div>
      </div>

      {/* Por equipo */}
      <div className="rd-deriv__sep" />
      <div className="rd-deriv__equipos">
        {equipos.length === 0 && <p className="rd-empty">Sin equipos asignados</p>}
        {equipos.map(eq => (
          <div key={eq.nombre} className="rd-deriv__eq-row">
            <span className="rd-deriv__eq-name">{eq.nombre}</span>
            <div className="rd-deriv__eq-bars">
              <div
                className="rd-deriv__eq-seg rd-deriv__eq-seg--a"
                style={{ width: `${eq.tomados  / maxEq * 100}%` }}
                title={`Tomados: ${eq.tomados}`}
              />
              <div
                className="rd-deriv__eq-seg rd-deriv__eq-seg--b"
                style={{ width: `${eq.derivados / maxEq * 100}%` }}
                title={`Derivados: ${eq.derivados}`}
              />
              <div
                className="rd-deriv__eq-seg rd-deriv__eq-seg--c"
                style={{ width: `${eq.cerrados  / maxEq * 100}%` }}
                title={`Cerrados: ${eq.cerrados}`}
              />
            </div>
            <span className="rd-deriv__eq-nums">{eq.tomados}·{eq.derivados}·{eq.cerrados}</span>
          </div>
        ))}
      </div>

      <div className="rd-deriv__legend">
        <span><span className="rd-dot rd-deriv__eq-seg--a rd-dot--inline" />Tomados</span>
        <span><span className="rd-dot rd-deriv__eq-seg--b rd-dot--inline" />Derivados</span>
        <span><span className="rd-dot rd-deriv__eq-seg--c rd-dot--inline" />Cerrados</span>
      </div>
    </div>
  )
}
