import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function POST(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { conversacionId, texto } = await req.json()
  if (!conversacionId || !texto?.trim()) {
    return NextResponse.json({ error: "conversacionId y texto son requeridos" }, { status: 400 })
  }

  const conv = await prisma.eapiConversacion.findUnique({ where: { id: conversacionId } })
  if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const eapiUrl  = process.env.EVOLUTION_API_URL
  const eapiKey  = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE

  let estadoEnvio = "enviado"

  if (eapiUrl && eapiKey && instance) {
    try {
      const res = await fetch(`${eapiUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": eapiKey },
        body: JSON.stringify({ number: conv.contactoTel, text: texto.trim() }),
      })
      if (!res.ok) estadoEnvio = "error"
    } catch {
      estadoEnvio = "error"
    }
  }

  const mensaje = await prisma.eapiMensaje.create({
    data: {
      conversacionId,
      texto: texto.trim(),
      direccion: "saliente",
      estado: estadoEnvio,
      usuarioId: check.session.user.id,
    },
  })

  await prisma.eapiConversacion.update({
    where: { id: conversacionId },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(mensaje, { status: 201 })
}
