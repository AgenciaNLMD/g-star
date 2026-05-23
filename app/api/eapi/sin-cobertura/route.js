import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"

export async function GET(req) {
  const session = await getServerSession(authConfig)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const pagina   = Math.max(1, parseInt(searchParams.get("pagina") ?? "1"))
  const porPagina = 30
  const soloSinRevisar = searchParams.get("sinRevisar") === "true"

  const where = soloSinRevisar ? { revisada: false } : {}

  const [total, items] = await Promise.all([
    prisma.consultaSinCobertura.count({ where }),
    prisma.consultaSinCobertura.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:  (pagina - 1) * porPagina,
      take:  porPagina,
    }),
  ])

  return NextResponse.json({ items, total, pagina, paginas: Math.ceil(total / porPagina) })
}
