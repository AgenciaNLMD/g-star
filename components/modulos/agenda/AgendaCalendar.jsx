"use client"
import { useState, useMemo } from "react"
import AgendaItem from "./AgendaItem"

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function startOfMonth(year, month) { return new Date(year, month, 1) }
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate() }

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function AgendaCalendar({ eventos, onNuevo, onEditar, onEliminar }) {
  const hoy = new Date()
  const [year, setYear]   = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())

  function anterior() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function siguiente() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const primerDia = startOfMonth(year, month).getDay()
  const totalDias = daysInMonth(year, month)

  const eventosPorFecha = useMemo(() => {
    const map = {}
    for (const ev of eventos) {
      const key = ev.fecha?.slice(0, 10)
      if (!key) continue
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [eventos])

  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= totalDias; d++) celdas.push(d)

  const todayISO = toISO(hoy)

  return (
    <div className="agenda-calendar">
      {/* Navegación */}
      <div className="agenda-calendar__nav">
        <button className="btn btn--ghost btn--sm" onClick={anterior}>‹</button>
        <span className="agenda-calendar__titulo">{MESES[month]} {year}</span>
        <button className="btn btn--ghost btn--sm" onClick={siguiente}>›</button>
      </div>

      {/* Cabecera días */}
      <div className="agenda-calendar__grid">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="agenda-calendar__dia-label">{d}</div>
        ))}

        {/* Celdas */}
        {celdas.map((dia, idx) => {
          if (dia === null) return <div key={`empty-${idx}`} className="agenda-calendar__celda agenda-calendar__celda--vacia" />
          const isoFecha = `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
          const esHoy = isoFecha === todayISO
          const evsDia = eventosPorFecha[isoFecha] ?? []

          return (
            <div
              key={isoFecha}
              className={`agenda-calendar__celda${esHoy ? " agenda-calendar__celda--hoy" : ""}`}
              onClick={() => onNuevo(isoFecha)}
            >
              <div className="agenda-calendar__num">{dia}</div>
              <div className="agenda-calendar__eventos">
                {evsDia.slice(0, 3).map((ev) => (
                  <AgendaItem
                    key={ev.id}
                    evento={ev}
                    onEditar={onEditar}
                    onEliminar={onEliminar}
                    compacto
                  />
                ))}
                {evsDia.length > 3 && (
                  <span className="text-xs text-muted">+{evsDia.length - 3} más</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
