"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { api } from "@/lib/api-client"
import { useTopbarSlot } from "@/lib/use-topbar-slot"
import CalendarioDual from "@/components/ui/CalendarioDual"
import ReclamosList from "./ReclamosList"
import ReclamoDetail from "./ReclamoDetail"
import ReclamoModal from "./ReclamoModal"

// ── Constantes ────────────────────────────────────────────────────
const TABS_ESTADO = [
  { key: "",           label: "Todos"      },
  { key: "pendiente",  label: "Pendiente"  },
  { key: "entrante",   label: "Entrante"   },
  { key: "tomado",     label: "Tomado"     },
  { key: "elevado",    label: "Elevado"    },
  { key: "en_proceso", label: "En proceso" },
  { key: "resuelto",   label: "Resuelto"   },
  { key: "cerrado",    label: "Cerrado"    },
]

const CANALES = [
  { value: "",           label: "Canal" },
  { value: "whatsapp",   label: "WhatsApp" },
  { value: "email",      label: "Email" },
  { value: "presencial", label: "Presencial" },
]

const LOCALIDADES = ["Aeropuerto", "Canning", "Ezeiza", "La Unión", "Spegazzini", "Suárez"]

const ETIQUETAS = ["General", "Urgente", "Vialidad", "Iluminación", "Espacios verdes", "Saneamiento", "Seguridad", "Ruidos molestos", "Otro"]

const FILTROS_INICIAL = {
  busqueda: "", estado: "", etiqueta: "", categoriaSlug: "", localidad: "", canal: "", equipoId: "", fechaDesde: "", fechaHasta: "",
}

// ── Íconos inline ─────────────────────────────────────────────────
function IcoSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IcoFiltro() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  )
}

function IcoTag() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}

function IcoCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

