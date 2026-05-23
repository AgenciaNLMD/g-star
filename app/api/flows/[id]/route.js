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

  const flow = await prisma.flow.findUnique({ where: { id: params.id } })
  if (!flow) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(flow)
}

export async function PUT(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.flow.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const { nombre, activo, nodos, triggerTipo, descripcion } = await req.json()
  const flow = await prisma.flow.update({
    where: { id: params.id },
    data: {
      ...(nombre      !== undefined && { nombre: nombre.trim() }),
      ...(activo      !== undefined && { activo }),
      ...(nodos       !== undefined && { nodos }),
      ...(triggerTipo !== undefined && { triggerTipo }),
      ...(descripcion !== undefined && { descripcion }),
    },
  })

  return NextResponse.json(flow)
}

export async function DELETE(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.flow.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.flow.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
