import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function GET() {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const campos = await prisma.flowCampo.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(campos)
}

export async function POST(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, tipo, descripcion, valorDefault } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  // Validar que el nombre solo tenga letras, números y guión bajo
  if (!/^[a-z0-9_]+$/.test(nombre.trim())) {
    return NextResponse.json({ error: "El nombre solo puede tener letras minúsculas, números y guión bajo" }, { status: 400 })
  }

  try {
    const campo = await prisma.flowCampo.create({
      data: {
        nombre:       nombre.trim(),
        tipo:         tipo ?? "texto",
        descripcion:  descripcion ?? null,
        valorDefault: valorDefault ?? null,
      },
    })
    return NextResponse.json(campo, { status: 201 })
  } catch (e) {
    if (e.code === "P2002") return NextResponse.json({ error: "Ya existe un campo con ese nombre" }, { status: 409 })
    throw e
  }
}
