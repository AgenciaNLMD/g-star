import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function PUT(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.flowCampo.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const { tipo, descripcion, valorDefault } = await req.json()
  const campo = await prisma.flowCampo.update({
    where: { id: params.id },
    data: {
      ...(tipo         !== undefined && { tipo }),
      ...(descripcion  !== undefined && { descripcion }),
      ...(valorDefault !== undefined && { valorDefault }),
    },
  })
  return NextResponse.json(campo)
}

export async function DELETE(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const existing = await prisma.flowCampo.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.flowCampo.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
