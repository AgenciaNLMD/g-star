"use client"

export default function RDCategorias({ categorias = [] }) {
  const max = categorias[0]?.total ?? 1

  return (
    <div className="rd-card rd-cat-card" style={{ "--rd-accent": "#5C6E85" }}>
      <span className="rd-card__label">Categorías · Recuento</span>
      <div className="rd-cat__list">
        {categorias.length === 0 && (
          <p className="rd-empty">Sin datos en el período</p>
        )}
        {categorias.map(c => (
          <div key={c.nombre} className="rd-cat__row">
            <div className="rd-cat__meta">
              <span className="rd-dot rd-dot--md" style={{ background: c.color }} />
              <span className="rd-cat__name" title={c.nombre}>{c.nombre}</span>
              <span className="rd-cat__count">{c.total}</span>
              <span className="rd-cat__pct">{c.pct}%</span>
            </div>
            <div className="rd-cat__bar-track">
              <div
                className="rd-cat__bar-fill"
                style={{
                  width:      `${(c.total / max) * 100}%`,
                  background: c.color + "bb",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
