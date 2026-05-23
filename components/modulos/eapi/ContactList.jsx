"use client"
import { useState } from "react"

const FLUJO_LABELS = {
  menu:        { label: "Menú",       color: "badge--primary" },
  anses:       { label: "ANSES",      color: "badge--info" },
  renaper:     { label: "RENAPER",    color: "badge--info" },
  migraciones: { label: "Migraciones",color: "badge--info" },
  turnos:      { label: "Turnos",     color: "badge--success" },
  reclamos:    { label: "Reclamos",   color: "badge--warning" },
  operativo:   { label: "Operativo",  color: "badge--muted" },
}

function iniciales(str) {
  if (!str) return "?"
  return str.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatTiempo(date) {
  if (!date) return ""
  const d = new Date(date)
  const ahora = new Date()
  const diff = ahora - d
  if (diff < 60000) return "ahora"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
}

export default function ContactList({ conversaciones, activoId, onSeleccionar, loading }) {
  const [busqueda, setBusqueda] = useState("")

  const filtradas = conversaciones.filter((c) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return c.contactoNombre?.toLowerCase().includes(q) || c.contactoTel?.includes(q)
  })

  return (
    <div className="eapi-sidebar">
      <div className="eapi-sidebar__search">
        <input
          className="input input--sm"
          placeholder="Buscar contacto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
          <div className="spinner" />
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
          Sin conversaciones
        </div>
      ) : (
        <div className="eapi-sidebar__list">
          {filtradas.map((c) => {
            const flujo = FLUJO_LABELS[c.flujoActual]
            return (
              <div
                key={c.id}
                className={`conversation-item${c.id === activoId ? " conversation-item--active" : ""}`}
                onClick={() => onSeleccionar(c.id)}
              >
                <div className="conversation-item__avatar" style={!c.modoBot ? { outline: "2px solid var(--color-warning)", outlineOffset: 1 } : {}}>
                  {iniciales(c.contactoNombre || c.contactoTel)}
                </div>
                <div className="conversation-item__content">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.25rem" }}>
                    <span className="conversation-item__name" style={{ flex: 1, minWidth: 0 }}>
                      {c.contactoNombre || c.contactoTel}
                    </span>
                    <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)", flexShrink: 0 }}>
                      {formatTiempo(c.updatedAt)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.125rem" }}>
                    <span className="conversation-item__preview" style={{ flex: 1, minWidth: 0 }}>
                      {c.ultimoMensajeDireccion === "saliente" ? "↳ " : ""}{c.ultimoMensaje || "Sin mensajes"}
                    </span>
                    {c.noLeidos > 0 && (
                      <span className="badge badge--danger" style={{ fontSize: "0.6rem", minWidth: 16, textAlign: "center", flexShrink: 0 }}>
                        {c.noLeidos}
                      </span>
                    )}
                  </div>
                  {flujo && (
                    <span className={`badge ${flujo.color}`} style={{ fontSize: "0.6rem", marginTop: "0.25rem" }}>
                      {flujo.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
