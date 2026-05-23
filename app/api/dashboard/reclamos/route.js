import { NextResponse } from "next/server"
import { auth }          from "@/lib/auth"
import { prisma }        from "@/lib/prisma"

// Sin filtro de período — siempre devuelve todos los registros históricos

export async function GET(req) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const now    = new Date()
  const hoyIni = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const hoyFin = new Date(hoyIni.getTime() + 86_400_000)

  const ABIERTOS = ["entrante", "pendiente", "tomado", "elevado", "en_proceso"]
  const CERRADOS = ["resuelto", "cerrado"]

  const [reclamos, totalHoy] = await Promise.all([
    prisma.reclamo.findMany({
      where: {},  // sin filtro — todos los registros históricos
      select: {
        id:        true,
        estado:    true,
        canal:     true,
        localidad: true,
        createdAt: true,
        updatedAt: true,
        tomadoAt:  true,
        elevadoAt: true,
        categoria: { select: { nombre: true, color: true } },
        equipo:    { select: { id: true, nombre: true, color: true } },
      },
    }),
    prisma.reclamo.count({ where: { createdAt: { gte: hoyIni, lt: hoyFin } } }),
  ])

  const total    = reclamos.length
  const cerrados = reclamos.filter(r => CERRADOS.includes(r.estado)).length
  const abiertos = reclamos.filter(r => ABIERTOS.includes(r.estado)).length
  const tasa     = total > 0 ? Math.round(cerrados / total * 100) : 0

  // ── Sparkline adaptativa: cubre todo el rango histórico ─────────
  // Detecta el reclamo más antiguo y divide en 20 puntos equidistantes
  const fechas    = reclamos.map(r => new Date(r.createdAt).getTime())
  const minFecha  = fechas.length > 0 ? Math.min(...fechas) : now.getTime() - 86_400_000 * 30
  const rangMs    = now.getTime() - minFecha
  const PUNTOS    = 20
  const pasoMs    = Math.max(rangMs / PUNTOS, 86_400_000) // mínimo 1 día por punto

  const sparkline = Array.from({ length: PUNTOS }, (_, i) => {
    const desde = new Date(minFecha + i * pasoMs)
    const hasta = new Date(minFecha + (i + 1) * pasoMs)
    return reclamos.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return t >= desde.getTime() && t < hasta.getTime()
    }).length
  })

  // ── Timeline abiertos vs cerrados (mismo rango adaptativo) ──────
  const timeline = Array.from({ length: PUNTOS }, (_, i) => {
    const desde = new Date(minFecha + i * pasoMs)
    const hasta = new Date(minFecha + (i + 1) * pasoMs)
    const tramo = reclamos.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return t >= desde.getTime() && t < hasta.getTime()
    })
    return {
      ab: tramo.filter(r => ABIERTOS.includes(r.estado)).length,
      ce: tramo.filter(r => CERRADOS.includes(r.estado)).length,
    }
  })

  // ── Canales ──────────────────────────────────────────────────────
  const canales = reclamos.reduce((a, r) => {
    const c = r.canal || "presencial"
    a[c] = (a[c] ?? 0) + 1
    return a
  }, {})

  // ── Categorías ───────────────────────────────────────────────────
  const catRaw = {}
  for (const r of reclamos) {
    const k = r.categoria?.nombre ?? "Sin categoría"
    if (!catRaw[k]) catRaw[k] = { total: 0, color: r.categoria?.color ?? "#6b7280" }
    catRaw[k].total++
  }
  const categorias = Object.entries(catRaw)
    .map(([nombre, d]) => ({
      nombre, total: d.total, color: d.color,
      pct: total > 0 ? Math.round(d.total / total * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // ── Equipos ──────────────────────────────────────────────────────
  const eqRaw = {}
  for (const r of reclamos) {
    if (!r.equipo) continue
    const k = r.equipo.nombre
    if (!eqRaw[k]) eqRaw[k] = { color: r.equipo.color ?? "#6b7280", tomados: 0, derivados: 0, cerrados: 0 }
    eqRaw[k].tomados++
    if (r.elevadoAt)                      eqRaw[k].derivados++
    if (CERRADOS.includes(r.estado))      eqRaw[k].cerrados++
  }
  const equipos = Object.entries(eqRaw)
    .map(([nombre, d]) => ({
      nombre, color: d.color,
      tomados: d.tomados, derivados: d.derivados, cerrados: d.cerrados,
      eficiencia: d.tomados > 0 ? Math.round(d.derivados / d.tomados * 100) : 0,
    }))
    .sort((a, b) => b.tomados - a.tomados)

  // ── Tiempos por equipo (hrs promedio tomadoAt→elevadoAt) ─────────
  const tRaw = {}
  for (const r of reclamos) {
    if (!r.equipo || !r.tomadoAt || !r.elevadoAt) continue
    const k = r.equipo.nombre
    if (!tRaw[k]) tRaw[k] = { color: r.equipo.color ?? "#6b7280", suma: 0, cnt: 0 }
    tRaw[k].suma += (new Date(r.elevadoAt) - new Date(r.tomadoAt)) / 3_600_000
    tRaw[k].cnt++
  }
  const tiempos = Object.entries(tRaw)
    .map(([nombre, d]) => ({
      nombre, color: d.color,
      horas: d.cnt > 0 ? +(d.suma / d.cnt).toFixed(1) : 0,
    }))
    .sort((a, b) => a.horas - b.horas)

  // ── Localidades ──────────────────────────────────────────────────
  const locRaw = {}
  for (const r of reclamos) {
    const k = r.localidad || "Sin localidad"
    if (!locRaw[k]) locRaw[k] = { ingresados: 0, pendientes: 0, resueltos: 0 }
    locRaw[k].ingresados++
    if (ABIERTOS.includes(r.estado)) locRaw[k].pendientes++
    if (CERRADOS.includes(r.estado)) locRaw[k].resueltos++
  }
  const localidades = Object.entries(locRaw)
    .map(([nombre, d]) => ({ nombre, ...d }))
    .sort((a, b) => b.ingresados - a.ingresados)
    .slice(0, 7)

  // ── Análisis por categoría ────────────────────────────────────────
  const anaRaw = {}
  for (const r of reclamos) {
    const k = r.categoria?.nombre ?? "Sin categoría"
    if (!anaRaw[k]) anaRaw[k] = { color: r.categoria?.color ?? "#6b7280", ingresados: 0, resueltos: 0, sumaDias: 0, cntDias: 0 }
    anaRaw[k].ingresados++
    if (CERRADOS.includes(r.estado)) {
      anaRaw[k].resueltos++
      const dias = (new Date(r.updatedAt) - new Date(r.createdAt)) / 86_400_000
      anaRaw[k].sumaDias += dias
      anaRaw[k].cntDias++
    }
  }
  const analisis = Object.entries(anaRaw).map(([nombre, d]) => ({
    nombre, color: d.color,
    ingresados:  d.ingresados,
    resueltos:   d.resueltos,
    sinResolver: d.ingresados - d.resueltos,
    tasa:        d.ingresados > 0 ? Math.round(d.resueltos / d.ingresados * 100) : 0,
    diasPromedio: d.cntDias > 0 ? +(d.sumaDias / d.cntDias).toFixed(1) : 0,
  }))

  return NextResponse.json({
    total, totalHoy, cerrados, abiertos, tasa,
    sparkline, timeline, canales,
    categorias, equipos, tiempos, localidades, analisis,
    derivacion: {
      total,
      derivados: reclamos.filter(r => r.elevadoAt).length,
      resueltos: cerrados,
    },
  })
}
