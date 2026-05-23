"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useModulo } from "@/lib/modulo-context"
import { api } from "@/lib/api-client"
import { tiempoRelativo } from "@/lib/utils"
import dynamic from "next/dynamic"

const TurnosPorEntidadChart     = dynamic(() => import("./TurnosPorEntidadChart"),     { ssr: false })
const ReclamosDonut             = dynamic(() => import("./ReclamosDonut"),             { ssr: false })
const ReclamosPorCategoriaChart = dynamic(() => import("./ReclamosPorCategoriaChart"), { ssr: false })
const ReclamosTimelineChart     = dynamic(() => import("./ReclamosTimelineChart"),     { ssr: false })
const TurnosTimelineChart       = dynamic(() => import("./TurnosTimelineChart"),       { ssr: false })
const RDashboard                = dynamic(() => import("./RDashboard"),                { ssr: false })

const PERIODOS = [
  { value: "7d",        label: "7 días" },
  { value: "mes",       label: "Este mes" },
  { value: "30d",       label: "30 días" },
  { value: "trimestre", label: "Trimestre" },
]

const ESTADO_BADGE = {
  pendiente:  { label: "Pendiente",  cls: "badge--warning" },
  entrante:   { label: "Entrante",   cls: "badge--entrante" },
  tomado:     { label: "Tomado",     cls: "badge--tomado" },
  elevado:    { label: "Elevado",    cls: "badge--elevado" },
  en_proceso: { label: "En proceso", cls: "badge--info" },
  resuelto:   { label: "Resuelto",   cls: "badge--success" },
  cerrado:    { label: "Cerrado",    cls: "badge--muted" },
}

