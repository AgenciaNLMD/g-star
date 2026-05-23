"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"

const ETIQUETAS = [
  "General", "Urgente", "Vialidad", "Iluminación",
  "Espacios verdes", "Saneamiento", "Seguridad", "Ruidos molestos", "Otro",
]

const LOCALIDADES = ["Aeropuerto", "Canning", "Ezeiza", "La Unión", "Spegazzini", "Suárez"]

const CANALES = [
  { value: "presencial", label: "Presencial (ventanilla)" },
  { value: "whatsapp",   label: "WhatsApp" },
  { value: "email",      label: "Email" },
]

const INICIAL = {
  asunto: "", texto: "", etiqueta: "General", canal: "presencial",
  localidad: "", barrio: "", direccion: "",
  esAnonimo: false, contactoNombre: "", contactoTelefono: "", contactoEmail: "",
}

export default function ReclamoModal({ onClose, onCreado }) {
  const [form,       setForm]       = useState(INICIAL)
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState("")

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.asunto.trim()) { setError("El asunto es requerido."); return }
    setError("")
    setGuardando(true)
    try {
      const nuevo = await api.post("/api/reclamos", form)
      onCreado(nuevo)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 560 }}>
        <div className="dialog__header">
          <h3 className="dialog__title">Nuevo reclamo</h3>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={guardar}>
          <div className="dialog__body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {error && (
              <div className="badge badge--danger" style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius)" }}>
                {error}
              </div>
            )}

            {/* Canal */}
            <fieldset style={{ border: "none", padding: 0 }}>
              <legend className="text-xs font-semi text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.625rem" }}>
                Canal de ingreso
              </legend>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {CANALES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`btn btn--sm ${form.canal === c.value ? "btn--primary" : "btn--secondary"}`}
                    onClick={() => set("canal", c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Ciudadano */}
            <fieldset style={{ border: "none", padding: 0 }}>
              <legend className="text-xs font-semi text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.625rem" }}>
                Ciudadano
              </legend>
              <label className="reclamo-modal-check" style={{ marginBottom: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={form.esAnonimo}
                  onChange={(e) => set("esAnonimo", e.target.checked)}
                />
                <span className="text-sm">Denuncia anónima</span>
              </label>

              {!form.esAnonimo && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="input-group">
                    <label>Nombre</label>
                    <input className="input" value={form.contactoNombre} onChange={(e) => set("contactoNombre", e.target.value)} placeholder="Nombre completo" />
                  </div>
                  <div className="input-group">
                    <label>Teléfono</label>
                    <input className="input" value={form.contactoTelefono} onChange={(e) => set("contactoTelefono", e.target.value)} placeholder="11-1234-5678" />
                  </div>
                  <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Email</label>
                    <input className="input" type="email" value={form.contactoEmail} onChange={(e) => set("contactoEmail", e.target.value)} placeholder="correo@ejemplo.com" />
                  </div>
                </div>
              )}
            </fieldset>

            {/* Reclamo */}
            <fieldset style={{ border: "none", padding: 0 }}>
              <legend className="text-xs font-semi text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.625rem" }}>
                Reclamo
              </legend>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="input-group">
                  <label>Asunto *</label>
                  <input className="input" value={form.asunto} onChange={(e) => set("asunto", e.target.value)} placeholder="Resumen breve del reclamo" required />
                </div>
                <div className="input-group">
                  <label>Descripción</label>
                  <textarea className="input" rows={3} value={form.texto} onChange={(e) => set("texto", e.target.value)} placeholder="Descripción detallada…" style={{ resize: "vertical" }} />
                </div>
                <div className="input-group">
                  <label>Etiqueta</label>
                  <select className="select" value={form.etiqueta} onChange={(e) => set("etiqueta", e.target.value)}>
                    {ETIQUETAS.map((et) => <option key={et} value={et}>{et}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Ubicación */}
            <fieldset style={{ border: "none", padding: 0 }}>
              <legend className="text-xs font-semi text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.625rem" }}>
                Ubicación
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="input-group">
                  <label>Localidad</label>
                  <select className="select" value={form.localidad} onChange={(e) => set("localidad", e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {LOCALIDADES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Barrio</label>
                  <input className="input" value={form.barrio} onChange={(e) => set("barrio", e.target.value)} placeholder="Nombre del barrio" />
                </div>
                <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Dirección</label>
                  <input className="input" value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle y número" />
                </div>
              </div>
            </fieldset>
          </div>

          <div className="dialog__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? "Guardando…" : "Crear reclamo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