// ── Topbar slot ───────────────────────────────────────────────────
function ReclamosTopbarSlot({ filtros, tabEstado, onTab, onChange, onNuevo, equipos, esAdmin, total, categorias = [] }) {
  const [filtrosOpen,    setFiltrosOpen]    = useState(false)
  const [filtrosSubOpen, setFiltrosSubOpen] = useState(null) // "estado" | "localidades" | "etiquetas" | "periodo" | null
  const filtrosRef = useRef(null)

  useEffect(() => {
    function onDown(e) {
      if (filtrosRef.current && !filtrosRef.current.contains(e.target)) { setFiltrosOpen(false); setFiltrosSubOpen(null) }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const hayFiltros = !!(tabEstado || filtros.localidad || filtros.categoriaSlug || filtros.fechaDesde || filtros.fechaHasta || filtros.busqueda)
  const hayPeriodo = !!(filtros.fechaDesde || filtros.fechaHasta)

  function abrirFiltros() { setFiltrosOpen((v) => !v); setFiltrosSubOpen(null) }

  return (
    <>
      <div className="rec-filtros-toolbar">

      {/* ── Filtros (Estado + Localidades) ── */}
      <div ref={filtrosRef} className={`tb-loc-pills${filtrosOpen ? " tb-loc-pills--open" : ""}`}>
        <button
          className={`tb-loc-trigger${hayFiltros ? " tb-loc-trigger--sel" : ""}`}
          onClick={abrirFiltros}
        >
          <IcoFiltro />
          {hayFiltros && <span className="tb-loc-dot" />}
          <span>Filtros</span>
          {total !== undefined && <span className="tb-loc-count">{total}</span>}
          <span className="tb-loc-pipe">|</span>
        </button>

        <div className="tb-loc-tabs-wrap">
          <div style={{ position: "relative" }}>
            <button
              className={`tb-loc-tab${tabEstado ? " tb-loc-tab--active" : ""}`}
              onClick={() => setFiltrosSubOpen((v) => v === "estado" ? null : "estado")}
            >
              {tabEstado ? TABS_ESTADO.find((t) => t.key === tabEstado)?.label : "Estado"}
            </button>
            {filtrosSubOpen === "estado" && (
              <div className="rec-filtros-panel">
                {TABS_ESTADO.filter((t) => t.key !== "").map((t) => (
                  <div key={t.key} className="rec-filtros-row">
                    <div className="tb-loc-pill-bg">
                      <button
                        className={`rec-filtros-row-lbl${tabEstado === t.key ? " rec-filtros-row-lbl--active" : ""}`}
                        onClick={() => { onTab(tabEstado === t.key ? "" : t.key); setFiltrosSubOpen(null) }}
                      >
                        {t.label}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              className={`tb-loc-tab${filtros.localidad ? " tb-loc-tab--active" : ""}`}
              onClick={() => setFiltrosSubOpen((v) => v === "localidades" ? null : "localidades")}
            >
              {filtros.localidad || "Localidades"}
            </button>
            {filtrosSubOpen === "localidades" && (
              <div className="rec-filtros-panel">
                {LOCALIDADES.map((l) => (
                  <div key={l} className="rec-filtros-row">
                    <div className="tb-loc-pill-bg">
                      <button
                        className={`rec-filtros-row-lbl${filtros.localidad === l ? " rec-filtros-row-lbl--active" : ""}`}
                        onClick={() => { onChange({ ...filtros, localidad: filtros.localidad === l ? "" : l }); setFiltrosSubOpen(null) }}
                      >
                        {l}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              className={`tb-loc-tab${filtros.categoriaSlug ? " tb-loc-tab--active" : ""}`}
              onClick={() => setFiltrosSubOpen((v) => v === "etiquetas" ? null : "etiquetas")}
            >
              {filtros.categoriaSlug
                ? (categorias.find((c) => c.slug === filtros.categoriaSlug)?.nombre ?? "Categoría")
                : "Categoría"}
            </button>
            {filtrosSubOpen === "etiquetas" && categorias.length > 0 && (
              <div className="rec-filtros-panel rec-filtros-panel--cols">
                {[categorias.slice(0, Math.ceil(categorias.length / 2)), categorias.slice(Math.ceil(categorias.length / 2))].map((col, ci) => (
                  <div key={ci} className="rec-filtros-col">
                    {col.map((c) => (
                      <div key={c.slug} className="rec-filtros-row">
                        <div className="tb-loc-pill-bg">
                          <button
                            className={`rec-filtros-row-lbl${filtros.categoriaSlug === c.slug ? " rec-filtros-row-lbl--active" : ""}`}
                            onClick={() => { onChange({ ...filtros, categoriaSlug: filtros.categoriaSlug === c.slug ? "" : c.slug }); setFiltrosSubOpen(null) }}
                          >
                            {c.nombre}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              className={`tb-loc-tab${hayPeriodo ? " tb-loc-tab--active" : ""}`}
              onClick={() => setFiltrosSubOpen((v) => v === "periodo" ? null : "periodo")}
            >
              {hayPeriodo
                ? `${filtros.fechaDesde || "…"}${filtros.fechaHasta ? ` → ${filtros.fechaHasta}` : ""}`
                : "Período"}
            </button>
            {filtrosSubOpen === "periodo" && (
              <div className="rec-filtros-panel">
                <CalendarioDual
                  desde={filtros.fechaDesde}
                  hasta={filtros.fechaHasta}
                  onConfirm={({ desde, hasta }) => {
                    onChange({ ...filtros, fechaDesde: desde, fechaHasta: hasta })
                    if ((desde && hasta) || (!desde && !hasta)) setFiltrosSubOpen(null)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      </div>{/* /rec-filtros-toolbar */}

      {/* Chips activos */}
      {tabEstado && (
        <button className="rec-active-chip" onClick={() => onTab("")}>
          {TABS_ESTADO.find((t) => t.key === tabEstado)?.label}
          <span className="rec-active-chip__x">×</span>
        </button>
      )}
      {filtros.localidad && (
        <button className="rec-active-chip" onClick={() => onChange({ ...filtros, localidad: "" })}>
          {filtros.localidad}<span className="rec-active-chip__x">×</span>
        </button>
      )}
      {filtros.etiqueta && (
        <button className="rec-active-chip" onClick={() => onChange({ ...filtros, etiqueta: "" })}>
          {filtros.etiqueta}<span className="rec-active-chip__x">×</span>
        </button>
      )}
      {hayPeriodo && (
        <button className="rec-active-chip" onClick={() => onChange({ ...filtros, fechaDesde: "", fechaHasta: "" })}>
          {filtros.fechaDesde || "…"}{filtros.fechaHasta ? ` → ${filtros.fechaHasta}` : ""}
          <span className="rec-active-chip__x">×</span>
        </button>
      )}

      {/* Acciones */}
      <div className="topbar__actions">
        <div className="rec-tb-search">
          <IcoSearch />
          <input
            placeholder="Buscar…"
            value={filtros.busqueda}
            onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          />
          {filtros.busqueda && (
            <button onClick={() => onChange({ ...filtros, busqueda: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", lineHeight: 1 }}>✕</button>
          )}
        </div>
        <button className="tur-entity-btn tur-entity-btn--active" onClick={onNuevo}>
          + Nuevo
        </button>
      </div>
    </>
  )
}

// ── Componente principal ───────────────────────────────────────────
export default function ModuloReclamos() {
  const { data: session } = useSession()
  const esAdmin           = session?.user?.rol === "admin"

  const [filtros,        setFiltros]        = useState(FILTROS_INICIAL)
  const [tabEstado,      setTabEstado]      = useState("")
  const [reclamos,       setReclamos]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [activoId,       setActivoId]       = useState(null)
  const [detalle,        setDetalle]        = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [equipos,     setEquipos]     = useState([])
  const [categorias,  setCategorias]  = useState([])

  useEffect(() => {
    if (!esAdmin) return
    api.get("/api/admin/equipos").then(setEquipos).catch(() => {})
  }, [esAdmin])

  useEffect(() => {
    api.get("/api/mapa?solo=categorias")
      .then((d) => setCategorias((d.categorias ?? []).filter((c) => c.activo !== false)))
      .catch(() => {})
  }, [])

  const fetchReclamos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const estadoFiltro = tabEstado || filtros.estado
      if (estadoFiltro)       params.set("estado",     estadoFiltro)
      if (filtros.etiqueta)      params.set("etiqueta",      filtros.etiqueta)
      if (filtros.categoriaSlug) params.set("categoriaSlug", filtros.categoriaSlug)
      if (filtros.localidad)     params.set("localidad",     filtros.localidad)
      if (filtros.canal)      params.set("canal",      filtros.canal)
      if (filtros.equipoId)   params.set("equipoId",   filtros.equipoId)
      if (filtros.busqueda)   params.set("busqueda",   filtros.busqueda)
      if (filtros.fechaDesde) params.set("fechaDesde", filtros.fechaDesde)
      if (filtros.fechaHasta) params.set("fechaHasta", filtros.fechaHasta)
      setReclamos(await api.get(`/api/reclamos?${params}`))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filtros, tabEstado])

  useEffect(() => { fetchReclamos() }, [fetchReclamos])

  useEffect(() => {
    if (!activoId) { setDetalle(null); return }
    setLoadingDetalle(true)
    api.get(`/api/reclamos/${activoId}`)
      .then(setDetalle)
      .catch(console.error)
      .finally(() => setLoadingDetalle(false))
  }, [activoId])

  function onActualizar(nuevoId = activoId) {
    fetchReclamos()
    setActivoId(nuevoId)
    if (nuevoId) {
      api.get(`/api/reclamos/${nuevoId}`).then(setDetalle).catch(console.error)
    } else {
      setDetalle(null)
    }
  }

  function onCreado(nuevo) {
    setModalOpen(false)
    fetchReclamos()
    setActivoId(nuevo.id)
  }

  function onTab(key) {
    setTabEstado(key)
    setFiltros((f) => ({ ...f, estado: "" }))
  }

  // Inyectar en topbar
  useTopbarSlot(
    <ReclamosTopbarSlot
      filtros={filtros}
      tabEstado={tabEstado}
      onTab={onTab}
      onChange={setFiltros}
      onNuevo={() => setModalOpen(true)}
      equipos={equipos}
      esAdmin={esAdmin}
      total={loading ? undefined : reclamos.length}
      categorias={categorias}
    />,
    [filtros, tabEstado, equipos, esAdmin, loading, reclamos.length, categorias]
  )

  return (
    <div className="reclamos-layout">
      <ReclamosList
        reclamos={reclamos}
        loading={loading}
        activoId={activoId}
        onSelect={setActivoId}
      />

      <ReclamoDetail
        reclamo={detalle}
        loading={loadingDetalle}
        onActualizar={onActualizar}
        equipos={equipos}
      />

      {modalOpen && (
        <ReclamoModal
          onClose={() => setModalOpen(false)}
          onCreado={onCreado}
        />
      )}
    </div>
  )
}