export default function ModuloDashboard() {
  const { data: session } = useSession()
  const { setModuloActivo, setTopbarSlot } = useModulo()

  const [tab,       setTab]       = useState("reclamos")
  const [periodo,   setPeriodo]   = useState("mes")
  const [entidadId, setEntidadId] = useState("")
  const [datos,     setDatos]     = useState(null)
  const [loading,   setLoading]   = useState(true)

  // Derivaciones de datos (deben ir ANTES del useEffect que las usa)
  const kpis                 = datos?.kpis                 ?? {}
  const reclamosPorEstado    = datos?.reclamosPorEstado    ?? {}
  const reclamosPorCategoria = datos?.reclamosPorCategoria ?? []
  const reclamosTimeline     = datos?.reclamosTimeline     ?? []
  const turnosPorEntidad     = datos?.turnosPorEntidad     ?? {}
  const turnosTimeline       = datos?.turnosTimeline       ?? []
  const entidades            = datos?.entidades            ?? []
  const reclamosRecientes    = datos?.reclamosRecientes    ?? []

  // Inyectar tabs + pills de período en la topbar
  useEffect(() => {
    setTopbarSlot(
      <div className="dash-tabs">
        <button
          className={`dash-tab${tab === "reclamos" ? " dash-tab--active" : ""}`}
          onClick={() => setTab("reclamos")}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Reclamos
        </button>
        <button
          className={`dash-tab${tab === "entidades" ? " dash-tab--active" : ""}`}
          onClick={() => setTab("entidades")}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          Entidades
        </button>
        {tab === "entidades" && (
          <>
            <div className="dash-tabs__sep" />
            <select className="select" style={{ width: "auto", height: "26px", fontSize: "0.75rem" }} value={periodo} onChange={e => setPeriodo(e.target.value)}>
              {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {entidades.length > 0 && (
              <select className="select" style={{ width: "auto", height: "26px", fontSize: "0.75rem" }} value={entidadId} onChange={e => setEntidadId(e.target.value)}>
                <option value="">Todas las entidades</option>
                {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            )}
          </>
        )}
      </div>
    )
    return () => setTopbarSlot(null)
  }, [tab, periodo, entidadId, entidades, setTopbarSlot]) // periodo/entidades solo afectan tab entidades

  const fetchDatos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ periodo })
      if (entidadId) params.set("entidadId", entidadId)
      const data = await api.get(`/api/panel?${params}`)
      setDatos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [periodo, entidadId])

  useEffect(() => { fetchDatos() }, [fetchDatos])

  const pctCompletados = kpis.totalTurnos > 0
    ? Math.round((kpis.turnosCompletados / kpis.totalTurnos) * 100)
    : 0

  const rankingEntidades = Object.entries(turnosPorEntidad)
    .map(([nom, d]) => ({
      nombre:         nom,
      total:          d.total,
      pctCompletados: d.total > 0 ? Math.round(((d.completado ?? 0) / d.total) * 100) : 0,
      pctAusentes:    d.total > 0 ? Math.round(((d.ausente    ?? 0) / d.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label ?? ""

  if (tab === "reclamos") {
    return (
      <div className="rd-root">
        <RDashboard />
      </div>
    )
  }

  return (
    <div className="dash-layout">
      <TabEntidades
        kpis={kpis}
        pctCompletados={pctCompletados}
        turnosPorEntidad={turnosPorEntidad}
        turnosTimeline={turnosTimeline}
        rankingEntidades={rankingEntidades}
        loading={loading}
        setModuloActivo={setModuloActivo}
      />
    </div>
  )
}

// ── TAB RECLAMOS ─────────────────────────────────────────────────────────────

function TabReclamos({ kpis, reclamosPorEstado, reclamosPorCategoria, reclamosTimeline, reclamosRecientes, loading, setModuloActivo }) {
  return (
    <>
      {/* KPIs */}
      <div className="dash-kpis dash-kpis--4">
        <KpiCard
          icon={<IconNuevo />}
          label="Nuevos hoy"
          value={loading ? "…" : (kpis.reclamosHoy ?? 0)}
          sub="ingresados"
          color="var(--color-primary)"
        />
        <KpiCard
          icon={<IconPendiente />}
          label="Pendientes"
          value={loading ? "…" : (kpis.reclamosPendientes ?? 0)}
          sub="sin resolver"
          color="var(--color-warning)"
          onClick={() => setModuloActivo("reclamos")}
        />
        <KpiCard
          icon={<IconProceso />}
          label="En proceso"
          value={loading ? "…" : (kpis.reclamosEnProceso ?? 0)}
          sub="en atención"
          color="var(--color-info)"
          onClick={() => setModuloActivo("reclamos")}
        />
        <KpiCard
          icon={<IconCheck />}
          label="Resueltos"
          value={loading ? "…" : (kpis.reclamosResueltos ?? 0)}
          sub="en el período"
          color="var(--color-success)"
        />
      </div>

      {/* Gráficos principales */}
      <div className="dash-mid">
        <div className="dash-section">
          <p className="dash-section__title">Evolución de reclamos</p>
          <div className="dash-section-body">
            {loading ? <Spinner /> : <ReclamosTimelineChart datos={reclamosTimeline} />}
          </div>
        </div>
        <div className="dash-section">
          <p className="dash-section__title">Por estado</p>
          <div className="dash-section-body">
            {loading ? <Spinner /> : <ReclamosDonut datos={reclamosPorEstado} />}
          </div>
        </div>
      </div>

      {/* Categorías + Recientes */}
      <div className="dash-bottom">
        <div className="dash-section">
          <p className="dash-section__title">Por categoría</p>
          <div className="dash-section-body">
            {loading ? <Spinner /> : <ReclamosPorCategoriaChart datos={reclamosPorCategoria} />}
          </div>
        </div>
        <div className="dash-section">
          <p className="dash-section__title">Últimos reclamos</p>
          <div className="dash-section-body">
            {loading ? (
              <Spinner />
            ) : reclamosRecientes.length === 0 ? (
              <div className="empty-state">
                <p className="text-muted text-sm">Sin reclamos registrados.</p>
              </div>
            ) : (
              <div className="reclamos-recientes">
                {reclamosRecientes.map((r) => {
                  const badge = ESTADO_BADGE[r.estado] ?? { label: r.estado, cls: "badge--muted" }
                  return (
                    <div key={r.numero} className="reclamo-reciente__row">
                      <div className="reclamo-reciente__left">
                        <span className="reclamo-reciente__num">#{r.numero}</span>
                        <span className="reclamo-reciente__asunto">{r.asunto}</span>
                      </div>
                      <div className="reclamo-reciente__right">
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                        <span className="reclamo-reciente__time">{tiempoRelativo(r.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── TAB ENTIDADES ────────────────────────────────────────────────────────────

function TabEntidades({ kpis, pctCompletados, turnosPorEntidad, turnosTimeline, rankingEntidades, loading, setModuloActivo }) {
  return (
    <>
      {/* KPIs */}
      <div className="dash-kpis dash-kpis--5">
        <KpiCard
          icon={<IconCalendar />}
          label="Turnos hoy"
          value={loading ? "…" : (kpis.turnosHoy ?? 0)}
          sub="del día"
          color="var(--color-info)"
          onClick={() => setModuloActivo("turnos")}
        />
        <KpiCard
          icon={<IconTotal />}
          label="Total período"
          value={loading ? "…" : (kpis.totalTurnos ?? 0)}
          sub="solicitados"
          color="var(--color-primary)"
        />
        <KpiCard
          icon={<IconCheck />}
          label="Completados"
          value={loading ? "…" : (kpis.turnosCompletados ?? 0)}
          sub={kpis.totalTurnos > 0 ? `${pctCompletados}% del total` : "en el período"}
          color="var(--color-success)"
        />
        <KpiCard
          icon={<IconAusente />}
          label="Ausentes"
          value={loading ? "…" : (kpis.turnosAusentes ?? 0)}
          sub="sin asistir"
          color="var(--color-danger)"
        />
        <KpiCard
          icon={<IconPendiente />}
          label="Pendientes"
          value={loading ? "…" : (kpis.turnosPendientes ?? 0)}
          sub="sin asignar"
          color="var(--color-warning)"
          onClick={() => setModuloActivo("turnos")}
        />
      </div>

      {/* Gráficos principales */}
      <div className="dash-mid">
        <div className="dash-section">
          <p className="dash-section__title">Turnos por entidad</p>
          <div className="dash-section-body">
            {loading ? <Spinner /> : <TurnosPorEntidadChart datos={turnosPorEntidad} />}
          </div>
        </div>
        <div className="dash-section">
          <p className="dash-section__title">Evolución de turnos</p>
          <div className="dash-section-body">
            {loading ? <Spinner /> : <TurnosTimelineChart datos={turnosTimeline} />}
          </div>
        </div>
      </div>

      {/* Ranking completo */}
      <div className="dash-section">
        <p className="dash-section__title">Ranking de entidades</p>
        <div className="dash-section-body">
          {rankingEntidades.length === 0 ? (
            <div className="empty-state">
              <p className="text-muted text-sm">Sin datos en el período.</p>
            </div>
          ) : (
            <div className="entidad-tabla">
              <div className="entidad-tabla__head">
                <span>Entidad</span>
                <span>Total</span>
                <span>Completados</span>
                <span>Ausentes</span>
              </div>
              {rankingEntidades.map((e) => (
                <div key={e.nombre} className="entidad-tabla__row">
                  <span className="entidad-tabla__nombre">{e.nombre}</span>
                  <span className="entidad-tabla__num">{e.total}</span>
                  <div className="entidad-tabla__pct">
                    <div className="pct-bar">
                      <div className="pct-bar__fill pct-bar__fill--success" style={{ width: `${e.pctCompletados}%` }} />
                    </div>
                    <span>{e.pctCompletados}%</span>
                  </div>
                  <div className="entidad-tabla__pct">
                    <div className="pct-bar">
                      <div className="pct-bar__fill pct-bar__fill--danger" style={{ width: `${e.pctAusentes}%` }} />
                    </div>
                    <span>{e.pctAusentes}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color = "var(--color-primary)", onClick }) {
  return (
    <div
      className={`kpi-card${onClick ? " kpi-card--clickable" : ""}`}
      style={{ "--kpi-accent": color }}
      onClick={onClick ?? undefined}
    >
      <div className="kpi-card__top">
        <span className="kpi-card__label">{label}</span>
        <div className="kpi-card__icon-wrap" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
      </div>
      <div className="kpi-card__value">{value ?? "—"}</div>
      {sub && <div className="kpi-card__sub">{sub}</div>}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
      <div className="spinner" />
    </div>
  )
}

// ── Íconos SVG ───────────────────────────────────────────────────────────────

function IconNuevo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function IconPendiente() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}

function IconProceso() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconTotal() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function IconAusente() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  )
}
