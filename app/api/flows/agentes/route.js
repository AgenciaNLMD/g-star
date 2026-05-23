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

  const agentes = await prisma.flowAgente.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(agentes)
}

export async function POST(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, proveedor, modelo, sistemaPrompt, conocimiento, keywords, herramientas, esOrquestador, activo } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: "nombre es requerido" }, { status: 400 })
  if (!sistemaPrompt?.trim()) return NextResponse.json({ error: "sistemaPrompt es requerido" }, { status: 400 })

  const agente = await prisma.flowAgente.create({
    data: {
      nombre:        nombre.trim(),
      proveedor:     proveedor ?? "anthropic",
      modelo:        modelo ?? null,
      sistemaPrompt: sistemaPrompt.trim(),
      conocimiento:   conocimiento ?? null,
      keywords:       keywords ?? null,
      herramientas:   herramientas ?? [],
      esOrquestador:  esOrquestador ?? false,
      activo:         activo ?? true,
    },
  })
  return NextResponse.json(agente, { status: 201 })
}
