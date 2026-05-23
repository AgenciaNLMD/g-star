import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireSession() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  return { session }
}

export async function PATCH(req, { params }) {
  const check = await requireSession()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await req.json()

  // Reset estado del flow
  if (body.resetFlow === true) {
    const contacto = await prisma.eapiContacto.update({
      where: { telefono: params.tel },
      data: { flujoActual: null, flujoPaso: null },
    })
    return NextResponse.json(contacto)
  }

  const { modoBot } = body
  if (typeof modoBot !== "boolean") {
    return NextResponse.json({ error: "modoBot debe ser boolean" }, { status: 400 })
  }

  const contacto = await prisma.eapiContacto.update({
    where: { telefono: params.tel },
    data: { modoBot },
  })

  return NextResponse.json(contacto)
}
