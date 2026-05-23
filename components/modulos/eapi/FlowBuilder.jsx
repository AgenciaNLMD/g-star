"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"
import FlowEditor from "./FlowEditor"
import { IcoFlow, IcoPencil, IcoTrash } from "@/components/ui/Icons"

export default function FlowBuilder({ flows, onActualizar }) {
  const [editando, setEditando] = useState(null) // null = lista | "nuevo" | flow object

  async function eliminar(id) {
    if (!confirm("¿Eliminar este flow?")) return
    try {
      await api.del(`/api/eapi/flows/${id}`)
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
        flows.map((f) => {
          const cantNodos = f.nodos?.nodes?.length ?? 0
          const cantConex = f.nodos?.edges?.length ?? 0
          return (
            <div key={f.id} style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: f.activo ? "#22c55e18" : "#94a3b818", border: `2px solid ${f.activo ? "#22c55e" : "#94a3b8"}`, display: "flex", alignItems: "center", justifyContent: "center", color: f.activo ? "#22c55e" : "#94a3b8", flexShrink: 0 }}>
                <IcoFlow size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{f.nombre}</span>
                  <span className={`badge ${f.activo ? "badge--success" : "badge--muted"}`} style={{ fontSize: "0.65rem" }}>
                    {f.activo ? "activo" : "inactivo"}
                  </span>
                </div>
                <div className="text-xs text-muted" style={{ marginTop: "0.125rem" }}>
                  {cantNodos} nodos · {cantConex} conexiones
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                <button className="btn btn--secondary btn--sm" onClick={() => setEditando(f)} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <IcoPencil size={13} /> Editar
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => eliminar(f.id)} style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}>
                  <IcoTrash size={13} />
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
