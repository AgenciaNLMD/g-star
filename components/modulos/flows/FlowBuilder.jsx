"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"
import FlowEditor from "./FlowEditor"
import { TIPOS } from "./FlowNode"
import { IcoFlow, IcoPencil, IcoTrash, IcoPlay, IcoPause, IcoMessageCircle, IcoHash, IcoCursor } from "@/components/ui/Icons"

const TRIGGER_LABELS = {
  whatsapp_entrante: { label: "WhatsApp entrante", Icon: IcoMessageCircle },
  whatsapp_keyword:  { label: "Keyword",           Icon: IcoHash          },
  manual:            { label: "Manual",            Icon: IcoCursor        },
}

export default function FlowBuilder({ flows, onActualizar }) {
  const [editando, setEditando] = useState(null) // null = lista | "nuevo" | flow object

  async function eliminar(id) {
    if (!confirm("¿Eliminar este flow?")) return
    try {
      await api.del(`/api/flows/${id}`)
      onActualizar()
    } catch (e) { alert(e.message) }
  }

  async function toggleActivo(flow) {
    try {
      await api.put(`/api/flows/${flow.id}`, { activo: !flow.activo })
      onActualizar()
    } catch (e) { alert(e.message) }
  }

  if (editando !== null) {
    return (
      <FlowEditor
        flow={editando === "nuevo" ? null : editando}
        onGuardar={() => { onActualizar(); setEditando(null) }}
        onVolver={() => setEditando(null)}
      />
    )
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span className="card__title">Flows de conversación ({flows.length})</span>
        <button className="btn btn--primary btn--sm" onClick={() => setEditando("nuevo")}>
          + Nuevo flow
        </button>
      </div>

      {flows.length === 0 ? (
        <div className="empty-state" style={{ padding: "3rem" }}>
          <div className="empty-state__icon"><IcoFlow size={40} /></div>
          <p className="empty-state__title">Sin flows configurados</p>
          <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
            Creá tu primer flujo de conversación automatizada
          </p>
          <button className="btn btn--primary btn--sm" onClick={() => setEditando("nuevo")}>
            + Crear primer flow
          </button>
        </div>
      ) : (
        <div>
          {flows.map((f) => {
            const cantNodos = f.nodos?.nodes?.length ?? 0
            const cantConex = f.nodos?.edges?.length ?? 0
            const tiposUsados = [...new Set((f.nodos?.nodes ?? []).map((n) => n.data?.tipo).filter(Boolean))]

            return (
              <div key={f.id} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "1rem" }}>

                {/* Ícono activo/inactivo */}
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: f.activo ? "#22c55e18" : "#94a3b818", border: `2px solid ${f.activo ? "#22c55e" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", color: f.activo ? "#22c55e" : "#94a3b8", flexShrink: 0 }}>
                  <IcoFlow size={18} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>{f.nombre}</span>
                    <span className={`badge ${f.activo ? "badge--success" : "badge--muted"}`} style={{ fontSize: "0.6rem" }}>
                      {f.activo ? "activo" : "inactivo"}
                    </span>
                    {f.triggerTipo && (() => {
                      const trig = TRIGGER_LABELS[f.triggerTipo]
                      const TrigIcon = trig?.Icon
                      return (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6rem", color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 99, padding: "0.1rem 0.5rem" }}>
                          {TrigIcon && <TrigIcon size={9} />}
                          {trig?.label ?? f.triggerTipo}
                        </span>
                      )
                    })()}
                  </div>
                  <div style={{ marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                    <span className="text-xs text-muted">{cantNodos} nodos · {cantConex} conexiones</span>
                    {/* Chips de tipos usados */}
                    {tiposUsados.slice(0, 5).map((t) => {
                      const TipoIcon = TIPOS[t]?.icono
                      return (
                        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: TIPOS[t]?.color ?? "#64748b", background: (TIPOS[t]?.color ?? "#64748b") + "12", border: `1px solid ${(TIPOS[t]?.color ?? "#64748b")}33`, borderRadius: 99, padding: "0.1rem 0.4rem" }}>
                          {TipoIcon && <TipoIcon size={9} />}
                          {TIPOS[t]?.label}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexShrink: 0 }}>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => toggleActivo(f)}
                    title={f.activo ? "Desactivar" : "Activar"}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    {f.activo ? <IcoPause size={13} /> : <IcoPlay size={13} />}
                  </button>
                  <button className="btn btn--secondary btn--sm" onClick={() => setEditando(f)} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <IcoPencil size={13} /> Editar
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => eliminar(f.id)} style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}>
                    <IcoTrash size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
