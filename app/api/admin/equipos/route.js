import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const equipos = await prisma.equipo.findMany({
    orderBy: { nombre: "asc" },
    include: {
      miembros: {
        include: { usuario: { select: { id: true, nombre: true, email: true, image: true, rol: true } } },
        orderBy: { rol: "asc" },
      },
    },
  })

  return NextResponse.json(equipos)
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await request.json()
  const { nombre, descripcion, color, miembros } = body

  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const equipo = await prisma.equipo.create({
    data: {
      nombre:      nombre.trim(),
      descripcion: descripcion?.trim() ?? null,
      color:       color ?? "#5C6E85",
      miembros: miembros?.length ? {
        create: miembros.map(({ usuarioId, rol }) => ({ usuarioId, rol: rol ?? "miembro" })),
      } : undefined,
    },
    include: {
      miembros: {
        include: { usuario: { select: { id: true, nombre: true, email: true, image: true, rol: true } } },
      },
    },
  })

  return NextResponse.json(equipo, { status: 201 })
}
