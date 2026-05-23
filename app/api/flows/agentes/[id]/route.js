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

  const { nombre, proveedor, modelo, sistemaPrompt, conocimiento, keywords, herramientas, esOrquestador, activo } = await req.json()

  const agente = await prisma.flowAgente.update({
    where: { id: params.id },
    data: {
      ...(nombre         !== undefined && { nombre:        nombre.trim()        }),
      ...(proveedor      !== undefined && { proveedor                           }),
      ...(modelo         !== undefined && { modelo                              }),
      ...(sistemaPrompt  !== undefined && { sistemaPrompt: sistemaPrompt.trim() }),
      ...(conocimiento   !== undefined && { conocimiento                        }),
      ...(keywords       !== undefined && { keywords                            }),
      ...(herramientas   !== undefined && { herramientas                        }),
      ...(esOrquestador  !== undefined && { esOrquestador                       }),
      ...(activo         !== undefined && { activo                              }),
    },
  })
  return NextResponse.json(agente)
}

export async function DELETE(_, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  await prisma.flowAgente.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
