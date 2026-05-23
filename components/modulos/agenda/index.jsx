"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import AgendaCalendar from "./AgendaCalendar"
import AgendaItem from "./AgendaItem"
import AgendaModal from "./AgendaModal"
import { IcoCalendar } from "@/components/ui/Icons"

const VISTA_OPCIONES = [
  { key: "calendario", label: "Calendario" },
  { key: "lista",      label: "Lista"      },
]

export default function ModuloAgenda() {
  const [eventos, setEventos]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [vista, setVista]       = useState("calendario")
  const [modal, setModal]       = useState(null) // null | "nuevo" | {evento}
  const [fechaModal, setFechaModal] = useState("")

  const fetchEventos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get("/api/agenda")
      setEventos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEventos() }, [fetchEventos])

  function abrirNuevo(fecha = "") {
    setFechaModal(fecha)
    setModal("nuevo")
  }

  function abrirEditar(evento) {
    setFechaModal("")
    setModal(evento)
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este evento?")) return
    try {
      await api.del(`/api/agenda/${id}`)
      fetchEventos()
    } catch (e) {
      alert(e.message)
    }
  }

  function onGuardado() {
    setModal(null)
    fetchEventos()
  }

  const hoy = new Date()
  const proximos = eventos
    .filter((ev) => ev.fecha && new Date(ev.fecha) >= new Date(hoy.toDateString()))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 5)

  return (
    <div className="mod-page">
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.625rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
        <div className="agenda-vista-toggle">
          {VISTA_OPCIONES.map((v) => (
            <button
              key={v.key}
              className={`btn btn--sm ${vista === v.key ? "btn--primary" : "btn--secondary"}`}
              onClick={() => setVista(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => abrirNuevo()}>
          + Nuevo evento
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : (
        <div className="agenda-layout">
          <div className="agenda-main">
            {vista === "calendario" ? (
              <AgendaCalendar
                eventos={eventos}
                onNuevo={abrirNuevo}
                onEditar={abrirEditar}
                onEliminar={eliminar}
              />
            ) : (
              <div className="agenda-lista">
                {eventos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon"><IcoCalendar size={40} /></div>
                    <p className="empty-state__title">Sin eventos</p>
                    <p className="text-sm text-muted">Creá el primer evento para comenzar.</p>
                    <button className="btn btn--primary btn--sm" onClick={() => abrirNuevo()}>+ Nuevo evento</button>
                  </div>
                ) : (
                  [...eventos]
                    .sort((a, b) => a.fecha.localeCompare(b.fecha))
                    .map((ev) => (
                      <AgendaItem
                        key={ev.id}
                        evento={ev}
                        onEditar={abrirEditar}
                        onEliminar={eliminar}
                      />
                    ))
                )}
              </div>
            )}
          </div>

          {/* Panel lateral: próximos eventos */}
          <div className="agenda-sidebar">
            <div className="card">
              <div className="card__header">
                <span className="card__title">Próximos eventos</span>
              </div>
              <div style={{ padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {proximos.length === 0 ? (
                  <p className="text-sm text-muted">Sin eventos próximos.</p>
                ) : (
                  proximos.map((ev) => (
                    <div key={ev.id} className="agenda-proximo" onClick={() => abrirEditar(ev)}>
                      <div className={`agenda-proximo__dot agenda-proximo__dot--${ev.tipo}`} />
                      <div>
                        <div className="text-sm" style={{ fontWeight: 500 }}>{ev.titulo}</div>
                        <div className="text-xs text-muted">
                          {ev.fecha?.slice(0, 10)}{ev.hora ? ` · ${ev.hora}` : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <AgendaModal
          evento={modal === "nuevo" ? null : modal}
          fechaInicial={fechaModal}
          onClose={() => setModal(null)}
          onGuardado={onGuardado}
        />
      )}
    </div>
  )
}
