import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function GET(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  const where = {}
  if (desde || hasta) {
    where.fecha = {}
    if (desde) where.fecha.gte = new Date(desde)
    if (hasta) where.fecha.lte = new Date(hasta)
  }

  const eventos = await prisma.agenda.findMany({
    where,
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    include: { usuario: { select: { id: true, nombre: true } } },
  })

  return NextResponse.json(eventos)
}

export async function POST(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { titulo, descripcion, tipo, fecha, hora, todo_dia } = await req.json()
  if (!titulo?.trim()) return NextResponse.json({ error: "El título es requerido" }, { status: 400 })
  if (!fecha) return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 })

  const evento = await prisma.agenda.create({
    data: {
      titulo:      titulo.trim(),
      descripcion: descripcion?.trim() || null,
      tipo:        tipo ?? "evento",
      fecha:       new Date(fecha),
      hora:        todo_dia ? null : (hora || null),
      todo_dia:    todo_dia ?? false,
      usuarioId:   check.session.user.id,
    },
  })

  return NextResponse.json(evento, { status: 201 })
}
