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

  const flows = await prisma.flow.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(flows)
}

export async function POST(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, activo, nodos, triggerTipo, descripcion } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const flow = await prisma.flow.create({
    data: {
      nombre:      nombre.trim(),
      activo:      activo ?? true,
      nodos:       nodos ?? {},
      triggerTipo: triggerTipo ?? "whatsapp_entrante",
      descripcion: descripcion ?? null,
    },
  })

  return NextResponse.json(flow, { status: 201 })
}
