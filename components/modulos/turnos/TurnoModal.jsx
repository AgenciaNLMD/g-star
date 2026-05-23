"use client"
import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { formatFechaHora, tiempoRelativo } from "@/lib/utils"
import { ESTADO_CFG } from "./TurnoCard"
import { IcoCalendar } from "@/components/ui/Icons"

const TRANSICIONES = {
  pedido:     ["asignado", "cancelado"],
  pendiente:  ["asignado", "cancelado"],
  asignado:   ["confirmado", "cancelado"],
  confirmado: ["completado", "ausente", "cancelado"],
  completado: [],
  cancelado:  [],
  ausente:    [],
}

export default function TurnoModal({ turnoId, onClose, onActualizar }) {
  const [turno, setTurno] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [fechaAsignada, setFechaAsignada] = useState("")
  const [horaAsignada, setHoraAsignada]   = useState("")
  const [observacion, setObservacion]     = useState("")

  useEffect(() => {
    api.get(`/api/turnos/${turnoId}`)
      .then((d) => {
        setTurno(d)
        setFechaAsignada(d.fechaAsignada?.slice(0, 10) ?? "")
        setHoraAsignada(d.horaAsignada ?? "")
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [turnoId])

  async function cambiarEstado(estado) {
    setGuardando(true)
    try {
      await api.put(`/api/turnos/${turnoId}`, {
        estado,
        fechaAsignada: fechaAsignada || undefined,
        horaAsignada:  horaAsignada  || undefined,
        observacion:   observacion   || undefined,
      })
      onActualizar()
      onClose()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  if (loading) return (
    <div className="dialog-overlay">
      <div className="dialog" style={{ alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <div className="spinner" />
      </div>
    </div>
  )

  if (!turno) return null

  const cfg = ESTADO_CFG[turno.estado] ?? { label: turno.estado, cls: "badge--muted" }
  const transiciones = TRANSICIONES[turno.estado] ?? []
  const puedeAsignarFecha = ["pedido", "pendiente", "asignado"].includes(turno.estado)

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 560 }}>
        <div className="dialog__header">
          <div>
            <h3 className="dialog__title">{turno.nombre}</h3>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
              <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
              <span className="text-xs text-muted">{turno.tramite}</span>
            </div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>

        <div className="dialog__body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.875rem" }}>
            {turno.dni      && <Campo label="DNI"       valor={turno.dni} />}
            {turno.telefono && <Campo label="Teléfono"  valor={turno.telefono} />}
            {turno.sucursal && <Campo label="Sucursal"  valor={turno.sucursal} />}
            {turno.entidad  && <Campo label="Entidad"   valor={`${turno.entidad.nombre} — ${turno.entidad.localidad}`} />}
            {turno.fechaSolicitada && (
              <Campo
                label="Fecha preferida"
                valor={new Date(turno.fechaSolicitada).toLocaleDateString("es-AR")}
              />
            )}
          </div>

          {/* Asignación de fecha/hora */}
          {puedeAsignarFecha && (
            <fieldset style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.875rem" }}>
              <legend className="text-xs font-semi text-muted" style={{ padding: "0 0.25rem" }}>Asignar fecha y hora</legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
                <div className="input-group">
                  <label>Fecha</label>
                  <input type="date" className="input input--sm" value={fechaAsignada} onChange={(e) => setFechaAsignada(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="input-group">
                  <label>Hora</label>
                  <input type="time" className="input input--sm" value={horaAsignada} onChange={(e) => setHoraAsignada(e.target.value)} />
                </div>
              </div>
            </fieldset>
          )}

          {/* Fecha asignada (readonly) */}
          {turno.fechaAsignada && !puedeAsignarFecha && (
            <p className="text-sm">
              <IcoCalendar size={13} style={{ marginRight: "0.25rem", verticalAlign: "middle" }} />
              <strong>Asignado:</strong> {new Date(turno.fechaAsignada).toLocaleDateString("es-AR")} a las {turno.horaAsignada}
            </p>
          )}

          {/* Observación */}
          {transiciones.length > 0 && (
            <div className="input-group">
              <label>Observación (opcional)</label>
              <textarea className="input" rows={2} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Notas del cambio de estado…" style={{ resize: "vertical" }} />
            </div>
          )}

          {/* Historial */}
          {turno.historial?.length > 0 && (
            <div>
              <h4 className="text-sm font-semi" style={{ marginBottom: "0.5rem" }}>Historial</h4>
              {turno.historial.map((h, i) => (
                <div key={i} className="historial-item">
                  <div className="historial-item__dot" />
                  <div className="historial-item__content">
                    <div className="historial-item__accion">{h.accion}</div>
                    {h.detalle && <div className="historial-item__detalle">{h.detalle}</div>}
                  </div>
                  <div className="historial-item__fecha">{tiempoRelativo(h.fecha)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dialog__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={guardando}>Cerrar</button>
          {transiciones.map((est) => (
            <button
              key={est}
              className={`btn btn--sm ${est === "cancelado" || est === "ausente" ? "btn--secondary" : "btn--primary"}`}
              onClick={() => cambiarEstado(est)}
              disabled={guardando}
            >
              {ESTADO_CFG[est]?.label ?? est}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div>
      <span className="text-muted text-xs">{label}: </span>
      <span className="text-sm">{valor}</span>
    </div>
  )
}
