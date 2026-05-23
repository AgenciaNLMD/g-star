"use client"
import ReclamoStatusBadge from "./ReclamoStatusBadge"
import { tiempoRelativo } from "@/lib/utils"
import { IcoClipboard, IcoWhatsApp, IcoMail, IcoUser } from "@/components/ui/Icons"

function CanalIcon({ canal }) {
  if (canal === "whatsapp") return <IcoWhatsApp size={11} style={{ color: "#25D366" }} />
  if (canal === "email")    return <IcoMail     size={11} style={{ color: "#3182ce" }} />
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)" }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

export default function ReclamosList({ reclamos, loading, activoId, onSelect }) {
  return (
    <div className="reclamos-list">
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
          <div className="spinner" />
        </div>
      ) : reclamos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><IcoClipboard size={40} /></div>
          <p className="empty-state__title">Sin reclamos</p>
          <p className="text-sm text-muted">No hay reclamos con los filtros seleccionados.</p>
        </div>
      ) : (
        reclamos.map((r) => (
          <div
            key={r.id}
            className={`reclamo-item${activoId === r.id ? " reclamo-item--active" : ""}`}
            onClick={() => onSelect(r.id)}
          >
            <div className="reclamo-item__header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <CanalIcon canal={r.canal} />
                <span className="reclamo-item__num">#{r.numero}</span>
              </div>
              <span className="reclamo-item__time">{tiempoRelativo(r.createdAt)}</span>
            </div>

            <div className="reclamo-item__asunto">{r.asunto}</div>

            <div className="reclamo-item__meta">
              <ReclamoStatusBadge estado={r.estado} />
              {r.localidad && <span>· {r.localidad}</span>}
              {r.etiqueta && r.etiqueta !== "General" && (
                <span className="badge badge--muted">{r.etiqueta}</span>
              )}
            </div>

            {(r.equipo || r.tomadoPor) && (
              <div className="reclamo-item__meta" style={{ marginTop: "0.25rem" }}>
                {r.equipo && (
                  <span className="reclamo-equipo-badge" style={{ "--equipo-color": r.equipo.color }}>
                    {r.equipo.nombre}
                  </span>
                )}
                {r.tomadoPor && (
                  <span className="text-xs text-muted" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                    <IcoUser size={10} /> {r.tomadoPor.nombre}
                  </span>
                )}
              </div>
            )}

            {!r.esAnonimo && r.contactoNombre && (
              <div className="reclamo-item__meta" style={{ marginTop: "0.125rem" }}>
                <span className="text-xs text-muted">{r.contactoNombre}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
