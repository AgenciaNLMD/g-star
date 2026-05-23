"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { initiales } from "@/lib/utils"
import { IcoPencil, IcoTrash, IcoUser } from "@/components/ui/Icons"

const COLORES_PRESET = [
  "#5C6E85", "#1A7A4A", "#A87020", "#C0392B", "#8E44AD",
  "#1499C2", "#E67E22", "#2ECC71", "#3498DB", "#E91E63",
]

const ROL_OPCIONES = [
  { value: "lider",   label: "Líder"  },
  { value: "miembro", label: "Miembro" },
]

// ── Modal crear/editar equipo ──────────────────────────────────────
function EquipoModal({ equipo, usuarios, onClose, onGuardado }) {
  const esNuevo  = !equipo
  const [form,      setForm]      = useState({
    nombre:      equipo?.nombre      ?? "",
    descripcion: equipo?.descripcion ?? "",
    color:       equipo?.color       ?? "#5C6E85",
  })
  const [miembros,  setMiembros]  = useState(
    equipo?.miembros?.map((m) => ({ usuarioId: m.usuarioId, rol: m.rol })) ?? []
  )
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState("")

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function agregarMiembro() {
    const disponible = usuarios.find((u) => !miembros.some((m) => m.usuarioId === u.id))
    if (!disponible) return
    setMiembros((p) => [...p, { usuarioId: disponible.id, rol: "miembro" }])
  }

  function removeMiembro(usuarioId) {
    setMiembros((p) => p.filter((m) => m.usuarioId !== usuarioId))
  }

  function setMiembroRol(usuarioId, rol) {
    setMiembros((p) => p.map((m) => m.usuarioId === usuarioId ? { ...m, rol } : m))
  }

  function setMiembroUsuario(oldId, newId) {
    if (miembros.some((m) => m.usuarioId === newId)) return
    setMiembros((p) => p.map((m) => m.usuarioId === oldId ? { ...m, usuarioId: newId } : m))
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    setError("")
    setGuardando(true)
    try {
      if (esNuevo) {
        await api.post("/api/admin/equipos", { ...form, miembros })
      } else {
        await api.put(`/api/admin/equipos/${equipo.id}`, { ...form, miembros })
      }
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const usuariosDisponibles = usuarios.filter((u) => !miembros.some((m) => m.usuarioId === u.id))

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 520 }}>
        <div className="dialog__header">
          <h3 className="dialog__title">{esNuevo ? "Nuevo equipo" : "Editar equipo"}</h3>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={guardar}>
          <div className="dialog__body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && (
              <div className="badge badge--danger" style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "end" }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Nombre *</label>
                <input className="input" value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} placeholder="Ej: Equipo Vialidad" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Color</label>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {COLORES_PRESET.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField("color", c)}
                      style={{
                        width: 22, height: 22, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                        outline: form.color === c ? "2px solid var(--color-text)" : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Descripción</label>
              <input className="input" value={form.descripcion} onChange={(e) => setField("descripcion", e.target.value)} placeholder="Área de responsabilidad…" />
            </div>

            {/* Miembros */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                <span className="text-xs font-semi text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Miembros ({miembros.length})
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={agregarMiembro}
                  disabled={usuariosDisponibles.length === 0}
                >
                  + Agregar
                </button>
              </div>

              {miembros.length === 0 ? (
                <p className="text-xs text-muted">Sin miembros asignados.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {miembros.map((m) => {
                    const u = usuarios.find((u) => u.id === m.usuarioId)
                    return (
                      <div key={m.usuarioId} className="equipo-miembro-row">
                        <select
                          className="select"
                          value={m.usuarioId}
                          onChange={(e) => setMiembroUsuario(m.usuarioId, e.target.value)}
                          style={{ flex: 1, fontSize: "0.8125rem" }}
                        >
                          {u && <option value={u.id}>{u.nombre} ({u.email})</option>}
                          {usuariosDisponibles.map((ud) => (
                            <option key={ud.id} value={ud.id}>{ud.nombre} ({ud.email})</option>
                          ))}
                        </select>
                        <select
                          className="select"
                          value={m.rol}
                          onChange={(e) => setMiembroRol(m.usuarioId, e.target.value)}
                          style={{ width: 100, fontSize: "0.8125rem" }}
                        >
                          {ROL_OPCIONES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm btn--icon"
                          onClick={() => removeMiembro(m.usuarioId)}
                          style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}
                        >
                          <IcoTrash size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="dialog__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? "Guardando…" : (esNuevo ? "Crear equipo" : "Guardar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────
export default function EquiposTab() {
  const [equipos,    setEquipos]    = useState([])
  const [usuarios,   setUsuarios]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [eq, us] = await Promise.all([
        api.get("/api/admin/equipos"),
        api.get("/api/admin/usuarios"),
      ])
      setEquipos(Array.isArray(eq) ? eq : [])
      setUsuarios(Array.isArray(us) ? us : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function eliminar(id) {
    if (!confirm("¿Eliminar este equipo? Los reclamos asociados quedarán sin equipo.")) return
    setEliminando(id)
    try {
      await api.del(`/api/admin/equipos/${id}`)
      await fetchAll()
    } catch (e) { alert(e.message) }
    finally { setEliminando(null) }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span className="card__title">Equipos de trabajo ({equipos.length})</span>
        <button className="btn btn--primary btn--sm" onClick={() => setModal("nuevo")}>+ Nuevo equipo</button>
      </div>

      {equipos.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: "3rem" }}>
          <div className="empty-state__icon"><IcoUser size={36} /></div>
          <p className="empty-state__title">Sin equipos</p>
          <p className="text-sm text-muted">Creá equipos para organizar a los usuarios y asignar reclamos.</p>
        </div>
      ) : (
        <div className="equipos-grid">
          {equipos.map((eq) => (
            <div key={eq.id} className="equipo-card">
              <div className="equipo-card__header">
                <div className="equipo-card__color-dot" style={{ background: eq.color }} />
                <div style={{ flex: 1 }}>
                  <div className="equipo-card__nombre">{eq.nombre}</div>
                  {eq.descripcion && <div className="equipo-card__desc">{eq.descripcion}</div>}
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setModal(eq)}
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    <IcoPencil size={13} />
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => eliminar(eq.id)}
                    disabled={eliminando === eq.id}
                    style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}
                  >
                    <IcoTrash size={13} />
                  </button>
                </div>
              </div>

              <div className="equipo-card__miembros">
                {eq.miembros?.length === 0 ? (
                  <span className="text-xs text-muted">Sin miembros</span>
                ) : (
                  eq.miembros?.map((m) => (
                    <div key={m.usuarioId} className="equipo-miembro-chip">
                      {m.usuario?.image
                        ? <img src={m.usuario.image} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                        : <div className="usuario-avatar" style={{ width: 20, height: 20, fontSize: "0.55rem" }}>{initiales(m.usuario?.nombre ?? "?")}</div>
                      }
                      <span className="equipo-miembro-chip__nombre">{m.usuario?.nombre}</span>
                      {m.rol === "lider" && <span className="badge badge--warning" style={{ fontSize: "0.6rem", padding: "0 0.3rem" }}>Líder</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <EquipoModal
          equipo={modal === "nuevo" ? null : modal}
          usuarios={usuarios}
          onClose={() => setModal(null)}
          onGuardado={() => { setModal(null); fetchAll() }}
        />
      )}
    </div>
  )
}
