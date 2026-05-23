import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function GET(req) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const conversaciones = await prisma.eapiConversacion.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      mensajes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { texto: true, createdAt: true, direccion: true },
      },
    },
  })

  const telefonos = conversaciones.map((c) => c.contactoTel)
  const contactos = await prisma.eapiContacto.findMany({
    where: { telefono: { in: telefonos } },
    select: { telefono: true, flujoActual: true, flujoPaso: true, modoBot: true },
  })
  const contactoMap = Object.fromEntries(contactos.map((c) => [c.telefono, c]))

  const resultado = conversaciones.map((c) => ({
    ...c,
    ultimoMensaje: c.mensajes[0]?.texto ?? null,
    ultimoMensajeDireccion: c.mensajes[0]?.direccion ?? null,
    mensajes: undefined,
    flujoActual: contactoMap[c.contactoTel]?.flujoActual ?? null,
    flujoPaso:   contactoMap[c.contactoTel]?.flujoPaso ?? null,
    modoBot:     contactoMap[c.contactoTel]?.modoBot ?? true,
  }))

  return NextResponse.json(resultado)
}
