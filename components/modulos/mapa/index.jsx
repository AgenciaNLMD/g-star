"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import { api } from "@/lib/api-client"
import { useTopbarSlot } from "@/lib/use-topbar-slot"
import CalendarioDual from "@/components/ui/CalendarioDual"
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "0.75rem" }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <p className="text-sm t-sub">Cargando mapa…</p>
    </div>
  ),
})

const LOCALIDADES = ["Aeropuerto", "Canning", "Ezeiza", "La Unión", "Spegazzini", "Suárez"]

// Colores alternativos para categorías con saturación baja (grises)
const VIBRANT_ALTS = ["#3b82f6","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6","#f43f5e"]
function vibrateIfGrey(hex) {
  if (!hex || hex.length < 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b, 1)
  if (sat < 0.2) return VIBRANT_ALTS[(r + g + b) % VIBRANT_ALTS.length]
  return hex
}

const ESTADOS = [
  { key: "pendiente",  label: "Pendiente", color: "#f59e0b" },
  { key: "en_proceso", label: "En curso",  color: "#3b82f6" },
  { key: "resuelto",   label: "Resuelto",  color: "#22c55e" },
  { key: "cerrado",    label: "Cerrado",   color: "#6b7280" },
]

// ── Topbar slot ───────────────────────────────────────────────────────────────


function IconBuilding() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

function MapaTopbarSlot({ filtros, onFiltros, localidades, countPorLocalidad, hayFiltros, limpiarFiltros }) {
  const [locExpanded, setLocExpanded] = useState(false)
  const locRef = useRef(null)

  useEffect(() => {
    if (!locExpanded) return
    function onDown(e) { if (locRef.current && !locRef.current.contains(e.target)) setLocExpanded(false) }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [locExpanded])

  function toggleLoc(loc) {
    onFiltros((f) => {
      const next = f.localidades.includes(loc)
        ? f.localidades.filter((l) => l !== loc)
        : [...f.localidades, loc]
      return { ...f, localidades: next, barrio: "" }
    })
  }

  const selectedLocs = filtros.localidades
  const hasSelection = selectedLocs.length > 0

  return (
    <>
      <div className="tb-breadcrumb">
        <span>Municipio</span>
        <span className="tb-breadcrumb__sep">›</span>
        <span className="tb-breadcrumb__item">Mapa de reclamos</span>
      </div>

      <div className="tb-sep" />

      {/* Filtro de localidades — contenedor gris siempre visible */}
      <div ref={locRef} className={`tb-loc-pills${locExpanded ? " tb-loc-pills--open" : ""}`}>
        <button
          className={`tb-loc-trigger${hasSelection ? " tb-loc-trigger--sel" : ""}`}
          onClick={() => setLocExpanded((v) => !v)}
        >
          <IconBuilding />
          <span>Localidades</span>
          {hasSelection && <span className="tb-loc-count">{selectedLocs.length}</span>}
          <span className="tb-loc-pipe">|</span>
        </button>

        <div className="tb-loc-tabs-wrap">
          {localidades.map((loc) => {
            const isActive = selectedLocs.includes(loc)
            return (
              <button
                key={loc}
                className={`tb-loc-tab${isActive ? " tb-loc-tab--active" : ""}`}
                onClick={() => toggleLoc(loc)}
              >
                {loc}
              </button>
            )
          })}
        </div>
      </div>

      {/* Limpiar — círculo rojo */}
      {hayFiltros && (
        <button
          className="tb-clear-btn"
          onClick={limpiarFiltros}
          title="Limpiar filtros"
        >
          ✕
        </button>
      )}
    </>
  )
}

function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

// ── Componentes UI ────────────────────────────────────────────────────────────

function ChevronBtn({ open, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer", padding: "0 2px",
      color: "var(--color-text-subtle)", fontSize: 10, lineHeight: 1,
      display: "flex", alignItems: "center", ...style,
    }}>
      {open ? "▲" : "▼"}
    </button>
  )
}

