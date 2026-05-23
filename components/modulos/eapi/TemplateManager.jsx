"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"
import { IcoCopy, IcoPencil, IcoTrash } from "@/components/ui/Icons"

const INICIAL = { nombre: "", texto: "", categoria: "saludo" }
const CATEGORIAS = ["saludo", "seguimiento", "informacion", "recordatorio", "cierre", "otro"]

export default function TemplateManager({ templates, onActualizar }) {
  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState(INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]   = useState("")

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }

  function abrirNuevo() { setForm(INICIAL); setModal("nuevo") }
  function abrirEditar(t) { setForm({ nombre: t.nombre, texto: t.texto, categoria: t.categoria }); setModal(t) }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    if (!form.texto.trim())  { setError("El texto es requerido."); return }
    setError("")
    setGuardando(true)
    try {
      if (modal === "nuevo") {
        await api.post("/api/eapi/flows?tipo=template", form)
      } else {
        await api.put(`/api/eapi/flows/${modal.id}?tipo=template`, form)
      }
      setModal(null)
      onActualizar()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este template?")) return
    try {
      await api.del(`/api/eapi/flows/${id}?tipo=template`)
      onActualizar()
    } catch (e) { alert(e.message) }
  }

  function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).catch(() => {})
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span className="card__title">Templates de respuesta ({templates.length})</span>
        <button className="btn btn--primary btn--sm" onClick={abrirNuevo}>+ Nuevo template</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {templates.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <p className="text-sm text-muted">Sin templates configurados.</p>
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.nombre}</span>
                    <span className="badge badge--muted" style={{ fontSize: "0.7rem" }}>{t.categoria}</span>
                  </div>
                  <div className="text-sm text-muted" style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{t.texto}</div>
                </div>
                <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => copiarTexto(t.texto)} title="Copiar" style={{ display: "inline-flex", alignItems: "center" }}><IcoCopy size={13} /></button>
                  <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(t)} style={{ display: "inline-flex", alignItems: "center" }}><IcoPencil size={13} /></button>
                  <button className="btn btn--ghost btn--sm" onClick={() => eliminar(t.id)} style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}><IcoTrash size={13} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="dialog" style={{ maxWidth: 500 }}>
            <div className="dialog__header">
              <h3 className="dialog__title">{modal === "nuevo" ? "Nuevo template" : "Editar template"}</h3>
              <button className="btn btn--ghost btn--icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="dialog__body" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {error && <div className="badge badge--danger" style={{ padding: "0.5rem", borderRadius: "var(--radius)" }}>{error}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="input-group">
                    <label>Nombre *</label>
                    <input className="input" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Bienvenida inicial" required />
                  </div>
                  <div className="input-group">
                    <label>Categoría</label>
                    <select className="select" value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                      {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Texto del mensaje *</label>
                  <textarea
                    className="input"
                    rows={5}
                    value={form.texto}
                    onChange={(e) => set("texto", e.target.value)}
                    placeholder="Hola {{nombre}}, ¿en qué podemos ayudarte?"
                    style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.875rem" }}
                    required
                  />
                  <span className="text-xs text-muted">Podés usar {"{{nombre}}"}, {"{{municipio}}"} como variables.</span>
                </div>
              </div>
              <div className="dialog__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
