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

  const configs = await prisma.flowConfig.findMany({ orderBy: { proveedor: "asc" } })
  // Enmascarar la API key por seguridad
  const safe = configs.map((c) => ({
    ...c,
    apiKey: c.apiKey ? `${c.apiKey.slice(0, 6)}${"•".repeat(20)}` : "",
  }))
  return NextResponse.json(safe)
}

export async function POST(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { proveedor, apiKey, modelo, activo } = await req.json()
  if (!proveedor?.trim() || !apiKey?.trim()) {
    return NextResponse.json({ error: "Proveedor y API key son requeridos" }, { status: 400 })
  }

  // Si ya existe uno del mismo proveedor, actualizarlo
  const existing = await prisma.flowConfig.findFirst({ where: { proveedor: proveedor.trim() } })
  if (existing) {
    const config = await prisma.flowConfig.update({
      where: { id: existing.id },
      data: {
        apiKey:  apiKey.trim(),
        modelo:  modelo ?? null,
        activo:  activo ?? true,
      },
    })
    return NextResponse.json({ ...config, apiKey: `${config.apiKey.slice(0, 6)}${"•".repeat(20)}` })
  }

  const config = await prisma.flowConfig.create({
    data: {
      proveedor: proveedor.trim(),
      apiKey:    apiKey.trim(),
      modelo:    modelo ?? null,
      activo:    activo ?? true,
    },
  })
  return NextResponse.json({ ...config, apiKey: `${config.apiKey.slice(0, 6)}${"•".repeat(20)}` }, { status: 201 })
}

export async function DELETE(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  await prisma.flowConfig.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