function SecHeader({ label, open, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: open ? "0.5rem" : 0, cursor: "pointer" }}>
      <p className="t-label" style={{ margin: 0, flexShrink: 0 }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
      <ChevronBtn open={open} />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ModuloMapa() {

  // Estado general
  const [capas,    setCapas]    = useState({ partido: null, localidades: [] })
  const [reclamos, setReclamos] = useState([])
  const [loading,  setLoading]  = useState(true)

  // Filtros
  const [filtros, setFiltros] = useState({
    localidades: [], barrio: "", estado: "", plazo: "", fechaDesde: "", fechaHasta: "",
  })

  // Filtro de categorías en el mapa — Set de slugs seleccionados (vacío = todos activos)
  const [catFiltro, setCatFiltro] = useState(new Set())

  // UI
  const [categoriasMaster, setCategoriasMaster] = useState([])

  // UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [donutExpanded,    setDonutExpanded]     = useState(true)
  const [barExpanded,      setBarExpanded]       = useState(true)
  const [barMostrarPct,    setBarMostrarPct]     = useState(true)
  const [calOpen,          setCalOpen]           = useState(false)

  // Refs gráficas
  const donutRef   = useRef(null)
  const donutChart = useRef(null)
  const calRef     = useRef(null)

  // Click-outside para el calendario del mapa
  useEffect(() => {
    if (!calOpen) return
    function onDown(e) { if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false) }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [calOpen])

  // ── Carga de datos ──────────────────────────────────────────────────────────

  useEffect(() => {
    api.get("/api/mapa?solo=capas")
      .then((d) => setCapas({ partido: d.partido, localidades: d.localidades ?? [] }))
      .catch(console.error)
  }, [])

  useEffect(() => {
    api.get("/api/mapa?solo=categorias")
      .then((d) => setCategoriasMaster(d.categorias ?? []))
      .catch(console.error)
  }, [])

  const fetchReclamos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get("/api/mapa")
      setReclamos(data.reclamos ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchReclamos() }, [fetchReclamos])

  // ── Datos geográficos derivados ─────────────────────────────────────────────

  const barriosPorLocalidad = useMemo(() => {
    const map = {}
    reclamos.forEach((r) => {
      if (!r.localidad) return
      if (!map[r.localidad]) map[r.localidad] = []
      if (r.barrio && !map[r.localidad].includes(r.barrio)) map[r.localidad].push(r.barrio)
    })
    Object.keys(map).forEach((k) => map[k].sort())
    return map
  }, [reclamos])

  const countPorLocalidad = useMemo(() => {
    const map = {}
    reclamos.forEach((r) => { if (r.localidad) map[r.localidad] = (map[r.localidad] || 0) + 1 })
    return map
  }, [reclamos])

  const countPorBarrio = useMemo(() => {
    const map = {}
    reclamos.forEach((r) => {
      if (r.barrio && r.localidad) {
        const k = `${r.localidad}::${r.barrio}`
        map[k] = (map[k] || 0) + 1
      }
    })
    return map
  }, [reclamos])

  // ── Pipeline de filtrado ────────────────────────────────────────────────────

  // 1. Filtros de tiempo/lugar/estado (sin catFiltro)
  const reclamosBase = useMemo(() => {
    let list = filtros.localidades.length > 0 ? reclamos.filter((r) => filtros.localidades.includes(r.localidad)) : reclamos
    if (filtros.barrio) list = list.filter((r) => r.barrio === filtros.barrio)
    if (filtros.estado) list = list.filter((r) => r.estado === filtros.estado)
    if (filtros.plazo) {
      const now = new Date()
      const desde = {
        hoy:  new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        "7d": new Date(now - 7  * 86400000),
        "30d":new Date(now - 30 * 86400000),
        año:  new Date(now.getFullYear(), 0, 1),
      }[filtros.plazo]
      if (desde) list = list.filter((r) => new Date(r.createdAt) >= desde)
    } else {
      if (filtros.fechaDesde) list = list.filter((r) => new Date(r.createdAt) >= new Date(filtros.fechaDesde))
      if (filtros.fechaHasta) list = list.filter((r) => new Date(r.createdAt) <= new Date(filtros.fechaHasta + "T23:59:59"))
    }
    return list
  }, [reclamos, filtros.localidades, filtros.barrio, filtros.estado, filtros.plazo, filtros.fechaDesde, filtros.fechaHasta])

  // 2. Sin filtro de categoría sobre los datos — la selección solo afecta la visualización (opacidad)
  const reclamosVisible = reclamosBase

  // ── Estadísticas (todas sobre reclamosVisible) ──────────────────────────────

  const total     = reclamosVisible.length
  const resueltos = reclamosVisible.filter((r) => r.estado === "resuelto" || r.estado === "cerrado").length
  const pendientes = total - resueltos

  // Conteo por categoría sobre los reclamos visibles; incluye todas las 17 categorías (0 si no hay)
  const conteoCat = useMemo(() => {
    const countMap    = new Map()
    const resolvedMap = new Map()
    reclamosVisible.forEach((r) => {
      const slug = r.categoria?.slug ?? "sin-categoria"
      countMap.set(slug, (countMap.get(slug) || 0) + 1)
      if (r.estado === "resuelto" || r.estado === "cerrado")
        resolvedMap.set(slug, (resolvedMap.get(slug) || 0) + 1)
    })
    return categoriasMaster
      .map((cat) => ({
        ...cat,
        total:     countMap.get(cat.slug)    || 0,
        resueltos: resolvedMap.get(cat.slug) || 0,
      }))
      // primero las que tienen reclamos (alfabético), luego las vacías (alfabético)
      .sort((a, b) => {
        const g = (a.total > 0 ? 0 : 1) - (b.total > 0 ? 0 : 1)
        if (g !== 0) return g
        return a.nombre.localeCompare(b.nombre, "es")
      })
  }, [categoriasMaster, reclamosVisible])

  const conteoPorEstado = useMemo(() =>
    ESTADOS.map((e) => ({ ...e, count: reclamosVisible.filter((r) => r.estado === e.key).length })),
    [reclamosVisible]
  )

  const maxCat = useMemo(() => Math.max(...conteoCat.map((c) => c.total), 1), [conteoCat])

  // ── Click en categoría (filtro de mapa) ────────────────────────────────────

  function handleCatClick(slug) {
    setCatFiltro((prev) => {
      if (prev.size === 0) return new Set([slug])
      if (!prev.has(slug)) { const n = new Set(prev); n.add(slug); return n }
      return new Set()
    })
  }

  function isCatActive(slug) {
    return catFiltro.size === 0 || catFiltro.has(slug)
  }

  // ── Otros ──────────────────────────────────────────────────────────────────

  function limpiarFiltros() {
    setFiltros({ localidades: [], barrio: "", estado: "", plazo: "", fechaDesde: "", fechaHasta: "" })
    setCatFiltro(new Set())
  }

  const hayFiltros = filtros.localidades.length > 0 || filtros.barrio || filtros.estado || filtros.plazo || filtros.fechaDesde || filtros.fechaHasta || catFiltro.size > 0

  const focusLocalidad = filtros.barrio ? "" : (filtros.localidades.length === 1 ? filtros.localidades[0] : "")

  // ── Chart.js — dona ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!donutRef.current || !donutExpanded) return

    import("chart.js/auto").then((mod) => {
      const Chart = mod.default
      if (donutChart.current) { donutChart.current.destroy(); donutChart.current = null }

      donutChart.current = new Chart(donutRef.current, {
        type: "doughnut",
        data: {
          labels: conteoPorEstado.map((e) => e.label),
          datasets: [{
            data: conteoPorEstado.map((e) => e.count),
            backgroundColor: conteoPorEstado.map((e) => e.color),
            borderWidth: 2, borderColor: "#fff",
          }],
        },
        options: {
          maintainAspectRatio: false, cutout: "62%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0
                  return ` ${ctx.raw} (${pct}%)`
                },
              },
            },
          },
        },
      })
    })

    return () => {
      if (donutChart.current) { donutChart.current.destroy(); donutChart.current = null }
    }
  }, [conteoPorEstado, donutExpanded, total]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Topbar ───────────────────────────────────────────────────────────────────

  const hayFiltrosTopbar = !!(filtros.localidades.length > 0 || filtros.barrio || filtros.estado || filtros.fechaDesde || filtros.fechaHasta)

  useTopbarSlot(
    <MapaTopbarSlot
      filtros={filtros}
      onFiltros={setFiltros}
      localidades={LOCALIDADES}
      countPorLocalidad={countPorLocalidad}
      hayFiltros={hayFiltrosTopbar}
      limpiarFiltros={limpiarFiltros}
    />,
    [filtros.localidades, filtros.barrio, filtros.estado, countPorLocalidad, hayFiltrosTopbar]
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="mapa-layout">

      {/* ── Sidebar ── */}
      <aside
        className="mapa-sidebar"
        style={sidebarCollapsed ? { width: 0, padding: 0, overflow: "hidden", borderRight: "none" } : {}}
      >

        {/* KPIs */}
        <div style={{ display: "flex", background: "#fff", border: "1px solid var(--color-border)", padding: "0.75rem 0.25rem", justifyContent: "space-around", alignItems: "center", marginBottom: "0.75rem" }}>
          {[
            { label: "TOTAL",      val: total,      color: "var(--color-text)" },
            { label: "PENDIENTES", val: pendientes,  color: "var(--color-danger)" },
            { label: "RESUELTOS",  val: resueltos,   color: "var(--color-success)" },
          ].map((kpi, i) => (
            <div key={kpi.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              {i > 0 && <div style={{ width: 1, height: 32, background: "var(--color-border)", flexShrink: 0 }} />}
              <div style={{ textAlign: "center", flex: 1 }}>
                <span style={{ display: "block", fontSize: "0.5625rem", fontWeight: 700, color: "var(--color-text-subtle)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>{kpi.label}</span>
                <span style={{ display: "block", fontSize: "1.375rem", fontWeight: 800, color: kpi.color, lineHeight: 1.2 }}>{loading ? "…" : kpi.val}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Dona — por estado ── */}
        {total > 0 && (
          <div style={{ marginBottom: "0.875rem" }}>
            <SecHeader label="ESTADO" open={donutExpanded} onToggle={() => setDonutExpanded((v) => !v)} />

            {donutExpanded && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ width: 86, height: 86, flexShrink: 0 }}>
                  <canvas ref={donutRef} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  {conteoPorEstado.map((e) => {
                    const pct      = total > 0 ? ((e.count / total) * 100).toFixed(0) : 0
                    const selected = filtros.estado === e.key
                    return (
                      <div key={e.key}
                        onClick={() => setFiltros((f) => ({ ...f, estado: f.estado === e.key ? "" : e.key }))}
                        style={{
                          display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                          borderRadius: 3, padding: "2px 3px", margin: "0 -3px",
                          background: selected ? e.color + "18" : "transparent",
                          outline: selected ? `1px solid ${e.color}55` : "none",
                          transition: "background 0.15s",
                        }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: e.color, flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontSize: "0.67rem", color: selected ? "var(--color-text)" : "var(--color-text-2)", flex: 1, fontWeight: selected ? 700 : 400 }}>{e.label}</span>
                        <span style={{ fontSize: "0.67rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{e.count}</span>
                        <span style={{ fontSize: "0.62rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", minWidth: 28, textAlign: "right" }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Barras horizontales — por categoría ── */}
        {conteoCat.length > 0 && (
          <div style={{ marginBottom: "0.875rem" }}>
            <SecHeader label="CATEGORÍA" open={barExpanded} onToggle={() => setBarExpanded((v) => !v)} />

            {barExpanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {conteoCat.map((cat) => {
                  const pct   = total > 0 ? (cat.total / total * 100) : 0
                  const barW  = (cat.total / maxCat) * 100
                  const activa = isCatActive(cat.slug)
                  return (
                    <div
                      key={cat.slug}
                      onClick={() => handleCatClick(cat.slug)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                        opacity: activa ? 1 : 0.35, transition: "opacity 0.15s",
                      }}
                    >
                      {/* Barra con nombre superpuesto */}
                      <div style={{ flex: 1, height: 18, background: "var(--color-border)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                        <div style={{
                          height: "100%", width: `${barW}%`,
                          background: vibrateIfGrey(cat.color), borderRadius: 2,
                          transition: "width 0.3s ease",
                        }} />
                        <span style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center",
                          paddingLeft: 6,
                          fontSize: "0.62rem", fontWeight: 600,
                          color: "#4b5563",
                          textShadow: "0 0 4px #fff, 0 0 4px #fff",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {cat.nombre}
                        </span>
                      </div>

                      {/* Badge % / cantidad */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setBarMostrarPct((v) => !v) }}
                        title={barMostrarPct ? "Ver cantidad" : "Ver porcentaje"}
                        style={{
                          flexShrink: 0, minWidth: 36, padding: "1px 5px",
                          background: "#e5e7eb", borderRadius: 999,
                          border: "none", cursor: "pointer",
                          fontSize: "0.65rem", fontWeight: 600, color: "#4b5563",
                          textAlign: "center", lineHeight: 1.6,
                        }}
                      >
                        {barMostrarPct ? `${pct.toFixed(0)}%` : cat.total}
                      </button>
                    </div>
                  )
                })}

                {/* Indicador de filtro activo */}
                {catFiltro.size > 0 && (
                  <button
                    onClick={() => setCatFiltro(new Set())}
                    style={{
                      marginTop: 4, fontSize: "0.67rem", color: "var(--color-text-muted)",
                      background: "none", border: "none", cursor: "pointer", textAlign: "left",
                      padding: 0, textDecoration: "underline",
                    }}
                  >
                    {`${catFiltro.size} categoría${catFiltro.size > 1 ? "s" : ""} seleccionada${catFiltro.size > 1 ? "s" : ""} — quitar filtro`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </aside>

      {/* ── Mapa ── */}
      <div className="mapa-container">
        {/* Toggle semi-círculo — pegado al borde del panel lateral */}
        <button
          className="mapa-sidebar-toggle"
          onClick={() => setSidebarCollapsed((v) => !v)}
          title={sidebarCollapsed ? "Expandir panel" : "Colapsar panel"}
        >
          {sidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>

        {/* Calendario — flotante justo encima del toolbar bottom-right */}
        <div ref={calRef} style={{ position: "absolute", bottom: 52, right: 10, zIndex: 1000 }}>
          <button
            className={`mapa-ctrl-btn${(filtros.fechaDesde || filtros.fechaHasta) ? " mapa-ctrl-btn--active" : ""}`}
            onClick={() => setCalOpen((v) => !v)}
            title={filtros.fechaDesde && filtros.fechaHasta
              ? `${formatFecha(filtros.fechaDesde)} → ${formatFecha(filtros.fechaHasta)}`
              : "Filtrar por período"}
          >
            <IconCalendar />
            {(filtros.fechaDesde || filtros.fechaHasta) && <span className="mapa-ctrl-dot" />}
          </button>
          {calOpen && (
            <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0 }}>
              <CalendarioDual
                desde={filtros.fechaDesde}
                hasta={filtros.fechaHasta}
                onConfirm={({ desde, hasta }) => {
                  setFiltros((f) => ({ ...f, fechaDesde: desde, fechaHasta: hasta, plazo: "" }))
                  if ((desde && hasta) || (!desde && !hasta)) setCalOpen(false)
                }}
              />
            </div>
          )}
        </div>

        <MapView
          reclamos={reclamosVisible}
          partido={capas.partido}
          localidades={capas.localidades}
          focusLocalidad={focusLocalidad}
          catFiltroSlugs={catFiltro}
        />
      </div>
    </div>
  )
}
