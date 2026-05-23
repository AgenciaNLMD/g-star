"use client"
import { useState } from "react"
import { api } from "@/lib/api-client"
import { IcoCampos, IcoPencil, IcoTrash, IcoSave, IcoCalendar } from "@/components/ui/Icons"

const TIPOS = [
  { value: "texto",    label: "Texto",    desc: "Cadena de caracteres libre" },
  { value: "numero",   label: "Número",   desc: "Valor numérico entero o decimal" },
  { value: "fecha",    label: "Fecha",    desc: "Fecha en formato DD/MM/YYYY" },
  { value: "booleano", label: "Sí / No",  desc: "Valor verdadero o falso" },
]

const TIPO_COLOR = { texto: "#3b82f6", numero: "#06b6d4", fecha: "#8b5cf6", booleano: "#22c55e" }
const TIPO_ICON  = { texto: "Aa", numero: "#", fecha: null, booleano: "✓" }

const INPUT  = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.375rem 0.5rem", fontSize: "0.8125rem", fontFamily: "inherit", background: "#f8fafc" }
const LABEL  = { fontSize: "0.6875rem", fontWeight: 700, display: "block", marginBottom: "0.25rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }

export default function CamposManager({ campos, onActualizar }) {
  const [creando, setCreando]       = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando]   = useState(false)
  const [form, setForm]             = useState({ nombre: "", tipo: "texto", descripcion: "", valorDefault: "" })

  function abrirNuevo() {
    setForm({ nombre: "", tipo: "texto", descripcion: "", valorDefault: "" })
    setCreando(true)
    setEditandoId(null)
  }

  function abrirEditar(campo) {
    setForm({ nombre: campo.nombre, tipo: campo.tipo, descripcion: campo.descripcion ?? "", valorDefault: campo.valorDefault ?? "" })
    setEditandoId(campo.id)
    setCreando(false)
  }

  function cancelar() {
    setCreando(false)
    setEditandoId(null)
  }

  async function guardar() {
    if (!form.nombre.trim()) { alert("El nombre es requerido"); return }
    setGuardando(true)
    try {
      if (editandoId) {
        await api.put(`/api/flows/campos/${editandoId}`, {
          tipo: form.tipo,
          descripcion: form.descripcion || null,
          valorDefault: form.valorDefault || null,
        })
      } else {
        await api.post("/api/flows/campos", {
          nombre: form.nombre.toLowerCase().replace(/\s+/g, "_"),
          tipo: form.tipo,
          descripcion: form.descripcion || null,
          valorDefault: form.valorDefault || null,
        })
      }
      onActualizar()
      cancelar()
    } catch (e) {
      alert(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar el campo "${nombre}"? Se perderán todos los valores guardados.`)) return
    try {
      await api.del(`/api/flows/campos/${id}`)
      onActualizar()
    } catch (e) { alert(e.message) }
  }

  const formulario = (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <IcoPencil size={14} />
        {editandoId ? "Editar campo" : "Nuevo campo"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={LABEL}>Nombre del campo</label>
          <input
            style={{ ...INPUT, fontFamily: "monospace" }}
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
            placeholder="nombre_contacto"
            disabled={!!editandoId}
          />
          <div style={{ fontSize: "0.5625rem", color: "#94a3b8", marginTop: "0.25rem" }}>
            Solo minúsculas, números y _. Se usa como <code style={{ background: "#f1f5f9", padding: "0 3px", borderRadius: 3 }}>{"{{nombre_contacto}}"}</code>
          </div>
        </div>

        <div>
          <label style={LABEL}>Tipo de dato</label>
          <select style={INPUT} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={LABEL}>Descripción</label>
          <input style={INPUT} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Para qué se usa este campo" />
        </div>

        <div>
          <label style={LABEL}>Valor por defecto</label>
          <input style={INPUT} value={form.valorDefault} onChange={(e) => setForm((f) => ({ ...f, valorDefault: e.target.value }))} placeholder="(vacío)" />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button className="btn btn--ghost btn--sm" onClick={cancelar}>Cancelar</button>
        <button className="btn btn--primary btn--sm" onClick={guardar} disabled={guardando} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
          <IcoSave size={13} />
          {guardando ? "Guardando…" : "Guardar campo"}
        </button>
      </div>
    </div>
  )

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <span className="card__title">Campos de contacto ({campos.length})</span>
          <p className="text-sm text-muted" style={{ marginTop: "0.25rem" }}>
            Variables que se pueden guardar por contacto y usar en los flows con <code style={{ background: "#f1f5f9", padding: "0 4px", borderRadius: 3, fontSize: "0.75rem" }}>{"{{nombre_campo}}"}</code>
          </p>
        </div>
        {!creando && !editandoId && (
          <button className="btn btn--primary btn--sm" onClick={abrirNuevo}>+ Nuevo campo</button>
        )}
      </div>

      {(creando || editandoId) && formulario}

      {campos.length === 0 && !creando ? (
        <div className="empty-state" style={{ padding: "3rem" }}>
          <div className="empty-state__icon"><IcoCampos size={40} /></div>
          <p className="empty-state__title">Sin campos configurados</p>
          <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
            Creá campos para guardar datos del contacto: nombre, DNI, trámite solicitado, etc.
          </p>
          <button className="btn btn--primary btn--sm" onClick={abrirNuevo}>+ Crear primer campo</button>
        </div>
      ) : (
        <div>
          {campos.map((campo) => {
            const color = TIPO_COLOR[campo.tipo] ?? "#64748b"
            const icon  = TIPO_ICON[campo.tipo]  ?? "?"
            const editando = editandoId === campo.id
            return (
              <div key={campo.id} style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "1rem", opacity: editando ? 0.4 : 1 }}>
                {/* Ícono tipo */}
                <div style={{ width: 36, height: 36, borderRadius: 8, background: color + "18", border: `1.5px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.75rem", color, flexShrink: 0 }}>
                  {campo.tipo === "fecha" ? <IcoCalendar size={15} /> : icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <code style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a", background: "#f1f5f9", padding: "0.1rem 0.4rem", borderRadius: 4 }}>
                      {`{{${campo.nombre}}}`}
                    </code>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color, background: color + "12", border: `1px solid ${color}33`, borderRadius: 99, padding: "0.1rem 0.4rem" }}>
                      {campo.tipo}
                    </span>
                  </div>
                  {campo.descripcion && (
                    <div className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>{campo.descripcion}</div>
                  )}
                  {campo.valorDefault && (
                    <div className="text-xs text-muted" style={{ marginTop: "0.1rem" }}>Default: <em>{campo.valorDefault}</em></div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                  <button className="btn btn--secondary btn--sm" onClick={() => abrirEditar(campo)} style={{ display: "inline-flex", alignItems: "center" }}><IcoPencil size={13} /></button>
                  <button className="btn btn--ghost btn--sm" onClick={() => eliminar(campo.id, campo.nombre)} style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}><IcoTrash size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
