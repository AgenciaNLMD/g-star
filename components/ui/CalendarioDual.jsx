"use client"
import { useState } from "react"

const MESES       = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const MESES_ABREV = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
const DIAS_SEM    = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"]
const MIN_DATE    = "2026-01-01"
const HOY_STR     = new Date().toISOString().slice(0, 10)

function formatFecha(str) {
  if (!str) return ""
  const [, m, d] = str.split("-")
  return `${parseInt(d)} ${MESES_ABREV[parseInt(m) - 1]}`
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function MesGrid({ year, month, effStart, effEnd, onDay, onHover, showPrev, onPrev, showNext, onNext }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow    = new Date(year, month, 1).getDay()
  const offset      = firstDow === 0 ? 6 : firstDow - 1

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="calpick__month">
      <div className="calpick__month-hd">
        {showPrev ? <button className="calpick__nav" onClick={onPrev}>‹</button> : <span />}
        <span className="calpick__month-label">{MESES[month]} {year}</span>
        {showNext ? <button className="calpick__nav" onClick={onNext}>›</button> : <span />}
      </div>
      <div className="calpick__dow">
        {DIAS_SEM.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="calpick__grid">
        {cells.map((ds, i) => {
          if (!ds) return <span key={i} className="calpick__day calpick__day--empty" />
          const disabled = ds < MIN_DATE || ds > HOY_STR
          const isStart  = !disabled && ds === effStart
          const isEnd    = !disabled && ds === effEnd && effEnd !== effStart
          const inRange  = !disabled && effStart && effEnd && ds > effStart && ds < effEnd
          let cls = "calpick__day"
          if (disabled)             cls += " calpick__day--disabled"
          else if (isStart || isEnd) cls += " calpick__day--sel"
          else if (inRange)          cls += " calpick__day--range"
          return (
            <button
              key={ds}
              className={cls}
              disabled={disabled}
              onClick={() => !disabled && onDay(ds)}
              onMouseEnter={() => !disabled && onHover(ds)}
              onMouseLeave={() => onHover(null)}
            >
              {parseInt(ds.split("-")[2])}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarioDual({ desde, hasta, onConfirm }) {
  const hoy     = new Date()
  const hoyAnio = hoy.getFullYear()
  const hoyMes  = hoy.getMonth()

  const [mesIzq, setMesIzq] = useState(() => {
    const base = desde ? new Date(desde + "T00:00:00") : hoy
    const y = Math.max(2026, Math.min(hoyAnio, base.getFullYear()))
    const m = (y === hoyAnio) ? Math.min(hoyMes, base.getMonth()) : base.getMonth()
    if (m > 0) return { year: y, month: m - 1 }
    return { year: y, month: 0 }
  })
  const [tempDesde, setTempDesde] = useState(desde || "")
  const [tempHasta, setTempHasta] = useState(hasta || "")
  const [hovered,   setHovered]   = useState(null)

  const mesDer   = mesIzq.month === 11 ? { year: mesIzq.year + 1, month: 0 } : { year: mesIzq.year, month: mesIzq.month + 1 }
  const canPrev  = !(mesIzq.year === 2026 && mesIzq.month === 0)
  const canNext  = !(mesDer.year === hoyAnio && mesDer.month >= hoyMes) && !(mesDer.year > hoyAnio)

  function prevMes()  { if (canPrev) setMesIzq((m) => m.month === 0  ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }) }
  function nextMes()  { if (canNext) setMesIzq((m) => m.month === 11 ? { year: m.year + 1, month: 0  } : { year: m.year, month: m.month + 1 }) }
  function prevAnio() { if (mesIzq.year > 2026) setMesIzq((m) => ({ ...m, year: m.year - 1 })) }
  function nextAnio() { if (mesIzq.year < hoyAnio) setMesIzq((m) => ({ ...m, year: Math.min(m.year + 1, hoyAnio) })) }

  function handleDay(ds) {
    if (!tempDesde || tempHasta) {
      setTempDesde(ds)
      setTempHasta("")
    } else {
      const [lo, hi] = ds < tempDesde ? [ds, tempDesde] : [tempDesde, ds]
      setTempDesde(lo)
      setTempHasta(hi)
      onConfirm({ desde: lo, hasta: hi })
    }
  }

  const effStart = tempDesde && !tempHasta && hovered ? [tempDesde, hovered].sort()[0] : tempDesde
  const effEnd   = tempDesde && !tempHasta && hovered ? [tempDesde, hovered].sort()[1] : tempHasta

  const rangeLabel = tempDesde && tempHasta
    ? `${formatFecha(tempDesde)}  →  ${formatFecha(tempHasta)}`
    : tempDesde ? `${formatFecha(tempDesde)}  →  ...` : "Seleccioná el inicio"

  return (
    <div className="calpick">
      <div className="calpick__year-bar">
        <button className="calpick__nav calpick__nav--year" onClick={prevAnio} title="Año anterior">‹</button>
        <span className="calpick__year-label">{mesIzq.year}</span>
        <button className="calpick__nav calpick__nav--year" onClick={nextAnio} title="Año siguiente">›</button>
      </div>
      <div className="calpick__months">
        <MesGrid year={mesIzq.year} month={mesIzq.month} effStart={effStart} effEnd={effEnd}
          onDay={handleDay} onHover={setHovered} showPrev={canPrev} onPrev={prevMes} />
        <MesGrid year={mesDer.year} month={mesDer.month} effStart={effStart} effEnd={effEnd}
          onDay={handleDay} onHover={setHovered} showNext={canNext} onNext={nextMes} />
      </div>
      <div className="calpick__footer">
        <button className="calpick__clear" onClick={() => { setTempDesde(""); setTempHasta(""); onConfirm({ desde: "", hasta: "" }) }}>
          Limpiar
        </button>
        <span className="calpick__range-label">{rangeLabel}</span>
      </div>
    </div>
  )
}
