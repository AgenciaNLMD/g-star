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

  const conv = await prisma.eapiConversacion.findUnique({
    where: { id: params.id },
    include: { mensajes: { orderBy: { createdAt: "asc" } } },
  })
  if (!conv) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const contacto = await prisma.eapiContacto.findUnique({
    where: { telefono: conv.contactoTel },
    select: { flujoActual: true, flujoPaso: true, modoBot: true, resumen: true, createdAt: true },
  })

  await prisma.eapiConversacion.update({
    where: { id: params.id },
    data: { noLeidos: 0 },
  })

  return NextResponse.json({ ...conv, contacto: contacto ?? null })
}
