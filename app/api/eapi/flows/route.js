import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Esta ruta maneja SOLO templates de eAPI.
// Los flows de conversación se movieron a /api/flows/

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function GET(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const templates = await prisma.eapiTemplate.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(templates)
}

export async function POST(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, texto, categoria } = await req.json()
  if (!nombre?.trim() || !texto?.trim()) {
    return NextResponse.json({ error: "Nombre y texto requeridos" }, { status: 400 })
  }

  const template = await prisma.eapiTemplate.create({
    data: { nombre: nombre.trim(), texto: texto.trim(), categoria: categoria ?? "otro" },
  })
  return NextResponse.json(template, { status: 201 })
}
