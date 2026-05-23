import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Esta ruta maneja SOLO templates de eAPI.
// Los flows de conversación se movieron a /api/flows/[id]

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function PUT(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.eapiTemplate.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const { nombre, texto, categoria } = await req.json()
  const template = await prisma.eapiTemplate.update({
    where: { id: params.id },
    data: {
      ...(nombre    !== undefined && { nombre: nombre.trim() }),
      ...(texto     !== undefined && { texto: texto.trim() }),
      ...(categoria !== undefined && { categoria }),
    },
  })
  return NextResponse.json(template)
}

export async function DELETE(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.eapiTemplate.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.eapiTemplate.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
