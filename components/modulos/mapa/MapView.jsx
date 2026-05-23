"use client"
import { useEffect, useRef, useState } from "react"
import { ICONOS_SVG } from "./icons"

const TILE_URLS = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark:  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
}


if (typeof window !== "undefined") {
  window._gisFlip = (el) => el.closest(".gis-flip").classList.toggle("flipped")
  window._gisCarousel = (btn, step) => {
    const track = btn.closest(".gis-carousel").querySelector(".gis-carousel__track")
    const imgs  = track.querySelectorAll("img")
    if (!imgs.length) return
    let idx = parseInt(track.dataset.idx || 0) + step
    if (idx < 0) idx = imgs.length - 1
    if (idx >= imgs.length) idx = 0
    track.style.transform = `translateX(-${idx * 300}px)`
    track.dataset.idx = idx
  }
}

const VIBRANT_ALTS_V = ["#3b82f6","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6","#f43f5e"]
function vibrateIfGrey(hex) {
  if (!hex || hex.length < 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b, 1)
  if (sat < 0.2) return VIBRANT_ALTS_V[(r + g + b) % VIBRANT_ALTS_V.length]
  return hex
}

function getCatColor(r) {
  return vibrateIfGrey(r.categoria?.color ?? "#6b7280")
}

function getEstadoColor(estado) {
  const map = {
    pendiente:  { bg: "#fff3cd", color: "#856404" },
    en_proceso: { bg: "#cfe2ff", color: "#084298" },
    resuelto:   { bg: "#d1e7dd", color: "#0a3622" },
    cerrado:    { bg: "#e2e3e5", color: "#41464b" },
  }
  return map[estado] ?? { bg: "#e2e3e5", color: "#41464b" }
}

function buildCircleIconHtml(color, icono, pulse = false, dim = false) {
  const svg = ICONOS_SVG[icono] ?? ICONOS_SVG["circle-help"]
  const circle = `<div style="position:relative;z-index:1;width:22px;height:22px;border-radius:50%;background:${color}cc;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></div>`
  let inner
  if (pulse) {
    const glow = `<div style="position:absolute;inset:0;border-radius:50%;background:${color};animation:map-glow 1.8s cubic-bezier(0.4,0,0.2,1) infinite;"></div>`
    inner = `<div style="position:relative;width:22px;height:22px;">${glow}${circle}</div>`
  } else {
    inner = circle
  }
  if (dim) return `<div style="opacity:0.2;">${inner}</div>`
  return inner
}

