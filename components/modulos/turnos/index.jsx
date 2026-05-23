"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { api } from "@/lib/api-client"
import TurnosCalendar from "./TurnosCalendar"
import TurnoCard from "./TurnoCard"
import TurnoForm from "./TurnoForm"
import TurnoModal from "./TurnoModal"
import { useTopbarSlot } from "@/lib/use-topbar-slot"

// ── Topbar slot ───────────────────────────────────────────────────────────────

function TurnosTopbarSlot({ loading, organismos, cntOrg, organismoActivo, onOrganismo, localidades, entidadActiva, onEntidad, onNuevo }) {
  const [locExpanded, setLocExpanded] = useState(false)
  const locRef = useRef(null)

  useEffect(() => {
    if (!locExpanded) return
    function onDown(e) { if (locRef.current && !locRef.current.contains(e.target)) setLocExpanded(false) }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [locExpanded])

  if (loading) return <div className="spinner" style={{ width: 14, height: 14 }} />

  return (
    <>
      {/* Entity picker */}
      <div ref={locRef} className={`tb-loc-pills${locExpanded ? " tb-loc-pills--open" : ""}`}>
        <button
          className={`tb-loc-trigger${organismoActivo ? " tb-loc-trigger--sel" : ""}`}
          onClick={() => setLocExpanded((v) => !v)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
          </svg>
          <span>Entidades</span>
          {organismoActivo && <span className="tb-loc-count">1</span>}
          <span className="tb-loc-pipe">|</span>
        </button>
        <div className="tb-loc-tabs-wrap">
          {organismos.map((org) => {
            const cnt = cntOrg[org] ?? 0
            return (
              <button
                key={org}
                className={`tb-loc-tab${organismoActivo === org ? " tb-loc-tab--active" : ""}`}
                onClick={() => { onOrganismo(org); setLocExpanded(false) }}
              >
                {org}
                {cnt > 0 && <span className="tur-entity-tag">{cnt}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Branch chips */}
      {localidades.length > 1 && (
        <>
          <span className="tur-topbar-sep" />
          <div className="tur-branches">
            <span className="tur-branches-label">SUCURSALES</span>
            {localidades.map((ent) => {
              const activo = entidadActiva?.id === ent.id && entidadActiva?.localidad === ent.localidad
              return (
                <button
                  key={`${ent.id}_${ent.localidad}`}
                  className={`tur-branch-chip${activo ? " tur-branch-chip--active" : ""}`}
                  onClick={() => onEntidad(ent)}
                >
                  <span className="tur-branch-dot" />
                  {ent.localidad}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="topbar__actions">
        <button className="tur-entity-btn">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Notificar
        </button>
        <button className="tur-entity-btn tur-entity-btn--active" onClick={onNuevo}>
          + Nuevo turno
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function urgenciaDe(turno) {
  if (!turno.createdAt) return "nuevo"
  const hs = (Date.now() - new Date(turno.createdAt).getTime()) / 3_600_000
  if (hs >= 72) return "urgente"
  if (hs >= 24) return "prioridad"
  return "nuevo"
}

export default function ModuloTurnos() {
  const [entidades, setEntidades]           = useState([])
  const [feriados, setFeriados]             = useState([])
  const [organismoActivo, setOrganismoActivo] = useState(null)
  const [entidadActiva, setEntidadActiva]   = useState(null)
  const [filtroUrgencia, setFiltroUrgencia] = useState("todos")
  const [busqueda, setBusqueda]             = useState("")
  const [turnos, setTurnos]                 = useState([])
  const [loadingData, setLoadingData]       = useState(true)
  const [modalId, setModalId]               = useState(null)
  const [formOpen, setFormOpen]             = useState(false)
  const [autoAsignando, setAutoAsignando]   = useState(false)
  const [toast, setToast]                   = useState(null)
  const [filterOpen, setFilterOpen]         = useState(false)

  // ── Carga inicial ────────────────────────────────────────────────────────────

  useEffect(() => {
    api.get("/api/turnos?solo=entidades")
      .then((d) => {
        const ents = d.entidades ?? []
        setEntidades(ents)
        setFeriados(d.feriados ?? [])
        const primer = ents[0]?.nombre
        if (primer) {
          setOrganismoActivo(primer)
          const primeraEnt = ents.find((e) => e.nombre === primer)
          if (primeraEnt) setEntidadActiva(primeraEnt)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingData(false))
  }, [])

  const fetchTurnos = useCallback(async () => {
    if (!entidadActiva) return
    try { setTurnos(await api.get(`/api/turnos?entidadId=${entidadActiva.id}`)) }
    catch (e) { console.error(e) }
  }, [entidadActiva])

  useEffect(() => { fetchTurnos() }, [fetchTurnos])

  // ── Acciones ────────────────────────────────────────────────────────────────

  function seleccionarOrganismo(nombre) {
    setOrganismoActivo(nombre)
    const primera = entidades.find((e) => e.nombre === nombre)
    if (primera) setEntidadActiva(primera)
  }

  async function asignarSlot(turnoId, fecha, hora) {
    setTurnos((prev) => prev.map((t) =>
      t.id === turnoId ? { ...t, estado: "asignado", fechaAsignada: fecha, horaAsignada: hora } : t
    ))
    try {
      await api.put(`/api/turnos/${turnoId}`, { estado: "asignado", fechaAsignada: fecha, horaAsignada: hora })
      fetchTurnos()
    } catch (e) { fetchTurnos(); alert(e.message) }
  }

  async function quitarAsignacion(turnoId) {
    setTurnos((prev) => prev.map((t) =>
      t.id === turnoId ? { ...t, estado: "pedido", fechaAsignada: null, horaAsignada: null } : t
    ))
    try {
      await api.put(`/api/turnos/${turnoId}`, { estado: "pedido", fechaAsignada: null, horaAsignada: null })
      fetchTurnos()
    } catch (e) { fetchTurnos(); alert(e.message) }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function autoAsignar() {
    if (!entidadActiva) return
    setAutoAsignando(true)
    try {
      const { asignados: n } = await api.post("/api/turnos/auto-asignar", {
        entidadId: entidadActiva.id,
        localidad: entidadActiva.localidad ?? null,
        desde: new Date().toISOString().slice(0, 10),
      })
      await fetchTurnos()
      showToast(
        n > 0
          ? `Se asignaron ${n} turno${n !== 1 ? "s" : ""} automáticamente.`
          : "No hay turnos pendientes para asignar.",
        n > 0 ? "success" : "info"
      )
    } catch (e) { showToast(e.message, "error") }
    finally { setAutoAsignando(false) }
  }

  // ── Datos derivados ─────────────────────────────────────────────────────────

  const enEspera  = turnos.filter((t) => ["pedido", "pendiente"].includes(t.estado))
  const asignados = turnos.filter((t) => ["asignado", "confirmado"].includes(t.estado))

  const organismos = useMemo(() => [...new Set(entidades.map((e) => e.nombre))], [entidades])

  const localidades = useMemo(() => {
    const records = entidades.filter((e) => e.nombre === organismoActivo)
    if (records.length === 1) {
      const subs = Array.isArray(records[0].sucursales) ? records[0].sucursales : []
      if (subs.length > 1) {
        return subs.map((s) => ({
          ...records[0],
          localidad: (typeof s === "string" ? s : (s?.localidad || s?.nombre)) ?? "",
        }))
      }
    }
    return records
  }, [entidades, organismoActivo])

  const cntUrgentes  = enEspera.filter((t) => urgenciaDe(t) === "urgente").length
  const cntPrioridad = enEspera.filter((t) => urgenciaDe(t) === "prioridad").length
  const cntNuevos    = enEspera.filter((t) => urgenciaDe(t) === "nuevo").length

  const listaFiltrada = useMemo(() => {
    let lista = enEspera
    if (filtroUrgencia !== "todos") lista = lista.filter((t) => urgenciaDe(t) === filtroUrgencia)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter((t) => t.nombre?.toLowerCase().includes(q) || t.dni?.includes(q))
    }
    return lista
  }, [enEspera, filtroUrgencia, busqueda])

  const cntOrg = useMemo(() => {
    const m = {}
    entidades.forEach((e) => {
      m[e.nombre] = (m[e.nombre] ?? 0) + (e.turnosPedidos ?? 0)
    })
    return m
  }, [entidades])

  // ── Topbar ───────────────────────────────────────────────────────────────────

  useTopbarSlot(
    <TurnosTopbarSlot
      loading={loadingData}
      organismos={organismos}
      cntOrg={cntOrg}
      organismoActivo={organismoActivo}
      onOrganismo={seleccionarOrganismo}
      localidades={localidades}
      entidadActiva={entidadActiva}
      onEntidad={setEntidadActiva}
      onNuevo={() => setFormOpen(true)}
    />,
    [loadingData, organismos, cntOrg, organismoActivo, localidades, entidadActiva]
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="tur-shell">

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="tur-body">

        {/* Col 1: Solicitantes */}
        <aside className="tur-solicitantes">
          <div className="tur-sol-head">
            <div className="tur-sol-title">
              <h2>Solicitantes</h2>
              <span className="tur-sol-count">{enEspera.length}</span>
            </div>

            {/* Filtro dropdown */}
            <div className="tur-filter-wrap">
              <button
                className="tur-filter-trigger"
                onClick={() => setFilterOpen((v) => !v)}
              >
                {[
                  { id: "todos",     label: "Todos" },
                  { id: "urgente",   label: "Urgentes" },
                  { id: "prioridad", label: "Prioridad" },
                  { id: "nuevo",     label: "Nuevos" },
                ].find((f) => f.id === filtroUrgencia)?.label ?? "Todos"}
                <svg
                  width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: filterOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {filterOpen && (
                <>
                  <div className="tur-filter-overlay" onClick={() => setFilterOpen(false)} />
                  <div className="tur-filter-dropdown">
                    {[
                      { id: "todos",     label: "Todos",     cnt: enEspera.length },
                      { id: "urgente",   label: "Urgentes",  cnt: cntUrgentes },
                      { id: "prioridad", label: "Prioridad", cnt: cntPrioridad },
                      { id: "nuevo",     label: "Nuevos",    cnt: cntNuevos },
                    ].map((f) => (
                      <button
                        key={f.id}
                        className={`tur-filter-item${filtroUrgencia === f.id ? " active" : ""}`}
                        onClick={() => { setFiltroUrgencia(f.id); setFilterOpen(false) }}
                      >
                        {f.label}
                        <span className="tur-filter-item-cnt">{f.cnt}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="tur-search-wrap">
            <div className="tur-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Buscar por nombre o DNI…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="tur-sol-list">
            {!entidadActiva ? (
              <p className="text-sm text-muted" style={{ padding: "1.5rem", textAlign: "center" }}>
                Seleccioná un organismo
              </p>
            ) : listaFiltrada.length === 0 ? (
              <p className="text-sm text-muted" style={{ padding: "1.5rem", textAlign: "center" }}>
                Sin turnos en esta categoría
              </p>
            ) : (
              listaFiltrada.map((t) => (
                <TurnoCard
                  key={t.id}
                  turno={t}
                  draggable
                  onClick={() => setModalId(t.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Col 2: Calendario */}
        <div className="tur-cal">
          {!entidadActiva ? (
            <div className="empty-state" style={{ height: "100%" }}>
              <p className="empty-state__title">Seleccioná una entidad</p>
              <p className="text-sm text-muted">Elegí un organismo del selector superior.</p>
            </div>
          ) : (
            <TurnosCalendar
              entidad={entidadActiva}
              turnosAsignados={asignados}
              turnosPendientes={enEspera}
              feriados={feriados}
              onSelectTurno={setModalId}
              onAsignar={asignarSlot}
              onQuitar={quitarAsignacion}
            />
          )}
        </div>
      </div>

      {/* ── FAB autoasignar ───────────────────────────────────────────────── */}
      {entidadActiva && enEspera.length > 0 && (
        <button className="tur-fab" onClick={autoAsignar} disabled={autoAsignando}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {autoAsignando ? "Asignando…" : "Autoasignar pendientes"}
          <span className="tur-fab-count">{enEspera.length}</span>
        </button>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`tur-toast tur-toast--${toast.type}`}>
          <span className="tur-toast__icon">
            {toast.type === "success" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {toast.type === "info" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            {toast.type === "error" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
          </span>
          <span className="tur-toast__msg">{toast.msg}</span>
          <button className="tur-toast__close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* ── Modales ───────────────────────────────────────────────────────── */}
      {modalId && (
        <TurnoModal turnoId={modalId} onClose={() => setModalId(null)} onActualizar={fetchTurnos} />
      )}
      {formOpen && (
        <TurnoForm
          entidades={entidades}
          onClose={() => setFormOpen(false)}
          onCreado={() => { setFormOpen(false); fetchTurnos() }}
        />
      )}
    </div>
  )
}
