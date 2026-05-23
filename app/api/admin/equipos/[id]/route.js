import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = params
  const body = await request.json()
  const { nombre, descripcion, color, activo, miembros } = body

  const equipo = await prisma.equipo.findUnique({ where: { id } })
  if (!equipo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Reemplaza todos los miembros si se envía el array
  if (miembros !== undefined) {
    await prisma.equipoMiembro.deleteMany({ where: { equipoId: id } })
    if (miembros.length > 0) {
      await prisma.equipoMiembro.createMany({
        data: miembros.map(({ usuarioId, rol }) => ({
          equipoId:  id,
          usuarioId,
          rol:       rol ?? "miembro",
        })),
      })
    }
  }

  const actualizado = await prisma.equipo.update({
    where: { id },
    data: {
      ...(nombre      !== undefined && { nombre:      nombre.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion?.trim() ?? null }),
      ...(color       !== undefined && { color }),
      ...(activo      !== undefined && { activo }),
    },
    include: {
      miembros: {
        include: { usuario: { select: { id: true, nombre: true, email: true, image: true, rol: true } } },
      },
    },
  })

  return NextResponse.json(actualizado)
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = params
  const equipo = await prisma.equipo.findUnique({ where: { id } })
  if (!equipo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.equipo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
