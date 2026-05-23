import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = params

  const turno = await prisma.turno.findUnique({
    where: { id },
    include: {
      entidad: true,
      logs: {
        orderBy: { createdAt: "desc" },
        include: { usuario: { select: { nombre: true } } },
      },
    },
  })

  if (!turno) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json({
    ...turno,
    historial: turno.logs.map((l) => ({
      accion:  `→ ${l.estado}`,
      detalle: l.observaciones,
      usuario: l.usuario?.nombre,
      fecha:   l.createdAt,
    })),
    logs: undefined,
  })
}

export async function PUT(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = params
  const body = await request.json()
  const { estado, fechaAsignada, horaAsignada, observacion } = body

  const turno = await prisma.turno.findUnique({ where: { id } })
  if (!turno) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const actualizado = await prisma.turno.update({
    where: { id },
    data: {
      ...(estado        && { estado }),
      ...(fechaAsignada !== undefined && {
        fechaAsignada: fechaAsignada ? new Date(fechaAsignada) : null,
      }),
      ...(horaAsignada !== undefined && { horaAsignada: horaAsignada || null }),
    },
  })

  await prisma.turnoLog.create({
    data: {
      turnoId:       id,
      usuarioId:     session.user.id,
      estado:        estado ?? turno.estado,
      fechaAsignada: fechaAsignada ? new Date(fechaAsignada) : undefined,
      horaAsignada:  horaAsignada  ?? undefined,
      observaciones: observacion   ?? undefined,
    },
  })

  await prisma.logSistema.create({
    data: {
      usuarioId: session.user.id,
      accion:  "EDITAR",
      modulo:  "turnos",
      detalle: `Turno ${id}: ${turno.estado} → ${estado ?? turno.estado}`,
    },
  }).catch(() => {})

  return NextResponse.json(actualizado)
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = params

  const turno = await prisma.turno.findUnique({ where: { id } })
  if (!turno) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.turno.delete({ where: { id } })

  await prisma.logSistema.create({
    data: {
      usuarioId: session.user.id,
      accion:  "ELIMINAR",
      modulo:  "turnos",
      detalle: `Turno ${id} (${turno.nombre}) eliminado`,
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
