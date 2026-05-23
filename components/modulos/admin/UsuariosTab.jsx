"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { initiales } from "@/lib/utils"
import UsuarioModal from "./UsuarioModal"
import { IcoPencil, IcoTrash } from "@/components/ui/Icons"

const ROL_CFG = {
  admin:      { label: "Admin",      cls: "badge--danger"  },
  supervisor: { label: "Supervisor", cls: "badge--info"    },
  operador:   { label: "Operador",   cls: "badge--primary" },
  readonly:   { label: "Solo lect.", cls: "badge--muted"   },
}

export default function UsuariosTab() {
  const [usuarios,   setUsuarios]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const fetchUsuarios = useCallback(async () => {
    try { const d = await api.get("/api/admin/usuarios"); setUsuarios(Array.isArray(d) ? d : []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  async function eliminar(id) {
    if (!confirm("¿Eliminar este usuario?")) return
    setEliminando(id)
    try {
      await api.del(`/api/admin/usuarios?id=${id}`)
      await fetchUsuarios()
    } catch (e) {
      alert(e.message)
    } finally {
      setEliminando(null)
    }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span className="card__title">Usuarios del sistema ({usuarios.length})</span>
        <button className="btn btn--primary btn--sm" onClick={() => setModal("nuevo")}>+ Nuevo usuario</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Sin usuarios.</td></tr>
            ) : (
              usuarios.map((u) => {
                const rolCfg = ROL_CFG[u.rol] ?? { label: u.rol, cls: "badge--muted" }
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="usuario-row">
                        <div className="usuario-avatar">
                          {u.image
                            ? <img src={u.image} alt={u.nombre} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            : initiales(u.nombre)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{u.nombre}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${rolCfg.cls}`}>{rolCfg.label}</span></td>
                    <td>
                      <span className={`badge ${u.estado === "activo" ? "badge--success" : "badge--muted"}`}>
                        {u.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => setModal(u)} title="Editar" style={{ display: "inline-flex", alignItems: "center" }}><IcoPencil size={13} /></button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => eliminar(u.id)}
                          disabled={eliminando === u.id}
                          title="Eliminar"
                          style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}
                        >
                          <IcoTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <UsuarioModal
          usuario={modal === "nuevo" ? null : modal}
          onClose={() => setModal(null)}
          onGuardado={() => { setModal(null); fetchUsuarios() }}
        />
      )}
    </div>
  )
}
