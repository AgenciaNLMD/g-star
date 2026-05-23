import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  if (session.user.rol !== "admin") return { error: "Sin permiso", status: 403 }
  return { session }
}

export async function GET() {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre: "asc" },
  })
  return NextResponse.json(usuarios)
}

export async function POST(req) {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, email, rol, estado } = await req.json()
  if (!nombre?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 })
  }

  const existente = await prisma.usuario.findUnique({ where: { email } })
  if (existente) return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })

  const usuario = await prisma.usuario.create({
    data: {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol: rol ?? "operador",
      estado: estado ?? "activo",
    },
  })

  await prisma.logSistema.create({
    data: {
      usuarioId: check.session.user.id,
      accion: "crear_usuario",
      detalle: `Usuario creado: ${email}`,
    },
  })

  return NextResponse.json(usuario, { status: 201 })
}

export async function PUT(req) {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id, nombre, rol, estado } = await req.json()
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(rol    !== undefined && { rol }),
      ...(estado !== undefined && { estado }),
    },
  })

  await prisma.logSistema.create({
    data: {
      usuarioId: check.session.user.id,
      accion: "editar_usuario",
      detalle: `Usuario editado: ${id}`,
    },
  })

  return NextResponse.json(usuario)
}

export async function DELETE(req) {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  if (id === check.session.user.id) {
    return NextResponse.json({ error: "No podés eliminarte a vos mismo" }, { status: 400 })
  }

  await prisma.usuario.delete({ where: { id } })

  await prisma.logSistema.create({
    data: {
      usuarioId: check.session.user.id,
      accion: "eliminar_usuario",
      detalle: `Usuario eliminado: ${id}`,
    },
  })

  return NextResponse.json({ ok: true })
}
