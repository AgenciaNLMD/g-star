"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"

const TIPOS = [
  { value: "reunion",       label: "Reunión"       },
  { value: "tarea",         label: "Tarea"         },
  { value: "recordatorio",  label: "Recordatorio"  },
  { value: "evento",        label: "Evento"        },
]

const INICIAL = { titulo: "", descripcion: "", tipo: "reunion", fecha: "", hora: "", todo_dia: false }

export default function AgendaModal({ evento, fechaInicial, onClose, onGuardado }) {
  const esEdicion = !!evento?.id

  const [form, setForm] = useState(
    esEdicion
      ? {
          titulo:      evento.titulo      ?? "",
          descripcion: evento.descripcion ?? "",
          tipo:        evento.tipo        ?? "reunion",
          fecha:       evento.fecha?.slice(0, 10) ?? "",
          hora:        evento.hora        ?? "",
          todo_dia:    evento.todo_dia    ?? false,
        }
      : { ...INICIAL, fecha: fechaInicial ?? "" }
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState("")

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }

  async function guardar(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setError("El título es requerido."); return }
    if (!form.fecha)         { setError("La fecha es requerida."); return }
    setError("")
    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put(`/api/agenda/${evento.id}`, form)
      } else {
        await api.post("/api/agenda", form)
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
      <div className="dialog" style={{ maxWidth: 480 }}>
        <div className="dialog__header">
          <h3 className="dialog__title">{esEdicion ? "Editar evento" : "Nuevo evento"}</h3>
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
              <label>Título *</label>
              <input
                className="input"
                value={form.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                placeholder="Descripción breve del evento"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="input-group">
                <label>Tipo</label>
                <select className="select" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  className="input"
                  value={form.fecha}
                  onChange={(e) => set("fecha", e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "end" }}>
              <div className="input-group">
                <label>Hora</label>
                <input
                  type="time"
                  className="input"
                  value={form.hora}
                  onChange={(e) => set("hora", e.target.value)}
                  disabled={form.todo_dia}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.125rem" }}>
                <input
                  type="checkbox"
                  id="todo_dia"
                  checked={form.todo_dia}
                  onChange={(e) => { set("todo_dia", e.target.checked); if (e.target.checked) set("hora", "") }}
                />
                <label htmlFor="todo_dia" style={{ fontSize: "0.875rem", cursor: "pointer", margin: 0 }}>
                  Todo el día
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Descripción</label>
              <textarea
                className="input"
                rows={3}
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Detalles adicionales (opcional)"
                style={{ resize: "vertical", minHeight: 72 }}
              />
            </div>
          </div>

          <div className="dialog__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
