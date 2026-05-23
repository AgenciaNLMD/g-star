"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"

const TRAMITES = [
  "Trámite general", "ANSES", "RENAPER", "PAMI", "AFIP", "Registro Civil",
  "Habilitaciones", "Obras Particulares", "Catastro", "Tesorería", "Otro",
]

const INICIAL = {
  nombre: "", dni: "", telefono: "", tramite: "Trámite general",
  sucursal: "", fechaSolicitada: "", entidadId: "",
}

export default function TurnoForm({ entidades, onClose, onCreado }) {
  const [form, setForm] = useState({ ...INICIAL, entidadId: entidades[0]?.id ?? "" })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }

  // Sucursales de la entidad seleccionada
  const entidadActual = entidades.find((e) => e.id === form.entidadId)
  const sucursales = Array.isArray(entidadActual?.sucursales)
    ? entidadActual.sucursales.map((s) => (typeof s === "string" ? s : s?.nombre ?? String(s)))
    : []

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    if (!form.entidadId)     { setError("Seleccioná una entidad."); return }
    setError("")
    setGuardando(true)
    try {
      const payload = {
        ...form,
        fechaSolicitada: form.fechaSolicitada || undefined,
      }
      const nuevo = await api.post("/api/turnos", payload)
      onCreado(nuevo)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog">
        <div className="dialog__header">
          <h3 className="dialog__title">Nuevo turno</h3>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={guardar}>
          <div className="dialog__body" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {error && (
              <div className="badge badge--danger" style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius)" }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label>Entidad / Organismo *</label>
              <select className="select" value={form.entidadId} onChange={(e) => { set("entidadId", e.target.value); set("sucursal", "") }} required>
                {entidades.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre} — {e.localidad}</option>
                ))}
              </select>
            </div>

            {/* Sucursal */}
            <div className="input-group">
              <label>Sucursal</label>
              {sucursales.length > 0 ? (
                <select className="select" value={form.sucursal} onChange={(e) => set("sucursal", e.target.value)}>
                  <option value="">— Sin especificar —</option>
                  {sucursales.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input className="input" value={form.sucursal} onChange={(e) => set("sucursal", e.target.value)} placeholder="Nombre de sucursal (opcional)" />
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label>Nombre completo *</label>
                <input className="input" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Apellido y nombre" required />
              </div>
              <div className="input-group">
                <label>DNI</label>
                <input className="input" value={form.dni} onChange={(e) => set("dni", e.target.value)} placeholder="12345678" />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input className="input" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="11-1234-5678" />
              </div>
              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label>Trámite</label>
                <select className="select" value={form.tramite} onChange={(e) => set("tramite", e.target.value)}>
                  {TRAMITES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label>Fecha preferida (opcional)</label>
                <input
                  type="date"
                  className="input"
                  value={form.fechaSolicitada}
                  onChange={(e) => set("fechaSolicitada", e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
          </div>

          <div className="dialog__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? "Guardando…" : "Crear turno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
