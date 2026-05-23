"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"

const ROLES = [
  { value: "admin",      label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operador",   label: "Operador" },
  { value: "readonly",   label: "Solo lectura" },
]

export default function UsuarioModal({ usuario, onClose, onGuardado }) {
  const esEdicion = !!usuario?.id

  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? "",
    email:  usuario?.email  ?? "",
    rol:    usuario?.rol    ?? "operador",
    estado: usuario?.estado ?? "activo",
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState("")

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    if (!form.email.trim())  { setError("El email es requerido."); return }
    setError("")
    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put("/api/admin/usuarios", { id: usuario.id, ...form })
      } else {
        await api.post("/api/admin/usuarios", form)
      }
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 520 }}>
        <div className="dialog__header">
          <h3 className="dialog__title">{esEdicion ? "Editar usuario" : "Nuevo usuario"}</h3>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={guardar}>
          <div className="dialog__body" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {error && (
              <div className="badge badge--danger" style={{ padding: "0.5rem 0.75rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="input-group">
                <label>Nombre completo *</label>
                <input className="input" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Apellido y nombre" required />
              </div>
              <div className="input-group">
                <label>Email Google *</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="usuario@gmail.com"
                  disabled={esEdicion}
                  required
                />
              </div>
              <div className="input-group">
                <label>Rol</label>
                <select className="select" value={form.rol} onChange={(e) => set("rol", e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Estado</label>
                <select className="select" value={form.estado} onChange={(e) => set("estado", e.target.value)}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

          </div>

          <div className="dialog__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
