import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)

  if (searchParams.get("solo") === "entidades") {
    const [entidades, feriados, cntPedido, cntAsignado] = await Promise.all([
      prisma.entidad.findMany({ orderBy: [{ nombre: "asc" }, { localidad: "asc" }] }),
      prisma.miscelanea.findMany({ where: { tipo: "feriado" }, select: { fecha: true } }),
      prisma.turno.groupBy({
        by: ["entidadId"],
        where: { estado: { in: ["pedido", "pendiente"] } },
        _count: { id: true },
      }),
      prisma.turno.groupBy({
        by: ["entidadId"],
        where: { estado: { in: ["asignado", "confirmado"] } },
        _count: { id: true },
      }),
    ])

    const pedidoMap   = Object.fromEntries(cntPedido.map((r) => [r.entidadId, r._count.id]))
    const asignadoMap = Object.fromEntries(cntAsignado.map((r) => [r.entidadId, r._count.id]))

    return NextResponse.json({
      entidades: entidades.map((e) => ({
        ...e,
        turnosPedidos:   pedidoMap[e.id]   ?? 0,
        turnosAsignados: asignadoMap[e.id] ?? 0,
      })),
      feriados: feriados.map((f) => f.fecha.toISOString().slice(0, 10)),
    })
  }

  const entidadId = searchParams.get("entidadId") || undefined
  const estado    = searchParams.get("estado")    || undefined
  const fechaStr  = searchParams.get("fecha")     || undefined

  const where = {
    ...(entidadId && { entidadId }),
    ...(estado    && { estado }),
    ...(fechaStr  && {
      fechaAsignada: {
        gte: new Date(fechaStr),
        lt:  new Date(fechaStr + "T23:59:59"),
      },
    }),
  }

  const turnos = await prisma.turno.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      entidad: { select: { nombre: true, localidad: true } },
    },
  })

  return NextResponse.json(turnos)
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const { nombre, dni, telefono, tramite, entidadId, sucursal, fechaSolicitada } = body

  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
  if (!entidadId)      return NextResponse.json({ error: "La entidad es requerida" }, { status: 400 })

  const entidad = await prisma.entidad.findUnique({ where: { id: entidadId } })
  if (!entidad) return NextResponse.json({ error: "Entidad no encontrada" }, { status: 404 })

  const turno = await prisma.turno.create({
    data: {
      entidadId,
      nombre:          nombre.trim(),
      dni:             dni?.trim()       ?? "",
      telefono:        telefono?.trim()  ?? "",
      tramite:         tramite?.trim()   ?? "Trámite general",
      sucursal:        sucursal?.trim()  ?? "",
      estado:          "pendiente",
      fechaSolicitada: fechaSolicitada ? new Date(fechaSolicitada) : null,
    },
  })

  await prisma.turnoLog.create({
    data: {
      turnoId:      turno.id,
      usuarioId:    session.user.id,
      estado:       "pendiente",
      observaciones: `Creado por ${session.user.name ?? session.user.email}`,
    },
  })

  await prisma.logSistema.create({
    data: {
      usuarioId: session.user.id,
      accion:  "CREAR",
      modulo:  "turnos",
      detalle: `Turno para ${nombre} — ${entidad.nombre}`,
    },
  }).catch(() => {})

  return NextResponse.json(turno, { status: 201 })
}
