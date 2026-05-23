import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Marcar como revisada
export async function PATCH(req, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.consultaSinCobertura.update({
    where: { id },
    data:  { revisada: true },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.consultaSinCobertura.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
