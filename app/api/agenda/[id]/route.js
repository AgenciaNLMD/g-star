import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function GET(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const evento = await prisma.agenda.findUnique({
    where: { id: params.id },
    include: { usuario: { select: { id: true, nombre: true } } },
  })
  if (!evento) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json(evento)
}

export async function PUT(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.agenda.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  if (existing.usuarioId !== check.session.user.id && check.session.user.rol !== "admin") {
    return NextResponse.json({ error: "Sin permiso para editar este evento" }, { status: 403 })
  }

  const { titulo, descripcion, tipo, fecha, hora, todo_dia } = await req.json()

  const evento = await prisma.agenda.update({
    where: { id: params.id },
    data: {
      ...(titulo      !== undefined && { titulo: titulo.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
      ...(tipo        !== undefined && { tipo }),
      ...(fecha       !== undefined && { fecha: new Date(fecha) }),
      ...(todo_dia    !== undefined && { todo_dia }),
      hora: todo_dia ? null : (hora || null),
    },
  })

  return NextResponse.json(evento)
}

export async function DELETE(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.agenda.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  if (existing.usuarioId !== check.session.user.id && check.session.user.rol !== "admin") {
    return NextResponse.json({ error: "Sin permiso para eliminar este evento" }, { status: 403 })
  }

  await prisma.agenda.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