function buildPopupHTML(r) {
  const catColor  = getCatColor(r)
  const catNombre = r.categoria?.nombre ?? r.etiqueta ?? "General"
  const { bg: estadoBg, color: estadoColor } = getEstadoColor(r.estado)

  let carruselHTML
  if (r.adjuntos?.length) {
    const imgs    = r.adjuntos.map((a) => `<img src="${a.url}" alt="foto" />`).join("")
    const btnPrev = r.adjuntos.length > 1
      ? `<button class="gis-carousel__btn gis-carousel__btn--prev" onclick="event.stopPropagation();_gisCarousel(this,-1)">&#8249;</button>` : ""
    const btnNext = r.adjuntos.length > 1
      ? `<button class="gis-carousel__btn gis-carousel__btn--next" onclick="event.stopPropagation();_gisCarousel(this,1)">&#8250;</button>` : ""
    carruselHTML = `<div class="gis-carousel__track" data-idx="0">${imgs}</div>${btnPrev}${btnNext}`
  } else {
    carruselHTML = `<div class="gis-carousel__no-photo">SIN FOTO</div>`
  }

  const barrio   = r.barrio    || r.localidad || "Sin barrio"
  const direccion = r.direccion || "Sin dirección"
  const telefono  = r.contactoTelefono || "S/D"
  const operador  = r.usuario?.nombre?.toUpperCase() || "SIN ASIGNAR"
  const estado    = (r.estado || "").replace("_", " ").toUpperCase()
  const detalle   = r.texto || r.asunto || ""
  const badge     = `<div class="gis-cat-badge" style="background:${catColor}">${catNombre} — REC N° ${r.numero}</div>`

  return `
    <div class="gis-flip" onclick="_gisFlip(this)">
      <div class="gis-flip__inner">
        <div class="gis-flip__front">
          <div class="gis-carousel">${carruselHTML}</div>
          ${badge}
        </div>
        <div class="gis-flip__back">
          ${badge}
          <div class="gis-back__body">
            <div class="gis-back__barrio">${barrio}</div>
            <div class="gis-back__row">📍 ${direccion}</div>
            <div class="gis-back__row">📞 ${telefono}</div>
            <div class="gis-back__detalle"><strong>Detalle:</strong><br>${detalle}</div>
          </div>
          <div class="gis-back__footer">
            <div class="gis-back__footer-col">
              <span class="gis-back__footer-label">ESTADO</span>
              <span class="gis-estado-badge" style="background:${estadoBg};color:${estadoColor}">${estado}</span>
            </div>
            <div class="gis-back__footer-col" style="text-align:right">
              <span class="gis-back__footer-label">OPERADOR</span>
              <span class="gis-operador-badge">${operador}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

async function loadHeat(L) {
  if (L.heatLayer) return
  window.L = L
  await new Promise((resolve) => {
    if (document.querySelector('script[data-leaflet-heat]')) { resolve(); return }
    const s = document.createElement("script")
    s.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"
    s.dataset.leafletHeat = "1"
    s.onload  = resolve
    s.onerror = resolve
    document.head.appendChild(s)
  })
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

const PLAYBACK_DURATION_MS = 8000
const PLAYBACK_TICK_MS     = 80

function MapToolbar({ mapRef, heatmapOn, setHeatmapOn, theme, setTheme, hasReclamos, playbackActive, onPlay }) {
  const [expanded, setExpanded] = useState(false)
  const dark = theme === "dark"

  const c = {
    bg:     dark ? "rgba(32,32,32,0.96)"    : "rgba(255,255,255,0.96)",
    border: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.18)",
    text:   dark ? "#e5e7eb"                : "#374151",
    sep:    dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
  }

  const base = {
    position: "absolute", bottom: 10, right: 10, zIndex: 1000,
    background: c.bg, border: `1px solid ${c.border}`,
    borderRadius: 7, boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
    userSelect: "none",
  }

  function btn(active, extra = {}) {
    return {
      width: 26, height: 26, border: "none", borderRadius: 4, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, transition: "background .15s",
      background: active ? (dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)") : "transparent",
      color: c.text, ...extra,
    }
  }

  function Sep() {
    return <div style={{ width: 1, height: 16, background: c.sep, margin: "0 3px", flexShrink: 0 }} />
  }

  // SVG helpers
  function Ico({ d, w = 14, h = 14, poly, points, circle }) {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {d && <path d={d} />}
        {poly && <polyline points={poly} />}
        {points && <polygon points={points} />}
        {circle && <circle cx={circle[0]} cy={circle[1]} r={circle[2]} />}
      </svg>
    )
  }

  if (!expanded) {
    return (
      <div style={{ ...base, padding: "4px" }}>
        <button style={btn(false, { width: 28, height: 28 })} title="Mostrar controles" onClick={() => setExpanded(true)}>
          {/* sliders icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div style={{ ...base, display: "flex", alignItems: "center", gap: 3, padding: "4px 8px" }}>
      {/* Cerrar */}
      <button style={btn(false)} title="Ocultar controles" onClick={() => setExpanded(false)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <Sep />
      {/* Zoom */}
      <button style={btn(false)} title="Acercar" onClick={() => mapRef.current?.zoomIn()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/></svg>
      </button>
      <button style={btn(false)} title="Alejar" onClick={() => mapRef.current?.zoomOut()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M8 11h6"/></svg>
      </button>
      <Sep />
      {/* Heatmap */}
      <button style={btn(heatmapOn)} title="Mapa de calor" onClick={() => setHeatmapOn((v) => !v)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/><path d="M12 6v6l4 2"/></svg>
      </button>
      <Sep />
      {/* Tema */}
      <button style={btn(false)} title={dark ? "Modo claro" : "Modo oscuro"} onClick={() => setTheme(dark ? "light" : "dark")}>
        {dark
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        }
      </button>
      {/* Playback */}
      {hasReclamos && (
        <>
          <Sep />
          <button
            style={btn(false, { opacity: playbackActive ? 0.4 : 1, cursor: playbackActive ? "default" : "pointer" })}
            title="Reproducir cronología"
            onClick={playbackActive ? undefined : onPlay}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </>
      )}
    </div>
  )
}

// ── MapView ───────────────────────────────────────────────────────────────────

export default function MapView({ reclamos = [], partido = null, localidades = [], focusLocalidad = "", catFiltroSlugs = new Set() }) {
  const containerRef    = useRef(null)
  const mapRef          = useRef(null)
  const markersRef      = useRef(null)
  const tileLayerRef    = useRef(null)
  const heatLayerRef    = useRef(null)
  const localidadesRef  = useRef(null)
  const barriosRef      = useRef(null)
  const partidoRef      = useRef(null)
  const resizeObserver  = useRef(null)

  const [mapListo,  setMapListo]  = useState(false)
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [theme,     setTheme]     = useState("light")

  // Playback
  const [playbackActive, setPlaybackActive] = useState(false)
  const [playbackDate,   setPlaybackDate]   = useState(null)
  const playbackIntervalRef  = useRef(null)
  const playbackDateStartRef = useRef(0)
  const playbackDateEndRef   = useRef(0)
  const playbackWallStartRef = useRef(0)

  // ── Inicializar mapa ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return

    let cancelled = false

    import("leaflet").then((mod) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      const L = mod.default ?? mod

      delete L.Icon.Default.prototype._getIconUrl
      const _blank = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      L.Icon.Default.mergeOptions({ iconUrl: _blank, iconRetinaUrl: _blank, shadowUrl: "", iconSize: [0, 0], shadowSize: [0, 0] })

      const map = L.map(containerRef.current, {
        center: [-34.85, -58.52], zoom: 11,
        zoomControl: false, keyboard: false,
        attributionControl: false,
      })

      tileLayerRef.current = L.tileLayer(TILE_URLS.light, { maxZoom: 19 }).addTo(map)
      markersRef.current = L.layerGroup().addTo(map)

      map.on("click", () => {
        if (barriosRef.current)     { map.removeLayer(barriosRef.current); barriosRef.current = null }
        if (localidadesRef.current) localidadesRef.current.addTo(map)
        map.setView([-34.85, -58.52], 11)
      })

      mapRef.current = map
      setMapListo(true)

      requestAnimationFrame(() => { if (mapRef.current) mapRef.current.invalidateSize() })

      if (containerRef.current && typeof ResizeObserver !== "undefined") {
        resizeObserver.current = new ResizeObserver(() => {
          if (mapRef.current) mapRef.current.invalidateSize()
        })
        resizeObserver.current.observe(containerRef.current)
      }
    })

    return () => {
      cancelled = true
      if (resizeObserver.current) { resizeObserver.current.disconnect(); resizeObserver.current = null }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null; markersRef.current = null; tileLayerRef.current = null
        heatLayerRef.current = null; barriosRef.current = null
        localidadesRef.current = null; partidoRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cambio de tema ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapListo || !tileLayerRef.current || !mapRef.current) return
    import("leaflet").then((mod) => {
      const L = mod.default ?? mod
      if (!mapRef.current) return
      tileLayerRef.current.remove()
      tileLayerRef.current = L.tileLayer(TILE_URLS[theme], { maxZoom: 19 }).addTo(mapRef.current)
    })
  }, [theme, mapListo])

  // ── Capa del partido ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!partido || !mapRef.current || partidoRef.current) return
    import("leaflet").then((mod) => {
      const L = mod.default ?? mod
      if (!mapRef.current || partidoRef.current) return
      partidoRef.current = L.geoJSON(partido, {
        style: { color: "#5c6e85", weight: 2.5, fill: false, dashArray: "6,4", opacity: 0.7 },
      }).addTo(mapRef.current)
    })
  }, [partido, mapListo])

  // ── Capa de localidades ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!localidades.length || !mapRef.current || localidadesRef.current) return
    import("leaflet").then((mod) => {
      const L = mod.default ?? mod
      if (!mapRef.current || localidadesRef.current) return

      const features = localidades.flatMap((g) => g?.features ?? [g]).filter(Boolean)
      if (!features.length) return

      const capa = L.geoJSON(
        { type: "FeatureCollection", features },
        {
          style: { color: "#5c6e85", weight: 2, fillColor: "#5c6e85", fillOpacity: 0.06 },
          onEachFeature(feature, layer) {
            const nombre = feature.properties?.nombre ?? feature.properties?.name ?? ""
            layer.on("click", (e) => {
              L.DomEvent.stopPropagation(e)
              cargarBarrios(mapRef.current, L, nombre, barriosRef, localidadesRef, markersRef)
            })
          },
        }
      ).addTo(mapRef.current)

      localidadesRef.current = capa
    })
  }, [localidades, mapListo]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Foco en localidad seleccionada ─────────────────────────────────────────
  useEffect(() => {
    if (!mapListo || !mapRef.current) return
    if (!focusLocalidad) {
      mapRef.current.setView([-34.85, -58.52], 11)
      return
    }
    if (!localidadesRef.current) return
    localidadesRef.current.eachLayer((layer) => {
      const p = layer.feature?.properties ?? {}
      const nombre = p.nombre ?? p.name ?? ""
      if (nombre.toLowerCase() === focusLocalidad.toLowerCase()) {
        mapRef.current.fitBounds(layer.getBounds(), { padding: [60, 60] })
      }
    })
  }, [focusLocalidad, mapListo])

  // ── Playback ────────────────────────────────────────────────────────────────

  function startPlayback() {
    const sorted = reclamos.filter((r) => r.createdAt).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    if (!sorted.length) return
    playbackDateStartRef.current = new Date(sorted[0].createdAt).getTime()
    playbackDateEndRef.current   = new Date(sorted[sorted.length - 1].createdAt).getTime()
    playbackWallStartRef.current = Date.now()
    setPlaybackDate(new Date(sorted[0].createdAt))
    setPlaybackActive(true)
  }

  useEffect(() => {
    if (!playbackActive) return
    const id = setInterval(() => {
      const elapsed  = Date.now() - playbackWallStartRef.current
      const progress = Math.min(1, elapsed / PLAYBACK_DURATION_MS)
      const dateMs   = playbackDateStartRef.current + progress * (playbackDateEndRef.current - playbackDateStartRef.current)
      setPlaybackDate(new Date(dateMs))
      if (progress >= 1) {
        clearInterval(id)
        setPlaybackActive(false)
        setPlaybackDate(null)
      }
    }, PLAYBACK_TICK_MS)
    return () => clearInterval(id)
  }, [playbackActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Marcadores / Heatmap ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapListo || !markersRef.current) return

    import("leaflet").then(async (mod) => {
      const L = mod.default ?? mod
      if (!markersRef.current || !mapRef.current) return

      markersRef.current.clearLayers()
      if (heatLayerRef.current) { heatLayerRef.current.remove(); heatLayerRef.current = null }

      const visible = playbackActive && playbackDate
        ? reclamos.filter((r) => r.createdAt && new Date(r.createdAt) <= playbackDate)
        : reclamos
      const points = visible.filter((r) => r.lat != null && r.lng != null)

      if (heatmapOn) {
        if (!points.length) return
        await loadHeat(L)
        const heatFn = window.L?.heatLayer ?? L.heatLayer
        if (!heatFn) return
        heatLayerRef.current = heatFn(
          points.map((r) => [r.lat, r.lng, 1]),
          { radius: 28, blur: 18, maxZoom: 17, gradient: { 0.4: "#3b82f6", 0.65: "#22c55e", 1: "#ef4444" } }
        ).addTo(mapRef.current)
        return
      }

      points.forEach((r) => {
        const color = getCatColor(r)
        const icono = r.categoria?.icono ?? "circle-help"
        const pulse = !r.usuarioId
        const slug  = r.categoria?.slug ?? "sin-categoria"
        const dim   = catFiltroSlugs.size > 0 && !catFiltroSlugs.has(slug)
        const html  = buildCircleIconHtml(color, icono, pulse, dim)
        const marker = L.marker([r.lat, r.lng], {
          icon: L.divIcon({
            html, className: "",
            iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -13],
          }),
        })
        marker
          .bindPopup(buildPopupHTML(r), { className: "gis-popup", closeButton: false, maxWidth: 320 })
          .addTo(markersRef.current)
      })
    })
  }, [reclamos, heatmapOn, mapListo, catFiltroSlugs, playbackActive, playbackDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const playbackLabel = playbackDate
    ? playbackDate.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
    : null

  const playbackProgress = playbackActive && playbackDate && playbackDateEndRef.current > playbackDateStartRef.current
    ? Math.min(1, (playbackDate.getTime() - playbackDateStartRef.current) / (playbackDateEndRef.current - playbackDateStartRef.current))
    : 0

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 0 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Overlay de fecha durante el playback */}
      {playbackActive && playbackLabel && (
        <div style={{
          position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, pointerEvents: "none",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <div style={{
            background: "rgba(15,15,15,0.82)", color: "#fff",
            padding: "5px 16px", borderRadius: 20,
            fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em",
            fontFamily: "var(--font-mono, monospace)",
            backdropFilter: "blur(4px)",
          }}>
            {playbackLabel}
          </div>
          {/* Barra de progreso */}
          <div style={{ width: 160, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 99 }}>
            <div style={{
              height: "100%", width: `${playbackProgress * 100}%`,
              background: "#3b82f6", borderRadius: 99,
              transition: "width 0.1s linear",
            }} />
          </div>
        </div>
      )}

      <MapToolbar
        mapRef={mapRef}
        heatmapOn={heatmapOn} setHeatmapOn={setHeatmapOn}
        theme={theme}         setTheme={setTheme}
        hasReclamos={reclamos.length > 0}
        playbackActive={playbackActive}
        onPlay={startPlayback}
      />
    </div>
  )
}

// ── Drilldown barrios ─────────────────────────────────────────────────────────
async function cargarBarrios(map, L, nombreLocalidad, barriosRef, localidadesRef, markersRef) {
  if (!nombreLocalidad || !map) return
  try {
    const res  = await fetch(`/api/mapa?solo=barrios&loc=${encodeURIComponent(nombreLocalidad)}`)
    const data = await res.json()
    if (!data.features?.length) return

    if (localidadesRef.current) map.removeLayer(localidadesRef.current)
    if (barriosRef.current)     map.removeLayer(barriosRef.current)

    const capa = L.geoJSON(data, {
      style: { color: "#5c6e85", weight: 1.5, fillColor: "#5c6e85", fillOpacity: 0.12 },
      onEachFeature(feature, layer) {
        const nombre = feature.properties?.nombre ?? feature.properties?.name ?? ""
        if (nombre) layer.bindTooltip(nombre, { sticky: true, className: "gis-barrio-tip" })
      },
    }).addTo(map)

    barriosRef.current = capa
    map.fitBounds(capa.getBounds(), { padding: [40, 40] })
    if (markersRef.current) markersRef.current.bringToFront()
  } catch (e) {
    console.error("Error cargando barrios:", e)
  }
}
