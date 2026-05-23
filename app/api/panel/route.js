import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function getInicioPeriodo(periodo) {
  const ahora = new Date()
  switch (periodo) {
    case "7d":        return new Date(ahora - 7  * 86_400_000)
    case "30d":       return new Date(ahora - 30 * 86_400_000)
    case "trimestre": return new Date(ahora - 90 * 86_400_000)
    default:          return new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  }
}

function buildTimeline(registros, periodo) {
  const ahora = new Date()
  if (periodo === "trimestre") {
    return Array.from({ length: 13 }, (_, i) => {
      const iniSem = new Date(ahora)
      iniSem.setDate(ahora.getDate() - (12 - i) * 7)
      iniSem.setHours(0, 0, 0, 0)
      const finSem = new Date(iniSem.getTime() + 7 * 86_400_000)
      return {
        fecha: `${iniSem.getDate()}/${iniSem.getMonth() + 1}`,
        total: registros.filter(r => r.createdAt >= iniSem && r.createdAt < finSem).length,
      }
    })
  }
  const dias = periodo === "7d" ? 7 : 30
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(ahora)
    d.setDate(ahora.getDate() - (dias - 1 - i))
    d.setHours(0, 0, 0, 0)
    const siguiente = new Date(d.getTime() + 86_400_000)
    return {
      fecha: `${d.getDate()}/${d.getMonth() + 1}`,
      total: registros.filter(r => r.createdAt >= d && r.createdAt < siguiente).length,
    }
  })
}

export async function GET(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const periodo   = searchParams.get("periodo")   ?? "mes"
  const entidadId = searchParams.get("entidadId") ?? null

  const ahora         = new Date()
  const inicioDia     = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const finDia        = new Date(inicioDia.getTime() + 86_400_000)
  const inicioPeriodo = getInicioPeriodo(periodo)

  const [
    reclamosPendientes,
    reclamosEnProceso,
    reclamosHoy,
    turnosHoy,
    actividad,
    entidades,
    reclamosRecientes,
  ] = await Promise.all([
    prisma.reclamo.count({
      where: { estado: { in: ["pendiente", "en_proceso"] } },
    }),
    prisma.reclamo.count({
      where: { estado: "en_proceso" },
    }),
    prisma.reclamo.count({
      where: { createdAt: { gte: inicioDia, lt: finDia } },
    }),
    prisma.turnoLog.count({
      where: { estado: "asignado", fechaAsignada: { gte: inicioDia, lt: finDia } },
    }),
    prisma.logSistema.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        accion: true, modulo: true, detalle: true, createdAt: true,
        usuario: { select: { nombre: true } },
      },
    }),
    prisma.entidad.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.reclamo.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { numero: true, asunto: true, estado: true, canal: true, createdAt: true },
    }),
  ])

  let mensajesSinResponder = 0
  try {
    mensajesSinResponder = await prisma.eapiConversacion.count({
      where: { noLeidos: { gt: 0 } },
    })
  } catch { /* tabla opcional */ }

  const reclamosDelPeriodo = await prisma.reclamo.findMany({
    where: { createdAt: { gte: inicioPeriodo } },
    select: {
      estado:    true,
      createdAt: true,
      categoria: { select: { nombre: true } },
    },
  })

  const reclamosPorEstado = reclamosDelPeriodo.reduce((acc, r) => {
    acc[r.estado] = (acc[r.estado] ?? 0) + 1
    return acc
  }, {})

  const reclamosPorCategoriaMap = reclamosDelPeriodo.reduce((acc, r) => {
    const nombre = r.categoria?.nombre ?? "Sin categoría"
    acc[nombre] = (acc[nombre] ?? 0) + 1
    return acc
  }, {})

  const reclamosPorCategoria = Object.entries(reclamosPorCategoriaMap)
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const reclamosTimeline = buildTimeline(reclamosDelPeriodo, periodo)

  const turnosDelPeriodo = await prisma.turno.findMany({
    where: {
      createdAt: { gte: inicioPeriodo },
      ...(entidadId ? { entidadId } : {}),
    },
    select: {
      estado:    true,
      createdAt: true,
      entidadId: true,
      entidad:   { select: { nombre: true } },
    },
  })

  const turnosPorEstado = turnosDelPeriodo.reduce((acc, t) => {
    acc[t.estado] = (acc[t.estado] ?? 0) + 1
    return acc
  }, {})

  const turnosPorEntidad = turnosDelPeriodo.reduce((acc, t) => {
    const nombre = t.entidad?.nombre ?? "Sin entidad"
    if (!acc[nombre]) {
      acc[nombre] = { pendiente: 0, asignado: 0, confirmado: 0, completado: 0, cancelado: 0, ausente: 0, total: 0 }
    }
    acc[nombre][t.estado] = (acc[nombre][t.estado] ?? 0) + 1
    acc[nombre].total += 1
    return acc
  }, {})

  const turnosTimeline = buildTimeline(turnosDelPeriodo, periodo)

  const totalTurnos       = turnosDelPeriodo.length
  const turnosCompletados = turnosPorEstado.completado ?? 0
  const turnosAusentes    = turnosPorEstado.ausente    ?? 0

  return NextResponse.json({
    kpis: {
      reclamosPendientes,
      reclamosEnProceso,
      reclamosHoy,
      reclamosResueltos:  reclamosPorEstado.resuelto ?? 0,
      totalReclamos:      reclamosDelPeriodo.length,
      turnosHoy,
      mensajesSinResponder,
      totalTurnos,
      turnosCompletados,
      turnosAusentes,
      turnosPendientes:   turnosPorEstado.pendiente ?? 0,
    },
    reclamosPorEstado,
    reclamosPorCategoria,
    reclamosTimeline,
    turnosPorEstado,
    turnosPorEntidad,
    turnosTimeline,
    entidades,
    reclamosRecientes,
    actividad: actividad.map((l) => ({
      usuario: l.usuario?.nombre ?? "Sistema",
      accion:  l.accion,
      modulo:  l.modulo,
      detalle: l.detalle,
      fecha:   l.createdAt,
    })),
  })
}
