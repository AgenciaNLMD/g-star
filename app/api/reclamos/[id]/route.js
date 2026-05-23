import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = params

  const reclamo = await prisma.reclamo.findUnique({
    where: { id },
    include: {
      adjuntos:  true,
      equipo:    { select: { id: true, nombre: true, color: true } },
      tomadoPor: { select: { id: true, nombre: true, image: true } },
      elevadoPor: { select: { id: true, nombre: true } },
      logs: {
        orderBy: { createdAt: "asc" },
        include: { usuario: { select: { nombre: true, image: true } } },
      },
    },
  })

  if (!reclamo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json({
    ...reclamo,
    historial: reclamo.logs.map((l) => ({
      accion:   l.accion,
      detalle:  l.detalle,
      usuario:  l.usuario?.nombre,
      avatar:   l.usuario?.image,
      fecha:    l.createdAt,
    })),
  })
}

// Transiciones válidas por estado actual
const TRANSICIONES = {
  entrante:   ["tomado", "cerrado"],
  tomado:     ["elevado", "en_proceso", "resuelto", "cerrado"],
  elevado:    ["en_proceso", "resuelto", "cerrado"],
  en_proceso: ["resuelto", "cerrado"],
  resuelto:   ["cerrado"],
  cerrado:    [],
}

export async function PUT(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = params
  const body = await request.json()
  const { accion, estado, etiqueta, notas, equipoId, areaDestinataria } = body

  const reclamo = await prisma.reclamo.findUnique({ where: { id } })
  if (!reclamo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const data = {}
  let logAccion  = ""
  let logDetalle = notas ?? ""

  if (accion === "tomar") {
    const permitido = TRANSICIONES[reclamo.estado]?.includes("tomado")
    if (!permitido) return NextResponse.json({ error: "Transición no permitida" }, { status: 400 })
    data.estado      = "tomado"
    data.tomadoPorId = session.user.id
    data.tomadoAt    = new Date()
    if (equipoId) data.equipoId = equipoId
    logAccion  = `Reclamo tomado por ${session.user.name ?? session.user.email}`
    logDetalle = equipoId ? `Equipo asignado` : ""
  } else if (accion === "elevar") {
    const permitido = TRANSICIONES[reclamo.estado]?.includes("elevado")
    if (!permitido) return NextResponse.json({ error: "Transición no permitida" }, { status: 400 })
    if (!areaDestinataria?.trim()) {
      return NextResponse.json({ error: "El área de destino es requerida" }, { status: 400 })
    }
    data.estado          = "elevado"
    data.elevadoPorId    = session.user.id
    data.elevadoAt       = new Date()
    data.areaDestinataria = areaDestinataria.trim()
    logAccion  = `Elevado al área: ${areaDestinataria.trim()}`
    logDetalle = notas ?? ""
  } else if (estado) {
    const permitido = TRANSICIONES[reclamo.estado]?.includes(estado)
    if (!permitido && session.user.rol !== "admin") {
      return NextResponse.json({ error: "Transición no permitida" }, { status: 400 })
    }
    data.estado = estado
    logAccion   = `Cambio de estado: ${reclamo.estado} → ${estado}`
    logDetalle  = notas ?? ""
  } else if (etiqueta) {
    data.etiqueta = etiqueta
    logAccion     = `Etiqueta actualizada: ${etiqueta}`
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 })
  }

  const actualizado = await prisma.reclamo.update({ where: { id }, data })

  if (logAccion) {
    await prisma.reclamoLog.create({
      data: {
        reclamoId: id,
        usuarioId: session.user.id,
        accion:    logAccion,
        detalle:   logDetalle,
      },
    })
  }

  await prisma.logSistema.create({
    data: {
      usuarioId: session.user.id,
      accion:    "EDITAR",
      modulo:    "reclamos",
      detalle:   `Reclamo #${reclamo.numero}: ${logAccion}`,
    },
  }).catch(() => {})

  return NextResponse.json(actualizado)
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = params
  const reclamo = await prisma.reclamo.findUnique({ where: { id } })
  if (!reclamo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.reclamo.delete({ where: { id } })

  await prisma.logSistema.create({
    data: {
      usuarioId: session.user.id,
      accion:    "ELIMINAR",
      modulo:    "reclamos",
      detalle:   `Reclamo #${reclamo.numero} eliminado`,
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
