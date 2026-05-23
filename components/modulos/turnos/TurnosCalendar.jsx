"use client"
import { useState, useMemo } from "react"

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLunes(fecha) {
  const d = new Date(fecha)
  const dia = d.getDay() || 7
  d.setDate(d.getDate() - dia + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDias(fecha, n) {
  const d = new Date(fecha)
  d.setDate(d.getDate() + n)
  return d
}

function fmtISO(d) { return d.toISOString().slice(0, 10) }

function generarHoras(horaInicio, horaFin, intervaloMinutos) {
  const list = []
  const [hI, mI] = (horaInicio ?? "08:00").split(":").map(Number)
  const [hF, mF] = (horaFin    ?? "17:00").split(":").map(Number)
  let min = hI * 60 + mI
  const fin = hF * 60 + mF
  while (min < fin) {
    list.push({
      label:  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`,
      esHora: min % 60 === 0,
    })
    min += intervaloMinutos ?? 30
  }
  return list
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const SLOT_H = 52

function addMinutos(horaLabel, minutos) {
  const [h, m] = horaLabel.split(":").map(Number)
  const t = h * 60 + m + minutos
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
}

const APPT_CLS = {
  asignado:   "gcal-appt--asignado",
  confirmado: "gcal-appt--confirmado",
  cancelado:  "gcal-appt--cancelado",
  completado: "gcal-appt--completado",
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function TurnosCalendar({
  entidad,
  turnosAsignados  = [],
  turnosPendientes = [],
  feriados         = [],
  onSelectTurno,
  onAsignar,
  onQuitar,
}) {
  const [lunes, setLunes]           = useState(() => getLunes(new Date()))
  const [dropTarget, setDropTarget] = useState(null)

  const hoy   = new Date(); hoy.setHours(0, 0, 0, 0)
  const ahora = new Date()

  const diasHabiles = Array.isArray(entidad?.diasHabiles)
    ? entidad.diasHabiles
    : (entidad?.diasHabiles ?? "1,2,3,4,5").toString().split(",").map(Number)

  const horas = generarHoras(entidad?.horaInicio, entidad?.horaFin, entidad?.intervaloMinutos)

  const todosLosDias = Array.from({ length: 7 }, (_, i) => {
    const d = addDias(lunes, i)
    return {
      d, fechaStr: fmtISO(d), label: DIAS_SEMANA[i],
      esHoy:     fmtISO(d) === fmtISO(hoy),
      esActivo:  diasHabiles.includes(i + 1),
      esFeriado: feriados.includes(fmtISO(d)),
    }
  }).filter((d) => d.esActivo)

  const dias = todosLosDias

  const asignadosIdx = {}
  turnosAsignados.forEach((t) => {
    const key = `${t.fechaAsignada?.slice(0, 10)}_${t.horaAsignada}`
    asignadosIdx[key] = t
  })

  const countPerDay = useMemo(() => {
    const m = {}
    turnosAsignados.forEach((t) => {
      const d = t.fechaAsignada?.slice(0, 10)
      if (d) m[d] = (m[d] ?? 0) + 1
    })
    return m
  }, [turnosAsignados])

  const [hI] = (entidad?.horaInicio ?? "08:00").split(":").map(Number)
  const minDesdeInicio = (ahora.getHours() - hI) * 60 + ahora.getMinutes()
  const nowPx = (minDesdeInicio / (entidad?.intervaloMinutos ?? 30)) * SLOT_H
  const mostrarNow = todosLosDias.some((d) => d.esHoy)

  function navear(dir) {
    setLunes((l) => addDias(l, dir * 7))
  }

  function onDragOver(e, key) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropTarget(key)
  }
  function onDragLeave() { setDropTarget(null) }
  function onDrop(e, fechaStr, hora) {
    e.preventDefault()
    const id = e.dataTransfer.getData("turnoId")
    setDropTarget(null)
    if (id) onAsignar(id, fechaStr, hora)
  }

  const rangeDesde = lunes.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
  const rangeHasta = addDias(lunes, 6).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
  const rangeAnio  = addDias(lunes, 6).getFullYear()

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="gcal-wrap" style={{ flexDirection: "column" }}>

      {/* Topbar */}
      <div className="gcal-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="gcal-nav-btn" onClick={() => navear(-1)}>‹</button>
          <button className="gcal-nav-btn" onClick={() => navear(1)}>›</button>
          <button className="gcal-today-btn" onClick={() => setLunes(getLunes(new Date()))}>Hoy</button>
          <span className="gcal-range">
            {rangeDesde} — {rangeHasta}
            <span className="gcal-range-year"> / {rangeAnio}</span>
          </span>
        </div>

      </div>

      {/* Grid */}
      <div className="gcal-grid-wrap">
        <div className="gcal-grid" style={{ gridTemplateColumns: `52px repeat(${dias.length}, 1fr)` }}>

          <div className="gcal-corner" />

          {/* Cabeceras de días */}
          {dias.map((d) => {
            const cnt = countPerDay[d.fechaStr] ?? 0
            return (
              <div
                key={d.fechaStr}
                className={`gcal-day-header${d.esHoy ? " gcal-day-header--hoy" : ""}${d.esFeriado ? " gcal-day-header--feriado" : ""}`}
              >
                <span className="gcal-day-label">{d.label}{d.esHoy ? " · HOY" : ""}</span>
                <span className={`gcal-day-num${d.esHoy ? " gcal-day-num--hoy" : ""}`}>{d.d.getDate()}</span>
                {d.esFeriado && <span className="gcal-feriado-dot" title="Feriado" />}
                {cnt > 0 && <span className="gcal-day-cnt">{cnt} turno{cnt !== 1 ? "s" : ""}</span>}
              </div>
            )
          })}

          {/* Slots */}
          {horas.map((slot, si) => (
            <>
              <div key={`lbl-${slot.label}`} className="gcal-time-label">
                {slot.esHora ? slot.label : ""}
              </div>

              {dias.map((d) => {
                const key     = `${d.fechaStr}_${slot.label}`
                const turno   = asignadosIdx[key]
                const bloq    = d.esFeriado
                const isTarget  = dropTarget === key
                const canDrop   = !bloq && !turno && turnosPendientes.length > 0
                const esHoySlot = d.esHoy && mostrarNow && si === Math.floor(nowPx / SLOT_H)

                return (
                  <div
                    key={key}
                    className={`gcal-cell${bloq ? " gcal-cell--bloqueado" : ""}${isTarget ? " gcal-cell--drop" : ""}${slot.esHora ? " gcal-cell--hora" : ""}`}
                    style={{ height: SLOT_H, position: "relative" }}
                    onDragOver={canDrop ? (e) => onDragOver(e, key) : undefined}
                    onDragLeave={canDrop ? onDragLeave : undefined}
                    onDrop={canDrop ? (e) => onDrop(e, d.fechaStr, slot.label) : undefined}
                  >
                    {turno && (
                      <div
                        className={`gcal-appt ${APPT_CLS[turno.estado] ?? "gcal-appt--asignado"}`}
                        onClick={() => onSelectTurno(turno.id)}
                      >
                        <div className="gcal-appt__time">
                          {slot.label} – {addMinutos(slot.label, entidad?.intervaloMinutos ?? 30)}
                        </div>
                        <div className="gcal-appt__nombre">{turno.nombre}</div>
                        <div className="gcal-appt__meta">{turno.tramite}</div>
                        {onQuitar && (
                          <button
                            className="gcal-appt__quit"
                            onClick={(e) => { e.stopPropagation(); onQuitar(turno.id) }}
                            title="Quitar asignación"
                          >✕</button>
                        )}
                      </div>
                    )}

                    {esHoySlot && (
                      <div className="gcal-now-line" style={{ top: nowPx % SLOT_H }} />
                    )}

                    {isTarget && !turno && (
                      <div className="gcal-drop-ghost">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Soltar aquí
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="gcal-legend">
        <div className="gcal-legend-item">
          <span className="gcal-legend-dot" style={{ background: "#166534" }} /> Confirmado
        </div>
        <div className="gcal-legend-item">
          <span className="gcal-legend-dot" style={{ background: "#1e40af" }} /> Asignado
        </div>
        <div className="gcal-legend-item">
          <span className="gcal-legend-dot" style={{ background: "#EF4444" }} /> Cancelado
        </div>
        <div className="gcal-legend-item">
          <span className="gcal-legend-dot" style={{ background: "#a1a1aa" }} /> Completado
        </div>
        <span className="gcal-legend-info">
          {entidad?.nombre}{entidad?.localidad ? ` · ${entidad.localidad}` : ""}
          {" · "}{turnosAsignados.length} asignado{turnosAsignados.length !== 1 ? "s" : ""}
          {turnosPendientes.length > 0 && ` · ${turnosPendientes.length} pendiente${turnosPendientes.length !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  )
}
